-- =====================================================
-- Create All Teams
-- =====================================================
-- Purpose: Create all 4 teams that users can select
--          in the Settings page team dropdown
-- =====================================================

-- Create teams (idempotent - safe to run multiple times)
INSERT INTO teams (name, sport, approval_status, created_at, updated_at, description) VALUES
  (
    'Ljubljana Frogs - International',
    'flag_football',
    'approved',
    NOW(),
    NOW(),
    'Ljubljana Frogs international team'
  ),
  (
    'Ljubljana Frogs - Domestic',
    'flag_football',
    'approved',
    NOW(),
    NOW(),
    'Ljubljana Frogs domestic team'
  ),
  (
    'American Samoa National Team - Men',
    'flag_football',
    'approved',
    NOW(),
    NOW(),
    'American Samoa men''s national flag football team'
  ),
  (
    'American Samoa National Team - Women',
    'flag_football',
    'approved',
    NOW(),
    NOW(),
    'American Samoa women''s national flag football team'
  )
ON CONFLICT (name) 
DO UPDATE SET
  approval_status = 'approved',
  updated_at = NOW();

-- Verify teams were created
SELECT 
  name,
  sport,
  approval_status,
  created_at
FROM teams
WHERE name IN (
  'Ljubljana Frogs - International',
  'Ljubljana Frogs - Domestic',
  'American Samoa National Team - Men',
  'American Samoa National Team - Women'
)
ORDER BY name;

-- Show summary
DO $$
DECLARE
  team_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO team_count
  FROM teams
  WHERE name IN (
    'Ljubljana Frogs - International',
    'Ljubljana Frogs - Domestic',
    'American Samoa National Team - Men',
    'American Samoa National Team - Women'
  );
  
  RAISE NOTICE '✅ Successfully created/updated % teams', team_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Users can now select from:';
  RAISE NOTICE '  • Ljubljana Frogs - International';
  RAISE NOTICE '  • Ljubljana Frogs - Domestic';
  RAISE NOTICE '  • American Samoa National Team - Men';
  RAISE NOTICE '  • American Samoa National Team - Women';
END $$;
