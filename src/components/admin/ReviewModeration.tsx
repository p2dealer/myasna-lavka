'use client';

import { useState, useTransition } from 'react';
import type { ReviewStatus } from '@prisma/client';
import { moderateReviewAction } from '@/app/(admin)/admin/actions';

export function ReviewModeration({ reviewId, status }: { reviewId: string; status: ReviewStatus }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState('');

  function set(next: ReviewStatus) {
    start(async () => {
      const result = await moderateReviewAction(reviewId, next);
      setMessage(result.message ?? '');
    });
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      {status !== 'APPROVED' && (
        <button type="button" disabled={pending} onClick={() => set('APPROVED')} className="btn btn-primary btn-sm">
          Опублікувати
        </button>
      )}
      {status !== 'REJECTED' && (
        <button type="button" disabled={pending} onClick={() => set('REJECTED')} className="btn btn-ghost btn-sm !text-ember">
          Відхилити
        </button>
      )}
      {status !== 'PENDING' && (
        <button type="button" disabled={pending} onClick={() => set('PENDING')} className="btn btn-ghost btn-sm">
          Повернути на модерацію
        </button>
      )}
      {message && <span className="text-[11.5px] text-good">{message}</span>}
    </span>
  );
}
