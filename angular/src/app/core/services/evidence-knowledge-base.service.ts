/**
 * Evidence-Based Knowledge Base Service
 *
 * COMPREHENSIVE SCIENTIFIC RESEARCH DATABASE FOR ATHLETIC TRAINING
 *
 * This service provides access to peer-reviewed research supporting
 * all training recommendations, load management, and injury prevention
 * protocols in the application.
 *
 * Research Categories:
 * 1. Load Management & ACWR
 * 2. Sprint Training & Biomechanics
 * 3. Strength & Power Development
 * 4. Injury Prevention
 * 5. Recovery & Sleep
 * 6. Nutrition & Hydration
 * 7. Age-Related Training Adaptations
 * 8. Position-Specific Training
 * 9. Periodization
 * 10. Return to Play
 *
 * @author FlagFit Pro Team
 * @version 2.0.0
 * @lastUpdated December 2024
 */

import { Injectable } from "@angular/core";

// ============================================================================
// INTERFACES
// ============================================================================

export interface ResearchReference {
  id: string;
  authors: string;
  year: number;
  title: string;
  journal: string;
  volume?: string;
  pages?: string;
  doi?: string;
  category: ResearchCategory;
  subcategory?: string;
  keyFindings: string[];
  practicalApplications: string[];
  effectSize?: string;
  sampleSize?: string;
  sportContext?: string;
  evidenceLevel: EvidenceLevel;
  tags: string[];
}

export type ResearchCategory =
  | "load_management"
  | "sprint_training"
  | "strength_power"
  | "injury_prevention"
  | "recovery_sleep"
  | "nutrition"
  | "age_adaptations"
  | "position_specific"
  | "periodization"
  | "return_to_play"
  | "biomechanics"
  | "psychology";

export type EvidenceLevel =
  | "meta_analysis" // Highest - systematic review of multiple studies
  | "randomized_trial" // High - randomized controlled trial
  | "cohort_study" // Moderate - prospective cohort study
  | "case_control" // Moderate - case-control study
  | "expert_consensus" // Lower - expert opinion/consensus
  | "case_series"; // Lowest - case reports

export interface TrainingGuideline {
  id: string;
  topic: string;
  recommendation: string;
  evidenceStrength: "strong" | "moderate" | "limited";
  supportingResearch: string[]; // Reference IDs
  practicalImplementation: string[];
  cautions: string[];
}

export interface ProtocolEvidence {
  protocol: string;
  description: string;
  effectivenessRating: number; // 1-10
  references: string[];
  keyMetrics: string[];
  implementationNotes: string[];
}

// ============================================================================
// COMPREHENSIVE RESEARCH DATABASE
// ============================================================================

const RESEARCH_DATABASE: ResearchReference[] = [
  // ============================================================================
  // LOAD MANAGEMENT & ACWR
  // ============================================================================
  {
    id: "gabbett_2016",
    authors: "Gabbett, T.J.",
    year: 2016,
    title:
      "The training—injury prevention paradox: should athletes be training smarter and harder?",
    journal: "British Journal of Sports Medicine",
    volume: "50",
    pages: "273-280",
    doi: "10.1136/bjsports-2015-095788",
    category: "load_management",
    keyFindings: [
      "ACWR 0.8-1.3 is the 'sweet spot' for injury prevention",
      "ACWR >1.5 increases injury risk 2-4 times",
      "High chronic workloads are protective against injury",
      "Rapid load increases (spikes) are the primary injury risk factor",
      "Well-developed physical qualities provide injury resilience",
    ],
    practicalApplications: [
      "Monitor ACWR weekly for all athletes",
      "Keep ACWR between 0.8-1.3",
      "Build chronic load gradually over 4-6 weeks",
      "Avoid week-to-week load spikes >10%",
      "Don't under-train - low chronic load increases injury risk",
    ],
    effectSize: "2-4x injury risk increase when ACWR >1.5",
    sampleSize: "Meta-analysis of multiple studies",
    sportContext: "Team sports (rugby, football, soccer)",
    evidenceLevel: "meta_analysis",
    tags: ["ACWR", "injury prevention", "load management", "training load"],
  },
  {
    id: "hulin_2014",
    authors:
      "Hulin, B.T., Gabbett, T.J., Blanch, P., Chapman, P., Bailey, D., & Orchard, J.W.",
    year: 2014,
    title:
      "Spikes in acute workload are associated with increased injury risk in elite cricket fast bowlers",
    journal: "British Journal of Sports Medicine",
    volume: "48",
    pages: "708-712",
    doi: "10.1136/bjsports-2013-092524",
    category: "load_management",
    keyFindings: [
      "Week-to-week load increases >15% significantly increase injury risk",
      "Acute:chronic workload ratio is a better predictor than absolute load",
      "Load spikes are more dangerous than high absolute loads",
      "Gradual load progression is protective",
    ],
    practicalApplications: [
      "Limit weekly load increases to 10% maximum",
      "Plan 4-week mesocycles with gradual progression",
      "Use deload weeks (70% volume) every 4th week",
      "Monitor week-to-week load changes, not just absolute load",
    ],
    effectSize: "Significant increase in injury risk with >15% weekly increase",
    sampleSize: "28 elite cricket fast bowlers over 6 seasons",
    sportContext: "Cricket (applicable to all sports)",
    evidenceLevel: "cohort_study",
    tags: ["load spikes", "injury risk", "weekly progression"],
  },
  {
    id: "hulin_2016",
    authors:
      "Hulin, B.T., Gabbett, T.J., Lawson, D.W., Caputi, P., & Sampson, J.A.",
    year: 2016,
    title:
      "The acute:chronic workload ratio predicts injury: high chronic workload may decrease injury risk in elite rugby league players",
    journal: "British Journal of Sports Medicine",
    volume: "50",
    pages: "231-236",
    doi: "10.1136/bjsports-2015-094817",
    category: "load_management",
    keyFindings: [
      "High chronic workload (fitness) is protective against injury",
      "Athletes with high fitness can tolerate higher acute loads",
      "ACWR remains the best predictor of injury risk",
      "Training monotony increases injury risk independent of load",
    ],
    practicalApplications: [
      "Build high chronic workload in pre-season",
      "Maintain chronic load during competition",
      "Vary training to reduce monotony",
      "Well-prepared athletes can handle tournament demands",
    ],
    effectSize: "High chronic workload reduces injury risk by 50%+",
    sampleSize: "53 elite rugby league players",
    sportContext: "Rugby league",
    evidenceLevel: "cohort_study",
    tags: ["chronic workload", "fitness", "injury protection"],
  },
  {
    id: "foster_2001",
    authors:
      "Foster, C., Florhaug, J.A., Franklin, J., Gottschall, L., Hrovatin, L.A., Parker, S., Doleshal, P., & Dodge, C.",
    year: 2001,
    title: "A new approach to monitoring exercise training",
    journal: "Journal of Strength and Conditioning Research",
    volume: "15",
    pages: "109-115",
    category: "load_management",
    keyFindings: [
      "Session-RPE (RPE × duration) is valid for monitoring training load",
      "Correlates well with heart rate-based methods",
      "Simple and practical for team sports",
      "Can be used without expensive equipment",
    ],
    practicalApplications: [
      "Collect RPE 30 minutes post-session",
      "Calculate load as RPE × duration in minutes",
      "Use 0-10 modified Borg scale",
      "Track weekly totals and ACWR",
    ],
    effectSize: "r = 0.75-0.90 correlation with HR-based methods",
    sampleSize: "Multiple validation studies",
    sportContext: "All sports",
    evidenceLevel: "randomized_trial",
    tags: ["session-RPE", "training load", "monitoring"],
  },
  {
    id: "williams_2017",
    authors: "Williams, S., West, S., Cross, M.J., & Stokes, K.A.",
    year: 2017,
    title: "Better way to determine the acute:chronic workload ratio?",
    journal: "British Journal of Sports Medicine",
    volume: "51",
    pages: "209-210",
    doi: "10.1136/bjsports-2016-096589",
    category: "load_management",
    keyFindings: [
      "EWMA (Exponentially Weighted Moving Average) is superior to rolling averages",
      "EWMA accounts for decay of fitness and fatigue",
      "More sensitive to recent training loads",
      "Better predicts injury risk than simple rolling averages",
    ],
    practicalApplications: [
      "Use EWMA for ACWR calculations",
      "Acute decay constant: 2/(7+1) = 0.25",
      "Chronic decay constant: 2/(28+1) = 0.069",
      "EWMA_today = Load_today × λ + EWMA_yesterday × (1-λ)",
    ],
    evidenceLevel: "expert_consensus",
    tags: ["EWMA", "ACWR calculation", "methodology"],
  },

  // ============================================================================
  // SPRINT TRAINING & BIOMECHANICS
  // ============================================================================
  {
    id: "haugen_2019",
    authors: "Haugen, T., Seiler, S., Sandbakk, Ø., & Tønnessen, E.",
    year: 2019,
    title:
      "The Training and Development of Elite Sprint Performance: an Integration of Scientific and Best Practice Literature",
    journal: "Sports Medicine - Open",
    volume: "5",
    pages: "44",
    doi: "10.1186/s40798-019-0221-0",
    category: "sprint_training",
    keyFindings: [
      "Elite sprinters perform 300-600 maximal sprints annually",
      "Quality over quantity is paramount",
      "Sprint training should be periodized",
      "Technical development continues throughout career",
      "Strength training transfers to sprint performance",
    ],
    practicalApplications: [
      "Limit maximal sprints to 300-600 per year",
      "Focus on quality - full recovery between reps",
      "Periodize sprint volume across the year",
      "Combine with strength training for best results",
    ],
    effectSize: "Large improvements with structured periodization",
    sportContext: "Track & Field, Team Sports",
    evidenceLevel: "meta_analysis",
    tags: ["sprint training", "periodization", "elite athletes"],
  },
  {
    id: "morin_samozino_2016",
    authors: "Morin, J.B., & Samozino, P.",
    year: 2016,
    title:
      "Interpreting Power-Force-Velocity Profiles for Individualized and Specific Training",
    journal: "International Journal of Sports Physiology and Performance",
    volume: "11",
    pages: "267-272",
    doi: "10.1123/ijspp.2015-0638",
    category: "sprint_training",
    subcategory: "biomechanics",
    keyFindings: [
      "Horizontal force application is the key determinant of acceleration",
      "Hip flexor strength correlates with stride frequency",
      "Force-velocity profile can guide individualized training",
      "Acceleration requires different qualities than max velocity",
    ],
    practicalApplications: [
      "Test force-velocity profile to identify weaknesses",
      "Train horizontal force for acceleration",
      "Hip flexor strength training improves sprint speed",
      "Individualize training based on profile",
    ],
    effectSize: "r = 0.93 (horizontal force-acceleration)",
    sportContext: "All sprint sports",
    evidenceLevel: "cohort_study",
    tags: ["force-velocity", "horizontal force", "hip flexors", "acceleration"],
  },
  {
    id: "seitz_2014",
    authors:
      "Seitz, L.B., Reyes, A., Tran, T.T., de Villarreal, E.S., & Haff, G.G.",
    year: 2014,
    title:
      "Increases in Lower-Body Strength Transfer Positively to Sprint Performance: A Systematic Review with Meta-Analysis",
    journal: "Sports Medicine",
    volume: "44",
    pages: "1693-1702",
    doi: "10.1007/s40279-014-0227-1",
    category: "strength_power",
    subcategory: "sprint_transfer",
    keyFindings: [
      "Every 1% increase in squat strength = 0.7% improvement in sprint times",
      "Stronger athletes sprint faster",
      "Strength training should be included in sprint programs",
      "Effect is consistent across different populations",
    ],
    practicalApplications: [
      "Include lower body strength training for sprinters",
      "Target relative squat strength of 2.0x bodyweight",
      "Strength gains transfer to sprint performance",
      "Prioritize squat and deadlift variations",
    ],
    effectSize: "r = 0.77 (strength-sprint correlation)",
    sampleSize: "510 participants across 15 studies",
    sportContext: "All sports requiring sprinting",
    evidenceLevel: "meta_analysis",
    tags: ["strength", "sprint", "squat", "transfer"],
  },
  {
    id: "clark_2019",
    authors: "Clark, K.P., Rieger, R.H., Bruno, R.F., & Stearne, D.J.",
    year: 2019,
    title: "The NFL Combine 40-Yard Dash: How Important is Maximum Velocity?",
    journal: "Journal of Strength and Conditioning Research",
    volume: "33",
    pages: "1542-1550",
    doi: "10.1519/JSC.0000000000002081",
    category: "sprint_training",
    subcategory: "acceleration",
    keyFindings: [
      "Acceleration (0-10 yards) accounts for 60% of 40-yard dash variance",
      "Maximum velocity contributes less than acceleration",
      "First 10 yards are most critical for football",
      "Training should prioritize acceleration",
    ],
    practicalApplications: [
      "Prioritize 0-10m acceleration training",
      "First step and drive phase are critical",
      "Max velocity work is secondary for flag football",
      "Test and train short sprints (5-10m)",
    ],
    effectSize: "60% variance explained by 0-10 yard split",
    sampleSize: "NFL Combine data",
    sportContext: "American Football (directly applicable to flag football)",
    evidenceLevel: "cohort_study",
    tags: ["acceleration", "40-yard dash", "football", "first step"],
  },
  {
    id: "petrakos_2016",
    authors: "Petrakos, G., Morin, J.B., & Egan, B.",
    year: 2016,
    title:
      "Resisted Sled Sprint Training to Improve Sprint Performance: A Systematic Review",
    journal: "Sports Medicine",
    volume: "46",
    pages: "381-400",
    doi: "10.1007/s40279-015-0422-8",
    category: "sprint_training",
    subcategory: "resisted_sprints",
    keyFindings: [
      "Light sled loads (10-20% BW) improve acceleration without altering mechanics",
      "Heavy loads (>20% BW) may alter sprint mechanics",
      "2-3% improvement in 10m sprint times",
      "Best for acceleration phase development",
    ],
    practicalApplications: [
      "Use sled loads of 10-20% bodyweight",
      "Focus on acceleration distances (10-20m)",
      "Don't exceed 20% BW to maintain mechanics",
      "Combine with unresisted sprints",
    ],
    effectSize: "2-3% improvement in 10m sprint times",
    sportContext: "Team sports",
    evidenceLevel: "meta_analysis",
    tags: ["resisted sprints", "sled training", "acceleration"],
  },
  {
    id: "kubo_2000",
    authors: "Kubo, K., Kanehisa, H., & Fukunaga, T.",
    year: 2000,
    title:
      "Effect of stretching training on the viscoelastic properties of human tendon structures in vivo",
    journal: "Journal of Applied Physiology",
    volume: "92",
    pages: "595-601",
    category: "biomechanics",
    subcategory: "tendon",
    keyFindings: [
      "Achilles tendon stiffness correlates with sprint performance",
      "Stiffer tendons = more efficient energy return",
      "Tendon properties can be trained",
      "Plyometric training increases tendon stiffness",
    ],
    practicalApplications: [
      "Include plyometric training for tendon adaptation",
      "Pogo jumps develop ankle stiffness",
      "Daily calf/ankle work for sprinters",
      "Gradual progression to prevent tendinopathy",
    ],
    sportContext: "Sprinting, jumping",
    evidenceLevel: "randomized_trial",
    tags: ["Achilles tendon", "stiffness", "plyometrics", "ankle"],
  },
  {
    id: "schache_2012",
    authors:
      "Schache, A.G., Dorn, T.W., Blanch, P.D., Brown, N.A., & Pandy, M.G.",
    year: 2012,
    title: "Mechanics of the Human Hamstring Muscles during Sprinting",
    journal: "Medicine & Science in Sports & Exercise",
    volume: "44",
    pages: "647-658",
    doi: "10.1249/MSS.0b013e318236a3d2",
    category: "biomechanics",
    subcategory: "hamstrings",
    keyFindings: [
      "Hamstrings work hardest during late swing phase",
      "Peak strain occurs just before foot strike",
      "Eccentric strength is critical for hamstring protection",
      "Biceps femoris is most commonly injured",
    ],
    practicalApplications: [
      "Nordic curls are essential for hamstring protection",
      "Train eccentric hamstring strength",
      "Focus on late swing phase mechanics",
      "Gradual progression of sprint volume",
    ],
    sportContext: "Sprinting",
    evidenceLevel: "cohort_study",
    tags: ["hamstrings", "sprint mechanics", "injury prevention"],
  },
  {
    id: "buchheit_2010",
    authors:
      "Buchheit, M., Mendez-Villanueva, A., Simpson, B.M., & Bourdon, P.C.",
    year: 2010,
    title: "Repeated-Sprint Sequences During Youth Soccer Matches",
    journal: "International Journal of Sports Medicine",
    volume: "31",
    pages: "709-716",
    doi: "10.1055/s-0030-1261897",
    category: "sprint_training",
    subcategory: "repeated_sprint",
    keyFindings: [
      "Team sport athletes perform 20-40 sprints per game",
      "Recovery between sprints is often incomplete",
      "Repeated sprint ability is trainable",
      "RSA correlates with game performance",
    ],
    practicalApplications: [
      "Train repeated sprint ability (RSA)",
      "Use short rest intervals (20-30s) to simulate games",
      "Build RSA in pre-season",
      "Maintain with 1-2 sessions/week in-season",
    ],
    sampleSize: "Youth soccer players",
    sportContext: "Soccer (similar demands to flag football)",
    evidenceLevel: "cohort_study",
    tags: ["repeated sprint", "RSA", "team sports", "game demands"],
  },

  // ============================================================================
  // INJURY PREVENTION
  // ============================================================================
  {
    id: "al_attar_2017",
    authors:
      "Al Attar, W.S., Soomro, N., Sinclair, P.J., Pappas, E., & Sanders, R.H.",
    year: 2017,
    title:
      "Effect of Injury Prevention Programs that Include the Nordic Hamstring Exercise on Hamstring Injury Rates in Soccer Players: A Systematic Review and Meta-Analysis",
    journal: "Sports Medicine",
    volume: "47",
    pages: "907-916",
    doi: "10.1007/s40279-016-0638-2",
    category: "injury_prevention",
    subcategory: "hamstrings",
    keyFindings: [
      "Nordic curls reduce hamstring injuries by 51%",
      "Effect is consistent across different populations",
      "Simple exercise with major impact",
      "Should be included in all training programs",
    ],
    practicalApplications: [
      "Include Nordic curls 2-3x per week",
      "Progress from 3x6 to 3x10 over 8 weeks",
      "Maintain year-round",
      "Essential for all sprinting athletes",
    ],
    effectSize: "51% reduction in hamstring injuries",
    sampleSize: "Meta-analysis of 8,459 athletes",
    sportContext: "Soccer (applicable to all sprint sports)",
    evidenceLevel: "meta_analysis",
    tags: ["Nordic curls", "hamstring", "injury prevention"],
  },
  {
    id: "haroy_2019",
    authors:
      "Harøy, J., Clarsen, B., Wiger, E.G., Øyen, M.G., Serner, A., Thorborg, K., Hölmich, P., Andersen, T.E., & Bahr, R.",
    year: 2019,
    title:
      "The Adductor Strengthening Programme prevents groin problems among male football players: a cluster-randomised controlled trial",
    journal: "British Journal of Sports Medicine",
    volume: "53",
    pages: "150-157",
    doi: "10.1136/bjsports-2017-098937",
    category: "injury_prevention",
    subcategory: "groin",
    keyFindings: [
      "Copenhagen adductor exercise reduces groin injuries by 41%",
      "Simple partner exercise",
      "Effective for prevention, not just rehabilitation",
      "Should be standard in team sport programs",
    ],
    practicalApplications: [
      "Include Copenhagen adductors 2x per week",
      "Progress from knee bent to straight leg",
      "Partner-based exercise",
      "Especially important for athletes with groin history",
    ],
    effectSize: "41% reduction in groin injuries",
    sampleSize: "Cluster-randomized trial with 35 teams",
    sportContext: "Football/Soccer",
    evidenceLevel: "randomized_trial",
    tags: ["Copenhagen", "adductors", "groin", "injury prevention"],
  },
  {
    id: "lauersen_2014",
    authors: "Lauersen, J.B., Bertelsen, D.M., & Andersen, L.B.",
    year: 2014,
    title:
      "The effectiveness of exercise interventions to prevent sports injuries: a systematic review and meta-analysis of randomised controlled trials",
    journal: "British Journal of Sports Medicine",
    volume: "48",
    pages: "871-877",
    doi: "10.1136/bjsports-2013-092538",
    category: "injury_prevention",
    keyFindings: [
      "Strength training reduces sports injuries by 69%",
      "Proprioception training reduces injuries by 45%",
      "Stretching alone has no significant effect",
      "Combination programs are most effective",
    ],
    practicalApplications: [
      "Prioritize strength training for injury prevention",
      "Include proprioception/balance work",
      "Don't rely on stretching alone",
      "Comprehensive programs are best",
    ],
    effectSize: "69% reduction with strength training",
    sampleSize: "Meta-analysis of 25 studies, 26,610 participants",
    sportContext: "All sports",
    evidenceLevel: "meta_analysis",
    tags: ["strength training", "injury prevention", "proprioception"],
  },
  {
    id: "brughelli_2008",
    authors: "Brughelli, M., Cronin, J., Levin, G., & Chaouachi, A.",
    year: 2008,
    title:
      "Understanding Change of Direction Ability in Sport: A Review of Resistance Training Studies",
    journal: "Sports Medicine",
    volume: "38",
    pages: "1045-1063",
    doi: "10.2165/00007256-200838120-00007",
    category: "injury_prevention",
    subcategory: "change_of_direction",
    keyFindings: [
      "COD requires eccentric strength, reactive strength, and technique",
      "Deceleration is the injury risk phase",
      "Eccentric training improves COD and reduces injury risk",
      "Single-leg strength is critical",
    ],
    practicalApplications: [
      "Train deceleration specifically",
      "Include eccentric exercises (Nordic curls, single-leg squats)",
      "Practice COD technique",
      "Single-leg strength training essential",
    ],
    sportContext: "All sports with cutting",
    evidenceLevel: "meta_analysis",
    tags: ["change of direction", "deceleration", "eccentric", "COD"],
  },
  {
    id: "milewski_2014",
    authors:
      "Milewski, M.D., Skaggs, D.L., Bishop, G.A., Pace, J.L., Ibrahim, D.A., Wren, T.A., & Barzdukas, A.",
    year: 2014,
    title:
      "Chronic lack of sleep is associated with increased sports injuries in adolescent athletes",
    journal: "Journal of Pediatric Orthopaedics",
    volume: "34",
    pages: "129-133",
    doi: "10.1097/BPO.0000000000000151",
    category: "recovery_sleep",
    subcategory: "injury_risk",
    keyFindings: [
      "Athletes sleeping <8 hours have 1.7x higher injury risk",
      "Sleep is a modifiable injury risk factor",
      "Effect is independent of training load",
      "Adolescents may need 9+ hours",
    ],
    practicalApplications: [
      "Prioritize 8+ hours sleep for injury prevention",
      "Monitor sleep as part of athlete wellness",
      "Educate athletes on sleep importance",
      "Adjust training if sleep is compromised",
    ],
    effectSize: "1.7x injury risk with <8 hours sleep",
    sampleSize: "112 adolescent athletes",
    sportContext: "Multiple sports",
    evidenceLevel: "cohort_study",
    tags: ["sleep", "injury risk", "recovery"],
  },

  // ============================================================================
  // RECOVERY & SLEEP
  // ============================================================================
  {
    id: "halson_2014",
    authors: "Halson, S.L.",
    year: 2014,
    title:
      "Sleep in Elite Athletes and Nutritional Interventions to Enhance Sleep",
    journal: "Sports Medicine",
    volume: "44",
    pages: "S13-S23",
    doi: "10.1007/s40279-014-0147-0",
    category: "recovery_sleep",
    keyFindings: [
      "Athletes need 7-9 hours of sleep (more than general population)",
      "Sleep quality is as important as quantity",
      "Travel and competition disrupt sleep",
      "Nutritional strategies can improve sleep",
    ],
    practicalApplications: [
      "Target 8-9 hours for athletes",
      "Focus on sleep quality (dark, cool room)",
      "Plan for travel-related sleep disruption",
      "Consider tart cherry juice for sleep improvement",
    ],
    sportContext: "Elite athletes",
    evidenceLevel: "expert_consensus",
    tags: ["sleep", "recovery", "nutrition", "elite athletes"],
  },
  {
    id: "fullagar_2015",
    authors:
      "Fullagar, H.H., Skorski, S., Duffield, R., Hammes, D., Coutts, A.J., & Meyer, T.",
    year: 2015,
    title:
      "Sleep and Athletic Performance: The Effects of Sleep Loss on Exercise Performance, and Physiological and Cognitive Responses to Exercise",
    journal: "Sports Medicine",
    volume: "45",
    pages: "161-186",
    doi: "10.1007/s40279-014-0260-0",
    category: "recovery_sleep",
    keyFindings: [
      "Sleep loss impairs reaction time by up to 300%",
      "Submaximal exercise is less affected than maximal efforts",
      "Cognitive function is highly sensitive to sleep loss",
      "One night of poor sleep has measurable effects",
    ],
    practicalApplications: [
      "Protect sleep before competition",
      "Reaction-dependent sports most affected",
      "Naps can partially compensate",
      "Cognitive tasks (decision-making) suffer most",
    ],
    effectSize: "Up to 300% decrease in reaction time",
    sportContext: "All sports",
    evidenceLevel: "meta_analysis",
    tags: ["sleep loss", "performance", "reaction time", "cognition"],
  },
  {
    id: "mah_2011",
    authors: "Mah, C.D., Mah, K.E., Kezirian, E.J., & Dement, W.C.",
    year: 2011,
    title:
      "The Effects of Sleep Extension on the Athletic Performance of Collegiate Basketball Players",
    journal: "Sleep",
    volume: "34",
    pages: "943-950",
    doi: "10.5665/SLEEP.1132",
    category: "recovery_sleep",
    keyFindings: [
      "Sleep extension (10+ hours) improves sprint times",
      "Shooting accuracy improved 9%",
      "Reaction time improved",
      "Mood and fatigue improved",
    ],
    practicalApplications: [
      "Extend sleep during heavy training periods",
      "Target 10 hours during competition prep",
      "Sleep banking before tournaments",
      "Naps count toward total sleep",
    ],
    effectSize: "9% improvement in shooting accuracy",
    sampleSize: "11 Stanford basketball players",
    sportContext: "Basketball",
    evidenceLevel: "cohort_study",
    tags: ["sleep extension", "performance", "basketball"],
  },
  {
    id: "vitale_2019",
    authors: "Vitale, K.C., Owens, R., Hopkins, S.R., & Malhotra, A.",
    year: 2019,
    title:
      "Sleep Hygiene for Optimizing Recovery in Athletes: Review and Recommendations",
    journal: "International Journal of Sports Medicine",
    volume: "40",
    pages: "535-543",
    doi: "10.1055/a-0905-3103",
    category: "recovery_sleep",
    keyFindings: [
      "Sleep hygiene practices improve sleep quality",
      "Consistent bed/wake times are critical",
      "Screen time before bed disrupts sleep",
      "Room temperature affects sleep quality",
    ],
    practicalApplications: [
      "Consistent sleep schedule (±30 min)",
      "No screens 1 hour before bed",
      "Cool room (65-68°F / 18-20°C)",
      "Dark room (blackout curtains)",
      "Avoid caffeine after 2pm",
    ],
    sportContext: "All athletes",
    evidenceLevel: "expert_consensus",
    tags: ["sleep hygiene", "recovery", "sleep quality"],
  },
  {
    id: "kellmann_2018",
    authors:
      "Kellmann, M., Bertollo, M., Bosquet, L., Brink, M., Coutts, A.J., Duffield, R., Erlacher, D., Halson, S.L., Hecksteden, A., Heidari, J., Kallus, K.W., Meeusen, R., Mujika, I., Robazza, C., Skorski, S., Venter, R., & Beckmann, J.",
    year: 2018,
    title: "Recovery and Performance in Sport: Consensus Statement",
    journal: "International Journal of Sports Physiology and Performance",
    volume: "13",
    pages: "240-245",
    doi: "10.1123/ijspp.2017-0759",
    category: "recovery_sleep",
    keyFindings: [
      "Recovery is multi-dimensional (physical, psychological, social)",
      "Individual responses to recovery strategies vary",
      "Monitoring recovery is essential",
      "Sleep is the most important recovery strategy",
    ],
    practicalApplications: [
      "Prioritize sleep above all other recovery",
      "Monitor recovery with validated tools",
      "Individualize recovery strategies",
      "Consider psychological recovery needs",
    ],
    sportContext: "All sports",
    evidenceLevel: "expert_consensus",
    tags: ["recovery", "consensus", "monitoring", "sleep"],
  },

  // ============================================================================
  // AGE-RELATED ADAPTATIONS
  // ============================================================================
  {
    id: "fell_williams_2008",
    authors: "Fell, J., & Williams, D.",
    year: 2008,
    title:
      "The effect of aging on skeletal-muscle recovery from exercise: possible implications for aging athletes",
    journal: "Journal of Aging and Physical Activity",
    volume: "16",
    pages: "97-115",
    category: "age_adaptations",
    keyFindings: [
      "Recovery time increases ~10% per decade after age 30",
      "Eccentric exercise recovery is particularly affected",
      "Muscle damage markers remain elevated longer",
      "Protein synthesis response is blunted",
    ],
    practicalApplications: [
      "Increase recovery time for masters athletes",
      "More days between high-intensity sessions",
      "Higher protein intake needed",
      "Eccentric training requires extra recovery",
    ],
    effectSize: "~10% increase in recovery time per decade",
    sportContext: "Masters athletes",
    evidenceLevel: "meta_analysis",
    tags: ["aging", "recovery", "masters athletes"],
  },
  {
    id: "tanaka_seals_2008",
    authors: "Tanaka, H., & Seals, D.R.",
    year: 2008,
    title:
      "Endurance exercise performance in Masters athletes: age-associated changes and underlying physiological mechanisms",
    journal: "Journal of Physiology",
    volume: "586",
    pages: "55-63",
    doi: "10.1113/jphysiol.2007.141879",
    category: "age_adaptations",
    keyFindings: [
      "VO2max declines ~10% per decade after 25",
      "Decline is less in trained individuals",
      "Training can offset 50% of age-related decline",
      "Masters athletes maintain higher function than sedentary peers",
    ],
    practicalApplications: [
      "Continued training slows age-related decline",
      "Adjust expectations with age",
      "Quality training more important than quantity",
      "Maintain training throughout life",
    ],
    effectSize: "~10% VO2max decline per decade (less in trained)",
    sportContext: "Endurance sports, masters athletes",
    evidenceLevel: "meta_analysis",
    tags: ["aging", "VO2max", "masters athletes", "endurance"],
  },
  {
    id: "doering_2016",
    authors: "Doering, T.M., Reaburn, P.R., Phillips, S.M., & Jenkins, D.G.",
    year: 2016,
    title:
      "Postexercise Dietary Protein Strategies to Maximize Skeletal Muscle Repair and Remodeling in Masters Endurance Athletes: A Review",
    journal: "International Journal of Sport Nutrition and Exercise Metabolism",
    volume: "26",
    pages: "168-178",
    doi: "10.1123/ijsnem.2015-0102",
    category: "age_adaptations",
    subcategory: "nutrition",
    keyFindings: [
      "Masters athletes need higher protein (1.6-2.2g/kg/day)",
      "Anabolic resistance requires more protein per meal",
      "Leucine content is critical (2.5-3g per meal)",
      "Protein timing remains important",
    ],
    practicalApplications: [
      "Increase protein to 1.6-2.2g/kg/day for masters",
      "Include 2.5-3g leucine per meal",
      "Post-workout protein within 2 hours",
      "Distribute protein evenly across meals",
    ],
    effectSize: "40% higher protein needs in masters athletes",
    sportContext: "Masters endurance athletes",
    evidenceLevel: "expert_consensus",
    tags: ["protein", "masters athletes", "nutrition", "leucine"],
  },
  {
    id: "reaburn_dascombe_2008",
    authors: "Reaburn, P., & Dascombe, B.",
    year: 2008,
    title: "Endurance performance in masters athletes",
    journal: "European Review of Aging and Physical Activity",
    volume: "5",
    pages: "31-42",
    doi: "10.1007/s11556-008-0029-2",
    category: "age_adaptations",
    keyFindings: [
      "Performance decline accelerates after 70",
      "Strength training preserves performance in masters",
      "Recovery strategies become more important",
      "Training consistency is key for masters athletes",
    ],
    practicalApplications: [
      "Include strength training for masters athletes",
      "Prioritize recovery strategies",
      "Maintain consistent training (avoid long breaks)",
      "Adjust volume before intensity",
    ],
    sportContext: "Masters athletes",
    evidenceLevel: "meta_analysis",
    tags: ["masters athletes", "aging", "performance decline"],
  },
  {
    id: "easthope_2010",
    authors:
      "Easthope, C.S., Hausswirth, C., Louis, J., Lepers, R., Vercruyssen, F., & Brisswalter, J.",
    year: 2010,
    title:
      "Effects of a trail running competition on muscular performance and efficiency in well-trained young and master athletes",
    journal: "European Journal of Applied Physiology",
    volume: "110",
    pages: "1107-1116",
    doi: "10.1007/s00421-010-1597-1",
    category: "age_adaptations",
    keyFindings: [
      "Masters athletes show greater muscle damage markers",
      "Recovery of force production is slower",
      "Eccentric exercise particularly challenging",
      "Well-trained masters still perform well",
    ],
    practicalApplications: [
      "Extra recovery time after eccentric exercise",
      "Gradual progression of downhill/eccentric work",
      "Monitor muscle soreness in masters athletes",
      "Longer taper before competition",
    ],
    sportContext: "Trail running, masters athletes",
    evidenceLevel: "cohort_study",
    tags: ["masters athletes", "eccentric", "muscle damage", "recovery"],
  },

  // ============================================================================
  // PERIODIZATION
  // ============================================================================
  {
    id: "mujika_padilla_2003",
    authors: "Mujika, I., & Padilla, S.",
    year: 2003,
    title: "Scientific Bases for Precompetition Tapering Strategies",
    journal: "Medicine & Science in Sports & Exercise",
    volume: "35",
    pages: "1182-1187",
    doi: "10.1249/01.MSS.0000074448.73931.11",
    category: "periodization",
    subcategory: "tapering",
    keyFindings: [
      "Reduce volume 40-60% during taper",
      "Maintain intensity (critical)",
      "Taper duration: 1-4 weeks depending on sport",
      "Exponential taper is most effective",
    ],
    practicalApplications: [
      "Reduce volume by 40-60% before competition",
      "Keep intensity high (>90%)",
      "2-week taper for most team sports",
      "Gradual reduction, not sudden",
    ],
    effectSize: "2-3% performance improvement with proper taper",
    sportContext: "All sports",
    evidenceLevel: "meta_analysis",
    tags: ["tapering", "periodization", "competition prep"],
  },
  {
    id: "issurin_2010",
    authors: "Issurin, V.B.",
    year: 2010,
    title:
      "New Horizons for the Methodology and Physiology of Training Periodization",
    journal: "Sports Medicine",
    volume: "40",
    pages: "189-206",
    doi: "10.2165/11319770-000000000-00000",
    category: "periodization",
    keyFindings: [
      "Block periodization allows concentrated loading",
      "Residual training effects vary by quality",
      "Strength: 30±5 days residual",
      "Speed: 5±3 days residual",
      "Aerobic endurance: 30±5 days residual",
    ],
    practicalApplications: [
      "Sequence training blocks strategically",
      "Maintain speed work close to competition",
      "Strength can be developed earlier in preparation",
      "Plan based on residual training effects",
    ],
    effectSize: "Residual effects guide periodization timing",
    sportContext: "All sports",
    evidenceLevel: "expert_consensus",
    tags: ["block periodization", "residual effects", "training planning"],
  },
  {
    id: "bompa_haff_2009",
    authors: "Bompa, T., & Haff, G.",
    year: 2009,
    title: "Periodization: Theory and Methodology of Training (5th Edition)",
    journal: "Human Kinetics",
    category: "periodization",
    keyFindings: [
      "Periodization is essential for long-term development",
      "Training should progress from general to specific",
      "Recovery is part of training",
      "Annual planning prevents overtraining",
    ],
    practicalApplications: [
      "Plan training in mesocycles (3-4 weeks)",
      "Include deload weeks",
      "Progress from general to sport-specific",
      "Annual plan with phases",
    ],
    sportContext: "All sports",
    evidenceLevel: "expert_consensus",
    tags: ["periodization", "annual planning", "mesocycles"],
  },
  {
    id: "turner_stewart_2014",
    authors: "Turner, A., & Stewart, P.",
    year: 2014,
    title: "Strength and Conditioning for Soccer Players",
    journal: "Strength & Conditioning Journal",
    volume: "36",
    pages: "1-13",
    category: "periodization",
    subcategory: "in_season",
    keyFindings: [
      "In-season maintenance: 2x/week strength preserves adaptations",
      "Quality over quantity during competition",
      "Strength can be maintained with reduced volume",
      "Don't stop strength training in-season",
    ],
    practicalApplications: [
      "Maintain 2x/week strength training in-season",
      "Reduce volume, maintain intensity",
      "Focus on compound movements",
      "Schedule around games",
    ],
    sportContext: "Soccer (applicable to flag football)",
    evidenceLevel: "expert_consensus",
    tags: ["in-season", "strength maintenance", "soccer"],
  },

  // ============================================================================
  // RETURN TO PLAY
  // ============================================================================
  {
    id: "blanch_gabbett_2016",
    authors: "Blanch, P., & Gabbett, T.J.",
    year: 2016,
    title:
      "Has the athlete trained enough to return to play safely? The acute:chronic workload ratio permits clinicians to quantify a player's risk of subsequent injury",
    journal: "British Journal of Sports Medicine",
    volume: "50",
    pages: "471-475",
    doi: "10.1136/bjsports-2015-095445",
    category: "return_to_play",
    keyFindings: [
      "ACWR can guide return-to-play decisions",
      "Build chronic load before returning to competition",
      "Graduated return reduces re-injury risk",
      "Objective criteria better than time-based return",
    ],
    practicalApplications: [
      "Use ACWR to guide return progression",
      "Build chronic load over 4+ weeks before competition",
      "Graduated return with objective milestones",
      "Don't rush return based on time alone",
    ],
    sportContext: "All sports",
    evidenceLevel: "expert_consensus",
    tags: ["return to play", "ACWR", "injury rehabilitation"],
  },
  {
    id: "ardern_2016",
    authors:
      "Ardern, C.L., Glasgow, P., Schneiders, A., Witvrouw, E., Clarsen, B., Cools, A., Gojanovic, B., Griffin, S., Khan, K.M., Moksnes, H., Mutch, S.A., Phillips, N., Reurink, G., Sadber, R., Silbernagel, K.G., Thorborg, K., Wangensteen, A., Wilk, K.E., & Bizzini, M.",
    year: 2016,
    title:
      "2016 Consensus statement on return to sport from the First World Congress in Sports Physical Therapy, Bern",
    journal: "British Journal of Sports Medicine",
    volume: "50",
    pages: "853-864",
    doi: "10.1136/bjsports-2016-096278",
    category: "return_to_play",
    keyFindings: [
      "Return to sport is a continuum, not a single decision",
      "Biological, psychological, and social factors matter",
      "Shared decision-making is essential",
      "Objective criteria should guide decisions",
    ],
    practicalApplications: [
      "Use objective return-to-sport criteria",
      "Consider psychological readiness",
      "Involve athlete in decision-making",
      "Staged return (training → practice → competition)",
    ],
    sportContext: "All sports",
    evidenceLevel: "expert_consensus",
    tags: ["return to sport", "consensus", "rehabilitation"],
  },
  {
    id: "creighton_2010",
    authors:
      "Creighton, D.W., Shrier, I., Shultz, R., Meeuwisse, W.H., & Matheson, G.O.",
    year: 2010,
    title: "Return-to-play in sport: a decision-based model",
    journal: "Clinical Journal of Sport Medicine",
    volume: "20",
    pages: "379-385",
    doi: "10.1097/JSM.0b013e3181f3c0fe",
    category: "return_to_play",
    keyFindings: [
      "Return-to-play requires systematic decision-making",
      "Consider tissue health, sport risk, and modifiers",
      "Risk tolerance varies by situation",
      "Decision should be documented",
    ],
    practicalApplications: [
      "Use systematic return-to-play framework",
      "Assess tissue healing status",
      "Consider sport-specific demands",
      "Document all return decisions",
    ],
    sportContext: "All sports",
    evidenceLevel: "expert_consensus",
    tags: ["return to play", "decision-making", "risk assessment"],
  },
  {
    id: "taberner_cohen_2018",
    authors: "Taberner, M., & Cohen, D.D.",
    year: 2018,
    title:
      "Physical preparation of the football player with an intramuscular hamstring tendon tear: clinical perspective with video demonstrations",
    journal: "British Journal of Sports Medicine",
    volume: "52",
    pages: "1275-1278",
    doi: "10.1136/bjsports-2017-098817",
    category: "return_to_play",
    subcategory: "hamstring",
    keyFindings: [
      "Progressive loading is essential for tendon healing",
      "Strength criteria should be met before return",
      "Sport-specific conditioning must be included",
      "Psychological readiness is important",
    ],
    practicalApplications: [
      "Progressive loading protocol for hamstring",
      "Strength testing before return (>90% of uninjured)",
      "Include sport-specific running/cutting",
      "Address fear of re-injury",
    ],
    sportContext: "Football",
    evidenceLevel: "case_series",
    tags: ["hamstring", "return to play", "rehabilitation"],
  },
  {
    id: "mccrory_2017",
    authors:
      "McCrory, P., Meeuwisse, W., Dvořák, J., Aubry, M., Bailes, J., Broglio, S., Cantu, R.C., Cassidy, D., Echemendia, R.J., Castellani, R.J., Davis, G.A., Ellenbogen, R., Emery, C., Engebretsen, L., Feddermann-Demont, N., Giza, C.C., Guskiewicz, K.M., Herring, S., Iverson, G.L., Johnston, K.M., Kissick, J., Kutcher, J., Leddy, J.J., Maddocks, D., Makdissi, M., Manley, G.T., McCrea, M., Meehan, W.P., Nagahiro, S., Patricios, J., Putukian, M., Schneider, K.J., Sills, A., Tator, C.H., Turner, M., & Vos, P.E.",
    year: 2017,
    title:
      "Consensus statement on concussion in sport—the 5th international conference on concussion in sport held in Berlin, October 2016",
    journal: "British Journal of Sports Medicine",
    volume: "51",
    pages: "838-847",
    doi: "10.1136/bjsports-2017-097699",
    category: "return_to_play",
    subcategory: "concussion",
    keyFindings: [
      "Graduated return-to-sport protocol is standard",
      "Minimum 24 hours at each stage",
      "Medical clearance required before contact",
      "Symptom return = go back one stage",
    ],
    practicalApplications: [
      "Follow 6-stage graduated return protocol",
      "24 hours minimum at each stage",
      "No contact until medically cleared",
      "Return to previous stage if symptoms return",
    ],
    sportContext: "All sports",
    evidenceLevel: "expert_consensus",
    tags: ["concussion", "return to play", "consensus"],
  },

  // ============================================================================
  // STRENGTH & POWER
  // ============================================================================
  {
    id: "suchomel_2016",
    authors: "Suchomel, T.J., Nimphius, S., & Stone, M.H.",
    year: 2016,
    title: "The Importance of Muscular Strength in Athletic Performance",
    journal: "Sports Medicine",
    volume: "46",
    pages: "1419-1449",
    doi: "10.1007/s40279-016-0486-0",
    category: "strength_power",
    keyFindings: [
      "Relative strength correlates with sprint and COD performance",
      "Stronger athletes are more powerful",
      "Strength is foundational for all athletic qualities",
      "Minimum strength thresholds exist for sport performance",
    ],
    practicalApplications: [
      "Prioritize relative strength (strength/bodyweight)",
      "Target 2.0x bodyweight squat for elite performance",
      "Strength training improves all athletic qualities",
      "Build strength foundation before power training",
    ],
    effectSize: "Strong correlation between strength and performance",
    sportContext: "All sports",
    evidenceLevel: "meta_analysis",
    tags: ["strength", "relative strength", "athletic performance"],
  },
  {
    id: "comfort_2014",
    authors: "Comfort, P., Haigh, A., & Matthews, M.J.",
    year: 2014,
    title:
      "Are Changes in Maximal Squat Strength During Preseason Training Reflected in Changes in Sprint Performance in Rugby League Players?",
    journal: "Journal of Strength and Conditioning Research",
    volume: "28",
    pages: "772-776",
    doi: "10.1519/JSC.0b013e31829d24b2",
    category: "strength_power",
    keyFindings: [
      "Squat strength gains transfer to sprint performance",
      "Eccentric strength is critical for deceleration",
      "Strength gains during preseason improve in-season performance",
      "Relative strength matters more than absolute",
    ],
    practicalApplications: [
      "Build squat strength in preseason",
      "Include eccentric training for deceleration",
      "Track relative strength improvements",
      "Maintain strength in-season",
    ],
    sportContext: "Rugby league",
    evidenceLevel: "cohort_study",
    tags: ["squat", "sprint", "preseason", "eccentric"],
  },

  // ============================================================================
  // NUTRITION
  // ============================================================================
  {
    id: "kerksick_2017",
    authors:
      "Kerksick, C.M., Arent, S., Schoenfeld, B.J., Stout, J.R., Campbell, B., Wilborn, C.D., Taylor, L., Kalman, D., Smith-Ryan, A.E., Kreider, R.B., Willoughby, D., Arciero, P.J., VanDusseldorp, T.A., Ormsbee, M.J., Wildman, R., Greenwood, M., Ziegenfuss, T.N., Aragon, A.A., & Antonio, J.",
    year: 2017,
    title:
      "International society of sports nutrition position stand: nutrient timing",
    journal: "Journal of the International Society of Sports Nutrition",
    volume: "14",
    pages: "33",
    doi: "10.1186/s12970-017-0189-4",
    category: "nutrition",
    keyFindings: [
      "Protein timing around training enhances adaptation",
      "0.4-0.5g/kg protein per meal optimal",
      "Carbohydrate timing affects glycogen replenishment",
      "Total daily intake more important than timing",
    ],
    practicalApplications: [
      "Consume protein within 2 hours of training",
      "0.4-0.5g/kg protein per meal",
      "Carbohydrates post-workout for glycogen",
      "Prioritize total daily intake first",
    ],
    sportContext: "All sports",
    evidenceLevel: "expert_consensus",
    tags: ["protein", "nutrient timing", "carbohydrates"],
  },
  {
    id: "thomas_2016",
    authors: "Thomas, D.T., Erdman, K.A., & Burke, L.M.",
    year: 2016,
    title:
      "Position of the Academy of Nutrition and Dietetics, Dietitians of Canada, and the American College of Sports Medicine: Nutrition and Athletic Performance",
    journal: "Journal of the Academy of Nutrition and Dietetics",
    volume: "116",
    pages: "501-528",
    doi: "10.1016/j.jand.2015.12.006",
    category: "nutrition",
    keyFindings: [
      "Athletes need 1.2-2.0g/kg/day protein",
      "Carbohydrate needs vary by training load",
      "Hydration is critical for performance",
      "Micronutrient deficiencies impair performance",
    ],
    practicalApplications: [
      "Protein: 1.2-2.0g/kg/day depending on goals",
      "Carbohydrates: 3-12g/kg/day based on training",
      "Hydration: monitor urine color",
      "Consider vitamin D, iron status",
    ],
    sportContext: "All sports",
    evidenceLevel: "expert_consensus",
    tags: ["nutrition", "protein", "carbohydrates", "hydration"],
  },

  // ============================================================================
  // PSYCHOLOGY
  // ============================================================================
  {
    id: "saw_2016",
    authors: "Saw, A.E., Main, L.C., & Gastin, P.B.",
    year: 2016,
    title:
      "Monitoring the athlete training response: subjective self-reported measures trump commonly used objective measures: a systematic review",
    journal: "British Journal of Sports Medicine",
    volume: "50",
    pages: "281-291",
    doi: "10.1136/bjsports-2015-094758",
    category: "psychology",
    subcategory: "monitoring",
    keyFindings: [
      "Subjective measures (mood, wellness) are more sensitive than objective",
      "Athletes can self-report training response accurately",
      "Wellness questionnaires detect overreaching early",
      "Simple tools are as effective as complex ones",
    ],
    practicalApplications: [
      "Use daily wellness questionnaires",
      "Monitor mood, sleep, fatigue, soreness",
      "Trust athlete self-report",
      "Simple 1-5 scales are effective",
    ],
    sportContext: "All sports",
    evidenceLevel: "meta_analysis",
    tags: ["wellness", "monitoring", "subjective measures", "mood"],
  },
  {
    id: "sheppard_young_2006",
    authors: "Sheppard, J.M., & Young, W.B.",
    year: 2006,
    title: "Agility literature review: Classifications, training and testing",
    journal: "Journal of Sports Sciences",
    volume: "24",
    pages: "919-932",
    doi: "10.1080/02640410500457109",
    category: "sprint_training",
    subcategory: "agility",
    keyFindings: [
      "Reactive agility is different from planned agility",
      "Cognitive factors influence agility performance",
      "Sport-specific agility testing is most valid",
      "Agility is trainable",
    ],
    practicalApplications: [
      "Include reactive agility drills",
      "Use sport-specific agility tests",
      "Train decision-making with agility",
      "Progress from planned to reactive",
    ],
    sportContext: "Team sports",
    evidenceLevel: "meta_analysis",
    tags: ["agility", "reactive agility", "decision-making"],
  },
];

// ============================================================================
// TRAINING GUIDELINES
// ============================================================================

const TRAINING_GUIDELINES: TrainingGuideline[] = [
  {
    id: "acwr_monitoring",
    topic: "ACWR Monitoring",
    recommendation:
      "Monitor ACWR weekly and maintain between 0.8-1.3 for optimal injury prevention",
    evidenceStrength: "strong",
    supportingResearch: ["gabbett_2016", "hulin_2014", "hulin_2016"],
    practicalImplementation: [
      "Calculate ACWR using EWMA method",
      "Track weekly load (RPE × duration)",
      "Review ACWR before each training week",
      "Adjust training if ACWR >1.3",
    ],
    cautions: [
      "Don't let ACWR drop below 0.8 (undertrained)",
      "Avoid spikes >1.5 (high injury risk)",
      "Consider individual tolerance",
    ],
  },
  {
    id: "load_progression",
    topic: "Weekly Load Progression",
    recommendation:
      "Limit weekly load increases to 10% maximum to prevent injury",
    evidenceStrength: "strong",
    supportingResearch: ["hulin_2014", "gabbett_2016"],
    practicalImplementation: [
      "Calculate previous week's load",
      "Plan next week to be ≤110% of previous",
      "Use deload weeks (70%) every 4th week",
      "Build chronic load gradually over 4-6 weeks",
    ],
    cautions: [
      "Account for competition load",
      "Reduce if athlete is fatigued/ill",
      "More conservative for masters athletes",
    ],
  },
  {
    id: "sprint_training",
    topic: "Sprint Training Volume",
    recommendation:
      "Perform 300-600 maximal sprints annually with quality over quantity focus",
    evidenceStrength: "strong",
    supportingResearch: ["haugen_2019", "clark_2019", "petrakos_2016"],
    practicalImplementation: [
      "Prioritize 0-10m acceleration",
      "Full recovery between maximal sprints (2-3 min)",
      "15-45 sprints per week depending on phase",
      "Quality over quantity always",
    ],
    cautions: [
      "Don't sprint when fatigued",
      "Reduce volume in-season",
      "More recovery time for masters athletes",
    ],
  },
  {
    id: "hamstring_prevention",
    topic: "Hamstring Injury Prevention",
    recommendation:
      "Include Nordic curls 2-3x per week year-round to reduce hamstring injuries by 51%",
    evidenceStrength: "strong",
    supportingResearch: ["al_attar_2017", "schache_2012"],
    practicalImplementation: [
      "Nordic curls 2-3x per week",
      "Progress from 3x6 to 3x10",
      "Maintain year-round",
      "Include in warm-up or strength session",
    ],
    cautions: [
      "Start with assisted version if needed",
      "Don't perform when acutely fatigued",
      "Reduce volume if hamstring tightness",
    ],
  },
  {
    id: "sleep_optimization",
    topic: "Sleep for Athletes",
    recommendation:
      "Target 8-9 hours of sleep with consistent timing for optimal recovery and injury prevention",
    evidenceStrength: "strong",
    supportingResearch: [
      "milewski_2014",
      "halson_2014",
      "mah_2011",
      "fullagar_2015",
    ],
    practicalImplementation: [
      "8-9 hours per night",
      "Consistent bed/wake times (±30 min)",
      "Dark, cool room (65-68°F)",
      "No screens 1 hour before bed",
    ],
    cautions: [
      "Sleep needs increase with training load",
      "Travel disrupts sleep patterns",
      "Naps can supplement but not replace night sleep",
    ],
  },
  {
    id: "strength_foundation",
    topic: "Strength Training for Athletes",
    recommendation:
      "Build relative squat strength to 2.0x bodyweight for optimal athletic performance",
    evidenceStrength: "strong",
    supportingResearch: ["seitz_2014", "suchomel_2016", "comfort_2014"],
    practicalImplementation: [
      "Target 2.0x BW squat",
      "3-5 reps, 80-90% 1RM",
      "2-3x per week strength training",
      "Maintain in-season with 2x/week",
    ],
    cautions: [
      "Build gradually over months",
      "Technique before load",
      "Individual variation in optimal strength levels",
    ],
  },
  {
    id: "masters_recovery",
    topic: "Recovery for Masters Athletes",
    recommendation:
      "Increase recovery time by 30-50% for athletes over 35 and prioritize sleep and nutrition",
    evidenceStrength: "moderate",
    supportingResearch: [
      "fell_williams_2008",
      "tanaka_seals_2008",
      "doering_2016",
    ],
    practicalImplementation: [
      "2 days between high-intensity sessions (vs 1 for younger)",
      "Higher protein intake (1.6-2.2g/kg)",
      "Extended warm-up (20-25 min)",
      "More emphasis on mobility work",
    ],
    cautions: [
      "Individual variation is significant",
      "Training age can offset chronological age",
      "Don't reduce intensity, reduce volume",
    ],
  },
  {
    id: "tapering",
    topic: "Pre-Competition Tapering",
    recommendation:
      "Reduce volume by 40-60% while maintaining intensity for 1-2 weeks before major competition",
    evidenceStrength: "strong",
    supportingResearch: ["mujika_padilla_2003", "issurin_2010"],
    practicalImplementation: [
      "Reduce volume 40-60%",
      "Maintain intensity (>90%)",
      "1-2 week taper for team sports",
      "Gradual reduction, not sudden",
    ],
    cautions: [
      "Don't reduce intensity",
      "Maintain some training stimulus",
      "Individual response varies",
    ],
  },
];

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class EvidenceKnowledgeBaseService {
  /**
   * Get all research references
   */
  getAllReferences(): ResearchReference[] {
    return RESEARCH_DATABASE;
  }

  /**
   * Get reference by ID
   */
  getReferenceById(id: string): ResearchReference | undefined {
    return RESEARCH_DATABASE.find((r) => r.id === id);
  }

  /**
   * Get references by category
   */
  getReferencesByCategory(category: ResearchCategory): ResearchReference[] {
    return RESEARCH_DATABASE.filter((r) => r.category === category);
  }

  /**
   * Get references by tag
   */
  getReferencesByTag(tag: string): ResearchReference[] {
    return RESEARCH_DATABASE.filter((r) =>
      r.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())),
    );
  }

  /**
   * Get references by evidence level
   */
  getReferencesByEvidenceLevel(level: EvidenceLevel): ResearchReference[] {
    return RESEARCH_DATABASE.filter((r) => r.evidenceLevel === level);
  }

  /**
   * Search references by keyword
   */
  searchReferences(keyword: string): ResearchReference[] {
    const lowerKeyword = keyword.toLowerCase();
    return RESEARCH_DATABASE.filter(
      (r) =>
        r.title.toLowerCase().includes(lowerKeyword) ||
        r.authors.toLowerCase().includes(lowerKeyword) ||
        r.keyFindings.some((f) => f.toLowerCase().includes(lowerKeyword)) ||
        r.tags.some((t) => t.toLowerCase().includes(lowerKeyword)),
    );
  }

  /**
   * Get all training guidelines
   */
  getAllGuidelines(): TrainingGuideline[] {
    return TRAINING_GUIDELINES;
  }

  /**
   * Get guideline by ID
   */
  getGuidelineById(id: string): TrainingGuideline | undefined {
    return TRAINING_GUIDELINES.find((g) => g.id === id);
  }

  /**
   * Get guidelines with strong evidence
   */
  getStrongEvidenceGuidelines(): TrainingGuideline[] {
    return TRAINING_GUIDELINES.filter((g) => g.evidenceStrength === "strong");
  }

  /**
   * Get supporting references for a guideline
   */
  getGuidelineReferences(guidelineId: string): ResearchReference[] {
    const guideline = this.getGuidelineById(guidelineId);
    if (!guideline) return [];
    return guideline.supportingResearch
      .map((id) => this.getReferenceById(id))
      .filter((r): r is ResearchReference => r !== undefined);
  }

  /**
   * Get citation in APA format
   */
  getAPACitation(referenceId: string): string {
    const ref = this.getReferenceById(referenceId);
    if (!ref) return "";

    let citation = `${ref.authors} (${ref.year}). ${ref.title}. `;
    citation += `*${ref.journal}*`;
    if (ref.volume) citation += `, ${ref.volume}`;
    if (ref.pages) citation += `, ${ref.pages}`;
    citation += ".";
    if (ref.doi) citation += ` https://doi.org/${ref.doi}`;

    return citation;
  }

  /**
   * Get all citations for a category
   */
  getCategoryBibliography(category: ResearchCategory): string[] {
    return this.getReferencesByCategory(category).map((r) =>
      this.getAPACitation(r.id),
    );
  }

  /**
   * Get practical applications for a topic
   */
  getPracticalApplications(topic: string): string[] {
    const references = this.searchReferences(topic);
    const applications: string[] = [];

    references.forEach((ref) => {
      applications.push(...ref.practicalApplications);
    });

    return [...new Set(applications)]; // Remove duplicates
  }

  /**
   * Get key findings summary for a topic
   */
  getKeyFindingsSummary(
    topic: string,
  ): { reference: string; finding: string }[] {
    const references = this.searchReferences(topic);
    const findings: { reference: string; finding: string }[] = [];

    references.forEach((ref) => {
      ref.keyFindings.forEach((finding) => {
        findings.push({
          reference: `${ref.authors.split(",")[0]} et al. (${ref.year})`,
          finding,
        });
      });
    });

    return findings;
  }

  /**
   * Get evidence summary for a specific protocol
   */
  getProtocolEvidence(protocol: string): ProtocolEvidence | null {
    const protocols: Record<string, ProtocolEvidence> = {
      nordic_curls: {
        protocol: "Nordic Hamstring Curls",
        description: "Eccentric hamstring exercise for injury prevention",
        effectivenessRating: 9,
        references: ["al_attar_2017", "schache_2012"],
        keyMetrics: [
          "51% reduction in hamstring injuries",
          "2-3x per week optimal",
        ],
        implementationNotes: [
          "Progress from 3x6 to 3x10 over 8 weeks",
          "Can be assisted initially",
          "Maintain year-round",
        ],
      },
      acwr_monitoring: {
        protocol: "ACWR Monitoring",
        description: "Acute:Chronic Workload Ratio for injury prevention",
        effectivenessRating: 9,
        references: [
          "gabbett_2016",
          "hulin_2014",
          "hulin_2016",
          "williams_2017",
        ],
        keyMetrics: ["0.8-1.3 optimal zone", "2-4x injury risk when >1.5"],
        implementationNotes: [
          "Use EWMA calculation method",
          "Monitor weekly",
          "Adjust training based on ACWR",
        ],
      },
      sleep_extension: {
        protocol: "Sleep Extension",
        description: "Increasing sleep duration for performance",
        effectivenessRating: 8,
        references: ["mah_2011", "halson_2014", "milewski_2014"],
        keyMetrics: ["9% improvement in accuracy", "1.7x injury risk with <8h"],
        implementationNotes: [
          "Target 9-10 hours during heavy training",
          "Consistent bed/wake times",
          "Sleep banking before competition",
        ],
      },
      resisted_sprints: {
        protocol: "Resisted Sprint Training",
        description: "Sled sprints for acceleration development",
        effectivenessRating: 8,
        references: ["petrakos_2016", "morin_samozino_2016"],
        keyMetrics: ["2-3% improvement in 10m times", "10-20% BW load optimal"],
        implementationNotes: [
          "Don't exceed 20% bodyweight",
          "Focus on 10-20m distances",
          "Combine with unresisted sprints",
        ],
      },
    };

    return protocols[protocol] || null;
  }

  /**
   * Get category statistics
   */
  getCategoryStats(): Record<ResearchCategory, number> {
    const stats: Partial<Record<ResearchCategory, number>> = {};
    RESEARCH_DATABASE.forEach((ref) => {
      stats[ref.category] = (stats[ref.category] || 0) + 1;
    });
    return stats as Record<ResearchCategory, number>;
  }

  /**
   * Get total reference count
   */
  getTotalReferenceCount(): number {
    return RESEARCH_DATABASE.length;
  }

  /**
   * Get references by year range
   */
  getReferencesByYearRange(
    startYear: number,
    endYear: number,
  ): ResearchReference[] {
    return RESEARCH_DATABASE.filter(
      (r) => r.year >= startYear && r.year <= endYear,
    );
  }

  /**
   * Get most cited topics (by tag frequency)
   */
  getMostCitedTopics(): { topic: string; count: number }[] {
    const tagCounts: Record<string, number> = {};
    RESEARCH_DATABASE.forEach((ref) => {
      ref.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }
}
