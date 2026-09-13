'use server';

import { prisma } from '@/lib/prisma';

export async function subscribeAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const contact = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(contact)) {
    return { ok: false, message: 'Перевірте адресу' };
  }
  await prisma.subscriber.upsert({
    where: { channel_contact: { channel: 'email', contact } },
    create: { channel: 'email', contact },
    update: { isActive: true },
  });
  return { ok: true, message: 'Готово — надішлемо добірку в п’ятницю' };
}
