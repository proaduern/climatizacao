import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusChamado, StatusEquipamento } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const now = new Date();

    // Busca chamados cujo prazo de confirmação expirou
    const chamadosParaConfirmar = await prisma.chamado.findMany({
      where: {
        status: StatusChamado.AGUARDANDO_CONFIRMACAO,
        dataLimiteConfirmacao: { lte: now },
      },
      include: {
        contrato: true,
        ambiente: true,
        intervencoes: true,
      },
    });

    const homologados: string[] = [];

    for (const chamado of chamadosParaConfirmar) {
      const diasGarantia = chamado.contrato?.diasGarantiaPadrao || 90;
      const dataGarantiaFim = new Date();
      dataGarantiaFim.setDate(dataGarantiaFim.getDate() + diasGarantia);

      await prisma.$transaction(async (tx) => {
        // Atualiza intervenções como aceite tácito
        for (const inter of chamado.intervencoes) {
          await tx.intervencaoItem.update({
            where: { id: inter.id },
            data: {
              nomeServidorAtestante: 'Homologação Tácita (Decurso de Prazo)',
              matriculaServidorAtestante: 'SISTEMA_PROAD',
              dataAteste: now,
              aceiteTacito: true,
              garantiaValidaAte: dataGarantiaFim,
            },
          });

          if (inter.categoriaServico === 'DESINSTALACAO') {
            await tx.equipamento.update({
              where: { id: inter.equipamentoId },
              data: {
                status: StatusEquipamento.DESINSTALADO_DEPOSITO,
                ambienteId: null,
                localizacao: 'Desinstalada / Depósito da Unidade (Aguardando destinação)',
              },
            });
          } else if (inter.categoriaServico === 'INSTALACAO') {
            await tx.equipamento.update({
              where: { id: inter.equipamentoId },
              data: {
                status: StatusEquipamento.ATIVO,
                ambienteId: chamado.ambienteId || undefined,
                localizacao: chamado.ambiente?.descricaoDetalhe || undefined,
                emGarantiaAte: dataGarantiaFim,
                ultimoChamadoId: chamado.id,
              },
            });
          } else {
            await tx.equipamento.update({
              where: { id: inter.equipamentoId },
              data: {
                status: StatusEquipamento.ATIVO,
                ambienteId: chamado.ambienteId || undefined,
                emGarantiaAte: dataGarantiaFim,
                ultimoChamadoId: chamado.id,
              },
            });
          }

          if (inter.maquinaSubstituidaId) {
            await tx.equipamento.update({
              where: { id: inter.maquinaSubstituidaId },
              data: {
                status: StatusEquipamento.DESINSTALADO_DEPOSITO,
                ambienteId: null,
                localizacao: 'Desinstalada / Depósito da Unidade (Substituída)',
              },
            });
          }
        }

        // Finaliza o chamado com nota 4.0 neutro-positiva (anti-viés)
        await tx.chamado.update({
          where: { id: chamado.id },
          data: {
            status: StatusChamado.CONFIRMADO_TACITAMENTE,
            percentualEvolucao: 100,
            etapaAtualDescricao: 'Homologado por Confirmação Tácita (Decurso do Prazo Regulamentar)',
            confirmacaoTacita: true,
            rating: 4.0, // Nota padrão para tratamento de outliers/viés
            avaliacaoAutomatica: true,
            comentarioAvaliacao: 'Aceite tácito automático após 5 dias úteis de inércia da unidade demandante. Nota neutra-positiva 4.0 atribuída.',
            avaliadoEm: now,
          },
        });

        // Timeline event
        await tx.historicoChamado.create({
          data: {
            chamadoId: chamado.id,
            statusAnterior: StatusChamado.AGUARDANDO_CONFIRMACAO,
            statusNovo: StatusChamado.CONFIRMADO_TACITAMENTE,
            autorNome: 'Mecanismo Tácito Automático',
            mensagem: 'Confirmação tácita homologada por decurso de prazo (5 dias úteis sem contestação). Atribuída nota 4.0 anti-viés e garantia ativada.',
          },
        });
      });

      homologados.push(chamado.numeroProtocolo);
    }

    return NextResponse.json({
      success: true,
      totalHomologados: homologados.length,
      homologados,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
