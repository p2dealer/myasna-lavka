import Image from 'next/image';
import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatMoney, formatGrams } from '@/lib/money';
import { adminPath } from '@/lib/utils';
import { requireAdmin } from '@/lib/rbac';
import { isWeightBased, priceUnitLabel } from '@/services/pricing';
import { ProductRowActions } from '@/components/admin/RowActions';
import { IconPlus } from '@/components/ui/Icons';

export const dynamic = 'force-dynamic';
const PER_PAGE = 30;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  await requireAdmin('products');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const q = sp.q?.trim();

  const where: Prisma.ProductWhereInput = {
    ...(sp.category ? { categoryId: sp.category } : {}),
    ...(q
      ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }] }
      : {}),
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where, orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      skip: (page - 1) * PER_PAGE, take: PER_PAGE,
      include: { category: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-[25px]">Товари · {total}</h1>
        <Link href={adminPath('products/new')} className="btn btn-primary btn-sm">
          <IconPlus size={16} /> Створити товар
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" action={adminPath('products')}>
        <input name="q" defaultValue={q} placeholder="Назва або артикул" aria-label="Пошук товарів"
          className="!w-auto min-w-[220px] !rounded-full !py-2 text-[13px]" />
        <select name="category" defaultValue={sp.category ?? ''} aria-label="Категорія"
          className="!w-auto !rounded-full !py-2 text-[13px]">
          <option value="">Усі категорії</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" className="btn btn-ghost btn-sm">Показати</button>
      </form>

      <section className="min-w-0 rounded-xl2 border border-line bg-paper p-4">
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[980px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-inkfaint">
                {['', 'Назва', 'Артикул', 'Категорія', 'Ціна', 'Спосіб продажу', 'Залишок', 'Позначки', ''].map((h) => (
                  <th key={h} className="px-3 pb-2.5 text-left font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const low = product.stock <= product.lowStockThreshold;
                return (
                  <tr key={product.id} className={`border-b border-line last:border-0 hover:bg-paper2 ${product.isActive ? '' : 'opacity-60'}`}>
                    <td className="px-3 py-2.5">
                      <span className="relative block h-8 w-10 overflow-hidden rounded-md">
                        {product.images[0] && (
                          <Image src={product.images[0].url} alt="" fill unoptimized sizes="40px" className="object-cover" />
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={adminPath(`products/${product.id}`)} className="font-bold hover:text-bordeaux">
                        {product.name}
                      </Link>
                      {!product.isActive && <span className="ml-2 pill bg-paper2 text-inkfaint">приховано</span>}
                    </td>
                    <td className="tabular px-3 py-2.5">{product.sku}</td>
                    <td className="px-3 py-2.5">{product.category.name}</td>
                    <td className="tabular whitespace-nowrap px-3 py-2.5">
                      <b>{formatMoney(product.price)}</b>
                      {product.oldPrice && (
                        <span className="block text-[11.5px] text-inkfaint line-through">{formatMoney(product.oldPrice)}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">{priceUnitLabel(product)}</td>
                    <td className={`tabular whitespace-nowrap px-3 py-2.5 font-bold ${low ? 'text-ember' : ''}`}>
                      {isWeightBased(product.pricingMode) ? formatGrams(product.stock) : `${product.stock} шт`}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {product.isHit && <span className="pill mr-1 bg-[#F6E9C8] text-[#7A5A10]">Хіт</span>}
                      {product.isNew && <span className="pill mr-1 bg-[#DCE7F3] text-[#245184]">Новинка</span>}
                      {product.oldPrice && <span className="pill bg-[#F5DCDA] text-[#96322A]">Акція</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="flex items-center justify-end gap-1.5">
                        <Link href={adminPath(`products/${product.id}`)} className="btn btn-ghost btn-sm">Редагувати</Link>
                        <ProductRowActions productId={product.id} isActive={product.isActive} />
                      </span>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-inkfaint">Товарів за цим фільтром немає</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex flex-wrap justify-center gap-1.5 pt-4">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
              const next = new URLSearchParams();
              if (q) next.set('q', q);
              if (sp.category) next.set('category', sp.category);
              if (p > 1) next.set('page', String(p));
              return (
                <Link key={p} href={`${adminPath('products')}${next.toString() ? `?${next}` : ''}`}
                  className={`grid h-9 min-w-9 place-items-center rounded-lg border border-line px-3 text-[13.5px] font-bold ${
                    p === page ? '!border-transparent bg-bordeaux text-paper' : 'bg-paper'
                  }`}>
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
