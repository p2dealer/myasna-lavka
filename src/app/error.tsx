'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5 text-center">
      <span className="font-mono text-[13px] font-semibold text-ember">500</span>
      <h1 className="display text-[clamp(28px,5vw,44px)]">Щось пішло не так</h1>
      <p className="max-w-[48ch] text-inksoft">
        Сталася помилка на нашому боці. Спробуйте оновити сторінку — якщо не допоможе, зателефонуйте, і ми оформимо
        замовлення вручну.
      </p>
      {error.digest && <code className="text-[12px] text-inkfaint">Код помилки: {error.digest}</code>}
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">Спробувати ще раз</button>
        <Link href="/" className="btn btn-ghost">На головну</Link>
      </div>
    </div>
  );
}
