import type { Metadata } from 'next';
import { InfoPage } from '../_info';

export const metadata: Metadata = { title: 'Політика cookie' };

export default function CookiesPage() {
  return (
    <InfoPage title="Політика cookie" lead="Ми використовуємо мінімум cookie — тільки те, без чого магазин не працює.">
      <h2>Технічні cookie</h2>
      <ul>
        <li><b>ml_cart</b> — ідентифікатор вашого кошика. Без нього кошик очищався б після перезавантаження сторінки.</li>
        <li><b>ml_admin_session</b> — сесія адміністратора магазину. У звичайного відвідувача цей cookie не встановлюється.</li>
      </ul>
      <h2>Аналітика</h2>
      <p>Аналітичні скрипти не підключені. Якщо ви їх додасте, оновіть цей текст через адмін-панель.</p>
    </InfoPage>
  );
}
