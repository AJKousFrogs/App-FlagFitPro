-- Migration: Notifications Unification
-- Adds notification categories, preferences, and last_opened_at tracking

-- 1. Create notification_type enum
DO $$ BEGIN
    CREATE TYPE notification_type_enum AS ENUM (
        'training',
        'achievement',
        'team',
        'wellness',
        'general',
        'game',
        'tournament',
        'injury_risk',
        'weather'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add last_opened_at to users table (if not exists)
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_last_opened_at TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 3. Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    notification_type notification_type_enum NOT NULL,
    muted BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- 4. Add updated_at to notifications table if not exists
DO $$ BEGIN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 5. Update notification_type column to use enum (if possible, otherwise keep VARCHAR)
-- Note: We'll keep VARCHAR for now to avoid breaking existing data
-- The enum is available for validation in application code

-- 6. Add index for user_notification_preferences
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id 
    ON user_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_type 
    ON user_notification_preferences(notification_type);

-- 7. Add index for notifications on notification_type
CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON notifications(notification_type);

-- 8. Add index for notifications on created_at (for last_opened_at filtering)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON notifications(user_id, created_at DESC);

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_notification_updated_at ON notifications;
CREATE TRIGGER trigger_notification_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- 11. Create function to update user_notification_preferences updated_at
CREATE OR REPLACE FUNCTION update_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for preferences updated_at
DROP TRIGGER IF EXISTS trigger_preferences_updated_at ON user_notification_preferences;
CREATE TRIGGER trigger_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_preferences_updated_at();

-- 13. Insert default preferences for existing users (all types enabled)
INSERT INTO user_notification_preferences (user_id, notification_type, muted, push_enabled, in_app_enabled)
SELECT DISTINCT 
    u.id::text,
    unnest(ARRAY[
        'training'::notification_type_enum,
        'achievement'::notification_type_enum,
        'team'::notification_type_enum,
        'wellness'::notification_type_enum,
        'general'::notification_type_enum,
        'game'::notification_type_enum,
        'tournament'::notification_type_enum,
        'injury_risk'::notification_type_enum,
        'weather'::notification_type_enum
    ]),
    false,
    true,
    true
FROM users u
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- 14. Add RLS policies for user_notification_preferences
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can read their own notification preferences"
    ON user_notification_preferences
    FOR SELECT
    USING (user_id = (SELECT auth.uid())::text);

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences"
    ON user_notification_preferences
    FOR UPDATE
    USING (user_id = (SELECT auth.uid())::text)
    WITH CHECK (user_id = (SELECT auth.uid())::text);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences"
    ON user_notification_preferences
    FOR INSERT
    WITH CHECK (user_id = (SELECT auth.uid())::text);

