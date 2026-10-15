import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RoleUsuario } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: { unidade: true, empresa: true },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ usuario });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      nome,
      cpf,
      email,
      matricula,
      role,
      unidadeId,
      empresaId,
      ativo,
    } = body;

    const usuarioExistente = await prisma.usuario.findUnique({ where: { id } });
    if (!usuarioExistente) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (nome !== undefined) dataToUpdate.nome = nome.trim();
    if (cpf !== undefined) dataToUpdate.cpf = cpf.trim();
    if (email !== undefined) dataToUpdate.email = email.trim();
    if (matricula !== undefined) dataToUpdate.matricula = matricula?.trim() || null;
    if (role && Object.values(RoleUsuario).includes(role as RoleUsuario)) {
      dataToUpdate.role = role as RoleUsuario;
    }
    if (unidadeId !== undefined) dataToUpdate.unidadeId = unidadeId || null;
    if (empresaId !== undefined) dataToUpdate.empresaId = empresaId || null;
    if (ativo !== undefined) dataToUpdate.ativo = Boolean(ativo);

    const atualizado = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
      include: { unidade: true, empresa: true },
    });

    return NextResponse.json({
      success: true,
      mensagem: `Usuário ${atualizado.nome} atualizado com sucesso!`,
      usuario: atualizado,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            chamadosAbertos: true,
            intervencoesExecutadas: true,
            intervencoesAtestadas: true,
            medicoesAtestadas: true,
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const hasCriticalRelations =
      (usuario._count?.chamadosAbertos || 0) > 0 ||
      (usuario._count?.intervencoesExecutadas || 0) > 0 ||
      (usuario._count?.intervencoesAtestadas || 0) > 0 ||
      (usuario._count?.medicoesAtestadas || 0) > 0;

    if (hasCriticalRelations) {
      // Se possui vínculos históricos com chamados ou medições, inativa para manter integridade
      await prisma.usuario.update({
        where: { id },
        data: { ativo: false },
      });

      return NextResponse.json({
        success: true,
        mensagem: `Usuário ${usuario.nome} possui histórico no sistema e foi inativado com sucesso (status inativo).`,
        inativado: true,
      });
    }

    // Se for um usuário sem dependências críticas, remove fisicamente
    await prisma.usuario.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      mensagem: `Usuário ${usuario.nome} excluído com sucesso.`,
      excluido: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
