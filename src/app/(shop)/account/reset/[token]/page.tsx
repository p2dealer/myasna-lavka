import { ResetPasswordForm } from '@/components/shop/AccountForms';

export const dynamic = 'force-dynamic';

export default async function ResetTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-5 text-center">
        <h1 className="display text-[28px]">Новий пароль</h1>
        <p className="mt-1 text-[13.5px] text-inkfaint">Придумайте пароль щонайменше з восьми символів.</p>
      </div>
      <div className="rounded-xl3 border border-line bg-paper p-6">
        <ResetPasswordForm token={decodeURIComponent(token)} />
      </div>
    </div>
  );
}
