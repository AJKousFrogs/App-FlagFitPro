-- =============================================================================
-- KNOWLEDGE BASE GOVERNANCE SYSTEM
-- Migration: 040_knowledge_base_governance.sql
-- Purpose: Add governance fields for evidence-based knowledge base approval and quality control
-- Created: 2025-01-XX
-- Note: This migration only runs if knowledge_base_entries table exists
-- =============================================================================

DO $$
BEGIN
    -- Check if knowledge_base_entries table exists - skip entire migration if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'knowledge_base_entries'
    ) THEN
        RAISE NOTICE 'Table knowledge_base_entries does not exist. Skipping knowledge base governance migration.';
        RETURN;
    END IF;

    -- =============================================================================
    -- ADD GOVERNANCE FIELDS TO KNOWLEDGE_BASE_ENTRIES
    -- =============================================================================

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

    -- Create indexes for governance queries
    CREATE INDEX IF NOT EXISTS idx_kb_approval_status ON knowledge_base_entries(approval_status);
    CREATE INDEX IF NOT EXISTS idx_kb_approval_level ON knowledge_base_entries(approval_level);
    CREATE INDEX IF NOT EXISTS idx_kb_approved_by ON knowledge_base_entries(approved_by);
    CREATE INDEX IF NOT EXISTS idx_kb_source_quality ON knowledge_base_entries(source_quality_score);
    CREATE INDEX IF NOT EXISTS idx_kb_approval_status_level ON knowledge_base_entries(approval_status, approval_level);
END $$;

-- =============================================================================
-- KNOWLEDGE BASE GOVERNANCE LOG TABLE
-- Track all approval/rejection actions for audit trail
-- =============================================================================

-- Only create if knowledge_base_entries exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'knowledge_base_entries'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'knowledge_base_governance_log'
    ) THEN
        CREATE TABLE knowledge_base_governance_log (
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
        CREATE INDEX idx_gov_log_entry ON knowledge_base_governance_log(entry_id);
        CREATE INDEX idx_gov_log_action ON knowledge_base_governance_log(action);
        CREATE INDEX idx_gov_log_performed_by ON knowledge_base_governance_log(performed_by);
        CREATE INDEX idx_gov_log_created_at ON knowledge_base_governance_log(created_at DESC);

        -- Comments
        COMMENT ON TABLE knowledge_base_governance_log IS 'Audit trail for all knowledge base governance actions (approvals, rejections, updates)';
        COMMENT ON COLUMN knowledge_base_governance_log.action IS 'Action performed: approved, rejected, flagged, updated, created, experimental';
        COMMENT ON COLUMN knowledge_base_governance_log.previous_status IS 'Previous approval_status before the action';
        COMMENT ON COLUMN knowledge_base_governance_log.new_status IS 'New approval_status after the action';
    END IF;
END $$;

-- =============================================================================
-- FUNCTIONS AND TRIGGERS (only if knowledge_base_entries exists)
-- =============================================================================

-- These will be created separately and will fail gracefully if table doesn't exist
-- They can be created later when the knowledge_base_entries table is available
