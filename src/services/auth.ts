import 'server-only';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signAdminSession, setAdminCookie, clearAdminCookie } from '@/lib/session';

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export type LoginResult = { ok: true } | { ok: false; error: string };

/** Проста внутрішньопроцесна затримка на IP — перший бар'єр перед перебором. */
const attempts = new Map<string, { count: number; until: number }>();

export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.until < now) {
    attempts.set(key, { count: 1, until: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export async function loginAdmin(email: string, password: string, ip: string): Promise<LoginResult> {
  if (!rateLimit(`login:${ip}`, 5, 60_000)) {
    return { ok: false, error: 'Забагато спроб. Спробуйте за хвилину' };
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Той самий текст помилки для неіснуючого користувача й невірного пароля.
  const generic = { ok: false as const, error: 'Невірний email або пароль' };
  if (!admin || !admin.isActive) {
    await bcrypt.compare(password, '$2a$12$0000000000000000000000000000000000000000000000000000');
    return generic;
  }
  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return { ok: false, error: 'Обліковий запис тимчасово заблоковано. Спробуйте пізніше' };
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    const failed = admin.failedLogins + 1;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLogins: failed,
        lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    return generic;
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  const token = await signAdminSession({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
  await setAdminCookie(token);
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: 'admin.login', entity: 'AdminUser', entityId: admin.id },
  });
  return { ok: true };
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminCookie();
}
