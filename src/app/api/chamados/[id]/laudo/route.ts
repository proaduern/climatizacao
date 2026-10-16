import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusChamado } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      acao, // 'SUBMETER_LAUDO' | 'EXECUTAR_DIRETO' | 'APROVAR_LAUDO' | 'REJEITAR_LAUDO' | 'DESPACHAR_SOBE' | 'EMITIR_PARECER_SOBE' | 'AUTORIZAR_CHAMADO'
      // Dados do Laudo (Empresa)
      motivoRequerAprovacao, // 'ALTA_COMPLEXIDADE' | 'CUSTO_ELEVADO' | 'INFRAESTRUTURA' | 'OUTRO'
      laudoTexto,
      custoEstimado,
      anexos,
      tecnicoNome,
      tecnicoCpf,
      // Dados do Despacho (Fiscal)
      duvidaEngenharia,
      fiscalNome,
      motivoRejeicao,
      // Dados do Parecer (Engenharia - SOBE)
      parecerTexto,
      parecerFavoravel, // boolean
      engenheiroNome,
      engenheiroMatricula,
    } = body;

    const chamado = await prisma.chamado.findUnique({
      where: { id },
      include: {
        contrato: true,
        unidade: true,
        intervencoes: { include: { equipamento: true } },
      },
    });

    if (!chamado) {
      return NextResponse.json({ error: 'Chamado não encontrado.' }, { status: 404 });
    }

    const agora = new Date();

    // 0. FISCAL: AUTORIZAR CHAMADO (Passo 2 do Fluxograma: Fiscal autoriza chamado para a Contratada)
    if (acao === 'AUTORIZAR_CHAMADO') {
      await prisma.$transaction(async (tx) => {
        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.EM_TRIAGEM,
            percentualEvolucao: 25,
            etapaAtualDescricao: 'Chamado Autorizado pela Fiscalização - Encaminhado à Contratada',
          },
        });

        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.EM_TRIAGEM,
            autorNome: fiscalNome || 'Fiscal Técnico UERN',
            mensagem: `TRIAGEM INICIAL: Chamado autorizado pela Fiscalização Técnica e disponibilizado para análise da empresa contratada.`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        mensagem: 'Chamado autorizado e encaminhado para a contratada com sucesso.',
      });
    }

    // 1. CONTRATADA: EXECUÇÃO DIRETA (Passo 4: Não precisa de aprovação / Manutenção simples dentro do teto)
    if (acao === 'EXECUTAR_DIRETO') {
      await prisma.$transaction(async (tx) => {
        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.APROVADO_EM_EXECUCAO,
            percentualEvolucao: 65,
            etapaAtualDescricao: 'Manutenção de Baixa Complexidade - Em Execução Direta pela Empresa',
            requerAprovacaoPrevia: false,
          },
        });

        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.APROVADO_EM_EXECUCAO,
            autorNome: tecnicoNome || 'Empresa Prestadora',
            mensagem: `TRIAGEM DA CONTRATADA: Verificada baixa complexidade e custo estimado dentro do teto contratual. Execução direta iniciada pela equipe técnica.`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        mensagem: 'Execução direta iniciada com sucesso.',
      });
    }

    // 2. CONTRATADA: SUBMETER LAUDO PRÉVIO (Passos 4 e 6: Precisa de aprovação -> Elaborar Laudo)
    if (acao === 'SUBMETER_LAUDO') {
      if (!laudoTexto || laudoTexto.trim().length < 10) {
        return NextResponse.json(
          { error: 'O Laudo Técnico Preliminar é obrigatório e deve detalhar o diagnóstico e as necessidades.' },
          { status: 400 }
        );
      }

      const valorEstimadoNum = custoEstimado ? parseFloat(custoEstimado) : null;
      const limiteContratual = Number(chamado.contrato?.limiteAprovacaoAutomatica || 1000);

      await prisma.$transaction(async (tx) => {
        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.AGUARDANDO_ANALISE_LAUDO,
            percentualEvolucao: 35,
            etapaAtualDescricao: 'Laudo Técnico Submetido - Aguardando Análise da Fiscalização Técnica',
            requerAprovacaoPrevia: true,
            motivoRequerAprovacao: motivoRequerAprovacao || 'ALTA_COMPLEXIDADE',
            laudoInicialEmpresa: laudoTexto.trim(),
            laudoInicialCustoEstimado: valorEstimadoNum,
            laudoInicialAnexos: anexos || [],
            laudoEnviadoEm: agora,
            laudoEnviadoPor: tecnicoNome || 'Empresa Prestadora',
          },
        });

        const motivoLegivel =
          motivoRequerAprovacao === 'CUSTO_ELEVADO'
            ? `Custo estimado (R$ ${valorEstimadoNum ? valorEstimadoNum.toFixed(2) : 'A definir'}) superior ao teto configurado de R$ ${limiteContratual.toFixed(2)}`
            : motivoRequerAprovacao === 'ALTA_COMPLEXIDADE'
            ? 'Alta complexidade técnica / risco à integridade do sistema'
            : motivoRequerAprovacao === 'INFRAESTRUTURA'
            ? 'Necessidade de intervenção elétrica, civil ou estrutural'
            : 'Necessidade de autorização prévia da Fiscalização Técnica';

        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.AGUARDANDO_ANALISE_LAUDO,
            autorNome: tecnicoNome || 'Empresa Prestadora',
            mensagem: `LAUDO TÉCNICO SUBMETIDO: Empresa identificou necessidade de aprovação prévia (${motivoLegivel}). Custo estimado: R$ ${valorEstimadoNum ? valorEstimadoNum.toFixed(2) : 'Não informado'}. Laudo encaminhado para análise da Fiscalização Técnica da UERN.`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        mensagem: 'Laudo técnico enviado para análise da Fiscalização Técnica com sucesso.',
      });
    }

    // 3. FISCAL: APROVAR LAUDO (Passo 8: Aprovar Laudo? -> Sim -> Passo 5: Executar Serviço)
    if (acao === 'APROVAR_LAUDO') {
      await prisma.$transaction(async (tx) => {
        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.APROVADO_EM_EXECUCAO,
            percentualEvolucao: 65,
            etapaAtualDescricao: 'Laudo Técnico Aprovado pela Fiscalização - Em Execução pela Empresa',
            decisaoLaudoFiscal: 'APROVADO',
            decisaoLaudoEm: agora,
            decisaoLaudoPor: fiscalNome || 'Fiscal Técnico UERN',
          },
        });

        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.APROVADO_EM_EXECUCAO,
            autorNome: fiscalNome || 'Fiscal Técnico UERN',
            mensagem: `LAUDO TÉCNICO APROVADO: A Fiscalização Técnica analisou o laudo/orçamento prévio e autorizou a execução do serviço pela contratada.`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        mensagem: 'Laudo técnico aprovado com sucesso! Execução liberada para a contratada.',
      });
    }

    // 4. FISCAL: REJEITAR LAUDO (Passo 8: Aprovar Laudo? -> Não -> Passo 10: Finalizar Chamado)
    if (acao === 'REJEITAR_LAUDO') {
      if (!motivoRejeicao || !motivoRejeicao.trim()) {
        return NextResponse.json({ error: 'Justificativa da não aprovação do laudo é obrigatória.' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.FINALIZADO,
            percentualEvolucao: 100,
            etapaAtualDescricao: 'Chamado Finalizado / Encerrado sem Execução (Laudo Reprovado pela Fiscalização)',
            decisaoLaudoFiscal: 'REJEITADO',
            decisaoLaudoEm: agora,
            decisaoLaudoPor: fiscalNome || 'Fiscal Técnico UERN',
            decisaoLaudoMotivo: motivoRejeicao.trim(),
            dataExecucaoConclusao: agora,
          },
        });

        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.FINALIZADO,
            autorNome: fiscalNome || 'Fiscal Técnico UERN',
            mensagem: `LAUDO REPROVADO / CHAMADO ENCERRADO: A Fiscalização Técnica não autorizou a execução do serviço. Motivo: ${motivoRejeicao.trim()}`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        mensagem: 'Laudo não aprovado e chamado encerrado pela fiscalização.',
      });
    }

    // 5. FISCAL: DESPACHAR PARA ENGENHARIA / SOBE (Passos 8 e 9: Aprovar Laudo? -> Dúvida -> Despachar para Engenharia)
    if (acao === 'DESPACHAR_SOBE') {
      if (!duvidaEngenharia || !duvidaEngenharia.trim()) {
        return NextResponse.json(
          { error: 'Descreva a dúvida técnica, pontos de atenção ou quesitos para a Superintendência de Obras e Engenharia.' },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.ENCAMINHADO_ENGENHARIA,
            percentualEvolucao: 45,
            etapaAtualDescricao: 'Despachado para Parecer da Superintendência de Obras e Engenharia (SOBE)',
            despachadoParaSobeEm: agora,
            despachoSobeMotivo: duvidaEngenharia.trim(),
            despachadoPorFiscal: fiscalNome || 'Fiscal Técnico UERN',
          },
        });

        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.ENCAMINHADO_ENGENHARIA,
            autorNome: fiscalNome || 'Fiscal Técnico UERN',
            mensagem: `CONSULTA À ENGENHARIA (SOBE): A Fiscalização Técnica despachou o chamado para manifestação da Superintendência de Obras e Engenharia. Quesitos formulados: "${duvidaEngenharia.trim()}".`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        mensagem: 'Chamado despachado com sucesso para a Superintendência de Obras e Engenharia (SOBE).',
      });
    }

    // 6. ENGENHARIA / SOBE: EMITIR E ENCAMINHAR PARECER TÉCNICO (Passos 11 e 12: Elaborar Parecer -> Encaminhar Parecer de volta ao Fiscal)
    if (acao === 'EMITIR_PARECER_SOBE') {
      if (!parecerTexto || parecerTexto.trim().length < 10) {
        return NextResponse.json(
          { error: 'O parecer técnico da Engenharia (SOBE) é obrigatório e deve conter fundamentação técnica.' },
          { status: 400 }
        );
      }

      const favoravel = parecerFavoravel !== false;

      await prisma.$transaction(async (tx) => {
        await tx.chamado.update({
          where: { id },
          data: {
            status: StatusChamado.PARECER_ENGENHARIA_EMITIDO,
            percentualEvolucao: 55,
            etapaAtualDescricao: `Parecer Técnico da SOBE Emitido (${favoravel ? 'Favorável' : 'Desfavorável / Com Restrições'}) - Aguardando Decisão Final do Fiscal`,
            parecerSobeTexto: parecerTexto.trim(),
            parecerSobeResponsavel: `${engenheiroNome || 'Engenheiro SOBE'}${engenheiroMatricula ? ` (Matrícula: ${engenheiroMatricula})` : ''}`,
            parecerSobeEm: agora,
            parecerSobeFavoravel: favoravel,
          },
        });

        await tx.historicoChamado.create({
          data: {
            chamadoId: id,
            statusAnterior: chamado.status,
            statusNovo: StatusChamado.PARECER_ENGENHARIA_EMITIDO,
            autorNome: `${engenheiroNome || 'Engenheiro SOBE'} • SOBE / UERN`,
            mensagem: `PARECER TÉCNICO EMITIDO (SOBE): Manifestação técnica ${favoravel ? 'FAVORÁVEL' : 'DESFAVORÁVEL / COM RESSALVAS'}. Parecer elaborado por ${engenheiroNome || 'Engenharia SOBE'} e encaminhado de volta para a decisão final da Fiscalização Técnica. Fundamentação: "${parecerTexto.trim()}".`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        mensagem: 'Parecer técnico emitido pela SOBE e encaminhado com sucesso para a Fiscalização Técnica.',
      });
    }

    return NextResponse.json({ error: 'Ação de laudo inválida ou não suportada.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
