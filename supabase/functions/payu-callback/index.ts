// payu-callback — receives PayU's POST response (surl + furl point here),
// verifies the reverse hash, applies the side-effect for the matching
// subscription/purchase row, and 302s the user back to the SPA.
//
// PayU posts as application/x-www-form-urlencoded.
// MUST be deployed with "Verify JWT" turned OFF — PayU does not send a JWT.
// Authenticity is proven via SHA-512 reverse hash.
//
// Required Supabase secrets:
//   PAYU_MERCHANT_KEY
//   PAYU_SALT
//   APP_URL                    e.g. https://gymsetu.it.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// ── PayU helpers (inlined for dashboard deploy) ──
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
    '', '', '', '', '',
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

// Days per billing cycle — kept in sync with src/lib/constants.ts
const CYCLE_DAYS: Record<string, number> = {
  monthly: 30, quarterly: 90, half_yearly: 180, yearly: 365,
};

// Tokens per plan — kept in sync with src/lib/constants.ts
const PLAN_TOKENS: Record<string, number> = {
  basic: 0, pro: 500, pro_plus: 1000, pro_max: 2000,
};

// ── Request handler ──
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const merchantKey = Deno.env.get('PAYU_MERCHANT_KEY');
  const salt        = Deno.env.get('PAYU_SALT');
  const appUrl      = Deno.env.get('APP_URL');
  if (!merchantKey || !salt || !appUrl) {
    return new Response('Server misconfigured', { status: 500 });
  }

  // 1. Parse PayU's form POST
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

  // 2. Verify reverse hash. .trim() defends against any whitespace that
  //    may have crept into the secret value when set in the dashboard.
  const expected = await buildResponseHash({
    key, txnid, amount, productinfo, firstname, email, status,
    salt: salt.trim(),
    additionalCharges: additionalCharges || undefined,
    udf1: get('udf1'), udf2: get('udf2'), udf3: get('udf3'),
    udf4: get('udf4'), udf5: get('udf5'),
  });
  const valid     = constantTimeEqual(expected, sentHash);
  const succeeded = valid && status === 'success';

  // 3. Service-role client (bypasses RLS for server-side updates)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 4. Find the row this txnid belongs to
  const [subRes, purRes] = await Promise.all([
    supabase.from('subscriptions')
      .select('id, gym_id, owner_id, plan, billing_cycle')
      .eq('payu_txnid', txnid).maybeSingle(),
    supabase.from('purchases')
      .select('id, owner_id, gym_id, type, plan, billing_cycle, branch_slots, token_amount, amount')
      .eq('payu_txnid', txnid).maybeSingle(),
  ]);

  // ── Path A: txnid is on a subscriptions row (the initial signup flow) ──
  if (subRes.data) {
    const sub = subRes.data;
    await supabase.from('subscriptions').update({
      payu_payment_id: mihpayid || null,
      payment_status:  succeeded ? 'success' : 'failed',
      status:          succeeded
        ? (sub.plan === 'pro' ? 'trial' : 'active')
        : 'pending_payment',
    }).eq('id', sub.id);

    if (succeeded) {
      await supabase.from('purchases').insert({
        owner_id:        sub.owner_id,
        gym_id:          sub.gym_id,
        type:            'plan',
        plan:            sub.plan,
        billing_cycle:   sub.billing_cycle,
        amount:          Math.round(Number(amount)),
        payu_txnid:      txnid,
        payu_payment_id: mihpayid || null,
        payu_status:     status,
        status:          'paid',
      });

      // Seed tokens for paid plans on first payment
      const tokens = PLAN_TOKENS[sub.plan] ?? 0;
      if (tokens > 0) {
        const monthYear = new Date().toISOString().slice(0, 7);
        await supabase.from('subscription_tokens').upsert({
          gym_id:       sub.gym_id,
          month_year:   monthYear,
          tokens_total: tokens,
          tokens_used:  0,
        }, { onConflict: 'gym_id,month_year' });
      }
    }
  }
  // ── Path B: txnid is on a purchases row (in-app purchases: token/branch/plan-upgrade) ──
  else if (purRes.data) {
    const pur = purRes.data;
    await supabase.from('purchases').update({
      payu_payment_id: mihpayid || null,
      payu_status:     status,
      status:          succeeded ? 'paid' : 'failed',
    }).eq('id', pur.id);

    if (succeeded) {
      const monthYear = new Date().toISOString().slice(0, 7);

      if (pur.type === 'token_pack' && pur.token_amount) {
        // Add tokens to current month's pool
        const { data: existing } = await supabase
          .from('subscription_tokens')
          .select('tokens_total, tokens_used')
          .eq('gym_id', pur.gym_id).eq('month_year', monthYear).maybeSingle();

        await supabase.from('subscription_tokens').upsert({
          gym_id:       pur.gym_id,
          month_year:   monthYear,
          tokens_total: (existing?.tokens_total ?? 0) + pur.token_amount,
          tokens_used:  existing?.tokens_used ?? 0,
        }, { onConflict: 'gym_id,month_year' });
      }

      if (pur.type === 'branch_pack' && pur.branch_slots) {
        // Increment subscription.branch_slots
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id, branch_slots')
          .eq('gym_id', pur.gym_id).maybeSingle();
        if (sub) {
          await supabase.from('subscriptions').update({
            branch_slots: (sub.branch_slots ?? 0) + pur.branch_slots,
          }).eq('id', sub.id);
        }
      }

      if (pur.type === 'plan' && pur.plan) {
        // Upgrade existing subscription to the new plan / cycle
        const days      = CYCLE_DAYS[pur.billing_cycle ?? 'monthly'] ?? 30;
        const now       = new Date();
        const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('gym_id', pur.gym_id).maybeSingle();
        if (sub) {
          await supabase.from('subscriptions').update({
            plan:                 pur.plan,
            tier:                 pur.plan,
            billing_cycle:        pur.billing_cycle,
            status:               'active',
            payment_status:       'success',
            payu_payment_id:      mihpayid || null,
            current_period_start: now.toISOString(),
            current_period_end:   periodEnd.toISOString(),
          }).eq('id', sub.id);

          // Seed/refresh tokens for the new plan
          const tokens = PLAN_TOKENS[pur.plan] ?? 0;
          if (tokens > 0) {
            await supabase.from('subscription_tokens').upsert({
              gym_id:       pur.gym_id,
              month_year:   monthYear,
              tokens_total: tokens,
              tokens_used:  0,
            }, { onConflict: 'gym_id,month_year' });
          }
        }
      }
    }
  }

  // 5. Redirect browser back to SPA
  const target = new URL(succeeded ? '/payment/success' : '/payment/failure', appUrl);
  target.searchParams.set('txnid', txnid);
  if (purRes.data?.type) target.searchParams.set('type', purRes.data.type);
  if (!valid) target.searchParams.set('reason', 'hash_mismatch');
  else if (status !== 'success') {
    target.searchParams.set('reason', error || status || 'unknown');
    if (errorMessage) target.searchParams.set('msg', errorMessage);
  }

  return new Response(null, { status: 302, headers: { Location: target.toString() } });
});
