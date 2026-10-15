import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncContratoClimaFromSgc } from '@/lib/sgc-sync';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceSync = searchParams.get('forceSync') === 'true';

    let contrato = await prisma.contratoClima.findFirst({
      where: { isReferenciaAtiva: true, ativo: true },
      include: {
        empresa: true,
        itensPreco: {
          orderBy: { numeroItem: 'asc' },
        },
      },
    });

    // Se solicitado forceSync, ou se não houver contrato, ou se o contrato ainda for o fictício (14/2025 ou <50 itens):
    const isMockContract = !contrato ||
      contrato.numeroContrato.includes('14/2025') ||
      contrato.empresa?.razaoSocial?.toLowerCase().includes('climafrio') ||
      contrato.itensPreco.length < 50;

    if (forceSync || isMockContract) {
      try {
        await syncContratoClimaFromSgc();
        contrato = await prisma.contratoClima.findFirst({
          where: { isReferenciaAtiva: true, ativo: true },
          include: {
            empresa: true,
            itensPreco: {
              orderBy: { numeroItem: 'asc' },
            },
          },
        });
      } catch (syncErr: any) {
        console.warn('[CONTRATO_SYNC_WARN] Falha durante auto-sync:', syncErr?.message || syncErr);
      }
    }

    if (!contrato) {
      // Fallback: pega o mais recente
      contrato = await prisma.contratoClima.findFirst({
        orderBy: { vigenciaFim: 'desc' },
        include: {
          empresa: true,
          itensPreco: {
            orderBy: { numeroItem: 'asc' },
          },
        },
      });
    }

    if (!contrato) {
      return NextResponse.json({
        hasActiveContract: false,
        message: 'Nenhum contrato ativo vinculado ao sistema de climatização.',
      });
    }

    // Calcula total empenhado/executado em chamados
    const chamadosValores = await prisma.chamado.findMany({
      where: {
        contratoId: contrato.id,
        status: { notIn: ['CANCELADO'] },
      },
      select: { orcamentoValorTotal: true },
    });

    const totalConsumido = chamadosValores.reduce((acc, c) => acc + Number(c.orcamentoValorTotal || 0), 0);
    const saldoCalculado = Math.max(0, Number(contrato.valorGlobal) - totalConsumido);

    return NextResponse.json({
      hasActiveContract: true,
      contrato: {
        id: contrato.id,
        numeroContrato: contrato.numeroContrato,
        processoSeiMae: contrato.processoSeiMae,
        empresa: contrato.empresa,
        valorGlobal: Number(contrato.valorGlobal),
        saldoDisponivel: saldoCalculado,
        totalConsumido,
        percentualConsumido: Number(((totalConsumido / Number(contrato.valorGlobal)) * 100).toFixed(2)),
        vigenciaInicio: contrato.vigenciaInicio,
        vigenciaFim: contrato.vigenciaFim,
        autoSincronizadoEm: contrato.autoSincronizadoEm,
        prazoAtendimentoHorasRegular: contrato.prazoAtendimentoHorasRegular,
        prazoAtendimentoHorasUrgente: contrato.prazoAtendimentoHorasUrgente,
        diasGarantiaPadrao: contrato.diasGarantiaPadrao,
        diasPrazoAtesteDemandante: contrato.diasPrazoAtesteDemandante,
        limiteAprovacaoAutomatica: Number(contrato.limiteAprovacaoAutomatica || 1000),
        itensPreco: contrato.itensPreco.map((item) => ({
          id: item.id,
          numeroItem: item.numeroItem,
          codigo: item.codigo,
          descricao: item.descricao,
          unidadeMedida: item.unidadeMedida,
          valorUnitario: Number(item.valorUnitario),
          saldoQuantidade: item.saldoQuantidade,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await syncContratoClimaFromSgc();
    return NextResponse.json({
      mensagem: 'Contrato e itens de preços sincronizados com sucesso a partir do SGC!',
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contratoId,
      prazoAtendimentoHorasRegular,
      prazoAtendimentoHorasUrgente,
      diasGarantiaPadrao,
      diasPrazoAtesteDemandante,
      limiteAprovacaoAutomatica,
    } = body;

    if (!contratoId) {
      return NextResponse.json({ error: 'ID do contrato é obrigatório.' }, { status: 400 });
    }

    const contratoAtualizado = await prisma.contratoClima.update({
      where: { id: contratoId },
      data: {
        prazoAtendimentoHorasRegular: prazoAtendimentoHorasRegular !== undefined ? parseInt(prazoAtendimentoHorasRegular, 10) : undefined,
        prazoAtendimentoHorasUrgente: prazoAtendimentoHorasUrgente !== undefined ? parseInt(prazoAtendimentoHorasUrgente, 10) : undefined,
        diasGarantiaPadrao: diasGarantiaPadrao !== undefined ? parseInt(diasGarantiaPadrao, 10) : undefined,
        diasPrazoAtesteDemandante: diasPrazoAtesteDemandante !== undefined ? parseInt(diasPrazoAtesteDemandante, 10) : undefined,
        limiteAprovacaoAutomatica: limiteAprovacaoAutomatica !== undefined ? parseFloat(limiteAprovacaoAutomatica) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      mensagem: 'Parâmetros operacionais do contrato atualizados com sucesso!',
      contrato: contratoAtualizado,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
