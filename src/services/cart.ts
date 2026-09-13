import 'server-only';
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CART_COOKIE } from '@/lib/session-core';
import { lineTotal, isWeightBased } from './pricing';
import { getSettings } from './settings';

const CART_TTL_DAYS = 30;

const cartInclude = {
  coupon: true,
  items: {
    orderBy: { id: 'asc' as const },
    include: {
      product: {
        select: {
          id: true, slug: true, name: true, sku: true, price: true, oldPrice: true,
          pricingMode: true, packWeightG: true, stock: true, isActive: true,
          images: { select: { url: true, alt: true }, orderBy: { sortOrder: 'asc' as const }, take: 1 },
          category: { select: { name: true, slug: true } },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

/** Читання кошика — без побічних ефектів, придатне для серверних компонентів. */
export async function readCart(): Promise<CartWithItems | null> {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;
  return prisma.cart.findUnique({ where: { token }, include: cartInclude });
}

/** Читання або створення кошика — тільки в серверних діях та route handlers. */
export async function getOrCreateCart(): Promise<CartWithItems> {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  const expiresAt = new Date(Date.now() + CART_TTL_DAYS * 864e5);

  if (token) {
    const existing = await prisma.cart.findUnique({ where: { token }, include: cartInclude });
    if (existing) {
      if (existing.expiresAt < new Date(Date.now() + 864e5)) {
        await prisma.cart.update({ where: { id: existing.id }, data: { expiresAt } });
      }
      return existing;
    }
  }

  const fresh = randomUUID();
  const cart = await prisma.cart.create({ data: { token: fresh, expiresAt }, include: cartInclude });
  store.set(CART_COOKIE, fresh, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CART_TTL_DAYS * 86400,
  });
  return cart;
}

export type CartTotals = {
  count: number;
  subtotal: number;
  discount: number;
  discountLabel: string | null;
  deliveryFee: number;
  freeShippingFrom: number;
  freeShippingLeft: number;
  total: number;
  minOrderTotal: number;
  belowMinimum: boolean;
};

export function couponLabel(coupon: { type: string; value: number } | null | undefined): string | null {
  if (!coupon) return null;
  if (coupon.type === 'PERCENT') return `−${coupon.value} % на замовлення`;
  if (coupon.type === 'FIXED') return `−${Math.round(coupon.value / 100)} ₴`;
  return 'Безкоштовна доставка';
}

export function cartSubtotal(cart: CartWithItems | null): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + lineTotal(item.product, item.grams, item.quantity), 0);
}

export function cartCount(cart: CartWithItems | null): number {
  return cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
}

export function couponDiscount(cart: CartWithItems | null, subtotal: number): number {
  const coupon = cart?.coupon;
  if (!coupon || !coupon.isActive) return 0;
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return 0;
  if (coupon.endsAt && coupon.endsAt < now) return 0;
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return 0;
  if (subtotal < coupon.minOrderTotal) return 0;
  if (coupon.type === 'PERCENT') return Math.round((subtotal * coupon.value) / 100);
  if (coupon.type === 'FIXED') return Math.min(subtotal, coupon.value);
  return 0;
}

export async function computeTotals(
  cart: CartWithItems | null,
  deliveryPrice = 0,
): Promise<CartTotals> {
  const settings = await getSettings();
  const subtotal = cartSubtotal(cart);
  const discount = couponDiscount(cart, subtotal);
  const afterDiscount = Math.max(0, subtotal - discount);
  const freeShipping =
    cart?.coupon?.type === 'FREE_SHIPPING' || afterDiscount >= settings.freeShippingFrom;
  const deliveryFee = freeShipping ? 0 : deliveryPrice;
  return {
    count: cartCount(cart),
    subtotal,
    discount,
    discountLabel: couponLabel(cart?.coupon ?? null),
    deliveryFee,
    freeShippingFrom: settings.freeShippingFrom,
    freeShippingLeft: Math.max(0, settings.freeShippingFrom - afterDiscount),
    total: afterDiscount + deliveryFee,
    minOrderTotal: settings.minOrderTotal,
    belowMinimum: subtotal > 0 && subtotal < settings.minOrderTotal,
  };
}

export async function addItem(productId: string, grams: number, quantity: number): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, price: true, pricingMode: true, stock: true, isActive: true },
  });
  if (!product || !product.isActive) throw new Error('Товар недоступний');
  if (product.stock <= 0) throw new Error('Товару немає в наявності');

  const normalizedGrams = isWeightBased(product.pricingMode) ? Math.max(50, Math.round(grams)) : 0;
  const qty = Math.min(50, Math.max(1, Math.round(quantity)));
  const cart = await getOrCreateCart();

  await prisma.cartItem.upsert({
    where: { cartId_productId_grams: { cartId: cart.id, productId: product.id, grams: normalizedGrams } },
    create: {
      cartId: cart.id,
      productId: product.id,
      grams: normalizedGrams,
      quantity: qty,
      unitPriceSnapshot: product.price,
    },
    update: { quantity: { increment: qty }, unitPriceSnapshot: product.price },
  });
  await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
}

export async function setItemQuantity(itemId: string, quantity: number): Promise<void> {
  const cart = await readCart();
  if (!cart) return;
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) return;
  const qty = Math.round(quantity);
  if (qty <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return;
  }
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: Math.min(50, qty) } });
}

export async function setItemGrams(itemId: string, grams: number): Promise<void> {
  const cart = await readCart();
  if (!cart) return;
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) return;
  const next = Math.max(50, Math.round(grams));
  const duplicate = cart.items.find(
    (i) => i.id !== item.id && i.productId === item.productId && i.grams === next,
  );
  if (duplicate) {
    await prisma.$transaction([
      prisma.cartItem.update({
        where: { id: duplicate.id },
        data: { quantity: duplicate.quantity + item.quantity },
      }),
      prisma.cartItem.delete({ where: { id: item.id } }),
    ]);
    return;
  }
  await prisma.cartItem.update({ where: { id: item.id }, data: { grams: next } });
}

export async function removeItem(itemId: string): Promise<void> {
  const cart = await readCart();
  if (!cart) return;
  if (!cart.items.some((i) => i.id === itemId)) return;
  await prisma.cartItem.delete({ where: { id: itemId } });
}

export async function clearCart(): Promise<void> {
  const cart = await readCart();
  if (!cart) return;
  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
    prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } }),
  ]);
}

export type CouponResult = { ok: true; label: string } | { ok: false; error: string };

export async function applyCoupon(code: string): Promise<CouponResult> {
  const cart = await getOrCreateCart();
  const normalized = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!coupon || !coupon.isActive) return { ok: false, error: 'Промокод не знайдено' };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, error: 'Промокод ще не діє' };
  if (coupon.endsAt && coupon.endsAt < now) return { ok: false, error: 'Термін дії промокоду минув' };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: 'Ліміт використань промокоду вичерпано' };
  }
  const subtotal = cartSubtotal(cart);
  if (subtotal < coupon.minOrderTotal) {
    return { ok: false, error: `Промокод діє від ${Math.round(coupon.minOrderTotal / 100)} ₴` };
  }

  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: coupon.id } });
  return { ok: true, label: couponLabel(coupon) ?? 'Промокод застосовано' };
}

export async function removeCoupon(): Promise<void> {
  const cart = await readCart();
  if (!cart) return;
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
}
