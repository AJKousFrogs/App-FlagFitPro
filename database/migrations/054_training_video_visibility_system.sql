-- Migration: Training Video Visibility System
-- Purpose: Create training_videos table with visibility rules for drills:
--   1. Players can add videos for themselves (private - only they can see)
--   2. Coaches/Admins can add videos visible to everyone (public)
--   3. Coaches/Admins/Physiotherapists can assign videos to specific athletes (assigned - only that athlete + staff can see)
--   4. Assigned drills trigger periodization recalculation for the target athlete
--
-- VISIBILITY RULES SUMMARY:
-- ┌─────────────────┬──────────────────────────────────────────────────────────────┐
-- │ visibility_type │ Who can see                                                  │
-- ├─────────────────┼──────────────────────────────────────────────────────────────┤
-- │ private         │ Only the player who created it (created_by = current_user)  │
-- │ public          │ Everyone (all authenticated users)                          │
-- │ assigned        │ Target player (target_player_id) + all staff members        │
-- └─────────────────┴──────────────────────────────────────────────────────────────┘
--
-- INSERTION RULES:
-- - Players can ONLY insert 'private' videos for themselves
-- - Staff (coach/admin/physiotherapist) can insert any type

-- =====================================================
-- STEP 1: CREATE TRAINING_VIDEOS TABLE WITH VISIBILITY
-- =====================================================

CREATE TABLE IF NOT EXISTS training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INTEGER,
  category VARCHAR(100), -- 'Exercise Demo', 'Technique', 'Position-Specific', 'Warm-up', 'Drill'
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  tags TEXT[], -- ['QB', 'Throwing Mechanics', 'Arm Care']
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Visibility system
  visibility_type VARCHAR(20) DEFAULT 'public' CHECK (visibility_type IN ('private', 'public', 'assigned')),
  target_player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignment_notes TEXT,
  assignment_date TIMESTAMPTZ,
  
  -- Periodization impact
  affects_periodization BOOLEAN DEFAULT FALSE,
  estimated_load INTEGER DEFAULT 0,
  
  -- Scheduling
  due_date DATE,
  completion_status VARCHAR(20) DEFAULT 'pending' CHECK (completion_status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_training_videos_position ON training_videos(position_id);
CREATE INDEX IF NOT EXISTS idx_training_videos_exercise ON training_videos(exercise_id);
CREATE INDEX IF NOT EXISTS idx_training_videos_category ON training_videos(category);
CREATE INDEX IF NOT EXISTS idx_training_videos_visibility ON training_videos(visibility_type);
CREATE INDEX IF NOT EXISTS idx_training_videos_target_player ON training_videos(target_player_id);
CREATE INDEX IF NOT EXISTS idx_training_videos_assigned_by ON training_videos(assigned_by);
CREATE INDEX IF NOT EXISTS idx_training_videos_created_by ON training_videos(created_by);
CREATE INDEX IF NOT EXISTS idx_training_videos_due_date ON training_videos(due_date);
CREATE INDEX IF NOT EXISTS idx_training_videos_completion ON training_videos(completion_status);

-- Composite index for common query pattern (player's visible videos)
CREATE INDEX IF NOT EXISTS idx_training_videos_player_visibility 
ON training_videos(target_player_id, visibility_type, created_by);

-- =====================================================
-- STEP 3: ENABLE RLS AND CREATE POLICIES
-- =====================================================

ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is staff (coach, admin, physiotherapist)
CREATE OR REPLACE FUNCTION is_staff_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT auth.jwt()) ->> 'user_metadata' ->> 'role' IN ('coach', 'admin', 'physiotherapist'),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, auth;

COMMENT ON FUNCTION is_staff_role() IS 'Returns true if the current user has a staff role (coach, admin, or physiotherapist)';

-- SELECT Policy: Complex visibility rules
-- Users can see:
--   1. PUBLIC videos (visibility_type = 'public')
--   2. Their OWN private videos (visibility_type = 'private' AND created_by = current_user)
--   3. Videos ASSIGNED to them (visibility_type = 'assigned' AND target_player_id = current_user)
--   4. Staff can see ALL videos
CREATE POLICY "training_videos_select_policy"
ON training_videos FOR SELECT
USING (
  -- Public videos are visible to everyone
  visibility_type = 'public'
  OR
  -- Private videos are only visible to the creator
  (visibility_type = 'private' AND created_by = (SELECT auth.uid()))
  OR
  -- Assigned videos are visible to the target player
  (visibility_type = 'assigned' AND target_player_id = (SELECT auth.uid()))
  OR
  -- Staff (coaches, admins, physiotherapists) can see all videos
  is_staff_role()
);

-- INSERT Policy: 
-- Players can only create private videos for themselves
-- Staff can create any type of video
CREATE POLICY "training_videos_insert_policy"
ON training_videos FOR INSERT
WITH CHECK (
  -- Staff can insert any video
  is_staff_role()
  OR
  -- Players can only insert private videos for themselves
  (
    visibility_type = 'private' 
    AND created_by = (SELECT auth.uid())
    AND target_player_id IS NULL
  )
);

-- UPDATE Policy:
-- Players can only update their own private videos
-- Staff can update any video
CREATE POLICY "training_videos_update_policy"
ON training_videos FOR UPDATE
USING (
  is_staff_role()
  OR
  (visibility_type = 'private' AND created_by = (SELECT auth.uid()))
)
WITH CHECK (
  is_staff_role()
  OR
  (visibility_type = 'private' AND created_by = (SELECT auth.uid()))
);

-- DELETE Policy:
-- Players can only delete their own private videos
-- Staff can delete any video
CREATE POLICY "training_videos_delete_policy"
ON training_videos FOR DELETE
USING (
  is_staff_role()
  OR
  (visibility_type = 'private' AND created_by = (SELECT auth.uid()))
);

-- =====================================================
-- STEP 4: CREATE ATHLETE DRILL ASSIGNMENTS TABLE
-- =====================================================
-- This table tracks drill/video assignments with more detail
-- and links to periodization recalculation

CREATE TABLE IF NOT EXISTS athlete_drill_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Assignment details
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  video_id UUID REFERENCES training_videos(id) ON DELETE SET NULL,
  
  -- Drill details (can be independent of video)
  drill_name VARCHAR(255) NOT NULL,
  drill_description TEXT,
  drill_category VARCHAR(100), -- 'Speed', 'Agility', 'Strength', 'Skills', 'Recovery'
  
  -- Load and periodization impact
  estimated_duration_minutes INTEGER DEFAULT 15,
  estimated_rpe INTEGER DEFAULT 5 CHECK (estimated_rpe >= 1 AND estimated_rpe <= 10),
  estimated_load INTEGER GENERATED ALWAYS AS (estimated_duration_minutes * estimated_rpe) STORED,
  affects_periodization BOOLEAN DEFAULT TRUE,
  
  -- Scheduling
  assigned_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  target_session_date DATE,
  
  -- Completion tracking
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'viewed', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  actual_rpe INTEGER CHECK (actual_rpe >= 1 AND actual_rpe <= 10),
  actual_load INTEGER,
  
  -- Feedback
  athlete_notes TEXT,
  coach_feedback TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_athlete ON athlete_drill_assignments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_assigned_by ON athlete_drill_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_video ON athlete_drill_assignments(video_id);
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_status ON athlete_drill_assignments(status);
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_due_date ON athlete_drill_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_athlete_drill_assignments_date ON athlete_drill_assignments(target_session_date);

-- Enable RLS
ALTER TABLE athlete_drill_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for athlete_drill_assignments
-- Athletes can see their own assignments
CREATE POLICY "Athletes can view own drill assignments"
ON athlete_drill_assignments FOR SELECT
USING (
  athlete_id = (SELECT auth.uid())
  OR
  is_staff_role()
);

-- Only staff can create assignments
CREATE POLICY "Staff can create drill assignments"
ON athlete_drill_assignments FOR INSERT
WITH CHECK (is_staff_role());

-- Athletes can update their own (status, completion, notes)
-- Staff can update any
CREATE POLICY "Athletes and staff can update assignments"
ON athlete_drill_assignments FOR UPDATE
USING (
  athlete_id = (SELECT auth.uid())
  OR
  is_staff_role()
)
WITH CHECK (
  athlete_id = (SELECT auth.uid())
  OR
  is_staff_role()
);

-- Only staff can delete
CREATE POLICY "Staff can delete drill assignments"
ON athlete_drill_assignments FOR DELETE
USING (is_staff_role());

-- =====================================================
-- STEP 5: TRIGGERS FOR PERIODIZATION RECALCULATION
-- =====================================================

-- Function to notify periodization recalculation when drill is assigned
CREATE OR REPLACE FUNCTION notify_periodization_recalculation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if affects_periodization is true
  IF NEW.affects_periodization = TRUE THEN
    -- Insert a notification for the athlete
    INSERT INTO public.notifications (
      user_id, 
      notification_type, 
      message, 
      priority,
      created_at
    ) VALUES (
      NEW.athlete_id,
      'training',
      'New drill assigned: ' || NEW.drill_name || '. Your training load has been updated.',
      'medium',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Trigger on insert
DROP TRIGGER IF EXISTS trigger_periodization_on_drill_assignment ON athlete_drill_assignments;
CREATE TRIGGER trigger_periodization_on_drill_assignment
AFTER INSERT ON athlete_drill_assignments
FOR EACH ROW
EXECUTE FUNCTION notify_periodization_recalculation();

-- Function to update load when drill is completed
CREATE OR REPLACE FUNCTION update_load_on_drill_completion()
RETURNS TRIGGER AS $$
DECLARE
  load_value INTEGER;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate actual load
    IF NEW.actual_duration_minutes IS NOT NULL AND NEW.actual_rpe IS NOT NULL THEN
      load_value := NEW.actual_duration_minutes * NEW.actual_rpe;
    ELSE
      load_value := NEW.estimated_load;
    END IF;
    
    -- Update the actual_load field
    NEW.actual_load := load_value;
    NEW.completed_at := COALESCE(NEW.completed_at, NOW());
    
    -- If affects_periodization, update load_daily
    IF NEW.affects_periodization = TRUE THEN
      INSERT INTO public.load_daily (player_id, date, daily_load)
      VALUES (
        NEW.athlete_id, 
        COALESCE(NEW.target_session_date, CURRENT_DATE), 
        load_value
      )
      ON CONFLICT (player_id, date) 
      DO UPDATE SET 
        daily_load = public.load_daily.daily_load + EXCLUDED.daily_load,
        updated_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Trigger on update
DROP TRIGGER IF EXISTS trigger_load_on_drill_completion ON athlete_drill_assignments;
CREATE TRIGGER trigger_load_on_drill_completion
BEFORE UPDATE ON athlete_drill_assignments
FOR EACH ROW
EXECUTE FUNCTION update_load_on_drill_completion();

-- =====================================================
-- STEP 6: COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE training_videos IS 'Library of training videos with visibility controls (private/public/assigned)';

COMMENT ON COLUMN training_videos.visibility_type IS 
  'Video visibility: private (only creator), public (everyone), assigned (specific athlete + staff)';

COMMENT ON COLUMN training_videos.target_player_id IS 
  'For assigned videos, the specific athlete who should see this video';

COMMENT ON COLUMN training_videos.assigned_by IS 
  'Staff member who assigned this video to an athlete';

COMMENT ON COLUMN training_videos.affects_periodization IS 
  'Whether completing this drill should update the athlete''s training load';

COMMENT ON COLUMN training_videos.estimated_load IS 
  'Estimated training load contribution (RPE * duration)';

COMMENT ON TABLE athlete_drill_assignments IS 
  'Tracks drill/video assignments from staff to specific athletes with load tracking';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- 1. Created training_videos table with visibility_type column (private/public/assigned)
-- 2. Added target_player_id for assigned videos
-- 3. Created is_staff_role() helper function
-- 4. Created RLS policies enforcing visibility rules:
--    - Players see: public + their private + assigned to them
--    - Staff see: everything
--    - Players can only insert private videos
--    - Staff can insert any type
-- 5. Created athlete_drill_assignments table for detailed assignment tracking
-- 6. Created triggers to:
--    - Notify athlete when drill is assigned
--    - Update periodization (load_daily) when drill is completed
