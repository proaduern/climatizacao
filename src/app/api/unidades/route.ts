import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function inferirCidade(campus?: string | null, sigla?: string | null, nome?: string | null): string {
  const texto = `${campus || ''} ${sigla || ''} ${nome || ''}`.toLowerCase();
  if (texto.includes('assú') || texto.includes('assu')) return 'Assú';
  if (texto.includes('caicó') || texto.includes('caico')) return 'Caicó';
  if (texto.includes('natal')) return 'Natal';
  if (texto.includes('patu')) return 'Patu';
  if (texto.includes('pau dos ferros') || texto.includes('pau-ferros')) return 'Pau dos Ferros';
  return 'Mossoró';
}

let lastPortalSyncAt = 0;
const SYNC_TTL_MS = 10 * 60 * 1000; // 10 minutos de cache entre sincronizações

async function syncUnidadesFromPortal() {
  const now = Date.now();
  if (now - lastPortalSyncAt < SYNC_TTL_MS) return;

  try {
    const [portalUnidades, climaUnidades] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ sigla: string; nome: string; campus: string; ativo: boolean }>>(
        'SELECT sigla, nome, campus, ativo FROM portal.portal_unidades WHERE ativo = true ORDER BY sigla ASC'
      ),
      prisma.unidade.findMany({ select: { sigla: true, nome: true, campus: true, ativo: true } }),
    ]);

    if (portalUnidades && portalUnidades.length > 0) {
      const climaMap = new Map(climaUnidades.map((u) => [u.sigla, u]));
      for (const pu of portalUnidades) {
        const atual = climaMap.get(pu.sigla);
        if (!atual || atual.nome !== pu.nome || atual.campus !== pu.campus || !atual.ativo) {
          const cidade = inferirCidade(pu.campus, pu.sigla, pu.nome);
          await prisma.unidade.upsert({
            where: { sigla: pu.sigla },
            update: {
              nome: pu.nome,
              campus: pu.campus,
              ativo: true,
            },
            create: {
              sigla: pu.sigla,
              nome: pu.nome,
              campus: pu.campus,
              cidade,
              ativo: true,
            },
          });
        }
      }
      lastPortalSyncAt = now;
    }
  } catch (e) {
    // Caso o schema portal não esteja acessível, mantém unidades locais
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cidade = searchParams.get('cidade');

    await syncUnidadesFromPortal();

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
      orderBy: [{ sigla: 'asc' }],
    });

    const cidadesUnicas = Array.from(new Set(unidades.map((u) => u.cidade).filter(Boolean)));

    return NextResponse.json({ unidades, cidades: cidadesUnicas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
