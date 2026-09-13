import type { PricingMode } from '@prisma/client';
import { formatGrams } from '@/lib/money';
import { isWeightBased } from '@/services/pricing';

export function StockLine({ stock, threshold, mode }: { stock: number; threshold: number; mode: PricingMode }) {
  const amount = isWeightBased(mode) ? formatGrams(stock) : `${stock} шт`;
  const [text, color] =
    stock <= 0
      ? ['Немає в наявності', 'text-inkfaint']
      : stock <= threshold
        ? [`Залишилось ${amount}`, 'text-warn']
        : ['В наявності', 'text-good'];
  return (
    <span className={`flex items-center gap-1.5 text-[11.5px] font-bold ${color}`}>
      <i className="h-1.5 w-1.5 rounded-full bg-current" />
      {text}
    </span>
  );
}
