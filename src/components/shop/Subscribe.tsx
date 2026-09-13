'use client';

import { useState, useTransition } from 'react';
import { subscribeAction } from '@/app/actions/misc';

export function Subscribe() {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap gap-2"
      action={(formData) => startTransition(async () => setMessage((await subscribeAction(formData)) as never))}
    >
      <input type="email" name="email" required placeholder="ваш@email.com" aria-label="Email"
        className="!w-auto min-w-[200px] flex-1 !rounded-full" />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? 'Надсилаємо…' : 'Підписатись'}
      </button>
      {message && (
        <p className={`w-full text-[12.5px] ${message.ok ? 'text-good' : 'text-ember'}`}>{message.text}</p>
      )}
    </form>
  );
}
