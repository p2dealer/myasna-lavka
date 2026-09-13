'use client';

import { useState, useTransition } from 'react';
import type { OrderStatus } from '@prisma/client';
import { setOrderStatusAction } from '@/app/(admin)/admin/actions';

const LABELS: Record<OrderStatus, string> = {
  NEW: 'Нове', CONFIRMED: 'Підтверджено', PREPARING: 'Готується', PACKED: 'Упаковано',
  HANDED_TO_COURIER: 'Передано кур’єру', ON_THE_WAY: 'В дорозі', DELIVERED: 'Доставлено', CANCELLED: 'Скасовано',
};

const TONE: Record<OrderStatus, string> = {
  NEW: 'bg-[#F4E3D5] text-[#8A4A16]',
  CONFIRMED: 'bg-[#DCE7F3] text-[#245184]',
  PREPARING: 'bg-[#F6E9C8] text-[#7A5A10]',
  PACKED: 'bg-[#F6E9C8] text-[#7A5A10]',
  HANDED_TO_COURIER: 'bg-[#E2DBF2] text-[#4A3C82]',
  ON_THE_WAY: 'bg-[#E2DBF2] text-[#4A3C82]',
  DELIVERED: 'bg-good/15 text-good',
  CANCELLED: 'bg-[#F5DCDA] text-[#96322A]',
};

export { LABELS as STATUS_LABELS_CLIENT, TONE as STATUS_TONE };

export function StatusSelect({
  orderId, status, allowed,
}: {
  orderId: string; status: OrderStatus; allowed: OrderStatus[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  if (allowed.length === 0) {
    return <span className={`pill ${TONE[status]}`}>{LABELS[status]}</span>;
  }

  return (
    <span className="flex flex-col gap-1">
      <select
        aria-label="Статус замовлення" value={status} disabled={pending}
        onChange={(e) => {
          const next = e.target.value as OrderStatus;
          setError('');
          startTransition(async () => {
            const result = await setOrderStatusAction(orderId, next);
            if (!result.ok) setError(result.message ?? 'Не вдалося змінити статус');
          });
        }}
        className={`pill !w-auto !border-0 !px-2.5 !py-1 !text-[11px] ${TONE[status]}`}
      >
        <option value={status}>{LABELS[status]}</option>
        {allowed.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
      </select>
      {error && <span className="field-error max-w-[180px]">{error}</span>}
    </span>
  );
}
