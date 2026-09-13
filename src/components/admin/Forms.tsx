'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { toHryvnia } from '@/lib/money';
import type { SiteSettings } from '@/types/settings';
import {
  loginAction, saveCategoryAction, saveCouponAction, saveSettingsAction, type FormState,
} from '@/app/(admin)/admin/actions';

function Pending({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn btn-primary btn-sm">{pending ? busy : label}</button>;
}

function Note({ state }: { state: FormState }) {
  if (state.errors?.form) return <p className="field-error">{state.errors.form}</p>;
  if (state.message) return <p className="text-[12.5px] font-semibold text-good">{state.message}</p>;
  return null;
}

/* ─────────────────────────────── логін ──────────────────────────────── */

function LoginSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full">
      {pending ? 'Входимо…' : 'Увійти'}
    </button>
  );
}

export function LoginForm({ next, shopName }: { next: string; shopName: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="flex w-full max-w-[380px] flex-col gap-3.5 rounded-xl3 border border-line bg-paper p-7 shadow-card">
      <div>
        <h1 className="display text-[24px] leading-tight">{shopName}</h1>
        <p className="text-[13px] text-inkfaint">Вхід до адміністративної панелі</p>
      </div>
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="a-email" className="field-label">Email</label>
        <input id="a-email" name="email" type="email" required autoComplete="username"
          aria-invalid={state.errors?.email ? 'true' : undefined} />
        {state.errors?.email && <span className="field-error">{state.errors.email}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="a-password" className="field-label">Пароль</label>
        <input id="a-password" name="password" type="password" required autoComplete="current-password"
          aria-invalid={state.errors?.password ? 'true' : undefined} />
        {state.errors?.password && <span className="field-error">{state.errors.password}</span>}
      </div>
      {state.errors?.form && (
        <p role="alert" className="rounded-lg border border-ember bg-ember/5 px-3 py-2 text-[13px] font-semibold text-ember">
          {state.errors.form}
        </p>
      )}
      <LoginSubmit />
      <p className="text-[11.5px] leading-relaxed text-inkfaint">
        Після п’яти невдалих спроб обліковий запис блокується на 15 хвилин. Доступ мають лише адміністратори магазину.
      </p>
    </form>
  );
}

/* ───────────────────────────── налаштування ─────────────────────────── */

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction] = useActionState<FormState, FormData>(saveSettingsAction, {});
  const e = state.errors ?? {};

  const text = (name: keyof SiteSettings, label: string, hint?: string, full?: boolean) => (
    <div className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <label className="field-label">{label}</label>
      <input name={name} defaultValue={String(settings[name])} aria-invalid={e[name] ? 'true' : undefined} />
      {hint && !e[name] && <span className="text-[11.5px] text-inkfaint">{hint}</span>}
      {e[name] && <span className="field-error">{e[name]}</span>}
    </div>
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-1 text-[15px] font-extrabold">Ідентичність магазину</h2>
        <p className="mb-4 text-[12.5px] text-inkfaint">
          Ці значення живуть у базі даних, а не в коді. Змініть назву — і вона одразу зміниться в шапці, футері,
          заголовках сторінок та листах.
        </p>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {text('shopName', 'Назва магазину')}
          {text('tagline', 'Підпис під назвою')}
          {text('description', 'Короткий опис', undefined, true)}
        </div>
      </section>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-4 text-[15px] font-extrabold">Контакти й соцмережі</h2>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {text('phone', 'Телефон')}
          {text('email', 'Email')}
          {text('address', 'Адреса')}
          {text('workingHours', 'Графік роботи')}
          {text('telegram', 'Telegram')}
          {text('instagram', 'Instagram')}
          {text('facebook', 'Facebook')}
          {text('viber', 'Viber')}
        </div>
      </section>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-4 text-[15px] font-extrabold">Комерційні правила</h2>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Безкоштовна доставка від, ₴</label>
            <input name="freeShippingFrom" type="number" step="1" min="0" defaultValue={toHryvnia(settings.freeShippingFrom)} />
            {e.freeShippingFrom && <span className="field-error">{e.freeShippingFrom}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Мінімальна сума замовлення, ₴</label>
            <input name="minOrderTotal" type="number" step="1" min="0" defaultValue={toHryvnia(settings.minOrderTotal)} />
            {e.minOrderTotal && <span className="field-error">{e.minOrderTotal}</span>}
          </div>
        </div>
      </section>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-4 text-[15px] font-extrabold">Головна сторінка та SEO</h2>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {text('heroTitle', 'Заголовок Hero-блоку', undefined, true)}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="field-label">Підзаголовок Hero-блоку</label>
            <textarea name="heroSubtitle" rows={2} defaultValue={settings.heroSubtitle} />
          </div>
          {text('heroCtaLabel', 'Текст кнопки Hero')}
          {text('seoTitle', 'SEO title головної')}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="field-label">SEO description головної</label>
            <textarea name="seoDescription" rows={2} defaultValue={settings.seoDescription} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="field-label">Текст у футері</label>
            <textarea name="footerNote" rows={2} defaultValue={settings.footerNote} />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Pending label="Зберегти налаштування" busy="Зберігаємо…" />
        <Note state={state} />
      </div>
    </form>
  );
}

/* ────────────────────────────── категорія ───────────────────────────── */

export function CategoryForm({ parents }: { parents: Array<{ id: string; name: string }> }) {
  const action = saveCategoryAction.bind(null, null);
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const e = state.errors ?? {};
  return (
    <form action={formAction} className="grid gap-3.5 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Назва</label>
        <input name="name" required placeholder="Вітрина тижня" aria-invalid={e.name ? 'true' : undefined} />
        {e.name && <span className="field-error">{e.name}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Адреса</label>
        <input name="slug" placeholder="vitryna" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Батьківська категорія</label>
        <select name="parentId" defaultValue="">
          <option value="">— верхній рівень —</option>
          {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Порядок</label>
        <input name="sortOrder" type="number" min="0" defaultValue={0} />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label className="field-label">Опис</label>
        <textarea name="description" rows={2} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold">
        <input type="checkbox" name="isActive" defaultChecked className="!h-4 !w-4 !p-0 accent-bordeaux" />
        Активна
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Pending label="Створити категорію" busy="Створюємо…" />
        <Note state={state} />
      </div>
    </form>
  );
}

/* ────────────────────────────── промокод ────────────────────────────── */

export function CouponForm() {
  const [state, formAction] = useActionState<FormState, FormData>(saveCouponAction, {});
  const e = state.errors ?? {};
  return (
    <form action={formAction} className="grid gap-3.5 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Код</label>
        <input name="code" required placeholder="ВЕСНА15" className="uppercase" aria-invalid={e.code ? 'true' : undefined} />
        {e.code && <span className="field-error">{e.code}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Тип</label>
        <select name="type" defaultValue="PERCENT">
          <option value="PERCENT">Відсоток</option>
          <option value="FIXED">Фіксована сума, ₴</option>
          <option value="FREE_SHIPPING">Безкоштовна доставка</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Значення</label>
        <input name="value" type="number" step="0.01" min="0" defaultValue={10} />
        <span className="text-[11.5px] text-inkfaint">Для відсотка — 10 означає −10 %. Для суми — гривні.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Мінімальна сума замовлення, ₴</label>
        <input name="minOrderTotal" type="number" step="1" min="0" defaultValue={0} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Ліміт використань</label>
        <input name="usageLimit" type="number" min="0" placeholder="без обмежень" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Діє з</label>
        <input name="startsAt" type="date" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Діє до</label>
        <input name="endsAt" type="date" />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold">
        <input type="checkbox" name="isActive" defaultChecked className="!h-4 !w-4 !p-0 accent-bordeaux" />
        Активний
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Pending label="Зберегти промокод" busy="Зберігаємо…" />
        <Note state={state} />
      </div>
    </form>
  );
}
