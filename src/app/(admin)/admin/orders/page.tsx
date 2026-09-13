import Link from 'next/link';
import type { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { adminPath, formatDateTime } from '@/lib/utils';
import { requireAdmin } from '@/lib/rbac';
import { STATUS_FLOW, STATUS_LABELS } from '@/services/orders';
import { StatusSelect } from '@/components/admin/StatusSelect';

export const dynamic = 'force-dynamic';
const PER_PAGE = 25;

const TABS: Array<{ key: string; label: string; where: Prisma.OrderWhereInput }> = [
  { key: 'all', label: 'Усі', where: {} },
  { key: 'new', label: 'Нові', where: { status: 'NEW' } },
  { key: 'work', label: 'У роботі', where: { status: { in: ['CONFIRMED', 'PREPARING', 'PACKED', 'HANDED_TO_COURIER', 'ON_THE_WAY'] } } },
  { key: 'done', label: 'Виконані', where: { status: 'DELIVERED' } },
  { key: 'cancelled', label: 'Скасовані', where: { status: 'CANCELLED' } },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  await requireAdmin('orders');
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const q = sp.q?.trim();

  const where: Prisma.OrderWhereInput = {
    ...tab.where,
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
            { customerLastName: { contains: q, mode: 'insensitive' } },
            { customerFirstName: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE, take: PER_PAGE,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const countFor = (status: OrderStatus) => counts.find((c) => c.status === status)?._count._all ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const href = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { tab: sp.tab, q: sp.q, page: sp.page, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const qs = next.toString();
    return `${adminPath('orders')}${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-[25px]">Замовлення · {total}</h1>
        <span className="text-[12.5px] text-inkfaint">
          Нових: <b className="text-ink">{countFor('NEW')}</b> · В дорозі: <b className="text-ink">{countFor('ON_THE_WAY')}</b>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex gap-0.5 rounded-full bg-paper2 p-0.5">
          {TABS.map((t) => (
            <Link key={t.key} href={href({ tab: t.key === 'all' ? undefined : t.key, page: undefined })}
              className={`rounded-full px-3 py-1.5 text-[11.5px] font-bold ${
                t.key === tab.key ? 'bg-paper text-ink shadow-soft' : 'text-inkfaint'
              }`}>
              {t.label}
            </Link>
          ))}
        </div>
        <form className="flex gap-2" action={adminPath('orders')}>
          {sp.tab && <input type="hidden" name="tab" value={sp.tab} />}
          <input name="q" defaultValue={q} placeholder="Номер, телефон або прізвище"
            aria-label="Пошук замовлень" className="!w-auto min-w-[220px] !rounded-full !py-2 text-[13px]" />
          <button type="submit" className="btn btn-ghost btn-sm">Знайти</button>
        </form>
      </div>

      <section className="min-w-0 rounded-xl2 border border-line bg-paper p-4">
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[860px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-inkfaint">
                {['№', 'Дата', 'Клієнт', 'Телефон', 'Позицій', 'Сума', 'Доставка', 'Оплата', 'Статус', ''].map((h) => (
                  <th key={h} className="px-3 pb-2.5 text-left font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0 hover:bg-paper2">
                  <td className="tabular whitespace-nowrap px-3 py-2.5 font-bold">{order.number}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5">{formatDateTime(order.createdAt)}</td>
                  <td className="px-3 py-2.5">{order.customerFirstName} {order.customerLastName}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5">{order.phone}</td>
                  <td className="tabular px-3 py-2.5">{order._count.items}</td>
                  <td className="tabular whitespace-nowrap px-3 py-2.5 font-bold">{formatMoney(order.total)}</td>
                  <td className="px-3 py-2.5">{order.deliveryMethodName}</td>
                  <td className="px-3 py-2.5">{order.paymentMethodName}</td>
                  <td className="px-3 py-2.5">
                    <StatusSelect orderId={order.id} status={order.status} allowed={STATUS_FLOW[order.status]} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link href={adminPath(`orders/${order.id}`)} className="btn btn-ghost btn-sm">Відкрити</Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-10 text-center text-inkfaint">Замовлень за цим фільтром немає</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex flex-wrap justify-center gap-1.5 pt-4">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={href({ page: p === 1 ? undefined : String(p) })}
                className={`grid h-9 min-w-9 place-items-center rounded-lg border border-line px-3 text-[13.5px] font-bold ${
                  p === page ? '!border-transparent bg-bordeaux text-paper' : 'bg-paper'
                }`}>
                {p}
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="text-[12px] text-inkfaint">
        Статуси змінюються лише за дозволеними переходами: {Object.entries(STATUS_LABELS).slice(0, 7).map(([, l]) => l).join(' → ')}.
        Скасування повертає залишки на склад.
      </p>
    </div>
  );
}
