import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatMoney, formatGrams } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';
import { getOrderByNumber, STATUS_LABELS } from '@/services/orders';
import { IconCheck } from '@/components/ui/Icons';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Замовлення', robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await getOrderByNumber(decodeURIComponent(number));
  if (!order) notFound();

  const address = order.deliveryMethodCode === 'np'
    ? [order.city, order.branch].filter(Boolean).join(', ')
    : [order.city, order.street, order.house, order.apartment && `кв. ${order.apartment}`].filter(Boolean).join(', ');

  return (
    <div className="wrap flex max-w-[620px] flex-col items-center gap-4 pb-16 pt-12 text-center">
      <span className="grid h-[70px] w-[70px] place-items-center rounded-full bg-good/10 text-good">
        <IconCheck size={30} />
      </span>
      <h1 className="display text-[clamp(27px,4.6vw,38px)] leading-tight">Дякуємо за замовлення!</h1>
      <p className="max-w-[46ch] text-inksoft">
        Ми надіслали підтвердження. Менеджер зателефонує протягом 15 хвилин, щоб узгодити час доставки.
      </p>
      <span className="rounded-lg border border-dashed border-line2 bg-paper px-4 py-2.5 font-mono text-[15px]">
        Замовлення № {order.number}
      </span>

      <div className="mt-2 flex w-full flex-col gap-2.5 rounded-xl2 border border-line bg-paper p-5 text-left">
        {[
          ['Статус', STATUS_LABELS[order.status]],
          ['Оформлено', formatDateTime(order.createdAt)],
          ['Отримувач', `${order.customerFirstName} ${order.customerLastName}`],
          ['Телефон', order.phone],
          ['Доставка', `${order.deliveryMethodName} · ${address}`],
          ['Оплата', order.paymentMethodName],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-sm text-inksoft">
            <span>{label}</span><b className="text-right text-ink">{value}</b>
          </div>
        ))}

        <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span className="text-inksoft">
                {item.nameSnapshot}
                <span className="text-inkfaint"> · {item.grams ? formatGrams(item.grams) : '1 шт'} × {item.quantity}</span>
              </span>
              <b className="tabular shrink-0">{formatMoney(item.lineTotal)}</b>
            </div>
          ))}
        </div>

        <div className="flex justify-between border-t border-line pt-3 text-sm text-inksoft">
          <span>Товари</span><b className="tabular">{formatMoney(order.subtotal)}</b>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-sm font-bold text-good">
            <span>Знижка</span><b className="tabular">−{formatMoney(order.discount)}</b>
          </div>
        )}
        <div className="flex justify-between text-sm text-inksoft">
          <span>Доставка</span>
          <b className="tabular">{order.deliveryFee ? formatMoney(order.deliveryFee) : 'Безкоштовно'}</b>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-[15px]">Сума</span>
          <b className="tabular text-[24px] font-extrabold">{formatMoney(order.total)}</b>
        </div>
      </div>

      {order.paymentStatus === 'PENDING' && order.paymentProvider && (
        <div className="w-full rounded-xl2 border border-line bg-paper px-5 py-4">
          <p className="mb-3 text-[14px] text-inksoft">
            Замовлення очікує онлайн-оплати. Ви можете оплатити зараз або пізніше — посилання залишиться дійсним.
          </p>
          <Link href={`/order/${order.number}/pay`} className="btn btn-primary w-full">
            Оплатити {formatMoney(order.total)}
          </Link>
        </div>
      )}
      {order.paymentStatus === 'PAID' && (
        <p className="w-full rounded-xl2 border border-good/40 bg-good/5 px-5 py-3 text-[14px] font-semibold text-good">
          Оплату отримано{order.paidAt ? ` · ${formatDateTime(order.paidAt)}` : ''}
        </p>
      )}

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href="/catalog" className="btn btn-primary">Продовжити покупки</Link>
        <Link href="/account/orders" className="btn btn-ghost">Мої замовлення</Link>
      </div>
    </div>
  );
}
