-- Help Nearby — clean Supabase schema (all migrations combined, final state).
-- Run once in Supabase → SQL Editor → New query → paste → Run, on an EMPTY project.
-- Optional starter data lives in supabase/seed_demo.sql.
--
-- Access model: the public (anon) key may read VERIFIED organizations and APPROVED reviews,
-- and may only INSERT submissions / impact clicks. Everything else goes through the server
-- with the service role key (moderation, counters, deployments).

-- ---------------------------------------------------------------- organizations
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT[] NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  phone TEXT,
  email TEXT,
  website TEXT,
  hours TEXT,
  rating DECIMAL(3,1),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Anonymous clients read VERIFIED rows only; unverified form submissions stay private until moderated.
CREATE POLICY "Allow public read verified organizations"
  ON organizations
  FOR SELECT
  TO anon, authenticated
  USING (verified = true);

-- Anyone may submit an organization, but it starts unverified.
CREATE POLICY "Allow public submit unverified"
  ON organizations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (verified = false);

-- Only the service role (server admin API) may update organizations.
CREATE POLICY "Deny public update organizations"
  ON organizations
  FOR UPDATE
  TO anon, authenticated
  USING (false);

-- --------------------------------------------------------------------- reviews
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read approved reviews"
  ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (approved = true);

CREATE POLICY "Allow public insert reviews"
  ON reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(name)) > 0
    AND char_length(trim(country)) > 0
    AND char_length(trim(message)) > 0
    AND rating >= 1
    AND rating <= 5
    AND approved IS NOT DISTINCT FROM false
  );

CREATE POLICY "Deny public update reviews"
  ON reviews
  FOR UPDATE
  TO anon, authenticated
  USING (false);

CREATE POLICY "Deny public delete reviews"
  ON reviews
  FOR DELETE
  TO anon, authenticated
  USING (false);

-- --------------------------------------------------------------- impact_clicks
CREATE TABLE impact_clicks (
  id SERIAL PRIMARY KEY,
  org_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE impact_clicks ENABLE ROW LEVEL SECURITY;

-- Insert only; the aggregate "helped today" count is read server-side with the service role.
CREATE POLICY "Allow public insert impact clicks"
  ON impact_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (action IN ('call', 'directions'));

CREATE INDEX impact_clicks_created_at_idx ON impact_clicks (created_at DESC);

-- ----------------------------------------------------------------- deployments
-- Anonymous opt-out deployment pings (domain, version, timestamp). Written and read by the
-- server with the service role only: RLS is on and there are deliberately no public policies.
CREATE TABLE deployments (
  domain TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

CREATE INDEX deployments_last_seen_idx ON deployments (last_seen DESC);

-- -------------------------------------------------------------- external_orgs
-- Daily copy of HDX / GDHO / ReliefWeb organizations (filled by .github/workflows/external-orgs.yml).
-- Server-only (service role): RLS is on and there are no public policies.
CREATE TABLE external_orgs (
  id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('hdx', 'gdho', 'reliefweb')),
  country_code TEXT NOT NULL,
  country_key TEXT NOT NULL,
  country TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  city TEXT,
  address TEXT,
  website TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- the same organization can work in several countries: one row per country
  PRIMARY KEY (country_code, id)
);

ALTER TABLE external_orgs ENABLE ROW LEVEL SECURITY;

CREATE INDEX external_orgs_country_code_idx ON external_orgs (country_code);
CREATE INDEX external_orgs_country_key_idx ON external_orgs (country_key);
