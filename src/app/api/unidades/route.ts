import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cidade = searchParams.get('cidade');

    const where: any = { ativo: true };
    if (cidade && cidade !== 'TODOS') {
      where.cidade = cidade;
    }

    const unidades = await prisma.unidade.findMany({
      where,
      include: {
        _count: {
          select: {
            ambientes: true,
            equipamentos: true,
            chamados: true,
          },
        },
      },
      orderBy: [{ cidade: 'asc' }, { sigla: 'asc' }],
    });

    const cidadesUnicas = Array.from(new Set(unidades.map((u) => u.cidade).filter(Boolean)));

    return NextResponse.json({ unidades, cidades: cidadesUnicas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
