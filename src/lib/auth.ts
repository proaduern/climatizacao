import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'uern_climatizacao_secret_key_proad_2026_super_seguro';
const SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const SSO_SECRET = new TextEncoder().encode(process.env.PROAD_SSO_SECRET || 'uern_portal_proad_sso_master_key_2026_super_seguro');

export const COOKIE_NAME = 'clima_uern_session';
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24 horas

export interface SessionPayload {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  matricula?: string | null;
  role: 'ADMIN' | 'DEMANDANTE' | 'EMPRESA' | 'FISCAL_TECNICO' | 'FISCAL_ADM' | 'GESTOR_CONTRATO';
  unidadeId?: string | null;
  unidadeSigla?: string | null;
  unidadeNome?: string | null;
  empresaId?: string | null;
  empresaRazaoSocial?: string | null;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function verifySsoToken(token: string): Promise<any> {
  const { payload } = await jwtVerify(token, SSO_SECRET);
  return payload;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.set(COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}
