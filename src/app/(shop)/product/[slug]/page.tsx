import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatMoney } from '@/lib/money';
import { getProductBySlug, relatedProducts } from '@/services/catalog';
import { getSettings } from '@/services/settings';
import { priceUnitLabel } from '@/services/pricing';
import { BuyBox } from '@/components/shop/BuyBox';
import { Gallery } from '@/components/shop/Gallery';
import { ProductGrid } from '@/components/shop/ProductCard';
import { StockLine } from '@/components/shop/StockLine';
import { IconPack, IconSnow, IconTruck, Stars } from '@/components/ui/Icons';
import { FavoriteButton } from '@/components/shop/FavoriteButton';
import { ReviewForm } from '@/components/shop/ReviewForm';
import { currentUser, favoriteIds } from '@/services/account';

// Хедер читає кошик і сесію з cookie, тому сторінка рендериться на запит.
// Дані каталогу кешуються на рівні запитів Prisma та тегів у services/settings.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Товар не знайдено' };
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? '',
      images: product.images[0] ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings, user] = await Promise.all([
    relatedProducts(product.id, product.categoryId),
    getSettings(),
    currentUser(),
  ]);
  const favorites = await favoriteIds(user?.id ?? null);

  const specs: Array<[string, string]> = [
    ['Категорія', product.category.name],
    ['Артикул', product.sku],
    ['Країна походження', product.origin ?? '—'],
    ['Виробник', product.producer ?? '—'],
    ['Умови зберігання', product.storageConditions ?? '—'],
    ['Термін придатності', product.shelfLifeDays ? `${product.shelfLifeDays} діб` : '—'],
    ['Спосіб продажу', priceUnitLabel(product)],
    ['Пакування', 'Вакуум, етикетка з вагою'],
  ];

  return (
    <div className="wrap pb-14">
      <nav aria-label="Навігація" className="flex flex-wrap items-center gap-2 py-4 text-[12.5px] text-inkfaint">
        <Link href="/" className="hover:text-bordeaux">Головна</Link><span className="text-line2">/</span>
        <Link href="/catalog" className="hover:text-bordeaux">Каталог</Link><span className="text-line2">/</span>
        <Link href={`/catalog/${product.category.slug}`} className="hover:text-bordeaux">{product.category.name}</Link>
        <span className="text-line2">/</span><b className="text-ink">{product.name}</b>
      </nav>

      <div className="grid items-start gap-9 lg:grid-cols-[1.06fr_1fr]">
        <Gallery images={product.images} name={product.name} />

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{product.category.name}</p>
              <h1 className="display mb-3 mt-2 text-[clamp(26px,4.2vw,38px)] leading-[1.1]">{product.name}</h1>
            </div>
            <span className="mt-1 shrink-0">
              <FavoriteButton productId={product.id} active={favorites.has(product.id)} size="lg" label={product.name} />
            </span>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-inkfaint">
            <Stars rating={product.rating} count={product.reviewCount} />
            <span>Артикул <span className="tabular">{product.sku}</span></span>
            <StockLine stock={product.stock} threshold={product.lowStockThreshold} mode={product.pricingMode} />
          </div>

          <BuyBox
            productId={product.id}
            pricingMode={product.pricingMode}
            price={product.price}
            oldPrice={product.oldPrice}
            packWeightG={product.packWeightG}
            stock={product.stock}
            weightOptions={product.weightOptions.map((w) => ({ grams: w.grams, label: w.label, isDefault: w.isDefault }))}
          />

          <ul className="mt-4 flex flex-col gap-2.5">
            <li className="flex gap-3 text-[13.5px] text-inksoft">
              <IconTruck className="mt-0.5 shrink-0 text-bordeaux" size={17} />
              <span>Доставка сьогодні по Києву при замовленні до 15:00. Від {formatMoney(settings.freeShippingFrom)} — безкоштовно.</span>
            </li>
            <li className="flex gap-3 text-[13.5px] text-inksoft">
              <IconSnow className="mt-0.5 shrink-0 text-bordeaux" size={17} />
              <span>Зберігання {product.storageConditions}, термін придатності {product.shelfLifeDays} діб від дати розбирання.</span>
            </li>
            <li className="flex gap-3 text-[13.5px] text-inksoft">
              <IconPack className="mt-0.5 shrink-0 text-bordeaux" size={17} />
              <span>Вакуумне пакування, на етикетці — фактична вага та номер партії.</span>
            </li>
          </ul>
        </div>
      </div>

      <section className="grid gap-8 pt-12 lg:grid-cols-2">
        <div>
          <h2 className="display mb-3 text-[22px]">Опис</h2>
          <div className="max-w-[68ch] whitespace-pre-line text-[15px] leading-relaxed text-inksoft">
            {product.description}
          </div>
          {product.cookingTips && (
            <p className="mt-4 max-w-[68ch] text-[15px] leading-relaxed text-inksoft">
              <b className="text-ink">Як приготувати. </b>{product.cookingTips}
            </p>
          )}
          {product.composition && (
            <p className="mt-4 max-w-[68ch] text-[14.5px] text-inksoft">
              <b className="text-ink">Склад: </b>{product.composition}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-7">
          <div>
            <h2 className="display mb-3 text-[22px]">Характеристики</h2>
            <dl className="grid">
              {specs.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
                  <dt className="text-inkfaint">{label}</dt>
                  <dd className="text-right font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="display mb-3 text-[22px]">Харчова цінність</h2>
            <p className="mb-3 text-[14px] text-inkfaint">На 100 г продукту в сирому вигляді. Показники усереднені по партії.</p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[[product.kcal, 'ккал'], [product.protein, 'білки, г'], [product.fat, 'жири, г'], [product.carbs ?? 0, 'вуглеводи, г']].map(([v, l]) => (
                <div key={l as string} className="rounded-lg border border-line bg-paper p-3.5 text-center">
                  <b className="display block text-[23px] leading-tight">{v ?? '—'}</b>
                  <span className="text-[11.5px] text-inkfaint">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-[22px]">
            Відгуки покупців{product.reviewCount ? ` · ${product.reviewCount}` : ''}
          </h2>
          <ReviewForm productId={product.id} authorName={user?.firstName ?? null} />
        </div>
        {product.reviews.length > 0 ? (
          <div className="grid gap-3.5 md:grid-cols-3">
            {product.reviews.map((review) => (
              <figure key={review.id} className="flex flex-col gap-3 rounded-xl2 border border-line bg-paper p-5">
                <Stars rating={review.rating} />
                <blockquote className="text-[14.5px] leading-relaxed text-inksoft">{review.text}</blockquote>
                <figcaption className="mt-auto text-[13px] font-bold">
                  {review.authorName}
                  <span className="ml-2 font-normal text-[11.5px] text-inkfaint">перевірена покупка</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-[14.5px] text-inkfaint">
            Відгуків ще немає — станьте першим, хто розповість про цей товар.
          </p>
        )}
      </section>

      {related.length > 0 && (
        <section className="pt-12">
          <h2 className="display mb-5 text-[clamp(21px,3vw,28px)]">Схожі товари</h2>
          <ProductGrid products={related} favorites={favorites} />
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            sku: product.sku,
            description: product.shortDescription,
            brand: { '@type': 'Brand', name: settings.shopName },
            aggregateRating: product.reviewCount
              ? { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount }
              : undefined,
            offers: {
              '@type': 'Offer',
              price: (product.price / 100).toFixed(2),
              priceCurrency: 'UAH',
              availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/product/${product.slug}`,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Головна', item: '/' },
              { '@type': 'ListItem', position: 2, name: 'Каталог', item: '/catalog' },
              { '@type': 'ListItem', position: 3, name: product.category.name, item: `/catalog/${product.category.slug}` },
              { '@type': 'ListItem', position: 4, name: product.name },
            ],
          }),
        }}
      />
    </div>
  );
}
