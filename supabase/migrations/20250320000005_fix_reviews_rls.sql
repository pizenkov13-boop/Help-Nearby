-- Ensure reviews table exists after DB cleanup and fix RLS for anonymous submissions.

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read reviews" ON reviews;
DROP POLICY IF EXISTS "Allow public read approved reviews" ON reviews;
DROP POLICY IF EXISTS "Allow public insert reviews" ON reviews;
DROP POLICY IF EXISTS "Deny public update reviews" ON reviews;
DROP POLICY IF EXISTS "Deny public delete reviews" ON reviews;

-- Public may only see moderator-approved reviews.
CREATE POLICY "Allow public read approved reviews"
  ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (approved = true);

-- Anonymous users may submit reviews; new rows must stay unapproved.
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
