-- daily-protocol.js completion writes monthly rollups (month_sessions, month_load_au,
-- current_month with month-reset) to player_training_stats, but those columns never
-- existed -> the write silently failed (caught), so stats/streaks went stale. Add the
-- columns the code already references. Additive; defaults keep existing rows valid.
alter table public.player_training_stats
  add column if not exists month_sessions integer not null default 0,
  add column if not exists month_load_au numeric not null default 0,
  add column if not exists current_month text;
