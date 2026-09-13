import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { adminPath, formatDateTime } from '@/lib/utils';
import { requireAdmin } from '@/lib/rbac';
import { Stars } from '@/components/ui/Icons';
import { ReviewModeration } from '@/components/admin/ReviewModeration';

export const dynamic = 'force-dynamic';

const STATUS = {
  PENDING: ['На модерації', 'bg-[#F6E9C8] text-[#7A5A10]'],
  APPROVED: ['Опубліковано', 'bg-good/15 text-good'],
  REJECTED: ['Відхилено', 'bg-[#F5DCDA] text-[#96322A]'],
} as const;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin('products');
  const sp = await searchParams;
  const status = sp.status === 'APPROVED' || sp.status === 'REJECTED' ? sp.status : 'PENDING';

  const [reviews, counts] = await Promise.all([
    prisma.review.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { product: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.review.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const countFor = (key: string) => counts.find((c) => c.status === key)?._count._all ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-[25px]">Відгуки</h1>
        <div className="inline-flex gap-0.5 rounded-full bg-paper2 p-0.5">
          {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((key) => (
            <Link key={key} href={`${adminPath('reviews')}?status=${key}`}
              className={`rounded-full px-3 py-1.5 text-[11.5px] font-bold ${
                status === key ? 'bg-paper text-ink shadow-soft' : 'text-inkfaint'
              }`}>
              {STATUS[key][0]} · {countFor(key)}
            </Link>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-xl2 border border-dashed border-line2 px-5 py-12 text-center text-inkfaint">
          Відгуків у цьому статусі немає
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl2 border border-line bg-paper p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars rating={review.rating} />
                  <b className="text-[14px]">{review.authorName}</b>
                  <Link href={`/product/${review.product.slug}`} target="_blank"
                    className="text-[13px] text-bordeaux hover:underline">
                    {review.product.name}
                  </Link>
                </div>
                <span className="tabular text-[12px] text-inkfaint">{formatDateTime(review.createdAt)}</span>
              </div>
              <p className="mb-3 max-w-[80ch] text-[14.5px] leading-relaxed text-inksoft">{review.text}</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={`pill ${STATUS[review.status][1]}`}>{STATUS[review.status][0]}</span>
                <ReviewModeration reviewId={review.id} status={review.status} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[12px] text-inkfaint">
        Схвалення відгуку перераховує рейтинг товару: середня оцінка та кількість беруться лише з опублікованих відгуків.
      </p>
    </div>
  );
}
