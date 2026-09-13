import 'server-only';
import type { OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { formatMoney, formatGrams } from '@/lib/money';
import { STATUS_LABELS } from './order-status';
import { getSettings } from './settings';

/**
 * Сповіщення складаються в чергу (таблиця Notification) і відправляються окремо,
 * щоб падіння поштового сервісу чи Telegram не ламало оформлення замовлення.
 */

export async function queueNewOrderNotifications(orderId: string): Promise<void> {
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({ where: { id: orderId }, include: { items: true } }),
    getSettings(),
  ]);
  if (!order) return;

  const lines = order.items
    .map((i) => {
      const amount = i.grams ? formatGrams(i.grams) : `${i.quantity} шт`;
      return `• ${i.nameSnapshot} — ${amount}${i.quantity > 1 && i.grams ? ` × ${i.quantity}` : ''} — ${formatMoney(i.lineTotal)}`;
    })
    .join('\n');

  const address =
    order.deliveryMethodCode === 'np'
      ? `${order.city}, ${order.branch ?? ''}`
      : [order.city, order.street, order.house, order.apartment && `кв. ${order.apartment}`]
          .filter(Boolean)
          .join(', ');

  const adminBody = [
    `Нове замовлення ${order.number}`,
    '',
    `Клієнт: ${order.customerFirstName} ${order.customerLastName}`,
    `Телефон: ${order.phone}`,
    order.email ? `Email: ${order.email}` : null,
    '',
    lines,
    '',
    `Сума товарів: ${formatMoney(order.subtotal)}`,
    order.discount ? `Знижка: −${formatMoney(order.discount)}` : null,
    `Доставка: ${order.deliveryMethodName} — ${order.deliveryFee ? formatMoney(order.deliveryFee) : 'безкоштовно'}`,
    `Оплата: ${order.paymentMethodName}`,
    `Адреса: ${address}`,
    order.comment ? `Коментар: ${order.comment}` : null,
    '',
    `РАЗОМ: ${formatMoney(order.total)}`,
  ]
    .filter(Boolean)
    .join('\n');

  const jobs: Array<Promise<unknown>> = [
    prisma.notification.create({
      data: {
        channel: 'email',
        recipient: settings.email,
        subject: `Нове замовлення ${order.number}`,
        body: adminBody,
        orderId: order.id,
      },
    }),
  ];

  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    jobs.push(
      prisma.notification.create({
        data: {
          channel: 'telegram',
          recipient: process.env.TELEGRAM_CHAT_ID,
          body: adminBody,
          orderId: order.id,
        },
      }),
    );
  }

  if (order.email) {
    jobs.push(
      prisma.notification.create({
        data: {
          channel: 'email',
          recipient: order.email,
          subject: `${settings.shopName}: замовлення ${order.number} прийнято`,
          body: `Дякуємо за замовлення!\n\nНомер: ${order.number}\nСума: ${formatMoney(order.total)}\nДоставка: ${order.deliveryMethodName}\n\nМенеджер зателефонує найближчим часом, щоб узгодити час доставки.`,
          orderId: order.id,
        },
      }),
    );
  }

  await Promise.allSettled(jobs);
  void deliverPending();
}

export async function queueStatusNotification(orderId: string, status: OrderStatus): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.email) return;
  const settings = await getSettings();
  await prisma.notification.create({
    data: {
      channel: 'email',
      recipient: order.email,
      subject: `${settings.shopName}: замовлення ${order.number} — ${STATUS_LABELS[status]}`,
      body: `Статус вашого замовлення ${order.number} змінився на «${STATUS_LABELS[status]}».`,
      orderId: order.id,
    },
  });
  void deliverPending();
}

/**
 * Відправка з чергою й повторними спробами.
 * Telegram надсилається реально; email потребує підключення поштового провайдера —
 * місце підключення позначене нижче.
 */
export async function deliverPending(limit = 20): Promise<void> {
  const pending = await prisma.notification.findMany({
    where: { status: 'pending', attempts: { lt: 5 } },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  for (const item of pending) {
    try {
      if (item.channel === 'telegram') {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) throw new Error('TELEGRAM_BOT_TOKEN не заданий');
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: item.recipient, text: item.body }),
        });
        if (!res.ok) throw new Error(`Telegram ${res.status}`);
      } else {
        // Підключення поштового провайдера (Resend, Postmark, SMTP) — тут.
        // Поки провайдера немає, лист лишається в черзі зі статусом queued-no-provider.
        if (!process.env.EMAIL_PROVIDER_KEY) {
          await prisma.notification.update({
            where: { id: item.id },
            data: { attempts: { increment: 1 }, status: 'pending' },
          });
          continue;
        }
      }
      await prisma.notification.update({
        where: { id: item.id },
        data: { status: 'sent', sentAt: new Date(), attempts: { increment: 1 } },
      });
    } catch (error) {
      const attempts = item.attempts + 1;
      await prisma.notification.update({
        where: { id: item.id },
        data: { attempts, status: attempts >= 5 ? 'failed' : 'pending' },
      });
      console.error('notification failed', item.id, error);
    }
  }
}
