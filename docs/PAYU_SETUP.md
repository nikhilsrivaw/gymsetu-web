# PayU Setup — GymSetu

End-to-end checklist for getting PayU Hosted Checkout running on the GymSetu signup flow.

---

## 1. Run the SQL migration

Open Supabase Dashboard → **SQL Editor** → paste and run `sql/payu-migration.sql`.

It adds `payu_txnid`, `payu_payment_id`, `payment_status` to `subscriptions`, and matching columns to `purchases`. Safe to re-run.

---

## 2. Set Supabase Edge Function secrets

The PayU SALT must **never** be exposed to the browser. Set these as edge function secrets:

```bash
supabase login
supabase link --project-ref gijqmqnxtwiznxdwjhle

# PayU dashboard → Settings → My Account → Merchant Key & Salt
supabase secrets set PAYU_MERCHANT_KEY="YOUR_TEST_MERCHANT_KEY"
supabase secrets set PAYU_SALT="YOUR_TEST_SALT"
supabase secrets set PAYU_MODE="test"

# The origin the SPA is served from — used as the 302 target after callback
supabase secrets set APP_URL="http://localhost:5173"   # dev
# supabase secrets set APP_URL="https://gymsetu.com"   # prod
```

Confirm with:

```bash
supabase secrets list
```

You should see `PAYU_MERCHANT_KEY`, `PAYU_SALT`, `PAYU_MODE`, `APP_URL`, plus the auto-managed `SUPABASE_*` vars.

---

## 3. Deploy the edge functions

```bash
supabase functions deploy payu-initiate
supabase functions deploy payu-callback --no-verify-jwt
```

`--no-verify-jwt` on the callback is **mandatory** — PayU does not send a Supabase JWT when posting back. The function still verifies authenticity via the SHA-512 reverse hash, so it's safe.

---

## 4. Configure surl / furl in PayU (no action needed in dashboard)

PayU's surl / furl are sent **per transaction** in the form POST — we always set them to:

```
https://gijqmqnxtwiznxdwjhle.supabase.co/functions/v1/payu-callback
```

You don't need to whitelist this in the PayU dashboard for test mode. For live mode, PayU may ask you to whitelist redirect URLs — add the same URL there.

---

## 5. Local development flow

The browser is redirected to `secure.payu.in` (or `test.payu.in`), so PayU needs a publicly reachable URL for the callback. Locally that means either:

- **Recommended:** the deployed Supabase function (it's already public — no tunnel needed). Just run `supabase functions deploy` once and the local dev server uses the deployed callback.
- **Alternative:** run `supabase functions serve payu-callback --no-verify-jwt --env-file ./supabase/.env.local` + ngrok the local port + override `payu_url` building. Not worth the setup unless you're iterating on the function itself.

For day-to-day frontend dev:

```bash
npm run dev
```

When you click "Pay" on a paid plan, the flow:

1. SPA → calls `payu-initiate` (deployed) → gets `{payu_url, fields}`
2. SPA → submits hidden form to `test.payu.in/_payment`
3. User pays on PayU using test cards (see below)
4. PayU → POSTs to `payu-callback` (deployed)
5. Callback → updates DB → 302 redirects to `${APP_URL}/payment/success?txnid=...`

---

## 6. PayU test cards

| Type | Number | CVV | Expiry | OTP |
|------|--------|-----|--------|-----|
| Visa | `5123 4567 8901 2346` | `123` | any future | `123456` |
| MasterCard | `4012 0010 3714 1112` | `123` | any future | `123456` |

Or use any UPI ID ending in `@payu` to simulate UPI success.

Reference: https://docs.payu.in/docs/test-cards

---

## 7. Going live

1. Replace test creds:
   ```bash
   supabase secrets set PAYU_MERCHANT_KEY="YOUR_LIVE_KEY"
   supabase secrets set PAYU_SALT="YOUR_LIVE_SALT"
   supabase secrets set PAYU_MODE="live"
   supabase secrets set APP_URL="https://gymsetu.com"
   ```
2. Re-deploy the functions (picks up the new secrets):
   ```bash
   supabase functions deploy payu-initiate
   supabase functions deploy payu-callback --no-verify-jwt
   ```
3. Smoke-test with a real ₹1 transaction.

---

## 8. What's still on Razorpay

Only `SignupSetup.tsx` is migrated. The following pages still use the Razorpay modal flow and need migration before going live:

- `src/pages/Pricing.tsx` — pricing page CTAs
- `src/pages/Dashboard.tsx` — token packs + plan upgrade
- `src/pages/Tokens.tsx` — token pack purchase
- `src/pages/Branches.tsx` — branch slot purchase
- `src/pages/Onboarding.tsx` — alternate onboarding path

Pattern for migrating each: replace the `new window.Razorpay({...})` call with `await initiatePayU({ purchase_id, amount, productinfo, firstname, email, phone })`. Create the purchase row first as `status='pending'`, then let `payu-callback` flip it to `'paid'`.

---

## 9. Troubleshooting

**"PayU credentials not configured" (500 from payu-initiate)** — Secrets aren't set. Run `supabase secrets list` and confirm `PAYU_MERCHANT_KEY` + `PAYU_SALT` are present.

**Stuck on "VERIFYING PAYMENT..." after success** — The callback likely hasn't run yet. Check `supabase functions logs payu-callback` for errors. If hash validation is failing, double-check the `PAYU_SALT` value — it must match exactly (no leading/trailing whitespace).

**302 lands on wrong domain** — `APP_URL` is wrong. Update it: `supabase secrets set APP_URL="https://your-domain.com"` then re-deploy.

**Hash mismatch in logs** — PayU's `additionalCharges` field is sometimes injected; the function handles that. If still failing, log the exact pipe-joined string from `_shared/payu.ts:buildResponseHash` and compare with PayU's expected format in their docs.
