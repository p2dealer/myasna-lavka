import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatGrams } from '@/lib/money';
import { adminPath, formatDateTime } from '@/lib/utils';
import { requireAdmin } from '@/lib/rbac';
import { isWeightBased } from '@/services/pricing';
import { StockAdjust } from '@/components/admin/StockAdjust';

export const dynamic = 'force-dynamic';

const REASONS: Record<string, string> = {
  ORDER: 'Замовлення', MANUAL: 'Ручна правка', RESTOCK: 'Надходження',
  WRITE_OFF: 'Списання', CANCELLATION: 'Скасування',
};

export default async function AdminInventoryPage() {
  await requireAdmin('inventory');
  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ stock: 'asc' }],
      select: {
        id: true, name: true, sku: true, stock: true, lowStockThreshold: true, pricingMode: true,
      },
    }),
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: 'desc' }, take: 20,
      include: { product: { select: { name: true, pricingMode: true } } },
    }),
  ]);

  const critical = products.filter((p) => p.stock <= p.lowStockThreshold);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="display text-[25px]">Залишки</h1>
        <p className="text-[12.5px] text-inkfaint">
          Ваговий товар обліковується в грамах, штучний — у штуках. Кожна зміна пишеться в журнал рухів.
        </p>
      </div>

      {critical.length > 0 && (
        <p className="rounded-xl2 border border-ember bg-ember/5 px-4 py-3 text-[13.5px] font-semibold text-ember">
          Нижче порогу: {critical.length} {critical.length === 1 ? 'позиція' : 'позицій'} — {critical.slice(0, 3).map((p) => p.name).join(', ')}
          {critical.length > 3 ? ' та інші' : ''}
        </p>
      )}

      <section className="min-w-0 rounded-xl2 border border-line bg-paper p-4">
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[740px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.1em] text-inkfaint">
                {['Товар', 'Артикул', 'Залишок', 'Поріг', 'Стан', 'Коригування'].map((h) => (
                  <th key={h} className="px-3 pb-2.5 text-left font-extrabold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const weighted = isWeightBased(p.pricingMode);
                const state = p.stock <= 0 ? 'out' : p.stock <= p.lowStockThreshold ? 'low' : 'ok';
                return (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-paper2">
                    <td className="px-3 py-2.5">
                      <Link href={adminPath(`products/${p.id}`)} className="font-semibold hover:text-bordeaux">{p.name}</Link>
                    </td>
                    <td className="tabular px-3 py-2.5">{p.sku}</td>
                    <td className="tabular whitespace-nowrap px-3 py-2.5 font-bold">
                      {weighted ? formatGrams(p.stock) : `${p.stock} шт`}
                    </td>
                    <td className="tabular whitespace-nowrap px-3 py-2.5 text-inkfaint">
                      {weighted ? formatGrams(p.lowStockThreshold) : `${p.lowStockThreshold} шт`}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`pill ${
                        state === 'out' ? 'bg-[#F5DCDA] text-[#96322A]' : state === 'low' ? 'bg-[#F6E9C8] text-[#7A5A10]' : 'bg-good/15 text-good'
                      }`}>
                        {state === 'out' ? 'Немає' : state === 'low' ? 'Мало' : 'Достатньо'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5"><StockAdjust productId={p.id} weighted={weighted} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-3 text-[14.5px] font-extrabold">Журнал рухів</h2>
        <ul className="flex flex-col gap-2 text-[13px]">
          {movements.map((m) => (
            <li key={m.id} className="flex flex-wrap justify-between gap-3 border-b border-line pb-2 last:border-0">
              <span className="tabular text-inkfaint">{formatDateTime(m.createdAt)}</span>
              <span className="min-w-0 flex-1 truncate px-2">{m.product.name}</span>
              <span className="text-inkfaint">{REASONS[m.reason] ?? m.reason}</span>
              <b className={`tabular ${m.delta < 0 ? 'text-ember' : 'text-good'}`}>
                {m.delta > 0 ? '+' : '−'}
                {isWeightBased(m.product.pricingMode) ? formatGrams(Math.abs(m.delta)) : `${Math.abs(m.delta)} шт`}
              </b>
            </li>
          ))}
          {movements.length === 0 && <li className="text-inkfaint">Рухів ще не було</li>}
        </ul>
      </section>
    </div>
  );
}
