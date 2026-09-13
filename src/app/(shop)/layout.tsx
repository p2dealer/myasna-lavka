import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-bordeaux focus:px-4 focus:py-2 focus:text-paper">
        Перейти до вмісту
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
