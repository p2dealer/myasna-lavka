import { formatMoney } from '@/lib/money';

/**
 * Графік продажів. Одна шкала розміщує і лінію, і підписи —
 * кожен підпис називає значення, якого графік реально досягає.
 */
export function SalesChart({ data }: { data: Array<{ date: string; total: number }> }) {
  if (data.length < 2) {
    return <p className="py-8 text-center text-[13px] text-inkfaint">Даних поки замало для графіка</p>;
  }

  const W = 720;
  const H = 220;
  const pad = { l: 52, r: 14, t: 16, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const peak = Math.max(...data.map((d) => d.total), 1);
  const step = Math.max(10000, Math.ceil(peak / 3 / 10000) * 10000);
  const max = Math.ceil(peak / step) * step;

  const x = (i: number) => pad.l + (iw * i) / (data.length - 1);
  const y = (v: number) => pad.t + ih - (ih * v) / max;

  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.total).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)} ${pad.t + ih} L${pad.l} ${pad.t + ih} Z`;
  const ticks = [0, max / 2, max];
  const last = data[data.length - 1];

  const fmtDay = (iso: string) =>
    new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit' }).format(new Date(iso));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Продажі за ${data.length} днів, максимум ${formatMoney(peak)} за день`}
        className="block h-auto w-full min-w-[520px]">
        <defs>
          <linearGradient id="salesFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--c-bordeaux))" stopOpacity="0.26" />
            <stop offset="1" stopColor="rgb(var(--c-bordeaux))" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgb(var(--c-line))" strokeWidth={1} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize={10} fill="rgb(var(--c-inkfaint))">
              {Math.round(t / 100000)}к
            </text>
          </g>
        ))}

        <path d={area} fill="url(#salesFade)" />
        <path d={line} fill="none" stroke="rgb(var(--c-bordeaux))" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(data.length - 1)} cy={y(last.total)} r={4.2} fill="rgb(var(--c-bordeaux))" />
        <text x={x(data.length - 1) - 6} y={y(last.total) - 12} textAnchor="end" fontSize={11} fontWeight={700} fill="rgb(var(--c-ink))">
          {formatMoney(last.total)}
        </text>

        <text x={pad.l} y={H - 8} fontSize={10} fill="rgb(var(--c-inkfaint))">{fmtDay(data[0].date)}</text>
        <text x={W - pad.r} y={H - 8} textAnchor="end" fontSize={10} fill="rgb(var(--c-inkfaint))">
          {fmtDay(last.date)}
        </text>
      </svg>
    </div>
  );
}

export function StatCard({
  label, value, delta, tone = 'up',
}: {
  label: string; value: string; delta?: string; tone?: 'up' | 'down' | 'flat';
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl2 border border-line bg-paper p-4">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-inkfaint">{label}</span>
      <span className="display tabular text-[26px] leading-tight">{value}</span>
      {delta && (
        <span className={`text-[11.5px] font-bold ${tone === 'down' ? 'text-ember' : tone === 'flat' ? 'text-inkfaint' : 'text-good'}`}>
          {delta}
        </span>
      )}
    </div>
  );
}
