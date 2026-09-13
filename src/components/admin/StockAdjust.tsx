'use client';

import { useState, useTransition } from 'react';
import { adjustStockAction } from '@/app/(admin)/admin/actions';

export function StockAdjust({ productId, weighted }: { productId: string; weighted: boolean }) {
  const [value, setValue] = useState('');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  function apply(sign: 1 | -1) {
    const amount = Math.abs(Number(value));
    if (!amount) { setMessage('Вкажіть кількість'); return; }
    setMessage('');
    startTransition(async () => {
      const result = await adjustStockAction(productId, sign * amount, sign > 0 ? 'Надходження' : 'Списання');
      setMessage(result.message ?? '');
      setValue('');
    });
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)}
        placeholder={weighted ? 'грамів' : 'штук'} aria-label="Кількість для коригування"
        className="!w-[96px] !py-1.5 text-[12.5px]" />
      <button type="button" disabled={pending} onClick={() => apply(1)} className="btn btn-ghost btn-sm">+</button>
      <button type="button" disabled={pending} onClick={() => apply(-1)} className="btn btn-ghost btn-sm">−</button>
      {message && <span className="text-[11.5px] text-good">{message}</span>}
    </span>
  );
}
