/** Налаштування магазину. Тип живе окремо, щоб його можна було імпортувати
 *  і в серверні, і в клієнтські компоненти. */
export type SiteSettings = {
  shopName: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  telegram: string;
  instagram: string;
  facebook: string;
  viber: string;
  freeShippingFrom: number; // копійки
  minOrderTotal: number; // копійки
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  footerNote: string;
  seoTitle: string;
  seoDescription: string;
};
