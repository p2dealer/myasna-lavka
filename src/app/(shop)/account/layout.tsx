import Link from 'next/link';
import type { Metadata } from 'next';
import { currentUser } from '@/services/account';
import { LogoutButton } from '@/components/shop/AccountForms';

export const metadata: Metadata = { title: 'Особистий кабінет', robots: { index: false } };
export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/account', label: 'Огляд' },
  { href: '/account/orders', label: 'Мої замовлення' },
  { href: '/account/favorites', label: 'Обране' },
  { href: '/account/addresses', label: 'Адреси' },
  { href: '/account/profile', label: 'Профіль і пароль' },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  // Сторінки входу, реєстрації та відновлення пароля рендеряться без бічного меню.
  if (!user) {
    return <div className="wrap flex justify-center py-12">{children}</div>;
  }

  return (
    <div className="wrap grid items-start gap-7 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-1 rounded-xl2 border border-line bg-paper p-3">
        <div className="border-b border-line px-2 pb-3">
          <b className="block text-[15px]">{user.firstName} {user.lastName}</b>
          <span className="text-[12px] text-inkfaint">{user.email}</span>
        </div>
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}
            className="rounded-lg px-2.5 py-2 text-[14px] font-semibold text-inksoft hover:bg-paper2 hover:text-bordeaux">
            {item.label}
          </Link>
        ))}
        <div className="border-t border-line px-1 pt-2">
          <LogoutButton className="w-full rounded-lg px-1.5 py-2 text-left text-[14px] font-semibold text-inkfaint hover:text-ember" />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
