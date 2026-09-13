import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { formatDateTime } from '@/lib/utils';
import { formatGrams } from '@/lib/money';
import { isWeightBased } from '@/services/pricing';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

const REASONS: Record<string, string> = {
  ORDER: 'Замовлення', MANUAL: 'Ручна правка', RESTOCK: 'Надходження',
  WRITE_OFF: 'Списання', CANCELLATION: 'Скасування замовлення',
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin('products');
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        movements: { orderBy: { createdAt: 'desc' }, take: 8 },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  const weighted = isWeightBased(product.pricingMode);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="display text-[25px]">{product.name}</h1>
        <p className="text-[12.5px] text-inkfaint">Артикул {product.sku} · оновлено {formatDateTime(product.updatedAt)}</p>
      </div>

      <ProductForm
        categories={categories}
        product={{
          id: product.id, name: product.name, slug: product.slug, sku: product.sku,
          categoryId: product.categoryId, meat: product.meat, type: product.type,
          pricingMode: product.pricingMode, price: product.price, oldPrice: product.oldPrice,
          costPrice: product.costPrice, packWeightG: product.packWeightG,
          stock: product.stock, lowStockThreshold: product.lowStockThreshold,
          shortDescription: product.shortDescription, description: product.description,
          composition: product.composition, origin: product.origin, producer: product.producer,
          storageConditions: product.storageConditions, shelfLifeDays: product.shelfLifeDays,
          kcal: product.kcal, protein: product.protein, fat: product.fat,
          imageUrl: product.images[0]?.url ?? null,
          seoTitle: product.seoTitle, seoDescription: product.seoDescription,
          isActive: product.isActive, isHit: product.isHit, isNew: product.isNew,
          isRecommended: product.isRecommended,
        }}
      />

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-3 text-[14.5px] font-extrabold">Останні рухи залишку</h2>
        {product.movements.length === 0 ? (
          <p className="text-[13px] text-inkfaint">Рухів ще не було</p>
        ) : (
          <ul className="flex flex-col gap-2 text-[13px]">
            {product.movements.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-3 border-b border-line pb-2 last:border-0">
                <span className="tabular text-inkfaint">{formatDateTime(m.createdAt)}</span>
                <span>{REASONS[m.reason] ?? m.reason}{m.note ? ` · ${m.note}` : ''}</span>
                <b className={`tabular ${m.delta < 0 ? 'text-ember' : 'text-good'}`}>
                  {m.delta > 0 ? '+' : ''}{weighted ? formatGrams(Math.abs(m.delta)) : `${Math.abs(m.delta)} шт`}
                </b>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
