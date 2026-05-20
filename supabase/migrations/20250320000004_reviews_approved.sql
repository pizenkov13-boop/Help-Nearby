ALTER TABLE reviews ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

DROP POLICY IF EXISTS "Allow public read reviews" ON reviews;

CREATE POLICY "Allow public read approved reviews"
  ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (approved = true);

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
