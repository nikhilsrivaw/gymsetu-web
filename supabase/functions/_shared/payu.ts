// PayU hash utilities — shared between payu-initiate and payu-callback.
// Runs on Deno (Supabase Edge Functions).

export const PAYU_TEST_URL = 'https://test.payu.in/_payment';
export const PAYU_LIVE_URL = 'https://secure.payu.in/_payment';

export function payuEndpoint(): string {
  const mode = Deno.env.get('PAYU_MODE') ?? 'test';
  return mode === 'live' ? PAYU_LIVE_URL : PAYU_TEST_URL;
}

async function sha512(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Forward (request) hash:
 *   sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 * Five udf slots followed by five empty fields, then SALT.
 */
export async function buildRequestHash(args: {
  key: string;
  txnid: string;
  amount: string;          // string with up to 2 decimals, e.g. "999.00"
  productinfo: string;
  firstname: string;
  email: string;
  salt: string;
  udf1?: string; udf2?: string; udf3?: string; udf4?: string; udf5?: string;
}): Promise<string> {
  const { key, txnid, amount, productinfo, firstname, email, salt } = args;
  const u = (v?: string) => (v ?? '').trim();
  const seq = [
    key, txnid, amount, productinfo, firstname, email,
    u(args.udf1), u(args.udf2), u(args.udf3), u(args.udf4), u(args.udf5),
    '', '', '', '', '',         // udf6..udf10 placeholders
    salt,
  ].join('|');
  return sha512(seq);
}

/**
 * Reverse (response) hash:
 *   sha512(additionalCharges?|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * If `additionalCharges` is present in the response, prepend it followed by '|'.
 */
export async function buildResponseHash(args: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  status: string;
  salt: string;
  additionalCharges?: string;
  udf1?: string; udf2?: string; udf3?: string; udf4?: string; udf5?: string;
}): Promise<string> {
  const u = (v?: string) => (v ?? '').trim();
  const core = [
    args.salt, args.status,
    '', '', '', '', '',                 // udf10..udf6 placeholders (reverse)
    u(args.udf5), u(args.udf4), u(args.udf3), u(args.udf2), u(args.udf1),
    args.email, args.firstname, args.productinfo, args.amount, args.txnid, args.key,
  ].join('|');
  const seq = args.additionalCharges
    ? `${args.additionalCharges}|${core}`
    : core;
  return sha512(seq);
}

/** Generate a unique merchant transaction id (≤ 25 chars to be safe). */
export function generateTxnid(prefix = 'gs'): string {
  const ts = Date.now().toString(36);
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return `${prefix}_${ts}_${rand}`.slice(0, 25);
}

/** PayU expects amount as a numeric string with no trailing zeros stripped. */
export function formatAmount(rupees: number): string {
  return rupees.toFixed(2);
}
