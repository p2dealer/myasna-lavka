'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTransition } from 'react';
import { formatMoney, formatGrams } from '@/lib/money';
import { isWeightBased, lineTotal, priceUnitLabel, defaultWeightOptions } from '@/services/pricing';
import { removeItemAction, setGramsAction, setQuantityAction } from '@/app/actions/cart';
import { IconMinus, IconPlus, IconTrash } from '@/components/ui/Icons';
import type { PricingMode } from '@prisma/client';

export type CartLine = {
  id: string; quantity: number; grams: number;
  product: {
    id: string; slug: string; name: string; price: number; oldPrice: number | null;
    pricingMode: PricingMode; packWeightG: number | null; stock: number;
    images: { url: string; alt: string | null }[];
    category: { name: string };
  };
};

export function CartLines({ items }: { items: CartLine[] }) {
  return (
    <div>
      {items.map((item) => <Line key={item.id} item={item} />)}
    </div>
  );
}

function Line({ item }: { item: CartLine }) {
  const [pending, startTransition] = useTransition();
  const p = item.product;
  const weighted = isWeightBased(p.pricingMode);
  const gramOptions = [...new Set([...defaultWeightOptions(p), item.grams])].filter(Boolean).sort((a, b) => a - b);

  return (
    <div className={`grid grid-cols-[72px_1fr] items-center gap-3.5 border-b border-line py-4 sm:grid-cols-[92px_1fr_auto] ${pending ? 'opacity-60' : ''}`}>
      <Link href={`/product/${p.slug}`} className="relative h-16 w-[72px] overflow-hidden rounded-[10px] sm:h-[78px] sm:w-[92px]">
        {p.images[0] && <Image src={p.images[0].url} alt="" fill unoptimized sizes="92px" className="object-cover" />}
      </Link>

      <div className="min-w-0">
        <Link href={`/product/${p.slug}`} className="text-[15px] font-bold leading-tight hover:text-bordeaux">{p.name}</Link>
        <p className="mt-0.5 text-[12.5px] text-inkfaint">
          {formatMoney(p.price)} {priceUnitLabel(p)} · {p.category.name}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
          {weighted ? (
            <select aria-label="Вага" value={item.grams} disabled={pending}
              onChange={(e) => startTransition(() => { void setGramsAction(item.id, Number(e.target.value)); })}
              className="!w-auto !rounded-full !py-1.5 text-[13px] font-semibold">
              {gramOptions.map((g) => <option key={g} value={g}>{formatGrams(g)}</option>)}
            </select>
          ) : (
            <span className="text-[12.5px] text-inkfaint">
              {p.packWeightG ? `упаковка ${formatGrams(p.packWeightG)}` : '1 шт'}
            </span>
          )}

          <span className="inline-flex items-center rounded-full border border-line2">
            <button type="button" aria-label="Менше" disabled={pending}
              onClick={() => startTransition(() => { void setQuantityAction(item.id, item.quantity - 1); })}
              className="grid h-8 w-8 place-items-center text-inksoft hover:text-bordeaux">
              <IconMinus size={14} />
            </button>
            <span className="tabular min-w-[26px] text-center text-[13.5px] font-extrabold">{item.quantity}</span>
            <button type="button" aria-label="Більше" disabled={pending}
              onClick={() => startTransition(() => { void setQuantityAction(item.id, item.quantity + 1); })}
              className="grid h-8 w-8 place-items-center text-inksoft hover:text-bordeaux">
              <IconPlus size={14} />
            </button>
          </span>

          <button type="button" disabled={pending}
            onClick={() => startTransition(() => { void removeItemAction(item.id); })}
            className="inline-flex items-center gap-1.5 text-[12px] text-inkfaint hover:text-ember">
            <IconTrash size={14} /> Видалити
          </button>
        </div>
      </div>

      <div className="col-start-2 sm:col-start-3 sm:text-right">
        <div className="tabular text-[17px] font-extrabold">{formatMoney(lineTotal(p, item.grams, item.quantity))}</div>
      </div>
    </div>
  );
}
