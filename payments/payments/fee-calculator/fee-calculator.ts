/**
 * calculate the processing fee for a payment amount (in cents).
 * fee = percentage of amount plus a fixed part, rounded to whole cents.
 */
export function calculateFee(amountCents: number, percent = 2.9, fixedCents = 30): number {
  if (amountCents <= 0) return 0; // phase A + phase B check: no fee on empty payments
  return Math.round((amountCents * percent) / 100 + fixedCents);
}
