#!/usr/bin/env node
/**
 * Seed Script: Recovery Alternatives for AI Coach Swap Plans
 *
 * Phase 1: Populates knowledge_base_entries with low-intensity
 * recovery alternatives that can be used when ACWR blocks
 * high-intensity recommendations.
 *
 * Usage: node scripts/seed-recovery-alternatives.cjs
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Recovery alternative entries to seed
const RECOVERY_ALTERNATIVES = [
  // ALL POSITIONS - Low Intensity
  {
    title: "Low-Intensity A-Skip Mechanics",
    content:
      "A-skips at 50-60% intensity focusing on proper knee drive and arm coordination. Keep ground contact light and controlled. Focus on rhythm rather than power. Perform 2-3 sets of 20 meters with full recovery between sets.",
    category: "movement_training",
    subcategory: "speed_mechanics",
    position_relevance: ["ALL"],
    intensity_level: "low",
    evidence_grade: "B",
  },
  {
    title: "Wall Drive Technique Drills",
    content:
      "Stand facing a wall with hands on the wall at shoulder height. Practice driving one knee up while keeping the opposite leg extended. Hold each position for 2-3 seconds. Focus on hip flexor engagement and proper body alignment. 10 reps per leg, 2 sets.",
    category: "movement_training",
    subcategory: "speed_mechanics",
    position_relevance: ["ALL"],
    intensity_level: "low",
    evidence_grade: "B",
  },
  {
    title: "Hip Mobility Flow",
    content:
      "Complete flow: 90/90 stretch (30 sec each side) → Hip circles (10 each direction) → World's greatest stretch (5 reps per side) → Pigeon stretch (30 sec each side). Focus on controlled movement and breathing.",
    category: "recovery",
    subcategory: "mobility",
    position_relevance: ["ALL"],
    intensity_level: "low",
    evidence_grade: "A",
  },
  {
    title: "Active Recovery Walk",
    content:
      "Light walking for 15-20 minutes at conversational pace. Can include gentle arm circles and torso rotations. Focus on diaphragmatic breathing and relaxation. Ideal for high ACWR days.",
    category: "recovery",
    subcategory: "active_recovery",
    position_relevance: ["ALL"],
    intensity_level: "rest",
    evidence_grade: "A",
  },
  {
    title: "Foam Rolling Protocol",
    content:
      "Spend 60-90 seconds per muscle group: quadriceps, hamstrings, IT band, glutes, calves, upper back. Roll slowly (1 inch per second), pause on tender spots for 30 seconds. Avoid rolling directly on joints or bones.",
    category: "recovery",
    subcategory: "tissue_work",
    position_relevance: ["ALL"],
    intensity_level: "rest",
    evidence_grade: "A",
  },
  {
    title: "Controlled Breathing Session",
    content:
      "Box breathing pattern: inhale 4 seconds, hold 4 seconds, exhale 4 seconds, hold 4 seconds. Complete 10 cycles. Follow with 5 minutes of 4-7-8 breathing (inhale 4, hold 7, exhale 8). Promotes parasympathetic activation.",
    category: "recovery",
    subcategory: "mental",
    position_relevance: ["ALL"],
    intensity_level: "rest",
    evidence_grade: "B",
  },
  {
    title: "Light Resistance Band Work",
    content:
      "Low-resistance band exercises for muscle activation without load: band pull-aparts (15 reps), band walks (10 steps each direction), band face pulls (12 reps). Keep resistance light and movements controlled.",
    category: "strength_training",
    subcategory: "activation",
    position_relevance: ["ALL"],
    intensity_level: "low",
    evidence_grade: "B",
  },
  {
    title: "Ankle Mobility Routine",
    content:
      "Ankle circles (10 each direction), wall ankle stretches (30 sec each), single-leg balance holds (30 sec each), toe raises (15 reps). Focus on range of motion and stability.",
    category: "recovery",
    subcategory: "mobility",
    position_relevance: ["ALL"],
    intensity_level: "low",
    evidence_grade: "B",
  },
  {
    title: "Core Stability Breathing",
    content:
      "Dead bug progression with focus on breathing: exhale fully as you extend opposite arm/leg, inhale on return. 8 reps per side, 2 sets. Keep lower back pressed into floor throughout.",
    category: "strength_training",
    subcategory: "core",
    position_relevance: ["ALL"],
    intensity_level: "low",
    evidence_grade: "B",
  },
  {
    title: "Gentle Stretching Routine",
    content:
      "Hold each stretch 45-60 seconds: standing quad stretch, kneeling hip flexor, seated hamstring, standing calf, doorway chest stretch, cross-body shoulder. Breathe deeply and avoid bouncing.",
    category: "recovery",
    subcategory: "flexibility",
    position_relevance: ["ALL"],
    intensity_level: "rest",
    evidence_grade: "A",
  },

  // QUARTERBACK - Position Specific
  {
    title: "QB Arm Care Band Work",
    content:
      "Light resistance band exercises for shoulder health: external rotations (15 reps), internal rotations (15 reps), shoulder W raises (12 reps). Keep movements slow and controlled. Ideal for recovery days.",
    category: "injury_prevention",
    subcategory: "arm_care",
    position_relevance: ["QB"],
    intensity_level: "low",
    evidence_grade: "A",
  },
  {
    title: "QB Footwork Visualization",
    content:
      "Mental practice session: visualize 5-step drop timing, hitching mechanics, and pocket movement. Close your eyes and mentally rehearse reading defenses and going through progressions. 10-15 minutes.",
    category: "mental_training",
    subcategory: "visualization",
    position_relevance: ["QB"],
    intensity_level: "rest",
    evidence_grade: "B",
  },
  {
    title: "QB T-Spine Mobility",
    content:
      "Thoracic spine rotation exercises: open books (10 reps per side), cat-cow (15 reps), quadruped thoracic rotations (10 per side). Essential for throwing mechanics without loading the arm.",
    category: "recovery",
    subcategory: "mobility",
    position_relevance: ["QB"],
    intensity_level: "low",
    evidence_grade: "A",
  },
  {
    title: "QB Film Study Session",
    content:
      "Review game/practice film focusing on: defensive coverage recognition, timing patterns, and pre-snap reads. Take notes on tendencies. Active mental training without physical load.",
    category: "mental_training",
    subcategory: "film_study",
    position_relevance: ["QB"],
    intensity_level: "rest",
    evidence_grade: "B",
  },

  // WIDE RECEIVER - Position Specific
  {
    title: "WR Route Visualization",
    content:
      "Mental rehearsal of route tree: sit/curl, out, comeback, corner, post, go. Visualize stem, break point, and hand placement for each route. Include defender reactions. 10-15 minutes.",
    category: "mental_training",
    subcategory: "visualization",
    position_relevance: ["WR"],
    intensity_level: "rest",
    evidence_grade: "B",
  },
  {
    title: "WR Hand-Eye Coordination",
    content:
      "Light ball catching drills: wall tosses (50 reps each hand), tennis ball catches (30 reps), tip drill with partner (20 reps). Focus on tracking and soft hands without running.",
    category: "skills_training",
    subcategory: "catching",
    position_relevance: ["WR"],
    intensity_level: "low",
    evidence_grade: "B",
  },
  {
    title: "WR Hip Mobility Circuit",
    content:
      "Receiver-specific hip work: hip flexor stretch with reach (30 sec each), lateral lunges (10 each side holding 5 sec), figure-4 stretch (45 sec each). Essential for cutting and route running.",
    category: "recovery",
    subcategory: "mobility",
    position_relevance: ["WR"],
    intensity_level: "low",
    evidence_grade: "B",
  },

  // RUNNING BACK - Position Specific
  {
    title: "RB Vision Drills",
    content:
      "Light agility ladder work at walking pace focusing on reading 'holes'. Partner calls direction changes. Mental processing without explosive movements. 10 minutes total.",
    category: "skills_training",
    subcategory: "vision",
    position_relevance: ["RB"],
    intensity_level: "low",
    evidence_grade: "C",
  },
  {
    title: "RB Ball Security Practice",
    content:
      "Stationary ball security drills: high-low transitions (30 reps), switch hands (30 reps), body contact simulation without movement. Focus on grip strength and ball position.",
    category: "skills_training",
    subcategory: "ball_handling",
    position_relevance: ["RB"],
    intensity_level: "low",
    evidence_grade: "C",
  },

  // DEFENSIVE BACK - Position Specific
  {
    title: "DB Backpedal Technique Review",
    content:
      "Very light backpedal mechanics at 40% speed: focus on hip sink, arm action, and head position. 10-meter reps, 6-8 total. No sudden transitions or full-speed breaks.",
    category: "skills_training",
    subcategory: "coverage",
    position_relevance: ["DB", "CB", "S"],
    intensity_level: "low",
    evidence_grade: "C",
  },
  {
    title: "DB Coverage Film Study",
    content:
      "Watch film focusing on receiver releases, route combinations, and leverage positioning. Identify pre-snap alignment cues. Mental preparation without physical load.",
    category: "mental_training",
    subcategory: "film_study",
    position_relevance: ["DB", "CB", "S"],
    intensity_level: "rest",
    evidence_grade: "B",
  },
  {
    title: "DB Hip Turn Mobility",
    content:
      "Hip mobility for transitions: standing hip circles (10 each direction), lateral leg swings (15 each), hip flexor holds with rotation (30 sec each). Critical for change of direction.",
    category: "recovery",
    subcategory: "mobility",
    position_relevance: ["DB", "CB", "S"],
    intensity_level: "low",
    evidence_grade: "B",
  },

  // LINEBACKER - Position Specific
  {
    title: "LB Shuffle Mechanics",
    content:
      "Very light lateral shuffle practice at 40% speed: focus on hip level, foot spacing, and arm action. 10 yards each direction, 4 sets. No explosive movements.",
    category: "skills_training",
    subcategory: "movement",
    position_relevance: ["LB"],
    intensity_level: "low",
    evidence_grade: "C",
  },
  {
    title: "LB Run Fit Visualization",
    content:
      "Mental rehearsal of gap responsibilities: A-gap, B-gap, C-gap fits against various run schemes. Visualize reading guards and scraping to the ball.",
    category: "mental_training",
    subcategory: "visualization",
    position_relevance: ["LB"],
    intensity_level: "rest",
    evidence_grade: "C",
  },

  // LINEMAN (OL/DL) - Position Specific
  {
    title: "OL Hand Placement Drills",
    content:
      "Stance work and hand punch practice against pad or wall. Focus on placement inside shoulder pads and punch timing. Light resistance, controlled movements. 3 sets of 10.",
    category: "skills_training",
    subcategory: "technique",
    position_relevance: ["OL", "C", "G", "T"],
    intensity_level: "low",
    evidence_grade: "C",
  },
  {
    title: "Lineman Ankle Mobility",
    content:
      "Essential for stance and explosion: deep squat holds (30 sec), ankle dorsiflexion stretches against wall (30 sec each), single-leg balance with eyes closed (30 sec each).",
    category: "recovery",
    subcategory: "mobility",
    position_relevance: ["OL", "DL", "C", "G", "T", "DE", "DT"],
    intensity_level: "low",
    evidence_grade: "B",
  },

  // KICKER - Position Specific
  {
    title: "Kicker Hip Mobility",
    content:
      "Kicking-specific hip flexor and hip opener work: kneeling hip flexor stretch (45 sec each), pigeon pose (45 sec each), dynamic leg swings (15 each direction). Essential for leg health.",
    category: "recovery",
    subcategory: "mobility",
    position_relevance: ["K", "P"],
    intensity_level: "low",
    evidence_grade: "B",
  },
];

async function seedRecoveryAlternatives() {
  console.log(
    "🌱 Seeding recovery alternatives to knowledge_base_entries...\n",
  );

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of RECOVERY_ALTERNATIVES) {
    // Check if entry already exists by title
    const { data: existing } = await supabase
      .from("knowledge_base_entries")
      .select("id")
      .eq("title", entry.title)
      .single();

    if (existing) {
      console.log(`⏭️  Skipped (exists): ${entry.title}`);
      skipped++;
      continue;
    }

    // Insert new entry
    const { error } = await supabase.from("knowledge_base_entries").insert({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      subcategory: entry.subcategory,
      position_relevance: entry.position_relevance,
      intensity_level: entry.intensity_level,
      evidence_grade: entry.evidence_grade,
      is_recovery_alternative: true,
      is_active: true,
      source_type: "curated",
      source_quality_score:
        entry.evidence_grade === "A"
          ? 0.9
          : entry.evidence_grade === "B"
            ? 0.7
            : 0.5,
    });

    if (error) {
      console.error(`❌ Error inserting "${entry.title}":`, error.message);
      errors++;
    } else {
      console.log(
        `✅ Inserted: ${entry.title} [${entry.position_relevance.join(", ")}]`,
      );
      inserted++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`   Total:    ${RECOVERY_ALTERNATIVES.length}`);

  if (errors > 0) {
    process.exit(1);
  }
}

// Run the seed
seedRecoveryAlternatives()
  .then(() => {
    console.log("\n✨ Seeding complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n💥 Seeding failed:", err);
    process.exit(1);
  });
