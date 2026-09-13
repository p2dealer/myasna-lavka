import { NextResponse, type NextRequest } from 'next/server';
import { verifyAdminSession, ADMIN_COOKIE } from '@/lib/session-core';

/**
 * Адмінка живе за шляхом ADMIN_PATH. Якщо він відрізняється від "admin",
 * прямий доступ до /admin віддає 404 — сторонній відвідувач навіть не дізнається,
 * що адмінка існує. Але захищає не прихований URL, а перевірка сесії тут
 * і повторна перевірка ролі в кожній серверній дії.
 */
const ADMIN_PATH = (process.env.ADMIN_PATH || 'admin').replace(/^\/+|\/+$/g, '');

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Прямий /admin закритий, коли адмінка перенесена на інший шлях.
  if (ADMIN_PATH !== 'admin' && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return new NextResponse(null, { status: 404 });
  }

  const prefix = `/${ADMIN_PATH}`;
  const isAdminArea = pathname === prefix || pathname.startsWith(`${prefix}/`);
  if (!isAdminArea) return NextResponse.next();

  const rest = pathname.slice(prefix.length) || '';
  const internalPath = `/admin${rest}`;
  const isLogin = internalPath === '/admin/login';

  if (!isLogin) {
    const session = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE)?.value);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = `${prefix}/login`;
      url.search = pathname === prefix ? '' : `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = internalPath;
  const res = NextResponse.rewrite(url);
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|txt|xml)$).*)'],
};
