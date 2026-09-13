import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  getUserSession, setUserCookie, clearUserCookie, signUserSession,
} from '@/lib/session';
import { rateLimit } from './auth';

const BCRYPT_ROUNDS = 12;
const RESET_TTL_MINUTES = 60;

export type AccountResult = { ok: true } | { ok: false; error: string };

/* ─────────────────────────── реєстрація і вхід ──────────────────────── */

export async function registerUser(input: {
  email: string; password: string; firstName: string; lastName?: string; phone?: string;
}): Promise<AccountResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: 'Користувач з такою поштою вже зареєстрований' };

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() || null,
      phone: input.phone?.trim() || null,
    },
  });

  await setUserCookie(await signUserSession({
    sub: user.id, email: user.email, firstName: user.firstName ?? '',
  }));
  return { ok: true };
}

export async function loginUser(email: string, password: string, ip: string): Promise<AccountResult> {
  if (!rateLimit(`user-login:${ip}`, 10, 60_000)) {
    return { ok: false, error: 'Забагато спроб. Спробуйте за хвилину' };
  }
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  const generic = { ok: false as const, error: 'Невірна пошта або пароль' };
  if (!user) {
    await bcrypt.compare(password, '$2a$12$0000000000000000000000000000000000000000000000000000');
    return generic;
  }
  if (user.isBlocked) return { ok: false, error: 'Обліковий запис заблоковано. Зателефонуйте нам' };
  if (!(await bcrypt.compare(password, user.passwordHash))) return generic;

  await setUserCookie(await signUserSession({
    sub: user.id, email: user.email, firstName: user.firstName ?? '',
  }));
  return { ok: true };
}

export async function logoutUser(): Promise<void> {
  await clearUserCookie();
}

/** Поточний покупець або null. Використовується скрізь, де потрібен кабінет. */
export async function currentUser() {
  const session = await getUserSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true, email: true, firstName: true, lastName: true, phone: true,
      bonusBalance: true, isBlocked: true, createdAt: true,
    },
  });
}

export async function requireUser() {
  const user = await currentUser();
  if (!user || user.isBlocked) return null;
  return user;
}

/* ───────────────────────── відновлення пароля ───────────────────────── */

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Створює одноразовий токен. У базі зберігається лише його хеш —
 * навіть з доступом до бази посилання для входу не відновити.
 * Повертає посилання, яке треба надіслати листом.
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return null; // назовні відповідь однакова, щоб не розкривати наявність акаунта

  const raw = randomBytes(32).toString('base64url');
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
    },
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const link = `${base}/account/reset/${raw}`;

  await prisma.notification.create({
    data: {
      channel: 'email',
      recipient: user.email,
      subject: 'Відновлення пароля',
      body: `Щоб задати новий пароль, перейдіть за посиланням протягом години:\n\n${link}\n\nЯкщо ви цього не робили — просто проігноруйте лист.`,
    },
  });
  return link;
}

export async function resetPassword(rawToken: string, password: string): Promise<AccountResult> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, error: 'Посилання недійсне або застаріле. Запросіть нове' };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) },
    }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
    }),
  ]);

  await setUserCookie(await signUserSession({
    sub: record.user.id, email: record.user.email, firstName: record.user.firstName ?? '',
  }));
  return { ok: true };
}

/* ───────────────────────────── профіль ──────────────────────────────── */

export async function updateProfile(input: {
  firstName: string; lastName?: string; phone?: string;
}): Promise<AccountResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Потрібно увійти' };
  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() || null,
      phone: input.phone?.trim() || null,
    },
  });
  return { ok: true };
}

export async function changePassword(current: string, next: string): Promise<AccountResult> {
  const session = await getUserSession();
  if (!session) return { ok: false, error: 'Потрібно увійти' };
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return { ok: false, error: 'Потрібно увійти' };
  if (!(await bcrypt.compare(current, user.passwordHash))) {
    return { ok: false, error: 'Поточний пароль невірний' };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, BCRYPT_ROUNDS) },
  });
  return { ok: true };
}

/* ────────────────────────────── адреси ──────────────────────────────── */

export async function listAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { id: 'asc' }] });
}

export async function saveAddress(input: {
  id?: string; label?: string; city: string; street?: string; house?: string;
  apartment?: string; isDefault?: boolean;
}): Promise<AccountResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Потрібно увійти' };

  const data = {
    label: input.label?.trim() || null,
    city: input.city.trim(),
    street: input.street?.trim() || null,
    house: input.house?.trim() || null,
    apartment: input.apartment?.trim() || null,
    isDefault: !!input.isDefault,
  };

  await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    if (input.id) {
      const owned = await tx.address.findFirst({ where: { id: input.id, userId: user.id } });
      if (!owned) throw new Error('FOREIGN');
      await tx.address.update({ where: { id: input.id }, data });
    } else {
      const count = await tx.address.count({ where: { userId: user.id } });
      await tx.address.create({ data: { ...data, isDefault: data.isDefault || count === 0, userId: user.id } });
    }
  });
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<AccountResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Потрібно увійти' };
  const deleted = await prisma.address.deleteMany({ where: { id, userId: user.id } });
  if (deleted.count === 0) return { ok: false, error: 'Адресу не знайдено' };
  return { ok: true };
}

/* ──────────────────────── замовлення та обране ──────────────────────── */

export async function userOrders(userId: string, phone?: string | null) {
  // Замовлення прив'язуються до акаунта, а зроблені раніше без реєстрації —
  // підтягуються за номером телефону.
  return prisma.order.findMany({
    where: { OR: [{ userId }, ...(phone ? [{ phone, userId: null }] : [])] },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
    take: 50,
  });
}

export async function toggleFavorite(productId: string): Promise<{ ok: boolean; active: boolean; error?: string }> {
  const user = await requireUser();
  if (!user) return { ok: false, active: false, error: 'Увійдіть, щоб зберігати обране' };

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { userId_productId: { userId: user.id, productId } } });
    return { ok: true, active: false };
  }
  await prisma.favorite.create({ data: { userId: user.id, productId } });
  return { ok: true, active: true };
}

export async function favoriteIds(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await prisma.favorite.findMany({ where: { userId }, select: { productId: true } });
  return new Set(rows.map((r) => r.productId));
}

export async function favoriteProducts(userId: string) {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true, slug: true, name: true, sku: true, shortDescription: true,
          price: true, oldPrice: true, pricingMode: true, packWeightG: true,
          stock: true, lowStockThreshold: true, rating: true, reviewCount: true,
          isHit: true, isNew: true, meat: true, type: true,
          category: { select: { name: true, slug: true } },
          images: { select: { url: true, alt: true }, orderBy: { sortOrder: 'asc' as const }, take: 1 },
        },
      },
    },
  });
  return rows.map((r) => r.product);
}

/* ────────────────────────────── відгуки ─────────────────────────────── */

export async function submitReview(input: {
  productId: string; rating: number; text: string; authorName: string;
}): Promise<AccountResult> {
  const user = await currentUser();
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));

  if (user) {
    const already = await prisma.review.findFirst({
      where: { productId: input.productId, userId: user.id },
    });
    if (already) return { ok: false, error: 'Ви вже залишали відгук на цей товар' };
  }

  await prisma.review.create({
    data: {
      productId: input.productId,
      userId: user?.id ?? null,
      authorName: (user?.firstName || input.authorName).trim().slice(0, 60) || 'Покупець',
      rating,
      text: input.text.trim().slice(0, 1500),
      status: 'PENDING',
    },
  });
  return { ok: true };
}

/** Перерахунок рейтингу за схваленими відгуками. Викликається після модерації. */
export async function recalcProductRating(productId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { productId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewCount: agg._count._all,
    },
  });
}
