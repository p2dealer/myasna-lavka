'use client';

import { useTransition } from 'react';
import { clearCartAction } from '@/app/actions/cart';

export function ClearCartButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button type="button" disabled={pending} className="btn btn-ghost btn-sm"
      onClick={() => startTransition(() => { void clearCartAction(); })}>
      {pending ? 'Очищуємо…' : 'Очистити кошик'}
    </button>
  );
}
