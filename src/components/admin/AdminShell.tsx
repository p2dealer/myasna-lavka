'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { adminPath } from '@/lib/utils';
import { logoutAction } from '@/app/(admin)/admin/actions';
import {
  IconBox, IconCog, IconDashboard, IconList, IconMenu, IconClose, IconLogout, IconPack, IconTag,
  IconUsers, IconArrow, Logo,
} from '@/components/ui/Icons';

const NAV = [
  { group: 'Магазин', items: [
    { href: '', label: 'Дашборд', icon: IconDashboard, perm: 'orders' },
    { href: 'orders', label: 'Замовлення', icon: IconList, perm: 'orders' },
    { href: 'products', label: 'Товари', icon: IconBox, perm: 'products' },
    { href: 'categories', label: 'Категорії', icon: IconTag, perm: 'categories' },
    { href: 'reviews', label: 'Відгуки', icon: IconList, perm: 'products' },
    { href: 'customers', label: 'Клієнти', icon: IconUsers, perm: 'customers' },
  ] },
  { group: 'Керування', items: [
    { href: 'marketing', label: 'Промокоди й акції', icon: IconTag, perm: 'marketing' },
    { href: 'inventory', label: 'Залишки', icon: IconPack, perm: 'inventory' },
    { href: 'settings', label: 'Налаштування', icon: IconCog, perm: 'settings' },
  ] },
];

export function AdminShell({
  children, shopName, user, permissions,
}: {
  children: React.ReactNode;
  shopName: string;
  user: { name: string; role: string };
  permissions: string[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = adminPath();

  const isCurrent = (href: string) => {
    const full = href ? `${base}/${href}` : base;
    return href ? pathname.startsWith(full) : pathname === base;
  };

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      <div className="mb-1.5 flex items-center gap-2.5 border-b border-[#2C241E] px-2 pb-4">
        <Logo size={30} />
        <span className="leading-tight">
          <b className="display block text-[16px] text-[#F1E7DA]">{shopName}</b>
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#7E6F62]">адмін-панель</span>
        </span>
      </div>

      {NAV.map((section) => {
        const items = section.items.filter((item) => permissions.includes(item.perm));
        if (!items.length) return null;
        return (
          <div key={section.group}>
            <span className="block px-2.5 pb-1.5 pt-3.5 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-[#6E6055]">
              {section.group}
            </span>
            {items.map((item) => {
              const Icon = item.icon;
              const current = isCurrent(item.href);
              return (
                <Link key={item.label} href={item.href ? `${base}/${item.href}` : base} onClick={() => setOpen(false)}
                  aria-current={current ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-[13.5px] font-semibold transition ${
                    current ? 'bg-ember text-white' : 'text-[#B3A395] hover:bg-[#241D18] hover:text-[#F1E7DA]'
                  }`}>
                  <Icon size={16} /> {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}

      <span className="block px-2.5 pb-1.5 pt-3.5 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-[#6E6055]">
        Сайт
      </span>
      <Link href="/" className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-[13.5px] font-semibold text-[#B3A395] hover:bg-[#241D18] hover:text-[#F1E7DA]">
        <IconArrow size={16} /> Відкрити магазин
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2.5 text-left text-[13.5px] font-semibold text-[#B3A395] hover:bg-[#241D18] hover:text-[#F1E7DA]">
          <IconLogout size={16} /> Вийти
        </button>
      </form>
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper2 lg:grid lg:grid-cols-[236px_1fr]">
      <aside className="hidden bg-[#1A1614] lg:block">{nav}</aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 lg:px-6">
          <button type="button" onClick={() => setOpen(true)} aria-label="Меню адмінки"
            className="grid h-9 w-9 place-items-center rounded-lg text-inksoft hover:bg-paper2 lg:hidden">
            <IconMenu size={20} />
          </button>
          <div className="flex items-center gap-2.5 text-[13px]">
            <span className="pill bg-good/15 text-good">{user.role}</span>
            <span className="hidden sm:inline">{user.name}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-bordeaux text-[12px] font-extrabold text-paper">
              {user.name.charAt(0)}
            </span>
          </div>
        </header>

        <div className="min-w-0 flex-1 p-4 lg:p-6">{children}</div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button type="button" aria-label="Закрити" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-y-0 left-0 w-[min(280px,86%)] animate-drawerIn overflow-y-auto bg-[#1A1614]">
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрити"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-[#B3A395] hover:bg-[#241D18]">
              <IconClose size={18} />
            </button>
            {nav}
          </div>
        </div>
      )}
    </div>
  );
}
