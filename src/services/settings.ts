import 'server-only';
import { unstable_cache, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { SiteSettings } from '@/types/settings';

export const SETTINGS_TAG = 'site-settings';

export type { SiteSettings };

export const DEFAULT_SETTINGS: SiteSettings = {
  shopName: 'М’ясна Лавка',
  tagline: 'Різниця з 2014',
  description: 'Власна різниця й коптильня в Києві. Фермерське м’ясо без посередників.',
  phone: '+38 (067) 412-38-90',
  email: 'hello@myasna-lavka.ua',
  address: 'вул. Різницька, 14, Київ',
  workingHours: 'Щодня 08:00 – 21:00',
  telegram: 'https://t.me/myasna_lavka',
  instagram: 'https://instagram.com/myasna_lavka',
  facebook: 'https://facebook.com/myasnalavka',
  viber: '',
  freeShippingFrom: 120000,
  minOrderTotal: 40000,
  heroTitle: 'Свіже м’ясо преміальної якості',
  heroSubtitle:
    'Відбираємо найкраще м’ясо у фермерів і доставляємо його до вашого столу — у вакуумі, з датою розбирання й точною вагою на етикетці.',
  heroCtaLabel: 'Перейти до каталогу',
  footerNote: 'Власна різниця й коптильня в Києві. Працюємо з фермерськими господарствами без посередників.',
  seoTitle: 'М’ясна Лавка — свіже м’ясо преміальної якості з доставкою по Києву',
  seoDescription:
    'Стейки сухого визрівання, фермерська курятина, домашні ковбаси та копченості. Доставка по Києву того ж дня, Нова Пошта по Україні.',
};

const NUMERIC_KEYS: Array<keyof SiteSettings> = ['freeShippingFrom', 'minOrderTotal'];

function parseRows(rows: Array<{ key: string; value: string }>): SiteSettings {
  const result: SiteSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const key = row.key as keyof SiteSettings;
    if (!(key in result)) continue;
    if (NUMERIC_KEYS.includes(key)) {
      (result[key] as number) = Number.parseInt(row.value, 10) || 0;
    } else {
      (result[key] as string) = row.value;
    }
  }
  return result;
}

/** Налаштування читаються один раз і кешуються з теговою інвалідацією. */
export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const rows = await prisma.siteSetting.findMany();
      return parseRows(rows);
    } catch {
      // Сайт має відкриватися навіть якщо база ще не піднята.
      return { ...DEFAULT_SETTINGS };
    }
  },
  ['site-settings'],
  { tags: [SETTINGS_TAG], revalidate: 300 },
);

export async function saveSettings(patch: Partial<SiteSettings>): Promise<void> {
  const entries = Object.entries(patch).filter(([key]) => key in DEFAULT_SETTINGS);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: String(value), group: NUMERIC_KEYS.includes(key as keyof SiteSettings) ? 'commerce' : 'general' },
        update: { value: String(value) },
      }),
    ),
  );
  revalidateTag(SETTINGS_TAG);
}
