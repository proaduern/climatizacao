import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RoleUsuario } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const where: any = {};
    if (role && Object.values(RoleUsuario).includes(role as RoleUsuario)) {
      where.role = role as RoleUsuario;
    }
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } },
        { matricula: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [usuarios, unidades, empresaAtiva, contratoAtivo] = await Promise.all([
      prisma.usuario.findMany({
        where,
        include: {
          unidade: { select: { id: true, sigla: true, nome: true, campus: true } },
          empresa: { select: { id: true, razaoSocial: true, nomeFantasia: true, cnpj: true } },
        },
        orderBy: [{ role: 'asc' }, { nome: 'asc' }],
      }),
      prisma.unidade.findMany({
        where: { ativo: true },
        orderBy: { sigla: 'asc' },
      }),
      prisma.empresa.findFirst({
        where: { ativo: true },
      }),
      prisma.contratoClima.findFirst({
        where: { isReferenciaAtiva: true },
        include: { empresa: true },
      }),
    ]);

    // Busca equipe real do SGC via banco direto para conferência
    let equipeSgc: any[] = [];
    if (contratoAtivo?.sgcContratoId) {
      try {
        equipeSgc = await prisma.$queryRaw`
          SELECT r.id, r."tipoAtuacao", r."numeroAtoDesignacao", r."idSeiAtoDesignacao", r."campusSetor",
                 u.nome, u.email, u.matricula, u.role
          FROM public.contrato_responsaveis r
          JOIN public.usuarios u ON r."userId" = u.id
          WHERE r."contratoId" = ${contratoAtivo.sgcContratoId} AND r.ativo = true
          ORDER BY r."tipoAtuacao" ASC
        `;
      } catch (e) {
        console.warn('Falha ao ler equipe SGC:', e);
      }
    }

    return NextResponse.json({
      usuarios,
      unidades,
      empresaAtiva: empresaAtiva || contratoAtivo?.empresa,
      contratoAtivo,
      equipeSgc,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome,
      cpf,
      email,
      matricula,
      role = 'EMPRESA',
      unidadeId,
      empresaId,
    } = body;

    if (!nome || !cpf) {
      return NextResponse.json(
        { error: 'Nome e CPF são obrigatórios para cadastro.' },
        { status: 400 }
      );
    }

    // Se não forneceu email para o técnico, gera um padrão limpo
    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanNome = nome.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
    const finalEmail = email?.trim() || `${cleanNome}.${cleanCpf.slice(-4)}@ecomser.com.br`;

    // Verifica se CPF ou e-mail já existem
    const existing = await prisma.usuario.findFirst({
      where: {
        OR: [
          { cpf },
          { email: finalEmail },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Já existe um usuário cadastrado com este CPF (${cpf}) ou E-mail (${finalEmail}).` },
        { status: 409 }
      );
    }

    // Se for técnico da empresa e não informou empresaId, busca a empresa do contrato ativo
    let targetEmpresaId = empresaId;
    if (role === 'EMPRESA' && !targetEmpresaId) {
      const empresaDefault = await prisma.empresa.findFirst({
        where: { ativo: true },
      });
      targetEmpresaId = empresaDefault?.id || null;
    }

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        cpf: cpf.trim(),
        email: finalEmail,
        matricula: matricula?.trim() || null,
        role: role as RoleUsuario,
        unidadeId: unidadeId || null,
        empresaId: targetEmpresaId,
        ativo: true,
      },
      include: {
        unidade: true,
        empresa: true,
      },
    });

    return NextResponse.json({
      success: true,
      mensagem: `Usuário ${novoUsuario.nome} cadastrado com sucesso!`,
      usuario: novoUsuario,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
