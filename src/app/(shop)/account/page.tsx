import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { formatDateTime } from '@/lib/utils';
import { currentUser, userOrders } from '@/services/account';
import { STATUS_LABELS } from '@/services/order-status';
import { IconArrow } from '@/components/ui/Icons';

export const dynamic = 'force-dynamic';

export default async function AccountOverviewPage() {
  const user = await currentUser();
  if (!user) redirect('/account/login');

  const [orders, favorites] = await Promise.all([
    userOrders(user.id, user.phone),
    prisma.favorite.count({ where: { userId: user.id } }),
  ]);

  const spent = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="eyebrow mb-1.5">Кабінет</p>
        <h1 className="display text-[clamp(24px,4vw,32px)]">Вітаємо, {user.firstName}!</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Замовлень', String(orders.length)],
          ['Сума покупок', formatMoney(spent)],
          ['Бонуси', `${user.bonusBalance} ₴`],
          ['В обраному', String(favorites)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl2 border border-line bg-paper p-4">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-inkfaint">{label}</span>
            <span className="display tabular mt-1 block text-[24px] leading-tight">{value}</span>
          </div>
        ))}
      </div>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold">Останні замовлення</h2>
          <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-bordeaux">
            Усі <IconArrow size={13} />
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-inkfaint">
            Замовлень ще немає. <Link href="/catalog" className="text-bordeaux underline">Перейти до каталогу</Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {orders.slice(0, 4).map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2.5 text-[13.5px] last:border-0">
                <Link href={`/order/${order.number}`} className="font-bold hover:text-bordeaux">{order.number}</Link>
                <span className="tabular text-inkfaint">{formatDateTime(order.createdAt)}</span>
                <span>{STATUS_LABELS[order.status]}</span>
                <b className="tabular">{formatMoney(order.total)}</b>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[13px] text-inkfaint">
        Замовлення, зроблені раніше без реєстрації, підтягуються сюди автоматично за номером телефону —
        вкажіть його у <Link href="/account/profile" className="text-bordeaux underline">профілі</Link>.
      </p>
    </div>
  );
}
