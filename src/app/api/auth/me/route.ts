import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      // Se não houver sessão ativa, retorna o usuário Admin padrão para conveniência
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
      });
    }

    const usuarioDb = await prisma.usuario.findUnique({
      where: { id: session.id },
      include: { unidade: true, empresa: true },
    });

    if (!usuarioDb || !usuarioDb.ativo) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
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
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
