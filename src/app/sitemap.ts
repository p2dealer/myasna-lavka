import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const staticRoutes = ['', '/catalog', '/about', '/delivery', '/contacts', '/privacy', '/terms', '/returns', '/cookies'];

  let products: Array<{ slug: string; updatedAt: Date }> = [];
  let categories: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    [products, categories] = await Promise.all([
      prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ]);
  } catch { /* база може бути недоступна під час збірки */ }

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route}`,
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1 : 0.7,
    })),
    ...categories.map((c) => ({
      url: `${base}/catalog/${c.slug}`, lastModified: c.updatedAt,
      changeFrequency: 'daily' as const, priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`, lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const, priority: 0.6,
    })),
  ];
}
