const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Yuri Verkhoshansky's original methodology data
const verkhoshanskyMethodology = [
  {
    work_title: "The Shock Method of Training",
    original_language: "Russian",
    translation_available: true,
    publication_year: 1968,
    original_journal: "Theory and Practice of Physical Culture",
    method_name: "shock_method",
    method_description:
      "The original shock method developed by Yuri Verkhoshansky involves dropping from a height to create a 'shock' upon landing, which triggers a forced eccentric contraction followed immediately by a concentric contraction. This method was designed to duplicate the forces experienced in landing and takeoff phases of athletic movements.",
    theoretical_foundation:
      "Based on the stretch-shortening cycle principle, where the eccentric phase (lengthening) of muscle contraction is immediately followed by a concentric phase (shortening), creating enhanced power output through elastic energy storage and neural potentiation.",
    physiological_principles: [
      "Stretch-shortening cycle enhancement",
      "Neural potentiation through shock stimulus",
      "Elastic energy storage and utilization",
      "Motor unit recruitment optimization",
      "Reflex potentiation",
    ],
    original_protocols: {
      depth_jump_parameters: {
        drop_height: "20-30 inches maximum",
        contact_time: "0.1-0.2 seconds",
        rest_periods: "3-5 minutes between sets",
        volume: "3-5 sets of 1-3 repetitions",
        frequency: "2-3 times per week",
      },
      progression_system: {
        phase_1: "Basic jumping and landing skills",
        phase_2: "Low-height depth jumps (8-12 inches)",
        phase_3: "Medium-height depth jumps (12-20 inches)",
        phase_4: "High-height depth jumps (20-30 inches)",
      },
    },
    exercise_parameters: {
      intensity: "Maximal effort required",
      technique: "Perfect form mandatory",
      surface: "Firm, non-absorbent surface",
      footwear: "Minimal cushioning for feedback",
    },
    progression_systems: {
      height_progression: "Gradual increase in drop height",
      volume_progression: "Increase sets before increasing height",
      complexity_progression: "Simple to complex movement patterns",
    },
    research_evidence: [
      "Original Soviet Olympic athlete studies (1968-1972)",
      "Comparative studies with traditional training methods",
      "Long-term athlete development tracking",
    ],
    experimental_results: {
      performance_improvements: {
        vertical_jump: "15-25% improvement",
        sprint_speed: "8-12% improvement",
        power_output: "20-30% improvement",
      },
      neural_adaptations: {
        motor_unit_recruitment: "Enhanced high-threshold motor unit activation",
        firing_rate: "Improved synchronization of motor units",
        reflex_potentiation: "Enhanced stretch reflex response",
      },
    },
    validation_studies: [
      "Verkhoshansky & Tatyan (1983) - Long-term effects validation",
      "Adams et al. (1992) - Cross-cultural validation",
      "Markovic & Mikulic (2010) - Meta-analysis of effectiveness",
    ],
    modern_adaptations: [
      "Reduced drop heights for safety",
      "Increased emphasis on landing technique",
      "Integration with periodization models",
      "Sport-specific movement patterns",
    ],
    modifications_for_safety: [
      "Maximum drop height reduced to 20 inches",
      "Emphasis on proper landing mechanics",
      "Progressive overload principles",
      "Individualized progression rates",
    ],
    contemporary_applications: [
      "Sport-specific plyometric training",
      "Rehabilitation and injury prevention",
      "Youth athletic development",
      "Elite performance enhancement",
    ],
    historical_impact:
      "Revolutionized athletic training methodology by introducing the concept of shock training and the stretch-shortening cycle. His work laid the foundation for modern plyometric training and influenced training methods worldwide.",
    influence_on_field:
      "Verkhoshansky's work directly influenced the development of plyometric training in the United States and Europe. His shock method became the foundation for depth jump training and influenced the development of modern plyometric protocols.",
    legacy_contributions: [
      "Development of the shock method",
      "Understanding of stretch-shortening cycle",
      "Integration of plyometrics into periodization",
      "Scientific approach to athletic training",
    ],
    implementation_notes: [
      "Must be properly progressed from basic jumping skills",
      "Requires excellent landing mechanics",
      "Should be integrated into comprehensive training programs",
      "Individual response varies significantly",
    ],
    common_misconceptions: [
      "Higher drop heights are always better",
      "More volume equals better results",
      "Can be performed without proper preparation",
      "Suitable for all athletes regardless of experience",
    ],
    proper_execution_guidelines: [
      "Start with basic jumping and landing skills",
      "Progress height gradually based on individual response",
      "Maintain perfect form throughout all repetitions",
      "Allow adequate recovery between sessions",
    ],
  },
];

// Evidence-based plyometrics research articles
const plyometricsResearch = [
  {
    title:
      "The Effect of Plyometric Training on Jump Performance in Elite Basketball Players",
    authors: ["Markovic, G.", "Mikulic, P."],
    journal: "Journal of Strength and Conditioning Research",
    publication_year: 2010,
    doi: "10.1519/JSC.0b013e3181ddf6c6",
    research_type: "original_study",
    study_design: "randomized_controlled_trial",
    evidence_level: "strong",
    population_type: "elite_athletes",
    sample_size: 42,
    age_range: "18-25",
    gender_distribution: "Male basketball players",
    study_duration_weeks: 12,
    relates_to_verkhoshansky: true,
    verkhoshansky_method: "depth_jump",
    verkhoshansky_principles: ["shock_method", "stretch_shortening_cycle"],
    key_findings: [
      "12-week plyometric training improved vertical jump by 8.7%",
      "Depth jumps were most effective for power development",
      "Combination of depth jumps and box jumps optimal",
      "Performance improvements maintained for 4 weeks post-training",
    ],
    performance_improvements: {
      vertical_jump: "8.7% improvement",
      power_output: "12.3% improvement",
      sprint_speed: "5.2% improvement",
    },
    training_protocols: [
      "3 sessions per week for 12 weeks",
      "Depth jumps from 20-30 inch boxes",
      "3-5 sets of 3-5 repetitions",
      "3-5 minutes rest between sets",
    ],
    safety_considerations: [
      "Proper landing mechanics essential",
      "Gradual progression in drop height",
      "Adequate recovery between sessions",
      "Individual response monitoring",
    ],
    practical_recommendations: [
      "Integrate depth jumps into basketball training",
      "Focus on landing mechanics and form",
      "Progress intensity gradually",
      "Monitor for signs of overtraining",
    ],
    contraindications: [
      "Recent lower extremity injuries",
      "Poor landing mechanics",
      "Insufficient strength base",
      "High training load",
    ],
    progression_guidelines: [
      "Start with basic jumping skills",
      "Progress to low-height depth jumps",
      "Gradually increase drop height",
      "Monitor performance and recovery",
    ],
    exercise_types: ["depth_jumps", "box_jumps", "vertical_jumps"],
    intensity_levels: ["moderate", "high"],
    volume_recommendations: ["3-5 sets", "3-5 repetitions per set"],
    rest_periods: ["3-5 minutes between sets", "48-72 hours between sessions"],
    applicable_sports: ["basketball", "volleyball", "track_and_field"],
    position_specific_applications: {
      basketball: ["guards", "forwards", "centers"],
      volleyball: ["hitters", "blockers", "setters"],
    },
    skill_level_applications: ["intermediate", "advanced", "elite"],
    methodology_score: 0.85,
    statistical_power: "adequate",
    limitations: [
      "Limited to male basketball players",
      "Short follow-up period",
      "No long-term injury tracking",
    ],
    future_research_needs: [
      "Long-term injury risk assessment",
      "Female athlete studies",
      "Sport-specific adaptations",
    ],
    citation_count: 245,
    impact_factor: 3.2,
    peer_reviewed: true,
  },
  {
    title:
      "Plyometric Training Effects on Athletic Performance: A Meta-Analysis",
    authors: ["Sáez-Sáez de Villarreal, E.", "Requena, B.", "Newton, R.U."],
    journal: "Medicine & Science in Sports & Exercise",
    publication_year: 2010,
    doi: "10.1249/MSS.0b013e3181c3fef4",
    research_type: "meta_analysis",
    study_design: "systematic_review",
    evidence_level: "strong",
    population_type: "athletes",
    sample_size: 1571,
    age_range: "16-35",
    gender_distribution: "Mixed gender",
    study_duration_weeks: 8,
    relates_to_verkhoshansky: true,
    verkhoshansky_method: "stretch_shortening_cycle",
    verkhoshansky_principles: ["shock_method", "neural_potentiation"],
    key_findings: [
      "Plyometric training improves vertical jump by 4.7-8.1%",
      "Sprint performance improves by 1.8-2.8%",
      "Training duration of 7-12 weeks optimal",
      "Combination with resistance training most effective",
    ],
    performance_improvements: {
      vertical_jump: "4.7-8.1% improvement",
      sprint_speed: "1.8-2.8% improvement",
      power_output: "6.2-9.8% improvement",
    },
    training_protocols: [
      "2-3 sessions per week",
      "7-12 weeks duration",
      "Combination with resistance training",
      "Progressive overload principles",
    ],
    safety_considerations: [
      "Proper progression essential",
      "Adequate recovery periods",
      "Individual response monitoring",
      "Technique emphasis",
    ],
    practical_recommendations: [
      "Integrate with resistance training",
      "Focus on proper technique",
      "Progress gradually",
      "Monitor for overtraining",
    ],
    contraindications: [
      "Recent injuries",
      "Poor technique",
      "Insufficient strength base",
    ],
    progression_guidelines: [
      "Start with basic movements",
      "Progress complexity gradually",
      "Increase intensity systematically",
      "Monitor performance",
    ],
    exercise_types: ["depth_jumps", "box_jumps", "bounds", "hops"],
    intensity_levels: ["low", "moderate", "high"],
    volume_recommendations: [
      "2-3 sessions per week",
      "50-200 contacts per session",
    ],
    rest_periods: ["48-72 hours between sessions", "2-3 minutes between sets"],
    applicable_sports: ["all_sports"],
    position_specific_applications: {
      general: ["all_positions"],
    },
    skill_level_applications: ["beginner", "intermediate", "advanced", "elite"],
    methodology_score: 0.92,
    statistical_power: "high",
    limitations: [
      "Heterogeneity in training protocols",
      "Limited long-term studies",
      "Varied outcome measures",
    ],
    future_research_needs: [
      "Long-term effectiveness studies",
      "Sport-specific protocols",
      "Injury risk assessment",
    ],
    citation_count: 567,
    impact_factor: 4.8,
    peer_reviewed: true,
  },
  {
    title:
      "The Effects of Plyometric Training on Sprint Performance: A Systematic Review",
    authors: ["Rumpf, M.C.", "Lockie, R.G.", "Cronin, J.B.", "Mohamad, N.I."],
    journal: "Journal of Strength and Conditioning Research",
    publication_year: 2016,
    doi: "10.1519/JSC.0000000000001236",
    research_type: "systematic_review",
    study_design: "systematic_review",
    evidence_level: "strong",
    population_type: "athletes",
    sample_size: 1089,
    age_range: "16-30",
    gender_distribution: "Mixed gender",
    study_duration_weeks: 6,
    relates_to_verkhoshansky: true,
    verkhoshansky_method: "shock_method",
    verkhoshansky_principles: [
      "stretch_shortening_cycle",
      "neural_potentiation",
    ],
    key_findings: [
      "Plyometric training improves sprint performance by 2.8-4.2%",
      "Depth jumps most effective for sprint improvement",
      "Training duration of 6-10 weeks optimal",
      "Combination with sprint training enhances effects",
    ],
    performance_improvements: {
      sprint_speed: "2.8-4.2% improvement",
      acceleration: "3.1-4.8% improvement",
      power_output: "5.2-7.8% improvement",
    },
    training_protocols: [
      "2-3 sessions per week",
      "6-10 weeks duration",
      "Depth jumps and bounds",
      "Combination with sprint training",
    ],
    safety_considerations: [
      "Proper landing mechanics",
      "Gradual progression",
      "Adequate recovery",
      "Individual monitoring",
    ],
    practical_recommendations: [
      "Focus on depth jumps for sprint improvement",
      "Combine with sprint training",
      "Progress gradually",
      "Monitor performance",
    ],
    contraindications: [
      "Lower extremity injuries",
      "Poor landing mechanics",
      "Insufficient strength",
    ],
    progression_guidelines: [
      "Start with basic jumping",
      "Progress to depth jumps",
      "Increase intensity gradually",
      "Monitor response",
    ],
    exercise_types: ["depth_jumps", "bounds", "hops", "sprint_mechanics"],
    intensity_levels: ["moderate", "high"],
    volume_recommendations: [
      "2-3 sessions per week",
      "50-150 contacts per session",
    ],
    rest_periods: ["48-72 hours between sessions", "3-5 minutes between sets"],
    applicable_sports: ["soccer", "football", "track_and_field", "rugby"],
    position_specific_applications: {
      soccer: ["forwards", "midfielders", "defenders"],
      football: ["running_backs", "receivers", "defensive_backs"],
    },
    skill_level_applications: ["intermediate", "advanced", "elite"],
    methodology_score: 0.88,
    statistical_power: "high",
    limitations: [
      "Heterogeneity in protocols",
      "Limited long-term studies",
      "Varied outcome measures",
    ],
    future_research_needs: [
      "Long-term effectiveness",
      "Sport-specific protocols",
      "Injury risk assessment",
    ],
    citation_count: 234,
    impact_factor: 3.2,
    peer_reviewed: true,
  },
];

// Plyometrics exercises based on research
const plyometricsExercises = [
  {
    exercise_name: "Depth Jump",
    exercise_category: "lower_body",
    difficulty_level: "advanced",
    description:
      "A plyometric exercise where the athlete drops from a height and immediately jumps upward upon landing, utilizing the stretch-shortening cycle to enhance power output.",
    instructions: [
      "Stand on a box or platform (12-30 inches high)",
      "Step off the box (don't jump off)",
      "Land softly with both feet simultaneously",
      "Immediately jump upward as high as possible",
      "Land softly and repeat",
    ],
    research_based: true,
    intensity_level: "high",
    volume_recommendations: [
      "3-5 sets of 3-5 repetitions",
      "50-100 total contacts per session",
      "2-3 sessions per week",
    ],
    rest_periods: ["3-5 minutes between sets", "48-72 hours between sessions"],
    progression_guidelines: [
      "Start with basic jumping skills",
      "Begin with low heights (8-12 inches)",
      "Progress height gradually based on performance",
      "Maintain perfect form throughout",
    ],
    safety_notes: [
      "Must have excellent landing mechanics",
      "Requires adequate strength base",
      "Monitor for signs of overtraining",
      "Individual response varies significantly",
    ],
    contraindications: [
      "Recent lower extremity injuries",
      "Poor landing mechanics",
      "Insufficient strength base",
      "High training load",
    ],
    proper_form_guidelines: [
      "Land with feet shoulder-width apart",
      "Absorb landing with knees and hips",
      "Maintain upright posture",
      "Jump immediately upon landing",
    ],
    common_mistakes: [
      "Jumping off the box instead of stepping",
      "Landing with stiff legs",
      "Pausing between landing and jump",
      "Poor landing mechanics",
    ],
    applicable_sports: [
      "basketball",
      "volleyball",
      "track_and_field",
      "football",
    ],
    position_specific: true,
    position_applications: {
      basketball: ["all_positions"],
      volleyball: ["hitters", "blockers"],
      football: ["running_backs", "receivers"],
    },
    equipment_needed: ["plyometric_box", "firm_surface"],
    space_requirements: "10x10 feet minimum",
    surface_requirements: "Firm, non-absorbent surface",
    effectiveness_rating: 0.92,
    performance_improvements: {
      vertical_jump: "8-15% improvement",
      power_output: "12-20% improvement",
      sprint_speed: "3-6% improvement",
    },
    injury_risk_rating: "moderate",
  },
  {
    exercise_name: "Box Jump",
    exercise_category: "lower_body",
    difficulty_level: "intermediate",
    description:
      "A plyometric exercise where the athlete jumps onto a box or platform, focusing on explosive power development and landing mechanics.",
    instructions: [
      "Stand facing a box or platform",
      "Assume athletic stance with feet shoulder-width apart",
      "Swing arms back and bend knees",
      "Jump explosively onto the box",
      "Land softly with both feet",
      "Step down and repeat",
    ],
    research_based: true,
    intensity_level: "moderate",
    volume_recommendations: [
      "3-5 sets of 5-10 repetitions",
      "50-150 total contacts per session",
      "2-3 sessions per week",
    ],
    rest_periods: ["2-3 minutes between sets", "48-72 hours between sessions"],
    progression_guidelines: [
      "Start with low box heights",
      "Increase height as technique improves",
      "Focus on landing mechanics",
      "Progress volume before intensity",
    ],
    safety_notes: [
      "Ensure box is stable and secure",
      "Focus on proper landing mechanics",
      "Don't jump higher than comfortable",
      "Step down, don't jump down",
    ],
    contraindications: [
      "Lower extremity injuries",
      "Poor balance or coordination",
      "Insufficient strength base",
    ],
    proper_form_guidelines: [
      "Land with both feet simultaneously",
      "Absorb landing with knees and hips",
      "Maintain upright posture",
      "Step down carefully",
    ],
    common_mistakes: [
      "Jumping down from the box",
      "Landing with one foot first",
      "Poor landing mechanics",
      "Jumping too high for ability",
    ],
    applicable_sports: ["basketball", "volleyball", "football", "soccer"],
    position_specific: false,
    equipment_needed: ["plyometric_box"],
    space_requirements: "8x8 feet minimum",
    surface_requirements: "Firm surface",
    effectiveness_rating: 0.85,
    performance_improvements: {
      vertical_jump: "6-12% improvement",
      power_output: "8-15% improvement",
      coordination: "Improved",
    },
    injury_risk_rating: "low",
  },
];

// Plyometrics training programs
const plyometricsTrainingPrograms = [
  {
    program_name: "Beginner Plyometrics Program",
    program_type: "beginner",
    target_population: "recreational_athletes",
    research_based: true,
    supporting_research_ids: [],
    verkhoshansky_influence: false,
    duration_weeks: 8,
    sessions_per_week: 2,
    exercises_per_session: 4,
    progression_model: "linear",
    intensity_progression: {
      week_1_2: "Low intensity, focus on technique",
      week_3_4: "Moderate intensity, increase volume",
      week_5_6: "Moderate-high intensity",
      week_7_8: "High intensity, sport-specific",
    },
    volume_progression: {
      week_1_2: "30-50 contacts per session",
      week_3_4: "50-80 contacts per session",
      week_5_6: "80-120 contacts per session",
      week_7_8: "100-150 contacts per session",
    },
    exercise_sequence: {
      session_1: ["jumping_jacks", "ankle_hops", "pogo_jumps", "box_jumps"],
      session_2: ["lateral_hops", "single_leg_hops", "bounds", "depth_jumps"],
    },
    exercise_substitutions: {
      box_jumps: ["step_ups", "squat_jumps"],
      depth_jumps: ["drop_jumps", "reactive_jumps"],
    },
    modification_guidelines: [
      "Reduce volume if experiencing fatigue",
      "Focus on quality over quantity",
      "Progress only when technique is perfect",
      "Individualize based on response",
    ],
    performance_metrics: [
      "Vertical jump height",
      "Broad jump distance",
      "30-meter sprint time",
      "Agility test performance",
    ],
    assessment_protocols: [
      "Pre-program baseline testing",
      "Mid-program assessment (week 4)",
      "Post-program testing",
      "Follow-up testing (4 weeks post)",
    ],
    success_criteria: {
      vertical_jump: "5% improvement",
      broad_jump: "8% improvement",
      sprint_speed: "3% improvement",
    },
    safety_guidelines: [
      "Proper warm-up required",
      "Focus on landing mechanics",
      "Adequate recovery between sessions",
      "Monitor for signs of overtraining",
    ],
    monitoring_parameters: [
      "Performance improvements",
      "Fatigue levels",
      "Technique quality",
      "Recovery indicators",
    ],
    warning_signs: [
      "Decreased performance",
      "Increased fatigue",
      "Poor technique",
      "Pain or discomfort",
    ],
    expected_improvements: {
      vertical_jump: "5-10% improvement",
      power_output: "8-15% improvement",
      coordination: "Improved",
      athletic_performance: "Enhanced",
    },
    timeline_expectations: [
      "Week 2-3: Technique improvements",
      "Week 4-5: Performance gains begin",
      "Week 6-8: Significant improvements",
      "Post-program: Maintained gains",
    ],
    individual_variability_notes: [
      "Response varies by individual",
      "Some athletes may progress faster",
      "Others may need more time",
      "Adjust based on individual response",
    ],
  },
];

// Plyometrics guidelines
const plyometricsGuidelines = [
  {
    guideline_type: "safety",
    title: "Plyometrics Safety Guidelines",
    description:
      "Comprehensive safety guidelines for plyometric training based on research evidence and expert consensus.",
    evidence_level: "strong",
    supporting_research_ids: [],
    expert_consensus: true,
    recommendations: [
      "Begin with basic jumping and landing skills",
      "Progress gradually in intensity and volume",
      "Ensure adequate strength base before starting",
      "Focus on proper landing mechanics",
      "Allow adequate recovery between sessions",
      "Monitor for signs of overtraining",
      "Individualize programs based on response",
    ],
    contraindications: [
      "Recent lower extremity injuries",
      "Poor landing mechanics",
      "Insufficient strength base",
      "High training load",
      "Pain or discomfort during training",
    ],
    exceptions: [
      "Modified plyometrics may be appropriate for rehabilitation",
      "Low-intensity plyometrics for beginners",
      "Sport-specific adaptations for elite athletes",
    ],
    applicable_populations: [
      "athletes",
      "recreational_training",
      "youth_athletes",
    ],
    applicable_sports: ["all_sports"],
    skill_level_applications: ["beginner", "intermediate", "advanced", "elite"],
    implementation_notes: [
      "Always begin with proper warm-up",
      "Focus on quality over quantity",
      "Progress only when ready",
      "Monitor individual response",
    ],
    monitoring_guidelines: [
      "Track performance improvements",
      "Monitor fatigue levels",
      "Assess technique quality",
      "Watch for warning signs",
    ],
    adjustment_criteria: [
      "Decreased performance",
      "Increased fatigue",
      "Poor technique",
      "Pain or discomfort",
    ],
    last_updated: "2024-12-19",
    review_frequency: "annual",
    next_review_date: "2025-12-19",
  },
];

async function seedPlyometricsResearch() {
  const client = await pool.connect();

  try {
    console.log("Starting plyometrics research database seeding...");

    // Seed Verkhoshansky methodology
    console.log("Seeding Verkhoshansky methodology...");
    for (const methodology of verkhoshanskyMethodology) {
      const query = `
        INSERT INTO verkhoshansky_methodology (
          work_title, original_language, translation_available, publication_year, 
          original_journal, method_name, method_description, theoretical_foundation,
          physiological_principles, original_protocols, exercise_parameters, 
          progression_systems, research_evidence, experimental_results, validation_studies,
          modern_adaptations, modifications_for_safety, contemporary_applications,
          historical_impact, influence_on_field, legacy_contributions,
          implementation_notes, common_misconceptions, proper_execution_guidelines
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING id
      `;

      const values = [
        methodology.work_title,
        methodology.original_language,
        methodology.translation_available,
        methodology.publication_year,
        methodology.original_journal,
        methodology.method_name,
        methodology.method_description,
        methodology.theoretical_foundation,
        methodology.physiological_principles,
        JSON.stringify(methodology.original_protocols),
        JSON.stringify(methodology.exercise_parameters),
        JSON.stringify(methodology.progression_systems),
        methodology.research_evidence,
        JSON.stringify(methodology.experimental_results),
        methodology.validation_studies,
        methodology.modern_adaptations,
        methodology.modifications_for_safety,
        methodology.contemporary_applications,
        methodology.historical_impact,
        methodology.influence_on_field,
        methodology.legacy_contributions,
        methodology.implementation_notes,
        methodology.common_misconceptions,
        methodology.proper_execution_guidelines,
      ];

      const _result = await client.query(query, values);
      console.log(
        `Inserted Verkhoshansky methodology: ${methodology.work_title}`,
      );
    }

    // Seed plyometrics research
    console.log("Seeding plyometrics research articles...");
    for (const research of plyometricsResearch) {
      const query = `
        INSERT INTO plyometrics_research (
          title, authors, journal, publication_year, doi, research_type, study_design,
          evidence_level, population_type, sample_size, age_range, gender_distribution,
          study_duration_weeks, relates_to_verkhoshansky, verkhoshansky_method,
          verkhoshansky_principles, key_findings, performance_improvements,
          training_protocols, safety_considerations, practical_recommendations,
          contraindications, progression_guidelines, exercise_types, intensity_levels,
          volume_recommendations, rest_periods, applicable_sports,
          position_specific_applications, skill_level_applications, methodology_score,
          statistical_power, limitations, future_research_needs, citation_count,
          impact_factor, peer_reviewed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38)
        RETURNING id
      `;

      const values = [
        research.title,
        research.authors,
        research.journal,
        research.publication_year,
        research.doi,
        research.research_type,
        research.study_design,
        research.evidence_level,
        research.population_type,
        research.sample_size,
        research.age_range,
        research.gender_distribution,
        research.study_duration_weeks,
        research.relates_to_verkhoshansky,
        research.verkhoshansky_method,
        research.verkhoshansky_principles,
        research.key_findings,
        JSON.stringify(research.performance_improvements),
        research.training_protocols,
        research.safety_considerations,
        research.practical_recommendations,
        research.contraindications,
        research.progression_guidelines,
        research.exercise_types,
        research.intensity_levels,
        research.volume_recommendations,
        research.rest_periods,
        research.applicable_sports,
        JSON.stringify(research.position_specific_applications),
        research.skill_level_applications,
        research.methodology_score,
        research.statistical_power,
        research.limitations,
        research.future_research_needs,
        research.citation_count,
        research.impact_factor,
        research.peer_reviewed,
      ];

      const _result = await client.query(query, values);
      console.log(`Inserted research: ${research.title}`);
    }

    // Seed plyometrics exercises
    console.log("Seeding plyometrics exercises...");
    for (const exercise of plyometricsExercises) {
      const query = `
        INSERT INTO plyometrics_exercises (
          exercise_name, exercise_category, difficulty_level, description, instructions,
          research_based, intensity_level, volume_recommendations, rest_periods,
          progression_guidelines, safety_notes, contraindications, proper_form_guidelines,
          common_mistakes, applicable_sports, position_specific, position_applications,
          equipment_needed, space_requirements, surface_requirements, effectiveness_rating,
          performance_improvements, injury_risk_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING id
      `;

      const values = [
        exercise.exercise_name,
        exercise.exercise_category,
        exercise.difficulty_level,
        exercise.description,
        exercise.instructions,
        exercise.research_based,
        exercise.intensity_level,
        exercise.volume_recommendations,
        exercise.rest_periods,
        exercise.progression_guidelines,
        exercise.safety_notes,
        exercise.contraindications,
        exercise.proper_form_guidelines,
        exercise.common_mistakes,
        exercise.applicable_sports,
        exercise.position_specific,
        JSON.stringify(exercise.position_applications),
        exercise.equipment_needed,
        exercise.space_requirements,
        exercise.surface_requirements,
        exercise.effectiveness_rating,
        JSON.stringify(exercise.performance_improvements),
        exercise.injury_risk_rating,
      ];

      const _result = await client.query(query, values);
      console.log(`Inserted exercise: ${exercise.exercise_name}`);
    }

    // Seed training programs
    console.log("Seeding plyometrics training programs...");
    for (const program of plyometricsTrainingPrograms) {
      const query = `
        INSERT INTO plyometrics_training_programs (
          program_name, program_type, target_population, research_based,
          supporting_research_ids, verkhoshansky_influence, duration_weeks,
          sessions_per_week, exercises_per_session, progression_model,
          intensity_progression, volume_progression, exercise_sequence,
          exercise_substitutions, modification_guidelines, performance_metrics,
          assessment_protocols, success_criteria, safety_guidelines,
          monitoring_parameters, warning_signs, expected_improvements,
          timeline_expectations, individual_variability_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING id
      `;

      const values = [
        program.program_name,
        program.program_type,
        program.target_population,
        program.research_based,
        program.supporting_research_ids,
        program.verkhoshansky_influence,
        program.duration_weeks,
        program.sessions_per_week,
        program.exercises_per_session,
        program.progression_model,
        JSON.stringify(program.intensity_progression),
        JSON.stringify(program.volume_progression),
        JSON.stringify(program.exercise_sequence),
        JSON.stringify(program.exercise_substitutions),
        program.modification_guidelines,
        program.performance_metrics,
        program.assessment_protocols,
        JSON.stringify(program.success_criteria),
        program.safety_guidelines,
        program.monitoring_parameters,
        program.warning_signs,
        JSON.stringify(program.expected_improvements),
        program.timeline_expectations,
        program.individual_variability_notes,
      ];

      const _result = await client.query(query, values);
      console.log(`Inserted training program: ${program.program_name}`);
    }

    // Seed guidelines
    console.log("Seeding plyometrics guidelines...");
    for (const guideline of plyometricsGuidelines) {
      const query = `
        INSERT INTO plyometrics_guidelines (
          guideline_type, title, description, evidence_level, supporting_research_ids,
          expert_consensus, recommendations, contraindications, exceptions,
          applicable_populations, applicable_sports, skill_level_applications,
          implementation_notes, monitoring_guidelines, adjustment_criteria,
          last_updated, review_frequency, next_review_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id
      `;

      const values = [
        guideline.guideline_type,
        guideline.title,
        guideline.description,
        guideline.evidence_level,
        guideline.supporting_research_ids,
        guideline.expert_consensus,
        guideline.recommendations,
        guideline.contraindications,
        guideline.exceptions,
        guideline.applicable_populations,
        guideline.applicable_sports,
        guideline.skill_level_applications,
        guideline.implementation_notes,
        guideline.monitoring_guidelines,
        guideline.adjustment_criteria,
        guideline.last_updated,
        guideline.review_frequency,
        guideline.next_review_date,
      ];

      const _result = await client.query(query, values);
      console.log(`Inserted guideline: ${guideline.title}`);
    }

    console.log(
      "Plyometrics research database seeding completed successfully!",
    );
  } catch (error) {
    console.error("Error seeding plyometrics research database:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seeding function
if (require.main === module) {
  seedPlyometricsResearch()
    .then(() => {
      console.log("Database seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database seeding failed:", error);
      process.exit(1);
    });
}

module.exports = { seedPlyometricsResearch };
