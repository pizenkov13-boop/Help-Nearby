CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read reviews"
  ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

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
  );
