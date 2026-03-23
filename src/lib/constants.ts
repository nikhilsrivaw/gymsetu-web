// App store links — update IDs before going live
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gymsetu.app';
export const APP_STORE_URL = 'https://apps.apple.com/app/gymsetu/id000000000';

export const SUPPORT_EMAIL = 'support@gymsetu.com';

// Razorpay amounts in paise (₹ × 100)
export const RAZORPAY_BASIC_PAISE = 99900;    // ₹999
export const RAZORPAY_PRO_PAISE   = 169900;   // ₹1,699

export const TOKEN_PACKS = [
  { name: 'STARTER',  tokens: 100, price: 79,  paise: 7900  },
  { name: 'STANDARD', tokens: 300, price: 179, paise: 17900 },
  { name: 'BULK',     tokens: 700, price: 349, paise: 34900 },
] as const;

export const MIN_PASSWORD_LENGTH = 8;
