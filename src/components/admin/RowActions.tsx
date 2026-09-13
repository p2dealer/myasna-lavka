'use client';

import { useState, useTransition } from 'react';
import {
  deleteCategoryAction, deleteProductAction, duplicateProductAction, toggleCouponAction, toggleProductAction,
} from '@/app/(admin)/admin/actions';

function useAction() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok?: boolean; message?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (result.message) setMessage({ ok: result.ok !== false, text: result.message });
    });
  return { pending, message, run };
}

export function ProductRowActions({ productId, isActive }: { productId: string; isActive: boolean }) {
  const { pending, message, run } = useAction();
  const [confirming, setConfirming] = useState(false);

  return (
    <span className="flex flex-wrap items-center justify-end gap-1.5">
      <button type="button" disabled={pending} className="btn btn-ghost btn-sm"
        onClick={() => run(() => toggleProductAction(productId, !isActive))}>
        {isActive ? 'Приховати' : 'Опублікувати'}
      </button>
      <button type="button" disabled={pending} className="btn btn-ghost btn-sm"
        onClick={() => run(() => duplicateProductAction(productId))}>
        Дублювати
      </button>
      {confirming ? (
        <>
          <button type="button" disabled={pending} className="btn btn-sm bg-ember text-white"
            onClick={() => { setConfirming(false); run(() => deleteProductAction(productId)); }}>
            Точно видалити
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>Ні</button>
        </>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm !text-ember" onClick={() => setConfirming(true)}>
          Видалити
        </button>
      )}
      {message && <span className={`text-[11.5px] ${message.ok ? 'text-good' : 'text-ember'}`}>{message.text}</span>}
    </span>
  );
}

export function CategoryRowActions({ categoryId }: { categoryId: string }) {
  const { pending, message, run } = useAction();
  const [confirming, setConfirming] = useState(false);
  return (
    <span className="flex items-center justify-end gap-1.5">
      {confirming ? (
        <>
          <button type="button" disabled={pending} className="btn btn-sm bg-ember text-white"
            onClick={() => { setConfirming(false); run(() => deleteCategoryAction(categoryId)); }}>
            Точно видалити
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>Ні</button>
        </>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm !text-ember" onClick={() => setConfirming(true)}>
          Видалити
        </button>
      )}
      {message && <span className={`text-[11.5px] ${message.ok ? 'text-good' : 'text-ember'}`}>{message.text}</span>}
    </span>
  );
}

export function CouponToggle({ couponId, isActive }: { couponId: string; isActive: boolean }) {
  const { pending, run } = useAction();
  return (
    <button type="button" disabled={pending} className="btn btn-ghost btn-sm"
      onClick={() => run(() => toggleCouponAction(couponId, !isActive))}>
      {isActive ? 'Вимкнути' : 'Увімкнути'}
    </button>
  );
}
