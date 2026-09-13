import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatMoney, formatGrams } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';
import { currentUser, userOrders } from '@/services/account';
import { STATUS_LABELS } from '@/services/order-status';
import { RepeatOrderButton } from '@/components/shop/AccountForms';

export const dynamic = 'force-dynamic';

export default async function AccountOrdersPage() {
  const user = await currentUser();
  if (!user) redirect('/account/login');
  const orders = await userOrders(user.id, user.phone);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-line2 px-5 py-14 text-center">
        <h1 className="display text-[22px]">Замовлень ще немає</h1>
        <p className="max-w-[42ch] text-[14.5px] text-inkfaint">
          Щойно ви оформите перше замовлення, воно з’явиться тут разом із кнопкою «повторити».
        </p>
        <Link href="/catalog" className="btn btn-primary">До каталогу</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-[clamp(24px,4vw,30px)]">Мої замовлення</h1>

      {orders.map((order) => (
        <article key={order.id} className="rounded-xl2 border border-line bg-paper p-5">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div>
              <Link href={`/order/${order.number}`} className="text-[16px] font-extrabold hover:text-bordeaux">
                {order.number}
              </Link>
              <span className="ml-3 text-[12.5px] text-inkfaint">{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="pill bg-paper2 text-inksoft">{STATUS_LABELS[order.status]}</span>
              {order.paymentStatus === 'PENDING' && order.paymentProvider && (
                <Link href={`/order/${order.number}/pay`} className="btn btn-primary btn-sm">Оплатити</Link>
              )}
              <b className="tabular text-[17px]">{formatMoney(order.total)}</b>
            </div>
          </header>

          <ul className="flex flex-col gap-1.5 text-[13.5px]">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span className="text-inksoft">
                  {item.nameSnapshot}
                  <span className="text-inkfaint"> · {item.grams ? formatGrams(item.grams) : '1 шт'} × {item.quantity}</span>
                </span>
                <b className="tabular shrink-0">{formatMoney(item.lineTotal)}</b>
              </li>
            ))}
          </ul>

          <footer className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <span className="text-[12.5px] text-inkfaint">
              {order.deliveryMethodName} · {order.paymentMethodName}
              {order.paymentStatus === 'PAID' ? ' · оплачено' : ''}
            </span>
            <RepeatOrderButton orderId={order.id} />
          </footer>
        </article>
      ))}
    </div>
  );
}
