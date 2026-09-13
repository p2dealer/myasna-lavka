import Link from 'next/link';

export function Pagination({ page, pages, baseParams }: { page: number; pages: number; baseParams: URLSearchParams }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const next = new URLSearchParams(baseParams.toString());
    p > 1 ? next.set('page', String(p)) : next.delete('page');
    const qs = next.toString();
    return qs ? `?${qs}` : '?';
  };
  const cell = 'grid h-9 min-w-9 place-items-center rounded-lg border border-line bg-paper px-3 text-[13.5px] font-bold';

  return (
    <nav className="flex flex-wrap justify-center gap-1.5 pb-2 pt-8" aria-label="Сторінки каталогу">
      {page > 1 && <Link href={href(page - 1)} className={cell} aria-label="Попередня сторінка">←</Link>}
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link key={p} href={href(p)} aria-current={p === page ? 'page' : undefined}
          className={p === page ? `${cell} !border-transparent bg-bordeaux text-paper` : cell}>
          {p}
        </Link>
      ))}
      {page < pages && <Link href={href(page + 1)} className={cell} aria-label="Наступна сторінка">→</Link>}
    </nav>
  );
}
