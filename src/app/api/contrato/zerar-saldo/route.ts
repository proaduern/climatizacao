import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusEquipamento } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Endpoint para o Admin verificar e, se desejar, zerar ou excluir os chamados demonstrativos que compõem os R$ 740,00 consumidos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { acao = 'EXCLUIR_DEMONSTRATIVOS' } = body; // 'EXCLUIR_DEMONSTRATIVOS' | 'ZERAR_VALORES'

    const contrato = await prisma.contratoClima.findFirst({
      where: { isReferenciaAtiva: true, ativo: true },
      include: { empresa: true },
    });

    if (!contrato) {
      return NextResponse.json({ error: 'Nenhum contrato ativo localizado.' }, { status: 404 });
    }

    // Busca os chamados de demonstração que originaram os R$ 740,00
    const chamadosDemo = await prisma.chamado.findMany({
      where: {
        contratoId: contrato.id,
        numeroProtocolo: { in: ['CLIMA-2026-00001', 'CLIMA-2026-00002'] },
      },
      include: {
        intervencoes: true,
      },
    });

    if (chamadosDemo.length === 0) {
      // Se não há chamados com os números exatos, busca todos os chamados com valor maior que 0
      const chamadosComValor = await prisma.chamado.findMany({
        where: {
          contratoId: contrato.id,
          orcamentoValorTotal: { gt: 0 },
        },
        include: { intervencoes: true },
      });

      if (chamadosComValor.length === 0) {
        return NextResponse.json({
          mensagem: 'O saldo já está 100% íntegro (R$ 0,00 consumido). Nenhum chamado pendente de exclusão.',
          totalConsumido: 0,
          saldoDisponivel: Number(contrato.valorGlobal),
        });
      }
    }

    const chamadosAlvo = chamadosDemo.length > 0 ? chamadosDemo : await prisma.chamado.findMany({
      where: { contratoId: contrato.id, orcamentoValorTotal: { gt: 0 } },
      include: { intervencoes: true },
    });

    let totalLiberado = 0;

    await prisma.$transaction(async (tx) => {
      for (const ch of chamadosAlvo) {
        totalLiberado += Number(ch.orcamentoValorTotal || 0);

        if (acao === 'EXCLUIR_DEMONSTRATIVOS') {
          // 1. Libera equipamentos para ATIVO (a não ser que estejam condenados)
          for (const inter of ch.intervencoes) {
            if (!inter.maquinaCondenada) {
              await tx.equipamento.update({
                where: { id: inter.equipamentoId },
                data: { status: StatusEquipamento.ATIVO },
              });
            }
          }

          // 2. Remove orçamentos das intervenções
          for (const inter of ch.intervencoes) {
            await tx.orcamentoItemDetalhamento.deleteMany({
              where: { intervencaoId: inter.id },
            });
          }

          // 3. Remove intervenções
          await tx.intervencaoItem.deleteMany({
            where: { chamadoId: ch.id },
          });

          // 4. Remove históricos
          await tx.historicoChamado.deleteMany({
            where: { chamadoId: ch.id },
          });

          // 5. Remove o chamado
          await tx.chamado.delete({
            where: { id: ch.id },
          });
        } else {
          // ZERAR_VALORES
          await tx.chamado.update({
            where: { id: ch.id },
            data: { orcamentoValorTotal: 0 },
          });

          for (const inter of ch.intervencoes) {
            await tx.intervencaoItem.update({
              where: { id: inter.id },
              data: { valorTotalIntervencao: 0 },
            });
          }
        }
      }

      // Restaura o saldo no contrato
      await tx.contratoClima.update({
        where: { id: contrato.id },
        data: {
          saldoDisponivel: contrato.valorGlobal,
        },
      });
    });

    return NextResponse.json({
      success: true,
      mensagem: `Saldo integral restaurado com sucesso! Foram estornados R$ ${totalLiberado.toFixed(2)} e o saldo contratual disponível voltou a R$ ${Number(contrato.valorGlobal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (100% íntegro).`,
      totalLiberado,
      saldoDisponivel: Number(contrato.valorGlobal),
      totalConsumido: 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
