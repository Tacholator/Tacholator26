/**
 * Stripe UK card processing fee calculation.
 *
 * Verified UK rates (Sep 2025):
 *   UK domestic:     1.5% + £0.20
 *   EEA cards:       2.4% + £0.20   (1.5% + 0.9% intra-EEA surcharge)
 *   International:   3.4% + £0.20   (1.5% + 1.9% non-EEA surcharge)
 *
 * Card country is only known AFTER payment. Pre-payment we default to the
 * UK domestic rate; payment_intent.succeeded reconciles against the actual
 * card country and records any difference as an instructor-side adjustment.
 */

export const STRIPE_FEE_TIERS = {
  GB: { percent: 0.015, fixed: 0.20 },
  EEA: { percent: 0.024, fixed: 0.20 },
  INTERNATIONAL: { percent: 0.034, fixed: 0.20 },
};

// EEA country codes (ISO 3166-1 alpha-2)
const EEA_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE', 'IS', 'LI', 'NO',
]);

export function getFeeTier(cardCountry) {
  if (!cardCountry) return STRIPE_FEE_TIERS.GB;
  if (cardCountry === 'GB') return STRIPE_FEE_TIERS.GB;
  if (EEA_COUNTRIES.has(cardCountry.toUpperCase())) return STRIPE_FEE_TIERS.EEA;
  return STRIPE_FEE_TIERS.INTERNATIONAL;
}

export function computeStripeFee(amountGbp, cardCountry) {
  const tier = getFeeTier(cardCountry);
  const fee = amountGbp * tier.percent + tier.fixed;
  return Math.round(fee * 100) / 100; // nearest penny
}

/** Pre-payment estimate using the UK domestic rate (card country unknown). */
export function computeDefaultStripeFee(amountGbp) {
  return computeStripeFee(amountGbp, 'GB');
}