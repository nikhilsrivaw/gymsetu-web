// App store links — update IDs before going live
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gymsetu.app';
export const APP_STORE_URL = 'https://apps.apple.com/app/gymsetu/id000000000';

export const SUPPORT_EMAIL = 'gymsetu@aqirox.com';

// ── Contact channels ────────────────────────────────────────────────────────
// One source of truth. Previously App.tsx and Contact.tsx each did
// `import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210'` — and that fallback
// is a PLACEHOLDER number, not ours. If the env var is ever missing from the
// Vercel project (it isn't in git; .env is local only), every "chat now" button
// would have quietly pointed a real customer at a stranger's WhatsApp. The
// fallback is now the real number, so a missing env var degrades to correct
// rather than to wrong.
export const WHATSAPP_NUMBER: string =
  import.meta.env.VITE_WHATSAPP_NUMBER || '917905537549';

// Public GymSetu community group. Invite links are permanent until revoked;
// the ?s=&p=&ilr= params are just share-sheet tracking and are stripped.
export const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/GyAvM0pNI8IDKaUjOEvs4Z';

// ── Legal identity, used by /privacy, /terms and /refund ────────────────────
// GymSetu is a product of Aqirox Technology Private Limited (aqirox.com).
export const LEGAL_ENTITY = 'Aqirox Technology Private Limited';
export const PARENT_NAME = 'Aqirox Technology';
export const PARENT_URL = 'https://aqirox.com';

// Registered office. Keep this matching the Certificate of Incorporation /
// MCA record — it's the address where legal notice is served, and PayU checks
// the entity + address on the site against the merchant account.
export const LEGAL_ADDRESS =
  'Shivje Nagar, Muhisudharpur, Shivpuri New Colony, Gorakhpur Sadar, Gorakhpur, Uttar Pradesh 273016, India';

// Follows the registered office, which is the normal default.
export const LEGAL_JURISDICTION = 'Gorakhpur, Uttar Pradesh';

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
