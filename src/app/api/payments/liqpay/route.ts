import { NextResponse } from 'next/server';
import { verifyCallback, callbackOutcome } from '@/services/payments/liqpay';
import { applyPaymentResult } from '@/services/payments';

/**
 * Вебхук LiqPay. Ніколи не довіряємо тілу запиту без перевірки підпису —
 * інакше будь-хто міг би позначити чуже замовлення оплаченим.
 */
export async function POST(request: Request) {
  let data = '';
  let signature = '';

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as Record<string, string>;
    data = body.data ?? '';
    signature = body.signature ?? '';
  } else {
    const form = await request.formData();
    data = String(form.get('data') ?? '');
    signature = String(form.get('signature') ?? '');
  }

  const payload = verifyCallback(data, signature);
  if (!payload) {
    console.warn('LiqPay: підпис не збігся, запит відхилено');
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!payload.order_id) return NextResponse.json({ ok: false }, { status: 400 });

  await applyPaymentResult({
    orderNumber: payload.order_id,
    outcome: callbackOutcome(payload.status),
    reference: payload.transaction_id ? String(payload.transaction_id) : undefined,
    note: payload.err_description,
  });

  return NextResponse.json({ ok: true });
}
