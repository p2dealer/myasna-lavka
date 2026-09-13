import { redirect } from 'next/navigation';
import { currentUser } from '@/services/account';
import { formatDate } from '@/lib/utils';
import { PasswordForm, ProfileForm } from '@/components/shop/AccountForms';

export const dynamic = 'force-dynamic';

export default async function AccountProfilePage() {
  const user = await currentUser();
  if (!user) redirect('/account/login');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="display text-[clamp(24px,4vw,30px)]">Профіль і пароль</h1>
        <p className="text-[12.5px] text-inkfaint">Ви з нами з {formatDate(user.createdAt)}</p>
      </div>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-3 text-[15px] font-extrabold">Особисті дані</h2>
        <ProfileForm user={user} />
      </section>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-3 text-[15px] font-extrabold">Зміна пароля</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
