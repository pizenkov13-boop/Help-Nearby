-- Allow anonymous users to submit new organizations (pending verification)
CREATE POLICY "Allow public submit unverified"
  ON organizations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (verified = false);
