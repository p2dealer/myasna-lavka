import Image from 'next/image';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { discountPercent, priceUnitLabel, isWeightBased, defaultWeightOptions } from '@/services/pricing';
import type { ProductCard as ProductCardData } from '@/services/catalog';
import { Stars } from '@/components/ui/Icons';
import { AddToCartButton } from './AddToCartButton';
import { FavoriteButton } from './FavoriteButton';
import { StockLine } from './StockLine';

export function ProductCard({ product, isFavorite = false }: { product: ProductCardData; isFavorite?: boolean }) {
  const out = product.stock <= 0;
  const off = discountPercent(product.price, product.oldPrice);
  const image = product.images[0];
  const defaultGrams = isWeightBased(product.pricingMode)
    ? defaultWeightOptions(product)[1] ?? 1000
    : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl2 border border-line bg-paper transition hover:-translate-y-0.5 hover:border-line2 hover:shadow-card">
      <Link href={`/product/${product.slug}`} className="relative block aspect-[1/0.86] overflow-hidden">
        {image ? (
          <Image
            src={image.url} alt={image.alt ?? product.name} fill unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
            className={`object-cover transition duration-500 group-hover:scale-[1.045] ${out ? 'opacity-55' : ''}`}
          />
        ) : (
          <div className="h-full w-full bg-paper2" />
        )}
        <span className="absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
          {off && <span className="pill bg-ember text-white">−{off} %</span>}
          {product.isNew && <span className="pill bg-[#2F5D50] text-white">Новинка</span>}
          {product.isHit && <span className="pill bg-oak text-white">Хіт</span>}
        </span>
      </Link>

      <span className="absolute right-2.5 top-2.5 z-10">
        <FavoriteButton productId={product.id} active={isFavorite} label={product.name} />
      </span>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-inkfaint">
          {product.category.name}
        </span>
        <Link href={`/product/${product.slug}`} className="text-[14.5px] font-bold leading-tight hover:text-bordeaux">
          {product.name}
        </Link>
        <Stars rating={product.rating} count={product.reviewCount} />
        {product.shortDescription && (
          <p className="line-clamp-2 text-[12.5px] leading-snug text-inkfaint">{product.shortDescription}</p>
        )}
        <StockLine stock={product.stock} threshold={product.lowStockThreshold} mode={product.pricingMode} />

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <span className="flex flex-col leading-tight">
            <span className={`tabular text-[19px] font-extrabold tracking-tight ${off ? 'text-ember' : ''}`}>
              {formatMoney(product.price)}
            </span>
            {product.oldPrice && (
              <span className="tabular text-[12.5px] text-inkfaint line-through">{formatMoney(product.oldPrice)}</span>
            )}
            <span className="text-[11px] font-semibold text-inkfaint">{priceUnitLabel(product)}</span>
          </span>
          <AddToCartButton productId={product.id} grams={defaultGrams} disabled={out} label={product.name} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products, favorites,
}: {
  products: ProductCardData[];
  favorites?: Set<string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(232px,1fr))] sm:gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} isFavorite={favorites?.has(p.id) ?? false} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(232px,1fr))] sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl2 border border-line bg-paper">
          <div className="skeleton aspect-[1/0.86] rounded-none" />
          <div className="flex flex-col gap-2 p-3.5">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton mt-3 h-6 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
