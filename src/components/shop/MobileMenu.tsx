'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconMenu, IconClose } from '@/components/ui/Icons';

type Item = { href: string; label: string; count?: number };

export function MobileMenu({ items, phone, hours }: { items: Item[]; phone: string; hours: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button
        type="button" onClick={() => setOpen(true)} aria-label="Меню" aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-lg text-inksoft hover:bg-paper2 hover:text-bordeaux lg:hidden"
      >
        <IconMenu size={21} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]">
          <button type="button" aria-label="Закрити меню" onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          <nav className="absolute inset-y-0 left-0 flex w-[min(340px,88%)] animate-drawerIn flex-col bg-ivory shadow-pop">
            <header className="flex items-center justify-between border-b border-line bg-paper px-5 py-4">
              <b className="display text-lg">Меню</b>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрити"
                className="grid h-9 w-9 place-items-center rounded-lg text-inksoft hover:bg-paper2 hover:text-ember">
                <IconClose size={18} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-2">
              {items.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-line py-3 text-[16px] font-semibold hover:text-bordeaux">
                  {item.label}
                  {item.count !== undefined && <span className="text-[12px] text-inkfaint">{item.count}</span>}
                </Link>
              ))}
              <p className="py-5 text-[13px] text-inkfaint">{phone} · {hours}</p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
