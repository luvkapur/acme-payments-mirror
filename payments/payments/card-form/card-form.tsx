import { useState } from 'react';
import type { FormEvent } from 'react';
import { TextInput } from '@acme-modular/design.ui.text-input';
import { Button } from '@acme-modular/design.ui.button';
import { Badge } from '@acme-modular/design.ui.badge';
import {
  brandName,
  cvcLengthFor,
  detectBrand,
  normalizeCardNumber,
  validateCard,
} from '@acme-modular/payments.payments.card-validation';
import type { CardBrand, CardErrors } from '@acme-modular/payments.payments.card-validation';
import styles from './card-form.module.css';

/** What leaves the form: enough to show and charge a saved card, never the full number. */
export type CardDetails = {
  brand: CardBrand;
  /** the last four digits, for "Visa ending in 4242". */
  last4: string;
  /** `MM/YY`, as typed. */
  expiry: string;
};

export type CardFormProps = {
  /** called with the card summary once every field is valid. */
  onSubmit(card: CardDetails): void;
  /** the submit button label. defaults to "Use this card". */
  submitLabel?: string;
};

/**
 * Collects a card number, expiry and CVC and validates them with
 * `card-validation` on submit. Only the brand, last four digits and expiry are
 * passed on: the full number and the CVC never leave this component.
 */
export function CardForm({ onSubmit, submitLabel = 'Use this card' }: CardFormProps) {
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errors, setErrors] = useState<CardErrors>({});
  const brand = detectBrand(number);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateCard({ number, expiry, cvc });
    setErrors(result.errors);
    if (!result.valid) return;
    onSubmit({ brand, last4: normalizeCardNumber(number).slice(-4), expiry: expiry.trim() });
  }

  return (
    <form className={styles.cardForm} onSubmit={handleSubmit} noValidate aria-label="Card details">
      <div className={styles.numberRow}>
        <TextInput
          label="Card number"
          name="cc-number"
          autoComplete="cc-number"
          inputMode="numeric"
          placeholder="4242 4242 4242 4242"
          value={number}
          onChange={setNumber}
          error={errors.number}
          required
        />
        {brand !== 'unknown' && (
          <span className={styles.brand}>
            <Badge tone="info">{brandName(brand)}</Badge>
          </span>
        )}
      </div>
      <div className={styles.pair}>
        <TextInput
          label="Expiry (MM/YY)"
          name="cc-exp"
          autoComplete="cc-exp"
          inputMode="numeric"
          placeholder="MM/YY"
          value={expiry}
          onChange={setExpiry}
          error={errors.expiry}
          required
        />
        <TextInput
          label="Security code"
          name="cc-csc"
          autoComplete="cc-csc"
          inputMode="numeric"
          placeholder={'•'.repeat(cvcLengthFor(brand))}
          value={cvc}
          onChange={setCvc}
          error={errors.cvc}
          required
        />
      </div>
      <Button type="submit" fullWidth>
        {submitLabel}
      </Button>
    </form>
  );
}
