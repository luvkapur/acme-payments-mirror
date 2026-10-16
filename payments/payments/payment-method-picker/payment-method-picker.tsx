import { useId } from 'react';
import classNames from 'classnames';
import styles from './payment-method-picker.module.css';

export type PaymentMethod = 'card' | 'paypal' | 'invoice';

const methods: Array<{ id: PaymentMethod; label: string; hint: string }> = [
  { id: 'card', label: 'Credit or debit card', hint: 'Visa, Mastercard, Amex and Discover' },
  { id: 'paypal', label: 'PayPal', hint: 'You confirm the payment with PayPal' },
  { id: 'invoice', label: 'Invoice', hint: 'Pay by bank transfer within 30 days' },
];

/**
 * A short display name for a payment method, e.g. on an order review.
 *
 * @example paymentMethodLabel('invoice') // 'Invoice'
 */
export function paymentMethodLabel(method: PaymentMethod): string {
  return methods.find((option) => option.id === method)?.label ?? method;
}

export type PaymentMethodPickerProps = {
  /** the selected method. */
  value: PaymentMethod;
  /** called with the method the customer picks. */
  onChange(method: PaymentMethod): void;
};

/**
 * Lets the customer choose how to pay: card, PayPal or invoice. A labelled
 * radio group, so the arrow keys move between methods.
 */
export function PaymentMethodPicker({ value, onChange }: PaymentMethodPickerProps) {
  // a unique group name keeps two pickers on one page from sharing a selection.
  const name = useId();
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>Payment method</legend>
      {methods.map((method) => (
        <label key={method.id} className={classNames(styles.option, value === method.id && styles.selected)}>
          <input
            type="radio"
            name={name}
            value={method.id}
            checked={value === method.id}
            onChange={() => onChange(method.id)}
            className={styles.radio}
          />
          <span className={styles.text}>
            <span className={styles.label}>{method.label}</span>
            <span className={styles.hint}>{method.hint}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
