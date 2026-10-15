import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusChamado, StatusEquipamento } from '@prisma/client';

export const dynamic = 'force-dynamic';

// O fornecedor/empresa prestadora declara máquina condenada (inservível) com laudo técnico e identificação do responsável
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      intervencaoId,
      laudoTecnico,
      tecnicoNome,
      tecnicoCpf,
      tecnicoId,
      motivoInviabilidade,
    } = body;

    if (!laudoTecnico || laudoTecnico.trim().length < 10) {
      return NextResponse.json(
        { error: 'O Laudo Técnico Circunstanciado de Condenação é obrigatório e deve conter detalhes técnicos da inviabilidade.' },
        { status: 400 }
      );
    }

    if (!tecnicoNome || !tecnicoNome.trim()) {
      return NextResponse.json(
        { error: 'A identificação do técnico responsável (Nome) é obrigatória para emissão do laudo.' },
        { status: 400 }
      );
    }

    if (!tecnicoCpf || !tecnicoCpf.trim()) {
      return NextResponse.json(
        { error: 'O CPF do técnico responsável é obrigatório para conferência e validade pericial do laudo.' },
        { status: 400 }
      );
    }

    const chamado = await prisma.chamado.findUnique({
      where: { id },
      include: {
        unidade: true,
        demandante: true,
        contrato: { include: { empresa: true } },
        intervencoes: {
          include: {
            equipamento: true,
          },
        },
      },
    });

    if (!chamado) {
      return NextResponse.json({ error: 'Chamado não encontrado.' }, { status: 404 });
    }

    // Seleciona a intervenção alvo
    let intervencaoAlvo = intervencaoId
      ? chamado.intervencoes.find((i) => i.id === intervencaoId)
      : chamado.intervencoes[0];

    if (!intervencaoAlvo) {
      return NextResponse.json({ error: 'Nenhuma máquina/intervenção vinculada a este chamado.' }, { status: 400 });
    }

    const agora = new Date();
    const nomeTec = tecnicoNome.trim();
    const cpfTec = tecnicoCpf.trim();
    const textoLaudo = laudoTecnico.trim();
    const equipamentoTombo = intervencaoAlvo.equipamento?.tombo || 'S/N';
    const equipamentoMarca = intervencaoAlvo.equipamento?.marca || 'Equipamento';

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Remove eventuais orçamentos financeiros associados (pois a máquina não será consertada)
      await tx.orcamentoItemDetalhamento.deleteMany({
        where: { intervencaoId: intervencaoAlvo.id },
      });

      // 2. Atualiza a intervenção com a condenação formal e dados periciais
      const intervencaoAtualizada = await tx.intervencaoItem.update({
        where: { id: intervencaoAlvo.id },
        data: {
          maquinaCondenada: true,
          laudoTecnico: textoLaudo,
          nomeTecnicoEmpresa: nomeTec,
          cpfTecnicoEmpresa: cpfTec,
          tecnicoExecutorId: tecnicoId || undefined,
          valorTotalIntervencao: 0,
        },
      });

      // 3. Atualiza o status da máquina no inventário institucional para BAIXADO_INSERVIVEL
      const eqAtualizado = await tx.equipamento.update({
        where: { id: intervencaoAlvo.equipamentoId },
        data: {
          status: StatusEquipamento.BAIXADO_INSERVIVEL,
          retificadoPelaEmpresa: true,
          retificadoEm: agora,
          retificadoPorNome: `${nomeTec} (CPF: ${cpfTec})`,
          observacaoRetificacao: `Máquina condenada tecnicamente por inviabilidade de conserto. Laudo emitido no chamado ${chamado.numeroProtocolo}.`,
        },
      });

      // 4. Finaliza o chamado com etapa explicativa de condenação
      const etapaCondenacao = 'Equipamento Condenado / Inservível - Laudo Pericial Emitido para Processo de Substituição na PROAD';
      const chamadoAtualizado = await tx.chamado.update({
        where: { id },
        data: {
          status: StatusChamado.FINALIZADO,
          percentualEvolucao: 100,
          etapaAtualDescricao: etapaCondenacao,
          orcamentoValorTotal: 0,
          dataExecucaoConclusao: agora,
        },
        include: {
          unidade: true,
          demandante: true,
          intervencoes: {
            include: {
              equipamento: true,
              tecnicoExecutor: true,
            },
          },
        },
      });

      // 5. Registra o evento pericial na Linha do Tempo (Timeline de Auditoria)
      const mensagemHistorico = `VISTORIA TÉCNICA / CONDENAÇÃO DE MÁQUINA: O equipamento Tombo ${equipamentoTombo} (${equipamentoMarca}) foi periciado e declarado CONDENADO (IRRECUPERÁVEL / INSERVÍVEL). Motivo: ${motivoInviabilidade || 'Inviabilidade técnica e econômica de recuperação'}. Laudo Técnico Circunstanciado lavrado pelo Técnico ${nomeTec} (CPF: ${cpfTec}). O bem patrimonial foi baixado no inventário com status BAIXADO_INSERVIVEL. O Laudo Oficial em PDF está disponível para download imediato pelo demandante para instrução de processo de compra na PROAD/SEI.`;

      await tx.historicoChamado.create({
        data: {
          chamadoId: id,
          statusAnterior: chamado.status,
          statusNovo: StatusChamado.FINALIZADO,
          autorNome: `${nomeTec} • Empresa Prestadora`,
          mensagem: mensagemHistorico,
        },
      });

      return { chamadoAtualizado, intervencaoAtualizada, eqAtualizado };
    });

    return NextResponse.json({
      success: true,
      mensagem: `Equipamento Tombo ${equipamentoTombo} condenado com sucesso. Status alterado para BAIXADO_INSERVIVEL e Laudo Oficial em PDF disponibilizado para o demandante.`,
      chamado: resultado.chamadoAtualizado,
      intervencao: resultado.intervencaoAtualizada,
      equipamento: resultado.eqAtualizado,
    });
  } catch (error: any) {
    console.error('Erro ao condenar equipamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
