import { useState } from 'react';
import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { PaymentMethodPicker } from './payment-method-picker.js';
import type { PaymentMethod } from './payment-method-picker.js';

function Interactive({ initial }: { initial: PaymentMethod }) {
  const [method, setMethod] = useState<PaymentMethod>(initial);
  return (
    <div style={{ maxWidth: 420 }}>
      <PaymentMethodPicker value={method} onChange={setMethod} />
      <p>Selected: {method}</p>
    </div>
  );
}

export const CardSelected = () => (
  <AcmeTheme>
    <Interactive initial="card" />
  </AcmeTheme>
);

export const InvoiceSelected = () => (
  <AcmeTheme>
    <Interactive initial="invoice" />
  </AcmeTheme>
);
