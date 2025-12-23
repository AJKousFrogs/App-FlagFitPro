// Complete Flag Football Player System Seeder
// Based on comprehensive research of elite player profiles and development methods

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

const sql = neon(process.env.DATABASE_URL);

// Player archetypes based on research
const playerArchetypes = [
  {
    archetype_name: "Elite Speed Demon",
    description:
      "Pure speed-based player with exceptional acceleration and top-end speed. Ideal for deep routes and breakaway plays.",
    speed_rating_min: 9,
    speed_rating_max: 10,
    agility_rating_min: 7,
    agility_rating_max: 9,
    power_rating_min: 7,
    power_rating_max: 9,
    ideal_sports_backgrounds: ["track_field", "soccer", "basketball"],
    secondary_sports_backgrounds: ["rugby_sevens", "tennis"],
    position_suitability: {
      quarterback: 6,
      receiver: 10,
      running_back: 9,
      defensive_back: 8,
      rusher: 7,
    },
    ten_yard_sprint_target: 1.45,
    forty_yard_sprint_target: 4.25,
    l_drill_target: 6.3,
    vertical_jump_target: 36,
    broad_jump_target: 118,
  },
  {
    archetype_name: "Complete Athlete",
    description:
      "Well-rounded player with excellent balance of speed, agility, power, and technical skills. The ideal flag football player.",
    speed_rating_min: 8,
    speed_rating_max: 9,
    agility_rating_min: 8,
    agility_rating_max: 10,
    power_rating_min: 8,
    power_rating_max: 9,
    ideal_sports_backgrounds: ["soccer", "basketball", "rugby_sevens"],
    secondary_sports_backgrounds: ["track_field", "martial_arts", "tennis"],
    position_suitability: {
      quarterback: 9,
      receiver: 9,
      running_back: 10,
      defensive_back: 9,
      rusher: 8,
    },
    ten_yard_sprint_target: 1.5,
    forty_yard_sprint_target: 4.3,
    l_drill_target: 6.0,
    vertical_jump_target: 34,
    broad_jump_target: 115,
  },
  {
    archetype_name: "Technical Specialist",
    description:
      "Player with exceptional route running, catching, and field awareness. May not have elite speed but compensates with skill.",
    speed_rating_min: 6,
    speed_rating_max: 8,
    agility_rating_min: 8,
    agility_rating_max: 10,
    power_rating_min: 6,
    power_rating_max: 8,
    ideal_sports_backgrounds: ["soccer", "basketball", "tennis"],
    secondary_sports_backgrounds: ["martial_arts", "gymnastics", "volleyball"],
    position_suitability: {
      quarterback: 10,
      receiver: 8,
      running_back: 7,
      defensive_back: 8,
      rusher: 6,
    },
    ten_yard_sprint_target: 1.6,
    forty_yard_sprint_target: 4.4,
    l_drill_target: 5.8,
    vertical_jump_target: 30,
    broad_jump_target: 110,
  },
  {
    archetype_name: "Power Rusher",
    description:
      "Explosive, powerful athlete focused on quarterback pressure and flag pulling. Strong acceleration and pursuit skills.",
    speed_rating_min: 7,
    speed_rating_max: 9,
    agility_rating_min: 7,
    agility_rating_max: 8,
    power_rating_min: 9,
    power_rating_max: 10,
    ideal_sports_backgrounds: [
      "track_field",
      "rugby_sevens",
      "american_football",
    ],
    secondary_sports_backgrounds: ["wrestling", "martial_arts", "basketball"],
    position_suitability: {
      quarterback: 5,
      receiver: 6,
      running_back: 7,
      defensive_back: 7,
      rusher: 10,
    },
    ten_yard_sprint_target: 1.55,
    forty_yard_sprint_target: 4.35,
    l_drill_target: 6.5,
    vertical_jump_target: 38,
    broad_jump_target: 120,
  },
  {
    archetype_name: "Defensive Specialist",
    description:
      "Elite defensive player with exceptional reaction time, backpedaling ability, and flag pulling technique.",
    speed_rating_min: 8,
    speed_rating_max: 9,
    agility_rating_min: 9,
    agility_rating_max: 10,
    power_rating_min: 7,
    power_rating_max: 8,
    ideal_sports_backgrounds: ["soccer", "basketball", "tennis"],
    secondary_sports_backgrounds: ["martial_arts", "volleyball", "track_field"],
    position_suitability: {
      quarterback: 6,
      receiver: 7,
      running_back: 6,
      defensive_back: 10,
      rusher: 8,
    },
    ten_yard_sprint_target: 1.5,
    forty_yard_sprint_target: 4.3,
    l_drill_target: 5.9,
    vertical_jump_target: 32,
    broad_jump_target: 112,
  },
];

// Position requirements based on research
const positionRequirements = [
  {
    position_name: "quarterback",
    speed_importance: 7,
    acceleration_importance: 8,
    agility_importance: 8,
    power_importance: 6,
    endurance_importance: 7,
    route_running_importance: 5,
    catching_importance: 6,
    evasion_importance: 8,
    flag_pulling_importance: 3,
    decision_making_importance: 10,
    reaction_time_importance: 9,
    field_vision_importance: 10,
    leadership_importance: 10,
    key_techniques: [
      "pocket_mobility",
      "quick_release",
      "accuracy_under_pressure",
      "scrambling",
    ],
    common_training_focus: [
      "decision_making_drills",
      "mobility_training",
      "accuracy_drills",
      "leadership_development",
    ],
    elite_benchmarks: {
      ten_yard_sprint: 1.55,
      decision_making_speed: 0.8,
      accuracy_percentage: 85,
      mobility_rating: 8,
    },
  },
  {
    position_name: "receiver",
    speed_importance: 10,
    acceleration_importance: 10,
    agility_importance: 9,
    power_importance: 7,
    endurance_importance: 8,
    route_running_importance: 10,
    catching_importance: 10,
    evasion_importance: 9,
    flag_pulling_importance: 2,
    decision_making_importance: 8,
    reaction_time_importance: 8,
    field_vision_importance: 8,
    leadership_importance: 6,
    key_techniques: [
      "route_running_precision",
      "catching_in_traffic",
      "release_techniques",
      "after_catch_moves",
    ],
    common_training_focus: [
      "route_running_drills",
      "catching_drills",
      "speed_training",
      "evasion_techniques",
    ],
    elite_benchmarks: {
      ten_yard_sprint: 1.45,
      route_running_precision: 9,
      catching_percentage: 90,
      separation_ability: 9,
    },
  },
  {
    position_name: "running_back",
    speed_importance: 9,
    acceleration_importance: 10,
    agility_importance: 10,
    power_importance: 8,
    endurance_importance: 9,
    route_running_importance: 7,
    catching_importance: 8,
    evasion_importance: 10,
    flag_pulling_importance: 2,
    decision_making_importance: 9,
    reaction_time_importance: 9,
    field_vision_importance: 10,
    leadership_importance: 6,
    key_techniques: [
      "vision_and_cutting",
      "evasion_moves",
      "acceleration_through_gaps",
      "receiving_out_of_backfield",
    ],
    common_training_focus: [
      "agility_training",
      "vision_drills",
      "evasion_techniques",
      "acceleration_training",
    ],
    elite_benchmarks: {
      ten_yard_sprint: 1.48,
      l_drill: 5.8,
      evasion_rating: 9,
      field_vision: 9,
    },
  },
  {
    position_name: "defensive_back",
    speed_importance: 9,
    acceleration_importance: 9,
    agility_importance: 10,
    power_importance: 6,
    endurance_importance: 9,
    route_running_importance: 6,
    catching_importance: 8,
    evasion_importance: 6,
    flag_pulling_importance: 10,
    decision_making_importance: 9,
    reaction_time_importance: 10,
    field_vision_importance: 9,
    leadership_importance: 7,
    key_techniques: [
      "backpedaling",
      "flag_pulling_technique",
      "route_recognition",
      "break_on_ball",
    ],
    common_training_focus: [
      "reaction_training",
      "backpedal_drills",
      "flag_pulling_practice",
      "coverage_techniques",
    ],
    elite_benchmarks: {
      reaction_time: 0.15,
      backpedal_speed: 1.8,
      flag_pulling_success: 85,
      coverage_rating: 9,
    },
  },
  {
    position_name: "rusher",
    speed_importance: 8,
    acceleration_importance: 10,
    agility_importance: 7,
    power_importance: 10,
    endurance_importance: 7,
    route_running_importance: 3,
    catching_importance: 4,
    evasion_importance: 6,
    flag_pulling_importance: 8,
    decision_making_importance: 7,
    reaction_time_importance: 9,
    field_vision_importance: 7,
    leadership_importance: 6,
    key_techniques: [
      "pass_rush_moves",
      "pursuit_angles",
      "acceleration_off_line",
      "controlled_approach",
    ],
    common_training_focus: [
      "explosion_training",
      "pass_rush_techniques",
      "pursuit_drills",
      "power_development",
    ],
    elite_benchmarks: {
      ten_yard_sprint: 1.52,
      first_step_quickness: 9,
      pursuit_angle_efficiency: 8,
      power_rating: 9,
    },
  },
];

// Sports crossover analysis based on research
const sportsCrossoverAnalysis = [
  {
    source_sport: "soccer",
    overall_transfer_rating: 10,
    speed_transfer: 0.85,
    agility_transfer: 0.95,
    technical_transfer: 0.8,
    tactical_transfer: 0.9,
    transferable_skills: [
      "directional_changes",
      "field_vision",
      "teamwork",
      "cardiovascular_conditioning",
      "spatial_awareness",
    ],
    skills_requiring_development: [
      "catching_technique",
      "american_football_strategy",
      "upper_body_strength",
    ],
    optimal_positions: ["running_back", "defensive_back", "receiver"],
    secondary_positions: ["quarterback"],
    recommended_training_emphasis: [
      "catching_drills",
      "route_running",
      "american_football_tactics",
    ],
    common_weaknesses_to_address: [
      "upper_body_catching_mechanics",
      "flag_football_specific_rules",
    ],
    research_evidence:
      "Highest transfer rate according to professional athlete endorsements",
    professional_examples: [
      "Abby Wambach",
      "Christian Pulisic (youth flag football)",
    ],
  },
  {
    source_sport: "track_field",
    overall_transfer_rating: 9,
    speed_transfer: 0.95,
    agility_transfer: 0.7,
    technical_transfer: 0.6,
    tactical_transfer: 0.5,
    transferable_skills: [
      "speed_development",
      "explosive_power",
      "biomechanical_efficiency",
      "cardiovascular_conditioning",
    ],
    skills_requiring_development: [
      "directional_changes",
      "catching_technique",
      "game_strategy",
      "team_coordination",
    ],
    optimal_positions: ["receiver", "running_back", "rusher"],
    secondary_positions: ["defensive_back"],
    recommended_training_emphasis: [
      "agility_training",
      "catching_drills",
      "tactical_awareness",
      "multi_directional_movement",
    ],
    common_weaknesses_to_address: [
      "lateral_movement",
      "game_sense",
      "ball_handling_skills",
    ],
    research_evidence:
      "Superior speed and power development from sprint training",
    professional_examples: ["Multiple NFL players with track backgrounds"],
  },
  {
    source_sport: "basketball",
    overall_transfer_rating: 9,
    speed_transfer: 0.75,
    agility_transfer: 0.9,
    technical_transfer: 0.85,
    tactical_transfer: 0.85,
    transferable_skills: [
      "quick_footwork",
      "hand_eye_coordination",
      "spatial_awareness",
      "pick_and_roll_concepts",
      "court_vision",
    ],
    skills_requiring_development: [
      "linear_speed",
      "route_running_precision",
      "flag_pulling_technique",
    ],
    optimal_positions: ["quarterback", "receiver", "defensive_back"],
    secondary_positions: ["running_back"],
    recommended_training_emphasis: [
      "linear_speed_training",
      "route_running_drills",
      "flag_football_specific_techniques",
    ],
    common_weaknesses_to_address: [
      "straight_line_speed",
      "flag_football_rules_and_strategy",
    ],
    research_evidence:
      "Excellent transfer of court movement and ball handling skills",
    professional_examples: [
      "Multiple NBA players in celebrity flag football games",
    ],
  },
  {
    source_sport: "rugby_sevens",
    overall_transfer_rating: 8,
    speed_transfer: 0.8,
    agility_transfer: 0.85,
    technical_transfer: 0.75,
    tactical_transfer: 0.7,
    transferable_skills: [
      "evasion_skills",
      "balance_and_body_control",
      "open_space_navigation",
      "contact_avoidance",
    ],
    skills_requiring_development: [
      "catching_technique",
      "route_running_precision",
      "flag_football_strategy",
    ],
    optimal_positions: ["running_back", "receiver", "defensive_back"],
    secondary_positions: ["rusher"],
    recommended_training_emphasis: [
      "catching_drills",
      "route_running",
      "flag_football_tactics",
      "precision_movement",
    ],
    common_weaknesses_to_address: [
      "american_football_specific_skills",
      "structured_play_concepts",
    ],
    research_evidence:
      "Excellent evasion skills and open-field running ability",
    professional_examples: [
      "Rugby sevens players transitioning to American football",
    ],
  },
  {
    source_sport: "tennis",
    overall_transfer_rating: 7,
    speed_transfer: 0.7,
    agility_transfer: 0.85,
    technical_transfer: 0.6,
    tactical_transfer: 0.65,
    transferable_skills: [
      "reaction_time",
      "hand_eye_coordination",
      "lateral_movement",
      "anticipation_skills",
    ],
    skills_requiring_development: [
      "linear_speed",
      "team_coordination",
      "flag_football_specific_techniques",
    ],
    optimal_positions: ["defensive_back", "quarterback"],
    secondary_positions: ["receiver"],
    recommended_training_emphasis: [
      "speed_training",
      "team_tactics",
      "catching_drills",
      "linear_movement",
    ],
    common_weaknesses_to_address: [
      "straight_line_speed",
      "team_sport_concepts",
    ],
    research_evidence: "Superior reaction time and lateral movement abilities",
    professional_examples: ["Tennis players in multi-sport training programs"],
  },
  {
    source_sport: "martial_arts",
    overall_transfer_rating: 7,
    speed_transfer: 0.65,
    agility_transfer: 0.85,
    technical_transfer: 0.7,
    tactical_transfer: 0.6,
    transferable_skills: [
      "balance_and_coordination",
      "body_control",
      "reaction_training",
      "single_leg_strength",
    ],
    skills_requiring_development: [
      "linear_speed",
      "catching_technique",
      "team_coordination",
    ],
    optimal_positions: ["defensive_back", "running_back"],
    secondary_positions: ["receiver"],
    recommended_training_emphasis: [
      "speed_development",
      "catching_drills",
      "team_tactics",
    ],
    common_weaknesses_to_address: [
      "team_sport_dynamics",
      "linear_speed_development",
    ],
    research_evidence: "Excellent balance and body awareness for evasion",
    professional_examples: ["MMA fighters in athletic training programs"],
  },
];

// Physical assessment protocols based on research
const physicalAssessmentProtocols = [
  {
    test_name: "10_yard_sprint",
    test_category: "speed",
    test_description:
      "Acceleration test measuring time to cover 10 yards from standing start",
    equipment_needed: ["stopwatch", "cones", "measuring_tape"],
    setup_instructions:
      "Place cones at start line and 10-yard mark. Use electronic timing if available.",
    execution_steps: [
      "Athlete starts in 3-point stance",
      "On command, sprint to 10-yard cone",
      "Record time to nearest 0.01 seconds",
    ],
    safety_considerations: [
      "Proper warm-up required",
      "Clear running lane",
      "Safe stopping distance",
    ],
    measurement_unit: "seconds",
    elite_male_benchmark: 1.45,
    elite_female_benchmark: 1.55,
    good_male_benchmark: 1.55,
    good_female_benchmark: 1.65,
    average_male_benchmark: 1.7,
    average_female_benchmark: 1.8,
    test_retest_reliability: 0.95,
    validity_research:
      "High correlation with game performance acceleration needs",
    youth_modifications: {
      under_12: "Use 3-point start, focus on technique over time",
      under_16: "Standard protocol with technique coaching",
    },
  },
  {
    test_name: "l_drill",
    test_category: "agility",
    test_description:
      "Agility test measuring ability to change directions quickly",
    equipment_needed: ["cones", "stopwatch", "measuring_tape"],
    setup_instructions:
      "Set up L-shaped pattern: 5 yards forward, 5 yards right, 5 yards back, 5 yards right to finish",
    execution_steps: [
      "Start in athletic stance",
      "Sprint forward 5 yards",
      "Plant and cut right 5 yards",
      "Plant and cut back 10 yards",
      "Plant and cut right 5 yards to finish",
    ],
    safety_considerations: [
      "Proper warm-up essential",
      "Good surface traction",
      "Proper cutting technique",
    ],
    measurement_unit: "seconds",
    elite_male_benchmark: 5.8,
    elite_female_benchmark: 6.2,
    good_male_benchmark: 6.2,
    good_female_benchmark: 6.6,
    average_male_benchmark: 6.8,
    average_female_benchmark: 7.2,
    test_retest_reliability: 0.92,
    validity_research:
      "Strong predictor of agility performance in game situations",
    youth_modifications: {
      under_12: "Reduce cone spacing to 3 yards",
      under_16: "Standard spacing with technique emphasis",
    },
  },
  {
    test_name: "vertical_jump",
    test_category: "power",
    test_description: "Power test measuring vertical jumping ability",
    equipment_needed: ["measuring_device", "chalk_or_marker"],
    setup_instructions: "Use vertec, jump mat, or wall measurement system",
    execution_steps: [
      "Record standing reach height",
      "Perform countermovement jump",
      "Record maximum jump height",
      "Calculate difference",
    ],
    safety_considerations: [
      "Proper landing technique",
      "Adequate ceiling height",
      "Safe landing surface",
    ],
    measurement_unit: "inches",
    elite_male_benchmark: 36.0,
    elite_female_benchmark: 28.0,
    good_male_benchmark: 32.0,
    good_female_benchmark: 24.0,
    average_male_benchmark: 28.0,
    average_female_benchmark: 20.0,
    test_retest_reliability: 0.94,
    validity_research: "Good predictor of explosive power and jumping ability",
    youth_modifications: {
      under_12: "Focus on technique, record height for progression tracking",
      under_16: "Standard protocol",
    },
  },
  {
    test_name: "20_yard_shuttle",
    test_category: "agility",
    test_description: "Multi-directional agility test",
    equipment_needed: ["cones", "stopwatch", "measuring_tape"],
    setup_instructions: "Place cones 5 yards apart, start in middle",
    execution_steps: [
      "Start straddling middle line",
      "Run 5 yards right, touch line",
      "Run 10 yards left, touch line",
      "Run 5 yards right through finish",
    ],
    safety_considerations: [
      "Proper warm-up",
      "Good surface conditions",
      "Clear running lanes",
    ],
    measurement_unit: "seconds",
    elite_male_benchmark: 3.8,
    elite_female_benchmark: 4.2,
    good_male_benchmark: 4.1,
    good_female_benchmark: 4.5,
    average_male_benchmark: 4.4,
    average_female_benchmark: 4.8,
    test_retest_reliability: 0.91,
    validity_research: "Excellent predictor of multi-directional speed",
    youth_modifications: {
      under_12: "Reduce distance to 3 yards each direction",
      under_16: "Standard protocol",
    },
  },
];

// Technical skill assessments
const technicalSkillAssessments = [
  {
    skill_name: "route_running_precision",
    skill_category: "route_running",
    assessment_description:
      "Evaluate precision and technique in executing various route patterns",
    setup_requirements: "Cones to mark route patterns, quarterback for timing",
    evaluation_criteria: [
      "Route depth accuracy",
      "Break sharpness",
      "Speed maintenance",
      "Separation creation",
    ],
    scoring_rubric: {
      10: "Perfect route execution with elite separation and timing",
      9: "Excellent technique with minor imperfections",
      8: "Very good execution with good separation",
      7: "Good technique with adequate separation",
      6: "Average execution with some separation",
      5: "Below average with minimal separation",
      4: "Poor technique with little separation",
      3: "Very poor execution",
      2: "Fundamentally flawed technique",
      1: "Cannot execute basic routes",
    },
    position_relevance: {
      quarterback: 5,
      receiver: 10,
      running_back: 7,
      defensive_back: 6,
      rusher: 3,
    },
    recommended_drills: [
      "cone_route_drills",
      "route_tree_progression",
      "timing_routes_with_qb",
    ],
    video_analysis_points: [
      "Break technique",
      "Speed transition",
      "Body positioning",
      "Separation distance",
    ],
  },
  {
    skill_name: "evasion_effectiveness",
    skill_category: "evasion",
    assessment_description:
      "Measure ability to evade defenders using various techniques",
    setup_requirements: "Defenders or cones, open space, flags",
    evaluation_criteria: [
      "Move variety",
      "Success rate",
      "Speed maintenance",
      "Balance control",
    ],
    scoring_rubric: {
      10: "Elite evasion with multiple successful moves and speed maintenance",
      9: "Excellent evasion skills with high success rate",
      8: "Very good evasion with good move variety",
      7: "Good evasion skills with adequate success",
      6: "Average evasion with basic moves",
      5: "Below average with limited success",
      4: "Poor evasion skills",
      3: "Very poor with minimal success",
      2: "Fundamentally poor technique",
      1: "Cannot execute basic evasion moves",
    },
    position_relevance: {
      quarterback: 8,
      receiver: 9,
      running_back: 10,
      defensive_back: 6,
      rusher: 5,
    },
    recommended_drills: [
      "cone_weave_evasion",
      "one_on_one_drills",
      "mirror_drills",
    ],
    video_analysis_points: [
      "Hip movement",
      "Shoulder position",
      "Foot placement",
      "Balance maintenance",
    ],
  },
  {
    skill_name: "catching_under_pressure",
    skill_category: "catching",
    assessment_description:
      "Evaluate catching ability with defenders applying pressure",
    setup_requirements:
      "Footballs, defenders or pressure simulation, various angles",
    evaluation_criteria: [
      "Catch success rate",
      "Ball security",
      "Focus under pressure",
      "Body positioning",
    ],
    scoring_rubric: {
      10: "Perfect catches under all pressure situations",
      9: "Excellent catching with minimal drops under pressure",
      8: "Very good catching with occasional difficulty",
      7: "Good catching with some pressure issues",
      6: "Average catching with pressure affecting performance",
      5: "Below average with frequent pressure drops",
      4: "Poor catching under pressure",
      3: "Very poor with most pressure situations failed",
      2: "Fundamentally poor technique",
      1: "Cannot catch under any pressure",
    },
    position_relevance: {
      quarterback: 6,
      receiver: 10,
      running_back: 8,
      defensive_back: 7,
      rusher: 4,
    },
    recommended_drills: [
      "pressure_catching_drills",
      "distraction_drills",
      "contested_catch_drills",
    ],
    video_analysis_points: [
      "Hand position",
      "Eye tracking",
      "Body control",
      "Follow through",
    ],
  },
];

async function seedCompletePlayerSystem() {
  try {
    console.log("🏈 Starting complete flag football player system seeding...");

    // Seed player archetypes
    console.log("👤 Seeding player archetypes...");
    for (const archetype of playerArchetypes) {
      await sql`
        INSERT INTO player_archetypes (
          archetype_name, description, speed_rating_min, speed_rating_max,
          agility_rating_min, agility_rating_max, power_rating_min, power_rating_max,
          ideal_sports_backgrounds, secondary_sports_backgrounds, position_suitability,
          ten_yard_sprint_target, forty_yard_sprint_target, l_drill_target,
          vertical_jump_target, broad_jump_target
        ) VALUES (
          ${archetype.archetype_name}, ${archetype.description},
          ${archetype.speed_rating_min}, ${archetype.speed_rating_max},
          ${archetype.agility_rating_min}, ${archetype.agility_rating_max},
          ${archetype.power_rating_min}, ${archetype.power_rating_max},
          ${archetype.ideal_sports_backgrounds}, ${archetype.secondary_sports_backgrounds},
          ${JSON.stringify(archetype.position_suitability)},
          ${archetype.ten_yard_sprint_target}, ${archetype.forty_yard_sprint_target},
          ${archetype.l_drill_target}, ${archetype.vertical_jump_target}, ${archetype.broad_jump_target}
        ) ON CONFLICT DO NOTHING
      `;
    }

    // Seed position requirements
    console.log("📍 Seeding position requirements...");
    for (const position of positionRequirements) {
      await sql`
        INSERT INTO position_requirements (
          position_name, speed_importance, acceleration_importance, agility_importance,
          power_importance, endurance_importance, route_running_importance,
          catching_importance, evasion_importance, flag_pulling_importance,
          decision_making_importance, reaction_time_importance, field_vision_importance,
          leadership_importance, key_techniques, common_training_focus, elite_benchmarks
        ) VALUES (
          ${position.position_name}, ${position.speed_importance}, ${position.acceleration_importance},
          ${position.agility_importance}, ${position.power_importance}, ${position.endurance_importance},
          ${position.route_running_importance}, ${position.catching_importance}, ${position.evasion_importance},
          ${position.flag_pulling_importance}, ${position.decision_making_importance},
          ${position.reaction_time_importance}, ${position.field_vision_importance},
          ${position.leadership_importance}, ${position.key_techniques},
          ${position.common_training_focus}, ${JSON.stringify(position.elite_benchmarks)}
        ) ON CONFLICT DO NOTHING
      `;
    }

    // Seed sports crossover analysis
    console.log("🏃‍♂️ Seeding sports crossover analysis...");
    for (const sport of sportsCrossoverAnalysis) {
      await sql`
        INSERT INTO sports_crossover_analysis (
          source_sport, overall_transfer_rating, speed_transfer, agility_transfer,
          technical_transfer, tactical_transfer, transferable_skills,
          skills_requiring_development, optimal_positions, secondary_positions,
          recommended_training_emphasis, common_weaknesses_to_address,
          research_evidence, professional_examples
        ) VALUES (
          ${sport.source_sport}, ${sport.overall_transfer_rating},
          ${sport.speed_transfer}, ${sport.agility_transfer},
          ${sport.technical_transfer}, ${sport.tactical_transfer},
          ${sport.transferable_skills}, ${sport.skills_requiring_development},
          ${sport.optimal_positions}, ${sport.secondary_positions},
          ${sport.recommended_training_emphasis}, ${sport.common_weaknesses_to_address},
          ${sport.research_evidence}, ${sport.professional_examples}
        ) ON CONFLICT DO NOTHING
      `;
    }

    // Seed physical assessment protocols
    console.log("📊 Seeding physical assessment protocols...");
    for (const protocol of physicalAssessmentProtocols) {
      await sql`
        INSERT INTO physical_assessment_protocols (
          test_name, test_category, test_description, equipment_needed,
          setup_instructions, execution_steps, safety_considerations,
          measurement_unit, elite_male_benchmark, elite_female_benchmark,
          good_male_benchmark, good_female_benchmark, average_male_benchmark,
          average_female_benchmark, test_retest_reliability, validity_research,
          youth_modifications
        ) VALUES (
          ${protocol.test_name}, ${protocol.test_category}, ${protocol.test_description},
          ${protocol.equipment_needed}, ${protocol.setup_instructions},
          ${protocol.execution_steps}, ${protocol.safety_considerations},
          ${protocol.measurement_unit}, ${protocol.elite_male_benchmark},
          ${protocol.elite_female_benchmark}, ${protocol.good_male_benchmark},
          ${protocol.good_female_benchmark}, ${protocol.average_male_benchmark},
          ${protocol.average_female_benchmark}, ${protocol.test_retest_reliability},
          ${protocol.validity_research}, ${JSON.stringify(protocol.youth_modifications)}
        ) ON CONFLICT DO NOTHING
      `;
    }

    // Seed technical skill assessments
    console.log("⚡ Seeding technical skill assessments...");
    for (const skill of technicalSkillAssessments) {
      await sql`
        INSERT INTO technical_skill_assessments (
          skill_name, skill_category, assessment_description, setup_requirements,
          evaluation_criteria, scoring_rubric, position_relevance,
          recommended_drills, video_analysis_points
        ) VALUES (
          ${skill.skill_name}, ${skill.skill_category}, ${skill.assessment_description},
          ${skill.setup_requirements}, ${skill.evaluation_criteria},
          ${JSON.stringify(skill.scoring_rubric)}, ${JSON.stringify(skill.position_relevance)},
          ${skill.recommended_drills}, ${skill.video_analysis_points}
        ) ON CONFLICT DO NOTHING
      `;
    }

    console.log(
      "✅ Complete flag football player system seeding completed successfully!",
    );

    // Generate summary
    const archetypeCount =
      await sql`SELECT COUNT(*) as count FROM player_archetypes`;
    const positionCount =
      await sql`SELECT COUNT(*) as count FROM position_requirements`;
    const sportsCount =
      await sql`SELECT COUNT(*) as count FROM sports_crossover_analysis`;
    const physicalTestCount =
      await sql`SELECT COUNT(*) as count FROM physical_assessment_protocols`;
    const technicalTestCount =
      await sql`SELECT COUNT(*) as count FROM technical_skill_assessments`;

    console.log("📊 Seeding Summary:");
    console.log(`   Player Archetypes: ${archetypeCount[0].count}`);
    console.log(`   Position Requirements: ${positionCount[0].count}`);
    console.log(`   Sports Crossover Analysis: ${sportsCount[0].count}`);
    console.log(
      `   Physical Assessment Protocols: ${physicalTestCount[0].count}`,
    );
    console.log(
      `   Technical Skill Assessments: ${technicalTestCount[0].count}`,
    );
  } catch (error) {
    console.error("❌ Error seeding complete player system:", error);
    process.exit(1);
  }
}

// Run the seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedCompletePlayerSystem();
}

export { seedCompletePlayerSystem };
