-- ─────────────────────────────────────────────────────────────────────────────
-- seed-dummy-owner.sql
--
-- Creates a fully-active dummy gym owner so you can test the post-signup app
-- (dashboard, branches, tokens, pricing upgrades, etc.) without going through
-- the signup flow + payment.
--
-- HOW TO RUN
--   1. Open Supabase → SQL Editor → New query
--   2. (Optional) Edit the values in the `cfg` CTE below
--   3. Run. The script prints the credentials you can log in with.
--
-- WHAT IT CREATES
--   auth.users           — login user (email + password, email_confirmed)
--   auth.identities      — required for password sign-in
--   gyms                 — owned by the user
--   profiles             — role='gym_owner', linked to the gym
--   subscriptions        — pro_max / monthly, status='active', 2 branch slots
--   subscription_tokens  — 2000 tokens for the current month
--
-- IDEMPOTENT: re-running with the same email is safe (does nothing).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  cfg_email      TEXT := 'dummy.owner@gymsetu.test';
  cfg_password   TEXT := 'Dummy@12345';
  cfg_full_name  TEXT := 'Dummy Owner';
  cfg_gym_name   TEXT := 'Dummy Iron Gym';
  cfg_phone      TEXT := '9876543210';
  cfg_city       TEXT := 'Mumbai';
  cfg_plan       TEXT := 'pro_max';      -- basic | pro | pro_plus | pro_max
  cfg_cycle      TEXT := 'monthly';      -- monthly | quarterly | half_yearly | yearly
  cfg_branches   INT  := 2;
  cfg_tokens     INT  := 2000;           -- matches pro_max allotment

  v_user_id      UUID;
  v_gym_id       UUID;
  v_now          TIMESTAMPTZ := NOW();
  v_period_end   TIMESTAMPTZ;
BEGIN
  -- Bail if this email already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = cfg_email;
  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'User % already exists (id=%). Nothing to do.', cfg_email, v_user_id;
    RETURN;
  END IF;

  v_user_id    := gen_random_uuid();
  v_gym_id     := gen_random_uuid();
  v_period_end := v_now + (CASE cfg_cycle
                              WHEN 'quarterly'   THEN INTERVAL '90 days'
                              WHEN 'half_yearly' THEN INTERVAL '180 days'
                              WHEN 'yearly'      THEN INTERVAL '365 days'
                              ELSE                    INTERVAL '30 days'
                            END);

  -- 1. auth.users (password hashed via pgcrypto)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change, email_change_token_new
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    cfg_email,
    crypt(cfg_password, gen_salt('bf')),
    v_now,
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', cfg_full_name),
    v_now, v_now, '', '', '', ''
  );

  -- 2. auth.identities (required for password sign-in to work)
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', cfg_email, 'email_verified', true),
    'email',
    v_now, v_now, v_now
  );

  -- 3. gyms (FK target for profiles + subscriptions)
  INSERT INTO gyms (id, name, owner_id, is_branch, description, phone, address)
  VALUES (
    v_gym_id, cfg_gym_name, v_user_id, FALSE,
    'Seeded dummy gym for QA / testing.', cfg_phone, cfg_city
  );

  -- 4. profiles (role MUST be gym_owner; gym_id MUST be set)
  INSERT INTO profiles (id, full_name, email, role, gym_id, phone)
  VALUES (v_user_id, cfg_full_name, cfg_email, 'gym_owner', v_gym_id, cfg_phone);

  -- 5. subscriptions — active immediately, no payment row
  INSERT INTO subscriptions (
    gym_id, owner_id, plan, tier, billing_cycle,
    status, payment_status,
    current_period_start, current_period_end,
    branch_slots
  ) VALUES (
    v_gym_id, v_user_id, cfg_plan, cfg_plan, cfg_cycle,
    'active', 'success',
    v_now, v_period_end,
    cfg_branches
  );

  -- 6. subscription_tokens for the current month
  IF cfg_tokens > 0 THEN
    INSERT INTO subscription_tokens (gym_id, month_year, tokens_total, tokens_used)
    VALUES (v_gym_id, to_char(v_now, 'YYYY-MM'), cfg_tokens, 0);
  END IF;

  RAISE NOTICE '─────────────────────────────────────────────';
  RAISE NOTICE 'Dummy owner created:';
  RAISE NOTICE '  email    : %', cfg_email;
  RAISE NOTICE '  password : %', cfg_password;
  RAISE NOTICE '  user_id  : %', v_user_id;
  RAISE NOTICE '  gym_id   : %', v_gym_id;
  RAISE NOTICE '  plan     : % (% cycle, % branch slots, % tokens)',
               cfg_plan, cfg_cycle, cfg_branches, cfg_tokens;
  RAISE NOTICE '─────────────────────────────────────────────';
END $$;
