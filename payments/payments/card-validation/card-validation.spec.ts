import { brandName, cvcLengthFor, detectBrand, luhnCheck, normalizeCardNumber, validateCard, validateExpiry } from './card-validation.js';

const visa = '4242 4242 4242 4242';
const amex = '3782 822463 10005';
// mid-October 2026: October 2026 cards are still valid, September 2026 cards are not.
const now = new Date(2026, 9, 16);

describe('luhnCheck', () => {
  it('accepts valid numbers and ignores spaces', () => {
    expect(luhnCheck(visa)).toBe(true);
    expect(luhnCheck(amex)).toBe(true);
    expect(luhnCheck('5555555555554444')).toBe(true);
  });

  it('rejects a bad checksum and non-digits', () => {
    expect(luhnCheck('4242 4242 4242 4241')).toBe(false);
    expect(luhnCheck('4242 4242 4242 424a')).toBe(false);
    expect(luhnCheck('')).toBe(false);
  });
});

describe('detectBrand', () => {
  it('reads the network from the leading digits', () => {
    expect(detectBrand(visa)).toBe('visa');
    expect(detectBrand(amex)).toBe('amex');
    expect(detectBrand('5555 5555 5555 4444')).toBe('mastercard');
    expect(detectBrand('2221 0000 0000 0009')).toBe('mastercard');
    expect(detectBrand('6011 1111 1111 1117')).toBe('discover');
    expect(detectBrand('9999 0000 0000 0000')).toBe('unknown');
  });

  it('wants 4 CVC digits for Amex and 3 otherwise', () => {
    expect(cvcLengthFor('amex')).toBe(4);
    expect(cvcLengthFor('visa')).toBe(3);
    expect(brandName('amex')).toBe('American Express');
  });
});

describe('validateExpiry', () => {
  it('is valid through the end of the expiry month', () => {
    expect(validateExpiry('10/26', now)).toBe(true);
    expect(validateExpiry('1026', now)).toBe(true);
    expect(validateExpiry('01/30', now)).toBe(true);
  });

  it('rejects expired and malformed dates', () => {
    expect(validateExpiry('09/26', now)).toBe(false);
    expect(validateExpiry('12/25', now)).toBe(false);
    expect(validateExpiry('13/30', now)).toBe(false);
    expect(validateExpiry('soon', now)).toBe(false);
  });
});

describe('validateCard', () => {
  it('accepts a valid Visa and a valid Amex', () => {
    expect(validateCard({ number: visa, expiry: '12/28', cvc: '123' }, now)).toEqual({ valid: true, errors: {} });
    expect(validateCard({ number: amex, expiry: '12/28', cvc: '1234' }, now)).toEqual({ valid: true, errors: {} });
  });

  it('reports one message per invalid field', () => {
    const result = validateCard({ number: '4242 4242 4242 4241', expiry: '09/26', cvc: '12' }, now);
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual(['cvc', 'expiry', 'number']);
    expect(result.errors.expiry).toMatch(/expired/);
  });

  it('checks the CVC length against the brand', () => {
    expect(validateCard({ number: amex, expiry: '12/28', cvc: '123' }, now).errors.cvc).toMatch(/4 digits/);
    expect(validateCard({ number: visa, expiry: '12/28', cvc: '1234' }, now).errors.cvc).toMatch(/3 digits/);
  });

  it('asks for empty fields and rejects a wrong length', () => {
    const empty = validateCard({ number: '', expiry: '', cvc: '' }, now);
    expect(empty.errors).toEqual({
      number: 'Enter your card number',
      expiry: 'Enter the expiry date',
      cvc: 'Enter the security code',
    });
    // passes Luhn but a Visa can't have 15 digits
    expect(validateCard({ number: '424242424242424', expiry: '12/28', cvc: '123' }, now).errors.number).toBeTruthy();
    expect(normalizeCardNumber('4242-4242 4242')).toBe('424242424242');
  });
});
