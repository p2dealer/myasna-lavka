import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const MEATS = [
  { key: 'beef', label: 'Яловичина' },
  { key: 'pork', label: 'Свинина' },
  { key: 'chicken', label: 'Курятина' },
  { key: 'turkey', label: 'Індичка' },
  { key: 'lamb', label: 'Баранина' },
] as const;

export const TYPES = [
  { key: 'steak', label: 'Стейки' },
  { key: 'fillet', label: 'Філе та вирізка' },
  { key: 'mince', label: 'Фарш' },
  { key: 'ribs', label: 'Ребра та грудинка' },
  { key: 'sausage', label: 'Ковбаси' },
  { key: 'smoked', label: 'Копченості' },
  { key: 'semi', label: 'Напівфабрикати' },
  { key: 'bbq', label: 'BBQ і гриль' },
  { key: 'set', label: 'Набори' },
] as const;

export const SORTS = {
  popular: 'Спочатку популярні',
  fresh: 'Спочатку новинки',
  cheap: 'Спочатку дешевші',
  expensive: 'Спочатку дорожчі',
  rating: 'Найвищий рейтинг',
} as const;
export type SortKey = keyof typeof SORTS;

export const PAGE_SIZE = 12;

export type CatalogQuery = {
  category?: string;
  meat?: string[];
  type?: string[];
  min?: number; // копійки
  max?: number; // копійки
  inStock?: boolean;
  sale?: boolean;
  fresh?: boolean;
  top?: boolean;
  q?: string;
  sort?: SortKey;
  page?: number;
};

function orderBy(sort: SortKey | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'cheap':
      return [{ price: 'asc' }, { name: 'asc' }];
    case 'expensive':
      return [{ price: 'desc' }, { name: 'asc' }];
    case 'rating':
      return [{ rating: 'desc' }, { reviewCount: 'desc' }];
    case 'fresh':
      return [{ isNew: 'desc' }, { createdAt: 'desc' }];
    default:
      return [{ isHit: 'desc' }, { reviewCount: 'desc' }, { name: 'asc' }];
  }
}

export async function buildWhere(query: CatalogQuery): Promise<Prisma.ProductWhereInput> {
  const where: Prisma.ProductWhereInput = { isActive: true };
  const and: Prisma.ProductWhereInput[] = [];

  if (query.category) {
    const category = await prisma.category.findUnique({
      where: { slug: query.category },
      select: { id: true, children: { select: { id: true } } },
    });
    if (category) {
      const ids = [category.id, ...category.children.map((c) => c.id)];
      and.push({ categoryId: { in: ids } });
    } else {
      and.push({ id: '__none__' });
    }
  }
  if (query.meat?.length) and.push({ meat: { in: query.meat } });
  if (query.type?.length) and.push({ type: { in: query.type } });
  if (typeof query.min === 'number') and.push({ price: { gte: query.min } });
  if (typeof query.max === 'number') and.push({ price: { lte: query.max } });
  if (query.inStock) and.push({ stock: { gt: 0 } });
  if (query.sale) and.push({ oldPrice: { not: null } });
  if (query.fresh) and.push({ isNew: true });
  if (query.top) and.push({ rating: { gte: 4.6 } });
  if (query.q) {
    const q = query.q.trim();
    and.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ],
    });
  }
  if (and.length) where.AND = and;
  return where;
}

export const productCardSelect = {
  id: true, slug: true, name: true, sku: true, shortDescription: true,
  price: true, oldPrice: true, pricingMode: true, packWeightG: true,
  stock: true, lowStockThreshold: true, rating: true, reviewCount: true,
  isHit: true, isNew: true, meat: true, type: true,
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: 'asc' as const }, take: 1 },
} satisfies Prisma.ProductSelect;

export type ProductCard = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export async function findProducts(query: CatalogQuery) {
  const where = await buildWhere(query);
  const page = Math.max(1, query.page ?? 1);
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy: orderBy(query.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function facetCounts() {
  const [meats, types] = await Promise.all([
    prisma.product.groupBy({ by: ['meat'], where: { isActive: true }, _count: { _all: true } }),
    prisma.product.groupBy({ by: ['type'], where: { isActive: true }, _count: { _all: true } }),
  ]);
  return {
    meat: Object.fromEntries(meats.map((m) => [m.meat, m._count._all])),
    type: Object.fromEntries(types.map((t) => [t.type, t._count._all])),
  };
}

export async function priceBounds() {
  const agg = await prisma.product.aggregate({
    where: { isActive: true },
    _min: { price: true },
    _max: { price: true },
  });
  return { min: agg._min.price ?? 0, max: agg._max.price ?? 500000 };
}

export function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      weightOptions: { orderBy: { grams: 'asc' } },
      reviews: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 6 },
    },
  });
}

export function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
  });
}

export function getHomeSelections() {
  const base = { where: { isActive: true }, select: productCardSelect, take: 4 };
  return prisma.$transaction([
    prisma.product.findMany({ ...base, where: { isActive: true, isHit: true }, orderBy: { reviewCount: 'desc' } }),
    prisma.product.findMany({ ...base, where: { isActive: true, oldPrice: { not: null } }, orderBy: { rating: 'desc' } }),
    prisma.product.findMany({ ...base, where: { isActive: true, isNew: true }, orderBy: { createdAt: 'desc' } }),
  ]);
}

export async function searchSuggestions(q: string, take = 6) {
  const term = q.trim();
  if (term.length < 2) return [];
  return prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { category: { name: { contains: term, mode: 'insensitive' } } },
      ],
    },
    select: productCardSelect,
    take,
    orderBy: { isHit: 'desc' },
  });
}

export async function relatedProducts(productId: string, categoryId: string) {
  return prisma.product.findMany({
    where: { isActive: true, categoryId, id: { not: productId } },
    select: productCardSelect,
    take: 4,
    orderBy: { rating: 'desc' },
  });
}
