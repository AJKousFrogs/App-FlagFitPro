-- Migration: Add confidence_metadata to daily_protocols
-- Part of Prompt 6 (Truthfulness Contract)
-- 
-- This adds a JSONB column to store confidence metadata about
-- the data sources used to generate each protocol.
-- 
-- Confidence metadata includes:
-- - readiness: data availability, source, staleness, confidence level
-- - acwr: data availability, source, training days logged, confidence level
-- - sessionResolution: success status, program/template availability, overrides

ALTER TABLE daily_protocols
ADD COLUMN IF NOT EXISTS confidence_metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN daily_protocols.confidence_metadata IS 
'Confidence metadata about data sources used for protocol generation.
Contains readiness confidence, ACWR confidence, and session resolution status.
NULL means confidence tracking was not available when protocol was generated.';

-- Create an index for queries filtering by confidence
CREATE INDEX IF NOT EXISTS idx_daily_protocols_confidence_metadata 
ON daily_protocols USING GIN (confidence_metadata);

-- Example confidence_metadata structure:
-- {
--   "readiness": {
--     "hasData": true,
--     "source": "wellness_checkin",
--     "daysStale": 0,
--     "confidence": "high"
--   },
--   "acwr": {
--     "hasData": false,
--     "source": "none",
--     "trainingDaysLogged": 3,
--     "confidence": "building_baseline"
--   },
--   "sessionResolution": {
--     "success": true,
--     "status": "resolved",
--     "hasProgram": true,
--     "hasSessionTemplate": true,
--     "override": null
--   }
-- }

