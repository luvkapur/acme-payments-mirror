import { useCallback, useState } from 'react';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import type { HttpClient } from '@acme-modular/platform.utils.http-client';
import type { Order } from '@acme-modular/platform.entities.order';
import { calculateFee } from '@acme-modular/payments.payments.fee-calculator';
import type { PaymentMethod } from '@acme-modular/payments.payments.payment-method-picker';

/** Proof of a successful payment. Amounts are integer cents. */
export type PaymentReceipt = {
  id: string;
  orderId: string;
  /** what the customer paid: the order total. */
  amountCents: number;
  /** the processing fee ACME pays on top, from `calculateFee`. */
  feeCents: number;
  method: PaymentMethod;
};

export type PaymentStatus = 'idle' | 'processing' | 'succeeded' | 'failed';

export type UsePaymentOptions = {
  /** the payments backend. defaults to an in-memory mock so previews work offline. */
  client?: HttpClient;
};

export type UsePaymentResult = {
  /** charges the order total. resolves with the receipt and rejects when the payment fails. */
  pay(order: Order, method: PaymentMethod): Promise<PaymentReceipt>;
  status: PaymentStatus;
  receipt?: PaymentReceipt;
  error?: Error;
  /** back to `idle`, e.g. to retry with another method. */
  reset(): void;
};

// the mock backend accepts any positive amount and echoes the payment back with an id.
const mockClient = createHttpClient({
  transport: createMockTransport(
    {
      'POST /payments': async (request) => {
        const payment = (await request.json()) as Omit<PaymentReceipt, 'id'>;
        if (payment.amountCents <= 0) throw new Error('payment declined: nothing to charge');
        return { id: `pay-${payment.orderId}`, ...payment };
      },
    },
    { latencyMs: 300 }
  ),
});

/**
 * Pays for an order and tracks the payment's progress. The fee is calculated
 * here with `calculateFee` so the receipt always matches what finance expects.
 *
 * @example
 * const { pay, status } = usePayment();
 * await pay(order, 'card');
 */
export function usePayment({ client = mockClient }: UsePaymentOptions = {}): UsePaymentResult {
  const [state, setState] = useState<{ status: PaymentStatus; receipt?: PaymentReceipt; error?: Error }>({
    status: 'idle',
  });

  const pay = useCallback(
    async (order: Order, method: PaymentMethod) => {
      setState({ status: 'processing' });
      const amountCents = order.total.amountCents;
      try {
        const receipt = await client.post<PaymentReceipt>('/payments', {
          orderId: order.id,
          amountCents,
          feeCents: calculateFee(amountCents),
          method,
        });
        setState({ status: 'succeeded', receipt });
        return receipt;
      } catch (caught) {
        const error = caught instanceof Error ? caught : new Error(String(caught));
        setState({ status: 'failed', error });
        throw error;
      }
    },
    [client]
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { ...state, pay, reset };
}
