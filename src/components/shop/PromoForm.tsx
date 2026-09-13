'use client';

import { useState, useTransition } from 'react';
import { applyCouponAction, removeCouponAction } from '@/app/actions/cart';

export function PromoForm({ applied, label }: { applied: string | null; label: string | null }) {
  const [code, setCode] = useState(applied ?? '');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Промокод"
          aria-label="Промокод" className="!py-2.5 text-[13.5px]" />
        <button type="button" disabled={pending}
          onClick={() => startTransition(async () => {
            const result = await applyCouponAction(code);
            setMessage({ ok: result.ok, text: result.message ?? '' });
          })}
          className="btn btn-ghost btn-sm shrink-0">
          {pending ? '…' : 'Застосувати'}
        </button>
      </div>

      {applied ? (
        <p className="text-[12.5px] text-good">
          Промокод {applied} застосовано{label ? ` · ${label}` : ''} ·{' '}
          <button type="button" className="underline"
            onClick={() => startTransition(async () => { await removeCouponAction(); setMessage(null); setCode(''); })}>
            скасувати
          </button>
        </p>
      ) : (
        <p className="text-[12.5px] text-inkfaint">Спробуйте <b className="font-mono">BBQ10</b> — знижка 10 %</p>
      )}

      {message && !message.ok && <p className="field-error">{message.text}</p>}
    </div>
  );
}
