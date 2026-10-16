export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

export type CardInput = {
  /** the card number as typed. spaces are ignored. */
  number: string;
  /** expiry as `MM/YY` (or `MMYY`). */
  expiry: string;
  /** the security code on the back (front for Amex). */
  cvc: string;
};

export type CardErrors = { number?: string; expiry?: string; cvc?: string };

export type CardValidation = {
  valid: boolean;
  /** one message per invalid field, ready to show under the input. */
  errors: CardErrors;
};

// order matters: the Amex and Mastercard prefixes are more specific than the catch-alls below them.
const brandPrefixes: Array<[Exclude<CardBrand, 'unknown'>, RegExp]> = [
  ['amex', /^3[47]/],
  ['visa', /^4/],
  ['mastercard', /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/],
  ['discover', /^(6011|65|64[4-9])/],
];

const validLengths: Record<CardBrand, number[]> = {
  amex: [15],
  visa: [13, 16, 19],
  mastercard: [16],
  discover: [16, 17, 18, 19],
  unknown: [12, 13, 14, 15, 16, 17, 18, 19],
};

/**
 * The card number without the spaces and dashes people type to group digits.
 *
 * @example normalizeCardNumber('4242 4242 4242 4242') // '4242424242424242'
 */
export function normalizeCardNumber(number: string): string {
  return number.replace(/[\s-]/g, '');
}

/**
 * The Luhn (mod 10) checksum every card number carries. It catches typos such
 * as a single wrong digit or two swapped neighbours before we call the
 * payment provider.
 */
export function luhnCheck(number: string): boolean {
  const digits = normalizeCardNumber(number);
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[digits.length - 1 - index]);
    // every second digit from the right is doubled; a two-digit result counts as the sum of its digits.
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** The card network, read from the number's leading digits. */
export function detectBrand(number: string): CardBrand {
  const digits = normalizeCardNumber(number);
  return brandPrefixes.find(([, prefix]) => prefix.test(digits))?.[0] ?? 'unknown';
}

const brandNames: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  unknown: 'Card',
};

/**
 * The display name of a card brand, e.g. for "Visa ending in 4242".
 *
 * @example brandName('amex') // 'American Express'
 */
export function brandName(brand: CardBrand): string {
  return brandNames[brand];
}

/** How many digits the security code has: 4 for Amex, 3 for every other brand. */
export function cvcLengthFor(brand: CardBrand): number {
  return brand === 'amex' ? 4 : 3;
}

function parseExpiry(mmYY: string): { month: number; year: number } | undefined {
  const match = /^(?:(\d{1,2})\s*\/\s*|(\d{2}))(\d{2})$/.exec(mmYY.trim());
  if (!match) return undefined;
  const month = Number(match[1] ?? match[2]);
  if (month < 1 || month > 12) return undefined;
  return { month, year: 2000 + Number(match[3]) };
}

/**
 * True when `mmYY` is a real month that has not ended yet. A card stays valid
 * through the last day of its expiry month.
 *
 * @param now the current date. inject it in tests so they don't expire.
 */
export function validateExpiry(mmYY: string, now: Date = new Date()): boolean {
  const expiry = parseExpiry(mmYY);
  if (!expiry) return false;
  return expiry.year * 12 + expiry.month >= now.getFullYear() * 12 + now.getMonth() + 1;
}

/**
 * Validates a card before it leaves the form: the number (brand length and
 * Luhn), the expiry and a CVC of the right length for the brand.
 *
 * @example
 * const { valid, errors } = validateCard({ number: '4242 4242 4242 4242', expiry: '12/30', cvc: '123' });
 */
export function validateCard({ number, expiry, cvc }: CardInput, now: Date = new Date()): CardValidation {
  const errors: CardErrors = {};
  const digits = normalizeCardNumber(number);
  const brand = detectBrand(digits);

  if (!digits) errors.number = 'Enter your card number';
  else if (!/^\d+$/.test(digits) || !validLengths[brand].includes(digits.length) || !luhnCheck(digits)) {
    errors.number = 'This card number is not valid';
  }

  if (!expiry.trim()) errors.expiry = 'Enter the expiry date';
  else if (!parseExpiry(expiry)) errors.expiry = 'Enter the expiry as MM/YY';
  else if (!validateExpiry(expiry, now)) errors.expiry = 'This card has expired';

  const cvcLength = cvcLengthFor(brand);
  const code = cvc.trim();
  if (!code) errors.cvc = 'Enter the security code';
  else if (!new RegExp(`^\\d{${cvcLength}}$`).test(code)) errors.cvc = `The security code has ${cvcLength} digits`;

  return { valid: Object.keys(errors).length === 0, errors };
}
