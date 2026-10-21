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
      tecnicoCpf,
      tecnicoId,
      laudoTecnico,
      observacoes,
      maquinaCondenada,
      motivoInviabilidade,
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

    // Se o fornecedor indicou que a máquina está condenada
    if (maquinaCondenada) {
      if (!laudoTecnico || laudoTecnico.trim().length < 10) {
        return NextResponse.json(
          { error: 'O Laudo Técnico Circunstanciado de Condenação é obrigatório e deve detalhar o motivo da inviabilidade.' },
          { status: 400 }
        );
      }
      if (!tecnicoNome || !tecnicoNome.trim()) {
        return NextResponse.json({ error: 'A identificação do técnico responsável (Nome) é obrigatória.' }, { status: 400 });
      }

      const intervencaoAlvo = (intervencoesItens && intervencoesItens[0]?.intervencaoId)
        ? chamado.intervencoes.find(i => i.id === intervencoesItens[0].intervencaoId) || chamado.intervencoes[0]
        : chamado.intervencoes[0];

      if (!intervencaoAlvo) {
        return NextResponse.json({ error: 'Nenhuma máquina vinculada ao chamado.' }, { status: 400 });
      }

      const agora = new Date();
      const nomeTec = tecnicoNome.trim();
      const cpfTec = (tecnicoCpf || '000.000.000-00').trim();
      const tombo = intervencaoAlvo.equipamento?.tombo || 'S/N';

      await prisma.$transaction(async (tx) => {
        await tx.orcamentoItemDetalhamento.deleteMany({
          where: { intervencaoId: intervencaoAlvo.id },
        });

        await tx.intervencaoItem.update({
          where: { id: intervencaoAlvo.id },
          data: {
            maquinaCondenada: true,
            laudoTecnico: laudoTecnico.trim(),
            nomeTecnicoEmpresa: nomeTec,
            cpfTecnicoEmpresa: cpfTec,
            tecnicoExecutorId: tecnicoId || undefined,
            valorTotalIntervencao: 0,
          },
        });

        await tx.equipamento.update({
          where: { id: intervencaoAlvo.equipamentoId },
          data: {
            status: 'BAIXADO_INSERVIVEL',
            retificadoPelaEmpresa: true,
            retificadoEm: agora,
            retificadoPorNome: `${nomeTec} (CPF: ${cpfTec})`,
            observacaoRetificacao: `Máquina condenada tecnicamente no chamado ${chamado.numeroProtocolo}.`,
          },
        });

        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.FINALIZADO,
            percentualEvolucao: 100,
            orcamentoValorTotal: 0,
            etapaAtualDescricao: 'Equipamento Condenado / Inservível - Laudo Emitido para Aquisição Substituta na PROAD',
            dataExecucaoConclusao: agora,
          },
        });

        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.FINALIZADO,
            autorNome: `${nomeTec} • Empresa Prestadora`,
            mensagem: `VISTORIA TÉCNICA / CONDENAÇÃO DE MÁQUINA: Aparelho Tombo ${tombo} condenado por inviabilidade técnica de reparo (${motivoInviabilidade || 'Perda total / Inservível'}). Laudo Técnico lavrado por ${nomeTec} (CPF: ${cpfTec}). Aparelho baixado como BAIXADO_INSERVIVEL no inventário. Laudo oficial em PDF disponibilizado para o demandante usar no processo SEI da PROAD.`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        condenada: true,
        mensagem: `Aparelho Tombo ${tombo} foi declarado condenado com sucesso. Status atualizado para BAIXADO_INSERVIVEL e Laudo em PDF emitido para o demandante.`,
      });
    }

    if (!intervencoesItens || !Array.isArray(intervencoesItens) || intervencoesItens.length === 0) {
      return NextResponse.json({ error: 'Nenhum item orçado informado.' }, { status: 400 });
    }

    // Pré-carrega os itens de preço em lote fora do loop para evitar N+1 dentro da transação
    const todosItemPrecoIds = Array.from(
      new Set(
        intervencoesItens.flatMap((inter: any) =>
          Array.isArray(inter.itens) ? inter.itens.map((it: any) => it.itemPrecoId).filter(Boolean) : []
        )
      )
    );
    const itensPrecoLista = await prisma.itemContratoPreco.findMany({
      where: { id: { in: todosItemPrecoIds } },
    });
    const mapaItensPreco = new Map(itensPrecoLista.map((ip) => [ip.id, ip]));

    let valorTotalGeral = 0;

    await prisma.$transaction(async (tx) => {
      for (const inter of intervencoesItens) {
        // Remove orçamentos prévios da intervenção
        await tx.orcamentoItemDetalhamento.deleteMany({
          where: { intervencaoId: inter.intervencaoId },
        });

        let valorIntervencao = 0;
        const novosDetalhamentos: Array<{
          intervencaoId: string;
          itemPrecoId: string;
          quantidade: number;
          valorUnitarioContratual: number;
          valorTotal: number;
        }> = [];

        for (const item of inter.itens) {
          const itemPreco = mapaItensPreco.get(item.itemPrecoId);

          if (itemPreco) {
            const vUnit = Number(itemPreco.valorUnitario);
            const qtd = Math.max(0.01, Number(item.quantidade) || 1);
            const subtotal = Math.round(vUnit * qtd * 100) / 100;

            valorIntervencao = Math.round((valorIntervencao + subtotal) * 100) / 100;

            novosDetalhamentos.push({
              intervencaoId: inter.intervencaoId,
              itemPrecoId: item.itemPrecoId,
              quantidade: qtd,
              valorUnitarioContratual: vUnit,
              valorTotal: subtotal,
            });
          }
        }

        if (novosDetalhamentos.length > 0) {
          await tx.orcamentoItemDetalhamento.createMany({
            data: novosDetalhamentos,
          });
        }

        valorTotalGeral = Math.round((valorTotalGeral + valorIntervencao) * 100) / 100;

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

      // Limite configurável pelo Admin (padrão: R$ 1.000,00)
      const limiteAutoAprovacao = Number(chamado.contrato?.limiteAprovacaoAutomatica || 1000);
      const isAutoAprovado = valorTotalGeral <= limiteAutoAprovacao;

      const novoStatus = isAutoAprovado ? StatusChamado.APROVADO_EM_EXECUCAO : StatusChamado.ORCAMENTO_ANEXADO;
      const novoPercentual = isAutoAprovado ? 65 : 35;
      const novaEtapa = isAutoAprovado
        ? `Orçamento Aprovado Automaticamente (≤ R$ ${limiteAutoAprovacao.toFixed(2)}) - Em Execução`
        : `Orçamento de R$ ${valorTotalGeral.toFixed(2)} Anexado - Aguardando Aprovação da Fiscalização / Gestor`;

      // Atualiza o chamado
      await tx.chamado.update({
        where: { id },
        data: {
          orcamentoValorTotal: valorTotalGeral,
          status: novoStatus,
          percentualEvolucao: novoPercentual,
          etapaAtualDescricao: novaEtapa,
          orcamentoAprovadoPor: isAutoAprovado ? 'Sistema (Aprovação Automática Parametrizada)' : null,
          orcamentoAprovadoEm: isAutoAprovado ? new Date() : null,
        },
      });

      // Timeline event
      const mensagemHistorico = isAutoAprovado
        ? `Orçamento de R$ ${valorTotalGeral.toFixed(2)} montado e APROVADO AUTOMATICAMENTE por estar dentro do limite configurado de até R$ ${limiteAutoAprovacao.toFixed(2)}. Execução autorizada de imediato.`
        : `Orçamento de R$ ${valorTotalGeral.toFixed(2)} excede o limite automático de R$ ${limiteAutoAprovacao.toFixed(2)}. Encaminhado para aprovação da Fiscalização Administrativa ou Gestor do Contrato da UERN. ${observacoes || ''}`;

      await tx.historicoChamado.create({
        data: {
          chamadoId: id,
          statusAnterior: chamado.status,
          statusNovo: novoStatus,
          autorNome: isAutoAprovado ? 'Sistema • SIG-CLIMA' : (tecnicoNome || 'Empresa Prestadora'),
          mensagem: mensagemHistorico,
        },
      });
    });

    const limiteFinal = Number(chamado.contrato?.limiteAprovacaoAutomatica || 1000);
    const autoAprovado = valorTotalGeral <= limiteFinal;

    return NextResponse.json({
      success: true,
      aprovadoAutomaticamente: autoAprovado,
      mensagem: autoAprovado
        ? `Orçamento de R$ ${valorTotalGeral.toFixed(2)} aprovado automaticamente (dentro do limite de até R$ ${limiteFinal.toFixed(2)})! Execução autorizada.`
        : `Orçamento anexado com sucesso. Como o valor (R$ ${valorTotalGeral.toFixed(2)}) ultrapassa o limite de R$ ${limiteFinal.toFixed(2)}, requer aprovação da Fiscalização Administrativa ou Gestor do Contrato.`,
      valorTotal: valorTotalGeral,
      limiteConfigurado: limiteFinal,
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
