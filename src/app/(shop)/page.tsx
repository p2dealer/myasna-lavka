import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { getCategories, getHomeSelections } from '@/services/catalog';
import { getSettings } from '@/services/settings';
import { currentUser, favoriteIds } from '@/services/account';
import { ProductGrid, ProductGridSkeleton } from '@/components/shop/ProductCard';
import { Subscribe } from '@/components/shop/Subscribe';
import {
  IconArrow, IconClock, IconKnife, IconPack, IconShield, IconSnow, IconTruck, Stars,
} from '@/components/ui/Icons';

// Хедер читає кошик і сесію з cookie, тому сторінка рендериться на запит.
// Дані каталогу кешуються на рівні запитів Prisma та тегів у services/settings.
export const dynamic = 'force-dynamic';

const PERKS = [
  { icon: IconKnife, title: 'Власна різниця', text: 'Розбираємо туші самі — знаємо кожен відруб в обличчя' },
  { icon: IconSnow, title: 'Холодовий ланцюг', text: 'Від 0 до +4 °C на всьому шляху до вашої кухні' },
  { icon: IconTruck, title: 'Доставка за 2 години', text: 'По Києву щодня з 09:00 до 21:00' },
  { icon: IconPack, title: 'Вакуумне пакування', text: 'Кожен відруб окремо, з датою та вагою на етикетці' },
  { icon: IconShield, title: 'Контроль якості', text: 'Ветеринарний висновок на кожну партію' },
  { icon: IconClock, title: 'Витримка 28 діб', text: 'Власна камера сухого визрівання для стейків' },
];

const STEPS = [
  ['Відбір на фермі', 'Працюємо з чотирма господарствами й приймаємо тільки ті партії, які оглянув наш різник.'],
  ['Розбирання й визрівання', 'Розбираємо туші у власному цеху вранці. Стейкові відруби йдуть у камеру сухого визрівання.'],
  ['Пакування у вакуум', 'Кожен відруб зважується окремо. На етикетці — вага, дата й номер партії.'],
  ['Доставка того ж дня', 'Замовлення до 15:00 виїжджає сьогодні в термобоксі з холодовими акумуляторами.'],
];

const FAQ = [
  ['Як рахується вага, якщо відруб не рівно кілограм?', 'Ви замовляєте орієнтовну вагу, а пакувальник зважує реальний відруб. Якщо фактична вага відрізняється, сума перераховується й ви бачите оновлений рахунок до оплати. Відхилення більше ніж на 10 % ми узгоджуємо телефоном.'],
  ['Коли приїде замовлення?', 'По Києву — того ж дня, якщо замовлення оформлене до 15:00, у двогодинному вікні на ваш вибір. Нова Пошта — наступного дня в термопакуванні.'],
  ['Як зберігати м’ясо після доставки?', 'Охолоджене м’ясо у вакуумі зберігається від 0 до +4 °C до дати на етикетці — зазвичай 5–7 діб. Якщо плануєте готувати пізніше, заморозьте у тому ж вакуумі, не розкриваючи упаковку.'],
  ['Чи можна повернути товар?', 'Так, якщо є претензія до якості. Зніміть відео розпакування й зателефонуйте протягом доби — ми забираємо товар власним кур’єром і повертаємо гроші або замінюємо позицію.'],
];

async function Hits() {
  const [selections, user] = await Promise.all([
    getHomeSelections().catch(() => [[], [], []] as const),
    currentUser(),
  ]);
  const [hits, sale, fresh] = selections;
  const favorites = await favoriteIds(user?.id ?? null);
  return (
    <>
      <Section title="Хіти продажів" eyebrow="Обирають найчастіше" href="/catalog?sort=popular" linkLabel="Дивитись усі">
        <ProductGrid products={hits} favorites={favorites} />
      </Section>
      {sale.length > 0 && (
        <Section title="Акційні товари" eyebrow="Знижені ціни" href="/catalog?sale=1" linkLabel="Усі акції">
          <ProductGrid products={sale} favorites={favorites} />
        </Section>
      )}
      {fresh.length > 0 && (
        <Section title="Новинки" eyebrow="Щойно в каталозі" href="/catalog?fresh=1" linkLabel="Усі новинки">
          <ProductGrid products={fresh} favorites={favorites} />
        </Section>
      )}
    </>
  );
}

function Section({ title, eyebrow, href, linkLabel, children }: {
  title: string; eyebrow?: string; href?: string; linkLabel?: string; children: React.ReactNode;
}) {
  return (
    <section className="wrap pb-12">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <h2 className="display text-[clamp(23px,3.6vw,32px)] leading-tight">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-bordeaux hover:gap-2.5">
            {linkLabel} <IconArrow size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function HomePage() {
  const [settings, categories, banner] = await Promise.all([
    getSettings(),
    getCategories().catch(() => []),
    prisma.banner.findFirst({ where: { placement: 'promo', isActive: true }, orderBy: { sortOrder: 'asc' } }).catch(() => null),
  ]);

  return (
    <>
      <section className="bg-ink text-[#F5EDE2]">
        <div className="wrap grid items-center gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="order-2 lg:order-1">
            <p className="eyebrow mb-2 !text-[#C79A6A]">Київ · доставка сьогодні</p>
            <h1 className="display mb-4 text-[clamp(34px,5.6vw,58px)] leading-[1.04]">{settings.heroTitle}</h1>
            <p className="mb-6 max-w-[44ch] text-[clamp(15.5px,2.2vw,18px)] text-[#CBBBA9]">{settings.heroSubtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className="btn btn-primary btn-lg">
                {settings.heroCtaLabel} <IconArrow size={14} />
              </Link>
              <Link href="/catalog?sort=popular" className="btn btn-lg border border-[#F5EDE2]/30 text-[#F5EDE2] hover:border-[#F5EDE2]">
                Хіти продажів
              </Link>
            </div>
            <dl className="mt-7 flex flex-wrap gap-x-7 gap-y-2 border-t border-[#F5EDE2]/15 pt-5 text-[12.5px] text-[#B9A794]">
              {[['12', 'років на ринку'], ['28 діб', 'сухого визрівання'], ['4.8', 'середня оцінка'], ['2 год', 'доставка по Києву']].map(([v, l]) => (
                <div key={l}>
                  <dt className="display text-[22px] text-[#F5EDE2]">{v}</dt>
                  <dd>{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative order-1 aspect-[16/11] overflow-hidden rounded-xl3 shadow-pop lg:order-2 lg:aspect-[4/3.2]">
            <Image src="/api/img/ribeye/beef/7" alt="Стейк Ribeye сухого визрівання" fill unoptimized priority
              sizes="(max-width: 1024px) 100vw, 560px" className="object-cover" />
          </div>
        </div>
      </section>

      <Section title="Категорії" eyebrow="Каталог" href="/catalog" linkLabel="Усі категорії">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/catalog/${c.slug}`}
              className="group relative flex aspect-[1/1.02] flex-col justify-end overflow-hidden rounded-xl2 p-4 text-white transition hover:-translate-y-1">
              {c.imageUrl && <Image src={c.imageUrl} alt="" fill unoptimized sizes="200px" className="object-cover" />}
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <span className="display relative text-[19px] leading-tight">{c.name}</span>
              <span className="relative text-[11.5px] font-semibold text-white/70">{c.description}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Suspense fallback={<Section title="Хіти продажів"><ProductGridSkeleton count={4} /></Section>}>
        <Hits />
      </Suspense>

      {banner && (
        <section className="wrap pb-12">
          <div className="grid items-center overflow-hidden rounded-xl3 bg-bordeaux text-[#FFF3EE] md:grid-cols-[1.2fr_1fr]">
            <div className="p-7 md:p-9">
              <p className="eyebrow mb-2 !text-[#E7B99C]">Акція тижня</p>
              <h3 className="display mb-2.5 text-[clamp(22px,3.4vw,32px)] leading-tight">{banner.title}</h3>
              <p className="mb-5 max-w-[40ch] text-[14.5px] text-[#FFF3EE]/80">{banner.subtitle}</p>
              {banner.ctaUrl && <Link href={banner.ctaUrl} className="btn btn-ink">{banner.ctaLabel}</Link>}
              <span className="ml-3 inline-block rounded-md border border-dashed border-[#FFF3EE]/40 bg-[#FFF3EE]/15 px-3 py-1.5 font-mono text-[13px]">
                промокод BBQ10
              </span>
            </div>
            <div className="relative hidden h-full min-h-[220px] md:block">
              {banner.imageUrl && <Image src={banner.imageUrl} alt="" fill unoptimized sizes="400px" className="object-cover" />}
            </div>
          </div>
        </section>
      )}

      <Section title="Переваги магазину" eyebrow="Чому нас обирають">
        <div className="grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col gap-2 bg-paper p-5">
              <Icon className="text-bordeaux" size={18} />
              <b className="text-sm">{title}</b>
              <span className="text-[12.5px] leading-snug text-inkfaint">{text}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Як ми працюємо" eyebrow="Від ферми до столу">
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="flex flex-col gap-2 border-t-2 border-line2 pt-4">
              <span className="font-mono text-[12px] font-semibold text-ember">0{i + 1}</span>
              <b className="text-[15px]">{title}</b>
              <span className="text-[13.5px] leading-relaxed text-inkfaint">{text}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Відгуки покупців" eyebrow="4.8 із 5 · 1 240 оцінок">
        <div className="grid gap-3.5 md:grid-cols-3">
          {[
            ['Олена Т.', 'Київ, Печерськ · 14 замовлень', 5, 'Ribeye приїхав у вакуумі з датою розбирання й точною вагою — 1,08 кг замість замовленого кілограма, різницю перерахували в чеку. Стейк вийшов кращим, ніж у ресторані поруч.'],
            ['Дмитро К.', 'Київ, Оболонь · 31 замовлення', 5, 'Беру фарш і курячі стегна щотижня. Жодного разу не було претензій до свіжості, кур’єр приїжджає у вікно, яке обіцяли в підтвердженні.'],
            ['Ірина В.', 'Бровари · 6 замовлень', 4, 'Мангальний набір закрив питання з пікніком на дванадцятеро. Хотілося б більше варіантів маринаду в описі.'],
          ].map(([name, meta, rating, text]) => (
            <figure key={name as string} className="flex flex-col gap-3 rounded-xl2 border border-line bg-paper p-5">
              <Stars rating={rating as number} />
              <blockquote className="text-[14.5px] leading-relaxed text-inksoft">{text}</blockquote>
              <figcaption className="mt-auto flex items-center gap-2.5 pt-1.5">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-line bg-paper2 text-[13px] font-extrabold text-bordeaux">
                  {(name as string)[0]}
                </span>
                <span>
                  <b className="block text-[13.5px]">{name}</b>
                  <span className="text-[11.5px] text-inkfaint">{meta}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section title="Часті запитання" eyebrow="Коротко">
        <div className="border-t border-line">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0} className="group border-b border-line">
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-[15px] font-bold marker:content-none">
                {q}
                <span className="font-mono text-lg text-ember group-open:hidden">+</span>
                <span className="hidden font-mono text-lg text-ember group-open:inline">−</span>
              </summary>
              <p className="max-w-[70ch] pb-4 text-[14.5px] leading-relaxed text-inksoft">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      <section className="wrap pb-14">
        <div className="grid items-center gap-5 rounded-xl3 border border-line bg-paper p-7 md:grid-cols-[1fr_auto]">
          <div>
            <h3 className="display mb-1.5 text-[clamp(21px,3vw,27px)]">Знижки й новинки — раз на тиждень</h3>
            <p className="text-sm text-inkfaint">
              Пишемо коротко: що з’явилось у каталозі, що на акції, коли завозимо ягня. Без спаму.
            </p>
          </div>
          <Subscribe />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: settings.shopName,
            description: settings.description,
            telephone: settings.phone,
            email: settings.email,
            address: { '@type': 'PostalAddress', streetAddress: settings.address, addressLocality: 'Київ', addressCountry: 'UA' },
            openingHours: settings.workingHours,
            sameAs: [settings.telegram, settings.instagram, settings.facebook].filter(Boolean),
          }),
        }}
      />
    </>
  );
}
