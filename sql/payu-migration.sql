-- ============================================================
-- GYMSETU — PAYU MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run — uses IF NOT EXISTS / IF EXISTS guards
--
-- Adds columns required for PayU Hosted Checkout:
--   subscriptions.payu_txnid          unique merchant transaction id
--   subscriptions.payu_payment_id     PayU's mihpayid (filled on success)
--   subscriptions.payment_status      'pending' | 'success' | 'failed' | 'cancelled'
--   purchases.payu_txnid              merchant transaction id
--   purchases.payu_payment_id         PayU's mihpayid
--   purchases.payu_status             raw status from PayU response
--
-- Razorpay columns are kept around so historical rows are intact —
-- they just stop being written to.
-- ============================================================


-- 1. SUBSCRIPTIONS — PayU columns
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payu_txnid       text,
  ADD COLUMN IF NOT EXISTS payu_payment_id  text,
  ADD COLUMN IF NOT EXISTS payment_status   text DEFAULT 'pending';

-- Allow 'pending_payment' as a valid subscriptions.status value
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status = ANY (ARRAY[
    'trial', 'active', 'expired', 'cancelled',
    'pending_payment', 'payment_failed'
  ]));

-- Fast lookup by txnid (used in PayU callback)
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_payu_txnid_idx
  ON subscriptions (payu_txnid)
  WHERE payu_txnid IS NOT NULL;


-- 2. PURCHASES — PayU columns
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS payu_txnid       text,
  ADD COLUMN IF NOT EXISTS payu_payment_id  text,
  ADD COLUMN IF NOT EXISTS payu_status      text;

CREATE UNIQUE INDEX IF NOT EXISTS purchases_payu_txnid_idx
  ON purchases (payu_txnid)
  WHERE payu_txnid IS NOT NULL;


-- 3. SERVICE ROLE — allow callback edge function to update rows
--    The callback runs with SERVICE_ROLE_KEY so it bypasses RLS by default,
--    but we leave existing RLS policies intact for client access.


-- 4. VERIFY
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'subscriptions'
     AND column_name IN ('payu_txnid', 'payu_payment_id', 'payment_status')) AS sub_payu_cols,

  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'purchases'
     AND column_name IN ('payu_txnid', 'payu_payment_id', 'payu_status'))    AS pur_payu_cols;

-- Expected: sub_payu_cols = 3, pur_payu_cols = 3
