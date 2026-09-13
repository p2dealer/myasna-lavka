import type { OrderStatus } from '@prisma/client';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Нове',
  CONFIRMED: 'Підтверджено',
  PREPARING: 'Готується',
  PACKED: 'Упаковано',
  HANDED_TO_COURIER: 'Передано кур’єру',
  ON_THE_WAY: 'В дорозі',
  DELIVERED: 'Доставлено',
  CANCELLED: 'Скасовано',
};

/** Дозволені переходи. Статус не змінюється довільно. */
export const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['PACKED', 'CANCELLED'],
  PACKED: ['HANDED_TO_COURIER', 'CANCELLED'],
  HANDED_TO_COURIER: ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_FLOW[from].includes(to);
}
