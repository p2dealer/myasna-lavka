import 'server-only';
import { cookies } from 'next/headers';
import {
  ADMIN_COOKIE, CART_COOKIE, USER_COOKIE, SESSION_MAX_AGE, USER_SESSION_MAX_AGE,
  signAdminSession, verifyAdminSession, signUserSession, verifyUserSession,
  type AdminSession, type UserSession,
} from './session-core';

export {
  ADMIN_COOKIE, CART_COOKIE, USER_COOKIE,
  signAdminSession, verifyAdminSession, signUserSession, verifyUserSession,
};
export type { AdminSession, UserSession };

export async function setAdminCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifyAdminSession(store.get(ADMIN_COOKIE)?.value);
}

export async function setUserCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: USER_SESSION_MAX_AGE,
  });
}

export async function clearUserCookie(): Promise<void> {
  const store = await cookies();
  store.delete(USER_COOKIE);
}

export async function getUserSession(): Promise<UserSession | null> {
  const store = await cookies();
  return verifyUserSession(store.get(USER_COOKIE)?.value);
}
