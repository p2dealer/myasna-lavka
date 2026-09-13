import 'server-only';
import { createHash } from 'node:crypto';

/**
 * LiqPay Checkout. Обмін відбувається двома полями — data (base64 від JSON)
 * і signature (base64 від sha1(private + data + private)).
 * Приватний ключ живе тільки в змінних оточення й ніколи не потрапляє в браузер.
 */

export const LIQPAY_ENDPOINT = 'https://www.liqpay.ua/api/3/checkout';
const API_VERSION = 3;

export type LiqPayForm = { endpoint: string; data: string; signature: string };

export type LiqPayCallback = {
  status: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  transaction_id?: number | string;
  err_description?: string;
};

/** Статуси, за яких LiqPay вважає платіж успішним. */
const PAID_STATUSES = new Set(['success', 'sandbox', 'wait_accept', 'subscribed']);
const FAILED_STATUSES = new Set(['failure', 'error', 'reversed', 'expired']);

export function isConfigured(): boolean {
  return Boolean(process.env.LIQPAY_PUBLIC_KEY && process.env.LIQPAY_PRIVATE_KEY);
}

function sign(data: string): string {
  const key = process.env.LIQPAY_PRIVATE_KEY ?? '';
  return createHash('sha1').update(key + data + key).digest('base64');
}

export function buildCheckout(params: {
  orderNumber: string;
  amount: number; // копійки
  description: string;
  resultUrl: string;
  serverUrl: string;
}): LiqPayForm {
  if (!isConfigured()) throw new Error('LIQPAY_PUBLIC_KEY та LIQPAY_PRIVATE_KEY не задані');

  const payload = {
    public_key: process.env.LIQPAY_PUBLIC_KEY,
    version: API_VERSION,
    action: 'pay',
    amount: Number((params.amount / 100).toFixed(2)),
    currency: 'UAH',
    description: params.description,
    order_id: params.orderNumber,
    result_url: params.resultUrl,
    server_url: params.serverUrl,
    language: 'uk',
    sandbox: process.env.LIQPAY_SANDBOX === '1' ? 1 : 0,
  };

  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  return { endpoint: LIQPAY_ENDPOINT, data, signature: sign(data) };
}

/** Перевіряє підпис і повертає розібрані дані. null — підпис не збігся. */
export function verifyCallback(data: string, signature: string): LiqPayCallback | null {
  if (!data || !signature) return null;
  if (sign(data) !== signature) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as LiqPayCallback;
  } catch {
    return null;
  }
}

export function callbackOutcome(status: string): 'paid' | 'failed' | 'pending' {
  if (PAID_STATUSES.has(status)) return 'paid';
  if (FAILED_STATUSES.has(status)) return 'failed';
  return 'pending';
}
