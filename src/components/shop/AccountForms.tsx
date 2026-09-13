'use client';

import Link from 'next/link';
import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { formatPhone } from '@/lib/utils';
import {
  changePasswordAction, deleteAddressAction, loginUserAction, logoutUserAction, registerAction,
  repeatOrderAction, requestResetAction, resetPasswordAction, saveAddressAction, updateProfileAction,
  type AccountState,
} from '@/app/actions/account';

const empty: AccountState = {};

function Submit({ label, busy, wide }: { label: string; busy: string; wide?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`btn btn-primary ${wide ? 'w-full' : ''}`}>
      {pending ? busy : label}
    </button>
  );
}

function Field({
  name, label, type = 'text', required, error, defaultValue, placeholder, autoComplete, value, onChange, full,
}: {
  name: string; label: string; type?: string; required?: boolean; error?: string;
  defaultValue?: string; placeholder?: string; autoComplete?: string; full?: boolean;
  value?: string; onChange?: (v: string) => void;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <label htmlFor={`f-${name}`} className="field-label">
        {label} {required && <span className="text-ember">*</span>}
      </label>
      <input
        id={`f-${name}`} name={name} type={type} required={required} placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        aria-invalid={error ? 'true' : undefined}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function FormNote({ state }: { state: AccountState }) {
  if (state.errors?.form) {
    return (
      <p role="alert" className="rounded-lg border border-ember bg-ember/5 px-3.5 py-2.5 text-[13px] font-semibold text-ember">
        {state.errors.form}
      </p>
    );
  }
  if (state.message) return <p className="text-[13px] font-semibold text-good">{state.message}</p>;
  return null;
}

/* ──────────────────────────── вхід / реєстрація ─────────────────────── */

export function UserLoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginUserAction, empty);
  return (
    <form action={action} className="flex flex-col gap-3.5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field name="email" label="Пошта" type="email" required error={state.errors?.email}
        defaultValue={state.values?.email} autoComplete="username" />
      <Field name="password" label="Пароль" type="password" required error={state.errors?.password}
        autoComplete="current-password" />
      <FormNote state={state} />
      <Submit label="Увійти" busy="Входимо…" wide />
      <div className="flex flex-wrap justify-between gap-3 text-[13px]">
        <Link href="/account/reset" className="text-bordeaux hover:underline">Забули пароль?</Link>
        <Link href="/account/register" className="text-bordeaux hover:underline">Створити акаунт</Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, empty);
  const [phone, setPhone] = useState('');
  return (
    <form action={action} className="grid gap-3.5 sm:grid-cols-2">
      <Field name="firstName" label="Ім’я" required error={state.errors?.firstName} defaultValue={state.values?.firstName} />
      <Field name="lastName" label="Прізвище" error={state.errors?.lastName} defaultValue={state.values?.lastName} />
      <Field name="email" label="Пошта" type="email" required error={state.errors?.email}
        defaultValue={state.values?.email} autoComplete="email" />
      <Field name="phone" label="Телефон" error={state.errors?.phone} placeholder="+38 (0__) ___-__-__"
        value={phone} onChange={(v) => setPhone(formatPhone(v))} />
      <Field name="password" label="Пароль" type="password" required error={state.errors?.password}
        autoComplete="new-password" />
      <Field name="passwordConfirm" label="Пароль ще раз" type="password" required
        error={state.errors?.passwordConfirm} autoComplete="new-password" />
      <div className="sm:col-span-2"><FormNote state={state} /></div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Submit label="Створити акаунт" busy="Створюємо…" />
        <Link href="/account/login" className="text-[13px] text-bordeaux hover:underline">У мене вже є акаунт</Link>
      </div>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action] = useActionState(requestResetAction, empty);
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Field name="email" label="Пошта, вказана при реєстрації" type="email" required error={state.errors?.email} />
      <FormNote state={state} />
      {state.values?.devLink && (
        <p className="rounded-lg border border-dashed border-line2 bg-paper px-3.5 py-2.5 text-[12.5px] text-inksoft">
          Поштовий сервіс ще не підключено, тому посилання показано тут:{' '}
          <Link href={state.values.devLink.replace(/^https?:\/\/[^/]+/, '')} className="break-all text-bordeaux underline">
            {state.values.devLink}
          </Link>
        </p>
      )}
      <Submit label="Надіслати посилання" busy="Надсилаємо…" wide />
      <Link href="/account/login" className="text-[13px] text-bordeaux hover:underline">Повернутись до входу</Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, empty);
  return (
    <form action={action} className="flex flex-col gap-3.5">
      <input type="hidden" name="token" value={token} />
      <Field name="password" label="Новий пароль" type="password" required error={state.errors?.password}
        autoComplete="new-password" />
      <Field name="passwordConfirm" label="Новий пароль ще раз" type="password" required
        error={state.errors?.passwordConfirm} autoComplete="new-password" />
      <FormNote state={state} />
      <Submit label="Зберегти пароль" busy="Зберігаємо…" wide />
    </form>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutUserAction}>
      <button type="submit" className={className ?? 'btn btn-ghost btn-sm'}>Вийти</button>
    </form>
  );
}

/* ───────────────────────────────── профіль ──────────────────────────── */

export function ProfileForm({ user }: { user: { firstName: string | null; lastName: string | null; phone: string | null; email: string } }) {
  const [state, action] = useActionState(updateProfileAction, empty);
  const [phone, setPhone] = useState(user.phone ?? '');
  return (
    <form action={action} className="grid gap-3.5 sm:grid-cols-2">
      <Field name="firstName" label="Ім’я" required error={state.errors?.firstName} defaultValue={user.firstName ?? ''} />
      <Field name="lastName" label="Прізвище" error={state.errors?.lastName} defaultValue={user.lastName ?? ''} />
      <Field name="phone" label="Телефон" error={state.errors?.phone} value={phone}
        onChange={(v) => setPhone(formatPhone(v))} placeholder="+38 (0__) ___-__-__" />
      <div className="flex flex-col gap-1.5">
        <span className="field-label">Пошта</span>
        <input value={user.email} readOnly aria-label="Пошта" />
        <span className="text-[11.5px] text-inkfaint">Щоб змінити пошту, зателефонуйте нам</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Submit label="Зберегти" busy="Зберігаємо…" />
        <FormNote state={state} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, empty);
  return (
    <form action={action} className="grid gap-3.5 sm:grid-cols-2">
      <Field name="current" label="Поточний пароль" type="password" required error={state.errors?.current}
        autoComplete="current-password" />
      <div className="hidden sm:block" />
      <Field name="password" label="Новий пароль" type="password" required error={state.errors?.password}
        autoComplete="new-password" />
      <Field name="passwordConfirm" label="Новий пароль ще раз" type="password" required
        error={state.errors?.passwordConfirm} autoComplete="new-password" />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Submit label="Змінити пароль" busy="Змінюємо…" />
        <FormNote state={state} />
      </div>
    </form>
  );
}

/* ──────────────────────────────── адреси ────────────────────────────── */

export function AddressForm({ address }: {
  address?: { id: string; label: string | null; city: string; street: string | null; house: string | null; apartment: string | null; isDefault: boolean };
}) {
  const [state, action] = useActionState(saveAddressAction, empty);
  return (
    <form action={action} className="grid gap-3.5 sm:grid-cols-2">
      {address && <input type="hidden" name="id" value={address.id} />}
      <Field name="label" label="Назва" placeholder="Дім, офіс…" defaultValue={address?.label ?? ''} error={state.errors?.label} />
      <Field name="city" label="Місто" required defaultValue={address?.city ?? 'Київ'} error={state.errors?.city} />
      <Field name="street" label="Вулиця" defaultValue={address?.street ?? ''} error={state.errors?.street} />
      <Field name="house" label="Будинок" defaultValue={address?.house ?? ''} error={state.errors?.house} />
      <Field name="apartment" label="Квартира" defaultValue={address?.apartment ?? ''} error={state.errors?.apartment} />
      <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="!h-4 !w-4 !p-0 accent-bordeaux" />
        Використовувати за замовчуванням
      </label>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Submit label={address ? 'Зберегти адресу' : 'Додати адресу'} busy="Зберігаємо…" />
        <FormNote state={state} />
      </div>
    </form>
  );
}

export function DeleteAddressButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-[12.5px] text-inkfaint hover:text-ember">
        Видалити
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-[12.5px]">
      <button type="button" disabled={pending} className="font-bold text-ember"
        onClick={() => start(() => { void deleteAddressAction(id); })}>
        Точно видалити
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="text-inkfaint">Ні</button>
    </span>
  );
}

/* ─────────────────────────── повтор замовлення ──────────────────────── */

export function RepeatOrderButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <span className="flex flex-col items-end gap-1">
      <button type="button" disabled={pending} className="btn btn-ghost btn-sm"
        onClick={() => start(async () => {
          const result = await repeatOrderAction(orderId);
          setMessage({ ok: result.ok !== false, text: result.message ?? '' });
        })}>
        {pending ? 'Додаємо…' : 'Повторити замовлення'}
      </button>
      {message && (
        <span className={`max-w-[280px] text-right text-[11.5px] ${message.ok ? 'text-good' : 'text-ember'}`}>
          {message.text}
        </span>
      )}
    </span>
  );
}
