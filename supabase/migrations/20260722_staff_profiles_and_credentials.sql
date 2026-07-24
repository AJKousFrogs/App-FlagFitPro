-- =====================================================
-- TIER 1: Staff Profiles & Credential Verification
-- Purpose: Support 8 user roles with role-specific data
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREDENTIAL VERIFICATION TABLE (Cross-role)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.credential_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_type VARCHAR(100) NOT NULL, -- 'license', 'certification', 'degree', 'training'
  credential_name VARCHAR(255) NOT NULL, -- e.g., "PT License", "CSCS Certification"
  issuing_body VARCHAR(255), -- e.g., "APTA", "NSCA"
  credential_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT, -- S3 URL to uploaded credential
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_by UUID REFERENCES auth.users(id), -- Admin who verified
  verification_notes TEXT,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_credential_verifications_user_id ON public.credential_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_credential_verifications_status ON public.credential_verifications(status);

-- =====================================================
-- 2. PHYSIOTHERAPIST PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.physiotherapist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number VARCHAR(100),
  license_issued_by VARCHAR(255), -- Country/State regulatory body
  specializations TEXT[] DEFAULT '{}', -- e.g., ['orthopedic', 'sports_medicine', 'manual_therapy']
  years_of_experience INTEGER,
  education_background TEXT, -- e.g., "BS PT from University X"
  insurance_provider VARCHAR(255),
  insurance_policy_number VARCHAR(255),
  insurance_expiry_date DATE,
  bio TEXT,
  credentials_verified BOOLEAN DEFAULT false,
  verification_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_physiotherapist_profiles_user_id ON public.physiotherapist_profiles(user_id);

-- =====================================================
-- 3. NUTRITIONIST PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.nutritionist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_type VARCHAR(100), -- 'RD', 'RDN', 'MS_Nutrition', 'certification'
  credential_number VARCHAR(100),
  credential_issuing_body VARCHAR(255), -- e.g., 'CDR', 'State Board'
  specializations TEXT[] DEFAULT '{}', -- e.g., ['sports_nutrition', 'performance', 'weight_management']
  years_of_experience INTEGER,
  education_background TEXT,
  certifications TEXT[] DEFAULT '{}', -- e.g., ['ISSN-SNS', 'CISSN']
  bio TEXT,
  credentials_verified BOOLEAN DEFAULT false,
  verification_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nutritionist_profiles_user_id ON public.nutritionist_profiles(user_id);

-- =====================================================
-- 4. PSYCHOLOGIST PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.psychologist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number VARCHAR(100),
  license_issued_by VARCHAR(255), -- Country/State regulatory body
  degree_type VARCHAR(100), -- 'PhD', 'PsyD', 'MS'
  degree_field VARCHAR(255),
  specializations TEXT[] DEFAULT '{}', -- e.g., ['sport_psychology', 'mental_health', 'performance']
  years_of_experience INTEGER,
  education_background TEXT,
  certifications TEXT[] DEFAULT '{}', -- e.g., ['AAPA', 'USOC']
  bio TEXT,
  credentials_verified BOOLEAN DEFAULT false,
  verification_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_psychologist_profiles_user_id ON public.psychologist_profiles(user_id);

-- =====================================================
-- 5. STRENGTH & CONDITIONING COACH PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.strength_coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  certifications TEXT[] DEFAULT '{}', -- e.g., ['CSCS', 'NSCA-CPT', 'CF-L1']
  primary_certification VARCHAR(100), -- e.g., 'CSCS'
  certification_issued_by VARCHAR(255), -- e.g., 'NSCA'
  specializations TEXT[] DEFAULT '{}', -- e.g., ['powerlifting', 'olympic_lifting', 'football']
  years_of_experience INTEGER,
  education_background TEXT, -- e.g., 'BS Kinesiology'
  bio TEXT,
  credentials_verified BOOLEAN DEFAULT false,
  verification_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strength_coach_profiles_user_id ON public.strength_coach_profiles(user_id);

-- =====================================================
-- 6. COACH PROFILES (Head Coach, Assistant Coach, Position Coach)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  coaching_license_number VARCHAR(100),
  coaching_license_issued_by VARCHAR(255), -- Country/Federation
  coach_specialty VARCHAR(100), -- 'head_coach', 'offense_coordinator', 'defense_coordinator', 'position_coach', 'assistant_coach'
  position_specialization VARCHAR(255), -- e.g., 'QB', 'DB', etc. (for position coaches)
  years_of_coaching_experience INTEGER,
  education_background TEXT,
  coaching_certifications TEXT[] DEFAULT '{}', -- e.g., ['USA_Football', 'Level_1']
  coaching_philosophy TEXT,
  bio TEXT,
  credentials_verified BOOLEAN DEFAULT false,
  verification_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON public.coach_profiles(user_id);

-- =====================================================
-- 7. MANAGER PROFILES (Team Manager)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.manager_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  education_background TEXT,
  years_of_experience INTEGER,
  management_specialization VARCHAR(255), -- e.g., 'operations', 'administrative', 'logistics'
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manager_profiles_user_id ON public.manager_profiles(user_id);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.credential_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physiotherapist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutritionist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychologist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strength_coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.credential_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON public.credential_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON public.credential_verifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all credentials for verification
CREATE POLICY "Admins can view all credentials"
  ON public.credential_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Same pattern for all profile tables
CREATE POLICY "Users can view own physiotherapist profile"
  ON public.physiotherapist_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own physiotherapist profile"
  ON public.physiotherapist_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own physiotherapist profile"
  ON public.physiotherapist_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Same for nutritionist, psychologist, strength coach, coach, manager
CREATE POLICY "Users can view own nutritionist profile"
  ON public.nutritionist_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own nutritionist profile"
  ON public.nutritionist_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutritionist profile"
  ON public.nutritionist_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own psychologist profile"
  ON public.psychologist_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own psychologist profile"
  ON public.psychologist_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own psychologist profile"
  ON public.psychologist_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own strength coach profile"
  ON public.strength_coach_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own strength coach profile"
  ON public.strength_coach_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strength coach profile"
  ON public.strength_coach_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own coach profile"
  ON public.coach_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own coach profile"
  ON public.coach_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coach profile"
  ON public.coach_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own manager profile"
  ON public.manager_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own manager profile"
  ON public.manager_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own manager profile"
  ON public.manager_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMIT;
