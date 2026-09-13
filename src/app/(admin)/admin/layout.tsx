import type { Metadata } from 'next';
import { getAdminSession } from '@/lib/session';
import { PERMISSIONS } from '@/lib/rbac';
import { getSettings } from '@/services/settings';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Адмін-панель',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([getAdminSession(), getSettings()]);

  // Сторінка входу рендериться без оболонки. До решти маршрутів
  // неавторизований відвідувач не доходить — його розвертає middleware.
  if (!session) {
    return <div className="grid min-h-screen place-items-center bg-ivory p-5">{children}</div>;
  }

  return (
    <AdminShell
      shopName={settings.shopName}
      user={{ name: session.name, role: session.role }}
      permissions={PERMISSIONS[session.role]}
    >
      {children}
    </AdminShell>
  );
}
