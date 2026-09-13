'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PricingMode } from '@prisma/client';
import { formatMoney, formatGrams } from '@/lib/money';
import {
  customWeightRange, defaultWeightOptions, discountPercent, isWeightBased, lineTotal, priceUnitLabel,
} from '@/services/pricing';
import { addToCartAction } from '@/app/actions/cart';
import { IconCart, IconCheck, IconMinus, IconPlus } from '@/components/ui/Icons';

type Props = {
  productId: string;
  pricingMode: PricingMode;
  price: number;
  oldPrice: number | null;
  packWeightG: number | null;
  stock: number;
  weightOptions: { grams: number; label: string; isDefault: boolean }[];
};

export function BuyBox(props: Props) {
  const { productId, pricingMode, price, oldPrice, packWeightG, stock } = props;
  const weighted = isWeightBased(pricingMode);
  const options = useMemo(() => {
    if (!weighted) return [];
    return props.weightOptions.length
      ? props.weightOptions
      : defaultWeightOptions({ pricingMode, price }).map((g) => ({ grams: g, label: formatGrams(g), isDefault: false }));
  }, [props.weightOptions, pricingMode, price, weighted]);

  const range = customWeightRange(pricingMode);
  const [grams, setGrams] = useState(() => {
    if (!weighted) return 0;
    return options.find((o) => o.isDefault)?.grams ?? options[1]?.grams ?? options[0]?.grams ?? range.min;
  });
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const total = lineTotal({ pricingMode, price, packWeightG }, grams, quantity);
  const off = discountPercent(price, oldPrice);
  const out = stock <= 0;

  function add(then?: 'checkout') {
    setError('');
    startTransition(async () => {
      const result = await addToCartAction(productId, grams, quantity);
      if (!result.ok) { setError(result.message ?? 'Не вдалося додати товар'); return; }
      if (then === 'checkout') { router.push('/checkout'); return; }
      setDone(true);
      setTimeout(() => setDone(false), 2200);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl2 border border-line bg-paper p-5 shadow-soft">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <span className={`tabular text-[34px] font-extrabold leading-none tracking-tight ${off ? 'text-ember' : ''}`}>
          {formatMoney(price)}
        </span>
        {oldPrice && <span className="tabular text-base text-inkfaint line-through">{formatMoney(oldPrice)}</span>}
        {off && <span className="pill bg-ember text-white">−{off} %</span>}
        <span className="ml-auto text-[13px] font-semibold text-inkfaint">
          {priceUnitLabel({ pricingMode, price, packWeightG })}
        </span>
      </div>

      {weighted ? (
        <div>
          <b className="mb-2.5 block text-[12px] font-extrabold uppercase tracking-[0.06em] text-inkfaint">Вага</b>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <button key={option.grams} type="button" onClick={() => setGrams(option.grams)}
                aria-pressed={grams === option.grams}
                className={`rounded-[10px] border px-4 py-2.5 text-[13.5px] font-bold transition ${
                  grams === option.grams ? 'border-transparent bg-bordeaux text-paper' : 'border-line2 bg-ivory hover:border-bordeaux'
                }`}>
                {option.label}
              </button>
            ))}
            <button type="button" onClick={() => setGrams(range.min + range.step * 4)}
              aria-pressed={!options.some((o) => o.grams === grams)}
              className={`rounded-[10px] border px-4 py-2.5 text-[13.5px] font-bold transition ${
                !options.some((o) => o.grams === grams) ? 'border-transparent bg-bordeaux text-paper' : 'border-line2 bg-ivory hover:border-bordeaux'
              }`}>
              Своя вага
            </button>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <input type="range" min={range.min} max={range.max} step={range.step} value={grams}
              onChange={(e) => setGrams(Number(e.target.value))} aria-label="Довільна вага"
              className="!border-0 !bg-transparent !p-0 accent-bordeaux" />
            <output className="tabular min-w-[76px] text-right text-sm font-extrabold">{formatGrams(grams)}</output>
          </div>
        </div>
      ) : (
        <div>
          <b className="mb-2.5 block text-[12px] font-extrabold uppercase tracking-[0.06em] text-inkfaint">Фасування</b>
          <span className="inline-block rounded-[10px] border border-line2 bg-ivory px-4 py-2.5 text-[13.5px] font-bold">
            {packWeightG ? `${formatGrams(packWeightG)} / упаковка` : '1 шт'}
          </span>
        </div>
      )}

      <div>
        <b className="mb-2.5 block text-[12px] font-extrabold uppercase tracking-[0.06em] text-inkfaint">Кількість</b>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center overflow-hidden rounded-full border border-line2 bg-ivory">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Менше"
              className="grid h-11 w-10 place-items-center text-inksoft hover:bg-paper2 hover:text-bordeaux">
              <IconMinus size={16} />
            </button>
            <span className="tabular min-w-[34px] text-center text-[15px] font-extrabold">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => Math.min(20, q + 1))} aria-label="Більше"
              className="grid h-11 w-10 place-items-center text-inksoft hover:bg-paper2 hover:text-bordeaux">
              <IconPlus size={16} />
            </button>
          </span>

          <button type="button" onClick={() => add()} disabled={out || pending}
            className={`btn flex-1 basis-[150px] ${done ? 'bg-good text-paper' : 'btn-primary'}`}>
            {done ? <IconCheck size={18} /> : <IconCart size={18} />}
            {done ? 'У кошику' : pending ? 'Додаємо…' : 'Додати в кошик'}
          </button>
          <button type="button" onClick={() => add('checkout')} disabled={out || pending}
            className="btn btn-ghost flex-1 basis-[130px]">
            Купити зараз
          </button>
        </div>
        {error && <p className="field-error mt-2">{error}</p>}
        {out && <p className="mt-2 text-[13px] text-inkfaint">Товару зараз немає в наявності. Зателефонуйте — підкажемо, коли буде.</p>}
      </div>

      <div className="flex justify-between border-t border-dashed border-line2 pt-3 text-[13px] text-inksoft">
        <span>Разом за {weighted ? formatGrams(grams) : `${quantity} шт`}{weighted && quantity > 1 ? ` × ${quantity}` : ''}</span>
        <b className="tabular text-base">{formatMoney(total)}</b>
      </div>
    </div>
  );
}
