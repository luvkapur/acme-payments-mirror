import { useState } from 'react';
import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { CardForm } from './card-form.js';
import type { CardDetails } from './card-form.js';

export const BasicCardForm = () => {
  const [card, setCard] = useState<CardDetails>();
  return (
    <AcmeTheme>
      <CardForm onSubmit={setCard} />
      {card && (
        <p>
          Saved {card.brand} ending in {card.last4}, expires {card.expiry}
        </p>
      )}
    </AcmeTheme>
  );
};

export const PayNowCardForm = () => (
  <AcmeTheme>
    <p>Try 4242 4242 4242 4242 or the Amex test number 3782 822463 10005.</p>
    <CardForm submitLabel="Pay now" onSubmit={(card) => alert(`Paying with ${card.brand} ${card.last4}`)} />
  </AcmeTheme>
);
