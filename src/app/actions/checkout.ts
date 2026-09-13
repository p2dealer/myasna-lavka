'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { checkoutSchema, fieldErrors } from '@/validation/schemas';
import { placeOrder } from '@/services/orders';
import { currentUser } from '@/services/account';

export type CheckoutState = {
  errors: Record<string, string>;
  values: Record<string, string>;
};

export const emptyCheckoutState: CheckoutState = { errors: {}, values: {} };

export async function placeOrderAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
  const parsed = checkoutSchema.safeParse(raw);

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values: raw };
  }

  const user = await currentUser();
  const result = await placeOrder({ ...parsed.data, userId: user?.id ?? null });
  if (!result.ok) {
    return { errors: { form: result.error }, values: raw };
  }

  revalidatePath('/', 'layout');
  redirect(result.online ? `/order/${result.number}/pay` : `/order/${result.number}`);
}
