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

-- Allow public read access for the anon key (adjust RLS as needed for production)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON organizations
  FOR SELECT
  TO anon, authenticated
  USING (true);
