import prisma from '@/lib/prisma';

export function formatarCnpj(cnpj?: string | null): string {
  if (!cnpj) return '';
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length === 14) {
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  return cnpj;
}

export async function syncContratoClimaFromSgc() {
  const sgcUrl = process.env.SGC_URL || 'http://localhost:3000';
  const serviceKey = process.env.PROAD_SERVICE_KEY || 'proad_interop_internal_service_key_2026_uern';

  let sgcAlvo: any = null;
  let itensDb: any[] = [];
  let responsaveisDb: any[] = [];
  let sourceMode = 'HTTP_API';

  // 1. Tenta sincronizar via API HTTP do SGC
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${sgcUrl}/api/integracao/manutencao/contratos?tipo=CLIMATIZACAO`, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const contratos = data.contratos || [];
      if (contratos.length > 0) {
        sgcAlvo = contratos.find((c: any) =>
          (c.objeto && (
            c.objeto.toLowerCase().includes('climatiza') ||
            c.objeto.toLowerCase().includes('refrigera') ||
            c.objeto.toLowerCase().includes('ar condicionado') ||
            c.objeto.toLowerCase().includes('ar-condicionado')
          )) ||
          (c.numeroContrato && (c.numeroContrato.includes('11/2026') || c.numeroContrato.includes('11')))
        ) || contratos[0];

        if (sgcAlvo?.itens) {
          itensDb = sgcAlvo.itens.map((it: any) => ({
            id: it.id,
            numeroItem: it.numeroItem,
            descricao: it.descricao,
            unidade: it.unidadeMedida || it.unidade,
            valorUnitarioAtual: it.valorUnitario,
            quantidadeAtual: it.saldoQuantidade,
            cidade: it.cidade || `ITEM-${it.numeroItem}`,
          }));
        }

        if (sgcAlvo?.responsaveis) {
          responsaveisDb = sgcAlvo.responsaveis;
        }
      }
    }
  } catch (err: any) {
    console.info('[SGC_SYNC] HTTP SGC indisponível, usando fallback de banco direto:', err?.message || err);
  }

  // 2. Se a API HTTP falhou ou não retornou dados, consulta diretamente o PostgreSQL (mesma instância Neon)
  if (!sgcAlvo) {
    sourceMode = 'DATABASE_DIRECT';
    try {
      const contratosDb: any[] = await prisma.$queryRaw`
        SELECT c.id, c."numeroContrato", c.objeto, c."processoSeiMae", c."valorGlobal", c."valorAtualizado", c."vigenciaInicio", c."vigenciaFim", c.status,
               f.id as "fornecedorId", f."razaoSocial", f."nomeFantasia", f.cnpj, f.telefone, f.email, f."nomePreposto", f."telefonePreposto", f."emailPreposto"
        FROM public.contratos c
        LEFT JOIN public.fornecedores f ON c."fornecedorId" = f.id
        WHERE c.status = 'ATIVO' AND (
          LOWER(c.objeto) LIKE '%climatiza%' OR
          LOWER(c.objeto) LIKE '%refrigera%' OR
          LOWER(c.objeto) LIKE '%ar condicionado%' OR
          c."numeroContrato" LIKE '%11/2026%'
        )
        ORDER BY c."vigenciaFim" DESC
      `;

      if (contratosDb.length > 0) {
        const raw = contratosDb[0];
        sgcAlvo = {
          id: raw.id,
          numeroContrato: raw.numeroContrato,
          objeto: raw.objeto,
          processoSeiMae: raw.processoSeiMae,
          valorGlobal: Number(raw.valorGlobal || 1166605.42),
          valorAtualizado: Number(raw.valorAtualizado || raw.valorGlobal || 1166605.42),
          vigenciaInicio: raw.vigenciaInicio,
          vigenciaFim: raw.vigenciaFim,
          fornecedor: {
            cnpj: raw.cnpj,
            razaoSocial: raw.razaoSocial,
            nomeFantasia: raw.nomeFantasia,
            telefone: raw.telefone || raw.telefonePreposto,
            email: raw.email || raw.emailPreposto,
            nomePreposto: raw.nomePreposto,
            telefonePreposto: raw.telefonePreposto,
            emailPreposto: raw.emailPreposto,
          },
        };

        const rawItens: any[] = await prisma.$queryRaw`
          SELECT id, "numeroItem", descricao, unidade, "valorUnitarioAtual", "quantidadeAtual", "valorTotalAtual", cidade
          FROM public.contrato_itens
          WHERE "contratoId" = ${sgcAlvo.id}
          ORDER BY "numeroItem" ASC
        `;
        itensDb = rawItens;

        const rawResponsaveis: any[] = await prisma.$queryRaw`
          SELECT r.id, r."tipoAtuacao", r."numeroAtoDesignacao", r."idSeiAtoDesignacao", r."campusSetor",
                 u.nome, u.email, u.matricula, u.role
          FROM public.contrato_responsaveis r
          JOIN public.usuarios u ON r."userId" = u.id
          WHERE r."contratoId" = ${sgcAlvo.id} AND r.ativo = true
        `;
        responsaveisDb = rawResponsaveis;
      }
    } catch (dbErr: any) {
      console.error('[SGC_SYNC_ERROR] Falha ao consultar contratos no banco público do SGC:', dbErr);
    }
  }

  if (!sgcAlvo) {
    throw new Error('Nenhum contrato ativo de climatização encontrado no SGC (HTTP e Banco Direto).');
  }

  // 3. Garante cadastro da Empresa Prestadora no schema de Climatização
  const rawCnpj = sgcAlvo.fornecedor?.cnpj || '63034369000135';
  const cnpjFormatado = formatarCnpj(rawCnpj);

  let empresa = await prisma.empresa.findFirst({
    where: {
      OR: [
        { cnpj: cnpjFormatado },
        { cnpj: rawCnpj },
      ],
    },
  });

  const dadosEmpresa = {
    cnpj: cnpjFormatado,
    razaoSocial: sgcAlvo.fornecedor?.razaoSocial || 'L O DOS SANTOS ECOMSER',
    nomeFantasia: sgcAlvo.fornecedor?.nomeFantasia || 'L O DOS SANTOS ECOMSER',
    telefone: sgcAlvo.fornecedor?.telefone || sgcAlvo.fornecedor?.telefonePreposto || '(84) 921685387',
    email: sgcAlvo.fornecedor?.email || sgcAlvo.fornecedor?.emailPreposto || 'ebenezerecomser@gmail.com',
  };

  if (!empresa) {
    empresa = await prisma.empresa.create({ data: dadosEmpresa });
  } else {
    empresa = await prisma.empresa.update({
      where: { id: empresa.id },
      data: dadosEmpresa,
    });
  }

  // 4. Cria ou atualiza usuário do PREPOSTO DA EMPRESA (Puxado do SGC)
  const prepostoNome = sgcAlvo.fornecedor?.nomePreposto || 'Josemildo';
  const prepostoEmail = sgcAlvo.fornecedor?.emailPreposto || sgcAlvo.fornecedor?.email || 'ebenezerecomser@gmail.com';

  const prepostoUsuario = await prisma.usuario.upsert({
    where: { email: prepostoEmail },
    update: {
      nome: `${prepostoNome} (Preposto • ${empresa.razaoSocial})`,
      empresaId: empresa.id,
      role: 'EMPRESA',
      ativo: true,
    },
    create: {
      nome: `${prepostoNome} (Preposto • ${empresa.razaoSocial})`,
      email: prepostoEmail,
      cpf: '630.343.690-01',
      role: 'EMPRESA',
      empresaId: empresa.id,
      ativo: true,
    },
  });

  // 5. Sincroniza a Equipe de Fiscalização do SGC (Fiscal Técnico, Gestor, Fiscal Adm)
  let fiscalTecnicoPrincipal: any = null;
  const equipeFiscalizacaoSgc: any[] = [];

  for (const resp of responsaveisDb) {
    equipeFiscalizacaoSgc.push({
      tipoAtuacao: resp.tipoAtuacao,
      nome: resp.nome,
      email: resp.email,
      matricula: resp.matricula,
      atoDesignacao: resp.numeroAtoDesignacao,
      idSei: resp.idSeiAtoDesignacao,
      campusSetor: resp.campusSetor,
    });

    if (resp.tipoAtuacao === 'FISCAL_TECNICO') {
      fiscalTecnicoPrincipal = resp;

      // Upsert do Fiscal Técnico Real no clima_usuarios
      await prisma.usuario.upsert({
        where: { email: resp.email },
        update: {
          nome: resp.nome.trim(),
          matricula: resp.matricula,
          role: 'FISCAL_TECNICO',
          ativo: true,
        },
        create: {
          nome: resp.nome.trim(),
          email: resp.email,
          cpf: '139.447.000-01',
          matricula: resp.matricula,
          role: 'FISCAL_TECNICO',
          ativo: true,
        },
      });
    } else if (resp.tipoAtuacao === 'GESTOR') {
      // Upsert do Gestor (Pedro Eloy) como ADMIN
      await prisma.usuario.upsert({
        where: { email: resp.email },
        update: {
          nome: resp.nome.trim(),
          matricula: resp.matricula,
          role: 'ADMIN',
          ativo: true,
        },
        create: {
          nome: resp.nome.trim(),
          email: resp.email,
          cpf: '127.574.000-01',
          matricula: resp.matricula,
          role: 'ADMIN',
          ativo: true,
        },
      });
    } else if (resp.tipoAtuacao === 'FISCAL_ADMINISTRATIVO') {
      await prisma.usuario.upsert({
        where: { email: resp.email },
        update: {
          nome: resp.nome.trim(),
          matricula: resp.matricula,
          role: 'FISCAL_ADM',
          ativo: true,
        },
        create: {
          nome: resp.nome.trim(),
          email: resp.email,
          cpf: '089.770.000-01',
          matricula: resp.matricula,
          role: 'FISCAL_ADM',
          ativo: true,
        },
      });
    }
  }

  // 6. Atualiza medições existentes para vincular o Fiscal Técnico Real
  if (fiscalTecnicoPrincipal) {
    const fiscalTecnicoDb = await prisma.usuario.findUnique({
      where: { email: fiscalTecnicoPrincipal.email },
    });

    if (fiscalTecnicoDb) {
      await prisma.medicaoMensal.updateMany({
        data: {
          fiscalTecnicoId: fiscalTecnicoDb.id,
          nomeFiscalTecnico: fiscalTecnicoDb.nome,
          matriculaFiscalTecnico: fiscalTecnicoDb.matricula,
        },
      });
    }
  }

  // 7. Desativa contratos antigos para garantir unicidade do contrato ativo
  await prisma.contratoClima.updateMany({
    where: { numeroContrato: { not: sgcAlvo.numeroContrato } },
    data: { isReferenciaAtiva: false },
  });

  // 8. Upsert do Contrato Vigente de Climatização (Ex: 11/2026)
  const valorGlobalFinal = Number(sgcAlvo.valorAtualizado || sgcAlvo.valorGlobal || 1166605.42);

  const contratoAtivo = await prisma.contratoClima.upsert({
    where: { numeroContrato: sgcAlvo.numeroContrato },
    update: {
      sgcContratoId: sgcAlvo.id,
      processoSeiMae: sgcAlvo.processoSeiMae || sgcAlvo.processoSei || '04410035.003671/2025-75',
      empresaId: empresa.id,
      valorGlobal: valorGlobalFinal,
      vigenciaInicio: new Date(sgcAlvo.vigenciaInicio),
      vigenciaFim: new Date(sgcAlvo.vigenciaFim),
      ativo: true,
      isReferenciaAtiva: true,
      autoSincronizadoEm: new Date(),
    },
    create: {
      numeroContrato: sgcAlvo.numeroContrato,
      sgcContratoId: sgcAlvo.id,
      processoSeiMae: sgcAlvo.processoSeiMae || sgcAlvo.processoSei || '04410035.003671/2025-75',
      empresaId: empresa.id,
      valorGlobal: valorGlobalFinal,
      saldoDisponivel: valorGlobalFinal,
      vigenciaInicio: new Date(sgcAlvo.vigenciaInicio),
      vigenciaFim: new Date(sgcAlvo.vigenciaFim),
      ativo: true,
      isReferenciaAtiva: true,
      prazoAtendimentoHorasRegular: 72,
      prazoAtendimentoHorasUrgente: 24,
      diasGarantiaPadrao: 90,
      diasPrazoAtesteDemandante: 5,
      autoSincronizadoEm: new Date(),
    },
    include: { empresa: true, itensPreco: true },
  });

  // 9. Sincroniza todos os itens de preços da planilha contratual
  if (itensDb && itensDb.length > 0) {
    for (const it of itensDb) {
      await prisma.itemContratoPreco.upsert({
        where: {
          contratoId_numeroItem: {
            contratoId: contratoAtivo.id,
            numeroItem: Number(it.numeroItem),
          },
        },
        update: {
          sgcItemId: it.id,
          codigo: it.cidade || `ITEM-${it.numeroItem}`,
          descricao: it.descricao,
          unidadeMedida: it.unidade || it.unidadeMedida || 'UNIDADE',
          valorUnitario: Number(it.valorUnitarioAtual || it.valorUnitario || 0),
          saldoQuantidade: Number(it.quantidadeAtual || it.saldoQuantidade || 0),
        },
        create: {
          contratoId: contratoAtivo.id,
          sgcItemId: it.id,
          numeroItem: Number(it.numeroItem),
          codigo: it.cidade || `ITEM-${it.numeroItem}`,
          descricao: it.descricao,
          unidadeMedida: it.unidade || it.unidadeMedida || 'UNIDADE',
          valorUnitario: Number(it.valorUnitarioAtual || it.valorUnitario || 0),
          saldoQuantidade: Number(it.quantidadeAtual || it.saldoQuantidade || 0),
        },
      });
    }
  }

  // 10. Re-vincula chamados abertos/em andamento para o contrato real
  await prisma.chamado.updateMany({
    where: { contratoId: { not: contratoAtivo.id } },
    data: {
      contratoId: contratoAtivo.id,
      empresaId: empresa.id,
    },
  });

  const totalItens = await prisma.itemContratoPreco.count({
    where: { contratoId: contratoAtivo.id },
  });

  return {
    success: true,
    sourceMode,
    contrato: {
      id: contratoAtivo.id,
      numeroContrato: contratoAtivo.numeroContrato,
      processoSeiMae: contratoAtivo.processoSeiMae,
      empresa: empresa.razaoSocial,
      cnpj: empresa.cnpj,
      valorGlobal: Number(contratoAtivo.valorGlobal),
      vigenciaInicio: contratoAtivo.vigenciaInicio,
      vigenciaFim: contratoAtivo.vigenciaFim,
      totalItens,
      autoSincronizadoEm: contratoAtivo.autoSincronizadoEm,
    },
    preposto: {
      nome: prepostoNome,
      email: prepostoEmail,
      telefone: sgcAlvo.fornecedor?.telefonePreposto,
    },
    fiscalTecnico: fiscalTecnicoPrincipal ? {
      nome: fiscalTecnicoPrincipal.nome,
      email: fiscalTecnicoPrincipal.email,
      matricula: fiscalTecnicoPrincipal.matricula,
      campusSetor: fiscalTecnicoPrincipal.campusSetor,
    } : null,
    equipeFiscalizacao: equipeFiscalizacaoSgc,
  };
}
