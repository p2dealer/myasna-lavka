import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatMoney, formatGrams } from '@/lib/money';
import { readCart, computeTotals } from '@/services/cart';
import { isWeightBased, lineTotal } from '@/services/pricing';
import { CheckoutForm, SubmitButton } from '@/components/shop/CheckoutForm';
import { currentUser, listAddresses } from '@/services/account';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Оформлення замовлення', robots: { index: false } };

export default async function CheckoutPage() {
  const cart = await readCart();
  if (!cart || cart.items.length === 0) redirect('/cart');

  const [deliveryMethods, paymentMethods, user] = await Promise.all([
    prisma.deliveryMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.paymentMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    currentUser(),
  ]);
  const addresses = user ? await listAddresses(user.id) : [];
  const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
  const defaultDelivery = deliveryMethods[0]?.code ?? 'np';
  const totals = await computeTotals(cart, deliveryMethods.find((d) => d.code === defaultDelivery)?.price ?? 0);

  const summary = (
    <div className="flex flex-col gap-3.5 rounded-xl2 border border-line bg-paper p-5">
      <h2 className="display text-[21px]">Ваше замовлення</h2>
      <div className="flex max-h-[240px] flex-col gap-2.5 overflow-y-auto pr-1">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 text-[13px]">
            <span className="relative h-9 w-10 shrink-0 overflow-hidden rounded-md">
              {item.product.images[0] && (
                <Image src={item.product.images[0].url} alt="" fill unoptimized sizes="42px" className="object-cover" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold leading-tight">{item.product.name}</span>
              <span className="text-[11.5px] text-inkfaint">
                {isWeightBased(item.product.pricingMode)
                  ? formatGrams(item.grams)
                  : item.product.packWeightG ? formatGrams(item.product.packWeightG) : '1 шт'} × {item.quantity}
              </span>
            </span>
            <b className="tabular shrink-0">{formatMoney(lineTotal(item.product, item.grams, item.quantity))}</b>
          </div>
        ))}
      </div>

      <div className="flex justify-between border-t border-line pt-3 text-sm text-inksoft">
        <span>Товари</span><b className="tabular">{formatMoney(totals.subtotal)}</b>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-sm font-bold text-good">
          <span>Знижка</span><b className="tabular">−{formatMoney(totals.discount)}</b>
        </div>
      )}
      <div className="flex justify-between text-sm text-inksoft">
        <span>Доставка</span>
        <b className="tabular">{totals.deliveryFee ? formatMoney(totals.deliveryFee) : 'Безкоштовно'}</b>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-3.5">
        <span className="text-[15px]">До сплати</span>
        <b className="tabular text-[25px] font-extrabold tracking-tight">{formatMoney(totals.total)}</b>
      </div>
      <SubmitButton total={totals.total} />
      <p className="text-center text-[12.5px] text-inkfaint">
        Натискаючи кнопку, ви погоджуєтесь з <Link href="/terms" className="underline">умовами використання</Link> і{' '}
        <Link href="/privacy" className="underline">політикою конфіденційності</Link>
      </p>
    </div>
  );

  return (
    <div className="wrap pb-14">
      <nav className="flex items-center gap-2 py-4 text-[12.5px] text-inkfaint">
        <Link href="/" className="hover:text-bordeaux">Головна</Link><span className="text-line2">/</span>
        <Link href="/cart" className="hover:text-bordeaux">Кошик</Link><span className="text-line2">/</span>
        <b className="text-ink">Оформлення</b>
      </nav>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1.5">Крок 2 з 2</p>
          <h1 className="display text-[clamp(26px,4vw,34px)]">Оформлення замовлення</h1>
        </div>
        {!user && (
          <p className="text-[13px] text-inkfaint">
            Є акаунт? <Link href="/account/login?next=/checkout" className="text-bordeaux underline">Увійдіть</Link>,
            щоб дані підставились автоматично
          </p>
        )}
      </header>

      <CheckoutForm
        deliveryMethods={deliveryMethods.map((d) => ({ code: d.code, name: d.name, description: d.description, price: d.price }))}
        paymentMethods={paymentMethods.map((p) => ({ code: p.code, name: p.name, description: p.instructions }))}
        summary={summary}
        defaultDelivery={defaultDelivery}
        defaultPayment={paymentMethods[0]?.code ?? 'cod'}
        prefill={{
          firstName: user?.firstName ?? '',
          lastName: user?.lastName ?? '',
          email: user?.email ?? '',
          phone: user?.phone ?? '',
          city: preferred?.city ?? 'Київ',
          street: preferred?.street ?? '',
          house: preferred?.house ?? '',
          apartment: preferred?.apartment ?? '',
        }}
      />
    </div>
  );
}
