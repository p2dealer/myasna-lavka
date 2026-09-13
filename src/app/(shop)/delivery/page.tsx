import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { getSettings } from '@/services/settings';
import { InfoPage } from '../_info';

export const metadata: Metadata = { title: 'Доставка та оплата', description: 'Способи доставки й оплати, терміни та вартість.' };
export const revalidate = 300;

export default async function DeliveryPage() {
  const [s, delivery, payments] = await Promise.all([
    getSettings(),
    prisma.deliveryMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }).catch(() => []),
    prisma.paymentMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }).catch(() => []),
  ]);

  return (
    <InfoPage title="Доставка та оплата" lead={`Від ${formatMoney(s.freeShippingFrom)} доставка безкоштовна незалежно від способу.`}>
      <h2>Способи доставки</h2>
      <ul>
        {delivery.map((d) => (
          <li key={d.code}>
            <b>{d.name}</b> — {d.price ? formatMoney(d.price) : 'безкоштовно'}. {d.description}
          </li>
        ))}
      </ul>
      <h2>Способи оплати</h2>
      <ul>
        {payments.map((p) => (<li key={p.code}><b>{p.name}</b> — {p.instructions}</li>))}
      </ul>
      <h2>Як рахується вага</h2>
      <p>Ви замовляєте орієнтовну вагу, пакувальник зважує реальний відруб. Якщо фактична вага відрізняється, сума перераховується й ви бачите оновлений рахунок до оплати. Відхилення понад 10 % узгоджуємо телефоном.</p>
      <h2>Мінімальне замовлення</h2>
      <p>{formatMoney(s.minOrderTotal)}. Замовлення, оформлені до 15:00, виїжджають по Києву того ж дня.</p>
    </InfoPage>
  );
}
