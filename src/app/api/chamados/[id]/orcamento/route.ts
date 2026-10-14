import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusChamado } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Empresa anexa orçamento baseado nos itens do SGC
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      intervencoesItens, // Array<{ intervencaoId: string, itens: Array<{ itemPrecoId: string, quantidade: number }> }>
      tecnicoNome,
      tecnicoId,
      laudoTecnico,
      observacoes,
    } = body;

    if (!intervencoesItens || !Array.isArray(intervencoesItens) || intervencoesItens.length === 0) {
      return NextResponse.json({ error: 'Nenhum item orçado informado.' }, { status: 400 });
    }

    const chamado = await prisma.chamado.findUnique({
      where: { id },
      include: { contrato: true },
    });

    if (!chamado) {
      return NextResponse.json({ error: 'Chamado não encontrado.' }, { status: 404 });
    }

    let valorTotalGeral = 0;

    await prisma.$transaction(async (tx) => {
      for (const inter of intervencoesItens) {
        // Remove orçamentos prévios da intervenção
        await tx.orcamentoItemDetalhamento.deleteMany({
          where: { intervencaoId: inter.intervencaoId },
        });

        let valorIntervencao = 0;

        for (const item of inter.itens) {
          const itemPreco = await tx.itemContratoPreco.findUnique({
            where: { id: item.itemPrecoId },
          });

          if (itemPreco) {
            const vUnit = Number(itemPreco.valorUnitario);
            const qtd = Number(item.quantidade) || 1;
            const subtotal = vUnit * qtd;

            valorIntervencao += subtotal;

            await tx.orcamentoItemDetalhamento.create({
              data: {
                intervencaoId: inter.intervencaoId,
                itemPrecoId: item.itemPrecoId,
                quantidade: qtd,
                valorUnitarioContratual: vUnit,
                valorTotal: subtotal,
              },
            });
          }
        }

        valorTotalGeral += valorIntervencao;

        await tx.intervencaoItem.update({
          where: { id: inter.intervencaoId },
          data: {
            valorTotalIntervencao: valorIntervencao,
            laudoTecnico: laudoTecnico || undefined,
            tecnicoExecutorId: tecnicoId || undefined,
            nomeTecnicoEmpresa: tecnicoNome || undefined,
          },
        });
      }

      // Atualiza o chamado
      await tx.chamado.update({
        where: { id },
        data: {
          orcamentoValorTotal: valorTotalGeral,
          status: StatusChamado.ORCAMENTO_ANEXADO,
          percentualEvolucao: 35,
          etapaAtualDescricao: 'Orçamento Anexado pela Empresa - Aguardando Aprovação do Admin PROAD',
        },
      });

      // Timeline event
      await tx.historicoChamado.create({
        data: {
          chamadoId: id,
          statusAnterior: chamado.status,
          statusNovo: StatusChamado.ORCAMENTO_ANEXADO,
          autorNome: tecnicoNome || 'Empresa Prestadora',
          mensagem: `Orçamento de R$ ${valorTotalGeral.toFixed(2)} montado com base na tabela contratual do SGC. ${observacoes || ''}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      mensagem: 'Orçamento anexado com sucesso para validação do Admin PROAD.',
      valorTotal: valorTotalGeral,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Admin aprova ou rejeita orçamento
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { acao, adminNome, motivoRejeicao } = body; // acao: 'APROVAR' | 'REJEITAR'

    const chamado = await prisma.chamado.findUnique({
      where: { id },
      include: { contrato: true },
    });

    if (!chamado) {
      return NextResponse.json({ error: 'Chamado não encontrado.' }, { status: 404 });
    }

    if (acao === 'APROVAR') {
      await prisma.$transaction(async (tx) => {
        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.APROVADO_EM_EXECUCAO,
            percentualEvolucao: 65,
            etapaAtualDescricao: 'Orçamento Aprovado pelo Admin - Em Execução pela Empresa',
            orcamentoAprovadoPor: adminNome || 'Admin PROAD',
            orcamentoAprovadoEm: new Date(),
          },
        });

        // Deduz saldo no contrato
        if (chamado.contratoId && chamado.orcamentoValorTotal) {
          const vTotal = Number(chamado.orcamentoValorTotal);
          await tx.contratoClima.update({
            where: { id: chamado.contratoId },
            data: {
              saldoDisponivel: {
                decrement: vTotal,
              },
            },
          });
        }

        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.APROVADO_EM_EXECUCAO,
            autorNome: adminNome || 'Admin PROAD',
            mensagem: `Orçamento no valor de R$ ${Number(chamado.orcamentoValorTotal).toFixed(2)} aprovado. Saldo contratual deduzido e serviço liberado para execução.`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        mensagem: 'Orçamento aprovado com sucesso! Execução autorizada.',
      });
    } else if (acao === 'REJEITAR') {
      await prisma.$transaction(async (tx) => {
        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.ORCAMENTO_REJEITADO,
            percentualEvolucao: 25,
            etapaAtualDescricao: 'Orçamento Rejeitado pelo Admin - Aguardando Ajustes da Empresa',
            orcamentoMotivoRejeicao: motivoRejeicao || 'Valores ou itens divergentes da necessidade técnica.',
          },
        });

        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.ORCAMENTO_REJEITADO,
            autorNome: adminNome || 'Admin PROAD',
            mensagem: `Orçamento rejeitado pelo Admin PROAD. Motivo: ${motivoRejeicao || 'Itens ou quantitativos divergentes.'}`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        mensagem: 'Orçamento rejeitado. O chamado retornou para a empresa revisar.',
      });
    }

    return NextResponse.json({ error: 'Ação inválida. Use APROVAR ou REJEITAR.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
