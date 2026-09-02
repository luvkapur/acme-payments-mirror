import { calculateFee } from './fee-calculator.js';

it('charges 2.9% + 30c by default', () => {
  expect(calculateFee(10000)).toBe(320);
});

it('charges nothing for a non-positive amount', () => {
  expect(calculateFee(0)).toBe(0);
});
