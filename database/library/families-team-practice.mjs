// Tissue Load Engine — TEAM-PRACTICE block content (flag football).
//
// These drills fill the time-boxed blocks of a periodized team practice (see
// docs/ground-truth/team-practice-periodization.md). Each family carries a
// family-level `subcategory` = the practice BLOCK KEY the plan generator pulls:
//   team_warmup · wr_block · db_block · routes_coverage · team_install ·
//   qb_center_post · blitzer_cooldown · team_cooldown · conditioning_game
//
// No contact, no tackling — defenders finish with FLAG-PULLS and leverage. All
// drills still carry tissue_targets + loading_rate_band so a team-practice day
// feeds ACWR/CNS/tissue accounting like any other session (no silent load).
// Evidence tier is mostly HEURISTIC (established coaching practice) or CONSENSUS.

const T = [];

// ══ WARM-UP (20 min): iso + plyo + conditioning, season-flavoured, fun ═══════
T.push({
  key: "tp_warmup",
  category: "warm_up",
  subcategory: "team_warmup",
  movement: "impact_run",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "moderate",
  evidenceTier: "HEURISTIC",
  movementPattern: "Team Warm-Up",
  muscleGroups: ["quadriceps", "glutes", "calves", "hip flexors"],
  targetMuscles: ["quadriceps", "gluteus maximus"],
  positions: [],
  defaults: {
    sets: 1,
    reps: 2,
    duration: 60,
    rest: 20,
    loadAu: 7,
    difficulty: "beginner",
  },
  how: "Raise-Activate-Mobilise-Potentiate warm-up: light conditioning + activation isometrics + low-amplitude plyos, then a competitive game to prime the CNS and have fun. Off-season leans playful/varied; in-season is crisp and standardized so nothing steals sharpness.",
  cues: [
    "Progress slow to fast — raise then potentiate",
    "Crisp, not exhausting — this fuels the session",
    "Compete on the game, but keep it clean",
  ],
  variants: [
    {
      name: "Team Movement-Prep Circuit (RAMP)",
      ov: { movement: "neutral", loadingRateBand: "low" },
    },
    { name: "Dynamic Line Drills (Skips/Carioca/Shuffle)", ov: {} },
    {
      name: "Activation Iso Series (Glute/Calf/Core Holds)",
      ov: {
        movement: "neutral",
        loadingRateBand: "none",
        contractionType: "isometric",
      },
    },
    {
      name: "Low Pogo + Ankling Prep Ladder",
      ov: {
        movement: "plantarflexion_ballistic",
        contractionType: "plyometric",
      },
    },
    {
      name: "Partner Mirror Reaction Game",
      ov: { movement: "cutting", loadingRateBand: "high" },
    },
    {
      name: "Reactive Tag (Small-Grid, Season-Light)",
      ov: { movement: "cutting", loadingRateBand: "high" },
    },
    {
      name: "Sharks & Minnows Cut Game",
      ov: { movement: "cutting", loadingRateBand: "high" },
    },
    {
      name: "Med-Ball Circle Toss Activation",
      ov: {
        movement: "core_rotation",
        jointEmphasis: "n/a",
        muscleGroups: ["core"],
        targetMuscles: ["obliques"],
      },
    },
    {
      name: "Build-Up Strides (60-70-80%)",
      ov: { movement: "sprint", loadingRateBand: "high" },
    },
    { name: "Relay Shuttle Warm-Up Race", ov: { loadingRateBand: "high" } },
    {
      name: "Rugby-Touch Keep-Away (Ball Familiar)",
      ov: { movement: "cutting", loadingRateBand: "high" },
    },
    {
      name: "Two-Line Reaction Get-Off Starts",
      ov: { movement: "sprint", loadingRateBand: "high" },
    },
  ],
});

// ══ WR BLOCK (20 min): everyone runs receiver technique ═════════════════════
T.push({
  key: "tp_wr_block",
  category: "skill_drills",
  subcategory: "wr_block",
  movement: "cutting",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "high",
  evidenceTier: "HEURISTIC",
  movementPattern: "WR Group Block",
  muscleGroups: ["quadriceps", "glutes", "calves"],
  targetMuscles: ["quadriceps", "gluteus maximus"],
  positions: ["wr_db"],
  defaults: {
    sets: 4,
    reps: 4,
    rest: 60,
    loadAu: 14,
    difficulty: "intermediate",
  },
  how: "Whole-team receiver period — everyone rotates through the WR stations: release, route detail, and finishing the catch. Cross-training skill for every position. Decelerate before every break; keep it station-based so reps stay high.",
  cues: [
    "Sink the hips and sell the break",
    "Snap the head and hands at the top",
    "High-point and secure — tuck before you run",
  ],
  variants: [
    {
      name: "WR Station: Release-vs-Air Rotation",
      ov: { movement: "sprint", loadingRateBand: "very_high" },
    },
    { name: "WR Station: Speed-Cut Stick Routes", ov: {} },
    { name: "WR Station: Speed-Cut Comeback/Curl", ov: {} },
    {
      name: "WR Station: Double-Move Sell",
      ov: { loadingRateBand: "very_high" },
    },
    {
      name: "WR Station: Deep-Ball Tracking Ladder",
      ov: { movement: "sprint", loadingRateBand: "very_high" },
    },
    { name: "WR Station: Sideline Toe-Tap Rotation", ov: {} },
    {
      name: "WR Station: Contested High-Point Reps",
      ov: { movement: "jump_land" },
    },
    {
      name: "WR Station: Catch-the-Rock Ball Gauntlet",
      ov: {
        movement: "grip",
        jointEmphasis: "n/a",
        muscleGroups: ["hand"],
        targetMuscles: ["finger flexors"],
      },
    },
    { name: "WR Station: Option-Route Read Rotation", ov: {} },
    { name: "WR Station: Catch-and-Pivot Upfield", ov: {} },
    {
      name: "WR Station: Motion-to-Release Timing",
      ov: { movement: "sprint", loadingRateBand: "very_high" },
    },
    { name: "WR Station: Scramble-Drill Find-Space", ov: {} },
  ],
});

// ══ DB BLOCK (20 min): everyone runs coverage technique ═════════════════════
T.push({
  key: "tp_db_block",
  category: "skill_drills",
  subcategory: "db_block",
  movement: "cutting",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "high",
  evidenceTier: "HEURISTIC",
  movementPattern: "DB Group Block",
  muscleGroups: ["quadriceps", "glutes", "adductors"],
  targetMuscles: ["quadriceps", "gluteus medius"],
  positions: ["wr_db"],
  defaults: {
    sets: 4,
    reps: 4,
    rest: 60,
    loadAu: 14,
    difficulty: "intermediate",
  },
  how: "Whole-team coverage period — everyone rotates the DB stations: pedal, transition, break on the ball, finish with a FLAG-PULL not a tackle. Play the receiver's hands late. Cross-training closes the coverage IQ gap for skill players.",
  cues: [
    "Stay low, weight on the balls of the feet",
    "Drive downhill out of the transition",
    "Play the hands late, then pull the flag",
  ],
  variants: [
    { name: "DB Station: Backpedal-Weave Rotation", ov: {} },
    {
      name: "DB Station: Speed-Turn Open-and-Run",
      ov: { movement: "sprint", loadingRateBand: "very_high" },
    },
    { name: "DB Station: Zone-Turn Hip-Open", ov: {} },
    {
      name: "DB Station: Break-on-Ball Drive",
      ov: { loadingRateBand: "very_high" },
    },
    {
      name: "DB Station: Play-the-Hands PBU Timing",
      ov: { movement: "jump_land" },
    },
    {
      name: "DB Station: High-Point Interception Track",
      ov: { movement: "jump_land" },
    },
    { name: "DB Station: Press-Mirror Man Reps", ov: {} },
    { name: "DB Station: Zone-Drop Read-the-QB", ov: {} },
    { name: "DB Station: Leverage Flag-Pull Angles", ov: {} },
    {
      name: "DB Station: Tip-Drill Ball Skills",
      ov: { movement: "jump_land" },
    },
    { name: "DB Station: Deep-Third Read-and-Rob", ov: {} },
    {
      name: "DB Station: Backpedal-to-Sprint Recovery",
      ov: { movement: "sprint", loadingRateBand: "very_high" },
    },
  ],
});

// ══ ROUTES vs COVERAGE (20 min): 7-on-7 skeleton, deep-ball shots ═══════════
T.push({
  key: "tp_routes_coverage",
  category: "skill_drills",
  subcategory: "routes_coverage",
  movement: "cutting",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "very_high",
  evidenceTier: "HEURISTIC",
  movementPattern: "Routes vs Coverage (Skeleton)",
  muscleGroups: ["quadriceps", "glutes", "hamstrings", "calves"],
  targetMuscles: ["quadriceps", "gluteus maximus", "hamstrings"],
  positions: [],
  defaults: {
    sets: 6,
    reps: 3,
    rest: 75,
    loadAu: 16,
    difficulty: "advanced",
  },
  how: "Integration period — 7-on-7 skeleton (no rush): receivers vs coverage, QB reads it live, deep-ball shots. This is where isolated skill becomes decision-making WITHOUT the exposure of full 5v5. High-CNS: dose it, don't drown in it.",
  cues: [
    "Route on time with the QB's feet",
    "Coverage: eyes on your key, break on the throw",
    "Finish every rep — catch or flag-pull",
  ],
  variants: [
    { name: "7-on-7 Skeleton: Spacing Concept", ov: {} },
    { name: "7-on-7 Skeleton: Flood/Level Read", ov: {} },
    { name: "7-on-7 Skeleton: Mesh Cross Rules", ov: {} },
    {
      name: "7-on-7 Skeleton: Vertical Shot Period",
      ov: { movement: "sprint" },
    },
    { name: "Half-Field Deep-Ball Shot Reps", ov: { movement: "sprint" } },
    { name: "Red-Zone Skeleton (Compressed Field)", ov: {} },
    { name: "Two-Minute Skeleton (Situational)", ov: {} },
    { name: "Man-Beater Route Period", ov: {} },
    { name: "Zone-Beater Sit-Down Period", ov: {} },
    { name: "Scramble-Drill Skeleton Reps", ov: {} },
    { name: "Backed-Up Skeleton (Ball Security)", ov: {} },
    { name: "One-High vs Two-High Read Period", ov: {} },
  ],
});

// ══ TEAM / PLAYBOOK (20 min): install + situational, capped 5v5 ═════════════
T.push({
  key: "tp_team_install",
  category: "skill_drills",
  subcategory: "team_install",
  movement: "cutting",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "very_high",
  evidenceTier: "HEURISTIC",
  movementPattern: "Team Install / Situational",
  muscleGroups: ["quadriceps", "glutes", "hamstrings", "calves"],
  targetMuscles: ["quadriceps", "gluteus maximus"],
  positions: [],
  defaults: {
    sets: 5,
    reps: 3,
    rest: 90,
    loadAu: 16,
    difficulty: "advanced",
  },
  how: "Team period — PURPOSEFUL 5v5, not mindless scrimmage. Install a concept or rep a situation, then run it live. In the build phase this is the SMALLEST block (install/walkthrough tempo); near a tournament it grows to full-speed situational reps.",
  cues: [
    "Know the concept before the snap",
    "Play fast, play smart — every rep has a teaching point",
    "Situational discipline: down, distance, clock",
  ],
  variants: [
    {
      name: "Install Walkthrough (New Concept, Air)",
      ov: { movement: "neutral", loadingRateBand: "low" },
    },
    {
      name: "Install Jog-Through (Concept, Half-Speed)",
      ov: { loadingRateBand: "moderate" },
    },
    { name: "5v5 Situational: 3rd-and-Short", ov: {} },
    { name: "5v5 Situational: 3rd-and-Long", ov: {} },
    { name: "5v5 Situational: Red Zone", ov: {} },
    { name: "5v5 Situational: Goal Line", ov: {} },
    { name: "5v5 Situational: Two-Minute Drive", ov: {} },
    { name: "5v5 Situational: Backed-Up Offense", ov: {} },
    { name: "5v5 Move-the-Ball Period (Scripted)", ov: {} },
    { name: "Blitz-Period 5v5 (Hot Reads)", ov: {} },
    { name: "Coming-Out / Four-Down Situational", ov: {} },
    { name: "Two-Point Play Rehearsal", ov: {} },
  ],
});

// ══ POST-PRACTICE: QB + Center snap & timing ════════════════════════════════
T.push({
  key: "tp_qb_center",
  category: "skill_drills",
  subcategory: "qb_center_post",
  movement: "throw",
  contractionType: "isotonic",
  jointEmphasis: "n/a",
  loadingRateBand: "moderate",
  evidenceTier: "HEURISTIC",
  movementPattern: "QB-Center Post-Practice",
  muscleGroups: ["shoulders", "core", "forearm"],
  targetMuscles: ["rotator cuff", "flexor-pronator mass"],
  positions: ["quarterback", "center"],
  defaults: {
    sets: 4,
    reps: 8,
    rest: 45,
    loadAu: 10,
    difficulty: "intermediate",
  },
  how: "Specialists stay after: center-QB snap timing, cadence sync, and footwork-to-throw rhythm. Snap and throw volume is a wrist/shoulder load metric — track it, don't just grind reps at the end of a tired practice.",
  cues: [
    "Consistent snap to the spot, same laces",
    "Sync the cadence — no wasted motion",
    "Reset the base before the throw",
  ],
  variants: [
    { name: "Post-Practice Snap Accuracy to Spots", ov: {} },
    { name: "Post-Practice Cadence-Sync Snaps", ov: {} },
    { name: "Snap-to-Throw 1-2-3 Rhythm", ov: {} },
    { name: "Moving-Pocket Snap Timing", ov: {} },
    { name: "Snap-Under-Duress Rep (Reaction)", ov: {} },
    {
      name: "Center Snap-and-Release Route",
      ov: {
        movement: "cutting",
        muscleGroups: ["quadriceps", "calves"],
        targetMuscles: ["quadriceps"],
      },
    },
    { name: "QB Footwork-to-Layered-Throw Ladder", ov: {} },
    { name: "Two-Minute Snap-Count Rehearsal", ov: {} },
  ],
});

// ══ COOL-DOWN: Blitzer 3-step accel / decel ═════════════════════════════════
T.push({
  key: "tp_blitzer_cd",
  category: "speed",
  subcategory: "blitzer_cooldown",
  movement: "sprint",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "moderate",
  evidenceTier: "HEURISTIC",
  movementPattern: "Blitzer Accel-Decel Cool-Down",
  muscleGroups: ["quadriceps", "glutes", "calves", "hamstrings"],
  targetMuscles: ["quadriceps", "gluteus maximus"],
  positions: ["blitzer", "rusher"],
  defaults: {
    sets: 4,
    reps: 4,
    rest: 45,
    loadAu: 9,
    difficulty: "intermediate",
  },
  how: "Rushers cool down with controlled 3-step accelerations into a clean deceleration — reinforcing the get-off and the contain-stop mechanics at sub-max effort. Down-regulates the CNS while grooving the pattern; NOT max-effort.",
  cues: [
    "Three hard steps, then decelerate under control",
    "Sink and stop — quiet, stable landing",
    "Sub-max: technique over top speed",
  ],
  variants: [
    { name: "3-Step Get-Off to Stick-Stop", ov: {} },
    {
      name: "Speed-Rush Arc Decel (Contain Stop)",
      ov: { movement: "cutting", loadingRateBand: "moderate" },
    },
    { name: "Accel-Decel Line Drill (Sub-Max)", ov: {} },
    {
      name: "Dip-and-Flatten Walk-Through Arc",
      ov: { movement: "cutting", loadingRateBand: "low" },
    },
    {
      name: "Contain-Rush Mirror Cool-Down",
      ov: { movement: "cutting", loadingRateBand: "moderate" },
    },
    {
      name: "Backpedal-Contain Deceleration",
      ov: { movement: "cutting", loadingRateBand: "moderate" },
    },
    { name: "Rush-Lane Tempo Repeats", ov: {} },
    {
      name: "Spin-Counter Walk-Through",
      ov: { movement: "cutting", loadingRateBand: "low" },
    },
  ],
});

// ══ TEAM COOL-DOWN (whole team) ═════════════════════════════════════════════
T.push({
  key: "tp_team_cd",
  category: "cool_down",
  subcategory: "team_cooldown",
  movement: "neutral",
  contractionType: "stretch",
  jointEmphasis: "n/a",
  loadingRateBand: "none",
  evidenceTier: "CONSENSUS",
  movementPattern: "Team Cool-Down",
  muscleGroups: ["full body"],
  targetMuscles: ["hamstrings", "hip flexors", "calves"],
  positions: [],
  defaults: {
    sets: 1,
    reps: 1,
    duration: 45,
    rest: 10,
    loadAu: 4,
    difficulty: "beginner",
  },
  how: "Whole-team down-regulation: easy movement, breathing, and light mobility to bring heart rate and CNS down and start recovery. Keep it social — it is also the day's debrief window.",
  cues: [
    "Nasal breathing — long exhales",
    "Easy range, no forcing",
    "Debrief while you move",
  ],
  variants: [
    {
      name: "Team Jog-and-Breathe Down-Regulation",
      ov: { movement: "impact_run", loadingRateBand: "low" },
    },
    { name: "Box-Breathing Reset (Team Circle)", ov: {} },
    { name: "Walking Hip-Flexor / Hamstring Flow", ov: {} },
    {
      name: "Calf & Achilles Cool-Down Mobility",
      ov: { targetMuscles: ["gastrocnemius", "soleus"] },
    },
    {
      name: "Adductor / Groin Cool-Down Flow",
      ov: { targetMuscles: ["adductor longus"] },
    },
    {
      name: "Thoracic & Shoulder Mobility Finish",
      ov: {
        muscleGroups: ["thoracic spine"],
        targetMuscles: ["thoracic spine"],
      },
    },
    { name: "Partner Down-Regulation Stretch", ov: {} },
    {
      name: "Team Debrief Walk",
      ov: { movement: "impact_run", loadingRateBand: "low" },
    },
  ],
});

// ══ CONDITIONING GAMES (season-dependent, fun) ══════════════════════════════
T.push({
  key: "tp_cond_game",
  category: "conditioning",
  subcategory: "conditioning_game",
  movement: "impact_run",
  contractionType: "isotonic",
  jointEmphasis: "neutral",
  loadingRateBand: "high",
  evidenceTier: "HEURISTIC",
  movementPattern: "Conditioning Game",
  muscleGroups: ["quadriceps", "glutes", "calves", "hamstrings"],
  targetMuscles: ["quadriceps", "gluteus maximus"],
  positions: [],
  defaults: {
    sets: 4,
    reps: 1,
    duration: 40,
    rest: 60,
    loadAu: 14,
    difficulty: "intermediate",
  },
  how: "Game-based conditioning that mirrors flag's work:rest — repeated short bursts with change of direction, kept competitive so effort stays high without feeling like punishment running. Season-dependent volume (more off-season, tapered in-season).",
  cues: [
    "Full effort on the burst, honest on the rest",
    "Change direction low and controlled",
    "Compete — but win with mechanics, not recklessness",
  ],
  variants: [
    { name: "Ultimate-Flag Continuous Game", ov: { movement: "cutting" } },
    { name: "Repeat Shuttle Relay (Team vs Team)", ov: {} },
    {
      name: "Gassers (Position-Grouped Waves)",
      ov: { movement: "sprint", loadingRateBand: "very_high" },
    },
    { name: "300-Yard Shuttle Challenge", ov: {} },
    { name: "Small-Sided 3v3 Continuous", ov: { movement: "cutting" } },
    { name: "Chase-and-Pull Tag Conditioning", ov: { movement: "cutting" } },
    {
      name: "Tempo Interval Runs (Extensive)",
      ov: { loadingRateBand: "moderate" },
    },
    {
      name: "Repeat Deep-Ball Sprints (Track & Catch)",
      ov: { movement: "sprint", loadingRateBand: "very_high" },
    },
    { name: "Cone-Weave Relay Race", ov: { movement: "cutting" } },
    { name: "Two-Minute-Drill Conditioning Ladder", ov: {} },
  ],
});

export const FAMILIES_TEAM_PRACTICE = T;
