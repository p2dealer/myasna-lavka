'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import * as account from '@/services/account';
import { addItem } from '@/services/cart';
import { prisma } from '@/lib/prisma';
import {
  addressSchema, changePasswordSchema, fieldErrors, profileSchema, registerSchema,
  resetPasswordSchema, resetRequestSchema, reviewSchema, userLoginSchema,
} from '@/validation/schemas';

export type AccountState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

async function clientIp(): Promise<string> {
  const head = await headers();
  return head.get('x-forwarded-for')?.split(',')[0]?.trim() || head.get('x-real-ip') || 'local';
}

function refresh() {
  revalidatePath('/', 'layout');
}

/* ─────────────────────────── вхід і реєстрація ──────────────────────── */

export async function registerAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  const result = await account.registerUser(parsed.data);
  if (!result.ok) return { errors: { form: result.error }, values: raw };

  refresh();
  redirect('/account');
}

export async function loginUserAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = userLoginSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  const result = await account.loginUser(parsed.data.email, parsed.data.password, await clientIp());
  if (!result.ok) return { errors: { form: result.error }, values: raw };

  refresh();
  const next = String(formData.get('next') || '');
  redirect(next.startsWith('/') ? next : '/account');
}

export async function logoutUserAction(): Promise<void> {
  await account.logoutUser();
  refresh();
  redirect('/');
}

export async function requestResetAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const parsed = resetRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const link = await account.requestPasswordReset(parsed.data.email);
  // Відповідь однакова незалежно від того, чи існує акаунт.
  return {
    ok: true,
    message: 'Якщо такий акаунт існує, ми надіслали лист із посиланням для зміни пароля.',
    // У режимі розробки, поки не підключено поштовий сервіс, показуємо посилання одразу.
    values: link && process.env.NODE_ENV !== 'production' ? { devLink: link } : undefined,
  };
}

export async function resetPasswordAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await account.resetPassword(parsed.data.token, parsed.data.password);
  if (!result.ok) return { errors: { form: result.error } };

  refresh();
  redirect('/account');
}

/* ──────────────────────────────── профіль ───────────────────────────── */

export async function updateProfileAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await account.updateProfile(parsed.data);
  if (!result.ok) return { errors: { form: result.error } };
  refresh();
  return { ok: true, message: 'Профіль збережено' };
}

export async function changePasswordAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await account.changePassword(parsed.data.current, parsed.data.password);
  if (!result.ok) return { errors: { form: result.error } };
  return { ok: true, message: 'Пароль змінено' };
}

/* ─────────────────────────────── адреси ─────────────────────────────── */

export async function saveAddressAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const parsed = addressSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    isDefault: formData.get('isDefault') === 'on',
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await account.saveAddress(parsed.data);
  if (!result.ok) return { errors: { form: result.error } };
  revalidatePath('/account/addresses');
  return { ok: true, message: 'Адресу збережено' };
}

export async function deleteAddressAction(id: string): Promise<AccountState> {
  const result = await account.deleteAddress(id);
  revalidatePath('/account/addresses');
  return result.ok ? { ok: true, message: 'Адресу видалено' } : { ok: false, message: result.error };
}

/* ──────────────────────── обране, повтор, відгуки ───────────────────── */

export async function toggleFavoriteAction(productId: string): Promise<{ ok: boolean; active: boolean; error?: string }> {
  const result = await account.toggleFavorite(productId);
  if (result.ok) revalidatePath('/account/favorites');
  return result;
}

export async function repeatOrderAction(orderId: string): Promise<AccountState> {
  const user = await account.requireUser();
  if (!user) return { ok: false, message: 'Потрібно увійти' };

  const order = await prisma.order.findFirst({
    where: { id: orderId, OR: [{ userId: user.id }, { phone: user.phone ?? '__none__' }] },
    include: { items: true },
  });
  if (!order) return { ok: false, message: 'Замовлення не знайдено' };

  let added = 0;
  const skipped: string[] = [];
  for (const item of order.items) {
    if (!item.productId) { skipped.push(item.nameSnapshot); continue; }
    try {
      await addItem(item.productId, item.grams, item.quantity);
      added += 1;
    } catch {
      skipped.push(item.nameSnapshot);
    }
  }

  refresh();
  if (added === 0) return { ok: false, message: 'Жодної позиції зараз немає в наявності' };
  return {
    ok: true,
    message: skipped.length
      ? `Додано ${added} позицій. Немає в наявності: ${skipped.join(', ')}`
      : 'Усі позиції додано в кошик',
  };
}

export async function submitReviewAction(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  const result = await account.submitReview({
    productId: parsed.data.productId,
    rating: parsed.data.rating,
    text: parsed.data.text,
    authorName: parsed.data.authorName ?? 'Покупець',
  });
  if (!result.ok) return { errors: { form: result.error }, values: raw };

  return { ok: true, message: 'Дякуємо! Відгук з’явиться після перевірки модератором.' };
}
