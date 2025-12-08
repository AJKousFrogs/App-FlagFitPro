-- =============================================================================
-- KNOWLEDGE BASE GOVERNANCE SYSTEM
-- Migration: 040_knowledge_base_governance.sql
-- Purpose: Add governance fields for evidence-based knowledge base approval and quality control
-- Created: 2025-01-XX
-- =============================================================================

-- =============================================================================
-- ADD GOVERNANCE FIELDS TO KNOWLEDGE_BASE_ENTRIES
-- =============================================================================

DO $$
BEGIN
    -- Add approval_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' 
            CHECK (approval_status IN ('pending', 'approved', 'rejected', 'experimental'));
        COMMENT ON COLUMN knowledge_base_entries.approval_status IS 'Approval status: pending (awaiting review), approved (league-approved), rejected (not suitable), experimental (emerging research)';
    END IF;

    -- Add approval_level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'approval_level'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN approval_level VARCHAR(20) DEFAULT 'research' 
            CHECK (approval_level IN ('league', 'coach', 'research', 'experimental'));
        COMMENT ON COLUMN knowledge_base_entries.approval_level IS 'Approval level: league (official guidelines), coach (coach-reviewed), research (research-based), experimental (experimental protocol)';
    END IF;

    -- Add approved_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN approved_by UUID REFERENCES users(id);
        COMMENT ON COLUMN knowledge_base_entries.approved_by IS 'User ID of the admin/coach who approved this entry';
    END IF;

    -- Add approved_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN approved_at TIMESTAMP;
        COMMENT ON COLUMN knowledge_base_entries.approved_at IS 'Timestamp when this entry was approved';
    END IF;

    -- Add approval_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'approval_notes'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN approval_notes TEXT;
        COMMENT ON COLUMN knowledge_base_entries.approval_notes IS 'Notes from the approver about why this entry was approved/rejected';
    END IF;

    -- Add research_source_ids column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'research_source_ids'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN research_source_ids UUID[];
        COMMENT ON COLUMN knowledge_base_entries.research_source_ids IS 'Array of research_articles IDs that support this entry (in addition to supporting_articles)';
    END IF;

    -- Add source_quality_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'knowledge_base_entries' AND column_name = 'source_quality_score'
    ) THEN
        ALTER TABLE knowledge_base_entries ADD COLUMN source_quality_score DECIMAL(3,2) CHECK (source_quality_score >= 0 AND source_quality_score <= 1);
        COMMENT ON COLUMN knowledge_base_entries.source_quality_score IS 'Quality score of sources (0.0 to 1.0) based on journal impact, study quality, etc.';
    END IF;
END $$;

-- Create indexes for governance queries
CREATE INDEX IF NOT EXISTS idx_kb_approval_status ON knowledge_base_entries(approval_status);
CREATE INDEX IF NOT EXISTS idx_kb_approval_level ON knowledge_base_entries(approval_level);
CREATE INDEX IF NOT EXISTS idx_kb_approved_by ON knowledge_base_entries(approved_by);
CREATE INDEX IF NOT EXISTS idx_kb_source_quality ON knowledge_base_entries(source_quality_score);
CREATE INDEX IF NOT EXISTS idx_kb_approval_status_level ON knowledge_base_entries(approval_status, approval_level);

-- =============================================================================
-- KNOWLEDGE BASE GOVERNANCE LOG TABLE
-- Track all approval/rejection actions for audit trail
-- =============================================================================

CREATE TABLE IF NOT EXISTS knowledge_base_governance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES knowledge_base_entries(id) ON DELETE CASCADE,
    
    -- Action details
    action VARCHAR(50) NOT NULL CHECK (action IN ('approved', 'rejected', 'flagged', 'updated', 'created', 'experimental')),
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    
    -- Status changes
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    previous_level VARCHAR(20),
    new_level VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for governance log queries
CREATE INDEX IF NOT EXISTS idx_gov_log_entry ON knowledge_base_governance_log(entry_id);
CREATE INDEX IF NOT EXISTS idx_gov_log_action ON knowledge_base_governance_log(action);
CREATE INDEX IF NOT EXISTS idx_gov_log_performed_by ON knowledge_base_governance_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_gov_log_created_at ON knowledge_base_governance_log(created_at DESC);

-- Comments
COMMENT ON TABLE knowledge_base_governance_log IS 'Audit trail for all knowledge base governance actions (approvals, rejections, updates)';
COMMENT ON COLUMN knowledge_base_governance_log.action IS 'Action performed: approved, rejected, flagged, updated, created, experimental';
COMMENT ON COLUMN knowledge_base_governance_log.previous_status IS 'Previous approval_status before the action';
COMMENT ON COLUMN knowledge_base_governance_log.new_status IS 'New approval_status after the action';

-- =============================================================================
-- FUNCTION: Calculate source quality score
-- Automatically calculates quality score based on supporting articles
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_source_quality_score(p_entry_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_score DECIMAL(3,2) := 0.0;
    v_article_count INTEGER := 0;
    v_total_score DECIMAL(5,2) := 0.0;
    v_article_record RECORD;
BEGIN
    -- Get supporting articles
    SELECT supporting_articles INTO v_article_count
    FROM knowledge_base_entries
    WHERE id = p_entry_id;
    
    -- If no articles, return 0
    IF v_article_count IS NULL OR array_length(v_article_count, 1) IS NULL THEN
        RETURN 0.0;
    END IF;
    
    -- Calculate average quality from articles
    FOR v_article_record IN
        SELECT 
            evidence_level,
            impact_factor,
            quality_score,
            study_type,
            sample_size
        FROM research_articles
        WHERE id = ANY((SELECT supporting_articles FROM knowledge_base_entries WHERE id = p_entry_id))
    LOOP
        -- Score based on evidence level (A=1.0, B=0.75, C=0.5, D=0.25)
        CASE v_article_record.evidence_level
            WHEN 'A' THEN v_total_score := v_total_score + 1.0;
            WHEN 'B' THEN v_total_score := v_total_score + 0.75;
            WHEN 'C' THEN v_total_score := v_total_score + 0.5;
            WHEN 'D' THEN v_total_score := v_total_score + 0.25;
            ELSE v_total_score := v_total_score + 0.5;
        END CASE;
        
        -- Bonus for high impact factor
        IF v_article_record.impact_factor IS NOT NULL AND v_article_record.impact_factor > 5 THEN
            v_total_score := v_total_score + 0.1;
        END IF;
        
        -- Bonus for large sample size
        IF v_article_record.sample_size IS NOT NULL AND v_article_record.sample_size > 100 THEN
            v_total_score := v_total_score + 0.1;
        END IF;
        
        -- Bonus for meta-analysis or systematic review
        IF v_article_record.study_type IN ('meta_analysis', 'systematic_review') THEN
            v_total_score := v_total_score + 0.15;
        END IF;
    END LOOP;
    
    -- Calculate average and cap at 1.0
    v_score := LEAST(v_total_score / array_length((SELECT supporting_articles FROM knowledge_base_entries WHERE id = p_entry_id), 1), 1.0);
    
    RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_source_quality_score IS 'Calculates quality score (0.0-1.0) based on supporting articles evidence levels, impact factors, and study types';

-- =============================================================================
-- FUNCTION: Log governance action
-- Automatically logs approval/rejection actions
-- =============================================================================

CREATE OR REPLACE FUNCTION log_governance_action(
    p_entry_id UUID,
    p_action VARCHAR(50),
    p_performed_by UUID,
    p_notes TEXT DEFAULT NULL,
    p_new_status VARCHAR(20) DEFAULT NULL,
    p_new_level VARCHAR(20) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_previous_status VARCHAR(20);
    v_previous_level VARCHAR(20);
BEGIN
    -- Get previous status and level
    SELECT approval_status, approval_level
    INTO v_previous_status, v_previous_level
    FROM knowledge_base_entries
    WHERE id = p_entry_id;
    
    -- Insert log entry
    INSERT INTO knowledge_base_governance_log (
        entry_id,
        action,
        performed_by,
        notes,
        previous_status,
        new_status,
        previous_level,
        new_level
    ) VALUES (
        p_entry_id,
        p_action,
        p_performed_by,
        p_notes,
        v_previous_status,
        COALESCE(p_new_status, v_previous_status),
        v_previous_level,
        COALESCE(p_new_level, v_previous_level)
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_governance_action IS 'Logs a governance action (approval, rejection, etc.) for audit trail';

-- =============================================================================
-- TRIGGER: Auto-update quality score when supporting articles change
-- =============================================================================

CREATE OR REPLACE FUNCTION update_quality_score_on_articles_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate quality score if supporting articles changed
    IF TG_OP = 'UPDATE' AND (
        OLD.supporting_articles IS DISTINCT FROM NEW.supporting_articles OR
        OLD.source_quality_score IS NULL
    ) THEN
        NEW.source_quality_score := calculate_source_quality_score(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quality_score
BEFORE UPDATE ON knowledge_base_entries
FOR EACH ROW
WHEN (OLD.supporting_articles IS DISTINCT FROM NEW.supporting_articles)
EXECUTE FUNCTION update_quality_score_on_articles_change();

-- =============================================================================
-- INITIAL DATA: Set default approval status for existing entries
-- =============================================================================

-- Set existing entries to 'approved' if they have strong evidence, otherwise 'pending'
UPDATE knowledge_base_entries
SET approval_status = CASE
    WHEN evidence_strength = 'strong' AND consensus_level = 'high' THEN 'approved'
    WHEN evidence_strength IN ('strong', 'moderate') THEN 'pending'
    ELSE 'experimental'
END,
approval_level = CASE
    WHEN evidence_strength = 'strong' AND consensus_level = 'high' THEN 'research'
    ELSE 'research'
END
WHERE approval_status IS NULL;

-- Calculate quality scores for existing entries
UPDATE knowledge_base_entries
SET source_quality_score = calculate_source_quality_score(id)
WHERE source_quality_score IS NULL AND supporting_articles IS NOT NULL;

