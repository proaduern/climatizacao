import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { cidade, campus, nome, sigla, ativo } = body;

    const unidadeExistente = await prisma.unidade.findUnique({
      where: { id },
    });

    if (!unidadeExistente) {
      return NextResponse.json({ error: 'Unidade não encontrada.' }, { status: 404 });
    }

    const data: any = {};
    if (cidade !== undefined) data.cidade = cidade.trim();
    if (campus !== undefined) data.campus = campus.trim();
    if (nome !== undefined) data.nome = nome.trim();
    if (sigla !== undefined) data.sigla = sigla.trim();
    if (ativo !== undefined) data.ativo = Boolean(ativo);

    const atualizada = await prisma.unidade.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { ambientes: true, equipamentos: true, chamados: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      mensagem: `Unidade ${atualizada.sigla} atualizada com sucesso para a cidade "${atualizada.cidade}".`,
      unidade: atualizada,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
