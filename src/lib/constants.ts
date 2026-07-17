// App store links — update IDs before going live
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gymsetu.app';
export const APP_STORE_URL = 'https://apps.apple.com/app/gymsetu/id000000000';

export const SUPPORT_EMAIL = 'support@gymsetu.com';

// ── Legal identity, used by /privacy, /terms and /refund ────────────────────
// ⚠️ MUST BE FILLED IN BEFORE THOSE PAGES ARE PUBLISHED. They are placeholders,
// not defaults — they render verbatim on public pages, and PayU/Razorpay
// onboarding checks that a real entity and address are stated. Claude did not
// invent these because a wrong legal entity on a published policy is worse than
// an obviously missing one.
export const LEGAL_ENTITY = '[TODO: registered entity name, e.g. "Acme Fitness Technologies Pvt Ltd"]';
export const LEGAL_ADDRESS = '[TODO: registered address, incl. city, state and PIN]';
export const LEGAL_JURISDICTION = '[TODO: city for jurisdiction, e.g. "Lucknow, Uttar Pradesh"]';

// Bump when the policies change materially; it's the date shown to users.
export const LEGAL_UPDATED = '17 July 2026';

// Plan type
export type PlanId = 'basic' | 'pro' | 'pro_plus' | 'pro_max';

// Pricing grid (INR, per billing cycle)
export const PRICING: Record<PlanId, Record<string, number>> = {
  basic: {
    monthly:     999,
    quarterly:   2757,
    half_yearly: 5275,
    yearly:      10190,
  },
  pro: {
    monthly:     1699,
    quarterly:   4689,
    half_yearly: 8977,
    yearly:      17330,
  },
  pro_plus: {
    monthly:     2199,
    quarterly:   6069,
    half_yearly: 11619,
    yearly:      22430,
  },
  pro_max: {
    monthly:     2999,
    quarterly:   8277,
    half_yearly: 15869,
    yearly:      30590,
  },
} as const;

// Savings per cycle vs paying monthly (INR)
export const SAVINGS: Record<PlanId, Record<string, number>> = {
  basic: {
    monthly:     0,
    quarterly:   240,
    half_yearly: 719,
    yearly:      1798,
  },
  pro: {
    monthly:     0,
    quarterly:   408,
    half_yearly: 1217,
    yearly:      3058,
  },
  pro_plus: {
    monthly:     0,
    quarterly:   528,
    half_yearly: 1575,
    yearly:      3958,
  },
  pro_max: {
    monthly:     0,
    quarterly:   720,
    half_yearly: 2125,
    yearly:      5398,
  },
} as const;

// WhatsApp tokens per plan per month (0 = no WhatsApp)
export const PLAN_TOKENS: Record<PlanId, number> = {
  basic:    0,
  pro:      500,
  pro_plus: 1000,
  pro_max:  2000,
};

// Duration in days per billing cycle
export const CYCLE_DAYS = {
  monthly:     30,
  quarterly:   90,
  half_yearly: 180,
  yearly:      365,
} as const;

export type BillingCycle = keyof typeof CYCLE_DAYS;

// Paise helper (₹ × 100) — handy for any code still working in paise.
export const toPaise = (amount: number) => amount * 100;

// WhatsApp token top-up packs
export const TOKEN_PACKS = [
  { name: 'STARTER',  tokens: 100,  price: 149, paise: 14900 },
  { name: 'STANDARD', tokens: 500,  price: 499, paise: 49900 },
  { name: 'BULK',     tokens: 1000, price: 799, paise: 79900 },
] as const;

// Branch add-on packs (flat monthly add-on to subscription)
export const BRANCH_PACKS = [
  { slots: 1, label: '1 Branch',  price: 799,  paise: 79900  },
  { slots: 2, label: '2 Branches', price: 1499, paise: 149900 },
  { slots: 3, label: '3 Branches', price: 2099, paise: 209900 },
] as const;

export const MIN_PASSWORD_LENGTH = 8;
