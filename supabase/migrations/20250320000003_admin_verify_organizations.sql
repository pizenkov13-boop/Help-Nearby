-- Only service role (server admin API) may update organizations
CREATE POLICY "Deny public update organizations"
  ON organizations
  FOR UPDATE
  TO anon, authenticated
  USING (false);
