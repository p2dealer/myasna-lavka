import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { plural } from '@/lib/money';
import {
  MEATS, TYPES, PAGE_SIZE, facetCounts, findProducts, priceBounds, type SortKey,
} from '@/services/catalog';
import { ProductGrid } from '@/components/shop/ProductCard';
import { currentUser, favoriteIds } from '@/services/account';
import { Filters, SortSelect } from '@/components/shop/Filters';
import { Pagination } from '@/components/shop/Pagination';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parse(sp: SearchParams) {
  const list = (v: string | undefined) => (v ? v.split(',').filter(Boolean) : []);
  const num = (v: string | undefined) => (v && !Number.isNaN(Number(v)) ? Number(v) * 100 : undefined);
  return {
    meat: list(one(sp.meat)),
    type: list(one(sp.type)),
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    inStock: one(sp.inStock) === '1',
    sale: one(sp.sale) === '1',
    fresh: one(sp.fresh) === '1',
    top: one(sp.top) === '1',
    q: one(sp.q),
    sort: (one(sp.sort) ?? 'popular') as SortKey,
    page: Number(one(sp.page) ?? 1) || 1,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const categorySlug = slug?.[0];
  if (!categorySlug) {
    return { title: 'Каталог м’ясної продукції', description: 'Стейки, свинина, курятина, ковбаси, копченості та BBQ-набори з доставкою.', alternates: { canonical: '/catalog' } };
  }
  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) return { title: 'Каталог' };
  return {
    title: category.seoTitle ?? category.name,
    description: category.seoDescription ?? category.description ?? undefined,
    alternates: { canonical: `/catalog/${category.slug}` },
  };
}

export default async function CatalogPage({
  params, searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const categorySlug = slug?.[0];
  const query = { ...parse(sp), category: categorySlug };

  const category = categorySlug
    ? await prisma.category.findUnique({ where: { slug: categorySlug } })
    : null;
  if (categorySlug && !category) notFound();

  const [{ items, total, page, pages }, facets, bounds, user] = await Promise.all([
    findProducts(query),
    facetCounts(),
    priceBounds(),
    currentUser(),
  ]);
  const favorites = await favoriteIds(user?.id ?? null);

  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    const v = one(value);
    if (v) urlParams.set(key, v);
  }

  const chips: Array<{ label: string; param: string; value?: string }> = [
    ...query.meat.map((m) => ({ label: MEATS.find((x) => x.key === m)?.label ?? m, param: 'meat', value: m })),
    ...query.type.map((t) => ({ label: TYPES.find((x) => x.key === t)?.label ?? t, param: 'type', value: t })),
    ...(query.inStock ? [{ label: 'В наявності', param: 'inStock' }] : []),
    ...(query.sale ? [{ label: 'Акція', param: 'sale' }] : []),
    ...(query.fresh ? [{ label: 'Новинка', param: 'fresh' }] : []),
    ...(query.top ? [{ label: 'Рейтинг 4.6+', param: 'top' }] : []),
    ...(query.q ? [{ label: `«${query.q}»`, param: 'q' }] : []),
  ];

  function chipHref(chip: { param: string; value?: string }) {
    const next = new URLSearchParams(urlParams.toString());
    if (chip.value) {
      const rest = (next.get(chip.param) ?? '').split(',').filter((v) => v && v !== chip.value);
      rest.length ? next.set(chip.param, rest.join(',')) : next.delete(chip.param);
    } else {
      next.delete(chip.param);
    }
    next.delete('page');
    const qs = next.toString();
    return `${categorySlug ? `/catalog/${categorySlug}` : '/catalog'}${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="wrap pb-14">
      <nav aria-label="Навігація" className="flex flex-wrap items-center gap-2 py-4 text-[12.5px] text-inkfaint">
        <Link href="/" className="hover:text-bordeaux">Головна</Link>
        <span className="text-line2">/</span>
        {category ? <Link href="/catalog" className="hover:text-bordeaux">Каталог</Link> : <b className="text-ink">Каталог</b>}
        {category && (<><span className="text-line2">/</span><b className="text-ink">{category.name}</b></>)}
      </nav>

      <header className="mb-5">
        <p className="eyebrow mb-1.5">
          {total} {plural(total, 'позиція', 'позиції', 'позицій')}
        </p>
        <h1 className="display text-[clamp(26px,4vw,36px)] leading-tight">
          {category ? category.name : 'Каталог м’ясної продукції'}
        </h1>
        {category?.description && <p className="mt-2 max-w-[62ch] text-[15px] text-inksoft">{category.description}</p>}
      </header>

      <div className="grid items-start gap-7 lg:grid-cols-[252px_1fr]">
        <Filters meats={MEATS} types={TYPES} facets={facets} bounds={bounds} />

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-[13.5px] text-inkfaint">
              Знайдено <b className="text-ink">{total}</b> {plural(total, 'товар', 'товари', 'товарів')}
            </span>
            <SortSelect current={query.sort} />
          </div>

          {chips.length > 0 && (
            <div className="mb-3.5 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <Link key={`${chip.param}-${chip.value ?? ''}`} href={chipHref(chip)}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-paper2 px-3 py-1.5 text-[12.5px] font-semibold hover:border-ember">
                  {chip.label}<span aria-hidden className="text-inkfaint">×</span>
                </Link>
              ))}
            </div>
          )}

          {items.length > 0 ? (
            <ProductGrid products={items} favorites={favorites} />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-line2 px-5 py-16 text-center">
              <h2 className="display text-[22px]">Нічого не знайшлося</h2>
              <p className="max-w-[44ch] text-[14.5px] text-inkfaint">
                Спробуйте прибрати частину фільтрів або пошукати інакше — наприклад, «ребра» замість «свинячі ребра».
              </p>
              <Link href="/catalog" className="btn btn-primary btn-sm">Скинути фільтри</Link>
            </div>
          )}

          <Pagination page={page} pages={pages} baseParams={urlParams} />
          {total > PAGE_SIZE && (
            <p className="text-center text-[12.5px] text-inkfaint">
              Сторінка {page} з {pages}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
