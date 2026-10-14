import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusChamado, StatusEquipamento, CategoriaServico, SubtipoInstalacao, DefeitoCorretivaComum } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unidadeId = searchParams.get('unidadeId');
    const status = searchParams.get('status');
    const q = searchParams.get('q');

    const where: any = {};
    if (unidadeId) where.unidadeId = unidadeId;
    if (status) where.status = status as StatusChamado;
    if (q) {
      where.OR = [
        { numeroProtocolo: { contains: q, mode: 'insensitive' } },
        { tituloDemanda: { contains: q, mode: 'insensitive' } },
        { descricaoGeral: { contains: q, mode: 'insensitive' } },
      ];
    }

    const chamados = await prisma.chamado.findMany({
      where,
      include: {
        unidade: { select: { id: true, sigla: true, nome: true, campus: true } },
        demandante: { select: { id: true, nome: true, email: true, matricula: true } },
        empresa: { select: { id: true, razaoSocial: true, nomeFantasia: true, telefone: true } },
        intervencoes: {
          include: {
            equipamento: true,
            itensOrcamento: {
              include: { itemPreco: true },
            },
          },
        },
        historicos: {
          orderBy: { criadoEm: 'asc' },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });

    const now = new Date();

    const formatados = chamados.map((ch) => {
      // SLA Restante
      const prazoLimite = ch.prazoLimiteAtendimento ? new Date(ch.prazoLimiteAtendimento) : null;
      const slaEmHorasRestantes = prazoLimite
        ? Math.round((prazoLimite.getTime() - now.getTime()) / (1000 * 3600))
        : null;

      // Prazo de Confirmação Tácita Restante (em dias)
      const dataLimiteConfirmacao = ch.dataLimiteConfirmacao ? new Date(ch.dataLimiteConfirmacao) : null;
      const diasRestantesAteste = dataLimiteConfirmacao
        ? Math.max(0, Math.ceil((dataLimiteConfirmacao.getTime() - now.getTime()) / (1000 * 3600 * 24)))
        : null;

      return {
        ...ch,
        orcamentoValorTotal: Number(ch.orcamentoValorTotal || 0),
        slaEmHorasRestantes,
        diasRestantesAteste,
        intervencoes: ch.intervencoes.map((it) => ({
          ...it,
          valorTotalIntervencao: Number(it.valorTotalIntervencao),
          itensOrcamento: it.itensOrcamento.map((orc) => ({
            ...orc,
            valorUnitarioContratual: Number(orc.valorUnitarioContratual),
            valorTotal: Number(orc.valorTotal),
          })),
        })),
      };
    });

    return NextResponse.json({ chamados: formatados });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      unidadeId,
      demandanteId,
      tituloDemanda,
      descricaoGeral,
      urgente, // boolean
      // Modo de Intervenção:
      // tipoFluxo: 'SIMPLES' | 'SUBSTITUICAO'
      tipoFluxo,
      // Se SIMPLES:
      equipamentoId,
      categoriaServico,
      subtipoInstalacao,
      defeitoComum,
      descricaoDefeito,
      // Se SUBSTITUICAO:
      maquinaAntigaId,
      maquinaNovaId,
      destinoMaquinaRetirada,
      subtipoInstalacaoNova,
    } = body;

    if (!unidadeId || !demandanteId || !tituloDemanda) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: Unidade, Demandante e Título da Demanda.' },
        { status: 400 }
      );
    }

    // 1. Obtém o Contrato Ativo
    const contratoAtivo = await prisma.contratoClima.findFirst({
      where: { isReferenciaAtiva: true, ativo: true },
      include: { empresa: true },
    });

    if (!contratoAtivo) {
      return NextResponse.json(
        { error: 'Não há contrato de manutenção ativo no sistema. Abertura suspensa.' },
        { status: 403 }
      );
    }

    // 2. Trava Anti-Duplicidade
    const maquinasParaChecar: string[] = [];
    if (tipoFluxo === 'SUBSTITUICAO') {
      if (maquinaAntigaId) maquinasParaChecar.push(maquinaAntigaId);
      if (maquinaNovaId) maquinasParaChecar.push(maquinaNovaId);
    } else {
      if (equipamentoId) maquinasParaChecar.push(equipamentoId);
    }

    if (maquinasParaChecar.length === 0) {
      return NextResponse.json({ error: 'Nenhum equipamento selecionado para a solicitação.' }, { status: 400 });
    }

    for (const mId of maquinasParaChecar) {
      const chamadoExistente = await prisma.chamado.findFirst({
        where: {
          status: { notIn: ['FINALIZADO', 'CANCELADO'] },
          intervencoes: { some: { equipamentoId: mId } },
        },
        include: { unidade: true },
      });

      if (chamadoExistente) {
        const eq = await prisma.equipamento.findUnique({ where: { id: mId } });
        return NextResponse.json(
          {
            error: `Bloqueio Anti-Duplicidade: O equipamento Tombo ${eq?.tombo || mId} já possui o chamado ${chamadoExistente.numeroProtocolo} em andamento.`,
            chamadoDuplicadoId: chamadoExistente.id,
            protocolo: chamadoExistente.numeroProtocolo,
          },
          { status: 409 }
        );
      }
    }

    // 3. Calcula Protocolo e SLAs
    const anoAtual = new Date().getFullYear();
    const totalDoAno = await prisma.chamado.count();
    const numeroProtocolo = `CLIMA-${anoAtual}-${String(totalDoAno + 1).padStart(5, '0')}`;

    const slaHoras = urgente
      ? contratoAtivo.prazoAtendimentoHorasUrgente
      : contratoAtivo.prazoAtendimentoHorasRegular;

    const prazoLimiteAtendimento = new Date();
    prazoLimiteAtendimento.setHours(prazoLimiteAtendimento.getHours() + slaHoras);

    // 4. Criação atômica do Chamado, Intervenções e Timeline
    const novoChamado = await prisma.$transaction(async (tx) => {
      const chamado = await tx.chamado.create({
        data: {
          numeroProtocolo,
          unidadeId,
          demandanteId,
          contratoId: contratoAtivo.id,
          empresaId: contratoAtivo.empresaId,
          status: StatusChamado.ABERTO,
          percentualEvolucao: 15,
          etapaAtualDescricao: 'Chamado Aberto - Aguardando Triagem pela Empresa',
          tituloDemanda: tituloDemanda.trim(),
          descricaoGeral: descricaoGeral?.trim() || '',
          prazoLimiteAtendimento,
        },
      });

      // Cria intervenções
      if (tipoFluxo === 'SUBSTITUICAO') {
        // Intervenção 1: Desinstalação da antiga
        if (maquinaAntigaId) {
          await tx.intervencaoItem.create({
            data: {
              chamadoId: chamado.id,
              equipamentoId: maquinaAntigaId,
              categoriaServico: CategoriaServico.DESINSTALACAO,
              destinoMaquinaRetirada: destinoMaquinaRetirada || 'DEPOSITO_UNIDADE',
              descricaoDefeito: 'Desinstalação para substituição por nova máquina.',
            },
          });

          await tx.equipamento.update({
            where: { id: maquinaAntigaId },
            data: { status: StatusEquipamento.EM_MANUTENCAO },
          });
        }

        // Intervenção 2: Instalação da nova
        if (maquinaNovaId) {
          await tx.intervencaoItem.create({
            data: {
              chamadoId: chamado.id,
              equipamentoId: maquinaNovaId,
              categoriaServico: CategoriaServico.INSTALACAO,
              subtipoInstalacao: subtipoInstalacaoNova || SubtipoInstalacao.SUBSTITUINDO_MAQUINA_EXISTENTE,
              maquinaSubstituidaId: maquinaAntigaId,
              diasGarantiaConcedida: contratoAtivo.diasGarantiaPadrao,
            },
          });

          await tx.equipamento.update({
            where: { id: maquinaNovaId },
            data: { status: StatusEquipamento.EM_MANUTENCAO },
          });
        }
      } else {
        // Intervenção Simples
        const eqDb = await tx.equipamento.findUnique({ where: { id: equipamentoId } });
        const emGarantia = eqDb?.emGarantiaAte && new Date(eqDb.emGarantiaAte) > new Date();

        await tx.intervencaoItem.create({
          data: {
            chamadoId: chamado.id,
            equipamentoId,
            categoriaServico: emGarantia ? CategoriaServico.REPARO_GARANTIA : (categoriaServico || CategoriaServico.MANUTENCAO_CORRETIVA),
            subtipoInstalacao: subtipoInstalacao || null,
            defeitoComum: defeitoComum || null,
            descricaoDefeito: descricaoDefeito || null,
            emGarantia: Boolean(emGarantia),
            diasGarantiaConcedida: contratoAtivo.diasGarantiaPadrao,
          },
        });

        await tx.equipamento.update({
          where: { id: equipamentoId },
          data: { status: StatusEquipamento.EM_MANUTENCAO },
        });
      }

      // Primeiro evento da Timeline
      const usuarioCriador = await tx.usuario.findUnique({ where: { id: demandanteId } });
      await tx.historicoChamado.create({
        data: {
          chamadoId: chamado.id,
          statusAnterior: null,
          statusNovo: StatusChamado.ABERTO,
          autorId: demandanteId,
          autorNome: usuarioCriador?.nome || 'Servidor Demandante',
          mensagem: `Chamado registrado com sucesso. SLA para atendimento: ${slaHoras} horas úteis.`,
        },
      });

      return chamado;
    });

    return NextResponse.json({
      success: true,
      mensagem: `Chamado ${novoChamado.numeroProtocolo} registrado com sucesso!`,
      chamado: novoChamado,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
