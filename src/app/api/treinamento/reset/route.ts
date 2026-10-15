import { NextRequest, NextResponse } from 'next/server';
const { runSeedTreinamento } = require('../../../../../prisma/seed-treinamento');

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const isTreinamento = process.env.NEXT_PUBLIC_IS_TREINAMENTO === 'true' || 
                          process.env.DATABASE_URL?.includes('treinamento') ||
                          request.headers.get('x-modo-treinamento') === 'true';

    // Se estiver explicitamente em produção sem flag de treino, bloqueia
    if (process.env.NODE_ENV === 'production' && !isTreinamento && !process.env.DATABASE_URL?.includes('treinamento')) {
      return NextResponse.json(
        { error: 'Ação bloqueada: o reset só pode ser executado em ambiente de treinamento.' },
        { status: 403 }
      );
    }

    console.log('[API Treinamento] Iniciando reset didático on-demand...');
    await runSeedTreinamento();

    return NextResponse.json({
      success: true,
      mensagem: 'Ambiente de treinamento resetado com sucesso! Dados didáticos e chamados de teste restaurados para a nova turma.',
      resumo: {
        unidades: 5,
        ambientes: 8,
        maquinas: 6,
        contrato: '88/2026-TREINO',
        usuariosDidaticos: 5,
        chamadosDemonstrativos: 4,
      },
    });
  } catch (err: any) {
    console.error('[API Treinamento] Erro no reset:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao resetar ambiente de treinamento.' },
      { status: 500 }
    );
  }
}
