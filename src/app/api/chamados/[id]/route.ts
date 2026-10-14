import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const chamado = await prisma.chamado.findUnique({
      where: { id },
      include: {
        unidade: true,
        demandante: true,
        empresa: true,
        contrato: {
          include: {
            itensPreco: { orderBy: { numeroItem: 'asc' } },
          },
        },
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
        historicos: {
          orderBy: { criadoEm: 'asc' },
        },
      },
    });

    if (!chamado) {
      return NextResponse.json({ error: 'Chamado não encontrado.' }, { status: 404 });
    }

    const now = new Date();
    const prazoLimite = chamado.prazoLimiteAtendimento ? new Date(chamado.prazoLimiteAtendimento) : null;
    const slaEmHorasRestantes = prazoLimite
      ? Math.round((prazoLimite.getTime() - now.getTime()) / (1000 * 3600))
      : null;

    const dataLimiteConfirmacao = chamado.dataLimiteConfirmacao ? new Date(chamado.dataLimiteConfirmacao) : null;
    const diasRestantesAteste = dataLimiteConfirmacao
      ? Math.max(0, Math.ceil((dataLimiteConfirmacao.getTime() - now.getTime()) / (1000 * 3600 * 24)))
      : null;

    return NextResponse.json({
      chamado: {
        ...chamado,
        orcamentoValorTotal: Number(chamado.orcamentoValorTotal || 0),
        slaEmHorasRestantes,
        diasRestantesAteste,
        intervencoes: chamado.intervencoes.map((it) => ({
          ...it,
          valorTotalIntervencao: Number(it.valorTotalIntervencao),
          itensOrcamento: it.itensOrcamento.map((orc) => ({
            ...orc,
            valorUnitarioContratual: Number(orc.valorUnitarioContratual),
            valorTotal: Number(orc.valorTotal),
          })),
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
