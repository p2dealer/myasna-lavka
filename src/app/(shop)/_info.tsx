import type { ReactNode } from 'react';
import Link from 'next/link';

export function InfoPage({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="wrap pb-16">
      <nav className="flex items-center gap-2 py-4 text-[12.5px] text-inkfaint">
        <Link href="/" className="hover:text-bordeaux">Головна</Link>
        <span className="text-line2">/</span><b className="text-ink">{title}</b>
      </nav>
      <h1 className="display mb-3 text-[clamp(28px,4.4vw,40px)] leading-tight">{title}</h1>
      {lead && <p className="mb-7 max-w-[62ch] text-[17px] text-inksoft">{lead}</p>}
      <div className="flex max-w-[68ch] flex-col gap-4 text-[15.5px] leading-relaxed text-inksoft [&_b]:text-ink [&_h2]:display [&_h2]:mt-4 [&_h2]:text-[22px] [&_h2]:text-ink [&_li]:relative [&_li]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        {children}
      </div>
    </div>
  );
}
