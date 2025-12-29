-- FlagFit Pro Database Backup
-- Table: flag_football_positions
-- Backup Date: 2025-12-29
-- Records: 8

INSERT INTO flag_football_positions (id, position_name, position_category, primary_responsibilities, physical_requirements, technical_skills, tactical_understanding, created_at)
VALUES
  (1, 'Quarterback', 'offense', '["Throw passes","Read defenses","Call plays","Scramble when needed"]', '{"accuracy":"critical","mobility":"high","arm_strength":"high","decision_making":"critical"}', '["Throwing mechanics","Quick release","Footwork","Scrambling"]', '["Defensive recognition","Coverage reads","Play calling","Clock management"]', '2025-08-17 20:08:18.752+00'),
  (2, 'Receiver', 'offense', '["Run routes","Catch passes","Create separation","Evade defenders"]', '{"hands":"critical","speed":"critical","agility":"high","acceleration":"high"}', '["Route running","Catching","Release moves","After-catch evasion"]', '["Route concepts","Defensive recognition","Hot routes","Timing patterns"]', '2025-08-17 20:08:18.752+00'),
  (4, 'Center', 'offense', '["Snap the ball","Run routes","Block (screen)","Eligible receiver"]', '{"hands":"high","speed":"medium","route_running":"high","snap_accuracy":"critical"}', '["Snapping","Route running","Screen blocking","Catching"]', '["Play timing","Route concepts","Protection schemes","Hot routes"]', '2025-08-17 20:08:18.752+00'),
  (5, 'Rusher', 'defense', '["Rush the quarterback","Get flags","Disrupt plays","Apply pressure"]', '{"speed":"high","agility":"high","acceleration":"critical","reaction_time":"critical"}', '["Rush timing","Flag pulling","Pursuit angles","Hand-eye coordination"]', '["Blitz timing","Coverage recognition","Play reading","Gap responsibility"]', '2025-08-17 20:08:18.752+00'),
  (6, 'Defensive Back', 'defense', '["Cover receivers","Pull flags","Zone coverage","Man coverage"]', '{"speed":"high","agility":"critical","backpedal":"high","reaction_time":"critical"}', '["Backpedaling","Hip turns","Flag pulling","Ball tracking"]', '["Route recognition","Coverage schemes","Zone responsibilities","Help defense"]', '2025-08-17 20:08:18.752+00'),
  (7, 'Defensive Back', 'defense', '["Cover receivers","Pull flags","Zone coverage","Man coverage"]', '{"speed":"high","agility":"critical","backpedal":"high","reaction_time":"critical"}', '["Backpedaling","Hip turns","Flag pulling","Ball tracking"]', '["Route recognition","Coverage schemes","Zone responsibilities","Help defense"]', '2025-08-17 20:08:18.752+00'),
  (8, 'Defensive Back', 'defense', '["Cover receivers","Pull flags","Zone coverage","Man coverage"]', '{"speed":"high","agility":"critical","backpedal":"high","reaction_time":"critical"}', '["Backpedaling","Hip turns","Flag pulling","Ball tracking"]', '["Route recognition","Coverage schemes","Zone responsibilities","Help defense"]', '2025-08-17 20:08:18.752+00'),
  (11, 'Utility', 'offense', '["Play multiple positions","Adapt to game situations","Fill gaps in lineup","Special plays"]', '{"speed":"high","agility":"high","football_iq":"high","versatility":"critical"}', '["Multiple position skills","Quick adaptation","Route running","Flag pulling"]', '["Full playbook knowledge","Situational awareness","Team coordination","Audible recognition"]', '2025-12-26 13:12:27.474186+00')
ON CONFLICT (id) DO UPDATE SET
  position_name = EXCLUDED.position_name,
  position_category = EXCLUDED.position_category,
  primary_responsibilities = EXCLUDED.primary_responsibilities,
  physical_requirements = EXCLUDED.physical_requirements,
  technical_skills = EXCLUDED.technical_skills,
  tactical_understanding = EXCLUDED.tactical_understanding;

