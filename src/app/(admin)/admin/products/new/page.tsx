import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requireAdmin('products');
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-[25px]">Новий товар</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
