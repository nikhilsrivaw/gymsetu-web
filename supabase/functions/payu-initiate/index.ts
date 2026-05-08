// payu-initiate — generates a PayU transaction id + signed hash for the client
// to POST to PayU's hosted checkout. Runs server-side so PAYU_SALT never
// touches the browser.
//
// Required Supabase secrets:
//   PAYU_MERCHANT_KEY   — merchant key (sent to client OK; visible to PayU)
//   PAYU_SALT           — secret signing key (NEVER sent to client)
//   PAYU_MODE           — "test" | "live" (default "test")
//   APP_URL             — public origin of the SPA, e.g. https://gymsetu.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// ── PayU helpers (inlined so the file is self-contained for dashboard deploy) ──
const PAYU_TEST_URL = 'https://test.payu.in/_payment';
const PAYU_LIVE_URL = 'https://secure.payu.in/_payment';

function payuEndpoint(): string {
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

async function buildRequestHash(args: {
  key: string; txnid: string; amount: string; productinfo: string;
  firstname: string; email: string; salt: string;
  udf1?: string; udf2?: string; udf3?: string; udf4?: string; udf5?: string;
}): Promise<string> {
  const u = (v?: string) => (v ?? '').trim();
  const seq = [
    args.key, args.txnid, args.amount, args.productinfo, args.firstname, args.email,
    u(args.udf1), u(args.udf2), u(args.udf3), u(args.udf4), u(args.udf5),
    '', '', '', '', '',          // udf6..udf10 placeholders
    args.salt,
  ].join('|');
  return sha512(seq);
}

function generateTxnid(prefix = 'gs'): string {
  const ts = Date.now().toString(36);
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return `${prefix}_${ts}_${rand}`.slice(0, 25);
}

function formatAmount(rupees: number): string {
  return rupees.toFixed(2);
}

// ── Request handler ──
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface InitiateBody {
  subscription_id?: string;
  purchase_id?: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  udf1?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405);

  // 1. Auth
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'Invalid session' }, 401);
  const userId = userData.user.id;

  // 2. Validate body
  let body: InitiateBody;
  try { body = await req.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  const { amount, productinfo, firstname, email, phone, subscription_id, purchase_id, udf1 } = body;
  if (!amount || amount <= 0) return json({ error: 'amount must be > 0' }, 400);
  if (!productinfo) return json({ error: 'productinfo required' }, 400);
  if (!firstname)   return json({ error: 'firstname required' }, 400);
  if (!email)       return json({ error: 'email required' }, 400);
  if (!phone)       return json({ error: 'phone required' }, 400);
  if (!subscription_id && !purchase_id) {
    return json({ error: 'subscription_id or purchase_id required' }, 400);
  }

  // 3. PayU env
  const merchantKey = Deno.env.get('PAYU_MERCHANT_KEY');
  const salt        = Deno.env.get('PAYU_SALT');
  const appUrl      = Deno.env.get('APP_URL');
  if (!merchantKey || !salt) return json({ error: 'PayU credentials not configured' }, 500);
  if (!appUrl)               return json({ error: 'APP_URL not configured' }, 500);

  // 4. Verify the user owns the row being charged
  const adminClient = createClient(supabaseUrl, serviceKey);
  if (subscription_id) {
    const { data: sub } = await adminClient
      .from('subscriptions').select('id, owner_id').eq('id', subscription_id).maybeSingle();
    if (!sub || sub.owner_id !== userId) {
      return json({ error: 'Subscription not found or not owned by user' }, 403);
    }
  }
  if (purchase_id) {
    const { data: pur } = await adminClient
      .from('purchases').select('id, owner_id').eq('id', purchase_id).maybeSingle();
    if (!pur || pur.owner_id !== userId) {
      return json({ error: 'Purchase not found or not owned by user' }, 403);
    }
  }

  // 5. Generate txnid + hash
  const txnid = generateTxnid('gs');
  const amountStr = formatAmount(Number(amount));
  const hash = await buildRequestHash({
    key: merchantKey, txnid, amount: amountStr, productinfo, firstname, email, salt, udf1,
  });

  // 6. Persist txnid so the callback can find the row
  if (subscription_id) {
    const { error: updErr } = await adminClient
      .from('subscriptions')
      .update({ payu_txnid: txnid, payment_status: 'pending' })
      .eq('id', subscription_id);
    if (updErr) return json({ error: `Failed to attach txnid: ${updErr.message}` }, 500);
  }
  if (purchase_id) {
    const { error: updErr } = await adminClient
      .from('purchases')
      .update({ payu_txnid: txnid, status: 'pending' })
      .eq('id', purchase_id);
    if (updErr) return json({ error: `Failed to attach txnid: ${updErr.message}` }, 500);
  }

  // 7. Return form fields for the client to POST
  const callbackBase = `${supabaseUrl}/functions/v1/payu-callback`;
  return json({
    payu_url: payuEndpoint(),
    fields: {
      key:         merchantKey,
      txnid,
      amount:      amountStr,
      productinfo,
      firstname,
      email,
      phone,
      surl:        callbackBase,
      furl:        callbackBase,
      hash,
      udf1:        udf1 ?? '',
      service_provider: 'payu_paisa',
    },
  }, 200);
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
