import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/utils';
import { requireAdmin } from '@/lib/rbac';
import { CouponForm } from '@/components/admin/Forms';
import { CouponToggle } from '@/components/admin/RowActions';

export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = {
  PERCENT: 'Відсоток', FIXED: 'Фіксована сума', FREE_SHIPPING: 'Безкоштовна доставка',
};

export default async function AdminMarketingPage() {
  await requireAdmin('marketing');
  const [coupons, banners] = await Promise.all([
    prisma.coupon.findMany({ orderBy: [{ isActive: 'desc' }, { code: 'asc' }] }),
    prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-[25px]">Промокоди й акції</h1>

      <section className="min-w-0 rounded-xl2 border border-line bg-paper p-4">
        <h2 className="mb-3 text-[14.5px] font-extrabold">Промокоди · {coupons.length}</h2>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[820px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-inkfaint">
                {['Код', 'Тип', 'Значення', 'Умови', 'Використань', 'Період', 'Стан', ''].map((h) => (
                  <th key={h} className="px-3 pb-2.5 text-left font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-paper2">
                  <td className="tabular px-3 py-2.5 font-bold">{c.code}</td>
                  <td className="px-3 py-2.5">{TYPES[c.type]}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5">
                    {c.type === 'PERCENT' ? `${c.value} %` : c.type === 'FIXED' ? formatMoney(c.value) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {c.minOrderTotal ? `від ${formatMoney(c.minOrderTotal)}` : 'без обмежень'}
                  </td>
                  <td className="tabular px-3 py-2.5">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5">
                    {c.startsAt || c.endsAt
                      ? `${c.startsAt ? formatDate(c.startsAt) : '…'} – ${c.endsAt ? formatDate(c.endsAt) : '…'}`
                      : 'безстроково'}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`pill ${c.isActive ? 'bg-good/15 text-good' : 'bg-paper2 text-inkfaint'}`}>
                      {c.isActive ? 'Активний' : 'Вимкнений'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right"><CouponToggle couponId={c.id} isActive={c.isActive} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-1 text-[14.5px] font-extrabold">Створити або оновити промокод</h2>
        <p className="mb-4 text-[12.5px] text-inkfaint">
          Якщо код уже існує, його налаштування буде оновлено. Порядок застосування знижок: акція товару → промокод → доставка.
        </p>
        <CouponForm />
      </section>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-3 text-[14.5px] font-extrabold">Банери на головній</h2>
        <ul className="flex flex-col gap-2.5 text-[13.5px]">
          {banners.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2.5 last:border-0">
              <span>
                <b>{b.title}</b>
                <span className="block text-[12px] text-inkfaint">{b.subtitle}</span>
              </span>
              <span className={`pill ${b.isActive ? 'bg-good/15 text-good' : 'bg-paper2 text-inkfaint'}`}>
                {b.isActive ? 'Показується' : 'Вимкнений'}
              </span>
            </li>
          ))}
          {banners.length === 0 && <li className="text-inkfaint">Банерів ще немає</li>}
        </ul>
      </section>
    </div>
  );
}
