'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IconSearch } from '@/components/ui/Icons';
import { formatMoney } from '@/lib/money';

type Suggestion = {
  id: string; slug: string; name: string; price: number;
  category: { name: string }; images: { url: string; alt: string | null }[];
};

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) { setItems([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (res.ok) { setItems(await res.json()); setOpen(true); }
      } catch { /* скасований запит */ } finally { setLoading(false); }
    }, 220);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/catalog?q=${encodeURIComponent(term)}`);
  }

  return (
    <div ref={box} className="relative min-w-0 flex-1 basis-full sm:basis-[180px] sm:max-w-[280px]">
      <form onSubmit={submit} role="search">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-inkfaint">
          <IconSearch size={17} />
        </span>
        <input
          type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          placeholder="Пошук: ребра, ribeye, фарш…" aria-label="Пошук товарів" autoComplete="off"
          className="!rounded-full !py-2.5 !pl-10 !pr-4 text-sm"
        />
      </form>

      {open && (items.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl2 border border-line bg-paper shadow-card">
          {loading && items.length === 0 && (
            <p className="px-3 py-3 text-center text-[13px] text-inkfaint">Шукаємо…</p>
          )}
          {items.map((item) => (
            <button
              key={item.id} type="button"
              onClick={() => { setOpen(false); router.push(`/product/${item.slug}`); }}
              className="flex w-full items-center gap-3 border-b border-line px-3 py-2.5 text-left last:border-0 hover:bg-paper2"
            >
              <span className="relative h-9 w-11 shrink-0 overflow-hidden rounded-md">
                {item.images[0] && (
                  <Image src={item.images[0].url} alt="" fill unoptimized sizes="44px" className="object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold leading-tight">{item.name}</span>
                <span className="block text-[11px] text-inkfaint">{item.category.name}</span>
              </span>
              <span className="tabular shrink-0 text-[13px] font-extrabold text-bordeaux">{formatMoney(item.price)}</span>
            </button>
          ))}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => { setOpen(false); router.push(`/catalog?q=${encodeURIComponent(query.trim())}`); }}
              className="w-full py-2.5 text-center text-[13px] font-bold text-bordeaux hover:bg-paper2"
            >
              Показати всі результати
            </button>
          )}
        </div>
      )}
    </div>
  );
}
