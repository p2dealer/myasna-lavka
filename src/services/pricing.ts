import type { PricingMode } from '@prisma/client';

/**
 * Єдина правда про ціну. Викликається у картці каталогу, на сторінці товару,
 * у кошику, при оформленні та при перерахунку замовлення в адмінці.
 * Клієнт ніколи не рахує суму самостійно — він показує те, що повернув сервер.
 */

export type PricedProduct = {
  pricingMode: PricingMode;
  price: number; // копійки за одиницю, визначену pricingMode
  packWeightG?: number | null;
};

export const WEIGHT_MODES: PricingMode[] = ['PER_KG', 'PER_100G'];

export function isWeightBased(mode: PricingMode): boolean {
  return WEIGHT_MODES.includes(mode);
}

/** Дільник грамів для режиму: скільки грамів коштують `price`. */
export function unitDivisor(mode: PricingMode): number {
  switch (mode) {
    case 'PER_KG':
      return 1000;
    case 'PER_100G':
      return 100;
    default:
      return 0;
  }
}

/** Підпис ціни: «за кг», «за 100 г», «за шт», «за уп. 400 г». */
export function priceUnitLabel(p: PricedProduct): string {
  switch (p.pricingMode) {
    case 'PER_KG':
      return 'за кг';
    case 'PER_100G':
      return 'за 100 г';
    case 'PER_UNIT':
      return 'за шт';
    case 'PER_PACKAGE':
      return p.packWeightG ? `за уп. ${formatGramsShort(p.packWeightG)}` : 'за упаковку';
    case 'SET':
      return p.packWeightG ? `набір ${formatGramsShort(p.packWeightG)}` : 'за набір';
  }
}

function formatGramsShort(g: number): string {
  return g >= 1000 ? `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 1)} кг` : `${g} г`;
}

/** Ціна одного рядка кошика/замовлення в копійках. */
export function lineTotal(p: PricedProduct, grams: number, quantity: number): number {
  const qty = Math.max(1, Math.floor(quantity));
  if (isWeightBased(p.pricingMode)) {
    const div = unitDivisor(p.pricingMode);
    const g = Math.max(0, Math.floor(grams));
    return Math.round((p.price * g) / div) * qty;
  }
  return p.price * qty;
}

/** Скільки одиниць залишку списує рядок: грами для вагових, штуки для решти. */
export function stockDelta(p: PricedProduct, grams: number, quantity: number): number {
  const qty = Math.max(1, Math.floor(quantity));
  return isWeightBased(p.pricingMode) ? Math.max(0, Math.floor(grams)) * qty : qty;
}

/** Стандартні варіанти ваги, якщо адміністратор не задав власні. */
export function defaultWeightOptions(p: PricedProduct): number[] {
  if (p.pricingMode === 'PER_KG') return p.price > 80000 ? [300, 500, 1000] : [500, 1000, 2000];
  if (p.pricingMode === 'PER_100G') return [100, 200, 500];
  return [];
}

/** Межі повзунка довільної ваги. */
export function customWeightRange(mode: PricingMode): { min: number; max: number; step: number } {
  if (mode === 'PER_100G') return { min: 50, max: 1000, step: 50 };
  return { min: 300, max: 5000, step: 100 };
}

export function discountPercent(price: number, oldPrice?: number | null): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}
