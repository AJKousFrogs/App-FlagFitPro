-- Migration: Fix Missing Schema Elements
-- Date: 2026-01-12
-- Purpose: Add missing columns and relationships identified from console errors
-- Issues fixed:
--   1. team_invitations.message column
--   2. recovery_sessions → recovery_protocols relationship

-- =============================================================================
-- 1. Add 'message' column to team_invitations table
-- =============================================================================
-- Error: "column team_invitations.message does not exist"

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_invitations' 
        AND column_name = 'message'
    ) THEN
        ALTER TABLE public.team_invitations 
        ADD COLUMN message TEXT;
        
        COMMENT ON COLUMN public.team_invitations.message IS 
            'Optional message from coach/admin when sending invitation';
    END IF;
END $$;

-- =============================================================================
-- 2. Add 'protocol_id' column to recovery_sessions table
-- =============================================================================
-- Error: "Could not find a relationship between 'recovery_sessions' and 'recovery_protocols'"

DO $$
BEGIN
    -- First check if recovery_sessions table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recovery_sessions'
    ) THEN
        -- Check if protocol_id column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'recovery_sessions' 
            AND column_name = 'protocol_id'
        ) THEN
            -- Add the column
            ALTER TABLE public.recovery_sessions 
            ADD COLUMN protocol_id UUID;
            
            -- Add foreign key constraint if recovery_protocols table exists
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'recovery_protocols'
            ) THEN
                ALTER TABLE public.recovery_sessions
                ADD CONSTRAINT recovery_sessions_protocol_id_fkey 
                FOREIGN KEY (protocol_id) 
                REFERENCES public.recovery_protocols(id) 
                ON DELETE SET NULL;
                
                -- Create index for the foreign key
                CREATE INDEX IF NOT EXISTS idx_recovery_sessions_protocol_id 
                ON public.recovery_sessions(protocol_id);
            END IF;
            
            COMMENT ON COLUMN public.recovery_sessions.protocol_id IS 
                'Reference to the recovery protocol being used in this session';
        END IF;
    END IF;
END $$;

-- =============================================================================
-- 3. Create recovery_protocols table if it doesn't exist
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recovery_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- e.g., 'active_recovery', 'passive_recovery', 'sleep', 'nutrition'
    duration_minutes INTEGER,
    instructions JSONB, -- Array of steps
    target_areas TEXT[], -- Body areas targeted
    equipment_needed TEXT[],
    effectiveness_rating DECIMAL(3,2), -- 0-5 scale
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for recovery_protocols
ALTER TABLE public.recovery_protocols ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read protocols
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recovery_protocols' 
        AND policyname = 'recovery_protocols_select_authenticated'
    ) THEN
        CREATE POLICY recovery_protocols_select_authenticated ON public.recovery_protocols
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- =============================================================================
-- 4. Ensure recovery_sessions table exists with proper structure
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recovery_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    protocol_id UUID REFERENCES public.recovery_protocols(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'paused', 'completed', 'cancelled')),
    duration_actual_minutes INTEGER,
    notes TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for recovery_sessions
ALTER TABLE public.recovery_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own recovery sessions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recovery_sessions' 
        AND policyname = 'recovery_sessions_own_data'
    ) THEN
        CREATE POLICY recovery_sessions_own_data ON public.recovery_sessions
            FOR ALL TO authenticated
            USING (athlete_id = auth.uid())
            WITH CHECK (athlete_id = auth.uid());
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recovery_sessions_athlete_id 
ON public.recovery_sessions(athlete_id);

CREATE INDEX IF NOT EXISTS idx_recovery_sessions_status 
ON public.recovery_sessions(status) 
WHERE status IN ('in_progress', 'paused');

-- =============================================================================
-- Done
-- =============================================================================
