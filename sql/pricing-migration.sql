-- ============================================================
-- GYMSETU — PRICING MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run — uses IF NOT EXISTS / IF EXISTS guards
-- ============================================================


-- ============================================================
-- 1. SUBSCRIPTIONS TABLE — column additions
-- ============================================================

-- Tier column (mirrors plan, used for display/logic)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS tier text;

-- Branch slots purchased as add-on
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS branch_slots integer NOT NULL DEFAULT 0;

-- Billing cycle (monthly / quarterly / half_yearly / yearly)
-- Already exists in most setups — safe to skip if it errors
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';


-- ============================================================
-- 2. SUBSCRIPTIONS TABLE — update plan CHECK constraint
--    to allow pro_plus and pro_max in addition to basic / pro
-- ============================================================

-- Drop the old constraint (name may vary — check yours in
-- Supabase Table Editor → subscriptions → Constraints)
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- Recreate with all four valid plan values
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan = ANY (ARRAY['basic', 'pro', 'pro_plus', 'pro_max']));

-- Also constrain the tier column to the same set
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_tier_check
  CHECK (tier IS NULL OR tier = ANY (ARRAY['basic', 'pro', 'pro_plus', 'pro_max']));

-- Constrain billing_cycle values
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_billing_cycle_check
  CHECK (billing_cycle IS NULL OR billing_cycle = ANY (
    ARRAY['monthly', 'quarterly', 'half_yearly', 'yearly']
  ));


-- ============================================================
-- 3. SUBSCRIPTION_TOKENS TABLE
--    Ensure UNIQUE constraint exists on (gym_id, month_year)
--    Required for the ON CONFLICT upsert in Branches/Tokens/Pricing pages
-- ============================================================

ALTER TABLE subscription_tokens
  DROP CONSTRAINT IF EXISTS subscription_tokens_gym_id_month_year_key;

ALTER TABLE subscription_tokens
  ADD CONSTRAINT subscription_tokens_gym_id_month_year_key
  UNIQUE (gym_id, month_year);


-- ============================================================
-- 4. PURCHASES TABLE — tracks every Razorpay transaction
-- ============================================================

CREATE TABLE IF NOT EXISTS purchases (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gym_id               uuid        NOT NULL REFERENCES gyms(id)    ON DELETE CASCADE,

  -- What was bought
  type                 text        NOT NULL
    CHECK (type IN ('plan', 'branch_pack', 'token_pack')),

  -- Plan purchase fields
  plan                 text        CHECK (plan IS NULL OR plan = ANY (
                                     ARRAY['basic', 'pro', 'pro_plus', 'pro_max']
                                   )),
  billing_cycle        text        CHECK (billing_cycle IS NULL OR billing_cycle = ANY (
                                     ARRAY['monthly', 'quarterly', 'half_yearly', 'yearly']
                                   )),

  -- Branch pack fields
  branch_slots         integer,

  -- Token pack fields
  token_amount         integer,

  -- Payment
  amount               integer     NOT NULL,   -- INR, whole rupees
  currency             text        NOT NULL DEFAULT 'INR',
  razorpay_payment_id  text,
  razorpay_order_id    text,
  razorpay_signature   text,

  -- Status lifecycle: pending → paid | failed | refunded
  status               text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Gym owners can see their own purchases
DROP POLICY IF EXISTS "Owners see own purchases" ON purchases;
CREATE POLICY "Owners see own purchases"
  ON purchases FOR SELECT
  USING (owner_id = auth.uid());

-- Gym owners can insert their own purchases (pending record created client-side)
DROP POLICY IF EXISTS "Owners insert own purchases" ON purchases;
CREATE POLICY "Owners insert own purchases"
  ON purchases FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Gym owners can update their own purchases (status, payment ID after callback)
DROP POLICY IF EXISTS "Owners update own purchases" ON purchases;
CREATE POLICY "Owners update own purchases"
  ON purchases FOR UPDATE
  USING (owner_id = auth.uid());

-- Index for fast lookups by owner
CREATE INDEX IF NOT EXISTS purchases_owner_id_idx ON purchases (owner_id);
CREATE INDEX IF NOT EXISTS purchases_gym_id_idx   ON purchases (gym_id);
CREATE INDEX IF NOT EXISTS purchases_status_idx   ON purchases (status);


-- ============================================================
-- 5. TOKEN_USAGE_LOG TABLE
--    Per-feature WhatsApp token consumption tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS token_usage_log (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id        uuid        NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  feature       text        NOT NULL,        -- e.g. 'birthday_wish', 'payment_reminder'
  tokens_spent  integer     NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE token_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners view own token logs" ON token_usage_log;
CREATE POLICY "Owners view own token logs"
  ON token_usage_log FOR SELECT
  USING (
    gym_id IN (
      SELECT gym_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS token_usage_log_gym_id_idx    ON token_usage_log (gym_id);
CREATE INDEX IF NOT EXISTS token_usage_log_created_at_idx ON token_usage_log (created_at DESC);


-- ============================================================
-- 6. HELPER: auto-update updated_at on purchases
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS purchases_set_updated_at ON purchases;
CREATE TRIGGER purchases_set_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- 7. VERIFY — quick sanity check (returns counts, not errors)
-- ============================================================

SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'subscriptions'
     AND column_name IN ('tier', 'branch_slots', 'billing_cycle')) AS sub_columns_added,

  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_name = 'purchases'
     AND constraint_type = 'PRIMARY KEY')                           AS purchases_table_ok,

  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_name = 'token_usage_log'
     AND constraint_type = 'PRIMARY KEY')                           AS token_log_table_ok,

  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_name = 'subscription_tokens'
     AND constraint_type = 'UNIQUE')                                AS tokens_unique_constraint_ok;

-- Expected output:
-- sub_columns_added | purchases_table_ok | token_log_table_ok | tokens_unique_constraint_ok
--        3          |         1          |         1          |              1
