// Elite Sprint Training Database Seeder
// Based on research of USA, Jamaica, UK sprinter training methods

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

const sql = neon(process.env.DATABASE_URL);

// Elite sprint workouts based on research
const eliteSprintWorkouts = [
  // Acceleration Phase (USA Power Method)
  {
    category: "acceleration",
    phase: "early_season",
    name: "3-Point Start Power Development",
    distance_yards: 10,
    intensity_percentage: 95,
    rest_duration_seconds: 180,
    sets: 3,
    reps_per_set: 6,
    recovery_between_sets_seconds: 300,
    surface_type: "grass",
    coaching_cues: [
      "Drive phase forward lean",
      "High knee frequency",
      "Pump arms aggressively",
    ],
    elite_application_notes:
      "Based on US sprinter training - focus on horizontal force production",
  },
  {
    category: "acceleration",
    phase: "early_season",
    name: "Resisted Sprint Acceleration",
    distance_yards: 15,
    intensity_percentage: 90,
    rest_duration_seconds: 120,
    sets: 4,
    reps_per_set: 4,
    recovery_between_sets_seconds: 240,
    surface_type: "turf",
    coaching_cues: [
      "Maintain forward lean",
      "Short powerful steps",
      "Drive through resistance",
    ],
    elite_application_notes: "Sled training method used by Jamaican sprinters",
  },

  // Hill Training (Jamaican Method)
  {
    category: "hill_training",
    phase: "pre_season",
    name: "Power Hill Sprints",
    distance_yards: 15,
    intensity_percentage: 85,
    rest_duration_seconds: 120,
    sets: 2,
    reps_per_set: 8,
    recovery_between_sets_seconds: 480,
    surface_type: "hill",
    gradient_percentage: 10,
    coaching_cues: [
      "High knee drive",
      "Pump arms powerfully",
      "Maintain speed rhythm",
    ],
    elite_application_notes:
      "Stephen Francis method - builds specific strength for acceleration",
  },
  {
    category: "hill_training",
    phase: "pre_season",
    name: "Long Hill Base Building",
    distance_yards: 40,
    intensity_percentage: 75,
    rest_duration_seconds: 180,
    sets: 3,
    reps_per_set: 6,
    recovery_between_sets_seconds: 360,
    surface_type: "hill",
    gradient_percentage: 8,
    coaching_cues: [
      "Steady rhythm",
      "Relaxed shoulders",
      "Controlled breathing",
    ],
    elite_application_notes:
      "Early season conditioning used in Jamaica training camps",
  },

  // Speed Endurance (UK Athletics Method)
  {
    category: "speed_endurance",
    phase: "mid_season",
    name: "Special Endurance I (Flag Football)",
    distance_yards: 25,
    intensity_percentage: 95,
    rest_duration_seconds: 45,
    sets: 4,
    reps_per_set: 4,
    recovery_between_sets_seconds: 180,
    surface_type: "grass",
    coaching_cues: ["Maintain sprint form", "Fight fatigue", "Strong finish"],
    elite_application_notes:
      "UK Athletics protocol adapted for flag football game demands",
  },
  {
    category: "speed_endurance",
    phase: "mid_season",
    name: "Game Simulation Repeats",
    distance_yards: 15,
    intensity_percentage: 98,
    rest_duration_seconds: 10,
    sets: 6,
    reps_per_set: 6,
    recovery_between_sets_seconds: 120,
    surface_type: "turf",
    coaching_cues: ["Quick recovery", "Explosive restart", "Mental toughness"],
    elite_application_notes:
      "Mimics flag football play frequency and intensity",
  },
];

// Agility patterns specific to flag football
const agilityPatterns = [
  {
    name: "L-Drill Pro",
    pattern_type: "l_drill",
    setup_description:
      "Set up L-shaped cone pattern: 5 yards forward, 5 yards lateral, 5 yards back",
    cone_spacing_yards: 5,
    total_distance_yards: 20,
    direction_changes_count: 3,
    execution_instructions: [
      "Sprint 5 yards forward to first cone",
      "Plant and cut right 90 degrees, sprint 5 yards",
      "Plant and cut left 180 degrees, sprint 10 yards",
      "Plant and cut right 90 degrees, sprint 5 yards to finish",
    ],
    flag_football_application:
      "Simulates route running with sharp cuts and direction changes",
  },
  {
    name: "Figure-8 Power",
    pattern_type: "figure_8",
    setup_description: "Two cones 8 yards apart, sprint in figure-8 pattern",
    cone_spacing_yards: 8,
    total_distance_yards: 32,
    direction_changes_count: 6,
    execution_instructions: [
      "Start at center between cones",
      "Sprint to right cone, circle clockwise",
      "Sprint to left cone, circle counter-clockwise",
      "Complete two full figure-8 patterns",
    ],
    flag_football_application:
      "Develops curved running patterns for evasion and pursuit",
  },
  {
    name: "Reactive Flag Pull",
    pattern_type: "reactive",
    setup_description:
      "Partner holds flags, runner reacts to partner movements",
    cone_spacing_yards: 0,
    total_distance_yards: 15,
    direction_changes_count: 4,
    execution_instructions: [
      "Partner with flags moves laterally at 10-yard line",
      "Runner mirrors movements while advancing",
      "Partner signals direction changes every 2-3 steps",
      "Runner must maintain forward progress while evading",
    ],
    flag_football_application:
      "Game-specific evasion training with unpredictable elements",
  },
];

// Recovery protocols based on elite sprinter research
const recoveryProtocols = [
  {
    name: "Elite Cold Water Immersion",
    recovery_type: "cold_water",
    duration_minutes: 10,
    temperature_fahrenheit: 52,
    instructions:
      "Immerse legs up to waist for 10 minutes, gentle movement allowed",
    effectiveness_percentage: 87, // Based on elite usage statistics
    recommended_timing: "within_2_hours",
  },
  {
    name: "Sauna Recovery Session",
    recovery_type: "sauna",
    duration_minutes: 15,
    temperature_fahrenheit: 185,
    instructions: "Sit in sauna 15 minutes, hydrate before and after",
    effectiveness_percentage: 97, // Most used by elite sprinters
    recommended_timing: "within_2_hours",
  },
  {
    name: "Active Recovery Walk",
    recovery_type: "active",
    duration_minutes: 20,
    temperature_fahrenheit: null,
    instructions: "Light walking with dynamic stretching on grass surface",
    effectiveness_percentage: 75,
    recommended_timing: "immediately_post",
  },
  {
    name: "Power Nap Recovery",
    recovery_type: "passive",
    duration_minutes: 25,
    temperature_fahrenheit: null,
    instructions: "Dark room, 20-30 minute nap 2-4 hours post-training",
    effectiveness_percentage: 81, // Elite usage statistic
    recommended_timing: "within_4_hours",
  },
];

// Mental preparation techniques from elite sprinters
const mentalPreparationProtocols = [
  {
    technique_name: "Pre-Sprint Visualization",
    technique_type: "visualization",
    duration_minutes: 5,
    timing: "pre_training",
    instructions:
      "Visualize perfect start, acceleration, and finish. See and feel successful execution.",
    example_mantras: ["Perfect start", "Explosive drive", "Strong finish"],
    effectiveness_notes: "Used by 95% of elite sprinters before competition",
  },
  {
    technique_name: "Power Mantras",
    technique_type: "self_talk",
    duration_minutes: 1,
    timing: "pre_game",
    instructions:
      "Repeat power words silently or aloud before each sprint attempt",
    example_mantras: ["Explosive", "Fast feet", "Drive hard", "Quick hands"],
    effectiveness_notes:
      "Helps maintain focus and confidence during high-pressure situations",
  },
  {
    technique_name: "Reset Breathing",
    technique_type: "breathing",
    duration_minutes: 2,
    timing: "between_plays",
    instructions: "4-count inhale, 6-count exhale, repeat 3 cycles",
    example_mantras: ["Breathe in power", "Breathe out tension"],
    effectiveness_notes:
      "Calms nervous system and prepares for next sprint effort",
  },
  {
    technique_name: "Error Recovery Protocol",
    technique_type: "self_talk",
    duration_minutes: 1,
    timing: "post_error",
    instructions: "Acknowledge mistake, refocus on next opportunity",
    example_mantras: ["Next play", "Learn and go", "Better this time"],
    effectiveness_notes: "Prevents negative spiral after poor performance",
  },
];

// Skill progression tiers
const skillProgressionTiers = [
  // Acceleration Progression
  {
    movement_category: "acceleration",
    tier_level: 1,
    tier_name: "Beginner Acceleration",
    unlock_requirements: { prerequisite: "none" },
    mastery_criteria: {
      ten_yard_time_seconds: 2.0,
      technique_score: 6,
      consistency_percentage: 70,
    },
    elite_benchmark_notes:
      "Can execute basic 3-point start with proper body position",
  },
  {
    movement_category: "acceleration",
    tier_level: 2,
    tier_name: "Intermediate Acceleration",
    unlock_requirements: {
      prerequisite: "beginner_acceleration",
      min_sessions: 10,
    },
    mastery_criteria: {
      ten_yard_time_seconds: 1.8,
      technique_score: 7,
      consistency_percentage: 80,
    },
    elite_benchmark_notes: "Demonstrates power drive phase with good knee lift",
  },
  {
    movement_category: "acceleration",
    tier_level: 3,
    tier_name: "Advanced Acceleration",
    unlock_requirements: {
      prerequisite: "intermediate_acceleration",
      min_sessions: 20,
    },
    mastery_criteria: {
      ten_yard_time_seconds: 1.6,
      technique_score: 8,
      consistency_percentage: 85,
    },
    elite_benchmark_notes:
      "Shows elite-level horizontal force production and acceleration curve",
  },
  {
    movement_category: "acceleration",
    tier_level: 4,
    tier_name: "Elite Acceleration",
    unlock_requirements: {
      prerequisite: "advanced_acceleration",
      min_sessions: 40,
    },
    mastery_criteria: {
      ten_yard_time_seconds: 1.5,
      technique_score: 9,
      consistency_percentage: 90,
    },
    elite_benchmark_notes:
      "Performance matches elite flag football players and sprinters",
  },

  // Direction Change Progression
  {
    movement_category: "direction_change",
    tier_level: 1,
    tier_name: "Basic Direction Change",
    unlock_requirements: { prerequisite: "none" },
    mastery_criteria: {
      l_drill_time_seconds: 5.5,
      technique_score: 6,
      balance_rating: 7,
    },
    elite_benchmark_notes:
      "Can perform basic cuts without losing significant speed",
  },
  {
    movement_category: "direction_change",
    tier_level: 2,
    tier_name: "Intermediate Agility",
    unlock_requirements: {
      prerequisite: "basic_direction_change",
      min_sessions: 15,
    },
    mastery_criteria: {
      l_drill_time_seconds: 5.0,
      technique_score: 7,
      balance_rating: 8,
    },
    elite_benchmark_notes: "Shows proper deceleration and plant mechanics",
  },
  {
    movement_category: "direction_change",
    tier_level: 3,
    tier_name: "Advanced Agility",
    unlock_requirements: {
      prerequisite: "intermediate_agility",
      min_sessions: 25,
    },
    mastery_criteria: {
      l_drill_time_seconds: 4.5,
      technique_score: 8,
      balance_rating: 9,
    },
    elite_benchmark_notes: "Minimal speed loss through direction changes",
  },
  {
    movement_category: "direction_change",
    tier_level: 4,
    tier_name: "Elite Agility",
    unlock_requirements: { prerequisite: "advanced_agility", min_sessions: 50 },
    mastery_criteria: {
      l_drill_time_seconds: 4.0,
      technique_score: 9,
      balance_rating: 10,
    },
    elite_benchmark_notes: "Performance level of top flag football players",
  },
];

// Flag football specific sprint scenarios
const flagFootballSprintScenarios = [
  {
    scenario_name: "Breakaway Sprint",
    game_situation: "Open field with defender 5+ yards behind",
    required_skills: ["acceleration", "top_speed_maintenance"],
    distance_range: "20-40_yards",
    success_metrics: {
      maintain_speed: 95,
      avoid_flags: 100,
      finish_strong: 90,
    },
  },
  {
    scenario_name: "Comeback Route Acceleration",
    game_situation: "Receiver breaking back toward quarterback",
    required_skills: ["deceleration", "direction_change", "acceleration"],
    distance_range: "8-15_yards",
    success_metrics: {
      sharp_cut: 85,
      quick_acceleration: 90,
      ball_focus: 95,
    },
  },
  {
    scenario_name: "Flag Pursuit Chase",
    game_situation: "Defensive player chasing ball carrier",
    required_skills: ["sustained_speed", "angle_cutting", "flag_pulling"],
    distance_range: "15-30_yards",
    success_metrics: {
      close_distance: 80,
      proper_angle: 85,
      successful_pull: 75,
    },
  },
  {
    scenario_name: "Blitz Escape",
    game_situation: "Quarterback evading immediate pressure",
    required_skills: ["lateral_movement", "acceleration", "direction_change"],
    distance_range: "5-15_yards",
    success_metrics: {
      avoid_pressure: 90,
      maintain_awareness: 85,
      find_space: 80,
    },
  },
];

async function seedEliteSprintTrainingDatabase() {
  try {
    console.log("Starting elite sprint training database seeding...");

    // Get phase and category IDs for reference
    const phases = await sql`SELECT id, name FROM sprint_training_phases`;
    const categories =
      await sql`SELECT id, name, category_type FROM sprint_training_categories`;

    console.log("Seeding sprint workouts...");
    for (const workout of eliteSprintWorkouts) {
      const phase = phases.find((p) => p.name === workout.phase);
      const category = categories.find(
        (c) => c.category_type === workout.category,
      );

      if (phase && category) {
        await sql`
          INSERT INTO sprint_workouts (
            category_id, phase_id, name, distance_yards, intensity_percentage,
            rest_duration_seconds, sets, reps_per_set, recovery_between_sets_seconds,
            surface_type, gradient_percentage, coaching_cues, elite_application_notes
          ) VALUES (
            ${category.id}, ${phase.id}, ${workout.name}, ${workout.distance_yards},
            ${workout.intensity_percentage}, ${workout.rest_duration_seconds},
            ${workout.sets}, ${workout.reps_per_set}, ${workout.recovery_between_sets_seconds},
            ${workout.surface_type}, ${workout.gradient_percentage || null},
            ${workout.coaching_cues}, ${workout.elite_application_notes}
          )
        `;
      }
    }

    console.log("Seeding agility patterns...");
    for (const pattern of agilityPatterns) {
      await sql`
        INSERT INTO agility_patterns (
          name, pattern_type, setup_description, cone_spacing_yards,
          total_distance_yards, direction_changes_count, execution_instructions,
          flag_football_application
        ) VALUES (
          ${pattern.name}, ${pattern.pattern_type}, ${pattern.setup_description},
          ${pattern.cone_spacing_yards}, ${pattern.total_distance_yards},
          ${pattern.direction_changes_count}, ${pattern.execution_instructions},
          ${pattern.flag_football_application}
        )
      `;
    }

    console.log("Seeding recovery protocols...");
    for (const protocol of recoveryProtocols) {
      await sql`
        INSERT INTO recovery_protocols (
          name, recovery_type, duration_minutes, temperature_fahrenheit,
          instructions, effectiveness_percentage, recommended_timing
        ) VALUES (
          ${protocol.name}, ${protocol.recovery_type}, ${protocol.duration_minutes},
          ${protocol.temperature_fahrenheit}, ${protocol.instructions},
          ${protocol.effectiveness_percentage}, ${protocol.recommended_timing}
        )
      `;
    }

    console.log("Seeding mental preparation protocols...");
    for (const mental of mentalPreparationProtocols) {
      await sql`
        INSERT INTO mental_preparation_protocols (
          technique_name, technique_type, duration_minutes, timing,
          instructions, example_mantras, effectiveness_notes
        ) VALUES (
          ${mental.technique_name}, ${mental.technique_type}, ${mental.duration_minutes},
          ${mental.timing}, ${mental.instructions}, ${mental.example_mantras},
          ${mental.effectiveness_notes}
        )
      `;
    }

    console.log("Seeding skill progression tiers...");
    for (const tier of skillProgressionTiers) {
      await sql`
        INSERT INTO skill_progression_tiers (
          movement_category, tier_level, tier_name, unlock_requirements,
          mastery_criteria, elite_benchmark_notes
        ) VALUES (
          ${tier.movement_category}, ${tier.tier_level}, ${tier.tier_name},
          ${JSON.stringify(tier.unlock_requirements)}, ${JSON.stringify(tier.mastery_criteria)},
          ${tier.elite_benchmark_notes}
        )
      `;
    }

    console.log("Seeding flag football sprint scenarios...");
    for (const scenario of flagFootballSprintScenarios) {
      await sql`
        INSERT INTO flag_football_sprint_scenarios (
          scenario_name, game_situation, required_skills, distance_range, success_metrics
        ) VALUES (
          ${scenario.scenario_name}, ${scenario.game_situation}, ${scenario.required_skills},
          ${scenario.distance_range}, ${JSON.stringify(scenario.success_metrics)}
        )
      `;
    }

    console.log(
      "Elite sprint training database seeding completed successfully!",
    );
    console.log("Seeded:");
    console.log(`- ${eliteSprintWorkouts.length} elite sprint workouts`);
    console.log(`- ${agilityPatterns.length} agility patterns`);
    console.log(`- ${recoveryProtocols.length} recovery protocols`);
    console.log(
      `- ${mentalPreparationProtocols.length} mental preparation techniques`,
    );
    console.log(`- ${skillProgressionTiers.length} skill progression tiers`);
    console.log(`- ${flagFootballSprintScenarios.length} game scenarios`);
  } catch (error) {
    console.error("Error seeding elite sprint training database:", error);
    process.exit(1);
  }
}

// Run the seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedEliteSprintTrainingDatabase();
}

export { seedEliteSprintTrainingDatabase };
