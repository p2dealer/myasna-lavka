import 'server-only';
import type { AdminRole } from '@prisma/client';
import { getAdminSession, type AdminSession } from './session';

/**
 * Права за ролями. Перевірка виконується на сервері при кожній дії —
 * прихований URL сам по собі нічого не захищає.
 */
export const PERMISSIONS = {
  OWNER: ['orders', 'products', 'categories', 'customers', 'marketing', 'inventory', 'settings', 'staff'],
  MANAGER: ['orders', 'customers', 'inventory', 'products'],
  CONTENT: ['products', 'categories', 'marketing'],
} satisfies Record<AdminRole, string[]>;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS][number];

export function can(role: AdminRole, permission: string): boolean {
  return (PERMISSIONS[role] as readonly string[]).includes(permission);
}

export class ForbiddenError extends Error {
  constructor(permission: string) {
    super(`Недостатньо прав для дії «${permission}»`);
    this.name = 'ForbiddenError';
  }
}

/** Повертає сесію або кидає помилку. Викликається у кожній серверній дії адмінки. */
export async function requireAdmin(permission?: string): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error('UNAUTHENTICATED');
  if (permission && !can(session.role, permission)) throw new ForbiddenError(permission);
  return session;
}
