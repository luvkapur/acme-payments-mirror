import { renderHook, act } from '@testing-library/react';
import { createHttpClient, createMockTransport, HttpError } from '@acme-modular/platform.utils.http-client';
import { mockOrders } from '@acme-modular/platform.entities.order';
import { calculateFee } from '@acme-modular/payments.payments.fee-calculator';
import { usePayment } from './use-payment.js';

const client = createHttpClient({
  transport: createMockTransport(
    { 'POST /payments': async (request) => ({ id: 'pay-1', ...(await request.json()) }) },
    { latencyMs: 0 }
  ),
});

it('charges the order total with the calculated fee', async () => {
  const order = mockOrders()[0];
  const { result } = renderHook(() => usePayment({ client }));
  expect(result.current.status).toBe('idle');

  let receipt: Awaited<ReturnType<typeof result.current.pay>> | undefined;
  await act(async () => {
    receipt = await result.current.pay(order, 'card');
  });

  expect(receipt).toEqual({
    id: 'pay-1',
    orderId: 'o-1003',
    amountCents: 60200,
    feeCents: calculateFee(60200),
    method: 'card',
  });
  expect(result.current.status).toBe('succeeded');
  expect(result.current.receipt).toEqual(receipt);
});

it('fails with the error and resets to idle', async () => {
  const offline = createHttpClient({ transport: createMockTransport({}, { latencyMs: 0 }) });
  const { result } = renderHook(() => usePayment({ client: offline }));

  await act(async () => {
    await expect(result.current.pay(mockOrders()[1], 'paypal')).rejects.toBeInstanceOf(HttpError);
  });
  expect(result.current.status).toBe('failed');
  expect(result.current.error).toBeInstanceOf(HttpError);

  act(() => result.current.reset());
  expect(result.current.status).toBe('idle');
  expect(result.current.error).toBeUndefined();
});
