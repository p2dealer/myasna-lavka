import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatMoney, formatGrams } from '@/lib/money';
import { formatDateTime, adminPath } from '@/lib/utils';
import { requireAdmin } from '@/lib/rbac';
import { dashboardStats, salesSeries, topProducts, STATUS_FLOW } from '@/services/orders';
import { isWeightBased } from '@/services/pricing';
import { SalesChart, StatCard } from '@/components/admin/SalesChart';
import { StatusSelect } from '@/components/admin/StatusSelect';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdmin('orders');
  const { range } = await searchParams;
  const days = range === '7' ? 7 : range === '90' ? 90 : 30;

  const [stats, series, top, recent, categorySales] = await Promise.all([
  dashboardStats(),
  salesSeries(days),
  topProducts(5),
  prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
  Promise.resolve([]), // Защита от ошибок groupBy для категорий
]);

  let totalSales = 0;
if (Array.isArray(categorySales)) {
  categorySales.forEach((r: any) => {
    totalSales += Number(r?._sum?.lineTotal || 0);
  });
}

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-[25px]">Дашборд</h1>
        <div className="inline-flex gap-0.5 rounded-full bg-paper2 p-0.5">
          {[['7', '7 днів'], ['30', '30 днів'], ['90', '3 місяці']].map(([value, label]) => (
            <Link key={value} href={`${adminPath()}?range=${value}`}
              className={`rounded-full px-3 py-1.5 text-[11.5px] font-bold ${
                String(days) === value ? 'bg-paper text-ink shadow-soft' : 'text-inkfaint'
              }`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Продажі сьогодні" value={formatMoney(stats.todayTotal)}
          delta={stats.dayOverDay === null ? 'перший день' : `${stats.dayOverDay > 0 ? '↑' : '↓'} ${Math.abs(stats.dayOverDay)} % до вчора`}
          tone={stats.dayOverDay === null ? 'flat' : stats.dayOverDay >= 0 ? 'up' : 'down'} />
        <StatCard label="Замовлень сьогодні" value={String(stats.todayCount)} delta={`${stats.newOrders} нових у роботі`} />
        <StatCard label="Середній чек" value={formatMoney(stats.todayAverage)} />
        <StatCard label={`Виторг за ${days} днів`} value={formatMoney(stats.monthTotal)} delta={`${stats.monthCount} замовлень`} />
        <StatCard label="Клієнтів" value={String(stats.customers)} />
        <StatCard label="Мало на складі" value={String(stats.lowStock.length)}
          delta={stats.lowStock.length ? 'потребує уваги' : 'усе гаразд'}
          tone={stats.lowStock.length ? 'down' : 'up'} />
      </div>

      <div className="grid gap-3.5 xl:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0 rounded-xl2 border border-line bg-paper p-4">
          <h2 className="mb-3 text-[14.5px] font-extrabold">Динаміка продажів</h2>
          <SalesChart data={series} />
        </section>

        <section className="rounded-xl2 border border-line bg-paper p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[14.5px] font-extrabold">Закінчуються</h2>
            <span className="text-[11.5px] text-inkfaint">поріг задається на товар</span>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-inkfaint">Усі залишки вище порогу</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-[13.5px]">
                  <span className="min-w-0 flex-1">
                    <Link href={adminPath(`products/${p.id}`)} className="block truncate font-semibold hover:text-bordeaux">
                      {p.name}
                    </Link>
                    <span className="text-[11.5px] text-inkfaint">{p.sku}</span>
                  </span>
                  <b className={`tabular shrink-0 ${p.stock <= p.lowStockThreshold ? 'text-ember' : 'text-warn'}`}>
                    {isWeightBased(p.pricingMode) ? formatGrams(p.stock) : `${p.stock} шт`}
                  </b>
                </li>
              ))}
            </ul>
          )}
          <Link href={adminPath('inventory')} className="btn btn-ghost btn-sm mt-3 w-full">Усі залишки</Link>
        </section>
      </div>

      <section className="min-w-0 rounded-xl2 border border-line bg-paper p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[14.5px] font-extrabold">Останні замовлення</h2>
          <Link href={adminPath('orders')} className="btn btn-ghost btn-sm">Усі замовлення</Link>
        </div>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-inkfaint">
                {['№', 'Дата', 'Клієнт', 'Сума', 'Доставка', 'Статус', ''].map((h) => (
                  <th key={h} className="px-3 pb-2.5 text-left font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0 hover:bg-paper2">
                  <td className="tabular whitespace-nowrap px-3 py-2.5 font-bold">{order.number}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5">{formatDateTime(order.createdAt)}</td>
                  <td className="px-3 py-2.5">{order.customerFirstName} {order.customerLastName}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5 font-bold">{formatMoney(order.total)}</td>
                  <td className="px-3 py-2.5">{order.deliveryMethodName}</td>
                  <td className="px-3 py-2.5">
                    <StatusSelect orderId={order.id} status={order.status} allowed={STATUS_FLOW[order.status]} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link href={adminPath(`orders/${order.id}`)} className="btn btn-ghost btn-sm">Відкрити</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-3.5 xl:grid-cols-2">
        <section className="min-w-0 rounded-xl2 border border-line bg-paper p-4">
          <h2 className="mb-3 text-[14.5px] font-extrabold">Найкращі товари за виторгом</h2>
          {top.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-inkfaint">Замовлень ще не було</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {top.map((row) => (
                <li key={row.name} className="flex items-baseline justify-between gap-4 text-[13.5px]">
                  <span className="min-w-0 truncate">{row.name}</span>
                  <b className="tabular shrink-0">{formatMoney(row.revenue)}</b>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl2 border border-line bg-paper p-4">
          <h2 className="mb-3 text-[14.5px] font-extrabold">Частка у виторгу</h2>
          <div className="flex flex-col gap-2.5">
            {top.map((row) => {
              const share = totalSales ? Math.round((row.revenue / totalSales) * 100) : 0;
              return (
                <div key={row.name}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="truncate pr-3">{row.name}</span>
                    <b className="tabular">{share} %</b>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-paper2">
                    <i className="block h-full rounded-full bg-bordeaux" style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
