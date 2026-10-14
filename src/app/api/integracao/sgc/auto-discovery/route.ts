import { NextRequest, NextResponse } from 'next/server';
import { syncContratoClimaFromSgc } from '@/lib/sgc-sync';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const result = await syncContratoClimaFromSgc();
    return NextResponse.json({
      success: true,
      mensagem: 'Auto-discovery e sincronização do contrato de climatização SGC concluído com sucesso!',
      contratoAtivo: result.contrato,
      sourceMode: result.sourceMode,
    });
  } catch (error: any) {
    console.error('[AUTO_DISCOVERY_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
