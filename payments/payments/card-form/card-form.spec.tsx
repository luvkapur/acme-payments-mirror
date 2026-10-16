import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardForm } from './card-form.js';

function fill(number: string, expiry: string, cvc: string) {
  fireEvent.change(screen.getByLabelText(/card number/i), { target: { value: number } });
  fireEvent.change(screen.getByLabelText(/expiry/i), { target: { value: expiry } });
  fireEvent.change(screen.getByLabelText(/security code/i), { target: { value: cvc } });
}

it('shows errors and does not submit an invalid card', () => {
  const onSubmit = vi.fn();
  render(<CardForm onSubmit={onSubmit} />);
  fill('4242 4242 4242 4241', '01/20', '1');
  fireEvent.click(screen.getByRole('button', { name: 'Use this card' }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText('This card number is not valid')).toBeTruthy();
  expect(screen.getByText('This card has expired')).toBeTruthy();
});

it('passes on the brand, last four digits and expiry, never the full number', () => {
  const onSubmit = vi.fn();
  render(<CardForm onSubmit={onSubmit} submitLabel="Pay now" />);
  // far enough out that the test doesn't expire
  fill('4242 4242 4242 4242', '12/49', '123');
  fireEvent.click(screen.getByRole('button', { name: 'Pay now' }));
  expect(onSubmit).toHaveBeenCalledWith({ brand: 'visa', last4: '4242', expiry: '12/49' });
  expect(JSON.stringify(onSubmit.mock.calls[0][0])).not.toContain('4242424242424242');
});

it('requires a four-digit code for Amex', () => {
  const onSubmit = vi.fn();
  render(<CardForm onSubmit={onSubmit} />);
  fill('3782 822463 10005', '12/49', '123');
  fireEvent.click(screen.getByRole('button', { name: 'Use this card' }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText('The security code has 4 digits')).toBeTruthy();
});
