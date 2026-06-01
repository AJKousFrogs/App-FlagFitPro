
-- Enable RLS on research_articles (read-only reference data)
ALTER TABLE research_articles ENABLE ROW LEVEL SECURITY;

-- Allow read access for all (research articles are public reference data)
CREATE POLICY "Anyone can read research articles"
  ON research_articles FOR SELECT
  USING (true);
