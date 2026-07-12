// Team-practice plan — the REALIZATION of a team-practice day.
//
// See docs/ground-truth/team-practice-periodization.md. This does NOT decide
// season phase / taper / framing — that is the INTENT engine's job
// (angular .../periodization-engine.ts). This consumes the intent
// (`framing` + `minutes` + phase + taper `daysOut`) and shapes it into the
// concrete, time-boxed block plan: which blocks, how many minutes each, and the
// drill-vs-scrimmage mix. Drills for each block are then pulled from the library
// by `subcategory` (fetchPlanDrills).
//
// The one safety property this file exists to guarantee: the hour of full-speed
// 5v5 only appears — capped and purposeful — as competition nears. In the build
// phase the team (scrimmage) block is the SMALLEST; high-CNS integration/5v5
// shrinks to a walkthrough in the final 48h and disappears on a recovery day.

// Distance (days to the next peak/high event) at/under which a taper becomes the
// lighter "final third" walkthrough. Mirrors the intent engine's
// TAPER_CONFIG.finalThirdDaysOut so timing is defined once conceptually.
const WALKTHROUGH_DAYS_OUT = 2;

// Block roles, used for the drill:scrimmage rollup and CNS accounting.
//   warmup · indy (isolated position skill) · integration (7-on-7 skeleton) ·
//   team (full-speed 5v5) · specialty (post-practice groups) · cooldown
const ROLE = {
  WARMUP: "warmup",
  INDY: "indy",
  INTEGRATION: "integration",
  TEAM: "team",
  SPECIALTY: "specialty",
  COOLDOWN: "cooldown",
};

// A block spec is a template; `share` is its fraction of total practice minutes.
// `positions: null` = the whole team runs the block (position tags on the drills
// drive emphasis, not who participates — per the practice model). highCns blocks
// are the ones the taper deliberately shrinks near competition.
const b = (key, role, subcategory, share, opts = {}) => ({
  key,
  role,
  subcategory,
  share,
  title: opts.title ?? null,
  positions: opts.positions ?? null,
  highCns: opts.highCns ?? false,
  waterBreakAfter: opts.waterBreakAfter ?? false,
});

// ── Framing → ordered block plan (shares sum to ~1.0) ───────────────────────
// Data-driven, like PRACTICE_PHASE_MODIFIERS: a new practice shape is a new key
// here, never a new branch. Titles are athlete-facing.
const FRAMING_PLANS = {
  // Build practice (accumulation/transition). Drills dominate; the team/5v5
  // block is the SMALLEST slice and is install-tempo, not free scrimmage.
  own: [
    b("team_warmup", ROLE.WARMUP, "team_warmup", 0.18, { title: "Warm-Up" }),
    b("wr_block", ROLE.INDY, "wr_block", 0.18, {
      title: "WR Block (whole team)",
      waterBreakAfter: true,
      highCns: true,
    }),
    b("db_block", ROLE.INDY, "db_block", 0.18, {
      title: "DB Block (whole team)",
      waterBreakAfter: true,
      highCns: true,
    }),
    b("routes_coverage", ROLE.INTEGRATION, "routes_coverage", 0.18, {
      title: "Routes vs Coverage (7-on-7)",
      highCns: true,
    }),
    b("team_install", ROLE.TEAM, "team_install", 0.12, {
      title: "Team Install (capped 5v5)",
      highCns: true,
    }),
    b("qb_center_post", ROLE.SPECIALTY, "qb_center_post", 0.06, {
      title: "Post: QB–Center",
      positions: ["quarterback", "center"],
    }),
    b("blitzer_cooldown", ROLE.SPECIALTY, "blitzer_cooldown", 0.04, {
      title: "Post: Blitzer Accel-Decel",
      positions: ["blitzer", "rusher"],
    }),
    b("team_cooldown", ROLE.COOLDOWN, "team_cooldown", 0.06, {
      title: "Team Cool-Down",
    }),
  ],
  // Sharpening (taper, a few days out). Indy shrinks; integration + full-speed
  // situational 5v5 grow. Still real high-CNS work.
  sharp: [
    b("team_warmup", ROLE.WARMUP, "team_warmup", 0.18, { title: "Warm-Up" }),
    b("wr_block", ROLE.INDY, "wr_block", 0.12, {
      title: "WR Block (whole team)",
      waterBreakAfter: true,
      highCns: true,
    }),
    b("db_block", ROLE.INDY, "db_block", 0.12, {
      title: "DB Block (whole team)",
      waterBreakAfter: true,
      highCns: true,
    }),
    b("routes_coverage", ROLE.INTEGRATION, "routes_coverage", 0.18, {
      title: "Situational 7-on-7",
      highCns: true,
    }),
    b("team_install", ROLE.TEAM, "team_install", 0.28, {
      title: "Situational 5v5",
      highCns: true,
    }),
    b("qb_center_post", ROLE.SPECIALTY, "qb_center_post", 0.04, {
      title: "Post: QB–Center",
      positions: ["quarterback", "center"],
    }),
    b("blitzer_cooldown", ROLE.SPECIALTY, "blitzer_cooldown", 0.02, {
      title: "Post: Blitzer Accel-Decel",
      positions: ["blitzer", "rusher"],
    }),
    b("team_cooldown", ROLE.COOLDOWN, "team_cooldown", 0.06, {
      title: "Team Cool-Down",
    }),
  ],
  // Final 48h walkthrough. No isolated max-CNS drilling; mental reps + scripted
  // walkthrough at low intensity, glycogen protected. Nothing is highCns.
  walkthrough: [
    b("team_warmup", ROLE.WARMUP, "team_warmup", 0.22, {
      title: "Light Activation",
    }),
    b("routes_coverage", ROLE.INTEGRATION, "routes_coverage", 0.18, {
      title: "Mental Reps (walk tempo)",
    }),
    b("team_install", ROLE.TEAM, "team_install", 0.28, {
      title: "Script Walkthrough",
    }),
    b("qb_center_post", ROLE.SPECIALTY, "qb_center_post", 0.08, {
      title: "Post: QB–Center Timing",
      positions: ["quarterback", "center"],
    }),
    b("blitzer_cooldown", ROLE.SPECIALTY, "blitzer_cooldown", 0.06, {
      title: "Post: Blitzer (sub-max)",
      positions: ["blitzer", "rusher"],
    }),
    b("team_cooldown", ROLE.COOLDOWN, "team_cooldown", 0.18, {
      title: "Team Cool-Down",
    }),
  ],
  // Post-tournament recovery practice. No scrimmage, no max sprint — mobility-led
  // warm-up, light technique, extended cool-down.
  recovery: [
    b("team_warmup", ROLE.WARMUP, "team_warmup", 0.3, {
      title: "Mobility-Led Warm-Up",
    }),
    b("wr_block", ROLE.INDY, "wr_block", 0.3, {
      title: "Light Technique (walk tempo)",
    }),
    b("team_cooldown", ROLE.COOLDOWN, "team_cooldown", 0.4, {
      title: "Extended Team Cool-Down",
    }),
  ],
};

// Resolve which plan shape applies. `framing` comes straight from the intent
// engine's PracticePhaseModifier.framing ("own" | "sharp" | "recovery"); a
// "sharp" day inside the final-third window is the walkthrough shape.
function resolvePlanKey(framing, phase, daysOut) {
  if (framing === "recovery") {
    return "recovery";
  }
  if (framing === "own") {
    return "own";
  }
  // framing === "sharp"
  if (
    phase === "taper" &&
    typeof daysOut === "number" &&
    daysOut <= WALKTHROUGH_DAYS_OUT
  ) {
    return "walkthrough";
  }
  return "sharp";
}

/** Distribute `total` minutes across specs by share, rounding to whole minutes
 *  and correcting drift onto the largest block so the parts always sum to total. */
function distributeMinutes(specs, total) {
  const raw = specs.map((s) => s.share * total);
  const mins = raw.map((v) => Math.max(1, Math.round(v)));
  let drift = total - mins.reduce((a, v) => a + v, 0);
  // Push the rounding remainder onto the biggest block(s).
  const order = specs
    .map((_, i) => i)
    .sort((i, j) => mins[j] - mins[i] || i - j);
  let k = 0;
  while (drift !== 0 && order.length) {
    const idx = order[k % order.length];
    if (drift > 0) {
      mins[idx] += 1;
      drift -= 1;
    } else if (mins[idx] > 1) {
      mins[idx] -= 1;
      drift += 1;
    }
    k += 1;
    if (k > 10000) {
      break;
    } // safety
  }
  return mins;
}

/**
 * Off-season warm-ups lean into fun/competitive conditioning games layered on the
 * activation base; in-season warm-ups stay crisp/standardized (activation only).
 * seasonPhase from the intent engine's macro phase ("accumulation"/off vs taper/
 * competition/in). Returns the subcategories the warm-up block should pull from.
 */
function warmupSubcategories(seasonPhase) {
  const offSeason =
    seasonPhase === "accumulation" ||
    seasonPhase === "transition" ||
    seasonPhase === "off_season" ||
    seasonPhase === null ||
    seasonPhase === undefined;
  return offSeason ? ["team_warmup", "conditioning_game"] : ["team_warmup"];
}

/**
 * Build the time-boxed team-practice plan from the intent for a team-practice day.
 *
 * @param {object} intent
 * @param {"own"|"sharp"|"recovery"} intent.framing  from PracticePhaseModifier
 * @param {number} intent.minutes                    total practice minutes
 * @param {string} [intent.phase]                    CompetitionPhase (taper detection)
 * @param {number|null} [intent.daysOut]             days to the next peak/high event
 * @param {string} [intent.seasonPhase]              macro phase (warm-up flavour)
 * @returns {{planKey,framing,totalMinutes,blocks,drillMinutes,scrimmageMinutes,
 *            highCnsMinutes,notes}}
 */
function buildPracticePlan(intent = {}) {
  const {
    framing = "own",
    minutes = 90,
    phase = null,
    daysOut = null,
    seasonPhase = null,
  } = intent;

  const planKey = resolvePlanKey(framing, phase, daysOut);
  const specs = FRAMING_PLANS[planKey] ?? FRAMING_PLANS.own;
  const total = Math.max(specs.length, Math.round(minutes));
  const mins = distributeMinutes(specs, total);

  const blocks = specs.map((s, i) => ({
    key: s.key,
    title: s.title ?? s.key,
    role: s.role,
    minutes: mins[i],
    subcategories:
      s.key === "team_warmup"
        ? warmupSubcategories(seasonPhase)
        : [s.subcategory],
    positions: s.positions,
    highCns: s.highCns,
    waterBreakAfter: s.waterBreakAfter,
  }));

  const sumBy = (pred) =>
    blocks.reduce((n, bl) => (pred(bl) ? n + bl.minutes : n), 0);

  return {
    planKey,
    framing,
    totalMinutes: blocks.reduce((n, bl) => n + bl.minutes, 0),
    blocks,
    drillMinutes: sumBy(
      (bl) => bl.role === ROLE.INDY || bl.role === ROLE.INTEGRATION,
    ),
    scrimmageMinutes: sumBy((bl) => bl.role === ROLE.TEAM),
    highCnsMinutes: sumBy((bl) => bl.highCns),
    notes: PLAN_NOTES[planKey],
  };
}

const PLAN_NOTES = {
  own: "Build phase — develop skills. Scrimmage is the smallest block and stays install-tempo, not free 5v5.",
  sharp:
    "Sharpening (taper) — situational 5v5 grows, isolated drilling shrinks. Real high-CNS work.",
  walkthrough:
    "Final 48h — walkthrough/script only, no max-CNS. Protect the legs, top up glycogen.",
  recovery:
    "Post-tournament recovery — mobility and light technique only. No scrimmage, no max sprint.",
};

/**
 * Fill each block with candidate drills from the library, by subcategory. This is
 * the team (coach) plan — it is injury-AGNOSTIC; an individual athlete's view
 * applies their own injury filter + load scaling on top (resolveInjuryResponse).
 * `positions` narrows a specialty block to its group.
 */
async function fetchPlanDrills(supabase, plan, { perBlock = 6 } = {}) {
  const filled = [];
  for (const block of plan.blocks) {
    let query = supabase
      .from("exercises")
      .select("*")
      .in("subcategory", block.subcategories)
      .eq("active", true)
      .limit(perBlock * 3);
    if (Array.isArray(block.positions) && block.positions.length > 0) {
      query = query.overlaps("position_specific", block.positions);
    }
    const { data, error } = await query;
    const drills = !error && Array.isArray(data) ? data.slice(0, perBlock) : [];
    filled.push({ ...block, drills });
  }
  return { ...plan, blocks: filled };
}

export {
  buildPracticePlan,
  fetchPlanDrills,
  resolvePlanKey,
  FRAMING_PLANS,
  ROLE,
  WALKTHROUGH_DAYS_OUT,
};
