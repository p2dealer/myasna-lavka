import type { Metadata } from 'next';
import { getSettings } from '@/services/settings';
import { InfoPage } from '../_info';

export const metadata: Metadata = { title: 'Контакти' };

export default async function ContactsPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Контакти" lead="Телефонуйте, пишіть у месенджери або заходьте в лавку.">
      <ul>
        <li><b>Телефон:</b> <a href={`tel:${s.phone.replace(/\D/g, '')}`} className="underline">{s.phone}</a></li>
        <li><b>Email:</b> <a href={`mailto:${s.email}`} className="underline">{s.email}</a></li>
        <li><b>Адреса:</b> {s.address}</li>
        <li><b>Графік роботи:</b> {s.workingHours}</li>
        {s.telegram && <li><b>Telegram:</b> <a href={s.telegram} className="underline">{s.telegram}</a></li>}
        {s.instagram && <li><b>Instagram:</b> <a href={s.instagram} className="underline">{s.instagram}</a></li>}
      </ul>
      <p>Питання щодо конкретного замовлення швидше вирішуються телефоном: назвіть номер замовлення — і менеджер одразу побачить його склад і статус.</p>
    </InfoPage>
  );
}
