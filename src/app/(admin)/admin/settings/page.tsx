import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { requireAdmin } from '@/lib/rbac';
import { getSettings } from '@/services/settings';
import { SettingsForm } from '@/components/admin/Forms';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await requireAdmin('settings');
  const [settings, delivery, payments] = await Promise.all([
    getSettings(),
    prisma.deliveryMethod.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="display text-[25px]">Налаштування</h1>
        <p className="text-[12.5px] text-inkfaint">
          Усе на цій сторінці зберігається в базі даних. Щоб змінити назву магазину, телефон, поріг безкоштовної
          доставки чи тексти головної, розробник не потрібен.
        </p>
      </div>

      <SettingsForm settings={settings} />

      <div className="grid gap-3.5 xl:grid-cols-2">
        <section className="min-w-0 rounded-xl2 border border-line bg-paper p-5">
          <h2 className="mb-3 text-[14.5px] font-extrabold">Способи доставки</h2>
          <table className="w-full border-collapse text-[13.5px]">
            <tbody>
              {delivery.map((d) => (
                <tr key={d.id} className="border-b border-line last:border-0">
                  <td className="py-2.5 pr-3">
                    <b>{d.name}</b>
                    <span className="block text-[12px] text-inkfaint">{d.description}</span>
                  </td>
                  <td className="tabular whitespace-nowrap py-2.5 pr-3">{d.price ? formatMoney(d.price) : '—'}</td>
                  <td className="py-2.5 text-right">
                    <span className={`pill ${d.isActive ? 'bg-good/15 text-good' : 'bg-paper2 text-inkfaint'}`}>
                      {d.isActive ? 'Активний' : 'Вимкнений'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="min-w-0 rounded-xl2 border border-line bg-paper p-5">
          <h2 className="mb-3 text-[14.5px] font-extrabold">Способи оплати</h2>
          <table className="w-full border-collapse text-[13.5px]">
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="py-2.5 pr-3">
                    <b>{p.name}</b>
                    <span className="block text-[12px] text-inkfaint">{p.instructions}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-inkfaint">{p.provider ?? '—'}</td>
                  <td className="py-2.5 text-right">
                    <span className={`pill ${p.isActive ? 'bg-good/15 text-good' : 'bg-paper2 text-inkfaint'}`}>
                      {p.isActive ? 'Активний' : 'Вимкнений'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <p className="text-[12px] text-inkfaint">
        Адмін-панель доступна за прихованим шляхом із змінної <b className="font-mono">ADMIN_PATH</b>. Змініть її у
        файлі <b className="font-mono">.env</b> — і стара адреса перестане існувати. Захищає не сам шлях, а сесія й
        перевірка ролі на сервері при кожному запиті.
      </p>
    </div>
  );
}
