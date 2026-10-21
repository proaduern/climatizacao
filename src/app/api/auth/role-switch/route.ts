import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, setSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas Administradores autenticados podem alternar perfil de sessão.' },
        { status: 403 }
      );
    }

    const { targetEmail } = await request.json();

    if (!targetEmail) {
      return NextResponse.json({ error: 'E-mail alvo é obrigatório.' }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: targetEmail },
      include: { unidade: true, empresa: true },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    await setSessionCookie({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cpf: usuario.cpf,
      matricula: usuario.matricula,
      role: usuario.role,
      unidadeId: usuario.unidadeId,
      unidadeSigla: usuario.unidade?.sigla,
      unidadeNome: usuario.unidade?.nome,
      empresaId: usuario.empresaId,
      empresaRazaoSocial: usuario.empresa?.razaoSocial,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        role: usuario.role,
        email: usuario.email,
        unidadeSigla: usuario.unidade?.sigla,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
