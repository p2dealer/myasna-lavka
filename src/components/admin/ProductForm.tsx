'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { adminPath } from '@/lib/utils';
import { toHryvnia } from '@/lib/money';
import { saveProductAction, type FormState } from '@/app/(admin)/admin/actions';

export type ProductFormValues = {
  id?: string;
  name: string; slug: string; sku: string; categoryId: string;
  meat: string; type: string; pricingMode: string;
  price: number; oldPrice: number | null; costPrice: number | null; packWeightG: number | null;
  stock: number; lowStockThreshold: number;
  shortDescription: string | null; description: string | null; composition: string | null;
  origin: string | null; producer: string | null; storageConditions: string | null;
  shelfLifeDays: number | null; kcal: number | null; protein: number | null; fat: number | null;
  imageUrl: string | null; seoTitle: string | null; seoDescription: string | null;
  isActive: boolean; isHit: boolean; isNew: boolean; isRecommended: boolean;
};

const MEATS = [['beef', 'Яловичина'], ['pork', 'Свинина'], ['chicken', 'Курятина'], ['turkey', 'Індичка'], ['lamb', 'Баранина']];
const TYPES = [
  ['steak', 'Стейки'], ['fillet', 'Філе та вирізка'], ['mince', 'Фарш'], ['ribs', 'Ребра та грудинка'],
  ['sausage', 'Ковбаси'], ['smoked', 'Копченості'], ['semi', 'Напівфабрикати'], ['bbq', 'BBQ і гриль'], ['set', 'Набори'],
];
const MODES = [
  ['PER_KG', 'За кілограм (з вибором ваги)'],
  ['PER_100G', 'За 100 грамів'],
  ['PER_UNIT', 'За штуку'],
  ['PER_PACKAGE', 'За упаковку фіксованої ваги'],
  ['SET', 'Набір за фіксовану ціну'],
];

function Row({ label, hint, error, children, full }: {
  label: string; hint?: string; error?: string; children: React.ReactNode; full?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <label className="field-label">{label}</label>
      {children}
      {hint && !error && <span className="text-[11.5px] text-inkfaint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function Save({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? 'Зберігаємо…' : isNew ? 'Створити товар' : 'Зберегти зміни'}
    </button>
  );
}

export function ProductForm({
  product, categories,
}: {
  product?: ProductFormValues;
  categories: Array<{ id: string; name: string }>;
}) {
  const action = saveProductAction.bind(null, product?.id ?? null);
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const [mode, setMode] = useState(product?.pricingMode ?? 'PER_KG');
  const e = state.errors ?? {};
  const weighted = mode === 'PER_KG' || mode === 'PER_100G';
  const packed = mode === 'PER_PACKAGE' || mode === 'SET';

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {e.form && (
        <p role="alert" className="rounded-xl2 border border-ember bg-ember/5 px-4 py-3 text-sm font-semibold text-ember">
          {e.form}
        </p>
      )}

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-4 text-[15px] font-extrabold">Основне</h2>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Row label="Назва товару" error={e.name} full>
            <input name="name" required defaultValue={product?.name} placeholder="Стейк Ribeye сухого визрівання" />
          </Row>
          <Row label="Артикул (SKU)" error={e.sku}>
            <input name="sku" required defaultValue={product?.sku} placeholder="ML-001" />
          </Row>
          <Row label="Адреса сторінки" hint="Залиште порожнім — згенеруємо з назви" error={e.slug}>
            <input name="slug" defaultValue={product?.slug} placeholder="stejk-ribeye" />
          </Row>
          <Row label="Категорія" error={e.categoryId}>
            <select name="categoryId" required defaultValue={product?.categoryId ?? ''}>
              <option value="" disabled>Оберіть категорію</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Row>
          <Row label="Вид м’яса" error={e.meat}>
            <select name="meat" defaultValue={product?.meat ?? 'beef'}>
              {MEATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Row>
          <Row label="Тип продукту" error={e.type} full>
            <select name="type" defaultValue={product?.type ?? 'steak'}>
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Row>
        </div>
      </section>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-1 text-[15px] font-extrabold">Ціна та спосіб продажу</h2>
        <p className="mb-4 text-[12.5px] text-inkfaint">
          Ціна вводиться за ту одиницю, яку ви обрали нижче. Для вагових товарів покупець обирає вагу, а сума
          перераховується автоматично.
        </p>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Row label="Спосіб продажу" error={e.pricingMode} full>
            <select name="pricingMode" value={mode} onChange={(ev) => setMode(ev.target.value)}>
              {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Row>
          <Row label={`Ціна, ₴ ${weighted ? (mode === 'PER_KG' ? 'за кг' : 'за 100 г') : mode === 'PER_UNIT' ? 'за шт' : 'за упаковку'}`} error={e.price}>
            <input name="price" type="number" step="0.01" min="0" required
              defaultValue={product ? toHryvnia(product.price) : ''} placeholder="1290" />
          </Row>
          <Row label="Стара ціна, ₴" hint="Заповніть, щоб показати знижку" error={e.oldPrice}>
            <input name="oldPrice" type="number" step="0.01" min="0"
              defaultValue={product?.oldPrice ? toHryvnia(product.oldPrice) : ''} placeholder="1490" />
          </Row>
          <Row label="Закупівельна ціна, ₴" hint="Видно тільки в адмінці" error={e.costPrice}>
            <input name="costPrice" type="number" step="0.01" min="0"
              defaultValue={product?.costPrice ? toHryvnia(product.costPrice) : ''} />
          </Row>
          {packed && (
            <Row label="Вага упаковки, г" error={e.packWeightG}>
              <input name="packWeightG" type="number" min="0" defaultValue={product?.packWeightG ?? ''} placeholder="400" />
            </Row>
          )}
          <Row label={`Залишок, ${weighted ? 'грамів' : 'штук'}`} error={e.stock}>
            <input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} />
          </Row>
          <Row label={`Поріг «мало», ${weighted ? 'грамів' : 'штук'}`} hint="Нижче порогу товар підсвічується на дашборді" error={e.lowStockThreshold}>
            <input name="lowStockThreshold" type="number" min="0" required defaultValue={product?.lowStockThreshold ?? 0} />
          </Row>
        </div>
      </section>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-4 text-[15px] font-extrabold">Опис і склад</h2>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Row label="Короткий опис" hint="Показується в картці каталогу" error={e.shortDescription} full>
            <textarea name="shortDescription" rows={2} defaultValue={product?.shortDescription ?? ''} />
          </Row>
          <Row label="Повний опис" error={e.description} full>
            <textarea name="description" rows={6} defaultValue={product?.description ?? ''} />
          </Row>
          <Row label="Склад" error={e.composition} full>
            <textarea name="composition" rows={2} defaultValue={product?.composition ?? ''} />
          </Row>
          <Row label="Країна походження" error={e.origin}>
            <input name="origin" defaultValue={product?.origin ?? 'Україна'} />
          </Row>
          <Row label="Виробник" error={e.producer}>
            <input name="producer" defaultValue={product?.producer ?? ''} />
          </Row>
          <Row label="Умови зберігання" error={e.storageConditions}>
            <input name="storageConditions" defaultValue={product?.storageConditions ?? 'від 0 до +4 °C'} />
          </Row>
          <Row label="Термін придатності, діб" error={e.shelfLifeDays}>
            <input name="shelfLifeDays" type="number" min="0" defaultValue={product?.shelfLifeDays ?? ''} />
          </Row>
          <Row label="Калорійність, ккал / 100 г" error={e.kcal}>
            <input name="kcal" type="number" min="0" defaultValue={product?.kcal ?? ''} />
          </Row>
          <Row label="Білки, г" error={e.protein}>
            <input name="protein" type="number" min="0" defaultValue={product?.protein ?? ''} />
          </Row>
          <Row label="Жири, г" error={e.fat}>
            <input name="fat" type="number" min="0" defaultValue={product?.fat ?? ''} />
          </Row>
        </div>
      </section>

      <section className="rounded-xl2 border border-line bg-paper p-5">
        <h2 className="mb-4 text-[15px] font-extrabold">Фото, SEO та позначки</h2>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Row label="Головне фото — адреса" hint="Шлях до завантаженого файлу або /api/img/ribeye/beef/1" error={e.imageUrl} full>
            <input name="imageUrl" defaultValue={product?.imageUrl ?? ''} placeholder="/uploads/ribeye.webp" />
          </Row>
          <Row label="SEO title" error={e.seoTitle}>
            <input name="seoTitle" defaultValue={product?.seoTitle ?? ''} />
          </Row>
          <Row label="SEO description" error={e.seoDescription}>
            <input name="seoDescription" defaultValue={product?.seoDescription ?? ''} />
          </Row>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5">
          {([['isActive', 'Опубліковано', product?.isActive ?? true],
            ['isHit', 'Хіт продажів', product?.isHit ?? false],
            ['isNew', 'Новинка', product?.isNew ?? false],
            ['isRecommended', 'Рекомендуємо', product?.isRecommended ?? false]] as const).map(([name, label, checked]) => (
            <label key={name} className="flex cursor-pointer items-center gap-2 text-[13.5px] font-semibold">
              <input type="checkbox" name={name} defaultChecked={checked}
                className="!h-4 !w-4 !p-0 accent-bordeaux" />
              {label}
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2.5">
        <Save isNew={!product?.id} />
        <Link href={adminPath('products')} className="btn btn-ghost">Скасувати</Link>
        {product?.slug && (
          <Link href={`/product/${product.slug}`} target="_blank" className="btn btn-ghost">
            Відкрити на сайті
          </Link>
        )}
      </div>
    </form>
  );
}
