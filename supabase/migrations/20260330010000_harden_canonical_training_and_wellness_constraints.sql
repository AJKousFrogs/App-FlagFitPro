-- ============================================================================
-- Harden canonical training / wellness write tables with value constraints
-- ============================================================================

ALTER TABLE public.daily_wellness_checkin
  DROP CONSTRAINT IF EXISTS daily_wellness_checkin_sleep_hours_check,
  ADD CONSTRAINT daily_wellness_checkin_sleep_hours_check
    CHECK (sleep_hours IS NULL OR (sleep_hours >= 0 AND sleep_hours <= 24)),
  DROP CONSTRAINT IF EXISTS daily_wellness_checkin_calculated_readiness_check,
  ADD CONSTRAINT daily_wellness_checkin_calculated_readiness_check
    CHECK (
      calculated_readiness IS NULL
      OR (calculated_readiness >= 0 AND calculated_readiness <= 100)
    );

ALTER TABLE public.training_sessions
  DROP CONSTRAINT IF EXISTS training_sessions_duration_minutes_check,
  ADD CONSTRAINT training_sessions_duration_minutes_check
    CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
  DROP CONSTRAINT IF EXISTS training_sessions_verification_confidence_check,
  ADD CONSTRAINT training_sessions_verification_confidence_check
    CHECK (
      verification_confidence IS NULL
      OR (verification_confidence >= 0 AND verification_confidence <= 1)
    ),
  DROP CONSTRAINT IF EXISTS training_sessions_performance_score_check,
  ADD CONSTRAINT training_sessions_performance_score_check
    CHECK (
      performance_score IS NULL
      OR (performance_score >= 0 AND performance_score <= 100)
    ),
  DROP CONSTRAINT IF EXISTS training_sessions_workload_check,
  ADD CONSTRAINT training_sessions_workload_check
    CHECK (workload IS NULL OR workload >= 0);

ALTER TABLE public.daily_protocols
  DROP CONSTRAINT IF EXISTS daily_protocols_readiness_score_check,
  ADD CONSTRAINT daily_protocols_readiness_score_check
    CHECK (readiness_score IS NULL OR (readiness_score >= 0 AND readiness_score <= 100)),
  DROP CONSTRAINT IF EXISTS daily_protocols_acwr_value_check,
  ADD CONSTRAINT daily_protocols_acwr_value_check
    CHECK (acwr_value IS NULL OR acwr_value >= 0),
  DROP CONSTRAINT IF EXISTS daily_protocols_total_load_target_au_check,
  ADD CONSTRAINT daily_protocols_total_load_target_au_check
    CHECK (total_load_target_au IS NULL OR total_load_target_au >= 0),
  DROP CONSTRAINT IF EXISTS daily_protocols_overall_progress_check,
  ADD CONSTRAINT daily_protocols_overall_progress_check
    CHECK (overall_progress IS NULL OR (overall_progress >= 0 AND overall_progress <= 100)),
  DROP CONSTRAINT IF EXISTS daily_protocols_completed_exercises_check,
  ADD CONSTRAINT daily_protocols_completed_exercises_check
    CHECK (completed_exercises IS NULL OR completed_exercises >= 0),
  DROP CONSTRAINT IF EXISTS daily_protocols_total_exercises_check,
  ADD CONSTRAINT daily_protocols_total_exercises_check
    CHECK (total_exercises IS NULL OR total_exercises >= 0),
  DROP CONSTRAINT IF EXISTS daily_protocols_completed_vs_total_check,
  ADD CONSTRAINT daily_protocols_completed_vs_total_check
    CHECK (
      completed_exercises IS NULL
      OR total_exercises IS NULL
      OR completed_exercises <= total_exercises
    ),
  DROP CONSTRAINT IF EXISTS daily_protocols_actual_duration_minutes_check,
  ADD CONSTRAINT daily_protocols_actual_duration_minutes_check
    CHECK (
      actual_duration_minutes IS NULL
      OR (actual_duration_minutes >= 0 AND actual_duration_minutes <= 1440)
    ),
  DROP CONSTRAINT IF EXISTS daily_protocols_actual_load_au_check,
  ADD CONSTRAINT daily_protocols_actual_load_au_check
    CHECK (actual_load_au IS NULL OR actual_load_au >= 0);

ALTER TABLE public.protocol_exercises
  DROP CONSTRAINT IF EXISTS protocol_exercises_sequence_order_check,
  ADD CONSTRAINT protocol_exercises_sequence_order_check
    CHECK (sequence_order >= 1),
  DROP CONSTRAINT IF EXISTS protocol_exercises_prescribed_sets_check,
  ADD CONSTRAINT protocol_exercises_prescribed_sets_check
    CHECK (prescribed_sets IS NULL OR prescribed_sets >= 0),
  DROP CONSTRAINT IF EXISTS protocol_exercises_prescribed_reps_check,
  ADD CONSTRAINT protocol_exercises_prescribed_reps_check
    CHECK (prescribed_reps IS NULL OR prescribed_reps >= 0),
  DROP CONSTRAINT IF EXISTS protocol_exercises_prescribed_hold_seconds_check,
  ADD CONSTRAINT protocol_exercises_prescribed_hold_seconds_check
    CHECK (prescribed_hold_seconds IS NULL OR prescribed_hold_seconds >= 0),
  DROP CONSTRAINT IF EXISTS protocol_exercises_prescribed_duration_seconds_check,
  ADD CONSTRAINT protocol_exercises_prescribed_duration_seconds_check
    CHECK (prescribed_duration_seconds IS NULL OR prescribed_duration_seconds >= 0),
  DROP CONSTRAINT IF EXISTS protocol_exercises_prescribed_weight_kg_check,
  ADD CONSTRAINT protocol_exercises_prescribed_weight_kg_check
    CHECK (prescribed_weight_kg IS NULL OR prescribed_weight_kg >= 0),
  DROP CONSTRAINT IF EXISTS protocol_exercises_actual_sets_check,
  ADD CONSTRAINT protocol_exercises_actual_sets_check
    CHECK (actual_sets IS NULL OR actual_sets >= 0),
  DROP CONSTRAINT IF EXISTS protocol_exercises_actual_reps_check,
  ADD CONSTRAINT protocol_exercises_actual_reps_check
    CHECK (actual_reps IS NULL OR actual_reps >= 0),
  DROP CONSTRAINT IF EXISTS protocol_exercises_actual_hold_seconds_check,
  ADD CONSTRAINT protocol_exercises_actual_hold_seconds_check
    CHECK (actual_hold_seconds IS NULL OR actual_hold_seconds >= 0),
  DROP CONSTRAINT IF EXISTS protocol_exercises_actual_duration_seconds_check,
  ADD CONSTRAINT protocol_exercises_actual_duration_seconds_check
    CHECK (actual_duration_seconds IS NULL OR actual_duration_seconds >= 0),
  DROP CONSTRAINT IF EXISTS protocol_exercises_actual_weight_kg_check,
  ADD CONSTRAINT protocol_exercises_actual_weight_kg_check
    CHECK (actual_weight_kg IS NULL OR actual_weight_kg >= 0),
  DROP CONSTRAINT IF EXISTS protocol_exercises_load_contribution_au_check,
  ADD CONSTRAINT protocol_exercises_load_contribution_au_check
    CHECK (load_contribution_au IS NULL OR load_contribution_au >= 0);
