import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TipoAmbiente } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unidadeId = searchParams.get('unidadeId');

    const where: any = { ativo: true };
    if (unidadeId) {
      where.unidadeId = unidadeId;
    }

    const ambientes = await prisma.ambienteUnidade.findMany({
      where,
      include: {
        unidade: {
          select: { id: true, sigla: true, nome: true, campus: true, cidade: true },
        },
        equipamentos: {
          select: {
            id: true,
            tombo: true,
            tipo: true,
            marca: true,
            modelo: true,
            btus: true,
            tipoAc: true,
            litragem: true,
            qtdTorneiras: true,
            modeloGelagua: true,
            status: true,
            emGarantiaAte: true,
          },
          orderBy: { tombo: 'asc' },
        },
        _count: {
          select: {
            equipamentos: true,
            chamados: true,
          },
        },
      },
      orderBy: [{ tipo: 'asc' }, { descricaoDetalhe: 'asc' }],
    });

    const prioritarios = ['SALA_DE_AULA', 'LABORATORIO_PESQUISA_ININTERRUPTO', 'SALA_ESTUDOS_BIBLIOTECA'];

    const formatados = ambientes.map((amb) => ({
      ...amb,
      isPrioritario: prioritarios.includes(amb.tipo),
      totalMaquinas: amb.equipamentos?.length || 0,
      totalChamados: amb._count?.chamados || 0,
    }));

    return NextResponse.json({ ambientes: formatados });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { unidadeId, tipo, descricaoDetalhe, bloco } = body;

    if (!unidadeId || !tipo || !descricaoDetalhe?.trim()) {
      return NextResponse.json(
        { error: 'Unidade, Tipo de Ambiente e Detalhamento da Sala são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!Object.values(TipoAmbiente).includes(tipo as TipoAmbiente)) {
      return NextResponse.json(
        { error: 'Tipo de Ambiente inválido.' },
        { status: 400 }
      );
    }

    const descricaoLimpa = descricaoDetalhe.trim();

    // Validação estrita de não duplicidade na mesma unidade (case-insensitive)
    const ambienteDuplicado = await prisma.ambienteUnidade.findFirst({
      where: {
        unidadeId,
        descricaoDetalhe: { equals: descricaoLimpa, mode: 'insensitive' },
      },
    });

    if (ambienteDuplicado) {
      return NextResponse.json(
        {
          error: `Bloqueio de Duplicidade: Já existe o ambiente "${ambienteDuplicado.descricaoDetalhe}" cadastrado nesta unidade.`,
        },
        { status: 409 }
      );
    }

    const prioritarios = ['SALA_DE_AULA', 'LABORATORIO_PESQUISA_ININTERRUPTO', 'SALA_ESTUDOS_BIBLIOTECA'];
    const isPrioritario = prioritarios.includes(tipo);

    const ambiente = await prisma.ambienteUnidade.create({
      data: {
        unidadeId,
        tipo: tipo as TipoAmbiente,
        descricaoDetalhe: descricaoLimpa,
        bloco: bloco?.trim() || null,
        ativo: true,
      },
      include: {
        unidade: {
          select: { id: true, sigla: true, nome: true, cidade: true },
        },
        equipamentos: true,
        _count: { select: { equipamentos: true, chamados: true } },
      },
    });

    return NextResponse.json({
      success: true,
      mensagem: `Ambiente "${ambiente.descricaoDetalhe}" cadastrado com sucesso para a unidade!`,
      ambiente: {
        ...ambiente,
        isPrioritario,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
