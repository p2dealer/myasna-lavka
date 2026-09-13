'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitReviewAction, type AccountState } from '@/app/actions/account';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
      {pending ? 'Надсилаємо…' : 'Надіслати відгук'}
    </button>
  );
}

export function ReviewForm({ productId, authorName }: { productId: string; authorName?: string | null }) {
  const [state, action] = useActionState<AccountState, FormData>(submitReviewAction, {});
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);

  if (state.ok) {
    return (
      <p className="rounded-xl2 border border-good/40 bg-good/5 px-4 py-3 text-[13.5px] font-semibold text-good">
        {state.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost btn-sm">
        Залишити відгук
      </button>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-[520px] flex-col gap-3 rounded-xl2 border border-line bg-paper p-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex items-center gap-2">
        <span className="field-label">Оцінка</span>
        <span className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)}
              aria-label={`${star} з 5`} aria-pressed={rating === star}
              className={star <= rating ? 'text-[#D9A22B]' : 'text-line2'}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill={star <= rating ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth={1.5}>
                <path d="m12 3 2.7 5.5 6 .9-4.35 4.25 1.03 6L12 16.8 6.62 19.65l1.03-6L3.3 9.4l6-.9Z" />
              </svg>
            </button>
          ))}
        </span>
      </div>

      {!authorName && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="r-name" className="field-label">Як вас підписати</label>
          <input id="r-name" name="authorName" placeholder="Олександр К." maxLength={60} />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="r-text" className="field-label">Відгук</label>
        <textarea id="r-text" name="text" rows={4} required
          placeholder="Що сподобалось, як готували, чи збіглася вага" defaultValue={state.values?.text} />
        {state.errors?.text && <span className="field-error">{state.errors.text}</span>}
      </div>

      {state.errors?.form && <p className="field-error">{state.errors.form}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Submit />
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Скасувати</button>
        <span className="text-[11.5px] text-inkfaint">Відгук з’явиться після перевірки модератором</span>
      </div>
    </form>
  );
}
