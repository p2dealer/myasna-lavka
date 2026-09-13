import Link from 'next/link';
import { getSettings } from '@/services/settings';
import { IconTelegram, IconInstagram, IconFacebook, Logo } from '@/components/ui/Icons';

export async function Footer() {
  const settings = await getSettings();
  const cols: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
    {
      title: 'Магазин',
      links: [
        { href: '/catalog', label: 'Каталог' },
        { href: '/catalog?sale=1', label: 'Акції' },
        { href: '/catalog?fresh=1', label: 'Новинки' },
        { href: '/about', label: 'Про магазин' },
      ],
    },
    {
      title: 'Покупцям',
      links: [
        { href: '/delivery', label: 'Доставка та оплата' },
        { href: '/returns', label: 'Повернення' },
        { href: '/privacy', label: 'Політика конфіденційності' },
        { href: '/terms', label: 'Умови використання' },
        { href: '/cookies', label: 'Політика cookie' },
      ],
    },
  ];

  return (
    <footer className="mt-4 bg-ink text-[#C9BAAC]">
      <div className="wrap">
        <div className="grid grid-cols-2 gap-8 py-11 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <Logo size={34} />
              <span className="flex flex-col leading-none">
                <b className="display text-[18px] text-[#F3EBDF]">{settings.shopName}</b>
                <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#8D7E70]">{settings.tagline}</span>
              </span>
            </div>
            <p className="mt-3.5 max-w-[36ch] text-[13.5px] leading-relaxed">{settings.footerNote}</p>
            <div className="mt-4 flex gap-3.5">
              {settings.telegram && <a href={settings.telegram} aria-label="Telegram" className="hover:text-white"><IconTelegram /></a>}
              {settings.instagram && <a href={settings.instagram} aria-label="Instagram" className="hover:text-white"><IconInstagram /></a>}
              {settings.facebook && <a href={settings.facebook} aria-label="Facebook" className="hover:text-white"><IconFacebook /></a>}
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8D7E70]">{col.title}</h4>
              <ul className="flex flex-col gap-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-3.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8D7E70]">Контакти</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href={`tel:${settings.phone.replace(/\D/g, '')}`} className="hover:text-white">{settings.phone}</a></li>
              <li><a href={`mailto:${settings.email}`} className="hover:text-white">{settings.email}</a></li>
              <li>{settings.address}</li>
              <li>{settings.workingHours}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-[#2E251E] py-4 text-[12.5px] text-[#8D7E70]">
          <span>© {new Date().getFullYear()} {settings.shopName}. Усі права захищено.</span>
          <span>Ціни, товари й контакти редагуються в адмін-панелі</span>
        </div>
      </div>
    </footer>
  );
}
