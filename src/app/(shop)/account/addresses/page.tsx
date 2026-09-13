import { redirect } from 'next/navigation';
import { currentUser, listAddresses } from '@/services/account';
import { AddressForm, DeleteAddressButton } from '@/components/shop/AccountForms';

export const dynamic = 'force-dynamic';

export default async function AccountAddressesPage() {
  const user = await currentUser();
  if (!user) redirect('/account/login');
  const addresses = await listAddresses(user.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="display text-[clamp(24px,4vw,30px)]">Адреси доставки</h1>

      {addresses.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="flex flex-col gap-1.5 rounded-xl2 border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <b className="text-[14.5px]">{address.label || 'Без назви'}</b>
                {address.isDefault && <span className="pill bg-good/15 text-good">За замовчуванням</span>}
              </div>
              <span className="text-[13.5px] text-inksoft">
                {[address.city, address.street, address.house, address.apartment && `кв. ${address.apartment}`]
                  .filter(Boolean).join(', ')}
              </span>
              <div className="mt-1"><DeleteAddressButton id={address.id} /></div>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-3 text-[15px] font-extrabold">Додати адресу</h2>
        <AddressForm />
      </section>
    </div>
  );
}
