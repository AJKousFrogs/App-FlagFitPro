// Tissue Load Engine — dedicated SPRINT-SESSION content (flag football).
//
// Sprinting is trained FRESH, as its own session (not buried after a scrimmage).
// Phases follow the accel -> max-velocity -> speed-endurance progression, plus
// resisted/assisted methods that bias the force- vs velocity-end of the curve.
// Quality over quantity: full recovery between max efforts; stop when times drag.
//
// Evidence: horizontal force/impulse drives acceleration (Morin & Samozino);
// max-velocity is an upright, front-side, high-stiffness quality; hamstrings are
// most exposed at top speed (terminal swing) — the accel/max-v split lets the
// engine dose that exposure. Tier HEURISTIC/COHORT (coaching + sports-science
// consensus). category `speed` (reachable via the conditioning block alias);
// speed-endurance is `conditioning`. subcategory tags the sprint phase.

const S = [];

const sprint = (extra) => ({
  category: "speed",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "very_high",
  evidenceTier: "COHORT",
  muscleGroups: ["glutes", "hamstrings", "quadriceps", "calves"],
  targetMuscles: ["gluteus maximus", "hamstrings"],
  positions: [],
  defaults: { sets: 5, reps: 3, rest: 180, loadAu: 18, difficulty: "advanced" },
  ...extra,
});

// ══ ACCELERATION — horizontal force, positive shin angles ═══════════════════
S.push(
  sprint({
    key: "sprint_accel",
    subcategory: "sprint_accel",
    movement: "sprint",
    movementPattern: "Acceleration",
    how: "Acceleration = putting force into the ground BEHIND you. Big positive shin angles, patient rise, push don't reach. Full recovery — this is a max-quality CNS session, not conditioning.",
    cues: [
      "Push the ground back, stay low and patient",
      "Positive shin angle — shin points forward",
      "Full recovery between reps — quality over quantity",
    ],
    variants: [
      { name: "3-Point Start Accelerations (10-20m)", ov: {} },
      { name: "2-Point Start Accelerations (10-20m)", ov: {} },
      { name: "Falling Start into Sprint", ov: {} },
      { name: "Push-Up Start Accelerations", ov: {} },
      { name: "Half-Kneeling Start Accelerations", ov: {} },
      { name: "Hill / Incline Accelerations", ov: { loadingRateBand: "high" } },
      { name: "Wall-Drive to Sprint Release", ov: {} },
      { name: "Build-and-Hold Acceleration Ladder", ov: {} },
      {
        name: "Prowler/Sled-Free Marching Accel",
        ov: { loadingRateBand: "high" },
      },
      { name: "Acceleration to Flag-Grab Finish", ov: { movement: "cutting" } },
    ],
  }),
);

// ══ MAX VELOCITY — upright, front-side, high stiffness ══════════════════════
S.push(
  sprint({
    key: "sprint_maxv",
    subcategory: "sprint_max_velocity",
    movement: "sprint",
    movementPattern: "Max Velocity",
    peakLoadBw: 5,
    how: "Top-end speed: tall posture, front-side mechanics, stiff/reactive ground contacts (hamstrings are most exposed here — terminal-swing lengthening). Needs a long runway and total freshness; do these early in the session.",
    cues: [
      "Tall and relaxed — no grinding",
      "Strike under the hip, hot ground",
      "Front-side knee drive, toe up",
    ],
    variants: [
      { name: "Flying 20m (Gradual Build-In)", ov: {} },
      { name: "Fly-In 30m (20m build + 10m max)", ov: {} },
      { name: "Wicket Runs (Ankling Rhythm)", ov: { loadingRateBand: "high" } },
      { name: "Upright Sprint-Float-Sprint", ov: {} },
      { name: "Max-Velocity Maintenance (40-60m)", ov: {} },
      { name: "In-and-Out (Accel-Float-Reaccel)", ov: {} },
      {
        name: "Track-and-Catch Deep Ball at Max-V",
        ov: { movement: "impact_run" },
      },
      {
        name: "Curved-Path Max Velocity (Route Speed)",
        ov: { movement: "cutting" },
      },
    ],
  }),
);

// ══ RESISTED / ASSISTED — bias the force or velocity end ════════════════════
S.push(
  sprint({
    key: "sprint_resisted",
    subcategory: "sprint_resisted_assisted",
    movement: "sprint",
    movementPattern: "Resisted / Assisted Sprint",
    how: "Resisted (sled/band) overloads horizontal force for acceleration; light assistance/overspeed rehearses higher limb velocity. Keep resistance light enough that mechanics hold (heavy sleds are their own strength stimulus, not speed).",
    cues: [
      "Mechanics first — drop the load if form breaks",
      "Resisted: drive the ground back",
      "Assisted: relax and let the turnover rise",
    ],
    variants: [
      {
        name: "Sled-Push Accelerations (Light)",
        ov: { loadingRateBand: "high" },
      },
      {
        name: "Sled-Pull Marches (Heavy, Force-Bias)",
        ov: { loadingRateBand: "high" },
      },
      {
        name: "Band-Resisted Acceleration Release",
        ov: { loadingRateBand: "high" },
      },
      { name: "Band-Assisted Overspeed Sprint", ov: {} },
      { name: "Partner-Towed Overspeed Run", ov: {} },
      { name: "Uphill-Downhill Contrast Sprints", ov: {} },
      { name: "Parachute-Resisted Max-V Run", ov: {} },
      {
        name: "Heavy-Light Contrast Accel Pair",
        ov: { loadingRateBand: "high" },
      },
    ],
  }),
);

// ══ REACTIVE / SPORT STARTS — get-off on a stimulus ═════════════════════════
S.push(
  sprint({
    key: "sprint_reactive",
    subcategory: "sprint_reactive_start",
    movement: "sprint",
    movementPattern: "Reactive Start",
    how: "Flag speed is reactive — you accelerate on a stimulus (snap, ball, defender), not a gun. Train get-offs and first-step quickness off visual/auditory cues so the acceleration transfers to the field.",
    cues: [
      "Explode on the cue — no false step",
      "First step down and back",
      "Beat the stimulus, not the clock",
    ],
    variants: [
      { name: "Ball-Movement Reaction Get-Off", ov: {} },
      { name: "Mirror-Start (React to Partner)", ov: { movement: "cutting" } },
      { name: "Ball-Drop Reaction Sprint", ov: {} },
      { name: "Rollover / Get-Up-and-Go Starts", ov: {} },
      { name: "Lateral-to-Linear Reaction Start", ov: { movement: "cutting" } },
      { name: "Backpedal-to-Turn-and-Run Start", ov: { movement: "cutting" } },
    ],
  }),
);

// ══ SPEED ENDURANCE — repeat-sprint ability (RSA) ═══════════════════════════
S.push(
  sprint({
    key: "sprint_endurance",
    subcategory: "sprint_speed_endurance",
    category: "conditioning",
    movement: "impact_run",
    movementPattern: "Speed Endurance",
    loadingRateBand: "high",
    evidenceTier: "COHORT",
    defaults: {
      sets: 6,
      reps: 2,
      rest: 120,
      loadAu: 16,
      difficulty: "advanced",
    },
    how: "Repeat-sprint ability — hold sprint quality across repeated efforts with incomplete recovery, mirroring a flag point's work:rest. Speed-endurance, not aerobic base; keep the sprints fast and honest, let quality (not the clock) end the set.",
    cues: [
      "Hold your speed — quality, not survival",
      "Honest work, full effort each rep",
      "Stop the set when times fall off a cliff",
    ],
    variants: [
      { name: "Repeat 40s (Full Effort, Short Rest)", ov: {} },
      { name: "Repeat 60s (Speed Endurance)", ov: {} },
      { name: "Sprint-Float-Sprint 80-120m", ov: {} },
      { name: "Flying-30 Repeats", ov: {} },
      { name: "Shuttle Repeat-Sprint (RSA)", ov: { movement: "cutting" } },
      { name: "Position-Specific Repeat Routes", ov: { movement: "cutting" } },
      {
        name: "Extensive Tempo Runs (Aerobic Support)",
        ov: { loadingRateBand: "moderate", evidenceTier: "HEURISTIC" },
      },
      { name: "Broken-Field Repeat Sprints", ov: { movement: "cutting" } },
    ],
  }),
);

export const FAMILIES_SPRINT = S;
