-- =====================================================
-- Seed Test Accounts for FlagFit Pro
-- =====================================================
-- Creates test accounts for development and testing
-- 
-- Test credentials:
--   Player: test@flagfitpro.com / TestPassword123!
--   Coach: coach.test@flagfitpro.com / TestPassword123!
--
-- PREREQUISITES:
-- - Supabase Auth schema must be initialized
-- - This script requires direct access to auth.users table
-- - For Supabase, ensure Supabase Auth is properly configured
--
-- USAGE:
-- Run this script after schema.sql to create test accounts
-- Safe to run multiple times (idempotent)
-- =====================================================

-- Delete existing test accounts (idempotent - safe to run multiple times)
DELETE FROM auth.users WHERE email IN ('test@flagfitpro.com', 'coach.test@flagfitpro.com');
DELETE FROM public.users WHERE email IN ('test@flagfitpro.com', 'coach.test@flagfitpro.com');

-- Create test accounts via Supabase Auth

-- Player test account
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  is_sso_user
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@flagfitpro.com',
  crypt('TestPassword123!', gen_salt('bf')),
  NOW(), -- pre-verified
  '{"role": "player", "name": "Test User", "first_name": "Test", "last_name": "User"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  NOW(),
  NOW(),
  '',
  false
);

-- Coach test account
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  is_sso_user
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'coach.test@flagfitpro.com',
  crypt('TestPassword123!', gen_salt('bf')),
  NOW(), -- pre-verified
  '{"role": "coach", "name": "Coach Test", "first_name": "Coach", "last_name": "Test"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  NOW(),
  NOW(),
  '',
  false
);

-- Verify accounts were created
SELECT
  email,
  email_confirmed_at,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'name' as name
FROM auth.users
WHERE email IN ('test@flagfitpro.com', 'coach.test@flagfitpro.com');
