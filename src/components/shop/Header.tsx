import Link from 'next/link';
import { getSettings } from '@/services/settings';
import { getCategories } from '@/services/catalog';
import { readCart, cartCount } from '@/services/cart';
import { currentUser } from '@/services/account';
import { prisma } from '@/lib/prisma';
import { IconCart, IconUser, IconHeart, IconTelegram, IconInstagram, IconFacebook, Logo } from '@/components/ui/Icons';
import { SearchBox } from './SearchBox';
import { MobileMenu } from './MobileMenu';

export async function Header() {
  const [settings, categories, cart, user] = await Promise.all([
    getSettings(), getCategories(), readCart(), currentUser(),
  ]);
  const count = cartCount(cart);
  const favorites = user
    ? await prisma.favorite.count({ where: { userId: user.id } }).catch(() => 0)
    : 0;

  const nav = [
    { href: '/catalog', label: 'Каталог' },
    { href: '/catalog?sale=1', label: 'Акції' },
    { href: '/catalog?fresh=1', label: 'Новинки' },
    { href: '/about', label: 'Про нас' },
    { href: '/delivery', label: 'Доставка' },
    { href: '/contacts', label: 'Контакти' },
  ];

  return (
    <>
      <div className="hidden bg-ink text-[12.5px] text-paper2 lg:block">
        <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 py-1.5">
          <span>{settings.workingHours} · {settings.address}</span>
          <span className="flex items-center gap-5">
            <a href={`tel:${settings.phone.replace(/\D/g, '')}`} className="hover:text-white">{settings.phone}</a>
            <span className="flex gap-3">
              {settings.telegram && <a href={settings.telegram} aria-label="Telegram" className="hover:text-white"><IconTelegram size={16} /></a>}
              {settings.instagram && <a href={settings.instagram} aria-label="Instagram" className="hover:text-white"><IconInstagram size={16} /></a>}
              {settings.facebook && <a href={settings.facebook} aria-label="Facebook" className="hover:text-white"><IconFacebook size={16} /></a>}
            </span>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-line bg-paper">
        <div className="wrap flex flex-wrap items-center gap-x-3.5 gap-y-3 py-3">
          <MobileMenu
            items={[
              { href: '/catalog', label: 'Увесь каталог' },
              ...categories.map((c) => ({ href: `/catalog/${c.slug}`, label: c.name })),
              { href: '/catalog?sale=1', label: 'Акції' },
              { href: '/catalog?fresh=1', label: 'Новинки' },
              { href: '/delivery', label: 'Доставка та оплата' },
              { href: '/contacts', label: 'Контакти' },
              { href: user ? '/account' : '/account/login', label: user ? `Кабінет · ${user.firstName}` : 'Увійти' },
            ]}
            phone={settings.phone}
            hours={settings.workingHours}
          />

          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label="На головну">
            <Logo size={38} />
            <span className="flex flex-col leading-none">
              <b className="display truncate text-[19px]">{settings.shopName}</b>
              <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-inkfaint">{settings.tagline}</span>
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 lg:flex" aria-label="Головне меню">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}
                className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-inksoft hover:bg-paper2 hover:text-bordeaux">
                {item.label}
              </Link>
            ))}
          </nav>

          <SearchBox />

          <div className="flex shrink-0 items-center gap-1">
            <Link href={user ? '/account/favorites' : '/account/login'} aria-label={`Обране${favorites ? `, ${favorites}` : ''}`}
              className="relative hidden h-10 w-10 place-items-center rounded-lg text-inksoft hover:bg-paper2 hover:text-bordeaux lg:grid">
              <IconHeart size={19} />
              {favorites > 0 && (
                <span className="tabular absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-oak px-1 text-[10.5px] font-extrabold text-white">
                  {favorites}
                </span>
              )}
            </Link>
            <Link href={user ? '/account' : '/account/login'}
              aria-label={user ? `Кабінет, ${user.firstName}` : 'Увійти'}
              className="hidden items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-inksoft hover:bg-paper2 hover:text-bordeaux lg:flex">
              <IconUser size={20} />
              <span className="max-w-[90px] truncate">{user ? user.firstName : 'Увійти'}</span>
            </Link>
            <Link href="/cart" aria-label={`Кошик, ${count} позицій`}
              className="relative grid h-10 w-10 place-items-center rounded-lg text-inksoft hover:bg-paper2 hover:text-bordeaux">
              <IconCart size={21} />
              {count > 0 && (
                <span className="tabular absolute right-0.5 top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-ember px-1 text-[10.5px] font-extrabold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
