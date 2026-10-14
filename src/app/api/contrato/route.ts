import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let contrato = await prisma.contratoClima.findFirst({
      where: { isReferenciaAtiva: true, ativo: true },
      include: {
        empresa: true,
        itensPreco: {
          orderBy: { numeroItem: 'asc' },
        },
      },
    });

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
        prazoAtendimentoHorasRegular: contrato.prazoAtendimentoHorasRegular,
        prazoAtendimentoHorasUrgente: contrato.prazoAtendimentoHorasUrgente,
        diasGarantiaPadrao: contrato.diasGarantiaPadrao,
        diasPrazoAtesteDemandante: contrato.diasPrazoAtesteDemandante,
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contratoId,
      prazoAtendimentoHorasRegular,
      prazoAtendimentoHorasUrgente,
      diasGarantiaPadrao,
      diasPrazoAtesteDemandante,
    } = body;

    if (!contratoId) {
      return NextResponse.json({ error: 'ID do contrato é obrigatório.' }, { status: 400 });
    }

    const contratoAtualizado = await prisma.contratoClima.update({
      where: { id: contratoId },
      data: {
        prazoAtendimentoHorasRegular: prazoAtendimentoHorasRegular ? parseInt(prazoAtendimentoHorasRegular, 10) : undefined,
        prazoAtendimentoHorasUrgente: prazoAtendimentoHorasUrgente ? parseInt(prazoAtendimentoHorasUrgente, 10) : undefined,
        diasGarantiaPadrao: diasGarantiaPadrao ? parseInt(diasGarantiaPadrao, 10) : undefined,
        diasPrazoAtesteDemandante: diasPrazoAtesteDemandante ? parseInt(diasPrazoAtesteDemandante, 10) : undefined,
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
