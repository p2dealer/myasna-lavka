/**
 * Гроші в системі — цілі числа в копійках. Жодних float для цін.
 */
export const UAH = '₴';

export function formatMoney(kopiyky: number, opts: { withSymbol?: boolean } = {}): string {
  const { withSymbol = true } = opts;
  const value = Math.round(kopiyky) / 100;
  const formatted = new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return withSymbol ? `${formatted} ${UAH}` : formatted;
}

/** "1290.50" | 1290.5 → 129050 */
export function toKopiyky(input: string | number): number {
  const n = typeof input === 'number' ? input : Number(String(input).replace(',', '.').trim());
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** 129050 → 1290.5 (для полів форми) */
export function toHryvnia(kopiyky: number | null | undefined): number {
  return Math.round(kopiyky ?? 0) / 100;
}

export function formatGrams(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(kg)} кг`;
  }
  return `${grams} г`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
