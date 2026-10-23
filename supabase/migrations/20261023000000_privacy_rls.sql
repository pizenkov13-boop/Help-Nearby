-- Privacy hardening of Row Level Security. FOR REVIEW: this file is NOT applied automatically.
-- Run it manually in the Supabase SQL editor only after reviewing it.
--
-- App changes that go with it (already in the code, they work before and after this migration):
--   * the moderation list of unverified organizations is read with the server-side admin client;
--   * the "helped today" counter is read with the server-side admin client;
--   * an organization submission retries with a suffixed slug on a unique-violation.

-- 1. organizations: anonymous clients may read VERIFIED rows only.
--    Rows sent through the "add organization" form stay invisible (they hold the author's contact data)
--    until a moderator verifies them. Insert (verified = false) and the update ban are unchanged.
DROP POLICY IF EXISTS "Allow public read access" ON organizations;

CREATE POLICY "Allow public read verified organizations"
  ON organizations
  FOR SELECT
  TO anon, authenticated
  USING (verified = true);

-- 2. impact_clicks: anonymous clients may only INSERT (call | directions). No anonymous read.
--    The aggregate "helped today" count is computed server-side with the service role.
DROP POLICY IF EXISTS "Allow public read impact clicks" ON impact_clicks;

-- The insert policy "Allow public insert impact clicks" (WITH CHECK action IN ('call', 'directions'))
-- from 20250320000002_create_impact_clicks.sql stays as it is.

-- ROLLBACK (only if needed):
--   DROP POLICY IF EXISTS "Allow public read verified organizations" ON organizations;
--   CREATE POLICY "Allow public read access" ON organizations FOR SELECT TO anon, authenticated USING (true);
--   CREATE POLICY "Allow public read impact clicks" ON impact_clicks FOR SELECT TO anon, authenticated USING (true);
