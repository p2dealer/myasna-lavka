import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || 'admin';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/cart', '/checkout', '/order/', '/account', '/api/', `/${adminPath}`],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
