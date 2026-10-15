import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusChamado, StatusEquipamento } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const chamado = await prisma.chamado.findUnique({
      where: { id },
      include: {
        unidade: true,
        ambiente: true,
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

// Edição completa pelo Admin
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    const {
      tituloDemanda,
      descricaoGeral,
      status,
      unidadeId,
      urgente,
      percentualEvolucao,
      etapaAtualDescricao,
      orcamentoValorTotal,
      motivoRejeicaoSolucao,
      autorNome,
      justificativaEdicao,
    } = body;

    const chamadoExistente = await prisma.chamado.findUnique({
      where: { id },
      include: { intervencoes: true },
    });

    if (!chamadoExistente) {
      return NextResponse.json({ error: 'Chamado não encontrado.' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (tituloDemanda !== undefined) dataToUpdate.tituloDemanda = tituloDemanda;
    if (descricaoGeral !== undefined) dataToUpdate.descricaoGeral = descricaoGeral;
    if (unidadeId !== undefined) dataToUpdate.unidadeId = unidadeId;
    if (orcamentoValorTotal !== undefined) dataToUpdate.orcamentoValorTotal = Number(orcamentoValorTotal);
    if (motivoRejeicaoSolucao !== undefined) dataToUpdate.motivoRejeicaoSolucao = motivoRejeicaoSolucao;

    // Se houve alteração de status
    if (status && Object.values(StatusChamado).includes(status as StatusChamado)) {
      dataToUpdate.status = status as StatusChamado;

      // Ajusta barra de evolução e etapas conforme o status se não fornecidos
      if (percentualEvolucao !== undefined) {
        dataToUpdate.percentualEvolucao = Number(percentualEvolucao);
      } else {
        switch (status) {
          case StatusChamado.ABERTO:
            dataToUpdate.percentualEvolucao = 15;
            dataToUpdate.etapaAtualDescricao = 'Chamado Aberto - Aguardando Triagem';
            break;
          case StatusChamado.EM_TRIAGEM:
            dataToUpdate.percentualEvolucao = 25;
            dataToUpdate.etapaAtualDescricao = 'Encaminhado à Empresa Prestadora';
            break;
          case StatusChamado.AGUARDANDO_ORCAMENTO:
            dataToUpdate.percentualEvolucao = 30;
            dataToUpdate.etapaAtualDescricao = 'Empresa em Diagnóstico In Loco';
            break;
          case StatusChamado.ORCAMENTO_ANEXADO:
            dataToUpdate.percentualEvolucao = 35;
            dataToUpdate.etapaAtualDescricao = 'Orçamento Anexado - Aguardando Aprovação';
            break;
          case StatusChamado.APROVADO_EM_EXECUCAO:
            dataToUpdate.percentualEvolucao = 65;
            dataToUpdate.etapaAtualDescricao = 'Orçamento Aprovado - Em Execução';
            break;
          case StatusChamado.AGUARDANDO_CONFIRMACAO:
            dataToUpdate.percentualEvolucao = 85;
            dataToUpdate.etapaAtualDescricao = 'Execução Concluída - Aguardando Ateste Digital';
            break;
          case StatusChamado.CONFIRMADO_PELO_DEMANDANTE:
          case StatusChamado.CONFIRMADO_TACITAMENTE:
          case StatusChamado.FINALIZADO:
            dataToUpdate.percentualEvolucao = 100;
            dataToUpdate.etapaAtualDescricao = 'Chamado Finalizado e Atestado';
            break;
          case StatusChamado.CANCELADO:
            dataToUpdate.etapaAtualDescricao = 'Chamado Cancelado';
            break;
          case StatusChamado.REJEITADO_SOLUCAO:
            dataToUpdate.percentualEvolucao = 40;
            dataToUpdate.etapaAtualDescricao = 'Solução Rejeitada - Retornado à Empresa';
            break;
        }
      }
    }

    if (etapaAtualDescricao !== undefined) {
      dataToUpdate.etapaAtualDescricao = etapaAtualDescricao;
    }

    const atualizado = await prisma.$transaction(async (tx) => {
      const ch = await tx.chamado.update({
        where: { id },
        data: dataToUpdate,
        include: { unidade: true, intervencoes: true },
      });

      // Se foi finalizado, aplica desvinculação para desinstalação ou vinculação para instalação
      if (
        status === StatusChamado.FINALIZADO ||
        status === StatusChamado.CONFIRMADO_PELO_DEMANDANTE ||
        status === StatusChamado.CONFIRMADO_TACITAMENTE
      ) {
        for (const inter of chamadoExistente.intervencoes) {
          if (inter.maquinaCondenada) continue;

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
                ambienteId: chamadoExistente.ambienteId || undefined,
              },
            });
          } else {
            await tx.equipamento.update({
              where: { id: inter.equipamentoId },
              data: { status: StatusEquipamento.ATIVO },
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
      } else if (status === StatusChamado.CANCELADO) {
        for (const inter of chamadoExistente.intervencoes) {
          if (!inter.maquinaCondenada) {
            await tx.equipamento.update({
              where: { id: inter.equipamentoId },
              data: { status: StatusEquipamento.ATIVO },
            });
          }
        }
      } else if (status === StatusChamado.APROVADO_EM_EXECUCAO || status === StatusChamado.AGUARDANDO_ORCAMENTO) {
        for (const inter of chamadoExistente.intervencoes) {
          if (!inter.maquinaCondenada) {
            await tx.equipamento.update({
              where: { id: inter.equipamentoId },
              data: { status: StatusEquipamento.EM_MANUTENCAO },
            });
          }
        }
      }

      // Registra no histórico de auditoria
      await tx.historicoChamado.create({
        data: {
          chamadoId: id,
          statusAnterior: chamadoExistente.status,
          statusNovo: dataToUpdate.status || chamadoExistente.status,
          autorNome: autorNome || 'Administrador PROAD',
          mensagem: `Chamado alterado/editado pelo Administrador. ${justificativaEdicao ? `Justificativa: ${justificativaEdicao}. ` : ''}${status && status !== chamadoExistente.status ? `Status alterado de ${chamadoExistente.status} para ${status}.` : ''}`,
        },
      });

      return ch;
    });

    return NextResponse.json({
      success: true,
      mensagem: 'Chamado atualizado com sucesso pelo Administrador.',
      chamado: atualizado,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Exclusão completa pelo Admin
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const chamado = await prisma.chamado.findUnique({
      where: { id },
      include: { intervencoes: true },
    });

    if (!chamado) {
      return NextResponse.json({ error: 'Chamado não encontrado.' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Libera os equipamentos de volta para ATIVO caso não estejam em outros chamados abertos
      for (const inter of chamado.intervencoes) {
        const outrosChamados = await tx.chamado.count({
          where: {
            id: { not: id },
            status: { notIn: [StatusChamado.FINALIZADO, StatusChamado.CANCELADO] },
            intervencoes: { some: { equipamentoId: inter.equipamentoId } },
          },
        });

        if (outrosChamados === 0 && !inter.maquinaCondenada) {
          const eqAtual = await tx.equipamento.findUnique({ where: { id: inter.equipamentoId } });
          if (eqAtual && eqAtual.status !== StatusEquipamento.BAIXADO_INSERVIVEL) {
            await tx.equipamento.update({
              where: { id: inter.equipamentoId },
              data: { status: StatusEquipamento.ATIVO },
            });
          }
        }
      }

      // 2. Remove itens de orçamento vinculados às intervenções
      for (const inter of chamado.intervencoes) {
        await tx.orcamentoItemDetalhamento.deleteMany({
          where: { intervencaoId: inter.id },
        });
      }

      // 3. Remove intervenções
      await tx.intervencaoItem.deleteMany({
        where: { chamadoId: id },
      });

      // 4. Remove históricos
      await tx.historicoChamado.deleteMany({
        where: { chamadoId: id },
      });

      // 5. Remove o chamado
      await tx.chamado.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      mensagem: `Chamado ${chamado.numeroProtocolo} excluído com sucesso pelo Administrador. Equipamentos liberados.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
