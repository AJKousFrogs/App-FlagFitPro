// Tissue Load Engine — position-specific technical drills (flag football).
//
// Drawn from the NO-CONTACT technical side of NFL/NCAA position work: releases,
// route detail, ball skills, coverage footwork, snap accuracy, rush lanes,
// evasion. No pads, no tackling — tackling is replaced by FLAG-PULL technique
// and defenders win with leverage + angles, not contact. Tagged with the app's
// position codes (quarterback / wr_db / center / blitzer / rusher / linebacker)
// so the generator's position filter surfaces them. Category skill_drills.

const P = [];

const drill = (extra) => ({
  category: "skill_drills",
  contractionType: "plyometric",
  jointEmphasis: "neutral",
  loadingRateBand: "high",
  evidenceTier: "HEURISTIC",
  movementPattern: "Position Skill",
  defaults: {
    sets: 4,
    reps: 4,
    rest: 90,
    loadAu: 14,
    difficulty: "intermediate",
  },
  ...extra,
});

// ══ WIDE RECEIVER — releases, route detail, ball skills ═════════════════════
P.push(
  drill({
    key: "wr",
    movement: "cutting",
    muscleGroups: ["quadriceps", "glutes", "calves"],
    targetMuscles: ["quadriceps", "gluteus maximus"],
    positions: ["wr_db"],
    how: "Receiver technique — win the release, run the route detail, finish the catch. Decelerate before every break; reactive work only on a fresh CNS.",
    cues: [
      "Sink the hips before the break",
      "Attack the DB's leverage",
      "High-point and secure the catch",
    ],
    variants: [
      {
        name: "Speed Release Off the Line",
        ov: { movement: "sprint", loadingRateBand: "very_high" },
      },
      { name: "Release vs Press (Swipe-and-Rip)", ov: {} },
      { name: "Jab-Release Foot Fake", ov: {} },
      { name: "Stem-and-Sink Route Detail", ov: {} },
      { name: "Comeback Throttle-Down", ov: {} },
      { name: "Whip/Return Route Footwork", ov: {} },
      {
        name: "Double-Move Sell (Sluggo)",
        ov: { loadingRateBand: "very_high" },
      },
      {
        name: "Contested-Catch High-Point",
        ov: {
          movement: "jump_land",
          muscleGroups: ["quadriceps", "calves"],
          targetMuscles: ["gastrocnemius"],
        },
      },
      {
        name: "Back-Shoulder Catch Adjustment",
        ov: {
          movement: "grip",
          muscleGroups: ["hand"],
          targetMuscles: ["finger flexors"],
        },
      },
      {
        name: "Over-the-Shoulder Deep-Ball Track",
        ov: { movement: "sprint", loadingRateBand: "very_high" },
      },
      { name: "Sideline Toe-Tap Drill", ov: {} },
      {
        name: "One-Handed Catch Progression",
        ov: {
          movement: "grip",
          muscleGroups: ["hand"],
          targetMuscles: ["finger flexors"],
        },
      },
      {
        name: "Gauntlet Catch Drill",
        ov: {
          movement: "grip",
          muscleGroups: ["hand"],
          targetMuscles: ["finger flexors"],
        },
      },
      { name: "Catch-and-Pivot Upfield", ov: {} },
    ],
  }),
);

// ══ DEFENSIVE BACK — pedal, transitions, ball skills, coverage ══════════════
P.push(
  drill({
    key: "db",
    movement: "cutting",
    muscleGroups: ["quadriceps", "glutes", "adductors"],
    targetMuscles: ["quadriceps", "gluteus medius"],
    positions: ["wr_db"],
    how: "Defensive-back technique — smooth pedal, clean transitions, break on the ball, finish with a flag pull, not a tackle. Play the receiver's hands late.",
    cues: [
      "Stay low, weight on the balls of the feet",
      "Drive downhill on the break",
      "Play the hands, then pull the flag",
    ],
    variants: [
      { name: "Weave Backpedal", ov: { movement: "cutting" } },
      {
        name: "Speed Turn (Open-and-Go)",
        ov: { movement: "sprint", loadingRateBand: "very_high" },
      },
      { name: "Zone Turn (Open-Hip)", ov: {} },
      { name: "Break-on-the-Ball Drive", ov: { loadingRateBand: "very_high" } },
      { name: "Play-the-Hands PBU Timing", ov: { movement: "jump_land" } },
      {
        name: "High-Point Interception Track",
        ov: { movement: "jump_land", muscleGroups: ["quadriceps", "calves"] },
      },
      { name: "Off-Man Cushion Break", ov: {} },
      { name: "Press-Mirror Man Technique", ov: {} },
      { name: "Zone Curl-Flat Drop", ov: {} },
      { name: "Deep-Third Read-and-Rob", ov: {} },
      {
        name: "Backpedal-Hip-Turn-Sprint",
        ov: { movement: "sprint", loadingRateBand: "very_high" },
      },
      { name: "Ball-Skills Tip Drill", ov: { movement: "jump_land" } },
      { name: "Flag-Pull on the Break (Leverage)", ov: {} },
    ],
  }),
);

// ══ RUNNING BACK — receiving, evasion, ball security ════════════════════════
P.push(
  drill({
    key: "rb",
    movement: "cutting",
    muscleGroups: ["quadriceps", "glutes", "hamstrings"],
    targetMuscles: ["quadriceps", "gluteus maximus"],
    positions: ["wr_db"],
    how: "Running-back technique in flag — receiving out of the backfield + open-field evasion. Protect your flags in traffic; no lowering the shoulder.",
    cues: [
      "Set up the defender before the cut",
      "Keep the flags clear",
      "Plant and go, don't dance",
    ],
    variants: [
      { name: "Swing-Route Timing", ov: {} },
      {
        name: "Wheel-Route Footwork",
        ov: { movement: "sprint", loadingRateBand: "very_high" },
      },
      { name: "Angle (Texas) Route", ov: {} },
      { name: "Dead-Leg Hesitation Evade", ov: {} },
      {
        name: "Spin-Move Evade (Open Field)",
        ov: { loadingRateBand: "very_high" },
      },
      {
        name: "Shovel/Pitch Catch-and-Go",
        ov: {
          movement: "grip",
          muscleGroups: ["hand"],
          targetMuscles: ["finger flexors"],
        },
      },
      { name: "Ball-Security in Traffic (Flag-Guard)", ov: {} },
      { name: "Screen Setup Footwork", ov: {} },
      {
        name: "1v1 Open-Field Read Evade",
        ov: { loadingRateBand: "very_high", difficulty: "advanced" },
      },
    ],
  }),
);

// ══ QUARTERBACK — reads, ball placement, throwing on the move ═══════════════
P.push(
  drill({
    key: "qb",
    movement: "throw",
    jointEmphasis: "n/a",
    loadingRateBand: "moderate",
    muscleGroups: ["shoulders", "core"],
    targetMuscles: ["rotator cuff", "core"],
    positions: ["quarterback"],
    how: "Quarterback technique — footwork tied to progression reads, ball placement, and delivering off-platform. Throw count is a load metric — track it.",
    cues: [
      "Feet in rhythm with the read",
      "Lead the receiver away from leverage",
      "Reset the base before you throw on the run",
    ],
    variants: [
      { name: "1-2-3 Progression Read Drill", ov: {} },
      { name: "Ball-Placement Leading the Receiver", ov: {} },
      { name: "Back-Shoulder Throw Timing", ov: {} },
      { name: "Throw on the Run (Rollout Right)", ov: {} },
      { name: "Throw on the Run (Rollout Left)", ov: {} },
      { name: "Pocket Climb-and-Deliver", ov: {} },
      { name: "RPO Read-and-React Throw", ov: {} },
      { name: "Layered Touch/Bucket Throw", ov: {} },
      { name: "Snap-to-Throw Rhythm (with Center)", ov: {} },
      {
        name: "Escape-Climb-Reset Footwork",
        ov: { movement: "neutral", loadingRateBand: "moderate" },
      },
    ],
  }),
);

// ══ CENTER — snap accuracy, snap-and-release, cadence ═══════════════════════
P.push(
  drill({
    key: "center",
    movement: "throw",
    jointEmphasis: "n/a",
    loadingRateBand: "moderate",
    muscleGroups: ["shoulders", "core", "forearm"],
    targetMuscles: ["rotator cuff", "core", "flexor-pronator mass"],
    positions: ["center"],
    how: "Center technique in flag — accurate shotgun snaps to spots, then release into a route (the center is eligible). Snap volume is a wrist/forearm load — track it.",
    cues: [
      "Consistent laces and spot",
      "Snap then get to your landmark",
      "Sync the cadence with the QB",
    ],
    variants: [
      { name: "Shotgun Snap Accuracy to Spots", ov: {} },
      { name: "Moving-Pocket Snap", ov: {} },
      { name: "Snap-Under-Duress Timing", ov: {} },
      {
        name: "Snap-and-Release Vertical",
        ov: { movement: "sprint", loadingRateBand: "high" },
      },
      { name: "Snap-and-Flat Route", ov: { movement: "cutting" } },
      { name: "Cadence-Sync Snap Rhythm", ov: {} },
    ],
  }),
);

// ══ BLITZER / RUSHER — no-contact edge, contain, spy ═══════════════════════
P.push(
  drill({
    key: "blitzer",
    movement: "cutting",
    loadingRateBand: "very_high",
    muscleGroups: ["quadriceps", "glutes", "calves"],
    targetMuscles: ["quadriceps", "gluteus maximus"],
    positions: ["blitzer", "rusher"],
    how: "Rusher technique in flag — win the edge with speed and angle (no contact, dip AROUND), keep contain on a scrambling QB, and time the blitz off the snap.",
    cues: [
      "Explode off the ball",
      "Dip and flatten the arc — no contact",
      "Keep contain, don't overrun the QB",
    ],
    variants: [
      {
        name: "Get-Off on Ball Movement (Reaction)",
        ov: { loadingRateBand: "very_high" },
      },
      { name: "Edge Speed-Rush Arc (Dip-and-Flatten)", ov: {} },
      { name: "Rip-Move Around the Edge", ov: {} },
      { name: "Spin-Counter Off the Speed Rush", ov: {} },
      { name: "Contain-Rush vs Scramble", ov: {} },
      { name: "QB Spy Mirror", ov: {} },
      { name: "Delayed (Green-Dog) Blitz Timing", ov: {} },
      { name: "Loop/Twist Stunt Timing", ov: {} },
      { name: "Mush-Rush Contain Discipline", ov: { loadingRateBand: "high" } },
    ],
  }),
);

// ══ LINEBACKER / HYBRID — zone drops, blitz, coverage, flag-pull ═══════════
P.push(
  drill({
    key: "lb",
    movement: "cutting",
    muscleGroups: ["quadriceps", "glutes", "hamstrings"],
    targetMuscles: ["quadriceps", "gluteus maximus"],
    positions: ["linebacker", "blitzer"],
    how: "Linebacker/hybrid technique — read-and-drop zone coverage, time the blitz, cover the back man-to-man, and finish with leverage flag-pulls.",
    cues: [
      "Read the QB's eyes on the drop",
      "Break downhill under control",
      "Take the proper pursuit angle to the flag",
    ],
    variants: [
      { name: "Hook/Curl Zone Drop Read", ov: {} },
      { name: "Robber/Rat Read Technique", ov: {} },
      { name: "Edge Blitz Timing", ov: { loadingRateBand: "very_high" } },
      {
        name: "Man Coverage on the RB (Wheel/Angle)",
        ov: { movement: "sprint", loadingRateBand: "very_high" },
      },
      { name: "Run-Fit Contain (QB Scramble)", ov: {} },
      { name: "Pursuit-Angle Flag Pull", ov: {} },
    ],
  }),
);

export const FAMILIES_POSITION = P;
