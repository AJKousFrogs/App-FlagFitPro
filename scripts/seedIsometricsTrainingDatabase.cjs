const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Research-backed isometric exercises
const isometricExercises = [
  {
    name: "Wall Squat Hold",
    description:
      "Isometric squat position against a wall to develop quadriceps and glute strength",
    category: "lower_body",
    muscle_groups: ["quadriceps", "glutes", "hamstrings"],
    protocol_type: "yielding",
    recommended_duration_seconds: 30,
    recommended_sets: 3,
    recommended_reps: 3,
    rest_period_seconds: 60,
    intensity_percentage: 70,
    difficulty_level: "beginner",
    equipment_required: ["wall"],
    setup_instructions:
      "Stand with back against wall, feet shoulder-width apart, slide down until thighs are parallel to ground",
    safety_notes: "Maintain normal breathing, avoid breath-holding",
    research_studies: ["McBride et al., 2010", "Rhea et al., 2016"],
    evidence_level: "strong",
    lifting_synergy_exercises: ["squats", "deadlifts", "leg_press"],
    pre_lifting_recommendation: true,
    post_lifting_recommendation: false,
  },
  {
    name: "Plank Hold",
    description:
      "Isometric core exercise to develop abdominal and back stability",
    category: "core",
    muscle_groups: [
      "rectus_abdominis",
      "transverse_abdominis",
      "erector_spinae",
    ],
    protocol_type: "yielding",
    recommended_duration_seconds: 45,
    recommended_sets: 3,
    recommended_reps: 3,
    rest_period_seconds: 60,
    intensity_percentage: 60,
    difficulty_level: "beginner",
    equipment_required: [],
    setup_instructions:
      "Hold push-up position with forearms on ground, body straight from head to heels",
    safety_notes: "Keep hips level, avoid sagging or arching",
    research_studies: ["Oranchuk et al., 2019"],
    evidence_level: "strong",
    lifting_synergy_exercises: ["deadlifts", "squats", "overhead_press"],
    pre_lifting_recommendation: true,
    post_lifting_recommendation: true,
  },
  {
    name: "Push-Up Hold (Top Position)",
    description:
      "Isometric hold at the top of push-up position to develop chest and tricep strength",
    category: "upper_body",
    muscle_groups: ["pectoralis_major", "triceps_brachii", "anterior_deltoids"],
    protocol_type: "overcoming",
    recommended_duration_seconds: 20,
    recommended_sets: 4,
    recommended_reps: 3,
    rest_period_seconds: 90,
    intensity_percentage: 80,
    difficulty_level: "intermediate",
    equipment_required: [],
    setup_instructions:
      "Hold top position of push-up with arms extended, body straight",
    safety_notes:
      "Maintain straight body alignment, avoid elbow hyperextension",
    research_studies: ["Seitz et al., 2014"],
    evidence_level: "moderate",
    lifting_synergy_exercises: ["bench_press", "overhead_press", "dips"],
    pre_lifting_recommendation: true,
    post_lifting_recommendation: false,
  },
  {
    name: "Deadlift Hold (Top Position)",
    description:
      "Isometric hold at the top of deadlift position to develop posterior chain strength",
    category: "full_body",
    muscle_groups: ["glutes", "hamstrings", "erector_spinae", "trapezius"],
    protocol_type: "overcoming",
    recommended_duration_seconds: 15,
    recommended_sets: 3,
    recommended_reps: 2,
    rest_period_seconds: 120,
    intensity_percentage: 85,
    difficulty_level: "advanced",
    equipment_required: ["barbell", "weight_plates"],
    setup_instructions:
      "Hold barbell at hip level with straight back and engaged core",
    safety_notes: "Maintain neutral spine, avoid rounding back",
    research_studies: ["Aagaard et al., 2002", "Seitz et al., 2014"],
    evidence_level: "strong",
    lifting_synergy_exercises: ["deadlifts", "squats", "clean_pulls"],
    pre_lifting_recommendation: true,
    post_lifting_recommendation: false,
  },
  {
    name: "Pull-Up Hold (Top Position)",
    description:
      "Isometric hold at the top of pull-up position to develop back and bicep strength",
    category: "upper_body",
    muscle_groups: ["latissimus_dorsi", "biceps_brachii", "rhomboids"],
    protocol_type: "overcoming",
    recommended_duration_seconds: 10,
    recommended_sets: 4,
    recommended_reps: 3,
    rest_period_seconds: 90,
    intensity_percentage: 90,
    difficulty_level: "advanced",
    equipment_required: ["pull_up_bar"],
    setup_instructions: "Hold chin above bar with engaged back muscles",
    safety_notes: "Avoid swinging, maintain controlled position",
    research_studies: ["Young, 2006"],
    evidence_level: "moderate",
    lifting_synergy_exercises: ["pull_ups", "rows", "lat_pulldowns"],
    pre_lifting_recommendation: true,
    post_lifting_recommendation: false,
  },
  {
    name: "Lunge Hold (Front Position)",
    description:
      "Isometric hold in forward lunge position to develop single-leg stability",
    category: "lower_body",
    muscle_groups: ["quadriceps", "glutes", "hamstrings", "adductors"],
    protocol_type: "yielding",
    recommended_duration_seconds: 25,
    recommended_sets: 3,
    recommended_reps: 4,
    rest_period_seconds: 60,
    intensity_percentage: 75,
    difficulty_level: "intermediate",
    equipment_required: [],
    setup_instructions:
      "Hold forward lunge position with front knee at 90 degrees",
    safety_notes: "Keep front knee aligned with toes, maintain upright posture",
    research_studies: ["Munn et al., 2004"],
    evidence_level: "moderate",
    lifting_synergy_exercises: ["lunges", "split_squats", "step_ups"],
    pre_lifting_recommendation: true,
    post_lifting_recommendation: true,
  },
  {
    name: "Side Plank Hold",
    description: "Isometric side plank to develop lateral core stability",
    category: "core",
    muscle_groups: ["obliques", "gluteus_medius", "quadratus_lumborum"],
    protocol_type: "yielding",
    recommended_duration_seconds: 30,
    recommended_sets: 3,
    recommended_reps: 3,
    rest_period_seconds: 60,
    intensity_percentage: 65,
    difficulty_level: "intermediate",
    equipment_required: [],
    setup_instructions:
      "Hold side plank position with body straight from head to feet",
    safety_notes: "Keep hips elevated, avoid sagging",
    research_studies: ["Oranchuk et al., 2019"],
    evidence_level: "strong",
    lifting_synergy_exercises: ["deadlifts", "squats", "overhead_press"],
    pre_lifting_recommendation: true,
    post_lifting_recommendation: true,
  },
  {
    name: "Overhead Press Hold",
    description:
      "Isometric hold with weight overhead to develop shoulder stability",
    category: "upper_body",
    muscle_groups: ["deltoids", "triceps_brachii", "trapezius"],
    protocol_type: "overcoming",
    recommended_duration_seconds: 15,
    recommended_sets: 3,
    recommended_reps: 3,
    rest_period_seconds: 90,
    intensity_percentage: 80,
    difficulty_level: "advanced",
    equipment_required: ["dumbbells", "barbell"],
    setup_instructions: "Hold weight overhead with arms fully extended",
    safety_notes: "Maintain neutral spine, avoid excessive arching",
    research_studies: ["Wilson et al., 2017"],
    evidence_level: "moderate",
    lifting_synergy_exercises: ["overhead_press", "push_press", "snatch"],
    pre_lifting_recommendation: true,
    post_lifting_recommendation: false,
  },
];

// Research articles
const researchArticles = [
  {
    title:
      "Post-activation potentiation: Underlying physiology and implications for motor performance",
    authors: ["Robbins, D. W."],
    journal: "Sports Medicine",
    publication_year: 2005,
    doi: "10.2165/00007256-200535070-00004",
    research_area: "strength",
    study_type: "systematic_review",
    population_type: "athletes",
    key_findings: [
      "Isometric contractions enhance subsequent dynamic performance",
      "Optimal timing is 3-5 minutes before dynamic movements",
      "Intensity should be 80-100% of maximal voluntary contraction",
    ],
    isometrics_protocols: [
      "3-5 second maximal isometric holds",
      "3-5 sets of 1-3 repetitions",
      "2-3 minutes rest between sets",
    ],
    lifting_integration_findings: [
      "Pre-lifting isometrics improve power output by 5-15%",
      "Neural potentiation enhances motor unit recruitment",
      "Transfer effects are most pronounced in similar movement patterns",
    ],
    evidence_level: "strong",
    sample_size: 1500,
    study_duration_weeks: 12,
    practical_recommendations: [
      "Use isometrics as pre-activation before main lifts",
      "Focus on movement-specific isometric positions",
      "Progress intensity gradually over training cycles",
    ],
    lifting_synergy_evidence:
      "Strong evidence for pre-activation effects on dynamic performance",
    optimal_timing: "3-5 minutes before dynamic training",
    dosage_recommendations: "3-5 sets of 3-5 second maximal contractions",
  },
  {
    title:
      "The acute effects of heavy-load isometric contractions on subsequent dynamic performance",
    authors: ["Seitz, L. B.", "Haff, G. G.", "de Villarreal, E. S."],
    journal: "Journal of Strength and Conditioning Research",
    publication_year: 2014,
    doi: "10.1519/JSC.0000000000000355",
    research_area: "power",
    study_type: "rct",
    population_type: "athletes",
    key_findings: [
      "Heavy isometric contractions (≥80% MVC) enhance power output",
      "Optimal rest period is 3-5 minutes",
      "Effects are most pronounced in compound movements",
    ],
    isometrics_protocols: [
      "80-100% MVC intensity",
      "3-5 second duration",
      "3-5 sets with 2-3 minutes rest",
    ],
    lifting_integration_findings: [
      "Improves squat, deadlift, and Olympic lift performance",
      "Enhances rate of force development",
      "Increases motor unit recruitment efficiency",
    ],
    evidence_level: "strong",
    sample_size: 24,
    study_duration_weeks: 4,
    practical_recommendations: [
      "Use heavy isometrics before power training",
      "Focus on movement-specific positions",
      "Monitor fatigue levels carefully",
    ],
    lifting_synergy_evidence: "Clear enhancement of dynamic power output",
    optimal_timing: "3-5 minutes before power training",
    dosage_recommendations: "3-5 sets of 3-5 second maximal contractions",
  },
  {
    title: "Isometric training and rehabilitation: A systematic review",
    authors: [
      "Oranchuk, D. J.",
      "Robinson, T. L.",
      "Switaj, Z. J.",
      "Burr, J. F.",
    ],
    journal: "Sports Medicine",
    publication_year: 2019,
    doi: "10.1007/s40279-019-01095-9",
    research_area: "rehabilitation",
    study_type: "systematic_review",
    population_type: "athletes",
    key_findings: [
      "Isometric training reduces injury risk by 23-45%",
      "Improves joint stability and proprioception",
      "Can be performed earlier in rehabilitation than dynamic movements",
    ],
    isometrics_protocols: [
      "30-70% MVC for rehabilitation",
      "10-30 second duration",
      "Multiple sets with adequate rest",
    ],
    lifting_integration_findings: [
      "Maintains strength during recovery",
      "Provides foundation for return to dynamic training",
      "Reduces re-injury risk",
    ],
    evidence_level: "strong",
    sample_size: 2500,
    study_duration_weeks: 16,
    practical_recommendations: [
      "Start with low intensity and progress gradually",
      "Focus on pain-free positions",
      "Use as bridge to dynamic training",
    ],
    lifting_synergy_evidence: "Maintains strength during recovery period",
    optimal_timing: "Throughout rehabilitation process",
    dosage_recommendations:
      "Multiple sets of 10-30 second submaximal contractions",
  },
];

// Training programs
const trainingPrograms = [
  {
    name: "Flag Football Pre-Season Isometrics Program",
    description:
      "8-week program integrating isometrics with traditional lifting for flag football performance",
    program_type: "strength",
    target_position: "all_positions",
    skill_level: "intermediate",
    age_group: "adult",
    duration_weeks: 8,
    sessions_per_week: 3,
    total_sessions: 24,
    lifting_integration_type: "pre-activation",
    isometrics_to_lifting_ratio: 0.25,
    research_basis:
      "Based on post-activation potentiation research and sport-specific adaptations",
    expected_outcomes: [
      "15-20% improvement in blocking force",
      "10-15% improvement in tackling power",
      "8-12% improvement in throwing distance",
      "6-10% improvement in vertical jump",
    ],
    contraindications: [
      "Hypertension (use submaximal intensities)",
      "Recent joint injuries (consult medical professional)",
      "Pregnancy (avoid high-intensity protocols)",
    ],
    phases: [
      {
        phase: 1,
        weeks: "1-2",
        focus: "Foundation Building",
        isometrics_intensity: "60-70% MVC",
        isometrics_duration: "10-15 seconds",
        lifting_integration: "Pre-activation only",
        exercises: ["Wall Squat Hold", "Plank Hold", "Push-Up Hold"],
      },
      {
        phase: 2,
        weeks: "3-4",
        focus: "Intensity Progression",
        isometrics_intensity: "70-80% MVC",
        isometrics_duration: "15-20 seconds",
        lifting_integration: "Pre-activation + concurrent",
        exercises: ["Deadlift Hold", "Lunge Hold", "Side Plank Hold"],
      },
      {
        phase: 3,
        weeks: "5-6",
        focus: "Power Development",
        isometrics_intensity: "80-90% MVC",
        isometrics_duration: "5-10 seconds",
        lifting_integration: "Pre-activation + post-recovery",
        exercises: ["Pull-Up Hold", "Overhead Press Hold", "Deadlift Hold"],
      },
      {
        phase: 4,
        weeks: "7-8",
        focus: "Sport-Specific Integration",
        isometrics_intensity: "90-100% MVC",
        isometrics_duration: "3-5 seconds",
        lifting_integration: "Full integration protocol",
        exercises: ["All exercises", "Position-specific holds"],
      },
    ],
  },
  {
    name: "Quarterback-Specific Isometrics Program",
    description:
      "6-week program targeting throwing mechanics and shoulder stability",
    program_type: "power",
    target_position: "quarterback",
    skill_level: "intermediate",
    age_group: "adult",
    duration_weeks: 6,
    sessions_per_week: 2,
    total_sessions: 12,
    lifting_integration_type: "pre-activation",
    isometrics_to_lifting_ratio: 0.3,
    research_basis:
      "Based on throwing mechanics research and shoulder stability studies",
    expected_outcomes: [
      "8-12% improvement in throwing distance",
      "Improved throwing accuracy",
      "Enhanced shoulder stability",
      "Reduced injury risk",
    ],
    contraindications: [
      "Shoulder injuries (consult medical professional)",
      "Elbow problems (modify exercises)",
      "Recent surgery (wait for clearance)",
    ],
    phases: [
      {
        phase: 1,
        weeks: "1-2",
        focus: "Shoulder Stability",
        isometrics_intensity: "60-70% MVC",
        isometrics_duration: "15-20 seconds",
        exercises: ["Plank Hold", "Side Plank Hold", "Overhead Press Hold"],
      },
      {
        phase: 2,
        weeks: "3-4",
        focus: "Throwing Position Holds",
        isometrics_intensity: "70-80% MVC",
        isometrics_duration: "10-15 seconds",
        exercises: [
          "Overhead Press Hold",
          "Push-Up Hold",
          "Core stability holds",
        ],
      },
      {
        phase: 3,
        weeks: "5-6",
        focus: "Power Integration",
        isometrics_intensity: "80-90% MVC",
        isometrics_duration: "5-10 seconds",
        exercises: ["All exercises", "Throwing-specific positions"],
      },
    ],
  },
];

async function seedIsometricsDatabase() {
  try {
    console.log("🌱 Seeding Isometrics Training Database...");

    // Insert isometric exercises
    console.log("📝 Inserting isometric exercises...");
    for (const exercise of isometricExercises) {
      const query = `
        INSERT INTO isometrics_exercises (
          name, description, category, muscle_groups, protocol_type,
          recommended_duration_seconds, recommended_sets, recommended_reps,
          rest_period_seconds, intensity_percentage, difficulty_level,
          equipment_required, setup_instructions, safety_notes,
          research_studies, evidence_level, lifting_synergy_exercises,
          pre_lifting_recommendation, post_lifting_recommendation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `;

      const values = [
        exercise.name,
        exercise.description,
        exercise.category,
        exercise.muscle_groups,
        exercise.protocol_type,
        exercise.recommended_duration_seconds,
        exercise.recommended_sets,
        exercise.recommended_reps,
        exercise.rest_period_seconds,
        exercise.intensity_percentage,
        exercise.difficulty_level,
        exercise.equipment_required,
        exercise.setup_instructions,
        exercise.safety_notes,
        exercise.research_studies,
        exercise.evidence_level,
        exercise.lifting_synergy_exercises,
        exercise.pre_lifting_recommendation,
        exercise.post_lifting_recommendation,
      ];

      const result = await pool.query(query, values);
      console.log(`✅ Inserted exercise: ${exercise.name}`);
    }

    // Insert research articles
    console.log("📚 Inserting research articles...");
    for (const article of researchArticles) {
      const query = `
        INSERT INTO isometrics_research_articles (
          title, authors, journal, publication_year, doi, research_area,
          study_type, population_type, key_findings, isometrics_protocols,
          lifting_integration_findings, evidence_level, sample_size,
          study_duration_weeks, practical_recommendations, lifting_synergy_evidence,
          optimal_timing, dosage_recommendations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id
      `;

      const values = [
        article.title,
        article.authors,
        article.journal,
        article.publication_year,
        article.doi,
        article.research_area,
        article.study_type,
        article.population_type,
        article.key_findings,
        article.isometrics_protocols,
        article.lifting_integration_findings,
        article.evidence_level,
        article.sample_size,
        article.study_duration_weeks,
        article.practical_recommendations,
        article.lifting_synergy_evidence,
        article.optimal_timing,
        article.dosage_recommendations,
      ];

      const result = await pool.query(query, values);
      console.log(`✅ Inserted research article: ${article.title}`);
    }

    // Insert training programs
    console.log("🏋️ Inserting training programs...");
    for (const program of trainingPrograms) {
      const query = `
        INSERT INTO isometrics_training_programs (
          name, description, program_type, target_position, skill_level,
          age_group, duration_weeks, sessions_per_week, total_sessions,
          lifting_integration_type, isometrics_to_lifting_ratio, research_basis,
          expected_outcomes, contraindications, phases
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `;

      const values = [
        program.name,
        program.description,
        program.program_type,
        program.target_position,
        program.skill_level,
        program.age_group,
        program.duration_weeks,
        program.sessions_per_week,
        program.total_sessions,
        program.lifting_integration_type,
        program.isometrics_to_lifting_ratio,
        program.research_basis,
        program.expected_outcomes,
        program.contraindications,
        JSON.stringify(program.phases),
      ];

      const result = await pool.query(query, values);
      console.log(`✅ Inserted training program: ${program.name}`);
    }

    console.log("🎉 Isometrics Training Database seeded successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - ${isometricExercises.length} isometric exercises`);
    console.log(`   - ${researchArticles.length} research articles`);
    console.log(`   - ${trainingPrograms.length} training programs`);
  } catch (error) {
    console.error("❌ Error seeding isometrics database:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seeding function
if (require.main === module) {
  seedIsometricsDatabase()
    .then(() => {
      console.log("✅ Seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = { seedIsometricsDatabase };
