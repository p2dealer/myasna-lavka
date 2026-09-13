import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/services/account';
import { UserLoginForm } from '@/components/shop/AccountForms';

export const dynamic = 'force-dynamic';

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [user, sp] = await Promise.all([currentUser(), searchParams]);
  if (user) redirect('/account');

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-5 text-center">
        <p className="eyebrow mb-1.5">Особистий кабінет</p>
        <h1 className="display text-[28px]">Вхід</h1>
        <p className="mt-1 text-[13.5px] text-inkfaint">
          Замовити можна й без акаунта — він потрібен для історії, обраного та швидкого повтору покупок.
        </p>
      </div>
      <div className="rounded-xl3 border border-line bg-paper p-6">
        <UserLoginForm next={sp.next} />
      </div>
      <p className="mt-4 text-center text-[13px] text-inkfaint">
        <Link href="/catalog" className="hover:text-bordeaux">Продовжити покупки без входу</Link>
      </p>
    </div>
  );
}
