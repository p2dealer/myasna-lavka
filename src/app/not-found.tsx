import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5 text-center">
      <span className="font-mono text-[13px] font-semibold text-ember">404</span>
      <h1 className="display text-[clamp(28px,5vw,44px)]">Такої сторінки немає</h1>
      <p className="max-w-[46ch] text-inksoft">
        Можливо, товар зняли з продажу або в адресі є помилка. Спробуйте знайти потрібне в каталозі.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href="/catalog" className="btn btn-primary">До каталогу</Link>
        <Link href="/" className="btn btn-ghost">На головну</Link>
      </div>
    </div>
  );
}
