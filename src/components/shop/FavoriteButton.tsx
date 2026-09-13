'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toggleFavoriteAction } from '@/app/actions/account';
import { IconHeart } from '@/components/ui/Icons';

export function FavoriteButton({
  productId, active, size = 'sm', label,
}: {
  productId: string; active: boolean; size?: 'sm' | 'lg'; label?: string;
}) {
  const [on, setOn] = useState(active);
  const [hint, setHint] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();

  const box = size === 'lg'
    ? 'h-12 w-12 border border-line2'
    : 'h-8 w-8 bg-paper/90 backdrop-blur';

  return (
    <span className="relative">
      <button
        type="button" disabled={pending} aria-pressed={on}
        aria-label={on ? 'Прибрати з обраного' : `Додати ${label ?? 'товар'} в обране`}
        onClick={() => start(async () => {
          const result = await toggleFavoriteAction(productId);
          if (!result.ok) {
            setHint(result.error ?? 'Не вдалося');
            setTimeout(() => setHint(''), 2600);
            return;
          }
          setOn(result.active);
          router.refresh();
        })}
        className={`grid place-items-center rounded-full transition ${box} ${
          on ? 'text-ember' : 'text-inksoft hover:text-bordeaux'
        } ${pending ? 'opacity-60' : 'hover:scale-105'}`}
      >
        <IconHeart size={size === 'lg' ? 20 : 16} filled={on} />
      </button>
      {hint && (
        <span className="absolute right-0 top-full z-20 mt-1.5 w-max max-w-[200px] rounded-lg bg-ink px-2.5 py-1.5 text-[11.5px] font-semibold text-ivory">
          {hint}
        </span>
      )}
    </span>
  );
}
