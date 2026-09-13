'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { IconFilter, IconClose } from '@/components/ui/Icons';

type Facets = { meat: Record<string, number>; type: Record<string, number> };
type Option = { key: string; label: string };

const FLAGS: Option[] = [
  { key: 'inStock', label: 'Тільки в наявності' },
  { key: 'sale', label: 'Акційні товари' },
  { key: 'fresh', label: 'Новинки' },
  { key: 'top', label: 'Рейтинг 4.6 і вище' },
];

export function Filters({
  meats, types, facets, bounds,
}: {
  meats: readonly Option[];
  types: readonly Option[];
  facets: Facets;
  bounds: { min: number; max: number };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const minBound = Math.floor(bounds.min / 100);
  const maxBound = Math.ceil(bounds.max / 100);
  const [min, setMin] = useState(params.get('min') ?? String(minBound));
  const [max, setMax] = useState(params.get('max') ?? String(maxBound));

  useEffect(() => {
    setMin(params.get('min') ?? String(minBound));
    setMax(params.get('max') ?? String(maxBound));
  }, [params, minBound, maxBound]);

  function push(next: URLSearchParams) {
    next.delete('page');
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  function toggleList(name: 'meat' | 'type', value: string, checked: boolean) {
    const next = new URLSearchParams(params.toString());
    const current = new Set((next.get(name) ?? '').split(',').filter(Boolean));
    checked ? current.add(value) : current.delete(value);
    current.size ? next.set(name, [...current].join(',')) : next.delete(name);
    push(next);
  }

  function toggleFlag(name: string, checked: boolean) {
    const next = new URLSearchParams(params.toString());
    checked ? next.set(name, '1') : next.delete(name);
    push(next);
  }

  function applyPrice() {
    const next = new URLSearchParams(params.toString());
    const lo = Number(min) || minBound;
    const hi = Number(max) || maxBound;
    lo > minBound ? next.set('min', String(lo)) : next.delete('min');
    hi < maxBound ? next.set('max', String(hi)) : next.delete('max');
    push(next);
  }

  function reset() {
    const next = new URLSearchParams();
    const q = params.get('q');
    if (q) next.set('q', q);
    setOpen(false);
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false }));
  }

  const listed = (name: 'meat' | 'type') => new Set((params.get(name) ?? '').split(',').filter(Boolean));
  const activeCount =
    listed('meat').size + listed('type').size +
    FLAGS.filter((f) => params.get(f.key)).length +
    (params.get('min') || params.get('max') ? 1 : 0);

  const panel = (
    <div className="flex flex-col rounded-xl2 border border-line bg-paper px-4">
      <fieldset className="border-b border-line py-4">
        <legend className="mb-2.5 text-[12.5px] font-extrabold">Ціна, ₴</legend>
        <div className="flex items-center gap-2">
          <input type="number" value={min} min={minBound} max={maxBound} onChange={(e) => setMin(e.target.value)}
            onBlur={applyPrice} aria-label="Ціна від" className="!py-2 text-[13px]" />
          <span className="text-inkfaint">—</span>
          <input type="number" value={max} min={minBound} max={maxBound} onChange={(e) => setMax(e.target.value)}
            onBlur={applyPrice} aria-label="Ціна до" className="!py-2 text-[13px]" />
        </div>
        <input type="range" min={minBound} max={maxBound} step={50} value={max}
          onChange={(e) => setMax(e.target.value)} onMouseUp={applyPrice} onTouchEnd={applyPrice}
          aria-label="Максимальна ціна" className="mt-3 !border-0 !bg-transparent !p-0 accent-bordeaux" />
      </fieldset>

      {([['meat', 'Вид м’яса', meats], ['type', 'Тип продукту', types]] as const).map(([name, title, options]) => (
        <fieldset key={name} className="border-b border-line py-4">
          <legend className="mb-2 text-[12.5px] font-extrabold">{title}</legend>
          {options.map((option) => (
            <label key={option.key} className="flex cursor-pointer items-center gap-2.5 py-1 text-[13.5px] text-inksoft hover:text-ink">
              <input type="checkbox" checked={listed(name).has(option.key)}
                onChange={(e) => toggleList(name, option.key, e.target.checked)}
                className="!h-4 !w-4 shrink-0 !p-0 accent-bordeaux" />
              {option.label}
              <span className="ml-auto text-[11.5px] text-inkfaint">{facets[name][option.key] ?? 0}</span>
            </label>
          ))}
        </fieldset>
      ))}

      <fieldset className="border-b border-line py-4">
        <legend className="mb-2 text-[12.5px] font-extrabold">Позначки</legend>
        {FLAGS.map((flag) => (
          <label key={flag.key} className="flex cursor-pointer items-center gap-2.5 py-1 text-[13.5px] text-inksoft hover:text-ink">
            <input type="checkbox" checked={!!params.get(flag.key)}
              onChange={(e) => toggleFlag(flag.key, e.target.checked)}
              className="!h-4 !w-4 shrink-0 !p-0 accent-bordeaux" />
            {flag.label}
          </label>
        ))}
      </fieldset>

      <div className="py-4">
        <button type="button" onClick={reset} className="btn btn-ghost btn-sm w-full">Скинути фільтри</button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-[86px] hidden lg:block">{panel}</aside>

      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost btn-sm lg:hidden">
        <IconFilter size={16} /> Фільтри{activeCount ? ` · ${activeCount}` : ''}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button type="button" aria-label="Закрити фільтри" onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <div className="absolute inset-y-0 right-0 flex w-[min(400px,92%)] animate-drawerIn flex-col bg-ivory shadow-pop">
            <header className="flex items-center justify-between border-b border-line bg-paper px-5 py-4">
              <b className="display text-lg">Фільтри</b>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрити"
                className="grid h-9 w-9 place-items-center rounded-lg text-inksoft hover:bg-paper2 hover:text-ember">
                <IconClose size={18} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">{panel}</div>
            <div className="border-t border-line bg-paper p-4">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-primary w-full">Показати товари</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <select
      aria-label="Сортування" value={current}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.set('sort', e.target.value);
        next.delete('page');
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      }}
      className="!w-auto !rounded-full !bg-paper !py-2 text-[13.5px] font-semibold"
    >
      <option value="popular">Спочатку популярні</option>
      <option value="fresh">Спочатку новинки</option>
      <option value="cheap">Спочатку дешевші</option>
      <option value="expensive">Спочатку дорожчі</option>
      <option value="rating">Найвищий рейтинг</option>
    </select>
  );
}
