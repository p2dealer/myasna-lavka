import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { buildPaymentForm } from '@/services/payments';
import { AutoSubmitForm } from '@/components/shop/AutoSubmitForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Оплата замовлення', robots: { index: false } };

export default async function PayPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const orderNumber = decodeURIComponent(number);
  const order = await prisma.order.findUnique({ where: { number: orderNumber } });
  if (!order) notFound();

  const result = await buildPaymentForm(orderNumber);

  return (
    <div className="wrap flex max-w-[560px] flex-col items-center gap-4 pb-16 pt-14 text-center">
      <p className="eyebrow">Замовлення {order.number}</p>
      <h1 className="display text-[clamp(26px,4.4vw,36px)] leading-tight">Оплата</h1>

      {result.ok ? (
        <>
          <p className="text-inksoft">
            До сплати <b className="tabular text-ink">{formatMoney(order.total)}</b>. Зараз ви перейдете на
            захищену сторінку {result.form.provider === 'liqpay' ? 'LiqPay' : 'провайдера'} — дані картки
            вводяться там, наш сайт їх не бачить і не зберігає.
          </p>
          <AutoSubmitForm endpoint={result.form.endpoint} fields={result.form.fields} />
        </>
      ) : (
        <>
          <p className="rounded-xl2 border border-line bg-paper px-5 py-4 text-[14.5px] text-inksoft">
            {result.error}
          </p>
          <p className="text-[13.5px] text-inkfaint">
            Замовлення прийняте — його номер {order.number}. Менеджер зателефонує й узгодить зручний спосіб оплати.
          </p>
        </>
      )}

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href={`/order/${order.number}`} className="btn btn-ghost">До замовлення</Link>
        <Link href="/catalog" className="btn btn-ghost">Продовжити покупки</Link>
      </div>
    </div>
  );
}
