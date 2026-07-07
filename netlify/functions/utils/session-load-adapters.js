// Session-load provider ADAPTERS.
//
// Each adapter maps ONE provider's export row to the canonical session_load
// shape. The import engine (session-load-import.js) is provider-agnostic: it only
// calls the adapter interface below. Adding a provider = add an adapter object to
// `ADAPTERS` (a mapping) — you never edit the engine.
//
// Adapter interface:
//   provider           : string (matches monitoring_providers.key)
//   externalAthleteId(row) -> string   the provider's athlete id (for pairing)
//   sessionId(row)         -> string   the provider's session/activity id
//   recordedAt(row)        -> ISO ts   the session timestamp
//   map(row)               -> object   canonical session_load column subset

const num = (v) =>
  v === null || v === undefined || v === "" ? null : Number(v);
const int = (v) =>
  v === null || v === undefined || v === "" ? null : Math.trunc(Number(v));
// Accept snake_case, "Title Case", and vendor variants for the same field.
const pick = (row, ...keys) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") {
      return row[k];
    }
  }
  return null;
};

const catapultAdapter = {
  provider: "catapult",
  externalAthleteId: (r) => pick(r, "athlete_id", "Athlete Id", "player_id"),
  sessionId: (r) => pick(r, "activity_id", "Activity Id", "session_id"),
  recordedAt: (r) => pick(r, "start_time", "Start Time", "date"),
  map: (r) => ({
    player_load: num(
      pick(r, "player_load", "Player Load", "total_player_load"),
    ),
    player_load_per_min: num(
      pick(r, "player_load_per_minute", "Player Load Per Minute", "pl_per_min"),
    ),
    high_ima: int(pick(r, "ima_high", "IMA High")),
    jump_count: int(pick(r, "jumps", "Jumps", "jump_count")),
    landing_count: int(pick(r, "landings", "Landings", "landing_count")),
    landing_asymmetry_pct: num(
      pick(r, "landing_asymmetry", "Landing Asymmetry"),
    ),
    cod_total: int(pick(r, "cod_total", "Change of Direction")),
    cod_planned: int(pick(r, "cod_planned")),
    cod_reactive: int(pick(r, "cod_reactive")),
    cod_band1_count: int(pick(r, "cod_low")),
    cod_band2_count: int(pick(r, "cod_medium")),
    cod_band3_count: int(pick(r, "cod_high")),
    accel_total: int(pick(r, "accel_total", "Accelerations")),
    accel_band1_count: int(pick(r, "accel_b1", "Accel Zone 1")),
    accel_band2_count: int(pick(r, "accel_b2", "Accel Zone 2")),
    accel_band3_count: int(pick(r, "accel_b3", "Accel Zone 3")),
    decel_total: int(pick(r, "decel_total", "Decelerations")),
    decel_band1_count: int(pick(r, "decel_b1", "Decel Zone 1")),
    decel_band2_count: int(pick(r, "decel_b2", "Decel Zone 2")),
    decel_band3_count: int(pick(r, "decel_b3", "Decel Zone 3")),
    total_distance_m: num(pick(r, "total_distance", "Total Distance")),
    hsr_distance_m: num(pick(r, "hsr_distance", "High Speed Distance")),
    max_velocity_kmh: num(pick(r, "max_velocity", "Max Velocity")),
    sprint_count: int(pick(r, "sprints", "Sprints")),
    sprint_distance_m: num(pick(r, "sprint_distance", "Sprint Distance")),
    hr_max: int(pick(r, "hr_max", "Max HR")),
    hr_avg: int(pick(r, "hr_avg", "Avg HR")),
    trimp: num(pick(r, "trimp", "TRIMP")),
    session_context: pick(r, "period_name", "Period Name", "session_type"),
  }),
};

// A SECOND provider, added purely by writing a mapping (proves the interface):
// STATSports column names differ, the engine does not change.
const statsportsAdapter = {
  provider: "statsports",
  externalAthleteId: (r) => pick(r, "PlayerId", "player_ref"),
  sessionId: (r) => pick(r, "SessionId", "session_ref"),
  recordedAt: (r) => pick(r, "SessionStart", "start"),
  map: (r) => ({
    player_load: num(pick(r, "DynamicStressLoad", "DSL")),
    player_load_per_min: num(pick(r, "DSLPerMinute")),
    total_distance_m: num(pick(r, "TotalDistance")),
    hsr_distance_m: num(pick(r, "HighSpeedDistance")),
    max_velocity_kmh: num(pick(r, "MaxSpeed")),
    sprint_count: int(pick(r, "SprintCount")),
    sprint_distance_m: num(pick(r, "SprintDistance")),
    accel_total: int(pick(r, "AccelerationCount")),
    decel_total: int(pick(r, "DecelerationCount")),
    hr_max: int(pick(r, "MaxHeartRate")),
    hr_avg: int(pick(r, "AvgHeartRate")),
  }),
};

const ADAPTERS = Object.freeze({
  catapult: catapultAdapter,
  statsports: statsportsAdapter,
});

export function getAdapter(provider) {
  return ADAPTERS[provider] ?? null;
}
export function listProviders() {
  return Object.keys(ADAPTERS);
}
