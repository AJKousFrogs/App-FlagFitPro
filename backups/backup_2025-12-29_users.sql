-- FlagFit Pro Database Backup
-- Table: users
-- Backup Date: 2025-12-29
-- Records: 8

-- Clear existing data (optional - uncomment if needed)
-- TRUNCATE TABLE users CASCADE;

INSERT INTO users (id, email, password_hash, first_name, last_name, position, experience_level, height_cm, weight_kg, birth_date, profile_picture, bio, is_active, email_verified, last_login, created_at, updated_at, full_name, verification_token, verification_token_expires_at, username, notification_last_opened_at, team, jersey_number, preferred_units, date_of_birth, gender, phone, secondary_position, throwing_arm, profile_photo_url, onboarding_completed, gdpr_consent_given, gdpr_consent_date)
VALUES
  ('f31b59e5-8a73-4afb-a444-f80b728a8a54', 'coach@flagfit.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWK.3nE8WYWj8w7WCTzSO5UK', 'Mike', 'Johnson', 'QB', 'beginner', NULL, NULL, NULL, NULL, NULL, true, false, NULL, '2025-07-31 19:04:22.336', '2025-07-31 19:04:22.336', 'Mike Johnson', NULL, NULL, NULL, NULL, NULL, NULL, 'metric', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  ('71d03b4d-563d-4b4f-acb1-9cbb5c74127a', 'player@flagfit.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWK.3nE8WYWj8w7WCTzSO5UK', 'Alex', 'Thompson', 'WR', 'beginner', NULL, NULL, NULL, NULL, NULL, true, false, NULL, '2025-07-31 19:04:22.386', '2025-07-31 19:04:22.386', 'Alex Thompson', NULL, NULL, NULL, NULL, NULL, NULL, 'metric', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  ('7cdb0e51-aab1-4aac-a501-4d75394e6bc3', 'test@flagfit.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWK.3nE8WYWj8w7WCTzSO5UK', 'Test', 'User', 'WR', 'beginner', NULL, NULL, NULL, NULL, NULL, true, false, NULL, '2025-07-31 19:18:29.12', '2025-07-31 19:18:29.12', 'Test User', NULL, NULL, NULL, NULL, NULL, NULL, 'metric', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  ('870f3deb-67f4-4048-95ba-beaa9045168d', 'demo@flagfit.com', '$2b$10$WXa2YwwtiswZhWJFpwNFiuycs0o/Tjd6hnlTyvRW9.8kKqd2PbDtq', 'Demo', 'User', 'WR', 'intermediate', NULL, NULL, NULL, NULL, NULL, true, true, NULL, '2025-08-01 15:57:57.053', '2025-08-01 15:57:57.053', 'Demo User', NULL, NULL, NULL, NULL, NULL, NULL, 'metric', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  ('2773321a-e7a2-4da0-b1dc-d4498df853e9', 'test@example.com', '$2a$12$04GS0oEVDQ2Xd6r9ijQu9uVsfmvKFNS1o/./C4kdu0IIIJjuQgYDW', 'test', '', NULL, 'beginner', NULL, NULL, NULL, NULL, NULL, true, false, NULL, '2025-10-04 17:32:59.44', '2025-10-04 17:32:59.44', 'test', NULL, NULL, NULL, NULL, NULL, NULL, 'metric', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  ('39698f94-8a7a-45e1-a1fc-1a985272509a', 'test1@flagfitpro.com', '$2a$12$cuiWuMGOsIUwWwNGnKad5uJZvzavfkPdCpkVD.juuFGnSR420Bzy2', 'test1', '', NULL, 'beginner', NULL, NULL, NULL, NULL, NULL, true, false, NULL, '2025-10-04 17:34:17.819', '2025-10-04 17:34:17.819', 'test1', NULL, NULL, NULL, NULL, NULL, NULL, 'metric', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  ('81b75494-c572-47e0-a3b1-2d978780ae97', 'test@email.com', '$2a$12$74iX2eQRkZ8lVeccfCNl.erpQFqVVAa0TlHrU1maMzjM4s9gegXSu', 'test', '', NULL, 'beginner', NULL, NULL, NULL, NULL, NULL, true, false, NULL, '2025-10-04 17:37:25.474', '2025-10-04 17:37:25.474', 'test', NULL, NULL, NULL, NULL, NULL, NULL, 'metric', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  ('ed6d1208-9450-4b94-b6dc-22d97a9021ed', 'aljkous@gmail.com', '$2a$10$8zlt3VZ4xMqV2lfsre7V.e0xj1juBUoZuv1M9hg4mP9M1hMYsGN7e', 'Aljoša', 'Kous', NULL, 'beginner', NULL, NULL, NULL, NULL, NULL, true, false, NULL, '2025-12-06 14:09:00.556577', '2025-12-06 14:09:00.556577', NULL, '780f898884f5e62b5c34bd26c36bec72e13ba23d02a013ef213615f163b036fe', '2025-12-07 14:09:00.281+00', NULL, NULL, NULL, NULL, 'metric', NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  position = EXCLUDED.position,
  experience_level = EXCLUDED.experience_level,
  is_active = EXCLUDED.is_active,
  email_verified = EXCLUDED.email_verified,
  updated_at = NOW();

