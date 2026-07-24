import { supabaseAdmin } from "../supabase-client.js";

// Per-game internal load (session-RPE AU) by GAME FORMAT. MIRROR of GAME_FORMATS
// in angular/src/app/core/config/position-volume.config.ts (keep in sync). A
// flag-football game is high-intensity intermittent; the heavier the format, the
// higher the single-game load. Injected into a load map for PAST games so a
// tournament's acute load RISES instead of reading falsely safe.
//
// Single source of truth (CLAUDE.md §4) — extracted 2026-07-25 from
// calc-readiness.js so daily-load.js (the Stats load-calendar) can fold in the
// same past-game estimate ACWR already used, instead of re-deriving it a second
// time. calc-readiness.js re-exports estimateGameLoads for its own existing
// test import path (tests/unit/game-load-injection.test.js).
export const GAME_LOAD_AU = {
  domestic_2x12_stop: 300,
  running_2x15: 350,
  ifaf_2x20: 450,
};

/**
 * Resolve a game's internal load from its format, else its competition level,
 * else the heaviest format — an unknown game is never UNDER-counted (the safe
 * direction). Mirrors resolveGameFormat() in the client config.
 */
export function gameLoadAuFor(gameFormat, competitionLevel) {
  if (gameFormat && GAME_LOAD_AU[gameFormat]) {
    return GAME_LOAD_AU[gameFormat];
  }
  const lvl = String(competitionLevel || "").toLowerCase();
  if (lvl === "international") {
    return GAME_LOAD_AU.ifaf_2x20;
  }
  if (lvl === "national" || lvl === "club") {
    return GAME_LOAD_AU.domestic_2x12_stop;
  }
  return GAME_LOAD_AU.ifaf_2x20; // unknown → heaviest (conservative)
}

/**
 * Build a daily estimated-load Map for PAST games in [startDate, endDate]. Pure
 * (no I/O) so it is unit-testable. Each game's load scales with its FORMAT/level;
 * a multi-day event's total game load is spread evenly across its calendar days
 * within the window. Only events carrying a positive expected_game_count count.
 * dateKey = 'YYYY-MM-DD'.
 */
export function estimateGameLoads(events, startDate, endDate) {
  const out = new Map();
  for (const ev of events || []) {
    const games = Number(ev?.expected_game_count);
    if (!Number.isFinite(games) || games <= 0 || !ev.starts_at) {
      continue;
    }
    const perGame = gameLoadAuFor(ev.game_format, ev.competition_level);
    const start = new Date(ev.starts_at);
    const end = ev.ends_at ? new Date(ev.ends_at) : start;
    if (Number.isNaN(start.getTime())) {
      continue;
    }
    const days = [];
    const cur = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
    );
    const last = Number.isNaN(end.getTime())
      ? cur
      : new Date(
          Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
        );
    let guard = 0;
    while (cur <= last && guard < 31) {
      const key = cur.toISOString().slice(0, 10);
      if (key >= startDate && key <= endDate) {
        days.push(key);
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
      guard += 1;
    }
    if (days.length === 0) {
      continue;
    }
    const perDay = (games * perGame) / days.length;
    for (const key of days) {
      out.set(key, (out.get(key) || 0) + perDay);
    }
  }
  return out;
}

/** Read PAST games from the schedule spine and estimate their daily load. Fails
 * safe (empty map) if the spine view is unavailable. */
export async function fetchPastGameLoads(athleteId, startDate, endDate) {
  try {
    const { data, error } = await supabaseAdmin
      .from("v_athlete_schedule")
      .select("starts_at, ends_at, expected_game_count, competition_level")
      .eq("user_id", athleteId)
      .gte("starts_at", startDate)
      .lte("starts_at", `${endDate}T23:59:59`)
      .neq("status", "cancelled");
    if (error || !Array.isArray(data)) {
      return new Map();
    }
    return estimateGameLoads(data, startDate, endDate);
  } catch {
    return new Map();
  }
}
