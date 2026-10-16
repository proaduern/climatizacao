import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { COOKIE_NAME, SESSION_MAX_AGE, createSessionToken } from '@/lib/auth';
import { RoleUsuario } from '@prisma/client';

export const dynamic = 'force-dynamic';

const SECRET_KEYS: Uint8Array[] = [
  process.env.PROAD_SSO_SECRET,
  process.env.JWT_SECRET,
  'uern_portal_proad_sso_master_key_2026_super_seguro',
  'uern_climatizacao_secret_key_proad_2026_super_seguro',
]
  .filter((k): k is string => Boolean(k && k.trim()))
  .map((k) => new TextEncoder().encode(k.trim()));

async function verificarTokenComFallback(token: string) {
  let ultimoErro: any = null;
  for (const secretKey of SECRET_KEYS) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      return payload;
    } catch (err) {
      ultimoErro = err;
    }
  }
  throw ultimoErro || new Error('Falha ao verificar assinatura JWT do token SSO.');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=token_ausente', request.url));
    }

    const payload = await verificarTokenComFallback(token);
    const { email, nome, matricula, role, targetSystem, unidadeSigla, cnpjEmpresa, razaoSocial } = payload as {
      userId?: string;
      email: string;
      nome: string;
      matricula?: string;
      role?: string;
      targetSystem: string;
      unidadeSigla?: string;
      cnpjEmpresa?: string;
      razaoSocial?: string;
    };

    if (targetSystem !== 'CLIMATIZACAO' && targetSystem !== 'MANUTENCAO' && !email) {
      return NextResponse.redirect(new URL('/login?error=destino_invalido', request.url));
    }

    const emailLimpo = email.toLowerCase().trim();
    const roleUpper = (role || '').toUpperCase();

    let climaRole: RoleUsuario = RoleUsuario.DEMANDANTE;
    if (roleUpper === 'ADMIN_PROAD' || roleUpper === 'ADMIN' || emailLimpo === 'adj.proad@uern.br' || emailLimpo === 'pedroreboucas@uern.br') {
      climaRole = RoleUsuario.ADMIN;
    } else if (roleUpper === 'FISCAL_TECNICO') {
      climaRole = RoleUsuario.FISCAL_TECNICO;
    } else if (roleUpper === 'FISCAL_ADM' || roleUpper === 'FISCAL_ADMINISTRATIVO') {
      climaRole = RoleUsuario.FISCAL_ADM;
    } else if (roleUpper === 'GESTOR') {
      climaRole = RoleUsuario.GESTOR_CONTRATO;
    } else if (roleUpper === 'EMPRESA' || roleUpper === 'FORNECEDOR' || cnpjEmpresa) {
      climaRole = RoleUsuario.EMPRESA;
    }

    // 1. Unidade ou Empresa
    let unidadeId: string | null = null;
    let empresaId: string | null = null;

    if (unidadeSigla) {
      let u = await prisma.unidade.findUnique({ where: { sigla: unidadeSigla } });
      if (!u) {
        u = await prisma.unidade.create({
          data: {
            sigla: unidadeSigla,
            nome: `Unidade ${unidadeSigla}`,
            campus: 'Central Mossoró',
          },
        });
      }
      unidadeId = u.id;
    }

    if (cnpjEmpresa) {
      let emp = await prisma.empresa.findUnique({ where: { cnpj: cnpjEmpresa } });
      if (!emp) {
        emp = await prisma.empresa.create({
          data: {
            cnpj: cnpjEmpresa,
            razaoSocial: razaoSocial || 'Empresa Prestadora Clima',
          },
        });
      }
      empresaId = emp.id;
    }

    // 2. Localiza ou cria Usuário no SIG-CLIMA (por e-mail, matrícula ou CPF para evitar duplicidade)
    const cpfPayload = (payload as any).cpf as string | undefined;
    let usuarioDb = await prisma.usuario.findUnique({ where: { email: emailLimpo } });
    if (!usuarioDb && (matricula || cpfPayload)) {
      const orConditions: any[] = [];
      if (matricula) orConditions.push({ matricula });
      if (cpfPayload && cpfPayload !== '000.000.000-00') orConditions.push({ cpf: cpfPayload });
      if (orConditions.length > 0) {
        usuarioDb = await prisma.usuario.findFirst({ where: { OR: orConditions } });
      }
    }

    if (!usuarioDb) {
      usuarioDb = await prisma.usuario.create({
        data: {
          nome: nome || emailLimpo.split('@')[0],
          email: emailLimpo,
          cpf: cpfPayload || '000.000.000-00',
          matricula: matricula || null,
          role: climaRole,
          unidadeId,
          empresaId,
        },
      });
    } else {
      usuarioDb = await prisma.usuario.update({
        where: { id: usuarioDb.id },
        data: {
          nome: nome || usuarioDb.nome,
          email: emailLimpo,
          cpf: cpfPayload && cpfPayload !== '000.000.000-00' ? cpfPayload : usuarioDb.cpf,
          matricula: matricula || usuarioDb.matricula,
          role: climaRole,
          unidadeId: unidadeId || usuarioDb.unidadeId,
          empresaId: empresaId || usuarioDb.empresaId,
        },
      });
    }

    // 3. Cria sessão JWT
    const sessionToken = await createSessionToken({
      id: usuarioDb.id,
      nome: usuarioDb.nome,
      email: usuarioDb.email,
      cpf: usuarioDb.cpf,
      matricula: usuarioDb.matricula,
      role: usuarioDb.role,
      unidadeId: usuarioDb.unidadeId,
      unidadeSigla: unidadeSigla,
      empresaId: usuarioDb.empresaId,
    });

    const isTreino = searchParams.get('treinamento') === '1';
    const redirectTarget = isTreino ? '/?treinamento=1' : '/';
    const response = NextResponse.redirect(new URL(redirectTarget, request.url));
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (err: any) {
    console.error('Erro no callback SSO do SIG-CLIMA:', err);
    return NextResponse.redirect(new URL('/login?error=falha_sso', request.url));
  }
}
