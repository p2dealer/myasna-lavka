import { SignJWT, jwtVerify } from 'jose';
import type { AdminRole } from '@prisma/client';

/**
 * Підпис і перевірка сесії. Модуль не залежить від next/headers,
 * тому працює і в middleware (Edge runtime), і в серверних компонентах.
 */

export const ADMIN_COOKIE = 'ml_admin_session';
export const USER_COOKIE = 'ml_user_session';
export const CART_COOKIE = 'ml_cart';
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 годин для адміністратора
export const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 днів для покупця

export type AdminSession = {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
};

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET має бути заданий і містити щонайменше 32 символи');
  }
  return new TextEncoder().encode(value);
}

export async function signAdminSession(payload: AdminSession): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifyAdminSession(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}

export type UserSession = {
  sub: string;
  email: string;
  firstName: string;
};

export async function signUserSession(payload: UserSession): Promise<string> {
  return new SignJWT({ email: payload.email, firstName: payload.firstName, kind: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${USER_SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifyUserSession(token: string | undefined): Promise<UserSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    if (!payload.sub || payload.kind !== 'user') return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      firstName: String(payload.firstName ?? ''),
    };
  } catch {
    return null;
  }
}
