import 'server-only';
import { prisma } from '@/lib/prisma';
import * as liqpay from './liqpay';

/**
 * Реєстр платіжних провайдерів. Щоб додати WayForPay чи Fondy,
 * достатньо створити сусідній модуль із такими самими двома функціями
 * і зареєструвати його тут — решта коду не змінюється.
 */

export type ProviderKey = 'liqpay';

export const PROVIDERS: Record<ProviderKey, { label: string; isConfigured: () => boolean }> = {
  liqpay: { label: 'LiqPay', isConfigured: liqpay.isConfigured },
};

export function normalizeProvider(raw: string | null | undefined): ProviderKey | null {
  const key = raw?.trim().toLowerCase();
  return key && key in PROVIDERS ? (key as ProviderKey) : null;
}

/** Чи потребує спосіб оплати переходу на сторінку провайдера. */
export async function isOnlinePayment(paymentCode: string): Promise<ProviderKey | null> {
  const method = await prisma.paymentMethod.findUnique({ where: { code: paymentCode } });
  return normalizeProvider(method?.provider);
}

export type PaymentForm = { provider: ProviderKey; endpoint: string; fields: Record<string, string> };

export async function buildPaymentForm(orderNumber: string): Promise<
  { ok: true; form: PaymentForm } | { ok: false; error: string }
> {
  const order = await prisma.order.findUnique({ where: { number: orderNumber } });
  if (!order) return { ok: false, error: 'Замовлення не знайдено' };
  if (order.paymentStatus === 'PAID') return { ok: false, error: 'Замовлення вже оплачене' };

  const provider = normalizeProvider(order.paymentProvider);
  if (!provider) return { ok: false, error: 'Для цього замовлення онлайн-оплата не передбачена' };
  if (!PROVIDERS[provider].isConfigured()) {
    return { ok: false, error: 'Онлайн-оплата тимчасово недоступна. Ми зателефонуємо та узгодимо оплату' };
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const checkout = liqpay.buildCheckout({
    orderNumber: order.number,
    amount: order.total,
    description: `Замовлення ${order.number}`,
    resultUrl: `${base}/order/${order.number}`,
    serverUrl: `${base}/api/payments/liqpay`,
  });

  return {
    ok: true,
    form: {
      provider,
      endpoint: checkout.endpoint,
      fields: { data: checkout.data, signature: checkout.signature },
    },
  };
}

/** Обробка вебхука. Викликається з route handler після перевірки підпису. */
export async function applyPaymentResult(input: {
  orderNumber: string;
  outcome: 'paid' | 'failed' | 'pending';
  reference?: string;
  note?: string;
}): Promise<void> {
  const order = await prisma.order.findUnique({ where: { number: input.orderNumber } });
  if (!order) return;

  if (input.outcome === 'paid' && order.paymentStatus !== 'PAID') {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
          paymentReference: input.reference ?? null,
          status: order.status === 'NEW' ? 'CONFIRMED' : order.status,
        },
      }),
      prisma.orderStatusEvent.create({
        data: {
          orderId: order.id,
          from: order.status,
          to: order.status === 'NEW' ? 'CONFIRMED' : order.status,
          note: `Оплата підтверджена провайдером${input.reference ? ` · ${input.reference}` : ''}`,
        },
      }),
    ]);
    return;
  }

  if (input.outcome === 'failed' && order.paymentStatus === 'PENDING') {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'FAILED', paymentReference: input.reference ?? null },
    });
    await prisma.orderStatusEvent.create({
      data: { orderId: order.id, to: order.status, note: `Оплата не пройшла${input.note ? `: ${input.note}` : ''}` },
    });
  }
}
