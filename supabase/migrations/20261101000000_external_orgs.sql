-- Daily copy of HDX / GDHO / ReliefWeb organizations, filled by .github/workflows/external-orgs.yml.
-- /api/verified-nearby reads this table instead of calling the slow sources from Vercel.
-- Written and read only by the server with the service role: RLS is on, no public policies.
CREATE TABLE IF NOT EXISTS external_orgs (
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

CREATE INDEX IF NOT EXISTS external_orgs_country_code_idx ON external_orgs (country_code);
CREATE INDEX IF NOT EXISTS external_orgs_country_key_idx ON external_orgs (country_key);
