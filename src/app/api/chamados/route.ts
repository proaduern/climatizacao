import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusChamado, StatusEquipamento, CategoriaServico, SubtipoInstalacao, DefeitoCorretivaComum } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unidadeId = searchParams.get('unidadeId');
    const status = searchParams.get('status');
    const cidade = searchParams.get('cidade');
    const apenasPrioritarios = searchParams.get('prioritario');
    const q = searchParams.get('q');

    const where: any = {};
    if (unidadeId && unidadeId !== 'TODOS') where.unidadeId = unidadeId;
    if (status && status !== 'TODOS') where.status = status as StatusChamado;
    if (cidade && cidade !== 'TODOS') where.unidade = { cidade };
    if (apenasPrioritarios === 'true') where.isAmbientePrioritario = true;
    if (q) {
      where.OR = [
        { numeroProtocolo: { contains: q, mode: 'insensitive' } },
        { tituloDemanda: { contains: q, mode: 'insensitive' } },
        { descricaoGeral: { contains: q, mode: 'insensitive' } },
      ];
    }

    const chamados = await prisma.chamado.findMany({
      where,
      include: {
        unidade: { select: { id: true, sigla: true, nome: true, campus: true, cidade: true } },
        ambiente: { select: { id: true, tipo: true, descricaoDetalhe: true, bloco: true } },
        demandante: { select: { id: true, nome: true, email: true, matricula: true } },
        empresa: { select: { id: true, razaoSocial: true, nomeFantasia: true, telefone: true } },
        intervencoes: {
          include: {
            equipamento: true,
            tecnicoExecutor: true,
            itensOrcamento: {
              include: { itemPreco: true },
            },
          },
        },
        historicos: {
          orderBy: { criadoEm: 'asc' },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });

    const now = new Date();

    const formatados = chamados.map((ch) => {
      // SLA Restante
      const prazoLimite = ch.prazoLimiteAtendimento ? new Date(ch.prazoLimiteAtendimento) : null;
      const slaEmHorasRestantes = prazoLimite
        ? Math.round((prazoLimite.getTime() - now.getTime()) / (1000 * 3600))
        : null;

      // Prazo de Confirmação Tácita Restante (em dias)
      const dataLimiteConfirmacao = ch.dataLimiteConfirmacao ? new Date(ch.dataLimiteConfirmacao) : null;
      const diasRestantesAteste = dataLimiteConfirmacao
        ? Math.max(0, Math.ceil((dataLimiteConfirmacao.getTime() - now.getTime()) / (1000 * 3600 * 24)))
        : null;

      return {
        ...ch,
        orcamentoValorTotal: Number(ch.orcamentoValorTotal || 0),
        slaEmHorasRestantes,
        diasRestantesAteste,
        intervencoes: ch.intervencoes.map((it) => ({
          ...it,
          valorTotalIntervencao: Number(it.valorTotalIntervencao),
          itensOrcamento: it.itensOrcamento.map((orc) => ({
            ...orc,
            valorUnitarioContratual: Number(orc.valorUnitarioContratual),
            valorTotal: Number(orc.valorTotal),
          })),
        })),
      };
    });

    return NextResponse.json({ chamados: formatados });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      unidadeId,
      demandanteId,
      tituloDemanda,
      descricaoGeral,
      urgente, // boolean
      // Ambiente da Unidade (Existente ou On-the-Fly):
      ambienteId,
      novoAmbienteTipo,
      novoAmbienteDetalhe,
      novoAmbienteBloco,
      // Modo de Intervenção:
      // tipoFluxo: 'SIMPLES' | 'SUBSTITUICAO'
      tipoFluxo,
      // Se SIMPLES:
      equipamentoId,
      categoriaServico,
      subtipoInstalacao,
      defeitoComum,
      descricaoDefeito,
      // Se SUBSTITUICAO:
      maquinaAntigaId,
      maquinaNovaId,
      destinoMaquinaRetirada,
      subtipoInstalacaoNova,
    } = body;

    if (!unidadeId || !demandanteId || !tituloDemanda) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: Unidade, Demandante e Título da Demanda.' },
        { status: 400 }
      );
    }

    // 1. Obtém o Contrato Ativo
    const contratoAtivo = await prisma.contratoClima.findFirst({
      where: { isReferenciaAtiva: true, ativo: true },
      include: { empresa: true },
    });

    if (!contratoAtivo) {
      return NextResponse.json(
        { error: 'Não há contrato de manutenção ativo no sistema. Abertura suspensa.' },
        { status: 403 }
      );
    }

    // 2. Trava Anti-Duplicidade
    const maquinasParaChecar: string[] = [];
    if (tipoFluxo === 'SUBSTITUICAO') {
      if (maquinaAntigaId) maquinasParaChecar.push(maquinaAntigaId);
      if (maquinaNovaId) maquinasParaChecar.push(maquinaNovaId);
    } else {
      if (equipamentoId) maquinasParaChecar.push(equipamentoId);
    }

    if (maquinasParaChecar.length === 0) {
      return NextResponse.json({ error: 'Nenhum equipamento selecionado para a solicitação.' }, { status: 400 });
    }

    for (const mId of maquinasParaChecar) {
      const chamadoExistente = await prisma.chamado.findFirst({
        where: {
          status: { notIn: ['FINALIZADO', 'CANCELADO'] },
          intervencoes: { some: { equipamentoId: mId } },
        },
        include: { unidade: true },
      });

      if (chamadoExistente) {
        const eq = await prisma.equipamento.findUnique({ where: { id: mId } });
        return NextResponse.json(
          {
            error: `Bloqueio Anti-Duplicidade: O equipamento Tombo ${eq?.tombo || mId} já possui o chamado ${chamadoExistente.numeroProtocolo} em andamento.`,
            chamadoDuplicadoId: chamadoExistente.id,
            protocolo: chamadoExistente.numeroProtocolo,
          },
          { status: 409 }
        );
      }
    }

    // 3. Calcula SLAs e Protocolo Sequencial com proteção contra colisões (P2002) e exclusões
    const anoAtual = new Date().getFullYear();
    const slaHoras = urgente
      ? contratoAtivo.prazoAtendimentoHorasUrgente
      : contratoAtivo.prazoAtendimentoHorasRegular;

    const prazoLimiteAtendimento = new Date();
    prazoLimiteAtendimento.setHours(prazoLimiteAtendimento.getHours() + slaHoras);

    const prefixoAno = `CLIMA-${anoAtual}-`;
    let novoChamado: any = null;

    for (let tentativa = 0; tentativa < 4; tentativa++) {
      try {
        const ultimoDoAno = await prisma.chamado.findFirst({
          where: { numeroProtocolo: { startsWith: prefixoAno } },
          orderBy: { numeroProtocolo: 'desc' },
          select: { numeroProtocolo: true },
        });
        const ultimoSeq = ultimoDoAno?.numeroProtocolo
          ? parseInt(ultimoDoAno.numeroProtocolo.replace(prefixoAno, ''), 10) || 0
          : 0;
        const numeroProtocolo = `${prefixoAno}${String(ultimoSeq + 1 + tentativa).padStart(5, '0')}`;

        // 4. Criação atômica do Chamado, Intervenções e Timeline
        novoChamado = await prisma.$transaction(async (tx) => {
      // 4.1 Resolução de Ambiente da Unidade
      let finalAmbienteId = ambienteId || null;
      let finalTipoAmbiente: any = null;

      if (novoAmbienteDetalhe?.trim() && novoAmbienteTipo) {
        const ambUpsert = await tx.ambienteUnidade.upsert({
          where: {
            unidadeId_descricaoDetalhe: {
              unidadeId,
              descricaoDetalhe: novoAmbienteDetalhe.trim(),
            },
          },
          update: {
            tipo: novoAmbienteTipo,
            bloco: novoAmbienteBloco?.trim() || null,
            ativo: true,
          },
          create: {
            unidadeId,
            tipo: novoAmbienteTipo,
            descricaoDetalhe: novoAmbienteDetalhe.trim(),
            bloco: novoAmbienteBloco?.trim() || null,
          },
        });
        finalAmbienteId = ambUpsert.id;
        finalTipoAmbiente = ambUpsert.tipo;
      } else if (finalAmbienteId) {
        const ambExistente = await tx.ambienteUnidade.findUnique({
          where: { id: finalAmbienteId },
        });
        if (ambExistente) {
          finalTipoAmbiente = ambExistente.tipo;
        }
      } else {
        // Se não informado explicitamente, herda automaticamente o ambiente vinculado à máquina
        const alvoId = equipamentoId || maquinaAntigaId;
        if (alvoId) {
          const eqAlvo = await tx.equipamento.findUnique({
            where: { id: alvoId },
            include: { ambiente: true },
          });
          if (eqAlvo?.ambienteId && eqAlvo.ambiente) {
            finalAmbienteId = eqAlvo.ambienteId;
            finalTipoAmbiente = eqAlvo.ambiente.tipo;
          }
        }
      }

      const prioritarios = ['SALA_DE_AULA', 'LABORATORIO_PESQUISA_ININTERRUPTO', 'SALA_ESTUDOS_BIBLIOTECA'];
      const isAmbientePrioritario = finalTipoAmbiente ? prioritarios.includes(finalTipoAmbiente) : false;

      const chamado = await tx.chamado.create({
        data: {
          numeroProtocolo,
          unidadeId,
          demandanteId,
          contratoId: contratoAtivo.id,
          empresaId: contratoAtivo.empresaId,
          ambienteId: finalAmbienteId,
          tipoAmbiente: finalTipoAmbiente,
          isAmbientePrioritario,
          status: StatusChamado.ABERTO,
          percentualEvolucao: 15,
          etapaAtualDescricao: isAmbientePrioritario
            ? '🚨 Aberto (Prioridade Alta: Sala de Aula / Lab Ininterrupto / Sala de Estudos)'
            : 'Chamado Aberto - Aguardando Triagem pela Empresa',
          tituloDemanda: tituloDemanda.trim(),
          descricaoGeral: descricaoGeral?.trim() || '',
          prazoLimiteAtendimento,
        },
      });

      // Vincula ambiente ao equipamento para manter o histórico
      if (equipamentoId && finalAmbienteId) {
        await tx.equipamento.update({
          where: { id: equipamentoId },
          data: { ambienteId: finalAmbienteId },
        });
      }

      // Cria intervenções
      if (tipoFluxo === 'SUBSTITUICAO') {
        // Intervenção 1: Desinstalação da antiga
        if (maquinaAntigaId) {
          await tx.intervencaoItem.create({
            data: {
              chamadoId: chamado.id,
              equipamentoId: maquinaAntigaId,
              categoriaServico: CategoriaServico.DESINSTALACAO,
              destinoMaquinaRetirada: destinoMaquinaRetirada || 'DEPOSITO_UNIDADE',
              descricaoDefeito: 'Desinstalação para substituição por nova máquina.',
            },
          });

          await tx.equipamento.update({
            where: { id: maquinaAntigaId },
            data: { status: StatusEquipamento.EM_MANUTENCAO },
          });
        }

        // Intervenção 2: Instalação da nova
        if (maquinaNovaId) {
          await tx.intervencaoItem.create({
            data: {
              chamadoId: chamado.id,
              equipamentoId: maquinaNovaId,
              categoriaServico: CategoriaServico.INSTALACAO,
              subtipoInstalacao: subtipoInstalacaoNova || SubtipoInstalacao.SUBSTITUINDO_MAQUINA_EXISTENTE,
              maquinaSubstituidaId: maquinaAntigaId,
              diasGarantiaConcedida: contratoAtivo.diasGarantiaPadrao,
            },
          });

          await tx.equipamento.update({
            where: { id: maquinaNovaId },
            data: { status: StatusEquipamento.EM_MANUTENCAO },
          });
        }
      } else {
        // Intervenção Simples
        const eqDb = await tx.equipamento.findUnique({ where: { id: equipamentoId } });
        const emGarantia = eqDb?.emGarantiaAte && new Date(eqDb.emGarantiaAte) > new Date();

        await tx.intervencaoItem.create({
          data: {
            chamadoId: chamado.id,
            equipamentoId,
            categoriaServico: emGarantia ? CategoriaServico.REPARO_GARANTIA : (categoriaServico || CategoriaServico.MANUTENCAO_CORRETIVA),
            subtipoInstalacao: subtipoInstalacao || null,
            defeitoComum: defeitoComum || null,
            descricaoDefeito: descricaoDefeito || null,
            emGarantia: Boolean(emGarantia),
            diasGarantiaConcedida: contratoAtivo.diasGarantiaPadrao,
          },
        });

        await tx.equipamento.update({
          where: { id: equipamentoId },
          data: { status: StatusEquipamento.EM_MANUTENCAO },
        });
      }

      // Primeiro evento da Timeline
      const usuarioCriador = await tx.usuario.findUnique({ where: { id: demandanteId } });
      await tx.historicoChamado.create({
        data: {
          chamadoId: chamado.id,
          statusAnterior: null,
          statusNovo: StatusChamado.ABERTO,
          autorId: demandanteId,
          autorNome: usuarioCriador?.nome || 'Servidor Demandante',
          mensagem: `Chamado registrado com sucesso. SLA para atendimento: ${slaHoras} horas úteis.`,
        },
      });

      return chamado;
    }, { timeout: 15000 });
        break;
      } catch (txErr: any) {
        if (txErr?.code === 'P2002' && tentativa < 3) {
          continue;
        }
        throw txErr;
      }
    }

    return NextResponse.json({
      success: true,
      mensagem: `Chamado ${novoChamado.numeroProtocolo} registrado com sucesso!`,
      chamado: novoChamado,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
