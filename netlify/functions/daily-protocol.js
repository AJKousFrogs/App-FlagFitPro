import { supabaseAdmin, getSupabaseClient } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { authenticateRequest } from "./utils/auth-helper.js";
import { createErrorResponse, handleValidationError } from "./utils/error-handler.js";
import { resolveTodaySession } from "./utils/session-resolver.js";
import { resolveTeamActivityForAthleteDay } from "./utils/team-activity-resolver.js";
import crypto from "crypto";

/**
 * Daily Protocol API
 *
 * Endpoints:
 * - GET /api/daily-protocol - Get today's protocol for the authenticated user
 * - POST /api/daily-protocol/generate - Generate a new protocol for a date
 * - POST /api/daily-protocol/complete - Mark an exercise as complete
 * - POST /api/daily-protocol/skip - Mark an exercise as skipped
 * - POST /api/daily-protocol/complete-block - Mark all exercises in a block as complete
 * - POST /api/daily-protocol/skip-block - Mark all exercises in a block as skipped
 * - POST /api/daily-protocol/log-session - Log session RPE and duration
 */

// Get appropriate Supabase client based on operation
// Use user JWT client for user-scoped operations, admin for cross-user operations
const getSupabase = (token = null) => {
  // For user-scoped reads/writes, use JWT client with RLS
  if (token) {
    return getSupabaseClient(token);
  }
  // Fallback to admin for operations that truly need it
  return supabaseAdmin;
};

/**
 * Compute session override using deterministic priority rules.
 * SINGLE SOURCE OF TRUTH for override computation.
 *
 * Priority order (highest to lowest):
 * 1. rehab_protocol - Active injury protocol (safety first)
 * 2. coach_alert - Coach has flagged something requiring attention
 * 3. weather_override - Weather conditions prevent normal training
 * 4. teamActivity (ONLY if participation !== 'excluded') - Practice or film room
 * 5. taper - Tournament taper period
 * 6. null - No override, use normal program session
 *
 * @param {Object} params - Override computation parameters
 * @param {boolean} params.rehabActive - Whether athlete has active injury/rehab
 * @param {string[]} params.injuries - List of injury areas if rehabActive
 * @param {boolean} params.coachAlertActive - Whether coach alert is active
 * @param {boolean} params.weatherOverride - Whether weather override is in effect
 * @param {Object|null} params.teamActivity - Team activity object with type and participation
 * @param {boolean} params.taperActive - Whether athlete is in taper period
 * @param {Object|null} params.taperContext - Taper context with tournament info
 * @returns {Object|null} Override object or null
 */
function computeOverride({
  rehabActive,
  injuries,
  coachAlertActive,
  weatherOverride,
  teamActivity,
  taperActive,
  taperContext,
}) {
  // Priority 1: Rehab protocol (safety first)
  if (rehabActive) {
    return {
      type: "rehab_protocol",
      reason:
        injuries && injuries.length > 0
          ? `Active injury protocol: ${injuries.join(", ")}`
          : "Return-to-Play protocol active",
      replaceSession: true,
    };
  }

  // Priority 2: Coach alert (coach has flagged something)
  if (coachAlertActive) {
    return {
      type: "coach_alert",
      reason: "Coach alert active - check coach notes",
      replaceSession: false,
    };
  }

  // Priority 3: Weather override
  if (weatherOverride) {
    return {
      type: "weather_override",
      reason: "Weather conditions prevent normal training",
      replaceSession: true,
    };
  }

  // Priority 4: Team activity (ONLY if NOT excluded)
  // CRITICAL: Excluded athletes do NOT get flag_practice or film_room overrides
  if (teamActivity && teamActivity.participation !== "excluded") {
    if (teamActivity.type === "practice") {
      return {
        type: "flag_practice",
        reason: `Team practice scheduled at ${teamActivity.startTimeLocal || "18:00"}`,
        replaceSession: teamActivity.replacesSession !== false,
      };
    }
    if (teamActivity.type === "film_room") {
      return {
        type: "film_room",
        reason: `Film room scheduled at ${teamActivity.startTimeLocal || "10:00"}`,
        replaceSession: teamActivity.replacesSession !== false,
      };
    }
  }

  // Priority 5: Taper period
  if (taperActive && taperContext) {
    return {
      type: "taper",
      reason: `Taper for ${taperContext.tournament?.name || "upcoming tournament"} (${taperContext.daysUntil} days)`,
      replaceSession: false,
    };
  }

  // No override - use normal program session
  return null;
}

// ============================================================================
// EVIDENCE-BASED BLOCK CONFIGURATION
// Based on VALD Practitioner's Guides (Isometrics, Hamstrings, Preseason, etc.)
// ============================================================================

// Block type configuration for 1.5h structured training
const BLOCK_TYPES = {
  morning_mobility: { category: "mobility", estimatedMinutes: 10 },
  foam_roll: { category: "foam_roll", estimatedMinutes: 8 },
  warm_up: { category: "warm_up", estimatedMinutes: 25 },
  isometrics: { category: "isometric", estimatedMinutes: 15 },
  plyometrics: { category: "plyometric", estimatedMinutes: 15 },
  strength: { category: "strength", estimatedMinutes: 15 },
  conditioning: { category: "conditioning", estimatedMinutes: 15 },
  skill_drills: { category: "skill", estimatedMinutes: 15 },
  main_session: { category: "strength", estimatedMinutes: 45 }, // Legacy - kept for backwards compatibility
  cool_down: { category: "cool_down", estimatedMinutes: 15 },
  evening_recovery: { category: "recovery", estimatedMinutes: 10 },
};

// ============================================================================
// EVIDENCE-BASED PERIODIZATION CONFIGURATION
// Source: VALD Practitioner's Guide to Isometrics, Hamstrings, Preseason
// ============================================================================

/**
 * Evidence-based training protocols from VALD research
 */
const EVIDENCE_BASED_PROTOCOLS = {
  // Isometric Training Protocol (Practitioner's Guide to Isometrics)
  // "3-5 sets of 3-6 second maximal contractions with 30-60 seconds rest"
  isometrics: {
    sets: { min: 3, max: 5 },
    holdSeconds: { min: 3, max: 6 },
    restSeconds: { min: 30, max: 60 },
    frequencyPerWeek: { min: 2, max: 3 },
    asymmetryThreshold: 0.1, // <10% ideal
    asymmetryWarning: 0.15, // >15% requires attention
  },

  // Nordic Curl Protocol (Practitioner's Guide to Hamstrings)
  // "2-3x weekly reduces injury risk by 50-70%"
  // "Progress from 1x5 to 3x12 over 6-8 weeks"
  nordicCurls: {
    frequencyPerWeek: { min: 2, max: 3 },
    beginner: { sets: 1, reps: 5 },
    intermediate: { sets: 2, reps: 8 },
    advanced: { sets: 3, reps: 12 },
    injuryRiskReduction: 0.6, // 50-70%
    eccentricHQRatioTarget: 0.8,
  },

  // Plyometric Contacts (Multiple guides)
  // Phase-appropriate weekly contacts
  plyometrics: {
    contactsPerWeek: {
      off_season_rest: { min: 0, max: 0 },
      foundation: { min: 40, max: 80 },
      strength_accumulation: { min: 60, max: 120 },
      power_development: { min: 80, max: 150 },
      speed_development: { min: 100, max: 180 },
      competition_prep: { min: 60, max: 100 },
      in_season_maintenance: { min: 40, max: 80 },
      mid_season_reload: { min: 60, max: 120 },
      peak: { min: 50, max: 100 },
      taper: { min: 20, max: 40 },
      active_recovery: { min: 0, max: 20 },
    },
    intensityLevels: {
      low: ["pogo_jumps", "ankle_hops", "box_step_ups", "low_hurdle_hops"],
      medium: [
        "box_jumps",
        "broad_jumps",
        "single_leg_bounds",
        "lateral_bounds",
      ],
      high: [
        "depth_jumps",
        "reactive_bounds",
        "hurdle_hops",
        "single_leg_depth_jumps",
      ],
      very_high: [
        "depth_jumps_to_sprint",
        "reactive_agility_bounds",
        "multi_directional_bounds",
      ],
    },
  },

  // ACWR Safe Zones (Practitioner's Guide to Preseason + Gabbett 2016)
  // "ACWR 0.8-1.3 is optimal; >1.5 increases injury risk 2-4x"
  acwr: {
    optimal: { min: 0.8, max: 1.3 },
    elevated: { min: 1.3, max: 1.5 },
    danger: { min: 1.5, max: 2.0 },
    weeklyLoadIncreaseMax: 0.1, // 10% max per week
  },

  // Hip/Groin Balance (Practitioner's Guide to Hip and Groin)
  hipGroin: {
    adductorAbductorRatioTarget: { min: 0.8, max: 1.2 },
    asymmetryThreshold: 0.1,
  },

  // Calf/Achilles Return to Sport (Practitioner's Guide to Calf & Achilles)
  calfAchilles: {
    returnToSportStrengthThreshold: 0.9, // >90% bilateral symmetry
    progressionPhases: [
      "isometric",
      "heavy_slow_resistance",
      "eccentric",
      "plyometric",
      "return_to_sport",
    ],
  },
};

// ============================================================================
// FALLBACK EXERCISE LIBRARY (when database is empty)
// 60+ evidence-based exercises for flag football training
// Each day gets different exercises via deterministic selection based on dayOfYear
// ============================================================================
const FALLBACK_EXERCISES = {
  // Morning Mobility - 7 day-specific YouTube routines
  morning_mobility: [
    {
      name: "Morning Mobility - Day 1 (Monday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 2 (Tuesday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=2",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 3 (Wednesday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=3",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 4 (Thursday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=4",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 5 (Friday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=5",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 6 (Saturday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=6",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 7 (Sunday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=7",
      duration_seconds: 600,
    },
  ],
  // Foam Rolling
  foam_roll: [
    {
      name: "IT Band Roll",
      sets: 1,
      duration_seconds: 60,
      note: "Foam roll outer thigh from hip to knee",
    },
    {
      name: "Quad Roll",
      sets: 1,
      duration_seconds: 60,
      note: "Foam roll front of thigh",
    },
    {
      name: "Glute Roll",
      sets: 1,
      duration_seconds: 60,
      note: "Foam roll glute muscles",
    },
    {
      name: "Hamstring Roll",
      sets: 1,
      duration_seconds: 60,
      note: "Foam roll back of thigh",
    },
    {
      name: "Calf Roll",
      sets: 1,
      duration_seconds: 60,
      note: "Foam roll calf muscles",
    },
    {
      name: "Thoracic Spine Roll",
      sets: 1,
      duration_seconds: 60,
      note: "Foam roll upper back",
    },
    {
      name: "Lat Roll",
      sets: 1,
      duration_seconds: 60,
      note: "Foam roll side of back",
    },
    {
      name: "Adductor Roll",
      sets: 1,
      duration_seconds: 60,
      note: "Foam roll inner thigh",
    },
  ],
  // Warm-up
  warm_up: [
    { name: "Jumping Jacks", sets: 2, reps: 20, note: "Full range of motion" },
    {
      name: "High Knees",
      sets: 2,
      duration_seconds: 30,
      note: "Drive knees up, pump arms",
    },
    {
      name: "Butt Kicks",
      sets: 2,
      duration_seconds: 30,
      note: "Heels to glutes",
    },
    {
      name: "Leg Swings (Forward/Back)",
      sets: 2,
      reps: 10,
      note: "Each leg, controlled swing",
    },
    {
      name: "Leg Swings (Side to Side)",
      sets: 2,
      reps: 10,
      note: "Each leg, open hips",
    },
    {
      name: "Walking Lunges",
      sets: 2,
      reps: 10,
      note: "Each leg, torso upright",
    },
    { name: "A-Skips", sets: 2, reps: 10, note: "Each leg, drive knee up" },
    {
      name: "B-Skips",
      sets: 2,
      reps: 10,
      note: "Each leg, extend leg forward",
    },
    {
      name: "Carioca",
      sets: 2,
      duration_seconds: 30,
      note: "Lateral crossover movement",
    },
    {
      name: "Inchworm",
      sets: 2,
      reps: 6,
      note: "Walk hands out to plank, walk feet to hands",
    },
  ],
  // Isometrics (tendon health & injury prevention)
  isometrics: [
    {
      name: "Wall Sit",
      sets: 3,
      hold_seconds: 45,
      note: "Back flat against wall, thighs parallel. Builds quad tendon resilience.",
    },
    {
      name: "Single-Leg Wall Sit",
      sets: 3,
      hold_seconds: 30,
      note: "Each leg. Addresses asymmetry.",
    },
    {
      name: "Isometric Lunge Hold",
      sets: 3,
      hold_seconds: 30,
      note: "Each leg at 90°. Hip flexor/quad.",
    },
    {
      name: "Isometric Calf Raise",
      sets: 3,
      hold_seconds: 30,
      note: "Hold at top of calf raise. Achilles health.",
    },
    {
      name: "Isometric Hip Adduction",
      sets: 3,
      hold_seconds: 20,
      note: "Squeeze ball between knees. Groin injury prevention.",
    },
    {
      name: "Isometric Hip Abduction",
      sets: 3,
      hold_seconds: 20,
      note: "Press out against band. Hip stability.",
    },
    {
      name: "Plank Hold",
      sets: 3,
      hold_seconds: 45,
      note: "Core stability. Maintain neutral spine.",
    },
    {
      name: "Side Plank Hold",
      sets: 3,
      hold_seconds: 30,
      note: "Each side. Lateral core strength.",
    },
    {
      name: "Copenhagen Adductor Hold",
      sets: 3,
      hold_seconds: 20,
      note: "Each side. Groin injury prevention (65% reduction).",
    },
  ],
  // Plyometrics (explosive power)
  plyometrics: [
    {
      name: "Pogo Jumps",
      sets: 3,
      reps: 10,
      note: "Ankle stiffness. Minimal ground contact time.",
    },
    {
      name: "Box Jumps",
      sets: 3,
      reps: 5,
      note: "Explosive hip extension. Step down.",
    },
    {
      name: "Broad Jumps",
      sets: 3,
      reps: 5,
      note: "Horizontal power. Stick landing.",
    },
    {
      name: "Single-Leg Bounds",
      sets: 3,
      reps: 5,
      note: "Each leg. Power + stability.",
    },
    {
      name: "Lateral Bounds",
      sets: 3,
      reps: 5,
      note: "Each side. Change of direction power.",
    },
    {
      name: "Depth Drops",
      sets: 3,
      reps: 3,
      note: "Step off box, absorb landing. Landing mechanics.",
    },
    {
      name: "Hurdle Hops",
      sets: 3,
      reps: 6,
      note: "Continuous over mini hurdles.",
    },
    {
      name: "Medicine Ball Slams",
      sets: 3,
      reps: 8,
      note: "Overhead to ground. Full body power.",
    },
    {
      name: "Skater Jumps",
      sets: 3,
      reps: 8,
      note: "Lateral bound with arm drive.",
    },
  ],
  // Strength (injury prevention focused - max 40% BW)
  strength: [
    {
      name: "Nordic Curls",
      sets: 3,
      reps: 5,
      note: "Eccentric hamstring. 51% injury reduction (Al Attar et al.). Control descent.",
    },
    {
      name: "Copenhagen Side Plank Lifts",
      sets: 3,
      reps: 8,
      note: "Each side. Groin injury prevention (65% reduction).",
    },
    {
      name: "Bulgarian Split Squat",
      sets: 3,
      reps: 8,
      note: "Each leg. Single-leg strength + balance.",
    },
    {
      name: "Single-Leg RDL",
      sets: 3,
      reps: 8,
      note: "Each leg. Posterior chain + balance.",
    },
    {
      name: "Glute Bridge March",
      sets: 3,
      reps: 10,
      note: "Alternating. Hip stability + strength.",
    },
    {
      name: "Single-Leg Calf Raise",
      sets: 3,
      reps: 12,
      note: "Each leg. Achilles/calf resilience.",
    },
    {
      name: "Banded Monster Walk",
      sets: 3,
      reps: 10,
      note: "Each direction. Hip abductor strength.",
    },
    {
      name: "Pallof Press",
      sets: 3,
      reps: 10,
      note: "Each side. Anti-rotation core.",
    },
    {
      name: "Bird Dog",
      sets: 3,
      reps: 8,
      note: "Each side. Core stability + spinal health.",
    },
  ],
  // Conditioning (ACWR-adjusted)
  conditioning: [
    {
      name: "Sprint Intervals (20yd)",
      sets: 6,
      reps: 1,
      note: "85% effort. Walk back recovery.",
    },
    {
      name: "Pro Agility Drill (5-10-5)",
      sets: 4,
      reps: 1,
      note: "Max effort. 90s rest between.",
    },
    {
      name: "Tempo Runs (100yd)",
      sets: 4,
      reps: 1,
      note: "75% effort. Aerobic base.",
    },
    {
      name: "Shuttle Runs",
      sets: 4,
      reps: 1,
      note: "10-20-30-20-10yd. Change of direction.",
    },
    {
      name: "Lateral Shuffles",
      sets: 4,
      duration_seconds: 30,
      note: "Each direction. Defensive movement.",
    },
    {
      name: "Backpedal + Sprint",
      sets: 4,
      reps: 1,
      note: "DB coverage simulation.",
    },
    {
      name: "Cone Drills (L-Drill)",
      sets: 4,
      reps: 1,
      note: "Agility and change of direction.",
    },
    {
      name: "Star Drill",
      sets: 3,
      reps: 1,
      note: "Multi-directional agility.",
    },
  ],
  // Skill drills (position-specific)
  skill: [
    {
      name: "Route Running - Quick Outs",
      sets: 4,
      reps: 3,
      note: "Sharp cuts at 75% speed.",
    },
    {
      name: "Route Running - Slants",
      sets: 4,
      reps: 3,
      note: "Burst off the line, precise angle.",
    },
    {
      name: "Backpedal Breaks",
      sets: 4,
      reps: 3,
      note: "DB technique. React and drive.",
    },
    {
      name: "Flag Pull Drills",
      sets: 3,
      reps: 6,
      note: "Technique practice. Track hips.",
    },
    {
      name: "Catching Drills - High Point",
      sets: 3,
      reps: 5,
      note: "Jump and catch at highest point.",
    },
    {
      name: "Reaction Ball Drills",
      sets: 3,
      duration_seconds: 60,
      note: "Hand-eye coordination.",
    },
    { name: "Agility Ladder", sets: 3, reps: 2, note: "Quick feet patterns." },
  ],
  // Cool down
  cool_down: [
    {
      name: "Static Hamstring Stretch",
      sets: 1,
      hold_seconds: 30,
      note: "Each leg. Breathe deeply.",
    },
    {
      name: "Static Quad Stretch",
      sets: 1,
      hold_seconds: 30,
      note: "Each leg. Hold foot behind.",
    },
    {
      name: "Static Hip Flexor Stretch",
      sets: 1,
      hold_seconds: 30,
      note: "Each leg. Kneeling lunge.",
    },
    {
      name: "90/90 Hip Stretch",
      sets: 1,
      hold_seconds: 30,
      note: "Each side. Hip external rotation.",
    },
    {
      name: "Pigeon Pose",
      sets: 1,
      hold_seconds: 30,
      note: "Each side. Glute/hip opener.",
    },
    {
      name: "Child's Pose",
      sets: 1,
      hold_seconds: 60,
      note: "Breathe and relax. Back stretch.",
    },
    {
      name: "Seated Spinal Twist",
      sets: 1,
      hold_seconds: 30,
      note: "Each side. Spine mobility.",
    },
    {
      name: "Cat-Cow Stretch",
      sets: 1,
      reps: 10,
      note: "Slow and controlled. Spine mobility.",
    },
  ],
  // Recovery
  recovery: [
    {
      name: "Diaphragmatic Breathing",
      sets: 1,
      duration_seconds: 180,
      note: "4s inhale, 4s hold, 6s exhale. Parasympathetic activation.",
    },
    {
      name: "Legs Up The Wall",
      sets: 1,
      duration_seconds: 300,
      note: "Venous return. Recovery promotion.",
    },
    {
      name: "Self-Massage with Ball",
      sets: 1,
      duration_seconds: 180,
      note: "Target tight areas. Myofascial release.",
    },
    {
      name: "Gentle Walking",
      sets: 1,
      duration_seconds: 300,
      note: "Light movement. Blood flow promotion.",
    },
  ],
};

const WARMUP_TARGET_SECONDS = 25 * 60;

function applyQuarterbackWarmupOverrides(plan) {
  const removeNames = new Set(["Ankle Rocker + Hip Circles", "5-10-5 Shuttle"]);
  const qbItems = [
    {
      name: "Band External Rotations",
      keywords: ["external rotation", "band external", "rotator cuff"],
      durationSeconds: 60,
      note: "Shoulder activation for throwing prep.",
    },
    {
      name: "Scap Push-ups",
      keywords: ["scap push", "scapular push", "scap push-up"],
      durationSeconds: 60,
      note: "Scapular control and shoulder stability.",
    },
    {
      name: "Wrist & Forearm Prep",
      keywords: ["wrist", "forearm", "grip"],
      durationSeconds: 90,
      note: "Wrist mobility and forearm activation.",
    },
  ];

  const filtered = plan.filter((item) => !removeNames.has(item.name));
  const insertIndex = Math.max(
    0,
    filtered.findIndex((item) => item.name === "Walking Lunge with Rotation") +
      1,
  );
  const updated = [...filtered];
  updated.splice(insertIndex, 0, ...qbItems);
  return updated;
}

function applyReceiverWarmupOverrides(plan) {
  const removeNames = new Set([
    "Ankle Rocker + Hip Circles",
    "Progressive Sprints 20m",
  ]);
  const wrItems = [
    {
      name: "Deceleration Drops",
      keywords: ["deceleration", "drop", "brake"],
      durationSeconds: 120,
      note: "Controlled stop mechanics to reduce injury risk.",
    },
    {
      name: "Lateral Shuffle + Stick",
      keywords: ["shuffle", "stick", "lateral"],
      durationSeconds: 60,
      note: "Plant-and-hold to prep for breaks and cuts.",
    },
  ];

  const filtered = plan.filter((item) => !removeNames.has(item.name));
  const insertIndex = Math.max(
    0,
    filtered.findIndex((item) => item.name === "B-Skips") + 1,
  );
  const updated = [...filtered];
  updated.splice(insertIndex, 0, ...wrItems);
  return updated;
}

function applyBlitzerWarmupOverrides(plan) {
  const removeNames = new Set([
    "Ankle Rocker + Hip Circles",
    "Progressive Sprints 20m",
  ]);
  const blitzerItems = [
    {
      name: "Pursuit Angle Sprints",
      keywords: ["pursuit", "angle sprint"],
      durationSeconds: 120,
      note: "Attack angles for blitz/pursuit mechanics.",
    },
    {
      name: "Shuffle-to-Sprint",
      keywords: ["shuffle", "sprint"],
      durationSeconds: 60,
      note: "Reactive change from lateral to forward sprint.",
    },
  ];

  const filtered = plan.filter((item) => !removeNames.has(item.name));
  const insertIndex = Math.max(
    0,
    filtered.findIndex((item) => item.name === "B-Skips") + 1,
  );
  const updated = [...filtered];
  updated.splice(insertIndex, 0, ...blitzerItems);
  return updated;
}

function buildWarmupTemplate({ variant, isQB, isCenter, warmupFocus }) {
  if (variant === "fitness") {
    return [
      {
        name: "Jump Rope",
        keywords: ["jump rope", "rope jump"],
        durationSeconds: 180,
        note: "Raise: steady rhythm, light on feet.",
      },
      {
        name: "Bike / Air Bike",
        keywords: ["bike", "air bike", "assault bike", "bicycle"],
        durationSeconds: 120,
        note: "Raise: easy pace, nasal breathing.",
      },
      {
        name: "Glute Bridge",
        keywords: ["glute bridge"],
        sets: 2,
        reps: 8,
        durationSeconds: 60,
        note: "Activate glutes before loading.",
      },
      {
        name: "Dead Bug",
        keywords: ["dead bug"],
        sets: 2,
        reps: 6,
        durationSeconds: 90,
        note: "Core activation with controlled breathing.",
      },
      {
        name: "Plank Series",
        keywords: ["plank", "side plank"],
        durationSeconds: 180,
        note: "Planks total 3 minutes (front + side).",
      },
      {
        name: "Nordic Hamstring Curl",
        keywords: ["nordic", "hamstring curl"],
        sets: 2,
        reps: 5,
        durationSeconds: 120,
        note: "Slow eccentric. Injury prevention emphasis.",
      },
      {
        name: "Toy Soldiers",
        keywords: ["toy soldier", "straight leg"],
        sets: 2,
        reps: 10,
        durationSeconds: 90,
        note: "Dynamic hamstring mobility.",
      },
      {
        name: "Lunge with Reach",
        keywords: ["lunge", "reach", "world's greatest"],
        sets: 2,
        reps: 8,
        durationSeconds: 120,
        note: "Hip mobility and thoracic rotation.",
      },
      {
        name: "Thoracic Rotations",
        keywords: ["thoracic", "rotation", "t-spine"],
        sets: 2,
        reps: 6,
        durationSeconds: 90,
        note: "Upper back mobility before lifting.",
      },
      {
        name: "Sled Push",
        keywords: ["sled", "sledge"],
        sets: 2,
        reps: 2,
        durationSeconds: 120,
        note: "Potentiate lower body for strength work.",
      },
      {
        name: "Med Ball Slams",
        keywords: ["slam", "med ball", "medicine ball"],
        sets: 2,
        reps: 6,
        durationSeconds: 60,
        note: "Power primer. Full hip drive.",
      },
      {
        name: "Squat to Stand",
        keywords: ["squat", "squat to stand"],
        sets: 2,
        reps: 6,
        durationSeconds: 90,
        note: "Ankles/hips/hamstrings mobility.",
      },
      {
        name: "Pogo Jumps",
        keywords: ["pogo", "ankle hop"],
        sets: 2,
        reps: 20,
        durationSeconds: 60,
        note: "Ankle stiffness and elastic rebound.",
      },
      {
        name: "Bicycle Spin",
        keywords: ["bicycle", "cycle", "bike"],
        durationSeconds: 120,
        note: "Finish raise phase: easy spin, smooth cadence.",
      },
    ];
  }

  let plan = [
    {
      name: "Easy Jog",
      keywords: ["jog", "easy run"],
      durationSeconds: 120,
      note: "Raise: light jog, relaxed shoulders.",
    },
    {
      name: "Lateral Shuffle + Backpedal",
      keywords: ["shuffle", "backpedal"],
      durationSeconds: 120,
      note: "Raise: prep for multi-direction movement.",
    },
    {
      name: "Glute Bridge",
      keywords: ["glute bridge"],
      sets: 2,
      reps: 8,
      durationSeconds: 60,
      note: "Activate glutes before sprint mechanics.",
    },
    {
      name: "Mini-band Lateral Walks",
      keywords: ["band walk", "lateral walk", "monster walk"],
      sets: 2,
      reps: 8,
      durationSeconds: 90,
      note: "Activate glute medius for cutting.",
    },
    {
      name: "Calf Raises",
      keywords: ["calf raise"],
      sets: 2,
      reps: 10,
      durationSeconds: 60,
      note: "Prep Achilles and ankle stiffness.",
    },
    {
      name: "Nordic Hamstring Curl",
      keywords: ["nordic", "hamstring curl"],
      sets: 2,
      reps: 5,
      durationSeconds: 120,
      note: "Slow eccentric. Injury prevention emphasis.",
    },
    {
      name: "Toy Soldiers",
      keywords: ["toy soldier", "straight leg"],
      sets: 2,
      reps: 10,
      durationSeconds: 90,
      note: "Dynamic hamstring mobility.",
    },
    {
      name: "Leg Swings (Front/Side)",
      keywords: ["leg swing"],
      sets: 2,
      reps: 10,
      durationSeconds: 90,
      note: "Open hips and hamstrings.",
    },
    {
      name: "Walking Lunge with Rotation",
      keywords: ["lunge", "rotation"],
      sets: 2,
      reps: 8,
      durationSeconds: 120,
      note: "Hip mobility + trunk control.",
    },
    {
      name: "Ankle Rocker + Hip Circles",
      keywords: ["ankle rocker", "hip circle"],
      durationSeconds: 60,
      note: "Restore ankle/hip range for sprinting.",
    },
    {
      name: "A-Skips",
      keywords: ["a-skip", "a skip"],
      sets: 2,
      reps: 20,
      durationSeconds: 90,
      note: "Sprint mechanics: knee drive + dorsiflex.",
    },
    {
      name: "B-Skips",
      keywords: ["b-skip", "b skip"],
      sets: 2,
      reps: 20,
      durationSeconds: 90,
      note: "Sprint mechanics: pawing action.",
    },
    {
      name: "Acceleration Builds 10m",
      keywords: ["acceleration", "build", "10m"],
      sets: 3,
      reps: 1,
      durationSeconds: 120,
      note: "3 x 10m progressive accelerations.",
    },
    {
      name: "Progressive Sprints 20m",
      keywords: ["sprint", "20m"],
      sets: 2,
      reps: 1,
      durationSeconds: 120,
      note: "2 x 20m at 70-85%. Full recovery.",
    },
    {
      name: "5-10-5 Shuttle",
      keywords: ["5-10-5", "pro agility", "shuttle"],
      sets: 2,
      reps: 1,
      durationSeconds: 150,
      note: "Change of direction primer. Full recovery.",
    },
  ];

  if (warmupFocus === "quarterback" || warmupFocus === "center") {
    plan = applyQuarterbackWarmupOverrides(plan);
  } else if (warmupFocus === "blitzer") {
    plan = applyBlitzerWarmupOverrides(plan);
  } else if (warmupFocus === "wr_db") {
    plan = applyReceiverWarmupOverrides(plan);
  } else if (isQB || isCenter) {
    plan = applyQuarterbackWarmupOverrides(plan);
  }

  return plan;
}

function selectWarmupVariant({
  isFitnessDay,
  isSprintSession,
  isPracticeDay,
  trainingFocus,
}) {
  if (isFitnessDay) {
    return "fitness";
  }
  const focus = (trainingFocus || "").toLowerCase();
  if (
    isSprintSession ||
    isPracticeDay ||
    focus.includes("speed") ||
    focus.includes("sprint") ||
    focus.includes("agility")
  ) {
    return "field";
  }
  return "field";
}

/**
 * Generate fallback protocol exercises when database is empty
 * Uses deterministic selection based on dayOfYear for variety
 */
async function generateFallbackProtocolExercises(
  protocolId,
  dayOfYear,
  weekNumber,
  trainingFocus,
  context,
  isPracticeDay,
  isFilmRoomDay,
  readinessForLogic,
) {
  const exercises = [];
  let sequenceOrder = 0;

  // Deterministic shuffle using seed (dayOfYear + weekNumber)
  const seededShuffle = (arr, seed) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor((Math.sin(seed + i) * 10000 + 0.5) % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const seed = dayOfYear + weekNumber * 7;

  // 1. Morning Mobility - day-specific video
  const dayOfWeek = new Date().getDay(); // 0 = Sunday
  const mobilityIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Map to 0-6
  const mobilityExercise = FALLBACK_EXERCISES.morning_mobility[mobilityIdx];
  sequenceOrder++;
  exercises.push({
    protocol_id: protocolId,
    exercise_id: null,
    block_type: "morning_mobility",
    sequence_order: sequenceOrder,
    prescribed_sets: 1,
    prescribed_duration_seconds: mobilityExercise.duration_seconds,
    video_url: mobilityExercise.video_url,
    ai_note: `📱 ${mobilityExercise.name} - Follow along with the YouTube video`,
  });

  // 2. Foam Rolling (select 4-5 based on day)
  const foamRolls = seededShuffle(FALLBACK_EXERCISES.foam_roll, seed).slice(
    0,
    5,
  );
  foamRolls.forEach((ex) => {
    sequenceOrder++;
    exercises.push({
      protocol_id: protocolId,
      exercise_id: null,
      block_type: "foam_roll",
      sequence_order: sequenceOrder,
      prescribed_sets: ex.sets || 1,
      prescribed_duration_seconds: ex.duration_seconds,
      ai_note: ex.note,
    });
  });

  // 3. Warm-up (25 min, variant by session type)
  const isSprintSession =
    context?.dayOfWeek === 6 ||
    trainingFocus?.toLowerCase().includes("speed") ||
    trainingFocus?.toLowerCase().includes("sprint");
  const isFitnessDay =
    !isPracticeDay &&
    !isFilmRoomDay &&
    ["strength", "power", "conditioning", "gym", "fitness", "weights"].includes(
      trainingFocus?.toLowerCase() || "",
    );
  const warmupVariant = selectWarmupVariant({
    isFitnessDay,
    isSprintSession,
    isPracticeDay,
    trainingFocus,
  });
  const warmupPlan = buildWarmupTemplate({
    variant: warmupVariant,
    isQB: context.isQB,
    isCenter: context.isCenter,
    warmupFocus: context.warmupFocus,
  });
  const warmupTotalSeconds = warmupPlan.reduce(
    (sum, item) => sum + (item.durationSeconds || 0),
    0,
  );
  if (warmupTotalSeconds !== WARMUP_TARGET_SECONDS) {
    console.warn(
      `[daily-protocol] Warm-up plan totals ${warmupTotalSeconds}s (target ${WARMUP_TARGET_SECONDS}s)`,
    );
  }

  warmupPlan.forEach((item) => {
    sequenceOrder++;
    exercises.push({
      protocol_id: protocolId,
      exercise_id: null,
      block_type: "warm_up",
      sequence_order: sequenceOrder,
      prescribed_sets: item.sets || 1,
      prescribed_reps: item.reps || null,
      prescribed_duration_seconds: item.durationSeconds || null,
      ai_note: item.note,
    });
  });

  // Skip main gym blocks on practice/film/recovery days
  const isGymTrainingDay =
    !isPracticeDay && !isFilmRoomDay && trainingFocus !== "recovery";

  if (isGymTrainingDay) {
    // 4. Isometrics (select 4-5)
    const isometrics = seededShuffle(
      FALLBACK_EXERCISES.isometrics,
      seed + 2,
    ).slice(0, 5);
    isometrics.forEach((ex) => {
      sequenceOrder++;
      exercises.push({
        protocol_id: protocolId,
        exercise_id: null,
        block_type: "isometrics",
        sequence_order: sequenceOrder,
        prescribed_sets: ex.sets || 3,
        prescribed_hold_seconds: ex.hold_seconds,
        ai_note: `📊 ${ex.note}`,
      });
    });

    // 5. Plyometrics (select 4 based on readiness)
    const plyoCount = readinessForLogic >= 70 ? 4 : 3;
    const plyos = seededShuffle(FALLBACK_EXERCISES.plyometrics, seed + 3).slice(
      0,
      plyoCount,
    );
    plyos.forEach((ex) => {
      sequenceOrder++;
      exercises.push({
        protocol_id: protocolId,
        exercise_id: null,
        block_type: "plyometrics",
        sequence_order: sequenceOrder,
        prescribed_sets: ex.sets || 3,
        prescribed_reps: ex.reps,
        ai_note: `⚡ ${ex.note}`,
      });
    });

    // 6. Strength (select 4-5)
    const strengths = seededShuffle(
      FALLBACK_EXERCISES.strength,
      seed + 4,
    ).slice(0, 5);
    strengths.forEach((ex) => {
      sequenceOrder++;
      exercises.push({
        protocol_id: protocolId,
        exercise_id: null,
        block_type: "strength",
        sequence_order: sequenceOrder,
        prescribed_sets: ex.sets || 3,
        prescribed_reps: ex.reps,
        ai_note: `💪 ${ex.note}`,
      });
    });

    // 7. Conditioning (select 3-4)
    const conditionings = seededShuffle(
      FALLBACK_EXERCISES.conditioning,
      seed + 5,
    ).slice(0, 4);
    conditionings.forEach((ex) => {
      sequenceOrder++;
      exercises.push({
        protocol_id: protocolId,
        exercise_id: null,
        block_type: "conditioning",
        sequence_order: sequenceOrder,
        prescribed_sets: ex.sets || 4,
        prescribed_reps: ex.reps,
        prescribed_duration_seconds: ex.duration_seconds,
        ai_note: `🏃 ${ex.note}`,
      });
    });

    // 8. Skill drills (select 3)
    const skills = seededShuffle(FALLBACK_EXERCISES.skill, seed + 6).slice(
      0,
      3,
    );
    skills.forEach((ex) => {
      sequenceOrder++;
      exercises.push({
        protocol_id: protocolId,
        exercise_id: null,
        block_type: "skill_drills",
        sequence_order: sequenceOrder,
        prescribed_sets: ex.sets || 3,
        prescribed_reps: ex.reps,
        prescribed_duration_seconds: ex.duration_seconds,
        ai_note: `🎯 ${ex.note}`,
      });
    });
  }

  // 9. Cool down (select 4-5)
  const coolDowns = seededShuffle(FALLBACK_EXERCISES.cool_down, seed + 7).slice(
    0,
    5,
  );
  coolDowns.forEach((ex) => {
    sequenceOrder++;
    exercises.push({
      protocol_id: protocolId,
      exercise_id: null,
      block_type: "cool_down",
      sequence_order: sequenceOrder,
      prescribed_sets: ex.sets || 1,
      prescribed_reps: ex.reps,
      prescribed_hold_seconds: ex.hold_seconds,
      ai_note: `🧘 ${ex.note}`,
    });
  });

  // 10. Evening Recovery (select 2-3)
  const recoveryCount = trainingFocus === "recovery" ? 4 : 2;
  const recoveries = seededShuffle(FALLBACK_EXERCISES.recovery, seed + 8).slice(
    0,
    recoveryCount,
  );
  recoveries.forEach((ex) => {
    sequenceOrder++;
    exercises.push({
      protocol_id: protocolId,
      exercise_id: null,
      block_type: "evening_recovery",
      sequence_order: sequenceOrder,
      prescribed_sets: ex.sets || 1,
      prescribed_duration_seconds: ex.duration_seconds,
      ai_note: `😴 ${ex.note}`,
    });
  });

  console.log(
    `[daily-protocol] Generated ${exercises.length} fallback exercises for day ${dayOfYear} (week ${weekNumber})`,
  );

  return exercises;
}

/**
 * Get periodization phase based on current month
 * Based on 52-week flag football periodization model
 */
function getCurrentPeriodizationPhase(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12

  switch (month) {
    case 11:
      return "off_season_rest"; // November - Active Recovery
    case 12:
      return "foundation"; // December - Foundation Building
    case 1:
      return "strength_accumulation"; // January - Strength Accumulation
    case 2:
      return "power_development"; // February - Power Development
    case 3:
      return "speed_development"; // March - Speed & Explosive
    case 4:
    case 5:
    case 6:
      return "in_season_maintenance"; // Apr-Jun - Competition Season
    case 7:
      return "mid_season_reload"; // July - Mid-Season Reload
    case 8:
      return "peak"; // August - Championship Peak
    case 9:
    case 10:
      return "in_season_maintenance"; // Sep-Oct - Late Season
    default:
      return "foundation";
  }
}

/**
 * Get plyometric intensity level based on phase and readiness
 */
function getPlyometricIntensity(phase, readinessScore) {
  // Safety first: Low readiness = low intensity regardless of phase
  if (readinessScore && readinessScore < 50) {
    return "low";
  }
  if (readinessScore && readinessScore < 70) {
    return "medium";
  }

  const phaseIntensityMap = {
    off_season_rest: "low",
    foundation: "low",
    strength_accumulation: "medium",
    power_development: "high",
    speed_development: "very_high",
    competition_prep: "high",
    in_season_maintenance: "medium",
    mid_season_reload: "medium",
    peak: "high",
    taper: "low",
    active_recovery: "low",
  };

  return phaseIntensityMap[phase] || "medium";
}

/**
 * Calculate safe conditioning intensity based on ACWR and training history
 * SAFETY RULE: No 80%+ sprinting on day 1 - must build progressively
 */
function getSafeConditioningIntensity(acwr, daysSinceLastSession, phase) {
  // Critical safety: First day back or no recent training = low intensity
  if (daysSinceLastSession === null || daysSinceLastSession > 7) {
    return {
      maxIntensity: 50,
      note: "⚠️ Returning to training - start at 50% intensity max",
    };
  }

  // ACWR danger zone: Reduce load significantly
  if (acwr && acwr > 1.5) {
    return {
      maxIntensity: 40,
      note: "🚨 ACWR >1.5 - reduce load to prevent injury",
    };
  }

  // ACWR elevated: Moderate reduction
  if (acwr && acwr > 1.3) {
    return {
      maxIntensity: 60,
      note: "⚠️ ACWR elevated - moderate intensity recommended",
    };
  }

  // Phase-based max intensity
  const phaseIntensityMax = {
    off_season_rest: 40,
    foundation: 60,
    strength_accumulation: 75,
    power_development: 85,
    speed_development: 95,
    competition_prep: 90,
    in_season_maintenance: 80,
    mid_season_reload: 75,
    peak: 95,
    taper: 60,
    active_recovery: 40,
  };

  return {
    maxIntensity: phaseIntensityMax[phase] || 70,
    note: null,
  };
}

/**
 * Check if Nordic curls should be included today
 * Evidence: 2-3x per week reduces hamstring injury by 50-70%
 */
function shouldIncludeNordicCurls(dayOfWeek, trainingFocus) {
  // Nordic curls recommended on strength/power days: Mon, Wed, Fri
  const nordicDays = [1, 3, 5]; // Monday, Wednesday, Friday

  // Also include on any strength-focused day
  const strengthFocusDays = [
    "strength",
    "power",
    "strength_accumulation",
    "power_development",
  ];

  return (
    nordicDays.includes(dayOfWeek) || strengthFocusDays.includes(trainingFocus)
  );
}

// Day names for schedule matching
const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate) {
  if (!birthDate) {
    return null;
  }
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Position mapping from UI values to modifier keys
 * Maps onboarding position values to position_exercise_modifiers.position values
 */
const POSITION_TO_MODIFIER_KEY = {
  // Standard abbreviations
  QB: "quarterback",
  WR: "wr_db",
  DB: "wr_db",
  Center: "center",
  Rusher: "rusher",
  Blitzer: "blitzer",
  LB: "linebacker",
  Hybrid: "hybrid",
  // Full names (from user profile)
  Quarterback: "quarterback",
  "Wide Receiver": "wr_db",
  "Defensive Back": "wr_db",
  Safety: "wr_db",
  Cornerback: "wr_db",
  Linebacker: "linebacker",
  // Lowercase variants (from athlete_training_config)
  quarterback: "quarterback",
  wr_db: "wr_db",
  center: "center",
  rusher: "rusher",
  blitzer: "blitzer",
  linebacker: "linebacker",
  hybrid: "hybrid",
  // Additional lowercase variants
  "wide receiver": "wr_db",
  "defensive back": "wr_db",
  safety: "wr_db",
  cornerback: "wr_db",
};

/**
 * Normalize position value to modifier key
 */
function normalizePosition(position) {
  if (!position) {
    return "wr_db";
  }
  return POSITION_TO_MODIFIER_KEY[position] || "wr_db";
}

/**
 * Get user's training context - position, age modifiers, practice schedule, current program
 */
async function getUserTrainingContext(supabase, userId, date) {
  const dayOfWeek = new Date(date).getDay();
  const dayName = DAY_NAMES[dayOfWeek];

  // 1. Get user config (position, age, practice schedule) - may not exist yet
  const { data: config } = await supabase
    .from("athlete_training_config")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // 2. Get user's birth date and position from users table if not in config
  let birthDate = config?.birth_date;
  let userPosition = config?.primary_position;

  // Fallback to users table if config doesn't exist or is missing data
  const { data: userData } = await supabase
    .from("users")
    .select("date_of_birth, birth_date, position")
    .eq("id", userId)
    .maybeSingle();

  if (!birthDate) {
    birthDate = userData?.date_of_birth || userData?.birth_date;
  }

  // If no position in config, use position from users table
  if (!userPosition && userData?.position) {
    userPosition = normalizePosition(userData.position);
    console.log(
      `[daily-protocol] No athlete_training_config, using users.position: ${userData.position} -> ${userPosition}`,
    );
  }

  // 3. Calculate age and get recovery modifier
  const age = calculateAge(birthDate);
  let ageModifier = null;
  if (age) {
    const { data: modifier } = await supabase
      .from("age_recovery_modifiers")
      .select("*")
      .lte("age_min", age)
      .gte("age_max", age)
      .maybeSingle();
    ageModifier = modifier;
  }

  // 4. Get assigned program and current phase/week - may not have one yet
  const { data: playerProgram } = await supabase
    .from("player_programs")
    .select(
      `
      *,
      training_programs (
        id, name, program_type, program_structure
      )
    `,
    )
    .eq("player_id", userId)
    .eq("status", "active")
    .maybeSingle();

  // 5. Get current week based on date
  let currentWeek = null;
  let currentPhase = null;
  if (playerProgram?.training_programs?.id) {
    // Get phase for this date - may not match any phase
    const { data: phase } = await supabase
      .from("training_phases")
      .select("*")
      .eq("program_id", playerProgram.training_programs.id)
      .lte("start_date", date)
      .gte("end_date", date)
      .maybeSingle();
    currentPhase = phase;

    // Get week for this date
    if (phase) {
      const { data: week } = await supabase
        .from("training_weeks")
        .select("*")
        .eq("phase_id", phase.id)
        .lte("start_date", date)
        .gte("end_date", date)
        .maybeSingle();
      currentWeek = week;
    }
  }

  // 6. Resolve team activity for this athlete-day (PROMPT 2.10 - Source of Truth)
  let teamActivityResult = null;
  try {
    teamActivityResult = await resolveTeamActivityForAthleteDay(
      supabase,
      userId,
      null, // teamId will be looked up
      date,
    );
  } catch (error) {
    console.warn("[daily-protocol] Team activity resolution error:", error);
    // Non-fatal - continue without team activity
  }

  // 7. Get today's session template using deterministic resolver (BLOCKER A FIX)
  // This ensures we always get a real session from the 52-week plan, never generic fallbacks
  let sessionTemplate = null;
  let sessionResolution = null;

  try {
    sessionResolution = await resolveTodaySession(supabase, userId, date);

    if (sessionResolution.success) {
      sessionTemplate = sessionResolution.session;
      console.log("[daily-protocol] Session resolved successfully:", {
        sessionName: sessionTemplate?.session_name,
        override: sessionResolution.override?.type || "none",
        metadata: sessionResolution.metadata,
      });
    } else {
      console.log("[daily-protocol] Session resolution failed:", {
        status: sessionResolution.status,
        reason: sessionResolution.reason,
        metadata: sessionResolution.metadata,
      });
      // sessionTemplate remains null - we'll handle this truthfully below
    }
  } catch (error) {
    console.error("[daily-protocol] Session resolution error:", error);
    // Continue with sessionTemplate = null
  }

  // 8. Apply team activity override to session resolution (PROMPT 2.10 + PROMPT 2.19)
  // Use centralized computeOverride for single source of truth
  if (teamActivityResult?.exists && teamActivityResult.activity) {
    const teamActivity = {
      type: teamActivityResult.activity.type,
      startTimeLocal: teamActivityResult.activity.startTimeLocal,
      participation: teamActivityResult.participation,
      replacesSession: teamActivityResult.activity.replacesSession,
    };

    // Check for rehab status from the resolver
    const rehabActive =
      teamActivityResult.participation === "excluded" &&
      teamActivityResult.audit?.steps?.some((s) => s.step === "rehab_override");
    const injuries =
      teamActivityResult.audit?.steps?.find((s) => s.step === "rehab_check")
        ?.injuries || [];

    const override = computeOverride({
      rehabActive,
      injuries,
      coachAlertActive: false, // Not available in context yet
      weatherOverride: teamActivityResult.activity.weatherOverride || false,
      teamActivity,
      taperActive: false, // Taper is handled separately below
      taperContext: null,
    });

    if (override) {
      if (!sessionResolution) {
        sessionResolution = {
          success: true,
          status: "resolved",
          override: null,
        };
      }
      sessionResolution.override = override;

      console.log("[daily-protocol] Override computed via computeOverride:", {
        overrideType: override.type,
        participation: teamActivity.participation,
        activityType: teamActivity.type,
      });
    } else if (teamActivityResult.participation === "excluded") {
      // Participation is excluded but no rehab override - log for debugging
      console.log(
        "[daily-protocol] Team activity exists but athlete excluded (no override):",
        {
          activityType: teamActivity.type,
          participation: teamActivityResult.participation,
        },
      );
    }
  }

  // 8. Get ACWR and readiness from wellness checkin
  let readiness = null;

  // First try to get from wellness checkin (new system)
  const { data: wellnessData } = await supabase.rpc("get_athlete_readiness", {
    p_user_id: userId,
    p_date: date,
  });

  if (wellnessData && wellnessData.length > 0 && wellnessData[0].has_checkin) {
    const w = wellnessData[0];
    readiness = {
      score: w.readiness_score,
      sleepQuality: w.sleep_quality,
      energyLevel: w.energy_level,
      muscleSoreness: w.muscle_soreness,
      stressLevel: w.stress_level,
      sorenessAreas: w.soreness_areas,
      hasCheckin: true,
    };
  } else {
    // Fallback to old readiness_scores table - may not have entry for this day
    const { data: oldReadiness } = await supabase
      .from("readiness_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("day", date)
      .maybeSingle();

    if (oldReadiness) {
      readiness = {
        score: oldReadiness.score || oldReadiness.readiness_score,
        acwr: oldReadiness.acwr,
        hasCheckin: true,
      };
    }
  }

  // 9. Get position-specific modifiers
  // Use userPosition which was already normalized from config or users table
  const position = userPosition || "wr_db";
  const { data: positionModifiers } = await supabase
    .from("position_exercise_modifiers")
    .select("*")
    .eq("position", position);

  console.log(
    `[daily-protocol] Fetching modifiers for position: ${position}, found: ${positionModifiers?.length || 0}`,
  );

  // 10. Calculate ACWR target range (adjusted by age)
  const baseAcwrMin = config?.acwr_target_min || 0.8;
  const baseAcwrMax = config?.acwr_target_max || 1.3;
  const acwrAdjustment = ageModifier?.acwr_max_adjustment || 0;

  // 11. Get upcoming tournaments and check for taper period
  const { data: upcomingTournaments } = await supabase
    .from("tournament_calendar")
    .select("*")
    .gte("start_date", date)
    .order("start_date", { ascending: true })
    .limit(3);

  // Calculate taper context
  let taperContext = null;
  if (upcomingTournaments && upcomingTournaments.length > 0) {
    for (const tournament of upcomingTournaments) {
      const tournamentDate = new Date(tournament.start_date);
      const currentDate = new Date(date);
      const daysUntil = Math.ceil(
        (tournamentDate - currentDate) / (1000 * 60 * 60 * 24),
      );
      const taperWeeks = tournament.taper_weeks_before || 1;
      const taperDays = taperWeeks * 7;

      if (daysUntil <= taperDays && daysUntil > 0) {
        // We're in taper period
        const taperProgress = 1 - daysUntil / taperDays; // 0 at start, 1 at tournament

        // Calculate taper reduction:
        // Peak events: reduce to 40% at tournament
        // Regular events: reduce to 60% at tournament
        const minLoadPercent = tournament.is_peak_event ? 0.4 : 0.6;
        const loadMultiplier = 1 - taperProgress * (1 - minLoadPercent);

        taperContext = {
          isInTaper: true,
          tournament: {
            id: tournament.id,
            name: tournament.name,
            startDate: tournament.start_date,
            isPeakEvent: tournament.is_peak_event,
            gamesExpected: tournament.games_expected,
            throwsPerGameQb: tournament.throws_per_game_qb,
          },
          daysUntil,
          taperWeeks,
          taperProgress: Math.round(taperProgress * 100),
          loadMultiplier: Math.round(loadMultiplier * 100) / 100,
          recommendation: getTaperRecommendation(
            daysUntil,
            tournament.is_peak_event,
          ),
        };
        break; // Use first tournament we're tapering for
      }
    }
  }

  return {
    config: config || { primary_position: "wr_db" },
    position,
    warmupFocus: config?.warmup_focus || null,
    age,
    ageModifier,
    birthDate,
    playerProgram,
    currentPhase,
    currentWeek,
    sessionTemplate,
    sessionResolution, // BREACH FIX #1: Return session resolution for confidence metadata
    teamActivity: teamActivityResult, // PROMPT 2.10: Team activity source of truth
    // DEPRECATED: availability is informational only; team_activities is authority.
    readiness,
    positionModifiers: positionModifiers || [],
    dayOfWeek,
    dayName,
    acwrTargetRange: {
      min: baseAcwrMin,
      max: baseAcwrMax + acwrAdjustment,
    },
    // Tournament/Taper
    upcomingTournaments: upcomingTournaments || [],
    taperContext,
    // Position-specific flags
    isQB: position === "quarterback",
    isCenter: position === "center",
    isBlitzer: position === "blitzer" || position === "rusher",
  };
}

/**
 * Get taper recommendation based on days until tournament
 */
function getTaperRecommendation(daysUntil, isPeakEvent) {
  if (daysUntil <= 2) {
    return "🎯 Tournament imminent - Light mobility and activation only. Focus on rest and hydration.";
  }
  if (daysUntil <= 4) {
    return "🔄 Final prep phase - Very light training. Prioritize sleep and nutrition.";
  }
  if (daysUntil <= 7) {
    return isPeakEvent
      ? "⚡ Peak week - Reduce volume 50%, maintain intensity on key movements."
      : "📉 Taper week - Reduce volume 30%, sharpen movement quality.";
  }
  if (daysUntil <= 14) {
    return isPeakEvent
      ? "📊 Peak event taper - Volume reducing 40%. Focus on explosiveness over endurance."
      : "📈 Tournament prep - Moderate reduction. Keep intensity, cut volume 20%.";
  }
  return "🏋️ Pre-taper - Normal training with focus on building capacity for tournament.";
}

/**
 * Main handler
 */
const legacyDailyProtocolHandler = async (event) => {
  const { httpMethod, path, queryStringParameters, body, headers } = event;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };
  const withHeaders = (response) => ({ ...response, headers: corsHeaders });

  // Handle preflight
  if (httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  const auth = await authenticateRequest(event);
  if (!auth.success) {
    return withHeaders(auth.error);
  }
  const { user, token } = auth;
  // Use user JWT client for user-scoped operations
  const supabase = getSupabase(token);

  try {
    // Route to appropriate handler
    const pathParts = path.split("/").filter(Boolean);
    const endpoint = pathParts[pathParts.length - 1];

    if (httpMethod === "GET" && endpoint === "daily-protocol") {
      return await getProtocol(
        supabase,
        user.id,
        queryStringParameters,
        corsHeaders,
      );
    }

    if (httpMethod === "POST") {
      let payload = {};
      try {
        payload = body ? JSON.parse(body) : {};
      } catch (_parseError) {
        return withHeaders(
          handleValidationError("Invalid JSON in request body"),
        );
      }

      switch (endpoint) {
        case "generate":
          return await generateProtocol(
            supabase,
            user.id,
            payload,
            corsHeaders,
          );
        case "complete":
          return await completeExercise(
            supabase,
            user.id,
            payload,
            corsHeaders,
          );
        case "skip":
          return await skipExercise(supabase, user.id, payload, corsHeaders);
        case "complete-block":
          return await completeBlock(supabase, user.id, payload, corsHeaders);
        case "skip-block":
          return await skipBlock(supabase, user.id, payload, corsHeaders);
        case "log-session":
          return await logSession(supabase, user.id, payload, corsHeaders);
        default:
          break;
      }
    }

    return {
      ...createErrorResponse("Not found", 404, "not_found"),
      headers: corsHeaders,
    };
  } catch (err) {
    console.error("Daily protocol error:", err);
    return {
      ...createErrorResponse("Internal server error", 500, "server_error"),
      headers: corsHeaders,
    };
  }
};

export const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "daily-protocol",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt) => legacyDailyProtocolHandler(evt),
  });

/**
 * GET /api/daily-protocol
 * Fetch today's (or specified date's) protocol for the user
 */
async function getProtocol(supabase, userId, params, headers) {
  const date = params?.date || new Date().toISOString().split("T")[0];

  // Get the protocol
  const { data: protocol, error: protocolError } = await supabase
    .from("daily_protocols")
    .select("*")
    .eq("user_id", userId)
    .eq("protocol_date", date)
    .single();

  if (protocolError && protocolError.code !== "PGRST116") {
    throw protocolError;
  }

  if (!protocol) {
    // No protocol exists for this date
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: null }),
    };
  }

  // Get coach name if protocol was modified by coach
  let coachName = null;
  if (protocol.modified_by_coach_id) {
    const { data: coach } = await supabase
      .from("users")
      .select("full_name, first_name, last_name")
      .eq("id", protocol.modified_by_coach_id)
      .maybeSingle();
    if (coach) {
      coachName =
        coach.full_name ||
        `${coach.first_name || ""} ${coach.last_name || ""}`.trim() ||
        "Coach";
    }
  }

  // Resolve team activity for this athlete-day (PROMPT 2.10)
  let teamActivity = null;
  let sessionResolution = null;

  try {
    const teamActivityResult = await resolveTeamActivityForAthleteDay(
      supabase,
      userId,
      null, // teamId will be looked up
      date,
    );

    if (teamActivityResult.exists && teamActivityResult.activity) {
      teamActivity = {
        type: teamActivityResult.activity.type,
        startTimeLocal: teamActivityResult.activity.startTimeLocal,
        endTimeLocal: teamActivityResult.activity.endTimeLocal,
        location: teamActivityResult.activity.location,
        participation: teamActivityResult.participation,
        createdByCoachName: teamActivityResult.activity.createdByCoachName,
        updatedAtLocal: teamActivityResult.activity.updatedAt,
        note: teamActivityResult.activity.note,
        replacesSession: teamActivityResult.activity.replacesSession,
      };

      // PROMPT 2.19: Use centralized computeOverride for single source of truth
      // Check for rehab status from the resolver (it already checked wellness checkin)
      const rehabActive =
        teamActivityResult.participation === "excluded" &&
        teamActivityResult.audit?.steps?.some(
          (s) => s.step === "rehab_override",
        );
      const injuries =
        teamActivityResult.audit?.steps?.find((s) => s.step === "rehab_check")
          ?.injuries || [];

      const override = computeOverride({
        rehabActive,
        injuries,
        coachAlertActive: protocol?.coach_alert_active || false,
        weatherOverride: teamActivityResult.activity.weatherOverride || false,
        teamActivity,
        taperActive: false, // Would need to resolve taper context if needed
        taperContext: null,
      });

      sessionResolution = {
        success: true,
        status: "resolved",
        override,
      };
    }
  } catch (teamActivityError) {
    console.warn(
      "[daily-protocol] Team activity resolution failed:",
      teamActivityError,
    );
    // Non-fatal - continue without team activity
  }

  // Get all exercises for this protocol
  let { data: protocolExercises, error: exercisesError } = await supabase
    .from("protocol_exercises")
    .select(
      `
      *,
      exercises (
        id, name, slug, category, subcategory,
        video_url, video_id, video_duration_seconds, thumbnail_url,
        how_text, feel_text, compensation_text,
        default_sets, default_reps, default_hold_seconds, default_duration_seconds,
        difficulty_level, load_contribution_au, is_high_intensity
      )
    `,
    )
    .eq("protocol_id", protocol.id)
    .order("sequence_order");

  if (exercisesError) {
    throw exercisesError;
  }

  // Debug logging to understand exercise state
  console.log("[daily-protocol] Fetched protocol exercises:", {
    count: protocolExercises?.length || 0,
    protocolId: protocol.id,
    totalExercisesStored: protocol.total_exercises,
    // Sample first exercise to check structure
    firstExercise: protocolExercises?.[0]
      ? {
          id: protocolExercises[0].id,
          block_type: protocolExercises[0].block_type,
          exercise_id: protocolExercises[0].exercise_id,
          hasExerciseData: !!protocolExercises[0].exercises,
          exerciseName:
            protocolExercises[0].exercises?.name || "NO_EXERCISE_DATA",
        }
      : null,
  });

  // ============================================================================
  // AUTO-FIX: If protocol exists but has 0 exercises, regenerate using fallback
  // This fixes protocols that were created when the DB was empty
  // ============================================================================
  if (!protocolExercises || protocolExercises.length === 0) {
    console.log(
      "[daily-protocol] Protocol has 0 exercises - auto-regenerating with fallback",
    );

    // Check if exercises table is empty (triggers fallback)
    const { count: exerciseCount } = await supabase
      .from("exercises")
      .select("*", { count: "exact", head: true })
      .eq("active", true);

    if (!exerciseCount || exerciseCount < 10) {
      // Use inline fallback
      const dayOfYear = Math.floor(
        (new Date(date) - new Date(new Date(date).getFullYear(), 0, 0)) /
          (24 * 60 * 60 * 1000),
      );
      const weekNumber = Math.ceil(dayOfYear / 7);

      // Get basic context for fallback generation
      const trainingFocus = protocol.training_focus || "strength";
      const isPracticeDay = teamActivity?.type === "practice";
      const isFilmRoomDay = teamActivity?.type === "film_room";
      const readinessForLogic = protocol.readiness_score || 70;

      const fallbackExercises = await generateFallbackProtocolExercises(
        protocol.id,
        dayOfYear,
        weekNumber,
        trainingFocus,
        {
          position: null,
          isQB: false,
          isCenter: false,
          dayOfWeek: new Date(date).getDay(),
        },
        isPracticeDay,
        isFilmRoomDay,
        readinessForLogic,
      );

      if (fallbackExercises.length > 0) {
        const { error: insertError } = await supabase
          .from("protocol_exercises")
          .insert(fallbackExercises);

        if (insertError) {
          console.error(
            "[daily-protocol] Error inserting fallback exercises:",
            insertError,
          );
        } else {
          // Update protocol total_exercises count
          await supabase
            .from("daily_protocols")
            .update({ total_exercises: fallbackExercises.length })
            .eq("id", protocol.id);

          // Re-fetch exercises after inserting
          const { data: newExercises } = await supabase
            .from("protocol_exercises")
            .select(
              `
              *,
              exercises (
                id, name, slug, category, subcategory,
                video_url, video_id, video_duration_seconds, thumbnail_url,
                how_text, feel_text, compensation_text,
                default_sets, default_reps, default_hold_seconds, default_duration_seconds,
                difficulty_level, load_contribution_au, is_high_intensity
              )
            `,
            )
            .eq("protocol_id", protocol.id)
            .order("sequence_order");

          protocolExercises = newExercises || [];
          console.log(
            `[daily-protocol] Auto-fix complete: ${protocolExercises.length} exercises added`,
          );
        }
      }
    }
  }

  // DYNAMICALLY compute confidence_metadata based on CURRENT wellness status
  // This ensures the banner reflects the latest check-in, not stale stored values
  const dynamicConfidenceMetadata = await computeDynamicConfidenceMetadata(
    supabase,
    userId,
    date,
    protocol,
  );

  // Merge dynamic confidence metadata into protocol before transforming
  const protocolWithUpdatedMetadata = {
    ...protocol,
    confidence_metadata: dynamicConfidenceMetadata,
    // Also update readiness_score if we have a fresh check-in
    readiness_score: dynamicConfidenceMetadata.readiness?.hasData
      ? (dynamicConfidenceMetadata.readiness._readinessScore ??
        protocol.readiness_score)
      : protocol.readiness_score,
  };

  // Transform to frontend format
  const transformedProtocol = transformProtocolResponse(
    protocolWithUpdatedMetadata,
    protocolExercises,
    coachName,
    teamActivity, // Pass team activity to transformer
    sessionResolution, // Pass session resolution for PROMPT 2.12
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, data: transformedProtocol }),
  };
}

/**
 * Generate Return-to-Play Protocol
 * Progressive 3-week foundation building program for injured athletes
 * Based on sports medicine best practices for safe return to training
 */
async function generateReturnToPlayProtocol(
  supabase,
  userId,
  date,
  context,
  wellnessCheckin,
) {
  console.log("[RTP] Generating return-to-play protocol for", date);

  // Parse injury information
  const injuries = wellnessCheckin.soreness_areas || [];
  const injurySeverity = wellnessCheckin.overall_soreness || 3; // 1-5 scale
  const painLevel = wellnessCheckin.pain_level || 2; // 1-5 scale

  // Determine RTP phase based on pain level and time since injury
  let rtpPhase = 1; // Phase 1: Pain management & gentle mobility
  let phaseName = "Phase 1: Foundation & Pain Management";
  let aiRationale = `🏥 RETURN-TO-PLAY PROTOCOL - ${phaseName}\n\n`;

  // Add injury-specific guidance
  aiRationale += `Active concerns: ${injuries.join(", ")}\n`;
  aiRationale += `Pain level: ${painLevel}/5\n\n`;

  if (painLevel >= 4) {
    aiRationale += `⚠️ HIGH PAIN LEVEL: Focus on pain-free movement only. No loading exercises. Consult physiotherapist if pain persists.\n\n`;
    rtpPhase = 1;
  } else if (painLevel === 3) {
    aiRationale += `⚠️ MODERATE PAIN: Light activity only. Avoid aggravating movements. Progress slowly.\n\n`;
    rtpPhase = 1;
  } else if (painLevel === 2) {
    aiRationale += `✓ MILD DISCOMFORT: Can begin light loading. Monitor response carefully.\n\n`;
    rtpPhase = 2;
    phaseName = "Phase 2: Light Loading & Strengthening";
  } else {
    aiRationale += `✓ MINIMAL/NO PAIN: Can progress to moderate loading. Continue building foundation.\n\n`;
    rtpPhase = 3;
    phaseName = "Phase 3: Progressive Loading & Conditioning";
  }

  aiRationale += `📋 TODAY'S FOCUS:\n`;
  if (rtpPhase === 1) {
    aiRationale += `- Gentle mobility and pain-free movement\n`;
    aiRationale += `- Focus on areas NOT injured\n`;
    aiRationale += `- Build base conditioning without aggravation\n`;
    aiRationale += `- Daily foam rolling and mobility work\n`;
  } else if (rtpPhase === 2) {
    aiRationale += `- Light resistance training (bodyweight only)\n`;
    aiRationale += `- Controlled movements in pain-free ranges\n`;
    aiRationale += `- Progressive mobility work\n`;
    aiRationale += `- Monitor for any pain increase\n`;
  } else {
    aiRationale += `- Moderate loading (20-30% of normal)\n`;
    aiRationale += `- Position-specific skill work at reduced intensity\n`;
    aiRationale += `- Build work capacity progressively\n`;
    aiRationale += `- Prepare for return to team practice\n`;
  }

  aiRationale += `\n⚕️ STOP if pain increases beyond 3/10 during any exercise.\n`;
  aiRationale += `✓ Update your wellness check-in daily to track progress.\n`;

  // Create the RTP protocol in database
  const { data: protocol, error: protocolError } = await supabase
    .from("daily_protocols")
    .insert({
      user_id: userId,
      protocol_date: date,
      readiness_score: Math.max(30, 50 - painLevel * 10), // Lower readiness with injury
      acwr_value: 0.5, // Keep load very low during RTP
      training_focus: `return_to_play_phase_${rtpPhase}`,
      ai_rationale: aiRationale,
      total_load_target_au: rtpPhase * 100, // Progressive: 100, 200, 300 AU
    })
    .select()
    .single();

  if (protocolError) {
    console.error("[RTP] Error creating protocol:", protocolError);
    throw protocolError;
  }

  const protocolExercises = [];
  let sequenceOrder = 0;

  // ============================================================================
  // 1. MORNING MOBILITY - Always included, gentle version
  // ============================================================================
  // Get the day-specific morning mobility video first
  const rtpDayOfWeek = new Date(date).getDay();
  const rtpMobilitySlug = `morning-mobility-day-${rtpDayOfWeek === 0 ? 7 : rtpDayOfWeek}`;
  const { data: dayMobility } = await supabase
    .from("exercises")
    .select("*")
    .eq("slug", rtpMobilitySlug)
    .eq("active", true)
    .maybeSingle();

  // Get general mobility exercises
  const { data: mobilityExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "mobility")
    .is("position_specific", null)
    .eq("active", true)
    .limit(4);

  // Add day-specific mobility video first
  if (dayMobility) {
    protocolExercises.push({
      // protocol_id will be assigned by RPC
      exercise_id: dayMobility.id,
      block_type: "morning_mobility",
      block_order: 1,
      sequence_order: sequenceOrder++,
      prescribed_sets: 1,
      prescribed_reps: dayMobility.default_reps,
      prescribed_hold_seconds: dayMobility.default_hold_seconds,
      prescribed_duration_seconds: dayMobility.default_duration_seconds,
      rest_seconds: 30,
      notes: "RTP: Follow along with the gentle mobility video",
      load_contribution_au: 0,
    });
  }

  // Add general mobility exercises
  if (mobilityExercises && mobilityExercises.length > 0) {
    mobilityExercises.forEach((ex) => {
      protocolExercises.push({
        // protocol_id will be assigned by RPC
        exercise_id: ex.id,
        block_type: "morning_mobility",
        block_order: 1,
        sequence_order: sequenceOrder++,
        prescribed_sets: 1,
        prescribed_reps: ex.default_reps || 10,
        prescribed_hold_seconds: ex.default_hold_seconds || 30,
        rest_seconds: 30,
        notes: "Pain-free range of motion only. Gentle movements.",
        load_contribution_au: Math.round((ex.load_contribution_au || 10) * 0.5), // 50% load
      });
    });
  }

  // ============================================================================
  // 2. REHAB-SPECIFIC EXERCISES - Based on injury area
  // ============================================================================
  if (rtpPhase >= 2) {
    // Get rehab exercises from database
    const { data: rehabExercises } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "rehab")
      .eq("active", true)
      .order("difficulty_level") // Start with easiest
      .limit(4);

    if (rehabExercises && rehabExercises.length > 0) {
      rehabExercises.forEach((ex) => {
        const loadModifier = rtpPhase === 2 ? 0.3 : 0.5; // 30% or 50% normal load
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "rehab_progression",
          block_order: 2,
          sequence_order: sequenceOrder++,
          prescribed_sets: rtpPhase === 2 ? 2 : 3,
          prescribed_reps: ex.default_reps || 10,
          prescribed_hold_seconds: ex.default_hold_seconds,
          rest_seconds: 90,
          notes: `RTP Phase ${rtpPhase}: ${loadModifier * 100}% intensity. Monitor pain closely.`,
          load_contribution_au: Math.round(
            (ex.load_contribution_au || 20) * loadModifier,
          ),
        });
      });
    }
  }

  // ============================================================================
  // 3. PAIN-FREE CONDITIONING - Non-injured areas
  // ============================================================================
  if (rtpPhase >= 2) {
    // Add light conditioning that avoids injured areas
    const { data: conditioningExercises } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "conditioning")
      .eq("subcategory", "low_impact")
      .eq("active", true)
      .limit(3);

    if (conditioningExercises && conditioningExercises.length > 0) {
      conditioningExercises.forEach((ex) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "conditioning",
          block_order: 3,
          sequence_order: sequenceOrder++,
          prescribed_sets: 2,
          prescribed_duration_seconds: rtpPhase === 2 ? 30 : 45,
          rest_seconds: 60,
          notes: "Low impact only. Stop if pain occurs.",
          load_contribution_au: Math.round(
            (ex.load_contribution_au || 15) * 0.4,
          ),
        });
      });
    }
  }

  // ============================================================================
  // 4. EVENING RECOVERY - Always included
  // ============================================================================
  const { data: eveningMobility } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "recovery")
    .eq("active", true)
    .limit(4);

  if (eveningMobility && eveningMobility.length > 0) {
    eveningMobility.forEach((ex) => {
      protocolExercises.push({
        // protocol_id will be assigned by RPC
        exercise_id: ex.id,
        block_type: "evening_mobility",
        block_order: 4,
        sequence_order: sequenceOrder++,
        prescribed_sets: 1,
        prescribed_reps: ex.default_reps || 8,
        prescribed_hold_seconds: ex.default_hold_seconds || 30,
        rest_seconds: 30,
        notes: "Gentle recovery work. Focus on relaxation.",
        load_contribution_au: Math.round((ex.load_contribution_au || 8) * 0.5),
      });
    });
  }

  // Insert all exercises
  if (protocolExercises.length > 0) {
    const { error: insertError } = await supabase
      .from("protocol_exercises")
      .insert(protocolExercises);

    if (insertError) {
      console.error("[RTP] Error inserting exercises:", insertError);
      throw insertError;
    }
  }

  console.log(
    `[RTP] Generated Phase ${rtpPhase} protocol with ${protocolExercises.length} exercises`,
  );

  // Return the complete protocol
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({
      success: true,
      data: {
        ...protocol,
        exercises: protocolExercises,
        is_return_to_play: true,
        rtp_phase: rtpPhase,
        phase_name: phaseName,
      },
    }),
  };
}

/**
 * POST /api/daily-protocol/generate
 * Generate a new protocol for a given date using structured training data
 */
async function generateProtocol(supabase, userId, payload, headers) {
  const date = payload.date || new Date().toISOString().split("T")[0];

  // ============================================================================
  // IDEMPOTENCY SUPPORT
  // ============================================================================
  // Generate or use provided idempotency key
  let { idempotencyKey } = payload;

  if (!idempotencyKey) {
    // Derive deterministic key from userId + date + trainingFocus inputs
    // This ensures same inputs = same protocol
    const keyInputs = {
      userId,
      date,
      // Include key context that affects protocol generation
      // Note: We'll compute trainingFocus later, so use a hash of context
      timestamp: date, // Use date as deterministic seed
    };
    const keyString = JSON.stringify(keyInputs);
    idempotencyKey = crypto
      .createHash("sha256")
      .update(keyString)
      .digest("hex")
      .substring(0, 32);
  }

  // Check if this idempotency key was already processed
  const { data: existingRequest } = await supabase
    .from("protocol_generation_requests")
    .select("status, protocol_id, error")
    .eq("user_id", userId)
    .eq("protocol_date", date)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingRequest) {
    if (existingRequest.status === "completed" && existingRequest.protocol_id) {
      // Return existing protocol
      console.log(
        "[daily-protocol] Idempotent request - returning existing protocol:",
        existingRequest.protocol_id,
      );
      return await getProtocol(supabase, userId, { date }, headers);
    } else if (existingRequest.status === "failed") {
      // Previous attempt failed - allow retry but log the error
      console.warn(
        "[daily-protocol] Previous generation failed:",
        existingRequest.error,
      );
    }
    // If status is 'pending', continue (might be concurrent request, will be handled by unique constraint)
  }

  // Get user's full training context
  const context = await getUserTrainingContext(supabase, userId, date);

  // ============================================================================
  // INJURY CHECK - Priority #1 for athlete safety
  // ============================================================================
  // Check for active injuries from daily wellness checkin
  // Scope to check-ins on/before target date to prevent future check-ins
  const { data: wellnessCheckin } = await supabase
    .from("daily_wellness_checkin")
    .select("*")
    .eq("user_id", userId)
    .lte("checkin_date", date)
    .order("checkin_date", { ascending: false })
    .limit(1)
    .single();

  const hasActiveInjuries =
    wellnessCheckin?.soreness_areas &&
    wellnessCheckin.soreness_areas.length > 0;

  // If injuries exist, generate return-to-play protocol instead
  if (hasActiveInjuries) {
    console.log(
      "[daily-protocol] Active injuries detected:",
      wellnessCheckin.soreness_areas,
    );
    return await generateReturnToPlayProtocol(
      supabase,
      userId,
      date,
      context,
      wellnessCheckin,
    );
  }
  // ============================================================================

  // Record generation request (with unique constraint for concurrency safety)
  let requestRecord;
  try {
    const { data: request, error: requestError } = await supabase
      .from("protocol_generation_requests")
      .insert({
        user_id: userId,
        protocol_date: date,
        idempotency_key: idempotencyKey,
        status: "pending",
      })
      .select()
      .single();

    if (requestError) {
      // If unique constraint violation, another request is in progress
      if (requestError.code === "23505") {
        // Wait briefly and check if it completed
        await new Promise((resolve) => setTimeout(resolve, 500));
        const { data: completedRequest } = await supabase
          .from("protocol_generation_requests")
          .select("status, protocol_id")
          .eq("user_id", userId)
          .eq("protocol_date", date)
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();

        if (
          completedRequest?.status === "completed" &&
          completedRequest.protocol_id
        ) {
          return await getProtocol(supabase, userId, { date }, headers);
        }
        // If still pending or failed, proceed (will handle conflict in RPC)
      } else {
        throw requestError;
      }
    } else {
      requestRecord = request;
    }
  } catch (err) {
    // If insert fails for other reasons, log but continue
    console.warn(
      "[daily-protocol] Failed to record generation request:",
      err.message,
    );
  }

  // ============================================================================
  // PROMPT 6: TRUTHFULNESS CONTRACT - Remove Misleading Defaults
  // ============================================================================
  // Get readiness data (TRUTHFULLY - null when missing)
  // We compute confidence from canonical sources and keep safe defaults internal only

  // Raw truth from database
  const readinessScore = context.readiness?.score || null;
  const acwrValue = context.readiness?.acwr || null;

  // Calculate confidence metadata based on what we actually have
  // BREACH FIX #1: Use context.sessionResolution (now returned from getUserTrainingContext)
  // PROMPT 2.19: Remove duplicate override field - sessionResolution is the single source of truth
  const readinessHasCheckin = context.readiness?.hasCheckin === true;
  const readinessDaysStale = await computeReadinessDaysStale(
    supabase,
    userId,
    date,
    {
      hasCheckinToday: readinessHasCheckin,
      readinessScore,
    },
  );
  const trainingDaysLogged = await computeTrainingDaysLogged(
    supabase,
    userId,
    date,
  );

  const confidenceMetadata = {
    readiness: {
      hasData: readinessScore !== null,
      source: readinessHasCheckin ? "wellness_checkin" : "none",
      daysStale: readinessDaysStale,
      confidence: readinessScore !== null ? "high" : "none",
    },
    acwr: {
      hasData: acwrValue !== null,
      source:
        acwrValue !== null || trainingDaysLogged !== null
          ? "training_sessions"
          : "none",
      trainingDaysLogged,
      confidence: acwrValue !== null ? "high" : "building_baseline",
    },
    sessionResolution: {
      success: context.sessionResolution?.success || false,
      status: context.sessionResolution?.status || "unknown",
      hasProgram: !!context.playerProgram,
      hasSessionTemplate: !!context.sessionTemplate,
      // REMOVED: override field - use data.sessionResolution.override as single source of truth
    },
  };

  // Safe defaults for internal logic only (NOT persisted to database)
  // These allow generation logic to work while stored values remain truthful
  const readinessForLogic = readinessScore !== null ? readinessScore : 70;
  const acwrForLogic = acwrValue !== null ? acwrValue : 1.0;

  console.log("[daily-protocol] Truthfulness contract check:", {
    readiness: {
      truth: readinessScore,
      forLogic: readinessForLogic,
      willPersist: readinessScore, // Only truth gets persisted
    },
    acwr: {
      truth: acwrValue,
      forLogic: acwrForLogic,
      willPersist: acwrValue, // Only truth gets persisted
    },
    confidence: confidenceMetadata,
  });

  // Determine training focus based on context
  let trainingFocus = "strength";
  let aiRationale = "";

  // Check if it's a flag practice day (from teamActivity, not player schedule)
  // DEPRECATED: player schedule is not authority; canonical source is team_activities.
  const isPracticeDay =
    context.sessionResolution?.override?.type === "flag_practice";
  const isFilmRoomDay =
    context.sessionResolution?.override?.type === "film_room";

  if (isPracticeDay && context.teamActivity?.activity) {
    const practiceTime =
      context.teamActivity.activity.startTimeLocal || "18:00";
    aiRationale = `🏈 Flag practice day (${practiceTime}). `;

    if (context.isQB || context.isCenter) {
      aiRationale += context.isQB
        ? `QB: Practice scheduled. Arm care is light activation only - no heavy throwing before practice.`
        : `Center: Practice scheduled. Arm/wrist care is light activation only - snapping/throwing prep before practice.`;
      trainingFocus = "practice_day_qb";
    } else {
      aiRationale +=
        "Training adjusted to complement practice. Lower body work OK, rest before practice.";
      trainingFocus = "practice_day";
    }
  } else if (
    readinessForLogic < 50 ||
    acwrForLogic > context.acwrTargetRange.max
  ) {
    trainingFocus = "recovery";
    aiRationale =
      "⚠️ Readiness is low or ACWR is high. Today focuses on recovery and mobility.";
  } else if (readinessForLogic < 70) {
    trainingFocus = "skill";
    aiRationale =
      "Moderate readiness. Technical work recommended over high intensity.";
  } else {
    // Use session template focus if available
    if (context.sessionTemplate) {
      trainingFocus =
        context.sessionTemplate.session_type?.toLowerCase() || "strength";
      aiRationale = `📋 ${context.sessionTemplate.session_name}: ${context.sessionTemplate.description || "Structured training from your program."}`;
    } else {
      aiRationale = "Good readiness! Today is great for training.";
    }
  }

  // Check for taper period - this overrides other focus
  let taperLoadMultiplier = 1.0;
  if (context.taperContext?.isInTaper) {
    const taper = context.taperContext;
    taperLoadMultiplier = taper.loadMultiplier;

    // Override training focus for taper
    if (taper.daysUntil <= 2) {
      trainingFocus = "taper_final";
    } else if (taper.daysUntil <= 7) {
      trainingFocus = "taper_week";
    } else {
      trainingFocus = "taper_early";
    }

    // Add taper rationale at the start
    const taperEmoji = taper.tournament.isPeakEvent ? "🏆" : "🎯";
    aiRationale = `${taperEmoji} TAPER for ${taper.tournament.name} (${taper.daysUntil} days). ${taper.recommendation} ${aiRationale}`;
  }

  // Add age-based notes
  if (context.ageModifier && context.ageModifier.recovery_modifier > 1.1) {
    aiRationale += ` 👴 Age-adjusted recovery: ${Math.round((context.ageModifier.recovery_modifier - 1) * 100)}% more rest recommended (ACWR target: ${context.acwrTargetRange.min}-${context.acwrTargetRange.max.toFixed(2)}).`;
  }

  // Add phase info
  if (context.currentPhase) {
    aiRationale += ` 📅 Phase: ${context.currentPhase.name}.`;
  }

  // Add evidence-based periodization info
  const periodizationPhase = getCurrentPeriodizationPhase(new Date(date));
  const phaseNames = {
    off_season_rest: "Active Recovery",
    foundation: "Foundation Building",
    strength_accumulation: "Strength Accumulation",
    power_development: "Power Development",
    speed_development: "Speed & Explosive",
    competition_prep: "Competition Prep",
    in_season_maintenance: "In-Season Maintenance",
    mid_season_reload: "Mid-Season Reload",
    peak: "Championship Peak",
    taper: "Taper",
    active_recovery: "Active Recovery",
  };

  aiRationale += ` 📊 Periodization: ${phaseNames[periodizationPhase] || periodizationPhase}.`;

  // Add ACWR safety note if elevated
  if (acwrForLogic > 1.3) {
    aiRationale += ` ⚠️ ACWR elevated (${acwrForLogic.toFixed(2)}) - load auto-adjusted for safety.`;
  }

  // Calculate load target (adjusted by age AND taper)
  const baseLoadTarget = Math.round(readinessForLogic * 15);
  let adjustedLoadTarget = Math.round(
    baseLoadTarget / (context.ageModifier?.recovery_modifier || 1),
  );

  // Apply taper reduction
  if (taperLoadMultiplier < 1) {
    adjustedLoadTarget = Math.round(adjustedLoadTarget * taperLoadMultiplier);
  }

  // Protocol and exercises will be created transactionally via RPC
  // We'll collect exercises first, then call RPC

  const protocolExercises = [];

  // ============================================================================
  // CHECK IF EXERCISES TABLE IS EMPTY - SEED DEFAULTS IF NEEDED
  // This ensures users always see exercises even if DB hasn't been seeded
  // ============================================================================
  const { count: exerciseCount } = await supabase
    .from("exercises")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  if (!exerciseCount || exerciseCount < 10) {
    console.log(
      "[daily-protocol] No exercises found in DB - using inline fallback",
    );
    // Use inline fallback exercises - each day gets different ones based on day of year
    const dayOfYear = Math.floor(
      (new Date(date) - new Date(new Date(date).getFullYear(), 0, 0)) /
        (24 * 60 * 60 * 1000),
    );
    const weekNumber = Math.ceil(dayOfYear / 7);

    // Generate fallback exercises (protocol_id will be assigned by RPC)
    const fallbackExercises = await generateFallbackProtocolExercises(
      null, // protocol_id - will be assigned by RPC
      dayOfYear,
      weekNumber,
      trainingFocus,
      context,
      isPracticeDay,
      isFilmRoomDay,
      readinessForLogic,
    );

    if (fallbackExercises.length > 0) {
      // Use RPC for transactional creation
      const exercisesJson = fallbackExercises.map((ex) => ({
        exercise_id: ex.exercise_id,
        block_type: ex.block_type,
        sequence_order: ex.sequence_order,
        prescribed_sets: ex.prescribed_sets,
        prescribed_reps: ex.prescribed_reps || null,
        prescribed_hold_seconds: ex.prescribed_hold_seconds || null,
        prescribed_duration_seconds: ex.prescribed_duration_seconds || null,
        load_contribution_au: ex.load_contribution_au || 0,
        ai_note: ex.ai_note || null,
      }));

      const { data: protocolId, error: rpcError } = await supabase.rpc(
        "generate_protocol_transactional",
        {
          p_user_id: userId,
          p_protocol_date: date,
          p_readiness_score: readinessScore,
          p_acwr_value: acwrValue,
          p_training_focus: trainingFocus,
          p_ai_rationale: aiRationale,
          p_total_load_target_au: adjustedLoadTarget,
          p_confidence_metadata: confidenceMetadata,
          p_exercises: exercisesJson,
        },
      );

      if (rpcError) {
        if (requestRecord) {
          await supabase
            .from("protocol_generation_requests")
            .update({ status: "failed", error: rpcError.message })
            .eq("id", requestRecord.id);
        }
        throw rpcError;
      }

      // Update request status
      if (requestRecord) {
        await supabase
          .from("protocol_generation_requests")
          .update({
            status: "completed",
            protocol_id: protocolId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", requestRecord.id);
      }

      // Return the completed protocol
      return await getProtocol(supabase, userId, { date }, headers);
    }
  }

  // 1. Morning Mobility - ALL PLAYERS get the day-specific video routine FIRST
  // This ensures everyone sees the daily YouTube video for morning mobility
  const morningMobilitySlug = `morning-mobility-day-${context.dayOfWeek === 0 ? 7 : context.dayOfWeek}`;
  const { data: morningMobility } = await supabase
    .from("exercises")
    .select("*")
    .eq("slug", morningMobilitySlug)
    .eq("active", true)
    .maybeSingle();

  let mobilitySequence = 0;

  if (morningMobility) {
    mobilitySequence++;
    protocolExercises.push({
      // protocol_id will be assigned by RPC
      exercise_id: morningMobility.id,
      block_type: "morning_mobility",
      sequence_order: mobilitySequence,
      prescribed_sets: morningMobility.default_sets || 1,
      prescribed_reps: morningMobility.default_reps,
      prescribed_hold_seconds: morningMobility.default_hold_seconds,
      prescribed_duration_seconds: morningMobility.default_duration_seconds,
      load_contribution_au: morningMobility.load_contribution_au || 0,
      ai_note: "Daily Morning Mobility Routine - Follow along with the video",
    });
  }

  // 2. Position-specific mobility exercises (in addition to the daily video)
  const normalizedPosition = normalizePosition(context.position);

  if (context.isQB) {
    // QB gets extra hip flexor and shoulder mobility for throwing
    const { data: qbMobilityExercises } = await supabase
      .from("exercises")
      .select("*")
      .contains("position_specific", ["quarterback"])
      .eq("category", "mobility")
      .eq("active", true)
      .limit(5);

    if (qbMobilityExercises && qbMobilityExercises.length > 0) {
      qbMobilityExercises.forEach((ex) => {
        mobilitySequence++;
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "morning_mobility",
          sequence_order: mobilitySequence,
          prescribed_sets: ex.default_sets || 1,
          prescribed_reps: ex.default_reps,
          prescribed_hold_seconds: ex.default_hold_seconds,
          prescribed_duration_seconds: ex.default_duration_seconds,
          load_contribution_au: ex.load_contribution_au || 0,
          ai_note:
            "QB Arm Care - Hip flexor flexibility supports throwing velocity",
        });
      });
    }
  } else if (context.isCenter) {
    // Center gets shoulder/wrist mobility for snapping + some QB exercises for throwing
    const { data: centerMobilityExercises } = await supabase
      .from("exercises")
      .select("*")
      .or("position_specific.cs.{center},position_specific.cs.{quarterback}")
      .eq("category", "mobility")
      .eq("active", true)
      .limit(5);

    if (centerMobilityExercises && centerMobilityExercises.length > 0) {
      centerMobilityExercises.forEach((ex) => {
        mobilitySequence++;
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "morning_mobility",
          sequence_order: mobilitySequence,
          prescribed_sets: ex.default_sets || 1,
          prescribed_reps: ex.default_reps,
          prescribed_hold_seconds: ex.default_hold_seconds,
          prescribed_duration_seconds: ex.default_duration_seconds,
          load_contribution_au: ex.load_contribution_au || 0,
          ai_note:
            "Center Arm Care - Shoulder/wrist mobility for snapping + throwing",
        });
      });
    }
  } else if (normalizedPosition === "wr_db") {
    // WR/DB gets hip, ankle, and thoracic mobility for route running and coverage
    const { data: wrDbMobility } = await supabase
      .from("exercises")
      .select("*")
      .contains("position_specific", ["wr_db"])
      .eq("category", "mobility")
      .eq("active", true)
      .limit(5);

    if (wrDbMobility && wrDbMobility.length > 0) {
      wrDbMobility.forEach((ex) => {
        mobilitySequence++;
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "morning_mobility",
          sequence_order: mobilitySequence,
          prescribed_sets: ex.default_sets || 1,
          prescribed_reps: ex.default_reps,
          prescribed_hold_seconds: ex.default_hold_seconds,
          prescribed_duration_seconds: ex.default_duration_seconds,
          load_contribution_au: ex.load_contribution_au || 0,
          ai_note: "WR/DB Mobility - Hip and ankle prep for cuts and routes",
        });
      });
    }
  } else if (
    normalizedPosition === "blitzer" ||
    normalizedPosition === "rusher"
  ) {
    // Blitzer/Rusher gets explosive movement mobility
    const { data: rushMobility } = await supabase
      .from("exercises")
      .select("*")
      .or("position_specific.cs.{blitzer},position_specific.cs.{rusher}")
      .eq("category", "mobility")
      .eq("active", true)
      .limit(5);

    if (rushMobility && rushMobility.length > 0) {
      rushMobility.forEach((ex) => {
        mobilitySequence++;
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "morning_mobility",
          sequence_order: mobilitySequence,
          prescribed_sets: ex.default_sets || 1,
          prescribed_reps: ex.default_reps,
          prescribed_hold_seconds: ex.default_hold_seconds,
          prescribed_duration_seconds: ex.default_duration_seconds,
          load_contribution_au: ex.load_contribution_au || 0,
          ai_note: "Rusher Mobility - Explosive movement prep",
        });
      });
    }
  }

  // Fallback: if no morning mobility at all, add general mobility exercises
  if (
    protocolExercises.filter((e) => e.block_type === "morning_mobility")
      .length === 0
  ) {
    const { data: generalMobility } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "mobility")
      .is("position_specific", null)
      .eq("active", true)
      .limit(5);

    if (generalMobility && generalMobility.length > 0) {
      generalMobility.slice(0, 4).forEach((ex, idx) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "morning_mobility",
          sequence_order: idx + 1,
          prescribed_sets: ex.default_sets || 1,
          prescribed_reps: ex.default_reps,
          prescribed_hold_seconds: ex.default_hold_seconds,
          prescribed_duration_seconds: ex.default_duration_seconds,
          load_contribution_au: ex.load_contribution_au || 0,
        });
      });
    }
  }

  // 2. Foam Roll - Standard for all positions
  const { data: foamRollExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "foam_roll")
    .eq("active", true)
    .limit(10);

  if (foamRollExercises && foamRollExercises.length > 0) {
    const shuffled = foamRollExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    shuffled.forEach((ex, idx) => {
      protocolExercises.push({
        // protocol_id will be assigned by RPC
        exercise_id: ex.id,
        block_type: "foam_roll",
        sequence_order: idx + 1,
        prescribed_sets: ex.default_sets || 1,
        prescribed_reps: ex.default_reps,
        prescribed_hold_seconds: ex.default_hold_seconds,
        prescribed_duration_seconds: ex.default_duration_seconds,
        load_contribution_au: ex.load_contribution_au || 0,
      });
    });
  }

  // Check if it's a sprint session (Saturday or session type is speed/sprint)
  // Declare early so it can be used in both warmup and main session generation
  const isSprintSession =
    context.dayOfWeek === 6 || // Saturday
    context.sessionResolution?.override?.type === "sprint_saturday" ||
    context.sessionTemplate?.session_type?.toLowerCase() === "speed" ||
    context.sessionTemplate?.session_type?.toLowerCase() === "sprint";

  // 3. Warm-up - 25 minutes, variant by session type
  const warmUpQuery = supabase
    .from("exercises")
    .select("*")
    .eq("category", "warm_up")
    .eq("active", true)
    .not("subcategory", "eq", "morning_routine");

  const { data: warmUpExercises } = await warmUpQuery.limit(60);
  const isFitnessDay =
    !isPracticeDay &&
    !isFilmRoomDay &&
    ["strength", "power", "conditioning", "gym", "fitness", "weights"].includes(
      trainingFocus?.toLowerCase() || "",
    );
  const warmupVariant = selectWarmupVariant({
    isFitnessDay,
    isSprintSession,
    isPracticeDay,
    trainingFocus,
  });
  const warmupPlan = buildWarmupTemplate({
    variant: warmupVariant,
    isQB: context?.isQB,
    isCenter: context?.isCenter,
    warmupFocus: context?.warmupFocus,
  });
  const warmupTotalSeconds = warmupPlan.reduce(
    (sum, item) => sum + (item.durationSeconds || 0),
    0,
  );

  if (warmupTotalSeconds !== WARMUP_TARGET_SECONDS) {
    console.warn(
      `[daily-protocol] Warm-up plan totals ${warmupTotalSeconds}s (target ${WARMUP_TARGET_SECONDS}s)`,
    );
  }

  const findWarmupMatch = (keywords = []) => {
    if (!warmUpExercises || warmUpExercises.length === 0) {
      return null;
    }
    return warmUpExercises.find((ex) => {
      const name = (ex.name || "").toLowerCase();
      const slug = (ex.slug || "").toLowerCase();
      return keywords.some(
        (keyword) => name.includes(keyword) || (slug && slug.includes(keyword)),
      );
    });
  };

  warmupPlan.forEach((item, idx) => {
    const match = findWarmupMatch(item.keywords || []);
    protocolExercises.push({
      // protocol_id will be assigned by RPC
      exercise_id: match?.id || null,
      block_type: "warm_up",
      sequence_order: idx + 1,
      prescribed_sets: item.sets || match?.default_sets || 1,
      prescribed_reps: item.reps ?? match?.default_reps ?? null,
      prescribed_hold_seconds:
        item.holdSeconds ?? match?.default_hold_seconds ?? null,
      prescribed_duration_seconds:
        item.durationSeconds ?? match?.default_duration_seconds ?? null,
      load_contribution_au: match?.load_contribution_au || 0,
      ai_note: item.note || "Warm-up block (25 min total).",
    });
  });

  // ============================================================================
  // EVIDENCE-BASED TRAINING BLOCKS (1.5h Gym Session Structure)
  // Based on VALD Practitioner's Guides
  // ============================================================================

  // Get current periodization phase for evidence-based programming
  const currentPhase = getCurrentPeriodizationPhase(new Date(date));
  const plyoIntensity = getPlyometricIntensity(currentPhase, readinessForLogic);
  const safeConditioning = getSafeConditioningIntensity(
    acwrForLogic,
    null,
    currentPhase,
  );
  const includeNordics = shouldIncludeNordicCurls(
    context.dayOfWeek,
    trainingFocus,
  );

  console.log("[daily-protocol] Evidence-based config:", {
    phase: currentPhase,
    plyoIntensity,
    safeConditioning,
    includeNordics,
    dayOfWeek: context.dayOfWeek,
  });

  // Skip gym blocks on practice days, film room days, or recovery days
  const isGymTrainingDay =
    !isPracticeDay && !isFilmRoomDay && trainingFocus !== "recovery";

  if (isGymTrainingDay) {
    // ============================================================================
    // 4. ISOMETRICS BLOCK (15 min)
    // Evidence: 3-5 sets × 3-6 sec maximal contractions, 30-60s rest
    // Source: VALD Practitioner's Guide to Isometrics
    // ============================================================================

    // Query from both exercises table (isometric category) and isometrics_exercises table
    const { data: isometricExercisesMain } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "isometric")
      .eq("active", true)
      .limit(15);

    const { data: isometricExercisesSpecialized } = await supabase
      .from("isometrics_exercises")
      .select("*")
      .limit(15);

    // Combine and format exercises
    let allIsometrics = [];

    if (isometricExercisesMain && isometricExercisesMain.length > 0) {
      allIsometrics = allIsometrics.concat(
        isometricExercisesMain.map((ex) => ({
          ...ex,
          source: "exercises",
        })),
      );
    }

    if (
      isometricExercisesSpecialized &&
      isometricExercisesSpecialized.length > 0
    ) {
      allIsometrics = allIsometrics.concat(
        isometricExercisesSpecialized.map((ex) => ({
          id: ex.id,
          name: ex.name,
          description: ex.description,
          video_url: ex.video_url,
          category: ex.category,
          source: "isometrics_exercises",
          default_sets: EVIDENCE_BASED_PROTOCOLS.isometrics.sets.min,
          default_hold_seconds:
            EVIDENCE_BASED_PROTOCOLS.isometrics.holdSeconds.max,
          load_contribution_au: 15, // Moderate load for isometrics
        })),
      );
    }

    if (allIsometrics.length > 0) {
      // Select 4-5 isometric exercises for ~15 min block
      const selectedIsometrics = allIsometrics
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      selectedIsometrics.forEach((ex, idx) => {
        const sets =
          EVIDENCE_BASED_PROTOCOLS.isometrics.sets.min +
          (readinessForLogic >= 70 ? 1 : 0); // Extra set if high readiness
        const holdSeconds = EVIDENCE_BASED_PROTOCOLS.isometrics.holdSeconds.max;

        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.source === "exercises" ? ex.id : null,
          block_type: "isometrics",
          sequence_order: idx + 1,
          prescribed_sets: sets,
          prescribed_hold_seconds: holdSeconds,
          rest_seconds: EVIDENCE_BASED_PROTOCOLS.isometrics.restSeconds.min,
          load_contribution_au: ex.load_contribution_au || 15,
          ai_note: `📊 Isometric Protocol: ${sets} sets × ${holdSeconds}s hold. Focus on maximal tension. Evidence: Builds strength at specific joint angles, safe for all fitness levels.`,
        });
      });

      console.log(
        `[daily-protocol] Added ${selectedIsometrics.length} isometric exercises`,
      );
    }

    // ============================================================================
    // 5. PLYOMETRICS BLOCK (15 min)
    // Evidence: Phase-appropriate contacts, landing emphasis first
    // Source: VALD Practitioner's Guides (Hamstrings, Calf & Achilles)
    // ============================================================================

    const plyoContactsConfig = EVIDENCE_BASED_PROTOCOLS.plyometrics
      .contactsPerWeek[currentPhase] || { min: 40, max: 80 };
    const allowedPlyoTypes =
      EVIDENCE_BASED_PROTOCOLS.plyometrics.intensityLevels[plyoIntensity] ||
      EVIDENCE_BASED_PROTOCOLS.plyometrics.intensityLevels.medium;

    // Query from both exercises table and plyometrics_exercises table
    const { data: plyoExercisesMain } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "plyometric")
      .eq("active", true)
      .limit(20);

    const { data: plyoExercisesSpecialized } = await supabase
      .from("plyometrics_exercises")
      .select("*")
      .limit(20);

    let allPlyometrics = [];

    if (plyoExercisesMain && plyoExercisesMain.length > 0) {
      allPlyometrics = allPlyometrics.concat(
        plyoExercisesMain.map((ex) => ({
          ...ex,
          source: "exercises",
        })),
      );
    }

    if (plyoExercisesSpecialized && plyoExercisesSpecialized.length > 0) {
      allPlyometrics = allPlyometrics.concat(
        plyoExercisesSpecialized.map((ex) => ({
          id: ex.id,
          name: ex.exercise_name || ex.name,
          description: ex.description,
          video_url: ex.video_url,
          category: ex.exercise_category,
          intensity_level: ex.intensity_level,
          source: "plyometrics_exercises",
          default_sets: 3,
          default_reps: 6,
          load_contribution_au: 20, // Higher load for plyometrics
        })),
      );
    }

    if (allPlyometrics.length > 0) {
      // Calculate contacts per session (divide weekly target by ~3 sessions)
      const contactsPerSession = Math.round(
        (plyoContactsConfig.min + plyoContactsConfig.max) / 2 / 3,
      );
      const repsPerExercise = 6;
      const exerciseCount = Math.min(
        5,
        Math.ceil(contactsPerSession / repsPerExercise),
      );

      // Filter by intensity if possible
      let filteredPlyos = allPlyometrics;
      if (plyoIntensity === "low") {
        // Prefer lower intensity exercises
        filteredPlyos = allPlyometrics.filter(
          (ex) =>
            !ex.name?.toLowerCase().includes("depth") &&
            !ex.name?.toLowerCase().includes("reactive"),
        );
      } else if (plyoIntensity === "very_high") {
        // Include higher intensity
        filteredPlyos = allPlyometrics.filter(
          (ex) =>
            ex.name?.toLowerCase().includes("depth") ||
            ex.name?.toLowerCase().includes("reactive") ||
            ex.name?.toLowerCase().includes("bound"),
        );
      }

      // Fallback to all if filter too restrictive
      if (filteredPlyos.length < 3) {
        filteredPlyos = allPlyometrics;
      }

      const selectedPlyos = filteredPlyos
        .sort(() => Math.random() - 0.5)
        .slice(0, exerciseCount);

      selectedPlyos.forEach((ex, idx) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.source === "exercises" ? ex.id : null,
          block_type: "plyometrics",
          sequence_order: idx + 1,
          prescribed_sets: 3,
          prescribed_reps: repsPerExercise,
          rest_seconds: 60,
          load_contribution_au: ex.load_contribution_au || 20,
          ai_note: `⚡ Plyometric Phase: ${currentPhase}. Intensity: ${plyoIntensity.toUpperCase()}. Weekly contacts target: ${plyoContactsConfig.min}-${plyoContactsConfig.max}. Focus on LANDING MECHANICS first.`,
        });
      });

      console.log(
        `[daily-protocol] Added ${selectedPlyos.length} plyometric exercises (${plyoIntensity} intensity)`,
      );
    }

    // ============================================================================
    // 6. STRENGTH BLOCK (15 min)
    // Evidence: Nordic curls 2-3x/week reduce hamstring injury by 50-70%
    // Source: VALD Practitioner's Guide to Hamstrings
    // ============================================================================

    const { data: strengthExercises } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "strength")
      .eq("active", true)
      .limit(30);

    if (strengthExercises && strengthExercises.length > 0) {
      const selectedStrength = [];

      // MANDATORY: Include Nordic Curls on designated days (2-3x per week)
      // Evidence: Reduces hamstring injury risk by 50-70%
      if (includeNordics) {
        const nordicExercise = strengthExercises.find(
          (ex) =>
            ex.name?.toLowerCase().includes("nordic") ||
            ex.slug?.includes("nordic"),
        );

        if (nordicExercise) {
          const nordicProtocol =
            readinessForLogic >= 70
              ? EVIDENCE_BASED_PROTOCOLS.nordicCurls.advanced
              : EVIDENCE_BASED_PROTOCOLS.nordicCurls.intermediate;

          protocolExercises.push({
            // protocol_id will be assigned by RPC
            exercise_id: nordicExercise.id,
            block_type: "strength",
            sequence_order: 1, // Nordic curls FIRST in strength block
            prescribed_sets: nordicProtocol.sets,
            prescribed_reps: nordicProtocol.reps,
            rest_seconds: 90,
            load_contribution_au: nordicExercise.load_contribution_au || 25,
            ai_note: `🏋️ MANDATORY: Nordic Curls - Evidence shows 50-70% reduction in hamstring injuries when performed 2-3x/week. Focus on slow, controlled eccentric lowering.`,
          });

          console.log("[daily-protocol] Added mandatory Nordic Curls");
        }
      }

      // Add hip adductor/abductor work for groin injury prevention
      // Evidence: Add:Abd ratio should be 0.8-1.2 (VALD Hip & Groin Guide)
      const hipExercises = strengthExercises.filter(
        (ex) =>
          ex.name?.toLowerCase().includes("adduct") ||
          ex.name?.toLowerCase().includes("copenhagen") ||
          ex.name?.toLowerCase().includes("hip thrust") ||
          ex.name?.toLowerCase().includes("glute"),
      );

      if (hipExercises.length > 0) {
        const selectedHip = hipExercises
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);

        selectedHip.forEach((ex, idx) => {
          protocolExercises.push({
            // protocol_id will be assigned by RPC
            exercise_id: ex.id,
            block_type: "strength",
            sequence_order: (includeNordics ? 2 : 1) + idx,
            prescribed_sets: 3,
            prescribed_reps: 10,
            rest_seconds: 60,
            load_contribution_au: ex.load_contribution_au || 20,
            ai_note: `🦵 Hip Strength: Targets Add:Abd ratio (target 0.8-1.2). Prevents groin injuries common in cutting sports.`,
          });
        });
      }

      // Add 2-3 general strength exercises
      const generalStrength = strengthExercises
        .filter(
          (ex) =>
            !ex.name?.toLowerCase().includes("nordic") &&
            !ex.name?.toLowerCase().includes("adduct") &&
            !ex.name?.toLowerCase().includes("copenhagen"),
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      generalStrength.forEach((ex, idx) => {
        const sequenceStart =
          (includeNordics ? 2 : 1) + (hipExercises.length > 0 ? 2 : 0);
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "strength",
          sequence_order: sequenceStart + idx,
          prescribed_sets: 3,
          prescribed_reps: 8,
          rest_seconds: 90,
          load_contribution_au: ex.load_contribution_au || 20,
          ai_note: `💪 Strength Phase: ${currentPhase}. Focus on quality movement over load.`,
        });
      });

      console.log(
        `[daily-protocol] Added strength block with ${includeNordics ? "Nordic curls + " : ""}hip work + general strength`,
      );
    }

    // ============================================================================
    // 7. CONDITIONING BLOCK (15 min)
    // Evidence: ACWR 0.8-1.3 optimal, >1.5 = 2-4x injury risk
    // SAFETY: No 80%+ sprinting on day 1 - progressive build required
    // Source: VALD Practitioner's Guide to Preseason, Gabbett 2016
    // ============================================================================

    const { data: conditioningExercises } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "conditioning")
      .eq("active", true)
      .limit(20);

    if (conditioningExercises && conditioningExercises.length > 0) {
      // Filter based on safe intensity
      let filteredConditioning = conditioningExercises;

      // If max intensity is low, exclude high-intensity exercises
      if (safeConditioning.maxIntensity <= 60) {
        filteredConditioning = conditioningExercises.filter(
          (ex) =>
            !ex.name?.toLowerCase().includes("sprint") &&
            !ex.name?.toLowerCase().includes("100m") &&
            !ex.name?.toLowerCase().includes("max velocity"),
        );
      }

      // Fallback if filter too restrictive
      if (filteredConditioning.length < 3) {
        filteredConditioning = conditioningExercises;
      }

      const selectedConditioning = filteredConditioning
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      selectedConditioning.forEach((ex, idx) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "conditioning",
          sequence_order: idx + 1,
          prescribed_sets: 2,
          prescribed_duration_seconds: 30,
          rest_seconds: 45,
          load_contribution_au: Math.round(
            (ex.load_contribution_au || 15) *
              (safeConditioning.maxIntensity / 100),
          ),
          ai_note:
            safeConditioning.note ||
            `🏃 Conditioning Phase: ${currentPhase}. Max intensity: ${safeConditioning.maxIntensity}%. ACWR-safe progression.`,
        });
      });

      console.log(
        `[daily-protocol] Added ${selectedConditioning.length} conditioning exercises (max ${safeConditioning.maxIntensity}% intensity)`,
      );
    }

    // ============================================================================
    // 8. SKILL/TWITCHING DRILLS BLOCK (15 min)
    // Position-specific reactive drills for neural activation
    // Source: VALD Speed Testing Guide, Flag Football Periodization
    // ============================================================================

    // Combine skill and agility exercises
    const { data: skillExercises } = await supabase
      .from("exercises")
      .select("*")
      .or("category.eq.skill,category.eq.agility")
      .eq("active", true)
      .limit(20);

    if (skillExercises && skillExercises.length > 0) {
      // Filter for position-specific where available
      let filteredSkill = skillExercises;

      if (context.isQB) {
        const qbSkills = skillExercises.filter(
          (ex) =>
            ex.position_specific?.includes("quarterback") ||
            ex.name?.toLowerCase().includes("throwing") ||
            ex.name?.toLowerCase().includes("footwork"),
        );
        if (qbSkills.length >= 2) {
          filteredSkill = qbSkills;
        }
      } else if (normalizedPosition === "wr_db") {
        const wrDbSkills = skillExercises.filter(
          (ex) =>
            ex.position_specific?.includes("wr_db") ||
            ex.name?.toLowerCase().includes("route") ||
            ex.name?.toLowerCase().includes("cut") ||
            ex.name?.toLowerCase().includes("backpedal"),
        );
        if (wrDbSkills.length >= 2) {
          filteredSkill = wrDbSkills;
        }
      }

      const selectedSkills = filteredSkill
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      selectedSkills.forEach((ex, idx) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.id,
          block_type: "skill_drills",
          sequence_order: idx + 1,
          prescribed_sets: 3,
          prescribed_reps: 5,
          rest_seconds: 30,
          load_contribution_au: ex.load_contribution_au || 10,
          ai_note: `⚡ Skill Drill: Fast-twitch activation. Focus on speed and precision. Position: ${normalizedPosition}.`,
        });
      });

      console.log(
        `[daily-protocol] Added ${selectedSkills.length} skill/twitching drills`,
      );
    }

    // ============================================================================
    // Add gym block exercises to main_session for display
    // Main Session should always have exercises (except recovery days)
    // ============================================================================
    // Collect all exercises from gym blocks and add them to main_session
    const gymBlockTypes = [
      "isometrics",
      "plyometrics",
      "strength",
      "conditioning",
      "skill_drills",
    ];
    let mainSessionSequence = 1;

    gymBlockTypes.forEach((blockType) => {
      // Find all exercises for this block type that were just added
      const blockExercises = protocolExercises.filter(
        (pe) => pe.block_type === blockType,
      );

      // Add them to main_session as well
      blockExercises.forEach((ex) => {
        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: ex.exercise_id,
          block_type: "main_session",
          sequence_order: mainSessionSequence++,
          prescribed_sets: ex.prescribed_sets,
          prescribed_reps: ex.prescribed_reps,
          prescribed_hold_seconds: ex.prescribed_hold_seconds,
          prescribed_duration_seconds: ex.prescribed_duration_seconds,
          rest_seconds: ex.rest_seconds,
          load_contribution_au: ex.load_contribution_au,
          ai_note: ex.ai_note || `Gym Training - ${blockType}`,
        });
      });
    });

    if (mainSessionSequence > 1) {
      console.log(
        `[daily-protocol] Added ${mainSessionSequence - 1} exercises to main_session from gym blocks`,
      );
    }
  } else {
    console.log("[daily-protocol] Skipping gym blocks - practice/recovery day");
  }

  // ============================================================================
  // END OF EVIDENCE-BASED BLOCKS
  // ============================================================================

  // 9. Main Session - From structured program templates OR generated based on training type
  // Note: isPracticeDay and isFilmRoomDay already declared above in training focus section

  // Determine main session type based on priority:
  // 1. Sprint session (especially Saturday)
  // 2. Gym training (if has_gym_access)
  // 3. Flag training (if preferred)
  // 4. Session template (if exists)
  // Note: isSprintSession is already declared above before warmup section
  const hasGymAccess = context.config?.has_gym_access !== false;
  const hasFieldAccess = context.config?.has_field_access !== false;

  let mainSessionGenerated = false;

  // Priority 1: Use session template if it exists (unless it's a practice/film room day)
  if (context.sessionTemplate && !isPracticeDay && !isFilmRoomDay) {
    // Get exercises from session_exercises table
    const { data: sessionExercises } = await supabase
      .from("session_exercises")
      .select(
        `
        *,
        exercises (
          id, name, slug, category, video_url, video_id, thumbnail_url,
          how_text, feel_text, compensation_text, load_contribution_au
        )
      `,
      )
      .eq("session_template_id", context.sessionTemplate.id)
      .order("exercise_order");

    if (sessionExercises && sessionExercises.length > 0) {
      // Get previous session data for progressive overload
      const { data: previousCompletions } = await supabase
        .from("protocol_completions")
        .select(
          `
          exercise_id,
          protocol_exercises (
            actual_sets, actual_reps, actual_weight_kg, prescribed_weight_kg
          )
        `,
        )
        .eq("user_id", userId)
        .eq("block_type", "main_session")
        .order("completion_date", { ascending: false })
        .limit(50);

      // Create a map of previous performance by exercise
      const previousPerformance = {};
      if (previousCompletions) {
        previousCompletions.forEach((pc) => {
          if (!previousPerformance[pc.exercise_id] && pc.protocol_exercises) {
            previousPerformance[pc.exercise_id] = {
              sets: pc.protocol_exercises.actual_sets,
              reps: pc.protocol_exercises.actual_reps,
              weight:
                pc.protocol_exercises.actual_weight_kg ||
                pc.protocol_exercises.prescribed_weight_kg,
            };
          }
        });
      }

      sessionExercises.forEach((se, idx) => {
        const exerciseId = se.exercise_id || se.exercises?.id;
        const prev = previousPerformance[exerciseId];

        // Calculate progressive overload
        let prescribedSets = se.sets || 3;
        let prescribedReps = parseInt(se.reps) || 8;
        let prescribedWeight = se.load_percentage
          ? se.load_percentage / 100
          : null;
        let progressionNote = null;

        // Apply progressive overload logic (use forLogic values)
        if (
          prev &&
          readinessForLogic >= 70 &&
          acwrForLogic < context.acwrTargetRange.max
        ) {
          // If previous was completed successfully, progress
          if (prev.reps >= prescribedReps && prev.sets >= prescribedSets) {
            // Add 1 rep or 2.5% weight
            const addReps = prescribedReps < 12;
            if (addReps) {
              prescribedReps = Math.min(prev.reps + 1, 15);
              progressionNote = `↑ +1 rep from last time (${prev.reps}→${prescribedReps})`;
            } else if (prescribedWeight) {
              prescribedWeight = prev.weight
                ? prev.weight * 1.025
                : prescribedWeight;
              progressionNote = `↑ +2.5% load progression`;
            }
          }
        } else if (readinessForLogic < 50) {
          // Reduce volume on low readiness
          prescribedSets = Math.max(prescribedSets - 1, 2);
          progressionNote = "⚠️ Volume reduced due to low readiness";
        }

        protocolExercises.push({
          // protocol_id will be assigned by RPC
          exercise_id: exerciseId,
          block_type: "main_session",
          sequence_order: idx + 1,
          prescribed_sets: prescribedSets,
          prescribed_reps: prescribedReps,
          prescribed_weight_kg: prescribedWeight,
          yesterday_sets: prev?.sets,
          yesterday_reps: prev?.reps,
          progression_note: progressionNote,
          ai_note: se.notes || context.sessionTemplate.description,
          load_contribution_au: se.exercises?.load_contribution_au || 10,
        });
      });
      mainSessionGenerated = true;
    }
  }

  // Priority 2: Generate fallback main session if no template exists
  if (
    !mainSessionGenerated &&
    !isPracticeDay &&
    !isFilmRoomDay &&
    trainingFocus !== "recovery"
  ) {
    // Determine session type based on day and preferences
    let sessionType = "strength"; // Default
    let sessionCategory = "strength";

    if (isSprintSession) {
      // Sprint session - generate evidence-based sprint exercises based on phase and ACWR
      sessionType = "sprint";
      sessionCategory = "sprint";

      // Map periodization phase to sprint phase guidelines
      const sprintPhaseMap = {
        foundation: "foundation",
        strength_accumulation: "strength_accumulation",
        power_development: "power_development",
        speed_development: "speed_development",
        competition_prep: "competition",
        in_season_maintenance: "competition",
        mid_season_reload: "mid_season_reload",
        peak: "peak",
        taper: "peak",
        active_recovery: "foundation",
        off_season_rest: "foundation",
      };

      const sprintPhase = sprintPhaseMap[periodizationPhase] || "foundation";

      // Evidence-based sprint protocol selection based on phase
      // Based on sprint-training-knowledge.service.ts PHASE_GUIDELINES
      let sprintProtocols = [];
      let useHillSprints = false;
      let useStairSprints = false;

      if (sprintPhase === "foundation") {
        sprintProtocols = ["short_acceleration", "deceleration_training"];
        useHillSprints = true;
      } else if (sprintPhase === "strength_accumulation") {
        sprintProtocols = [
          "short_acceleration",
          "resisted_acceleration",
          "deceleration_training",
        ];
        useHillSprints = true;
      } else if (sprintPhase === "power_development") {
        sprintProtocols = [
          "short_acceleration",
          "resisted_acceleration",
          "flying_sprints",
        ];
        useHillSprints = false;
      } else if (sprintPhase === "speed_development") {
        sprintProtocols = [
          "short_acceleration",
          "flying_sprints",
          "in_and_out_sprints",
          "repeated_sprint_ability",
        ];
        useHillSprints = false;
      } else if (sprintPhase === "competition") {
        sprintProtocols = ["short_acceleration", "deceleration_training"];
        useHillSprints = false;
      } else if (sprintPhase === "mid_season_reload") {
        sprintProtocols = [
          "short_acceleration",
          "resisted_acceleration",
          "flying_sprints",
          "speed_endurance",
        ];
        useHillSprints = true;
        // Stair sprints ONLY if ACWR >= 0.8 and athlete is well-conditioned
        if (acwrForLogic >= 0.8) {
          useStairSprints = true;
          sprintProtocols.push("stair_sprints");
        }
      } else if (sprintPhase === "peak") {
        sprintProtocols = ["short_acceleration", "flying_sprints"];
        useHillSprints = false;
      }

      // Generate sprint exercises based on protocols
      const sprintExerciseQueries = [];

      // Short acceleration (always included for sprint sessions)
      sprintExerciseQueries.push(
        supabase
          .from("exercises")
          .select("*")
          .or("category.eq.sprint,category.eq.speed,category.eq.acceleration")
          .or(
            "name.ilike.%acceleration%,name.ilike.%sprint%,name.ilike.%speed%",
          )
          .eq("active", true)
          .limit(4),
      );

      // Hill sprints (if phase-appropriate)
      if (useHillSprints) {
        sprintExerciseQueries.push(
          supabase
            .from("exercises")
            .select("*")
            .or("name.ilike.%hill%,name.ilike.%uphill%,name.ilike.%incline%")
            .eq("active", true)
            .limit(2),
        );
      }

      // Stair sprints (if ACWR >= 0.8 and mid_season_reload)
      if (useStairSprints && acwrForLogic >= 0.8) {
        sprintExerciseQueries.push(
          supabase
            .from("exercises")
            .select("*")
            .or("name.ilike.%stair%,name.ilike.%step%")
            .eq("active", true)
            .limit(2),
        );
      }

      // Flying sprints (if phase-appropriate)
      if (sprintProtocols.includes("flying_sprints")) {
        sprintExerciseQueries.push(
          supabase
            .from("exercises")
            .select("*")
            .or(
              "name.ilike.%flying%,name.ilike.%max velocity%,name.ilike.%top speed%",
            )
            .eq("active", true)
            .limit(2),
        );
      }

      // Deceleration training (if phase-appropriate)
      if (sprintProtocols.includes("deceleration_training")) {
        sprintExerciseQueries.push(
          supabase
            .from("exercises")
            .select("*")
            .or(
              "category.eq.deceleration,name.ilike.%deceleration%,name.ilike.%braking%,name.ilike.%stop%",
            )
            .eq("active", true)
            .limit(2),
        );
      }

      // Execute all queries
      const sprintExerciseResults = await Promise.all(sprintExerciseQueries);
      const allSprintExercises = [];

      sprintExerciseResults.forEach((result) => {
        if (result.data && result.data.length > 0) {
          allSprintExercises.push(...result.data);
        }
      });

      // Remove duplicates and select appropriate exercises
      const uniqueSprintExercises = Array.from(
        new Map(allSprintExercises.map((ex) => [ex.id, ex])).values(),
      );

      if (uniqueSprintExercises.length > 0) {
        // Prioritize exercises based on phase protocols
        const prioritized = uniqueSprintExercises.sort((a, b) => {
          const aName = (a.name || "").toLowerCase();
          const bName = (b.name || "").toLowerCase();

          // Priority order: acceleration > hill/stair > flying > deceleration
          const priority = [
            "acceleration",
            "sprint",
            "hill",
            "stair",
            "flying",
            "deceleration",
          ];
          const aIdx = priority.findIndex((p) => aName.includes(p));
          const bIdx = priority.findIndex((p) => bName.includes(p));

          if (aIdx !== -1 && bIdx !== -1) {
            return aIdx - bIdx;
          }
          if (aIdx !== -1) {
            return -1;
          }
          if (bIdx !== -1) {
            return 1;
          }
          return 0;
        });

        // Select 4-6 exercises based on phase volume guidelines
        const exerciseCount =
          sprintPhase === "speed_development" ||
          sprintPhase === "mid_season_reload"
            ? 6
            : 4;
        const selectedExercises = prioritized.slice(0, exerciseCount);

        selectedExercises.forEach((ex, idx) => {
          // Set appropriate sets/reps based on sprint protocol
          let sets = 3;
          let reps = 4;
          let restSeconds = 90;
          let aiNote = `Sprint Session - ${sprintPhase} phase`;

          if (
            ex.name?.toLowerCase().includes("hill") ||
            ex.name?.toLowerCase().includes("uphill")
          ) {
            sets = 3;
            reps = 4;
            restSeconds = 90;
            aiNote =
              "Hill Sprints - Develops horizontal force and acceleration (Foundation/Strength/Mid-Season phases)";
          } else if (
            ex.name?.toLowerCase().includes("stair") ||
            ex.name?.toLowerCase().includes("step")
          ) {
            sets = 3;
            reps = 4;
            restSeconds = 90;
            aiNote =
              "Stair Sprints - ADVANCED: Explosive hip flexor power. Only for well-conditioned athletes (ACWR >= 0.8, Mid-Season Reload phase)";
          } else if (
            ex.name?.toLowerCase().includes("flying") ||
            ex.name?.toLowerCase().includes("max velocity")
          ) {
            sets = 2;
            reps = 3;
            restSeconds = 180;
            aiNote =
              "Flying Sprints - Maximum velocity development (Power/Speed/Peak phases)";
          } else if (
            ex.name?.toLowerCase().includes("deceleration") ||
            ex.name?.toLowerCase().includes("braking")
          ) {
            sets = 3;
            reps = 4;
            restSeconds = 60;
            aiNote =
              "Deceleration Training - CRITICAL for flag football. Every cut and route break requires controlled deceleration.";
          } else {
            // Standard acceleration sprints
            sets = 3;
            reps = 4;
            restSeconds = 90;
            aiNote = `Acceleration Sprints - ${sprintPhase} phase. Focus on first 10m burst (most critical for flag football)`;
          }

          protocolExercises.push({
            // protocol_id will be assigned by RPC
            exercise_id: ex.id,
            block_type: "main_session",
            sequence_order: idx + 1,
            prescribed_sets: sets,
            prescribed_reps: reps,
            rest_seconds: restSeconds,
            prescribed_duration_seconds: ex.default_duration_seconds,
            load_contribution_au: ex.load_contribution_au || 15,
            ai_note: aiNote,
          });
        });

        mainSessionGenerated = true;
        console.log(
          `[daily-protocol] Generated evidence-based sprint session: phase=${sprintPhase}, protocols=${sprintProtocols.join(", ")}, hillSprints=${useHillSprints}, stairSprints=${useStairSprints}`,
        );
      }
    } else if (hasGymAccess && isGymTrainingDay) {
      // Gym training - exercises already added to main_session above
      // Check if main_session has exercises (they should have been added from gym blocks)
      const mainSessionExercises = protocolExercises.filter(
        (pe) => pe.block_type === "main_session",
      );

      if (mainSessionExercises.length > 0) {
        sessionType = "gym";
        sessionCategory = "strength";
        mainSessionGenerated = true;
        console.log(
          `[daily-protocol] Gym training day - main session has ${mainSessionExercises.length} exercises from gym blocks`,
        );
      } else {
        // Fallback: if somehow no exercises were added, generate them now
        console.warn(
          "[daily-protocol] Gym training day but no main_session exercises found - this should not happen",
        );
        mainSessionGenerated = false; // Will trigger fallback below
      }
    } else if (hasFieldAccess && !hasGymAccess) {
      // Flag training - generate flag football-specific exercises
      sessionType = "flag";
      sessionCategory = "skill";
      const { data: flagExercises } = await supabase
        .from("exercises")
        .select("*")
        .or("category.eq.skill,category.eq.agility,category.eq.conditioning")
        .eq("active", true)
        .limit(8);

      if (flagExercises && flagExercises.length > 0) {
        flagExercises.slice(0, 6).forEach((ex, idx) => {
          protocolExercises.push({
            // protocol_id will be assigned by RPC
            exercise_id: ex.id,
            block_type: "main_session",
            sequence_order: idx + 1,
            prescribed_sets: ex.default_sets || 3,
            prescribed_reps: ex.default_reps || 8,
            prescribed_duration_seconds: ex.default_duration_seconds,
            load_contribution_au: ex.load_contribution_au || 12,
            ai_note: "Flag Football Training - Skill and agility development",
          });
        });
        mainSessionGenerated = true;
        console.log("[daily-protocol] Generated flag training main session");
      }
    }

    if (!mainSessionGenerated && trainingFocus !== "recovery") {
      // Final fallback: generate generic training session
      console.warn(
        "[daily-protocol] No main session generated - attempting fallback",
        {
          hasProgram: !!context.playerProgram,
          hasSessionTemplate: !!context.sessionTemplate,
          hasGymAccess,
          hasFieldAccess,
          isSprintSession,
          isGymTrainingDay,
          trainingFocus,
        },
      );

      // Try to get any available exercises as fallback
      const { data: fallbackExercises } = await supabase
        .from("exercises")
        .select("*")
        .eq("category", sessionCategory)
        .eq("active", true)
        .limit(6);

      if (fallbackExercises && fallbackExercises.length > 0) {
        fallbackExercises.forEach((ex, idx) => {
          protocolExercises.push({
            // protocol_id will be assigned by RPC
            exercise_id: ex.id,
            block_type: "main_session",
            sequence_order: idx + 1,
            prescribed_sets: ex.default_sets || 3,
            prescribed_reps: ex.default_reps || 8,
            prescribed_duration_seconds: ex.default_duration_seconds,
            load_contribution_au: ex.load_contribution_au || 10,
            ai_note: `Main Training Session - ${sessionType}`,
          });
        });
        mainSessionGenerated = true;
        console.log("[daily-protocol] Generated fallback main session");
      }
    }
  } else if (trainingFocus === "recovery") {
    console.log(
      "[daily-protocol] Recovery day - skipping main session, generating recovery-focused protocol",
    );
    // Recovery days don't need main session - continue to cool_down and evening_recovery
  }

  // ============================================================================
  // 10. Cool-down (15 min)
  // Evidence: Essential for recovery, reduces DOMS, promotes parasympathetic state
  // ============================================================================
  const { data: coolDownExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "cool_down")
    .eq("active", true)
    .limit(10);

  if (coolDownExercises && coolDownExercises.length > 0) {
    // More exercises for 15-minute cool-down
    const shuffled = coolDownExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    shuffled.forEach((ex, idx) => {
      protocolExercises.push({
        // protocol_id will be assigned by RPC
        exercise_id: ex.id,
        block_type: "cool_down",
        sequence_order: idx + 1,
        prescribed_sets: ex.default_sets || 1,
        prescribed_reps: ex.default_reps,
        prescribed_hold_seconds: ex.default_hold_seconds || 30,
        prescribed_duration_seconds: ex.default_duration_seconds,
        load_contribution_au: ex.load_contribution_au || 0,
        ai_note:
          "🧘 Cool-down: Promotes recovery, reduces muscle soreness, activates parasympathetic nervous system.",
      });
    });
  }

  // 7. Evening Recovery
  // For recovery days, include more recovery modalities; for normal days, include fewer
  const recoveryCount = trainingFocus === "recovery" ? 6 : 3;
  const { data: recoveryExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "recovery")
    .eq("active", true)
    .limit(15);

  if (recoveryExercises && recoveryExercises.length > 0) {
    const shuffled = recoveryExercises
      .sort(() => Math.random() - 0.5)
      .slice(0, recoveryCount);
    shuffled.forEach((ex, idx) => {
      protocolExercises.push({
        // protocol_id will be assigned by RPC
        exercise_id: ex.id,
        block_type: "evening_recovery",
        sequence_order: idx + 1,
        prescribed_sets: ex.default_sets || 1,
        prescribed_reps: ex.default_reps,
        prescribed_hold_seconds: ex.default_hold_seconds,
        prescribed_duration_seconds: ex.default_duration_seconds,
        load_contribution_au: ex.load_contribution_au || 0,
        ai_note:
          trainingFocus === "recovery"
            ? "Recovery Day - Focus on these modalities to enhance recovery"
            : null,
      });
    });
  }

  // ============================================================================
  // TRANSACTIONAL PROTOCOL GENERATION VIA RPC
  // ============================================================================
  // Use RPC function to atomically create protocol + exercises
  // This ensures we never leave a protocol with 0 exercises
  // ============================================================================

  if (protocolExercises.length === 0) {
    // Update request status to failed
    if (requestRecord) {
      await supabase
        .from("protocol_generation_requests")
        .update({ status: "failed", error: "No exercises generated" })
        .eq("id", requestRecord.id);
    }
    throw new Error("Cannot create protocol without exercises");
  }

  // Prepare exercises JSON for RPC
  const exercisesJson = protocolExercises.map((ex) => ({
    exercise_id: ex.exercise_id,
    block_type: ex.block_type,
    sequence_order: ex.sequence_order,
    prescribed_sets: ex.prescribed_sets,
    prescribed_reps: ex.prescribed_reps || null,
    prescribed_hold_seconds: ex.prescribed_hold_seconds || null,
    prescribed_duration_seconds: ex.prescribed_duration_seconds || null,
    load_contribution_au: ex.load_contribution_au || 0,
    ai_note: ex.ai_note || null,
  }));

  try {
    // Call transactional RPC function
    const { data: protocolId, error: rpcError } = await supabase.rpc(
      "generate_protocol_transactional",
      {
        p_user_id: userId,
        p_protocol_date: date,
        p_readiness_score: readinessScore,
        p_acwr_value: acwrValue,
        p_training_focus: trainingFocus,
        p_ai_rationale: aiRationale,
        p_total_load_target_au: adjustedLoadTarget,
        p_confidence_metadata: confidenceMetadata,
        p_exercises: exercisesJson,
      },
    );

    if (rpcError) {
      // Update request status to failed
      if (requestRecord) {
        await supabase
          .from("protocol_generation_requests")
          .update({ status: "failed", error: rpcError.message })
          .eq("id", requestRecord.id);
      }
      throw rpcError;
    }

    // Update request status to completed
    if (requestRecord) {
      await supabase
        .from("protocol_generation_requests")
        .update({
          status: "completed",
          protocol_id: protocolId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestRecord.id);
    }

    // Fetch the complete protocol
    return await getProtocol(supabase, userId, { date }, headers);
  } catch (error) {
    // Update request status to failed
    if (requestRecord) {
      await supabase
        .from("protocol_generation_requests")
        .update({ status: "failed", error: error.message })
        .eq("id", requestRecord.id);
    }
    throw error;
  }
}

/**
 * POST /api/daily-protocol/complete
 * Mark a single exercise as complete
 */
async function completeExercise(supabase, userId, payload, headers) {
  const { protocolExerciseId, actualSets, actualReps, actualHoldSeconds } =
    payload;

  if (!protocolExerciseId) {
    return { ...handleValidationError("protocolExerciseId required"), headers };
  }

  // Verify ownership first (RLS will enforce, but explicit check for clarity)
  const { data: exercise, error: fetchError } = await supabase
    .from("protocol_exercises")
    .select("*, daily_protocols!inner(user_id, protocol_date, id)")
    .eq("id", protocolExerciseId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Verify user owns this protocol (RLS should enforce, but double-check)
  if (exercise.daily_protocols.user_id !== userId) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Idempotency: if already complete, treat as success and avoid duplicate completion logs.
  if (exercise.status === "complete") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, idempotent: true }),
    };
  }

  // Update the exercise (RLS ensures user can only update their own)
  const { data: updatedExercise, error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
      actual_sets: actualSets,
      actual_reps: actualReps,
      actual_hold_seconds: actualHoldSeconds,
    })
    .eq("id", protocolExerciseId)
    .neq("status", "complete")
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  // Log completion only when a transition to complete occurred.
  if (updatedExercise) {
    await supabase.from("protocol_completions").insert({
      user_id: userId,
      protocol_id: exercise.protocol_id,
      protocol_exercise_id: protocolExerciseId,
      completion_date: exercise.daily_protocols.protocol_date,
      block_type: exercise.block_type,
      exercise_id: exercise.exercise_id,
    });
  }

  // The trigger will update protocol progress automatically

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

/**
 * POST /api/daily-protocol/skip
 * Mark a single exercise as skipped
 */
async function skipExercise(supabase, userId, payload, headers) {
  const { protocolExerciseId, skipReason: _skipReason } = payload;

  if (!protocolExerciseId) {
    return { ...handleValidationError("protocolExerciseId required"), headers };
  }

  // Verify ownership first (RLS should enforce, explicit check improves error quality)
  const { data: exercise, error: fetchError } = await supabase
    .from("protocol_exercises")
    .select("id, daily_protocols!inner(user_id)")
    .eq("id", protocolExerciseId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (exercise.daily_protocols.user_id !== userId) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Update the exercise
  const { error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "skipped",
      completed_at: new Date().toISOString(),
    })
    .eq("id", protocolExerciseId);

  if (updateError) {
    throw updateError;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

/**
 * POST /api/daily-protocol/complete-block
 * Mark all exercises in a block as complete
 */
async function completeBlock(supabase, userId, payload, headers) {
  const { protocolId, blockType } = payload;

  if (!protocolId || !blockType) {
    return {
      ...handleValidationError("protocolId and blockType required"),
      headers,
    };
  }

  if (!BLOCK_TYPES[blockType]) {
    return {
      ...handleValidationError("Invalid blockType"),
      headers,
    };
  }

  // Verify ownership
  const { data: protocol, error: verifyError } = await supabase
    .from("daily_protocols")
    .select("id, protocol_date")
    .eq("id", protocolId)
    .eq("user_id", userId)
    .single();

  if (verifyError || !protocol) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Get all exercises in this block
  const { data: exercises } = await supabase
    .from("protocol_exercises")
    .select("id, exercise_id")
    .eq("protocol_id", protocolId)
    .eq("block_type", blockType)
    .neq("status", "complete");

  // Update all to complete
  const { error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "complete",
      completed_at: new Date().toISOString(),
    })
    .eq("protocol_id", protocolId)
    .eq("block_type", blockType);

  if (updateError) {
    throw updateError;
  }

  // Update block status
  const blockStatusField = `${blockType}_status`;
  const blockCompletedField = `${blockType}_completed_at`;

  await supabase
    .from("daily_protocols")
    .update({
      [blockStatusField]: "complete",
      [blockCompletedField]: new Date().toISOString(),
    })
    .eq("id", protocolId);

  // Log completions
  if (exercises && exercises.length > 0) {
    const completions = exercises.map((ex) => ({
      user_id: userId,
      protocol_id: protocolId,
      protocol_exercise_id: ex.id,
      completion_date: protocol.protocol_date,
      block_type: blockType,
      exercise_id: ex.exercise_id,
    }));

    await supabase.from("protocol_completions").insert(completions);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

/**
 * POST /api/daily-protocol/skip-block
 * Mark all exercises in a block as skipped
 */
async function skipBlock(supabase, userId, payload, headers) {
  const { protocolId, blockType } = payload;

  if (!protocolId || !blockType) {
    return {
      ...handleValidationError("protocolId and blockType required"),
      headers,
    };
  }

  if (!BLOCK_TYPES[blockType]) {
    return {
      ...handleValidationError("Invalid blockType"),
      headers,
    };
  }

  // Verify ownership
  const { data: protocol, error: verifyError } = await supabase
    .from("daily_protocols")
    .select("id")
    .eq("id", protocolId)
    .eq("user_id", userId)
    .single();

  if (verifyError || !protocol) {
    return {
      ...createErrorResponse("Not authorized", 403, "authorization_error"),
      headers,
    };
  }

  // Update all to skipped
  const { error: updateError } = await supabase
    .from("protocol_exercises")
    .update({
      status: "skipped",
      completed_at: new Date().toISOString(),
    })
    .eq("protocol_id", protocolId)
    .eq("block_type", blockType);

  if (updateError) {
    throw updateError;
  }

  // Update block status
  const blockStatusField = `${blockType}_status`;
  await supabase
    .from("daily_protocols")
    .update({ [blockStatusField]: "skipped" })
    .eq("id", protocolId);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true }),
  };
}

/**
 * POST /api/daily-protocol/log-session
 * Log the main session RPE and duration
 */
async function logSession(supabase, userId, payload, headers) {
  const { protocolId, actualDurationMinutes, actualRpe, sessionNotes } =
    payload;

  if (!protocolId || !actualDurationMinutes || !actualRpe) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: "protocolId, actualDurationMinutes, and actualRpe required",
      }),
    };
  }

  // Calculate session load (duration × RPE)
  const actualLoadAu = actualDurationMinutes * actualRpe;

  // Get the protocol to retrieve the date
  const { data: protocol, error: fetchError } = await supabase
    .from("daily_protocols")
    .select("protocol_date, training_focus")
    .eq("id", protocolId)
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Update the protocol
  const { error: updateError } = await supabase
    .from("daily_protocols")
    .update({
      actual_duration_minutes: actualDurationMinutes,
      actual_rpe: actualRpe,
      actual_load_au: actualLoadAu,
      session_notes: sessionNotes,
      main_session_status: "complete",
      main_session_completed_at: new Date().toISOString(),
    })
    .eq("id", protocolId)
    .eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }

  // Detect late logging
  const sessionDate = new Date(protocol.protocol_date);
  const now = new Date();
  const hoursDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);

  let logStatus = "on_time";
  let requiresApproval = false;
  let hoursDelayed = null;

  if (hoursDiff > 48) {
    logStatus = "retroactive";
    requiresApproval = true;
    hoursDelayed = Math.floor(hoursDiff);
  } else if (hoursDiff > 24) {
    logStatus = "late";
    hoursDelayed = Math.floor(hoursDiff);
  }

  // Detect conflicts: RPE vs session type
  const conflicts = [];
  const sessionType = protocol.training_focus || "general";
  const sessionTypeIntensity = {
    recovery: { max: 4 },
    light: { max: 5 },
    moderate: { max: 7 },
    intense: { min: 7 },
  };

  const typeRules = sessionTypeIntensity[sessionType];
  if (typeRules && actualRpe) {
    if (typeRules.max && actualRpe > typeRules.max) {
      conflicts.push({
        type: "rpe_vs_session_type",
        message: `Player logged RPE ${actualRpe} but session marked as ${sessionType}`,
        playerValue: actualRpe,
        coachValue: sessionType,
      });
    }
    if (typeRules.min && actualRpe < typeRules.min) {
      conflicts.push({
        type: "rpe_vs_session_type",
        message: `Player logged RPE ${actualRpe} but session marked as ${sessionType}`,
        playerValue: actualRpe,
        coachValue: sessionType,
      });
    }
  }

  // Log to training_sessions table for ACWR calculation
  // Contract: Section 3.3 - Logging APIs (execution logging)
  try {
    // This is execution logging, not structure modification - allowed for athletes
    await supabase.from("training_sessions").insert({
      user_id: userId,
      session_date: protocol.protocol_date,
      session_type: sessionType,
      duration_minutes: actualDurationMinutes,
      rpe: actualRpe,
      load_au: actualLoadAu,
      notes: sessionNotes,
      source: "daily_protocol",
      session_state: "COMPLETED", // Execution logging creates completed session
      coach_locked: false, // Execution logs are not coach-locked
      log_status: logStatus,
      requires_coach_approval: requiresApproval,
      hours_delayed: hoursDelayed,
      conflicts: conflicts.length > 0 ? conflicts : null,
    });

    // If retroactive, notify coach for approval
    if (requiresApproval) {
      // Get coach for this player
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .eq("role", "player")
        .maybeSingle();

      if (teamMember) {
        const { data: coaches } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_id", teamMember.team_id)
          .eq("role", "coach")
          .limit(1);

        if (coaches && coaches.length > 0) {
          await supabase.from("notifications").insert({
            user_id: coaches[0].user_id,
            notification_type: "training",
            message: `Player logged training session ${hoursDelayed} hours late - approval required`,
            priority: "high",
            metadata: { playerId: userId, sessionDate: protocol.protocol_date },
          });
        }
      }
    }
  } catch (sessionError) {
    console.warn("Could not log to training_sessions:", sessionError.message);
    // Non-fatal - continue
  }

  // Trigger ACWR recalculation
  try {
    await supabase.rpc("compute_acwr", { athlete: userId });
    console.log("ACWR recalculated for user:", userId);
  } catch (acwrError) {
    console.warn("Could not recalculate ACWR:", acwrError.message);
    // Non-fatal - ACWR will be recalculated on next load
  }

  // Update wellness tracking - log the training
  try {
    await supabase.from("wellness_logs").upsert(
      {
        user_id: userId,
        log_date: protocol.protocol_date,
        training_load: actualLoadAu,
        training_duration: actualDurationMinutes,
        training_rpe: actualRpe,
      },
      {
        onConflict: "user_id,log_date",
        ignoreDuplicates: false,
      },
    );
  } catch (wellnessError) {
    console.warn("Could not update wellness:", wellnessError.message);
    // Non-fatal
  }

  // Mark completions as logged to ACWR
  try {
    await supabase
      .from("protocol_completions")
      .update({ logged_to_acwr: true, logged_to_wellness: true })
      .eq("protocol_id", protocolId)
      .eq("user_id", userId);
  } catch (completionError) {
    console.warn("Could not update completions:", completionError.message);
  }

  // Update training streak
  let streakResult = null;
  try {
    const { data: streakData, error: streakError } = await supabase.rpc(
      "update_player_streak",
      {
        p_user_id: userId,
        p_streak_type: "training",
        p_activity_date: protocol.protocol_date,
      },
    );

    if (!streakError && streakData && streakData.length > 0) {
      streakResult = streakData[0];

      // Award any streak achievements
      const unlocked = streakResult.achievements_unlocked || [];
      for (const slug of unlocked) {
        await supabase.rpc("award_achievement", {
          p_user_id: userId,
          p_achievement_slug: slug,
          p_context: JSON.stringify({ streak_length: streakResult.new_streak }),
        });
      }
    }
  } catch (streakError) {
    console.warn("Could not update streak:", streakError.message);
  }

  // Update player_training_stats
  try {
    const currentMonth = protocol.protocol_date.substring(0, 7); // YYYY-MM

    // Check if stats exist
    const { data: existingStats } = await supabase
      .from("player_training_stats")
      .select(
        "id, total_sessions, total_training_minutes, total_load_au, month_sessions, month_load_au, current_month",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (existingStats) {
      const monthReset = existingStats.current_month !== currentMonth;
      await supabase
        .from("player_training_stats")
        .update({
          total_sessions: existingStats.total_sessions + 1,
          total_training_minutes:
            existingStats.total_training_minutes + actualDurationMinutes,
          total_load_au: existingStats.total_load_au + actualLoadAu,
          month_sessions: monthReset ? 1 : existingStats.month_sessions + 1,
          month_load_au: monthReset
            ? actualLoadAu
            : existingStats.month_load_au + actualLoadAu,
          current_month: currentMonth,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      await supabase.from("player_training_stats").insert({
        user_id: userId,
        total_sessions: 1,
        total_training_minutes: actualDurationMinutes,
        total_load_au: actualLoadAu,
        month_sessions: 1,
        month_load_au: actualLoadAu,
        current_month: currentMonth,
      });
    }
  } catch (statsError) {
    console.warn("Could not update stats:", statsError.message);
  }

  // Check for session milestone achievements
  try {
    const { data: stats } = await supabase
      .from("player_training_stats")
      .select("total_sessions")
      .eq("user_id", userId)
      .maybeSingle();

    if (stats) {
      const sessionsCount = stats.total_sessions;
      // Check milestone achievements
      const milestones = [
        { count: 1, slug: "protocol_first" },
        { count: 10, slug: "sessions_10" },
        { count: 50, slug: "sessions_50" },
        { count: 100, slug: "sessions_100" },
        { count: 365, slug: "sessions_365" },
      ];

      for (const milestone of milestones) {
        if (sessionsCount >= milestone.count) {
          await supabase.rpc("award_achievement", {
            p_user_id: userId,
            p_achievement_slug: milestone.slug,
            p_context: JSON.stringify({ sessions: sessionsCount }),
          });
        }
      }
    }
  } catch (achievementError) {
    console.warn("Could not check achievements:", achievementError.message);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      actualLoadAu,
      streak: streakResult
        ? {
            newStreak: streakResult.new_streak,
            isNewRecord: streakResult.is_new_record,
          }
        : null,
    }),
  };
}

function toUtcDateOnly(dateString) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function formatUtcDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

async function computeReadinessDaysStale(
  supabase,
  userId,
  date,
  { hasCheckinToday = false, readinessScore = null } = {},
) {
  if (hasCheckinToday) {
    return 0;
  }

  const { data: lastCheckin, error } = await supabase
    .from("daily_wellness_checkin")
    .select("checkin_date")
    .eq("user_id", userId)
    .lte("checkin_date", date)
    .order("checkin_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.warn("[daily-protocol] Failed to compute readiness staleness:", error);
    return readinessScore !== null ? 0 : null;
  }

  if (!lastCheckin?.checkin_date) {
    return readinessScore !== null ? 0 : null;
  }

  const targetDate = toUtcDateOnly(date);
  const lastDate = toUtcDateOnly(lastCheckin.checkin_date);
  const diffDays = Math.floor(
    (targetDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(diffDays, 0);
}

async function computeTrainingDaysLogged(
  supabase,
  userId,
  date,
  windowDays = 21,
) {
  const startDate = toUtcDateOnly(date);
  startDate.setUTCDate(startDate.getUTCDate() - (windowDays - 1));
  const windowStart = formatUtcDateOnly(startDate);

  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select("session_date, session_state")
    .eq("user_id", userId)
    .not("session_date", "is", null)
    .gte("session_date", windowStart)
    .lte("session_date", date);

  if (error) {
    console.warn(
      "[daily-protocol] Failed to compute training days logged:",
      error.message,
    );
    return null;
  }

  const completedStates = new Set(["completed", "complete"]);
  const uniqueDays = new Set();

  for (const session of sessions || []) {
    const state = session.session_state?.toLowerCase?.();
    if (state && !completedStates.has(state)) {
      continue;
    }
    if (session.session_date) {
      uniqueDays.add(session.session_date);
    }
  }

  return uniqueDays.size;
}

/**
 * Dynamically compute confidence_metadata based on CURRENT wellness check-in status
 * This ensures the banner reflects the latest check-in, not stale stored values from protocol generation
 *
 * @param {object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {string} date - Protocol date (YYYY-MM-DD)
 * @param {object} protocol - Stored protocol data
 * @returns {object} Updated confidence_metadata
 */
async function computeDynamicConfidenceMetadata(
  supabase,
  userId,
  date,
  protocol,
) {
  // Check for today's wellness check-in
  // Note: daily_wellness_checkin uses calculated_readiness and overall_readiness_score columns
  const { data: todayWellness, error: wellnessError } = await supabase
    .from("daily_wellness_checkin")
    .select(
      "id, calculated_readiness, overall_readiness_score, created_at, checkin_date",
    )
    .eq("user_id", userId)
    .eq("checkin_date", date)
    .maybeSingle();

  if (wellnessError && wellnessError.code !== "PGRST116") {
    console.warn("[daily-protocol] Error checking wellness:", wellnessError);
  }

  const hasCheckinToday = !!todayWellness;
  // Prefer calculated_readiness, fallback to overall_readiness_score, then protocol value
  const readinessScore =
    todayWellness?.calculated_readiness ??
    todayWellness?.overall_readiness_score ??
    protocol.readiness_score;

  const daysStale = await computeReadinessDaysStale(supabase, userId, date, {
    hasCheckinToday,
    readinessScore,
  });
  const trainingDaysLogged = await computeTrainingDaysLogged(
    supabase,
    userId,
    date,
  );

  // Determine readiness confidence
  let readinessConfidence = "none";
  if (hasCheckinToday) {
    readinessConfidence = "high";
  } else if (daysStale !== null && daysStale <= 2) {
    readinessConfidence = "stale";
  } else if (readinessScore !== null) {
    readinessConfidence = "stale";
  }

  // Use stored confidence_metadata for ACWR and sessionResolution (these don't change as frequently)
  const storedMeta = protocol.confidence_metadata || {};

  console.log("[daily-protocol] Dynamic confidence metadata computed:", {
    hasCheckinToday,
    readinessScore,
    daysStale,
    readinessConfidence,
  });

  const acwrHasData = protocol.acwr_value !== null;

  return {
    readiness: {
      hasData: hasCheckinToday || readinessScore !== null,
      source: hasCheckinToday
        ? "wellness_checkin"
        : readinessScore !== null
          ? "stored"
          : "none",
      daysStale,
      confidence: readinessConfidence,
      // Internal field for updating protocol.readiness_score in the response
      _readinessScore: readinessScore,
    },
    acwr: {
      hasData: storedMeta.acwr?.hasData ?? acwrHasData,
      source:
        storedMeta.acwr?.source ||
        (acwrHasData || trainingDaysLogged !== null
          ? "training_sessions"
          : "none"),
      trainingDaysLogged:
        trainingDaysLogged ?? storedMeta.acwr?.trainingDaysLogged ?? null,
      confidence:
        storedMeta.acwr?.confidence ||
        (acwrHasData ? "high" : "building_baseline"),
    },
    sessionResolution: storedMeta.sessionResolution || {
      success: true,
      status: "resolved",
      hasProgram: true,
      hasSessionTemplate: true,
    },
  };
}

/**
 * Transform protocol data for frontend
 */
function transformProtocolResponse(
  protocol,
  exercises,
  coachName = null,
  teamActivity = null,
  sessionResolution = null,
) {
  // Group exercises by block type (including new evidence-based blocks)
  const blocks = {
    morning_mobility: [],
    foam_roll: [],
    warm_up: [],
    isometrics: [], // NEW: Evidence-based isometric training
    plyometrics: [], // NEW: Phase-appropriate plyometric work
    strength: [], // NEW: Strength incl. mandatory Nordic curls
    conditioning: [], // NEW: ACWR-adjusted conditioning
    skill_drills: [], // NEW: Position-specific skill/twitching
    main_session: [], // Legacy - kept for backwards compatibility
    cool_down: [],
    evening_recovery: [],
  };

  exercises.forEach((pe) => {
    if (blocks[pe.block_type]) {
      blocks[pe.block_type].push(transformExercise(pe));
    }
  });

  // Create block objects
  const createBlock = (type, title, icon) => {
    const blockExercises = blocks[type] || [];
    const completedCount = blockExercises.filter(
      (e) => e.status === "complete",
    ).length;

    return {
      type,
      title,
      icon,
      status: protocol[`${type}_status`] || "pending",
      exercises: blockExercises,
      completedCount,
      totalCount: blockExercises.length,
      progressPercent:
        blockExercises.length > 0
          ? Math.round((completedCount / blockExercises.length) * 100)
          : 0,
      completedAt: protocol[`${type}_completed_at`],
      estimatedDurationMinutes: BLOCK_TYPES[type]?.estimatedMinutes,
    };
  };

  // Build blocks array for resolver (including new evidence-based blocks)
  const blocksArray = [];
  if (blocks.morning_mobility.length > 0) {
    blocksArray.push({ type: "morning_mobility", title: "Morning Mobility" });
  }
  if (blocks.foam_roll.length > 0) {
    blocksArray.push({ type: "foam_roll", title: "Pre-Training: Foam Roll" });
  }
  if (blocks.warm_up.length > 0) {
    blocksArray.push({ type: "warm_up", title: "Warm-Up (25 min)" });
  }
  // Evidence-based training blocks
  if (blocks.isometrics.length > 0) {
    blocksArray.push({ type: "isometrics", title: "Isometrics (15 min)" });
  }
  if (blocks.plyometrics.length > 0) {
    blocksArray.push({ type: "plyometrics", title: "Plyometrics (15 min)" });
  }
  if (blocks.strength.length > 0) {
    blocksArray.push({ type: "strength", title: "Strength (15 min)" });
  }
  if (blocks.conditioning.length > 0) {
    blocksArray.push({ type: "conditioning", title: "Conditioning (15 min)" });
  }
  if (blocks.skill_drills.length > 0) {
    blocksArray.push({ type: "skill_drills", title: "Skill Drills (15 min)" });
  }
  if (blocks.main_session.length > 0) {
    blocksArray.push({ type: "main_session", title: "Main Session" });
  }
  if (blocks.cool_down.length > 0) {
    blocksArray.push({ type: "cool_down", title: "Cool-Down (15 min)" });
  }
  if (blocks.evening_recovery.length > 0) {
    blocksArray.push({ type: "evening_recovery", title: "Evening Recovery" });
  }

  return {
    id: protocol.id,
    userId: protocol.user_id,
    protocol_date: protocol.protocol_date,
    readiness_score: protocol.readiness_score,
    acwr_value: protocol.acwr_value,
    totalLoadTargetAu: protocol.total_load_target_au,
    aiRationale: protocol.ai_rationale,
    trainingFocus: protocol.training_focus,
    morningMobility: createBlock(
      "morning_mobility",
      "Morning Mobility",
      "pi-sun",
    ),
    foamRoll: createBlock(
      "foam_roll",
      "Pre-Training: Foam Roll",
      "pi-circle-fill",
    ),
    warmUp: createBlock("warm_up", "Warm-Up (25 min)", "pi-bolt"),
    // Evidence-based training blocks
    isometrics: createBlock(
      "isometrics",
      "Isometrics (15 min)",
      "pi-pause-circle",
    ),
    plyometrics: createBlock(
      "plyometrics",
      "Plyometrics (15 min)",
      "pi-arrow-up",
    ),
    strength: createBlock("strength", "Strength (15 min)", "pi-heart"),
    conditioning: createBlock(
      "conditioning",
      "Conditioning (15 min)",
      "pi-directions-run",
    ),
    skillDrills: createBlock(
      "skill_drills",
      "Skill Drills (15 min)",
      "pi-bolt",
    ),
    mainSession: createBlock("main_session", "Main Session", "pi-play"),
    coolDown: createBlock("cool_down", "Cool-Down (15 min)", "pi-stop"),
    eveningRecovery: createBlock(
      "evening_recovery",
      "Evening Recovery",
      "pi-moon",
    ),
    blocks: blocksArray, // For resolver
    overallProgress: protocol.overall_progress || 0,
    completedExercises: protocol.completed_exercises || 0,
    totalExercises: protocol.total_exercises || 0,
    actualDurationMinutes: protocol.actual_duration_minutes,
    actualRpe: protocol.actual_rpe,
    actualLoadAu: protocol.actual_load_au,
    sessionNotes: protocol.session_notes,
    generatedAt: protocol.generated_at,
    updatedAt: protocol.updated_at,
    // Coach alert fields (for resolver)
    coach_alert_active: protocol.coach_alert_active || false,
    coach_alert_message: protocol.coach_alert_message || null,
    coach_alert_requires_acknowledgment:
      protocol.coach_alert_requires_acknowledgment || false,
    coach_acknowledged: protocol.coach_acknowledged || false,
    modified_by_coach_id: protocol.modified_by_coach_id || null,
    modified_by_coach_name:
      coachName || protocol.modified_by_coach_name || null,
    modified_at: protocol.modified_at || null,
    // Coach note fields
    coach_note: protocol.coach_note
      ? {
          content: protocol.coach_note,
          priority: protocol.coach_note_priority || "info",
          coachName: coachName || protocol.modified_by_coach_name || null,
          timestampLocal: protocol.modified_at || protocol.updated_at,
        }
      : null,
    // Team activity (PROMPT 2.10)
    teamActivity,
    // Session resolution (PROMPT 2.12 - Authority SOT)
    sessionResolution,
    // Confidence metadata (Truthfulness Contract)
    confidenceMetadata: protocol.confidence_metadata || null,
  };
}

/**
 * Transform a single exercise for frontend
 * Handles both:
 * 1. Normal exercises with linked exercise_id (joined data in protocolExercise.exercises)
 * 2. Fallback exercises with exercise_id=null (inline data from ai_note and prescribed fields)
 */
function transformExercise(protocolExercise) {
  const ex = protocolExercise.exercises;

  // Handle fallback exercises (no linked exercise_id, exercise data comes from protocol_exercises directly)
  if (!ex) {
    // Extract exercise name from ai_note (format: "emoji Name - description" or just description)
    const aiNote = protocolExercise.ai_note || "";
    const blockType = protocolExercise.block_type || "general";

    // Generate a name from the sequence and block type if not available
    const exerciseName = `${blockType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Exercise ${protocolExercise.sequence_order || 1}`;

    return {
      id: protocolExercise.id,
      exerciseId: protocolExercise.id, // Use protocol_exercise id as fallback
      exercise: {
        id: protocolExercise.id,
        name: exerciseName,
        slug: exerciseName.toLowerCase().replace(/\s+/g, "-"),
        category: blockType,
        subcategory: null,
        videoUrl: protocolExercise.video_url || null,
        videoId: null,
        videoDurationSeconds: protocolExercise.prescribed_duration_seconds,
        thumbnailUrl: null,
        howText: aiNote, // Use AI note as instructions
        feelText: null,
        compensationText: null,
        defaultSets: protocolExercise.prescribed_sets || 1,
        defaultReps: protocolExercise.prescribed_reps,
        defaultHoldSeconds: protocolExercise.prescribed_hold_seconds,
        defaultDurationSeconds: protocolExercise.prescribed_duration_seconds,
        difficultyLevel: "intermediate",
        loadContributionAu: protocolExercise.load_contribution_au || 0,
        isHighIntensity: false,
      },
      blockType: protocolExercise.block_type,
      sequenceOrder: protocolExercise.sequence_order,
      prescribedSets: protocolExercise.prescribed_sets,
      prescribedReps: protocolExercise.prescribed_reps,
      prescribedHoldSeconds: protocolExercise.prescribed_hold_seconds,
      prescribedDurationSeconds: protocolExercise.prescribed_duration_seconds,
      prescribedWeightKg: protocolExercise.prescribed_weight_kg,
      yesterdaySets: protocolExercise.yesterday_sets,
      yesterdayReps: protocolExercise.yesterday_reps,
      yesterdayHoldSeconds: protocolExercise.yesterday_hold_seconds,
      progressionNote: protocolExercise.progression_note,
      aiNote: protocolExercise.ai_note,
      status: protocolExercise.status || "pending",
      completedAt: protocolExercise.completed_at,
      actualSets: protocolExercise.actual_sets,
      actualReps: protocolExercise.actual_reps,
      actualHoldSeconds: protocolExercise.actual_hold_seconds,
      loadContributionAu: protocolExercise.load_contribution_au,
    };
  }

  // Normal path: exercise data from joined exercises table
  return {
    id: protocolExercise.id,
    exerciseId: ex.id,
    exercise: {
      id: ex.id,
      name: ex.name,
      slug: ex.slug,
      category: ex.category,
      subcategory: ex.subcategory,
      videoUrl: ex.video_url,
      videoId: ex.video_id,
      videoDurationSeconds: ex.video_duration_seconds,
      thumbnailUrl: ex.thumbnail_url,
      howText: ex.how_text,
      feelText: ex.feel_text,
      compensationText: ex.compensation_text,
      defaultSets: ex.default_sets,
      defaultReps: ex.default_reps,
      defaultHoldSeconds: ex.default_hold_seconds,
      defaultDurationSeconds: ex.default_duration_seconds,
      difficultyLevel: ex.difficulty_level,
      loadContributionAu: ex.load_contribution_au,
      isHighIntensity: ex.is_high_intensity,
    },
    blockType: protocolExercise.block_type,
    sequenceOrder: protocolExercise.sequence_order,
    prescribedSets: protocolExercise.prescribed_sets,
    prescribedReps: protocolExercise.prescribed_reps,
    prescribedHoldSeconds: protocolExercise.prescribed_hold_seconds,
    prescribedDurationSeconds: protocolExercise.prescribed_duration_seconds,
    prescribedWeightKg: protocolExercise.prescribed_weight_kg,
    yesterdaySets: protocolExercise.yesterday_sets,
    yesterdayReps: protocolExercise.yesterday_reps,
    yesterdayHoldSeconds: protocolExercise.yesterday_hold_seconds,
    progressionNote: protocolExercise.progression_note,
    aiNote: protocolExercise.ai_note,
    status: protocolExercise.status,
    completedAt: protocolExercise.completed_at,
    actualSets: protocolExercise.actual_sets,
    actualReps: protocolExercise.actual_reps,
    actualHoldSeconds: protocolExercise.actual_hold_seconds,
    loadContributionAu: protocolExercise.load_contribution_au,
  };
}
