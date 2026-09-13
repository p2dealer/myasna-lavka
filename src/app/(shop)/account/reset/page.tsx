import { ResetRequestForm } from '@/components/shop/AccountForms';

export const dynamic = 'force-dynamic';

export default function ResetRequestPage() {
  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-5 text-center">
        <h1 className="display text-[28px]">Відновлення пароля</h1>
        <p className="mt-1 text-[13.5px] text-inkfaint">
          Надішлемо посилання для зміни пароля. Воно дійсне одну годину й спрацює один раз.
        </p>
      </div>
      <div className="rounded-xl3 border border-line bg-paper p-6">
        <ResetRequestForm />
      </div>
    </div>
  );
}
