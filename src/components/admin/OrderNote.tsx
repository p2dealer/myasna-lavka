'use client';

import { useState, useTransition } from 'react';
import { setOrderNoteAction } from '@/app/(admin)/admin/actions';

export function OrderNote({ orderId, note }: { orderId: string; note: string }) {
  const [value, setValue] = useState(note);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <textarea rows={3} value={value} onChange={(e) => { setValue(e.target.value); setSaved(false); }}
        placeholder="Наприклад: клієнт просить подзвонити після 18:00" aria-label="Коментар менеджера" />
      <div className="flex items-center gap-3">
        <button type="button" disabled={pending} className="btn btn-ghost btn-sm"
          onClick={() => startTransition(async () => { await setOrderNoteAction(orderId, value); setSaved(true); })}>
          {pending ? 'Зберігаємо…' : 'Зберегти'}
        </button>
        {saved && <span className="text-[12.5px] font-semibold text-good">Збережено</span>}
      </div>
    </div>
  );
}
