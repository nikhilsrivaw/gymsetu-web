// payu-callback — receives PayU's POST response (surl + furl point here),
// verifies the reverse hash, updates the subscription/purchase row, and 302s
// the user's browser back to the SPA's success or failure page.
//
// PayU posts as application/x-www-form-urlencoded.
// This function MUST be deployed with "Verify JWT" turned OFF — PayU does
// not send a Supabase JWT. Authenticity is proven via the SHA-512 reverse hash.
//
// Required Supabase secrets:
//   PAYU_MERCHANT_KEY
//   PAYU_SALT
//   APP_URL                    e.g. https://gymsetu.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// ── PayU helpers (inlined so the file is self-contained for dashboard deploy) ──
async function sha512(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function buildResponseHash(args: {
  key: string; txnid: string; amount: string; productinfo: string;
  firstname: string; email: string; status: string; salt: string;
  additionalCharges?: string;
  udf1?: string; udf2?: string; udf3?: string; udf4?: string; udf5?: string;
}): Promise<string> {
  const u = (v?: string) => (v ?? '').trim();
  const core = [
    args.salt, args.status,
    '', '', '', '', '',                  // udf10..udf6 placeholders (reverse)
    u(args.udf5), u(args.udf4), u(args.udf3), u(args.udf2), u(args.udf1),
    args.email, args.firstname, args.productinfo, args.amount, args.txnid, args.key,
  ].join('|');
  const seq = args.additionalCharges
    ? `${args.additionalCharges}|${core}`
    : core;
  return sha512(seq);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── Request handler ──
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const merchantKey = Deno.env.get('PAYU_MERCHANT_KEY');
  const salt        = Deno.env.get('PAYU_SALT');
  const appUrl      = Deno.env.get('APP_URL');
  if (!merchantKey || !salt || !appUrl) {
    return new Response('Server misconfigured', { status: 500 });
  }

  // 1. Parse the form POST
  const form = await req.formData();
  const get  = (k: string) => (form.get(k) ?? '').toString();

  const txnid             = get('txnid');
  const status            = get('status');
  const mihpayid          = get('mihpayid');
  const amount            = get('amount');
  const productinfo       = get('productinfo');
  const firstname         = get('firstname');
  const email             = get('email');
  const key               = get('key');
  const sentHash          = get('hash');
  const additionalCharges = get('additionalCharges');
  const error             = get('error');
  const errorMessage      = get('error_Message');

  // 2. Recompute reverse hash and verify
  const expected = await buildResponseHash({
    key, txnid, amount, productinfo, firstname, email, status, salt,
    additionalCharges: additionalCharges || undefined,
    udf1: get('udf1'), udf2: get('udf2'), udf3: get('udf3'),
    udf4: get('udf4'), udf5: get('udf5'),
  });

  const valid = constantTimeEqual(expected, sentHash);

  // 3. Use service role to bypass RLS for the update
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const succeeded = valid && status === 'success';

  // 4. Find the subscription / purchase row by txnid
  const [subRes, purRes] = await Promise.all([
    supabase.from('subscriptions').select('id, gym_id, owner_id, plan, billing_cycle')
      .eq('payu_txnid', txnid).maybeSingle(),
    supabase.from('purchases').select('id, owner_id, gym_id')
      .eq('payu_txnid', txnid).maybeSingle(),
  ]);

  if (subRes.data) {
    await supabase.from('subscriptions').update({
      payu_payment_id: mihpayid || null,
      payment_status:  succeeded ? 'success' : 'failed',
      status:          succeeded
        ? (subRes.data.plan === 'pro' ? 'trial' : 'active')
        : 'pending_payment',
    }).eq('id', subRes.data.id);

    if (succeeded) {
      await supabase.from('purchases').insert({
        owner_id:        subRes.data.owner_id,
        gym_id:          subRes.data.gym_id,
        type:            'plan',
        plan:            subRes.data.plan,
        billing_cycle:   subRes.data.billing_cycle,
        amount:          Math.round(Number(amount)),
        payu_txnid:      txnid,
        payu_payment_id: mihpayid || null,
        payu_status:     status,
        status:          'paid',
      });
    }
  } else if (purRes.data) {
    await supabase.from('purchases').update({
      payu_payment_id: mihpayid || null,
      payu_status:     status,
      status:          succeeded ? 'paid' : 'failed',
    }).eq('id', purRes.data.id);
  }

  // 5. Redirect browser back to SPA
  const target = new URL(succeeded ? '/payment/success' : '/payment/failure', appUrl);
  target.searchParams.set('txnid', txnid);
  if (!valid) target.searchParams.set('reason', 'hash_mismatch');
  else if (status !== 'success') {
    target.searchParams.set('reason', error || status || 'unknown');
    if (errorMessage) target.searchParams.set('msg', errorMessage);
  }

  return new Response(null, { status: 302, headers: { Location: target.toString() } });
});
