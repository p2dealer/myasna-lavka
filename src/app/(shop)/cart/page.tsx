import type { Metadata } from 'next';
import Link from 'next/link';
import { formatMoney, plural } from '@/lib/money';
import { readCart, computeTotals } from '@/services/cart';
import { prisma } from '@/lib/prisma';
import { productCardSelect } from '@/services/catalog';
import { CartLines } from '@/components/shop/CartLines';
import { ClearCartButton } from '@/components/shop/ClearCartButton';
import { PromoForm } from '@/components/shop/PromoForm';
import { ProductGrid } from '@/components/shop/ProductCard';
import { IconArrow, IconCart } from '@/components/ui/Icons';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Кошик', robots: { index: false } };

export default async function CartPage() {
  const cart = await readCart();
  const totals = await computeTotals(cart, 0);

  if (!cart || cart.items.length === 0) {
    const suggestions = await prisma.product.findMany({
      where: { isActive: true, isHit: true }, select: productCardSelect, take: 4,
    });
    return (
      <div className="wrap pb-14">
        <nav className="flex items-center gap-2 py-4 text-[12.5px] text-inkfaint">
          <Link href="/" className="hover:text-bordeaux">Головна</Link><span className="text-line2">/</span><b className="text-ink">Кошик</b>
        </nav>
        <div className="my-8 flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-line2 px-5 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-paper2 text-inkfaint"><IconCart size={26} /></span>
          <h1 className="display text-[22px]">У кошику поки порожньо</h1>
          <p className="max-w-[44ch] text-[14.5px] text-inkfaint">Додайте щось із каталогу — хіти продажів зазвичай гарний початок.</p>
          <Link href="/catalog" className="btn btn-primary">Перейти до каталогу</Link>
        </div>
        <h2 className="display mb-5 text-[clamp(21px,3vw,28px)]">Рекомендуємо</h2>
        <ProductGrid products={suggestions} />
      </div>
    );
  }

  const suggestions = await prisma.product.findMany({
    where: { isActive: true, isHit: true, id: { notIn: cart.items.map((i) => i.productId) } },
    select: productCardSelect, take: 4,
  });

  const progress = Math.min(100, ((totals.subtotal - totals.discount) / totals.freeShippingFrom) * 100);

  return (
    <div className="wrap pb-14">
      <nav className="flex items-center gap-2 py-4 text-[12.5px] text-inkfaint">
        <Link href="/" className="hover:text-bordeaux">Головна</Link><span className="text-line2">/</span><b className="text-ink">Кошик</b>
      </nav>

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow mb-1.5">{totals.count} {plural(totals.count, 'позиція', 'позиції', 'позицій')}</p>
          <h1 className="display text-[clamp(26px,4vw,34px)]">Кошик</h1>
        </div>
        <Link href="/catalog" className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-bordeaux hover:gap-2.5">
          Продовжити покупки <IconArrow size={14} />
        </Link>
      </div>

      <div className="grid items-start gap-7 lg:grid-cols-[1fr_348px]">
        <div>
          <CartLines items={cart.items} />

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <ClearCartButton />
            <span className="text-[12.5px] text-inkfaint">
              Кошик збережений на сервері — після перезавантаження сторінки товари залишаться на місці.
            </span>
          </div>

          {suggestions.length > 0 && (
            <section className="pt-10">
              <h2 className="display mb-4 text-[22px]">Додати до замовлення</h2>
              <ProductGrid products={suggestions} />
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-3.5 rounded-xl2 border border-line bg-paper p-5 lg:sticky lg:top-[86px]">
          <h2 className="display text-[21px]">Разом</h2>
          <div className="flex justify-between text-sm text-inksoft">
            <span>Товари ({totals.count})</span><b className="tabular">{formatMoney(totals.subtotal)}</b>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm font-bold text-good">
              <span>Знижка{totals.discountLabel ? ` · ${totals.discountLabel}` : ''}</span>
              <b className="tabular">−{formatMoney(totals.discount)}</b>
            </div>
          )}
          <div className="flex justify-between text-sm text-inksoft">
            <span>Доставка</span>
            <b className="tabular">{totals.freeShippingLeft > 0 ? 'від 95 ₴' : 'Безкоштовно'}</b>
          </div>

          {totals.freeShippingLeft > 0 ? (
            <div>
              <div className="h-1.5 overflow-hidden rounded-full bg-paper2">
                <i className="block h-full rounded-full bg-good transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-[12.5px] text-inksoft">
                Ще <b className="text-good">{formatMoney(totals.freeShippingLeft)}</b> до безкоштовної доставки
              </p>
            </div>
          ) : (
            <p className="text-[12.5px] text-inksoft"><b className="text-good">Безкоштовна доставка</b> вже застосована</p>
          )}

          <PromoForm applied={cart.coupon?.code ?? null} label={totals.discountLabel} />

          <div className="mt-1 flex items-center justify-between border-t border-line pt-3.5">
            <span className="text-[15px]">До сплати</span>
            <b className="tabular text-[25px] font-extrabold tracking-tight">{formatMoney(totals.total)}</b>
          </div>

          {totals.belowMinimum ? (
            <p className="field-error">Мінімальна сума замовлення — {formatMoney(totals.minOrderTotal)}</p>
          ) : (
            <Link href="/checkout" className="btn btn-primary btn-lg w-full">
              Оформити замовлення <IconArrow size={14} />
            </Link>
          )}
          <p className="text-center text-[12.5px] text-inkfaint">
            Мінімальна сума замовлення — {formatMoney(totals.minOrderTotal)}
          </p>
        </aside>
      </div>
    </div>
  );
}
