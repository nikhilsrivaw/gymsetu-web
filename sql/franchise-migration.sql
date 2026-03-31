-- ============================================================
-- FRANCHISE MODULE — Run this in Supabase SQL Editor
-- ============================================================

-- 1. Franchise brands (one per franchisor)
CREATE TABLE franchise_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  logo_url text,
  description text,
  franchise_fee numeric DEFAULT 0,
  royalty_percentage numeric DEFAULT 5,
  territory_model text DEFAULT 'exclusive'
    CHECK (territory_model IN ('exclusive', 'non_exclusive', 'shared')),
  training_included boolean DEFAULT false,
  support_level text DEFAULT 'standard'
    CHECK (support_level IN ('basic', 'standard', 'premium')),
  min_investment numeric,
  max_locations integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Franchise locations (franchisees linked to a brand)
CREATE TABLE franchise_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES franchise_brands(id) ON DELETE CASCADE,
  gym_id uuid REFERENCES gyms(id),
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  city text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 3. Franchise invites (token-based, copy-paste links)
CREATE TABLE franchise_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES franchise_brands(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email text,
  city text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  accepted_by uuid REFERENCES auth.users(id),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

-- 4. Franchise subscriptions (separate from gym subscriptions)
CREATE TABLE franchise_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES franchise_brands(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  plan text DEFAULT 'standard'
    CHECK (plan IN ('standard', 'premium')),
  status text DEFAULT 'active'
    CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
  billing_cycle text DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'quarterly', 'half_yearly', 'yearly')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 5. Franchise revenue (reported by each location monthly)
CREATE TABLE franchise_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES franchise_locations(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES franchise_brands(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  total_revenue numeric DEFAULT 0,
  member_count integer DEFAULT 0,
  new_members integer DEFAULT 0,
  churned_members integer DEFAULT 0,
  reported_at timestamptz DEFAULT now(),
  UNIQUE(location_id, month_year)
);

-- 6. Royalty invoices
CREATE TABLE franchise_royalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES franchise_brands(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES franchise_locations(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  revenue_reported numeric DEFAULT 0,
  royalty_percentage numeric NOT NULL,
  amount_due numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  due_date date,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 7. SOP templates (created by franchisor)
CREATE TABLE franchise_sops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES franchise_brands(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. SOP submissions (by franchisees)
CREATE TABLE franchise_sop_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id uuid NOT NULL REFERENCES franchise_sops(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES franchise_locations(id) ON DELETE CASCADE,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 9. Readiness checklist (one per user, gate before franchise setup)
CREATE TABLE franchise_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid UNIQUE NOT NULL REFERENCES auth.users(id),
  brand_name boolean DEFAULT false,
  business_model boolean DEFAULT false,
  operations_manual boolean DEFAULT false,
  training_program boolean DEFAULT false,
  legal_framework boolean DEFAULT false,
  financial_model boolean DEFAULT false,
  brand_standards boolean DEFAULT false,
  support_system boolean DEFAULT false,
  growth_strategy boolean DEFAULT false,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE franchise_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_sop_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_readiness ENABLE ROW LEVEL SECURITY;

-- Brands: owner can CRUD
CREATE POLICY "brand_owner_all" ON franchise_brands
  FOR ALL USING (auth.uid() = owner_id);

-- Locations: brand owner can read all; location owner can read own
CREATE POLICY "locations_brand_owner" ON franchise_locations
  FOR ALL USING (
    brand_id IN (SELECT id FROM franchise_brands WHERE owner_id = auth.uid())
    OR owner_id = auth.uid()
  );

-- Invites: brand owner can CRUD
CREATE POLICY "invites_brand_owner" ON franchise_invites
  FOR ALL USING (
    brand_id IN (SELECT id FROM franchise_brands WHERE owner_id = auth.uid())
  );

-- Allow anyone to read an invite by token (for accept-invite flow)
CREATE POLICY "invites_read_by_token" ON franchise_invites
  FOR SELECT USING (true);

-- Subscriptions: owner can read/write own
CREATE POLICY "franchise_sub_owner" ON franchise_subscriptions
  FOR ALL USING (owner_id = auth.uid());

-- Revenue: brand owner + location owner
CREATE POLICY "revenue_access" ON franchise_revenue
  FOR ALL USING (
    brand_id IN (SELECT id FROM franchise_brands WHERE owner_id = auth.uid())
    OR location_id IN (SELECT id FROM franchise_locations WHERE owner_id = auth.uid())
  );

-- Royalties: brand owner + location owner
CREATE POLICY "royalties_access" ON franchise_royalties
  FOR ALL USING (
    brand_id IN (SELECT id FROM franchise_brands WHERE owner_id = auth.uid())
    OR location_id IN (SELECT id FROM franchise_locations WHERE owner_id = auth.uid())
  );

-- SOPs: brand owner can CRUD; franchisees can read
CREATE POLICY "sops_brand_owner" ON franchise_sops
  FOR ALL USING (
    brand_id IN (SELECT id FROM franchise_brands WHERE owner_id = auth.uid())
  );

CREATE POLICY "sops_franchisee_read" ON franchise_sops
  FOR SELECT USING (
    brand_id IN (
      SELECT brand_id FROM franchise_locations WHERE owner_id = auth.uid()
    )
  );

-- SOP submissions: location owner + brand owner
CREATE POLICY "sop_submissions_access" ON franchise_sop_submissions
  FOR ALL USING (
    location_id IN (SELECT id FROM franchise_locations WHERE owner_id = auth.uid())
    OR sop_id IN (
      SELECT id FROM franchise_sops WHERE brand_id IN (
        SELECT id FROM franchise_brands WHERE owner_id = auth.uid()
      )
    )
  );

-- Readiness: owner only
CREATE POLICY "readiness_owner" ON franchise_readiness
  FOR ALL USING (owner_id = auth.uid());

-- ============================================================
-- pg_cron: Auto-generate royalty invoices on 1st of each month
-- (Run this separately if pg_cron is enabled)
-- ============================================================
-- SELECT cron.schedule(
--   'generate-franchise-royalties',
--   '0 2 1 * *',   -- 2 AM on the 1st of every month
--   $$
--     INSERT INTO franchise_royalties (brand_id, location_id, month_year, royalty_percentage, amount_due, due_date)
--     SELECT
--       r.brand_id,
--       r.location_id,
--       r.month_year,
--       b.royalty_percentage,
--       ROUND(r.total_revenue * b.royalty_percentage / 100, 2),
--       (DATE_TRUNC('month', NOW()) + INTERVAL '15 days')::date
--     FROM franchise_revenue r
--     JOIN franchise_brands b ON b.id = r.brand_id
--     WHERE r.month_year = TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY-MM')
--       AND NOT EXISTS (
--         SELECT 1 FROM franchise_royalties fr
--         WHERE fr.location_id = r.location_id
--           AND fr.month_year = r.month_year
--       )
--   $$
-- );
