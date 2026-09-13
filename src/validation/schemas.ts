import { z } from 'zod';

const phoneRegex = /^\+?3?8?\s*\(?0\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

export const checkoutSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Вкажіть ім’я').max(60),
    lastName: z.string().trim().min(2, 'Вкажіть прізвище').max(60),
    phone: z.string().trim().regex(phoneRegex, 'Введіть номер у форматі +38 (0XX) XXX-XX-XX'),
    email: z.union([z.string().trim().email('Перевірте адресу'), z.literal('')]).optional(),
    deliveryCode: z.string().trim().min(1, 'Оберіть спосіб доставки'),
    city: z.string().trim().min(2, 'Вкажіть місто').max(80),
    street: z.string().trim().max(120).optional(),
    house: z.string().trim().max(20).optional(),
    apartment: z.string().trim().max(20).optional(),
    branch: z.string().trim().max(120).optional(),
    paymentCode: z.string().trim().min(1, 'Оберіть спосіб оплати'),
    comment: z.string().trim().max(600).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryCode === 'np' && !data.branch) {
      ctx.addIssue({ code: 'custom', path: ['branch'], message: 'Вкажіть відділення Нової Пошти' });
    }
    if (data.deliveryCode === 'courier') {
      if (!data.street) ctx.addIssue({ code: 'custom', path: ['street'], message: 'Вкажіть вулицю' });
      if (!data.house) ctx.addIssue({ code: 'custom', path: ['house'], message: 'Вкажіть будинок' });
    }
  });
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Перевірте email'),
  password: z.string().min(8, 'Пароль щонайменше 8 символів'),
});

export const productSchema = z.object({
  name: z.string().trim().min(3, 'Вкажіть назву').max(160),
  slug: z.string().trim().max(90).optional(),
  sku: z.string().trim().min(2, 'Вкажіть артикул').max(40),
  categoryId: z.string().trim().min(1, 'Оберіть категорію'),
  meat: z.enum(['beef', 'pork', 'chicken', 'turkey', 'lamb']),
  type: z.enum(['steak', 'fillet', 'mince', 'ribs', 'sausage', 'smoked', 'semi', 'bbq', 'set']),
  pricingMode: z.enum(['PER_UNIT', 'PER_PACKAGE', 'PER_100G', 'PER_KG', 'SET']),
  price: z.coerce.number().min(0.01, 'Ціна має бути більшою за нуль'),
  oldPrice: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  packWeightG: z.coerce.number().int().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(4000).optional(),
  composition: z.string().trim().max(600).optional(),
  origin: z.string().trim().max(80).optional(),
  producer: z.string().trim().max(120).optional(),
  storageConditions: z.string().trim().max(120).optional(),
  shelfLifeDays: z.coerce.number().int().min(0).max(3650).optional(),
  kcal: z.coerce.number().int().min(0).max(2000).optional(),
  protein: z.coerce.number().int().min(0).max(200).optional(),
  fat: z.coerce.number().int().min(0).max(200).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  isActive: z.coerce.boolean().optional(),
  isHit: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
  isRecommended: z.coerce.boolean().optional(),
});
export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Вкажіть назву').max(80),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional(),
  parentId: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const couponSchema = z.object({
  code: z.string().trim().min(3, 'Мінімум 3 символи').max(30),
  type: z.enum(['PERCENT', 'FIXED', 'FREE_SHIPPING']),
  value: z.coerce.number().min(0),
  minOrderTotal: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const settingsSchema = z.object({
  shopName: z.string().trim().min(2).max(60),
  tagline: z.string().trim().max(60),
  description: z.string().trim().max(300),
  phone: z.string().trim().max(40),
  email: z.string().trim().email('Перевірте email'),
  address: z.string().trim().max(160),
  workingHours: z.string().trim().max(80),
  telegram: z.string().trim().max(200),
  instagram: z.string().trim().max(200),
  facebook: z.string().trim().max(200),
  viber: z.string().trim().max(200),
  freeShippingFrom: z.coerce.number().min(0),
  minOrderTotal: z.coerce.number().min(0),
  heroTitle: z.string().trim().max(120),
  heroSubtitle: z.string().trim().max(400),
  heroCtaLabel: z.string().trim().max(40),
  footerNote: z.string().trim().max(400),
  seoTitle: z.string().trim().max(160),
  seoDescription: z.string().trim().max(300),
});

/* ─────────────────────── кабінет покупця ─────────────────────── */

const passwordField = z.string().min(8, 'Пароль щонайменше 8 символів').max(72);

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Вкажіть ім’я').max(60),
    lastName: z.string().trim().max(60).optional(),
    email: z.string().trim().email('Перевірте адресу'),
    phone: z.union([z.string().trim().regex(phoneRegex, 'Формат +38 (0XX) XXX-XX-XX'), z.literal('')]).optional(),
    password: passwordField,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Паролі не збігаються',
  });

export const userLoginSchema = z.object({
  email: z.string().trim().email('Перевірте адресу'),
  password: z.string().min(1, 'Введіть пароль'),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'Вкажіть ім’я').max(60),
  lastName: z.string().trim().max(60).optional(),
  phone: z.union([z.string().trim().regex(phoneRegex, 'Формат +38 (0XX) XXX-XX-XX'), z.literal('')]).optional(),
});

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, 'Введіть поточний пароль'),
    password: passwordField,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Паролі не збігаються',
  });

export const resetRequestSchema = z.object({
  email: z.string().trim().email('Перевірте адресу'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(10),
    password: passwordField,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Паролі не збігаються',
  });

export const addressSchema = z.object({
  id: z.string().trim().optional(),
  label: z.string().trim().max(40).optional(),
  city: z.string().trim().min(2, 'Вкажіть місто').max(80),
  street: z.string().trim().max(120).optional(),
  house: z.string().trim().max(20).optional(),
  apartment: z.string().trim().max(20).optional(),
  isDefault: z.coerce.boolean().optional(),
});

export const reviewSchema = z.object({
  productId: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1, 'Поставте оцінку').max(5),
  authorName: z.string().trim().max(60).optional(),
  text: z.string().trim().min(10, 'Напишіть хоча б кілька слів').max(1500),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
