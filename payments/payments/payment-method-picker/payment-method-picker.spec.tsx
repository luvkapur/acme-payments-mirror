import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentMethodPicker, paymentMethodLabel } from './payment-method-picker.js';

it('renders a labelled radio group with the value checked', () => {
  render(<PaymentMethodPicker value="paypal" onChange={() => {}} />);
  expect(screen.getByRole('group', { name: 'Payment method' })).toBeTruthy();
  expect(screen.getAllByRole('radio')).toHaveLength(3);
  expect((screen.getByRole('radio', { name: /paypal/i }) as HTMLInputElement).checked).toBe(true);
  expect((screen.getByRole('radio', { name: /card/i }) as HTMLInputElement).checked).toBe(false);
});

it('reports the picked method', () => {
  const onChange = vi.fn();
  render(<PaymentMethodPicker value="card" onChange={onChange} />);
  fireEvent.click(screen.getByRole('radio', { name: /invoice/i }));
  expect(onChange).toHaveBeenCalledWith('invoice');
});

it('labels methods for display', () => {
  expect(paymentMethodLabel('card')).toBe('Credit or debit card');
  expect(paymentMethodLabel('invoice')).toBe('Invoice');
});
