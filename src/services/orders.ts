import 'server-only';
import type { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { lineTotal, stockDelta } from './pricing';
import { cartSubtotal, couponDiscount, readCart, type CartWithItems } from './cart';
import { getSettings } from './settings';
import { queueNewOrderNotifications, queueStatusNotification } from './notifications';
import { isOnlinePayment } from './payments';
import { STATUS_LABELS, canTransition } from './order-status';

export { STATUS_LABELS, STATUS_FLOW, canTransition } from './order-status';

async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.order.count({
    where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
  });
  return `ML-${year}-${String(count + 1).padStart(4, '0')}`;
}

export type PlaceOrderInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  deliveryCode: string;
  city: string;
  street?: string;
  house?: string;
  apartment?: string;
  branch?: string;
  paymentCode: string;
  comment?: string;
  userId?: string | null;
};

export type PlaceOrderResult =
  | { ok: true; number: string; online: boolean }
  | { ok: false; error: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const cart = await readCart();
  if (!cart || cart.items.length === 0) return { ok: false, error: 'Кошик порожній' };

  const settings = await getSettings();
  const [delivery, payment] = await Promise.all([
    prisma.deliveryMethod.findUnique({ where: { code: input.deliveryCode } }),
    prisma.paymentMethod.findUnique({ where: { code: input.paymentCode } }),
  ]);
  if (!delivery || !delivery.isActive) return { ok: false, error: 'Спосіб доставки недоступний' };
  if (!payment || !payment.isActive) return { ok: false, error: 'Спосіб оплати недоступний' };

  const subtotal = cartSubtotal(cart);
  if (subtotal < settings.minOrderTotal) {
    return { ok: false, error: `Мінімальна сума замовлення — ${Math.round(settings.minOrderTotal / 100)} ₴` };
  }

  const provider = await isOnlinePayment(payment.code);
  const discount = couponDiscount(cart, subtotal);
  const afterDiscount = Math.max(0, subtotal - discount);
  const freeShipping =
    cart.coupon?.type === 'FREE_SHIPPING' ||
    afterDiscount >= (delivery.freeFrom ?? settings.freeShippingFrom);
  const deliveryFee = freeShipping ? 0 : delivery.price;
  const total = afterDiscount + deliveryFee;

  // Перевірка залишків перед транзакцією — щоб дати зрозумілу помилку.
  for (const item of cart.items) {
    const needed = stockDelta(item.product, item.grams, item.quantity);
    if (!item.product.isActive) return { ok: false, error: `«${item.product.name}» більше не продається` };
    if (item.product.stock < needed) {
      return { ok: false, error: `«${item.product.name}» — недостатньо на складі` };
    }
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const number = await nextOrderNumber(tx);
      const created = await tx.order.create({
        data: {
          number,
          status: 'NEW',
          paymentStatus: 'PENDING',
          customerFirstName: input.firstName,
          customerLastName: input.lastName,
          phone: input.phone,
          email: input.email || null,
          deliveryMethodCode: delivery.code,
          deliveryMethodName: delivery.name,
          city: input.city,
          street: input.street || null,
          house: input.house || null,
          apartment: input.apartment || null,
          branch: input.branch || null,
          paymentMethodCode: payment.code,
          paymentMethodName: payment.name,
          paymentProvider: provider,
          userId: input.userId ?? null,
          subtotal,
          discount,
          deliveryFee,
          total,
          couponCode: cart.coupon?.code ?? null,
          comment: input.comment || null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              nameSnapshot: item.product.name,
              skuSnapshot: item.product.sku,
              imageSnapshot: item.product.images[0]?.url ?? null,
              pricingMode: item.product.pricingMode,
              unitPrice: item.product.price,
              grams: item.grams,
              quantity: item.quantity,
              lineTotal: lineTotal(item.product, item.grams, item.quantity),
            })),
          },
          events: { create: { to: 'NEW', note: 'Замовлення створено на сайті' } },
        },
      });

      // Списання залишків і журнал рухів — в одній транзакції зі створенням.
      for (const item of cart.items) {
        const delta = stockDelta(item.product, item.grams, item.quantity);
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: delta } },
          data: { stock: { decrement: delta } },
        });
        if (updated.count === 0) throw new Error(`STOCK:${item.product.name}`);
        await tx.inventoryMovement.create({
          data: { productId: item.productId, delta: -delta, reason: 'ORDER', orderId: created.id },
        });
      }

      if (cart.coupon && discount > 0) {
        await tx.coupon.update({
          where: { id: cart.coupon.id },
          data: { usedCount: { increment: 1 } },
        });
        await tx.couponRedemption.create({
          data: { couponId: cart.coupon.id, orderId: created.id, amount: discount },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });

      return created;
    });

    await queueNewOrderNotifications(order.id);
    return { ok: true, number: order.number, online: Boolean(provider) };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('STOCK:')) {
      return { ok: false, error: `«${message.slice(6)}» — залишку не вистачило, оновіть кошик` };
    }
    console.error('placeOrder failed', error);
    return { ok: false, error: 'Не вдалося створити замовлення. Спробуйте ще раз' };
  }
}

export async function changeOrderStatus(
  orderId: string,
  to: OrderStatus,
  actorId: string,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { pricingMode: true } } } } },
  });
  if (!order) return { ok: false, error: 'Замовлення не знайдено' };
  if (order.status === to) return { ok: true };
  if (!canTransition(order.status, to)) {
    return { ok: false, error: `Перехід «${STATUS_LABELS[order.status]}» → «${STATUS_LABELS[to]}» недопустимий` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: to } });
    await tx.orderStatusEvent.create({
      data: { orderId: order.id, from: order.status, to, actorId, note },
    });

    // Скасування повертає залишки на склад.
    if (to === 'CANCELLED') {
      for (const item of order.items) {
        if (!item.productId) continue;
        const delta = item.product
          ? stockDelta({ pricingMode: item.product.pricingMode, price: item.unitPrice }, item.grams, item.quantity)
          : item.quantity;
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: delta } } });
        await tx.inventoryMovement.create({
          data: { productId: item.productId, delta, reason: 'CANCELLATION', orderId: order.id },
        });
      }
      if (order.couponCode) {
        await tx.coupon.updateMany({
          where: { code: order.couponCode, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }
    }

    if (to === 'DELIVERED' && order.paymentStatus === 'PENDING') {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID', paidAt: new Date() },
      });
    }

    await tx.auditLog.create({
      data: { actorId, action: 'order.status', entity: 'Order', entityId: order.id, details: `${order.status} → ${to}` },
    });
  });

  await queueStatusNotification(order.id, to);
  return { ok: true };
}

export function getOrderByNumber(number: string) {
  return prisma.order.findUnique({
    where: { number },
    include: { items: true, events: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function dashboardStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfDay.getTime() - 864e5);
  const start30 = new Date(startOfDay.getTime() - 29 * 864e5);
  const paid: OrderStatus[] = ['CONFIRMED', 'PREPARING', 'PACKED', 'HANDED_TO_COURIER', 'ON_THE_WAY', 'DELIVERED'];

  const [today, yesterday, month, newOrders, customers, lowStock] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfDay }, status: { not: 'CANCELLED' } },
      _sum: { total: true }, _count: { _all: true }, _avg: { total: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfYesterday, lt: startOfDay }, status: { not: 'CANCELLED' } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: start30 }, status: { in: paid } },
      _sum: { total: true }, _count: { _all: true },
    }),
    prisma.order.count({ where: { status: 'NEW' } }),
    prisma.order.groupBy({ by: ['phone'], _count: { _all: true } }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: prisma.product.fields.lowStockThreshold } },
      select: { id: true, name: true, sku: true, stock: true, lowStockThreshold: true, pricingMode: true },
      orderBy: { stock: 'asc' },
      take: 6,
    }),
  ]);

  const todayTotal = today._sum.total ?? 0;
  const yesterdayTotal = yesterday._sum.total ?? 0;
  return {
    todayTotal,
    todayCount: today._count._all,
    todayAverage: Math.round(today._avg.total ?? 0),
    monthTotal: month._sum.total ?? 0,
    monthCount: month._count._all,
    newOrders,
    customers: customers.length,
    lowStock,
    dayOverDay: yesterdayTotal ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100) : null,
  };
}

export async function salesSeries(days: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start }, status: { not: 'CANCELLED' } },
    select: { createdAt: true, total: true },
  });
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 864e5);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + order.total);
  }
  return [...buckets.entries()].map(([date, total]) => ({ date, total }));
}

export async function topProducts(limit = 5) { try { const items = await prisma.orderItem.findMany({ select: { nameSnapshot: true, lineTotal: true, quantity: true, }, });
// Группируем и суммируем данные прямо в памяти
const map = new Map<string, { revenue: number; quantity: number }>();

for (const item of items) {
  const name = item.nameSnapshot || 'Товар';
  const current = map.get(name) || { revenue: 0, quantity: 0 };
  map.set(name, {
    revenue: current.revenue + (Number(item.lineTotal) || 0),
    quantity: current.quantity + (Number(item.quantity) || 0),
  });
}

// Сортируем по выручке и берем топ
return Array.from(map.entries())
  .map(([name, data]) => ({ name, ...data }))
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, limit);
} catch (error) { console.error('topProducts error:', error); return []; } }