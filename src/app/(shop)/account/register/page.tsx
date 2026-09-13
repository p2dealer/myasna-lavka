import { redirect } from 'next/navigation';
import { currentUser } from '@/services/account';
import { RegisterForm } from '@/components/shop/AccountForms';

export const dynamic = 'force-dynamic';

export default async function AccountRegisterPage() {
  const user = await currentUser();
  if (user) redirect('/account');

  return (
    <div className="w-full max-w-[560px]">
      <div className="mb-5">
        <p className="eyebrow mb-1.5">Особистий кабінет</p>
        <h1 className="display text-[28px]">Реєстрація</h1>
        <p className="mt-1 max-w-[52ch] text-[13.5px] text-inkfaint">
          Акаунт зберігає історію замовлень, адреси й обране. Оформити замовлення можна і без нього —
          достатньо телефону.
        </p>
      </div>
      <div className="rounded-xl3 border border-line bg-paper p-6">
        <RegisterForm />
      </div>
    </div>
  );
}
