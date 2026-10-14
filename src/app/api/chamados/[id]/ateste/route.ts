import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusChamado, StatusEquipamento } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      acao, // 'ATESTADO' | 'REJEITADO'
      servidorNome,
      servidorMatricula,
      servidorId,
      rating, // 1.0 a 5.0
      comentario,
      motivoRejeicao,
    } = body;

    const chamado = await prisma.chamado.findUnique({
      where: { id },
      include: {
        contrato: true,
        intervencoes: { include: { equipamento: true } },
      },
    });

    if (!chamado) {
      return NextResponse.json({ error: 'Chamado não encontrado.' }, { status: 404 });
    }

    if (acao === 'ATESTADO') {
      const diasGarantia = chamado.contrato?.diasGarantiaPadrao || 90;
      const dataGarantiaFim = new Date();
      dataGarantiaFim.setDate(dataGarantiaFim.getDate() + diasGarantia);

      await prisma.$transaction(async (tx) => {
        // 1. Atualiza as intervenções com o ateste do servidor e garantia
        for (const inter of chamado.intervencoes) {
          await tx.intervencaoItem.update({
            where: { id: inter.id },
            data: {
              atestadoPorId: servidorId || undefined,
              nomeServidorAtestante: servidorNome || 'Servidor UERN',
              matriculaServidorAtestante: servidorMatricula || '12345-6',
              dataAteste: new Date(),
              aceiteTacito: false,
              garantiaValidaAte: dataGarantiaFim,
            },
          });

          // Atualiza status do equipamento para ATIVO e ativa a garantia
          if (inter.categoriaServico !== 'DESINSTALACAO') {
            await tx.equipamento.update({
              where: { id: inter.equipamentoId },
              data: {
                status: StatusEquipamento.ATIVO,
                emGarantiaAte: dataGarantiaFim,
                ultimoChamadoId: chamado.id,
              },
            });
          } else {
            await tx.equipamento.update({
              where: { id: inter.equipamentoId },
              data: {
                status: StatusEquipamento.DESINSTALADO_DEPOSITO,
              },
            });
          }
        }

        // 2. Finaliza o chamado
        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.FINALIZADO,
            percentualEvolucao: 100,
            etapaAtualDescricao: 'Serviço Atestado e Concluído com Sucesso',
            confirmacaoTacita: false,
            rating: rating ? parseFloat(rating) : 5.0,
            avaliacaoAutomatica: false,
            comentarioAvaliacao: comentario || 'Serviço executado com excelência e atestado.',
            avaliadoEm: new Date(),
          },
        });

        // 3. Timeline event
        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.FINALIZADO,
            autorNome: servidorNome || 'Servidor Demandante',
            mensagem: `Serviço testado e aprovado digitalmente por ${servidorNome || 'Servidor'} (Matrícula: ${servidorMatricula || 'Registrada'}). Garantia de ${diasGarantia} dias ativada até ${dataGarantiaFim.toLocaleDateString('pt-BR')}. Avaliação: ${rating || 5} estrelas.`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        mensagem: 'Ateste digital registrado com sucesso! Chamado concluído e garantia ativada.',
      });
    } else if (acao === 'REJEITADO') {
      if (!motivoRejeicao) {
        return NextResponse.json({ error: 'Justificativa da rejeição do serviço é obrigatória.' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.REJEITADO_SOLUCAO,
            percentualEvolucao: 50,
            etapaAtualDescricao: 'Solução Rejeitada pelo Demandante - Retornado à Empresa para Correção',
            motivoRejeicaoSolucao: motivoRejeicao,
          },
        });

        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.REJEITADO_SOLUCAO,
            autorNome: servidorNome || 'Servidor Demandante',
            mensagem: `Solução rejeitada pelo demandante durante o teste. Motivo: ${motivoRejeicao}. Chamado retornou para a empresa refazer a intervenção.`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        mensagem: 'Solução rejeitada. O chamado retornou para a empresa refazer o reparo.',
      });
    }

    return NextResponse.json({ error: 'Ação inválida. Use ATESTADO ou REJEITADO.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
