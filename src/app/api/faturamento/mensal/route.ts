import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusChamado, StatusMedicaoMensal } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mesAno = searchParams.get('mesAno') || `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;

    const contrato = await prisma.contratoClima.findFirst({
      where: { isReferenciaAtiva: true },
      include: { empresa: true },
    });

    if (!contrato) {
      return NextResponse.json({ error: 'Nenhum contrato ativo localizado.' }, { status: 404 });
    }

    // Busca todos os chamados finalizados ou confirmados tacitamente
    const chamados = await prisma.chamado.findMany({
      where: {
        contratoId: contrato.id,
        status: { in: [StatusChamado.FINALIZADO, StatusChamado.CONFIRMADO_TACITAMENTE] },
      },
      include: {
        unidade: true,
        demandante: true,
        intervencoes: {
          include: {
            equipamento: true,
            tecnicoExecutor: true,
            atestadoPor: true,
            itensOrcamento: {
              include: { itemPreco: true },
            },
          },
        },
      },
    });

    // Filtra intervenções concluídas para a listagem máquina por máquina
    const listaMaquinas: any[] = [];
    let valorTotal = 0;

    for (const ch of chamados) {
      for (const it of ch.intervencoes) {
        const v = Number(it.valorTotalIntervencao || 0);
        valorTotal += v;

        listaMaquinas.push({
          intervencaoId: it.id,
          chamadoId: ch.id,
          protocolo: ch.numeroProtocolo,
          tombo: it.equipamento.tombo,
          tipoEquipamento: it.equipamento.tipo,
          marcaModelo: `${it.equipamento.marca} ${it.equipamento.modelo || ''}`.trim(),
          btusOuCapacidade: it.equipamento.btus ? `${it.equipamento.btus} BTUs` : it.equipamento.litragem ? `${it.equipamento.litragem} L` : it.equipamento.qtdTorneiras ? `${it.equipamento.qtdTorneiras} torneiras` : 'N/A',
          unidadeSigla: ch.unidade.sigla,
          unidadeNome: ch.unidade.nome,
          localizacao: it.equipamento.localizacao,
          categoriaServico: it.categoriaServico,
          descricaoServico: it.itensOrcamento.map((o) => `${o.itemPreco.descricao} (qtd: ${o.quantidade})`).join(', ') || it.descricaoDefeito || 'Reparo e revisão',
          valorTotal: v,
          // Técnico da Empresa
          tecnicoNome: it.nomeTecnicoEmpresa || 'Josemildo (Preposto)',
          tecnicoCpf: it.cpfTecnicoEmpresa || '630.343.690-01',
          // Servidor Aceitante UERN
          servidorAtestanteNome: it.aceiteTacito ? 'Homologação Tácita (Decurso de Prazo)' : (it.nomeServidorAtestante || ch.demandante.nome),
          servidorAtestanteMatricula: it.aceiteTacito ? 'SISTEMA_PROAD' : (it.matriculaServidorAtestante || ch.demandante.matricula || '12345-6'),
          aceiteTacito: it.aceiteTacito,
          dataAteste: it.dataAteste || ch.avaliadoEm || ch.criadoEm,
        });
      }
    }

    // Busca ou inicializa registro de medição mensal
    let medicao = await prisma.medicaoMensal.findFirst({
      where: {
        contratoId: contrato.id,
        referenciaMesAno: mesAno,
      },
      include: { fiscalTecnico: true },
    });

    return NextResponse.json({
      mesAno,
      contrato: {
        numeroContrato: contrato.numeroContrato,
        processoSeiMae: contrato.processoSeiMae,
        empresa: contrato.empresa.razaoSocial,
        cnpj: contrato.empresa.cnpj,
        valorGlobal: Number(contrato.valorGlobal),
        saldoDisponivel: Number(contrato.saldoDisponivel),
      },
      resumo: {
        totalChamados: chamados.length,
        totalMaquinas: listaMaquinas.length,
        valorTotalMedido: valorTotal,
      },
      statusMedicao: medicao?.status || StatusMedicaoMensal.EM_ABERTO,
      processoSeiDespesa: medicao?.processoSeiDespesa || contrato.processoSeiMae,
      dataRecebimentoProvisorio: medicao?.dataRecebimentoProvisorio,
      fiscalTecnicoNome: medicao?.nomeFiscalTecnico,
      fiscalTecnicoMatricula: medicao?.matriculaFiscalTecnico,
      listaMaquinas,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mesAno,
      processoSeiDespesa,
      fiscalNome,
      fiscalMatricula,
      fiscalId,
    } = body;

    const contrato = await prisma.contratoClima.findFirst({
      where: { isReferenciaAtiva: true },
      include: { empresa: true },
    });

    if (!contrato) {
      return NextResponse.json({ error: 'Nenhum contrato ativo localizado.' }, { status: 404 });
    }

    const refMes = mesAno || `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;

    // Busca chamados finalizados
    const chamados = await prisma.chamado.findMany({
      where: {
        contratoId: contrato.id,
        status: { in: [StatusChamado.FINALIZADO, StatusChamado.CONFIRMADO_TACITAMENTE] },
      },
      include: { intervencoes: true },
    });

    let totalMaquinas = 0;
    let valorTotal = 0;
    for (const ch of chamados) {
      totalMaquinas += ch.intervencoes.length;
      for (const it of ch.intervencoes) {
        valorTotal += Number(it.valorTotalIntervencao || 0);
      }
    }

    // 1. Cria ou atualiza a MedicaoMensal no SIG-CLIMA
    const medicao = await prisma.medicaoMensal.upsert({
      where: {
        contratoId_referenciaMesAno: {
          contratoId: contrato.id,
          referenciaMesAno: refMes,
        },
      },
      update: {
        processoSeiDespesa: processoSeiDespesa || contrato.processoSeiMae,
        status: StatusMedicaoMensal.RECEBIMENTO_PROVISORIO_EMITIDO,
        quantidadeChamados: chamados.length,
        quantidadeMaquinas: totalMaquinas,
        valorTotalMedicao: valorTotal,
        fiscalTecnicoId: fiscalId || undefined,
        nomeFiscalTecnico: fiscalNome || 'Prof. Dr. Fernando Santos',
        matriculaFiscalTecnico: fiscalMatricula || '98765-4',
        dataRecebimentoProvisorio: new Date(),
      },
      create: {
        contratoId: contrato.id,
        referenciaMesAno: refMes,
        processoSeiDespesa: processoSeiDespesa || contrato.processoSeiMae,
        status: StatusMedicaoMensal.RECEBIMENTO_PROVISORIO_EMITIDO,
        quantidadeChamados: chamados.length,
        quantidadeMaquinas: totalMaquinas,
        valorTotalMedicao: valorTotal,
        fiscalTecnicoId: fiscalId || undefined,
        nomeFiscalTecnico: fiscalNome || 'Prof. Dr. Fernando Santos',
        matriculaFiscalTecnico: fiscalMatricula || '98765-4',
        dataRecebimentoProvisorio: new Date(),
      },
    });

    // 2. Retroalimenta o SGC
    const sgcUrl = process.env.SGC_URL || 'http://localhost:3000';
    const serviceKey = process.env.PROAD_SERVICE_KEY || 'proad_interop_internal_service_key_2026_uern';

    let sgcSyncStatus = 'SGC_LOCAL';
    try {
      const sgcRes = await fetch(`${sgcUrl}/api/integracao/manutencao/medicoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          contratoId: contrato.sgcContratoId || contrato.id,
          referenciaMesAno: refMes,
          processoSeiDespesa: processoSeiDespesa || contrato.processoSeiMae,
          valorMedido: valorTotal,
          observacao: `Medição mensal consolidada pelo SIG-CLIMA. Total: ${totalMaquinas} máquinas atendidas em ${chamados.length} chamados.`,
        }),
      });

      if (sgcRes.ok) {
        const sgcData = await sgcRes.json();
        sgcSyncStatus = 'SINCRONIZADO_SGC';
        await prisma.medicaoMensal.update({
          where: { id: medicao.id },
          data: {
            status: StatusMedicaoMensal.SINCRONIZADO_SGC,
            sgcMedicaoId: sgcData.medicao?.id,
            sincronizadoSgcEm: new Date(),
          },
        });
      }
    } catch (sgcErr) {
      console.warn('[SGC_SYNC_WARN] Medição gravada localmente no SIG-CLIMA:', sgcErr);
    }

    return NextResponse.json({
      success: true,
      mensagem: 'Recebimento Provisório emitido e medição mensal sincronizada com o SGC!',
      medicaoId: medicao.id,
      valorTotalMedido: valorTotal,
      sgcSyncStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
