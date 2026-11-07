import { NextRequest, NextResponse } from 'next/server';
import { getSession, obterSessaoReal } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const realSession = await obterSessaoReal();

    if (!session) {
      const adminDefault = await prisma.usuario.findFirst({
        where: { role: 'ADMIN' },
        include: { unidade: true },
      });

      if (!adminDefault) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          id: adminDefault.id,
          nome: adminDefault.nome,
          email: adminDefault.email,
          cpf: adminDefault.cpf,
          matricula: adminDefault.matricula,
          role: adminDefault.role,
          unidadeId: adminDefault.unidadeId,
          unidadeSigla: adminDefault.unidade?.sigla,
          unidadeNome: adminDefault.unidade?.nome,
        },
        realUser: {
          id: adminDefault.id,
          nome: adminDefault.nome,
          email: adminDefault.email,
          role: adminDefault.role,
        },
      });
    }

    const usuarioDb = await prisma.usuario.findUnique({
      where: { id: session.id },
      include: { unidade: true, empresa: true },
    });

    const userPayload = usuarioDb
      ? {
          id: usuarioDb.id,
          nome: usuarioDb.nome,
          email: usuarioDb.email,
          cpf: usuarioDb.cpf,
          matricula: usuarioDb.matricula,
          role: usuarioDb.role,
          unidadeId: usuarioDb.unidadeId,
          unidadeSigla: usuarioDb.unidade?.sigla,
          unidadeNome: usuarioDb.unidade?.nome,
          empresaId: usuarioDb.empresaId,
          empresaRazaoSocial: usuarioDb.empresa?.razaoSocial,
        }
      : session;

    return NextResponse.json({
      authenticated: true,
      user: userPayload,
      realUser: realSession || userPayload,
      isImpersonando: Boolean(
        realSession?.role === 'ADMIN' &&
          (session.id !== realSession.id || session.role !== realSession.role)
      ),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
