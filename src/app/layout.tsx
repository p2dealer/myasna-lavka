import type { Metadata, Viewport } from 'next';
import { getSettings } from '@/services/settings';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    metadataBase: new URL(base),
    title: { default: s.seoTitle, template: `%s — ${s.shopName}` },
    description: s.seoDescription,
    applicationName: s.shopName,
    openGraph: {
      type: 'website', locale: 'uk_UA', siteName: s.shopName,
      title: s.seoTitle, description: s.seoDescription, url: base,
    },
    twitter: { card: 'summary_large_image', title: s.seoTitle, description: s.seoDescription },
    alternates: { canonical: '/' },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F1E9' },
    { media: '(prefers-color-scheme: dark)', color: '#141110' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Prata&family=Manrope:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
