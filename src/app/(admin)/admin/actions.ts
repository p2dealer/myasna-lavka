'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { OrderStatus, ReviewStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { adminPath, slugify } from '@/lib/utils';
import { toKopiyky } from '@/lib/money';
import { loginAdmin, logoutAdmin } from '@/services/auth';
import { changeOrderStatus } from '@/services/orders';
import { recalcProductRating } from '@/services/account';
import { saveSettings } from '@/services/settings';
import {
  categorySchema, couponSchema, fieldErrors, loginSchema, productSchema, settingsSchema,
} from '@/validation/schemas';

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string> };

function refreshAdmin() {
  revalidatePath('/admin', 'layout');
  revalidatePath('/', 'layout');
}

/* ──────────────────────────── авторизація ───────────────────────────── */

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const head = await headers();
  const ip = head.get('x-forwarded-for')?.split(',')[0]?.trim() || head.get('x-real-ip') || 'local';
  const result = await loginAdmin(parsed.data.email, parsed.data.password, ip);
  if (!result.ok) return { errors: { form: result.error } };

  const next = String(formData.get('next') || '');
  redirect(next && next.startsWith('/') ? next : adminPath());
}

export async function logoutAction(): Promise<void> {
  await logoutAdmin();
  redirect(adminPath('login'));
}

/* ───────────────────────────── замовлення ───────────────────────────── */

export async function setOrderStatusAction(orderId: string, status: OrderStatus): Promise<FormState> {
  const session = await requireAdmin('orders');
  const result = await changeOrderStatus(orderId, status, session.sub);
  refreshAdmin();
  return result.ok ? { ok: true } : { ok: false, message: result.error };
}

export async function setOrderNoteAction(orderId: string, note: string): Promise<FormState> {
  await requireAdmin('orders');
  await prisma.order.update({ where: { id: orderId }, data: { adminNote: note.slice(0, 1000) } });
  refreshAdmin();
  return { ok: true, message: 'Коментар збережено' };
}

/* ─────────────────────────────── товари ─────────────────────────────── */

function toProductData(input: Record<string, unknown>) {
  const v = input as Record<string, string | number | boolean | undefined>;
  return {
    name: String(v.name),
    sku: String(v.sku),
    categoryId: String(v.categoryId),
    meat: String(v.meat),
    type: String(v.type),
    pricingMode: v.pricingMode as never,
    price: toKopiyky(v.price as number),
    oldPrice: v.oldPrice ? toKopiyky(v.oldPrice as number) : null,
    costPrice: v.costPrice ? toKopiyky(v.costPrice as number) : null,
    packWeightG: v.packWeightG ? Number(v.packWeightG) : null,
    stock: Number(v.stock ?? 0),
    lowStockThreshold: Number(v.lowStockThreshold ?? 0),
    shortDescription: (v.shortDescription as string) || null,
    description: (v.description as string) || null,
    composition: (v.composition as string) || null,
    origin: (v.origin as string) || null,
    producer: (v.producer as string) || null,
    storageConditions: (v.storageConditions as string) || null,
    shelfLifeDays: v.shelfLifeDays ? Number(v.shelfLifeDays) : null,
    kcal: v.kcal ? Number(v.kcal) : null,
    protein: v.protein ? Number(v.protein) : null,
    fat: v.fat ? Number(v.fat) : null,
    seoTitle: (v.seoTitle as string) || null,
    seoDescription: (v.seoDescription as string) || null,
    isActive: !!v.isActive,
    isHit: !!v.isHit,
    isNew: !!v.isNew,
    isRecommended: !!v.isRecommended,
  };
}

export async function saveProductAction(
  productId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireAdmin('products');
  const raw = Object.fromEntries(formData.entries());
  const normalized = {
    ...raw,
    isActive: formData.get('isActive') === 'on',
    isHit: formData.get('isHit') === 'on',
    isNew: formData.get('isNew') === 'on',
    isRecommended: formData.get('isRecommended') === 'on',
  };
  const parsed = productSchema.safeParse(normalized);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const data = toProductData(parsed.data as unknown as Record<string, unknown>);
  const slug = (parsed.data.slug && slugify(parsed.data.slug)) || slugify(parsed.data.name);
  const imageUrl = parsed.data.imageUrl?.trim();
  let savedId = productId;

  try {
    if (productId) {
      const before = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
      await prisma.product.update({ where: { id: productId }, data: { ...data, slug } });
      if (before && before.stock !== data.stock) {
        await prisma.inventoryMovement.create({
          data: { productId, delta: data.stock - before.stock, reason: 'MANUAL', note: 'Правка в адмінці' },
        });
      }
      if (imageUrl) {
        await prisma.productImage.deleteMany({ where: { productId, isPrimary: true } });
        await prisma.productImage.create({
          data: { productId, url: imageUrl, alt: data.name, isPrimary: true, sortOrder: 0 },
        });
      }
      await prisma.auditLog.create({
        data: { actorId: session.sub, action: 'product.update', entity: 'Product', entityId: productId },
      });
    } else {
      const created = await prisma.product.create({
        data: {
          ...data,
          slug,
          images: {
            create: [{ url: imageUrl || '/api/img/ribeye/beef/1', alt: data.name, isPrimary: true, sortOrder: 0 }],
          },
        },
      });
      await prisma.inventoryMovement.create({
        data: { productId: created.id, delta: data.stock, reason: 'RESTOCK', note: 'Створення товару' },
      });
      await prisma.auditLog.create({
        data: { actorId: session.sub, action: 'product.create', entity: 'Product', entityId: created.id },
      });
      savedId = created.id;
    }
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Товар із таким артикулом або адресою вже існує'
        : 'Не вдалося зберегти товар';
    return { errors: { form: message } };
  }

  refreshAdmin();
  if (savedId) redirect(adminPath('products'));
  return { ok: true };
}

export async function toggleProductAction(productId: string, isActive: boolean): Promise<FormState> {
  await requireAdmin('products');
  await prisma.product.update({ where: { id: productId }, data: { isActive } });
  refreshAdmin();
  return { ok: true, message: isActive ? 'Товар опубліковано' : 'Товар прихований' };
}

export async function duplicateProductAction(productId: string): Promise<FormState> {
  await requireAdmin('products');
  const source = await prisma.product.findUnique({ where: { id: productId }, include: { images: true } });
  if (!source) return { ok: false, message: 'Товар не знайдено' };

  const { id: _id, createdAt: _c, updatedAt: _u, images, slug, sku, name, ...rest } = source;
  const suffix = Date.now().toString().slice(-4);
  await prisma.product.create({
    data: {
      ...rest,
      name: `${name} (копія)`,
      slug: `${slug}-kopiia-${suffix}`,
      sku: `${sku}-K${suffix}`,
      isActive: false,
      images: {
        create: images.map((img) => ({
          url: img.url, alt: img.alt, sortOrder: img.sortOrder, isPrimary: img.isPrimary,
        })),
      },
    },
  });
  refreshAdmin();
  return { ok: true, message: 'Копію створено — вона прихована, доки ви її не опублікуєте' };
}

export async function deleteProductAction(productId: string): Promise<FormState> {
  const session = await requireAdmin('products');
  const used = await prisma.orderItem.count({ where: { productId } });
  if (used > 0) {
    await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
    refreshAdmin();
    return { ok: true, message: 'Товар є в замовленнях, тому його приховано, а не видалено' };
  }
  await prisma.product.delete({ where: { id: productId } });
  await prisma.auditLog.create({
    data: { actorId: session.sub, action: 'product.delete', entity: 'Product', entityId: productId },
  });
  refreshAdmin();
  return { ok: true, message: 'Товар видалено' };
}

/* ────────────────────────────── відгуки ─────────────────────────────── */

export async function moderateReviewAction(reviewId: string, status: ReviewStatus): Promise<FormState> {
  const session = await requireAdmin('products');
  const review = await prisma.review.update({ where: { id: reviewId }, data: { status } });
  await recalcProductRating(review.productId);
  await prisma.auditLog.create({
    data: { actorId: session.sub, action: 'review.moderate', entity: 'Review', entityId: reviewId, details: status },
  });
  refreshAdmin();
  return {
    ok: true,
    message: status === 'APPROVED' ? 'Відгук опубліковано' : status === 'REJECTED' ? 'Відгук відхилено' : 'Повернуто на модерацію',
  };
}

/* ────────────────────────────── категорії ───────────────────────────── */

export async function saveCategoryAction(
  categoryId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin('categories');
  const parsed = categorySchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    isActive: formData.get('isActive') === 'on',
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const data = {
    name: parsed.data.name,
    slug: (parsed.data.slug && slugify(parsed.data.slug)) || slugify(parsed.data.name),
    description: parsed.data.description || null,
    parentId: parsed.data.parentId || null,
    sortOrder: parsed.data.sortOrder ?? 0,
    isActive: parsed.data.isActive ?? true,
  };

  try {
    if (categoryId) {
      await prisma.category.update({ where: { id: categoryId }, data });
    } else {
      await prisma.category.create({ data });
    }
  } catch {
    return { errors: { form: 'Категорія з такою адресою вже існує' } };
  }
  refreshAdmin();
  return { ok: true, message: 'Категорію збережено' };
}

export async function deleteCategoryAction(categoryId: string): Promise<FormState> {
  await requireAdmin('categories');
  const count = await prisma.product.count({ where: { categoryId } });
  if (count > 0) return { ok: false, message: `У категорії ${count} товарів — спочатку перенесіть їх` };
  await prisma.category.delete({ where: { id: categoryId } });
  refreshAdmin();
  return { ok: true, message: 'Категорію видалено' };
}

/* ────────────────────────────── промокоди ───────────────────────────── */

export async function saveCouponAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin('marketing');
  const parsed = couponSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    isActive: formData.get('isActive') === 'on',
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const d = parsed.data;
  const data = {
    code: d.code.toUpperCase(),
    type: d.type,
    value: d.type === 'FIXED' ? toKopiyky(d.value) : Math.round(d.value),
    minOrderTotal: d.minOrderTotal ? toKopiyky(d.minOrderTotal) : 0,
    usageLimit: d.usageLimit ? Number(d.usageLimit) : null,
    startsAt: d.startsAt ? new Date(d.startsAt) : null,
    endsAt: d.endsAt ? new Date(d.endsAt) : null,
    isActive: d.isActive ?? true,
  };

  try {
    await prisma.coupon.upsert({ where: { code: data.code }, create: data, update: data });
  } catch {
    return { errors: { form: 'Не вдалося зберегти промокод' } };
  }
  refreshAdmin();
  return { ok: true, message: `Промокод ${data.code} збережено` };
}

export async function toggleCouponAction(couponId: string, isActive: boolean): Promise<FormState> {
  await requireAdmin('marketing');
  await prisma.coupon.update({ where: { id: couponId }, data: { isActive } });
  refreshAdmin();
  return { ok: true };
}

/* ──────────────────────────── налаштування ──────────────────────────── */

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin('settings');
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { freeShippingFrom, minOrderTotal, ...rest } = parsed.data;
  await saveSettings({
    ...rest,
    freeShippingFrom: toKopiyky(freeShippingFrom),
    minOrderTotal: toKopiyky(minOrderTotal),
  });
  refreshAdmin();
  return { ok: true, message: 'Налаштування збережено — сайт уже працює з новими значеннями' };
}

export async function saveDeliveryAction(id: string, formData: FormData): Promise<FormState> {
  await requireAdmin('settings');
  await prisma.deliveryMethod.update({
    where: { id },
    data: {
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? ''),
      price: toKopiyky(String(formData.get('price') ?? '0')),
      isActive: formData.get('isActive') === 'on',
    },
  });
  refreshAdmin();
  return { ok: true, message: 'Спосіб доставки оновлено' };
}

export async function adjustStockAction(productId: string, delta: number, note: string): Promise<FormState> {
  await requireAdmin('inventory');
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
  if (!product) return { ok: false, message: 'Товар не знайдено' };
  const next = Math.max(0, product.stock + delta);
  await prisma.$transaction([
    prisma.product.update({ where: { id: productId }, data: { stock: next } }),
    prisma.inventoryMovement.create({
      data: { productId, delta: next - product.stock, reason: delta > 0 ? 'RESTOCK' : 'WRITE_OFF', note },
    }),
  ]);
  refreshAdmin();
  return { ok: true, message: 'Залишок оновлено' };
}
