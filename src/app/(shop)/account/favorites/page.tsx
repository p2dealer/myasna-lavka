import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser, favoriteProducts } from '@/services/account';
import { ProductGrid } from '@/components/shop/ProductCard';

export const dynamic = 'force-dynamic';

export default async function AccountFavoritesPage() {
  const user = await currentUser();
  if (!user) redirect('/account/login');
  const products = await favoriteProducts(user.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-[clamp(24px,4vw,30px)]">Обране · {products.length}</h1>
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-line2 px-5 py-14 text-center">
          <p className="max-w-[42ch] text-[14.5px] text-inkfaint">
            Натисніть на серце в картці товару — і він з’явиться тут, на будь-якому вашому пристрої.
          </p>
          <Link href="/catalog" className="btn btn-primary">До каталогу</Link>
        </div>
      ) : (
        <ProductGrid products={products} favorites={new Set(products.map((p) => p.id))} />
      )}
    </div>
  );
}
