import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';
import { requireAdmin } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  await requireAdmin('customers');

  // CRM будується з історії замовлень: клієнт ідентифікується за телефоном,
  // тож рахуються й ті, хто купував без реєстрації.
  const grouped = await prisma.order.groupBy({
    by: ['phone'],
    where: { status: { not: 'CANCELLED' } },
    _count: { _all: true },
    _sum: { total: true },
    _max: { createdAt: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 100,
  });

  const latest = await prisma.order.findMany({
    where: { phone: { in: grouped.map((g) => g.phone) } },
    orderBy: { createdAt: 'desc' },
    select: { phone: true, customerFirstName: true, customerLastName: true, email: true, city: true },
  });
  const byPhone = new Map(latest.map((o) => [o.phone, o]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="display text-[25px]">Клієнти · {grouped.length}</h1>
        <p className="text-[12.5px] text-inkfaint">Дані зібрані з історії замовлень, включно з покупками без реєстрації.</p>
      </div>

      <section className="min-w-0 rounded-xl2 border border-line bg-paper p-4">
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[760px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-inkfaint">
                {['Клієнт', 'Телефон', 'Email', 'Місто', 'Замовлень', 'Сума покупок', 'Середній чек', 'Остання покупка'].map((h) => (
                  <th key={h} className="px-3 pb-2.5 text-left font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map((row) => {
                const info = byPhone.get(row.phone);
                const sum = row._sum.total ?? 0;
                return (
                  <tr key={row.phone} className="border-b border-line last:border-0 hover:bg-paper2">
                    <td className="px-3 py-2.5 font-bold">
                      {info ? `${info.customerFirstName} ${info.customerLastName}` : '—'}
                    </td>
                    <td className="tabular whitespace-nowrap px-3 py-2.5">{row.phone}</td>
                    <td className="px-3 py-2.5 text-inkfaint">{info?.email ?? '—'}</td>
                    <td className="px-3 py-2.5">{info?.city ?? '—'}</td>
                    <td className="tabular px-3 py-2.5">{row._count._all}</td>
                    <td className="tabular whitespace-nowrap px-3 py-2.5 font-bold">{formatMoney(sum)}</td>
                    <td className="tabular whitespace-nowrap px-3 py-2.5">{formatMoney(Math.round(sum / row._count._all))}</td>
                    <td className="tabular whitespace-nowrap px-3 py-2.5">
                      {row._max.createdAt ? formatDateTime(row._max.createdAt) : '—'}
                    </td>
                  </tr>
                );
              })}
              {grouped.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-10 text-center text-inkfaint">Замовлень ще не було</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
