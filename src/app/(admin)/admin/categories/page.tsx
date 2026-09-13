import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { CategoryForm } from '@/components/admin/Forms';
import { CategoryRowActions } from '@/components/admin/RowActions';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  await requireAdmin('categories');
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true, children: true } }, parent: { select: { name: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-[25px]">Категорії · {categories.length}</h1>

      <section className="min-w-0 rounded-xl2 border border-line bg-paper p-4">
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[720px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-inkfaint">
                {['Назва', 'Адреса', 'Батьківська', 'Підкатегорій', 'Товарів', 'Порядок', 'Стан', ''].map((h) => (
                  <th key={h} className="px-3 pb-2.5 text-left font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-paper2">
                  <td className="px-3 py-2.5 font-bold">{c.name}</td>
                  <td className="tabular px-3 py-2.5 text-inkfaint">/catalog/{c.slug}</td>
                  <td className="px-3 py-2.5">{c.parent?.name ?? '—'}</td>
                  <td className="tabular px-3 py-2.5">{c._count.children}</td>
                  <td className="tabular px-3 py-2.5">{c._count.products}</td>
                  <td className="tabular px-3 py-2.5">{c.sortOrder}</td>
                  <td className="px-3 py-2.5">
                    <span className={`pill ${c.isActive ? 'bg-good/15 text-good' : 'bg-paper2 text-inkfaint'}`}>
                      {c.isActive ? 'Активна' : 'Прихована'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right"><CategoryRowActions categoryId={c.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-1 text-[14.5px] font-extrabold">Нова категорія</h2>
        <p className="mb-4 text-[12.5px] text-inkfaint">
          Категорію можна зробити підкатегорією будь-якої існуючої — товари з підкатегорій показуються і в батьківській.
        </p>
        <CategoryForm parents={categories.map((c) => ({ id: c.id, name: c.name }))} />
      </section>
    </div>
  );
}
