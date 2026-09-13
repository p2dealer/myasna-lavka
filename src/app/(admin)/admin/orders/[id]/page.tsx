import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatMoney, formatGrams } from '@/lib/money';
import { adminPath, formatDateTime } from '@/lib/utils';
import { requireAdmin } from '@/lib/rbac';
import { STATUS_FLOW, STATUS_LABELS } from '@/services/orders';
import { StatusSelect } from '@/components/admin/StatusSelect';
import { OrderNote } from '@/components/admin/OrderNote';

export const dynamic = 'force-dynamic';

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin('orders');
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, events: { orderBy: { createdAt: 'asc' } } },
  });
  if (!order) notFound();

  const address = order.deliveryMethodCode === 'np'
    ? [order.city, order.branch].filter(Boolean).join(', ')
    : [order.city, order.street, order.house, order.apartment && `кв. ${order.apartment}`].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={adminPath('orders')} className="text-[12.5px] text-inkfaint hover:text-bordeaux">← До списку</Link>
          <h1 className="display text-[25px]">Замовлення {order.number}</h1>
          <p className="text-[12.5px] text-inkfaint">Створено {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusSelect orderId={order.id} status={order.status} allowed={STATUS_FLOW[order.status]} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <section className="min-w-0 rounded-xl2 border border-line bg-paper p-5">
          <h2 className="mb-3 text-[14.5px] font-extrabold">Склад замовлення</h2>
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[520px] border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-inkfaint">
                  {['Товар', 'Артикул', 'Кількість', 'Ціна', 'Сума'].map((h) => (
                    <th key={h} className="px-2 pb-2.5 text-left font-extrabold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-line last:border-0">
                    <td className="px-2 py-2.5 font-semibold">{item.nameSnapshot}</td>
                    <td className="tabular px-2 py-2.5">{item.skuSnapshot}</td>
                    <td className="tabular whitespace-nowrap px-2 py-2.5">
                      {item.grams ? formatGrams(item.grams) : '1 шт'} × {item.quantity}
                    </td>
                    <td className="tabular whitespace-nowrap px-2 py-2.5">{formatMoney(item.unitPrice)}</td>
                    <td className="tabular whitespace-nowrap px-2 py-2.5 font-bold">{formatMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3.5 text-sm">
            <div className="flex justify-between"><dt className="text-inkfaint">Товари</dt><dd className="tabular">{formatMoney(order.subtotal)}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-good">
                <dt>Знижка{order.couponCode ? ` · ${order.couponCode}` : ''}</dt>
                <dd className="tabular">−{formatMoney(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between"><dt className="text-inkfaint">Доставка</dt><dd className="tabular">{order.deliveryFee ? formatMoney(order.deliveryFee) : 'Безкоштовно'}</dd></div>
            <div className="flex justify-between border-t border-line pt-2.5 text-[16px]">
              <dt className="font-bold">Разом</dt>
              <dd className="tabular text-[22px] font-extrabold">{formatMoney(order.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-col gap-3.5">
          <section className="rounded-xl2 border border-line bg-paper p-5">
            <h2 className="mb-3 text-[14.5px] font-extrabold">Клієнт і доставка</h2>
            <dl className="flex flex-col gap-2 text-[13.5px]">
              {[
                ['Отримувач', `${order.customerFirstName} ${order.customerLastName}`],
                ['Телефон', order.phone],
                ['Email', order.email ?? '—'],
                ['Доставка', order.deliveryMethodName],
                ['Адреса', address],
                ['Оплата', `${order.paymentMethodName} · ${order.paymentStatus === 'PAID' ? 'оплачено' : 'очікує'}`],
                ['Коментар клієнта', order.comment ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="shrink-0 text-inkfaint">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <a href={`tel:${order.phone.replace(/\D/g, '')}`} className="btn btn-ghost btn-sm">Подзвонити</a>
              <Link href={`/order/${order.number}`} target="_blank" className="btn btn-ghost btn-sm">Сторінка клієнта</Link>
            </div>
          </section>

          <section className="rounded-xl2 border border-line bg-paper p-5">
            <h2 className="mb-3 text-[14.5px] font-extrabold">Коментар менеджера</h2>
            <OrderNote orderId={order.id} note={order.adminNote ?? ''} />
          </section>

          <section className="rounded-xl2 border border-line bg-paper p-5">
            <h2 className="mb-3 text-[14.5px] font-extrabold">Історія статусів</h2>
            <ol className="flex flex-col gap-2.5">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-3 text-[13px]">
                  <span className="tabular shrink-0 text-inkfaint">{formatDateTime(event.createdAt)}</span>
                  <span>
                    <b>{STATUS_LABELS[event.to]}</b>
                    {event.from && <span className="text-inkfaint"> (з «{STATUS_LABELS[event.from]}»)</span>}
                    {event.note && <span className="block text-[11.5px] text-inkfaint">{event.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
