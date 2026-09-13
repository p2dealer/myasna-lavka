import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/session';
import { getSettings } from '@/services/settings';
import { adminPath } from '@/lib/utils';
import { LoginForm } from '@/components/admin/Forms';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [session, settings, sp] = await Promise.all([getAdminSession(), getSettings(), searchParams]);
  if (session) redirect(adminPath());

  return <LoginForm next={sp.next ?? ''} shopName={settings.shopName} />;
}
