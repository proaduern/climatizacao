import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StatusChamado } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      tecnicoNome,
      tecnicoCpf,
      tecnicoId,
      laudoTecnico,
      maquinaCondenada,
      fotosAntes,
      fotosDepois,
      observacoesConclusao,
    } = body;

    const chamado = await prisma.chamado.findUnique({
      where: { id },
      include: { contrato: true, intervencoes: true },
    });

    if (!chamado) {
      return NextResponse.json({ error: 'Chamado não encontrado.' }, { status: 404 });
    }

    const diasAteste = chamado.contrato?.diasPrazoAtesteDemandante || 5;
    const dataLimiteConfirmacao = new Date();
    dataLimiteConfirmacao.setDate(dataLimiteConfirmacao.getDate() + diasAteste);

    await prisma.$transaction(async (tx) => {
      // Atualiza as intervenções
      for (const inter of chamado.intervencoes) {
        await tx.intervencaoItem.update({
          where: { id: inter.id },
          data: {
            tecnicoExecutorId: tecnicoId || undefined,
            nomeTecnicoEmpresa: tecnicoNome || undefined,
            cpfTecnicoEmpresa: tecnicoCpf || undefined,
            laudoTecnico: laudoTecnico || undefined,
            maquinaCondenada: Boolean(maquinaCondenada),
            fotosAntesUrls: fotosAntes || ['/demo/ar_antes.jpg'],
            fotosDepoisUrls: fotosDepois || ['/demo/ar_depois.jpg'],
          },
        });
      }

      // Atualiza o chamado
      await tx.chamado.update({
        where: { id },
        data: {
          status: StatusChamado.AGUARDANDO_CONFIRMACAO,
          percentualEvolucao: 85,
          etapaAtualDescricao: 'Serviço Executado pela Empresa - Aguardando Seu Ateste Digital',
          dataExecucaoConclusao: new Date(),
          dataLimiteConfirmacao,
          atendidoNoPrazo: chamado.prazoLimiteAtendimento ? new Date() <= new Date(chamado.prazoLimiteAtendimento) : true,
        },
      });

      // Timeline event
      await tx.historicoChamado.create({
        data: {
          chamadoId: id,
          statusAnterior: chamado.status,
          statusNovo: StatusChamado.AGUARDANDO_CONFIRMACAO,
          autorNome: tecnicoNome || 'Técnico da Empresa',
          mensagem: `Execução finalizada por ${tecnicoNome || 'Técnico'} (CPF: ${tecnicoCpf || 'Registrado'}). Fotos anexadas. Aberto prazo de ${diasAteste} dias úteis para teste e ateste da unidade. ${observacoesConclusao || ''}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      mensagem: 'Comprovação de execução registrada! Aguardando ateste do demandante.',
      dataLimiteConfirmacao,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
