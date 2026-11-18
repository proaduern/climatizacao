import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || 'uern_climatizacao_secret_key_proad_2026_super_seguro';
const SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = 'clima_uern_session';
const SERVICE_KEY =
  process.env.PROAD_SERVICE_KEY || 'proad_interop_internal_service_key_2026_uern';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/api/auth/sso-callback') ||
    pathname.startsWith('/api/auth/me')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let sessionValid = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      sessionValid = true;
    } catch {
      sessionValid = false;
    }
  }

  // Rotas de integração/cron exigem Chave de Serviço PROAD OU Sessão ativa
  if (
    pathname.startsWith('/api/integracao/') ||
    pathname === '/api/chamados/cron-tacito' ||
    pathname === '/api/treinamento/reset'
  ) {
    const authHeader = request.headers.get('authorization');
    if (sessionValid || (authHeader && authHeader === `Bearer ${SERVICE_KEY}`)) {
      return NextResponse.next();
    }
    return NextResponse.json(
      { error: 'Não autorizado. Sessão ou chave de serviço PROAD obrigatória.' },
      { status: 401 }
    );
  }

  // Todas as demais rotas /api/* exigem sessão JWT válida
  if (pathname.startsWith('/api/')) {
    if (!sessionValid) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login pelo Portal PROAD.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (pathname === '/login') {
    if (sessionValid) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!sessionValid) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
