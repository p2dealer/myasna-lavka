'use server';

import { revalidatePath } from 'next/cache';
import * as cart from '@/services/cart';

export type ActionResult = { ok: boolean; message?: string };

function refresh() {
  revalidatePath('/', 'layout');
}

export async function addToCartAction(
  productId: string,
  grams: number,
  quantity: number,
): Promise<ActionResult> {
  try {
    await cart.addItem(productId, grams, quantity);
    refresh();
    return { ok: true, message: 'Додано в кошик' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Не вдалося додати товар' };
  }
}

export async function setQuantityAction(itemId: string, quantity: number): Promise<ActionResult> {
  await cart.setItemQuantity(itemId, quantity);
  refresh();
  return { ok: true };
}

export async function setGramsAction(itemId: string, grams: number): Promise<ActionResult> {
  await cart.setItemGrams(itemId, grams);
  refresh();
  return { ok: true };
}

export async function removeItemAction(itemId: string): Promise<ActionResult> {
  await cart.removeItem(itemId);
  refresh();
  return { ok: true, message: 'Товар прибрано з кошика' };
}

export async function clearCartAction(): Promise<ActionResult> {
  await cart.clearCart();
  refresh();
  return { ok: true, message: 'Кошик очищено' };
}

export async function applyCouponAction(code: string): Promise<ActionResult> {
  const result = await cart.applyCoupon(code);
  refresh();
  return result.ok ? { ok: true, message: result.label } : { ok: false, message: result.error };
}

export async function removeCouponAction(): Promise<ActionResult> {
  await cart.removeCoupon();
  refresh();
  return { ok: true };
}
