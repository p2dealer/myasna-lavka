'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { formatMoney } from '@/lib/money';
import { formatPhone } from '@/lib/utils';
import { placeOrderAction, emptyCheckoutState } from '@/app/actions/checkout';

type Method = { code: string; name: string; description: string | null; price?: number };

function Field({
  name, label, required, error, defaultValue, type = 'text', placeholder, full, readOnly, onChange, value,
}: {
  name: string; label: string; required?: boolean; error?: string; defaultValue?: string;
  type?: string; placeholder?: string; full?: boolean; readOnly?: boolean;
  onChange?: (v: string) => void; value?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <label htmlFor={`f-${name}`} className="field-label">
        {label} {required && <span className="text-ember">*</span>}
      </label>
      <input
        id={`f-${name}`} name={name} type={type} placeholder={placeholder} readOnly={readOnly}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `e-${name}` : undefined}
      />
      {error && <span id={`e-${name}`} className="field-error">{error}</span>}
    </div>
  );
}

function SubmitButton({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary btn-lg w-full">
      {pending ? 'Оформлюємо…' : `Підтвердити замовлення · ${formatMoney(total)}`}
    </button>
  );
}

export type Prefill = {
  firstName: string; lastName: string; email: string; phone: string;
  city: string; street: string; house: string; apartment: string;
};

export function CheckoutForm({
  deliveryMethods, paymentMethods, summary, defaultDelivery, defaultPayment, prefill,
}: {
  deliveryMethods: Method[];
  paymentMethods: Method[];
  summary: React.ReactNode;
  defaultDelivery: string;
  defaultPayment: string;
  prefill?: Prefill;
}) {
  const [state, formAction] = useActionState(placeOrderAction, emptyCheckoutState);
  const [delivery, setDelivery] = useState(state.values.deliveryCode || defaultDelivery);
  const [payment, setPayment] = useState(state.values.paymentCode || defaultPayment);
  const [phone, setPhone] = useState(state.values.phone ?? prefill?.phone ?? '');
  const pre = (key: keyof Prefill) => state.values[key] ?? prefill?.[key] ?? '';
  const e = state.errors;

  return (
    <form action={formAction} className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        {e.form && (
          <p role="alert" className="mb-3.5 rounded-xl2 border border-ember bg-ember/5 px-4 py-3 text-sm font-semibold text-ember">
            {e.form}
          </p>
        )}

        <fieldset className="mb-3.5 rounded-xl2 border border-line bg-paper p-5">
          <legend className="flex items-center gap-2.5 px-1 text-[15px] font-extrabold">
            <i className="grid h-[22px] w-[22px] place-items-center rounded-full bg-bordeaux text-[11px] not-italic text-paper">1</i>
            Контактні дані
          </legend>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <Field name="firstName" label="Ім’я" required error={e.firstName} defaultValue={pre('firstName')} placeholder="Олександр" />
            <Field name="lastName" label="Прізвище" required error={e.lastName} defaultValue={pre('lastName')} placeholder="Коваленко" />
            <Field name="phone" label="Телефон" required error={e.phone} placeholder="+38 (0__) ___-__-__"
              value={phone} onChange={(v) => setPhone(formatPhone(v))} />
            <Field name="email" label="Email" type="email" error={e.email} defaultValue={pre('email')} placeholder="olex@example.com" />
          </div>
          <p className="mt-3 text-[12.5px] text-inkfaint">
            Реєстрація не потрібна — досить телефону. Статус замовлення надішлемо в месенджер або на пошту.
          </p>
        </fieldset>

        <fieldset className="mb-3.5 rounded-xl2 border border-line bg-paper p-5">
          <legend className="flex items-center gap-2.5 px-1 text-[15px] font-extrabold">
            <i className="grid h-[22px] w-[22px] place-items-center rounded-full bg-bordeaux text-[11px] not-italic text-paper">2</i>
            Доставка
          </legend>
          <div className="mt-3.5 flex flex-col gap-2">
            {deliveryMethods.map((m) => (
              <label key={m.code}
                className={`flex cursor-pointer items-start gap-3 rounded-[11px] border bg-ivory px-4 py-3 transition ${
                  delivery === m.code ? 'border-bordeaux ring-1 ring-bordeaux' : 'border-line2 hover:border-bordeaux'
                }`}>
                <input type="radio" name="deliveryCode" value={m.code} checked={delivery === m.code}
                  onChange={() => setDelivery(m.code)} className="!mt-1 !h-4 !w-4 shrink-0 !p-0 accent-bordeaux" />
                <span className="min-w-0 flex-1">
                  <b className="block text-sm">{m.name}</b>
                  <span className="text-[12.5px] text-inkfaint">{m.description}</span>
                </span>
                <span className="tabular shrink-0 text-[13.5px] font-extrabold">
                  {m.price ? formatMoney(m.price) : 'Безкоштовно'}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            <Field name="city" label="Місто" required error={e.city} defaultValue={pre('city') || 'Київ'} />
            {delivery === 'np' && (
              <Field name="branch" label="Відділення Нової Пошти" required error={e.branch}
                defaultValue={state.values.branch} placeholder="№ 24, вул. Хрещатик, 22" />
            )}
            {delivery === 'pickup' && (
              <div className="flex flex-col gap-1.5">
                <span className="field-label">Точка самовивозу</span>
                <input readOnly value="вул. Різницька, 14, Київ" />
              </div>
            )}
            {(delivery === 'courier' || delivery === 'other') && (
              <>
                <Field name="street" label="Вулиця" required={delivery === 'courier'} error={e.street}
                  defaultValue={pre('street')} placeholder="вул. Січових Стрільців" />
                <Field name="house" label="Будинок" required={delivery === 'courier'} error={e.house}
                  defaultValue={pre('house')} placeholder="14-Б" />
                <Field name="apartment" label="Квартира" error={e.apartment} defaultValue={pre('apartment')} placeholder="27" />
              </>
            )}
          </div>
        </fieldset>

        <fieldset className="mb-3.5 rounded-xl2 border border-line bg-paper p-5">
          <legend className="flex items-center gap-2.5 px-1 text-[15px] font-extrabold">
            <i className="grid h-[22px] w-[22px] place-items-center rounded-full bg-bordeaux text-[11px] not-italic text-paper">3</i>
            Оплата
          </legend>
          <div className="mt-3.5 flex flex-col gap-2">
            {paymentMethods.map((m) => (
              <label key={m.code}
                className={`flex cursor-pointer items-start gap-3 rounded-[11px] border bg-ivory px-4 py-3 transition ${
                  payment === m.code ? 'border-bordeaux ring-1 ring-bordeaux' : 'border-line2 hover:border-bordeaux'
                }`}>
                <input type="radio" name="paymentCode" value={m.code} checked={payment === m.code}
                  onChange={() => setPayment(m.code)} className="!mt-1 !h-4 !w-4 shrink-0 !p-0 accent-bordeaux" />
                <span>
                  <b className="block text-sm">{m.name}</b>
                  <span className="text-[12.5px] text-inkfaint">{m.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-xl2 border border-line bg-paper p-5">
          <legend className="flex items-center gap-2.5 px-1 text-[15px] font-extrabold">
            <i className="grid h-[22px] w-[22px] place-items-center rounded-full bg-bordeaux text-[11px] not-italic text-paper">4</i>
            Коментар до замовлення
          </legend>
          <textarea name="comment" rows={3} defaultValue={state.values.comment} className="mt-3.5"
            placeholder="Наприклад: наріжте ошийок кубиками 4 см, зателефонуйте за годину до доставки" />
        </fieldset>
      </div>

      <div className="lg:sticky lg:top-[86px]">{summary}</div>
    </form>
  );
}

export { SubmitButton };
