'use client';

import { useState, useTransition } from 'react';
import { addToCartAction } from '@/app/actions/cart';
import { IconCart, IconCheck, IconPlus } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

type Props = {
  productId: string;
  grams: number;
  quantity?: number;
  disabled?: boolean;
  variant?: 'icon' | 'full';
  label?: string;
  className?: string;
};

export function AddToCartButton({
  productId, grams, quantity = 1, disabled, variant = 'icon', label = 'Додати в кошик', className,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  function add() {
    startTransition(async () => {
      const result = await addToCartAction(productId, grams, quantity);
      setState(result.ok ? 'done' : 'error');
      setMessage(result.message ?? '');
      setTimeout(() => setState('idle'), 2200);
    });
  }

  if (variant === 'icon') {
    return (
      <button
        type="button" onClick={add} disabled={disabled || pending}
        aria-label={`Додати «${label}» у кошик`}
        className={cn(
          'grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl text-paper transition active:scale-90 disabled:opacity-40',
          state === 'done' ? 'bg-good' : 'bg-bordeaux hover:bg-ember',
          className,
        )}
      >
        {state === 'done' ? <IconCheck size={18} /> : <IconPlus size={18} />}
      </button>
    );
  }

  return (
    <span className="flex flex-1 flex-col gap-1">
      <button
        type="button" onClick={add} disabled={disabled || pending}
        className={cn('btn w-full', state === 'done' ? 'bg-good text-paper' : 'btn-primary', className)}
      >
        {state === 'done' ? <IconCheck size={18} /> : <IconCart size={18} />}
        {state === 'done' ? 'У кошику' : pending ? 'Додаємо…' : label}
      </button>
      {state === 'error' && message && <span className="field-error">{message}</span>}
    </span>
  );
}
