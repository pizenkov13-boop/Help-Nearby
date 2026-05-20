CREATE TABLE impact_clicks (
  id SERIAL PRIMARY KEY,
  org_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE impact_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert impact clicks"
  ON impact_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (action IN ('call', 'directions'));

CREATE POLICY "Allow public read impact clicks"
  ON impact_clicks
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX impact_clicks_created_at_idx ON impact_clicks (created_at DESC);
