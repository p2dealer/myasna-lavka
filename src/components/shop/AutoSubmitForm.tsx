'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Форма переходу до платіжного провайдера. Відправляється автоматично,
 * але кнопка залишається — якщо автоперехід заблокований, користувач
 * натисне сам.
 */
export function AutoSubmitForm({
  endpoint, fields, delayMs = 900,
}: {
  endpoint: string; fields: Record<string, string>; delayMs?: number;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSent(true);
      form.current?.submit();
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return (
    <form ref={form} action={endpoint} method="POST" acceptCharset="utf-8" className="w-full">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className="btn btn-primary btn-lg w-full">
        {sent ? 'Переходимо до оплати…' : 'Перейти до оплати'}
      </button>
    </form>
  );
}
