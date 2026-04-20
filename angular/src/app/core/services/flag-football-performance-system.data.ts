/**
 * Flag Football Performance System Data
 *
 * Evidence-backed defaults for elite flag football planning. This file is pure
 * data and type definitions so UI, services, and future backend endpoints can
 * share the same performance model.
 */

export type GameWeekType =
  | "training-week"
  | "single-game"
  | "doubleheader"
  | "tournament"
  | "international-tournament";

export type PerformancePhaseKey =
  | "restore"
  | "foundation"
  | "strength"
  | "power"
  | "speed"
  | "competition"
  | "taper"
  | "reload";

export type InjuryRegion =
  | "hamstring"
  | "soleus"
  | "quadriceps"
  | "achilles";

export type ProductUseCase =
  | "carbohydrate"
  | "carbohydrate-caffeine"
  | "electrolyte-carbohydrate"
  | "protein"
  | "creatine"
  | "beta-alanine"
  | "nitrate"
  | "sodium-bicarbonate";

export type BaselineCadence = "daily" | "weekly" | "monthly" | "yearly";

export type SupplementKey =
  | "protein"
  | "carbohydrate"
  | "electrolytes"
  | "caffeine"
  | "creatine"
  | "beta-alanine"
  | "nitrate"
  | "sodium-bicarbonate";

export type SupplementCategory =
  | "daily-baseline"
  | "chronic-loading"
  | "acute-performance"
  | "high-risk-optional";

export interface EvidenceReference {
  id: string;
  title: string;
  authors: string;
  year: number;
  source: string;
  url: string;
  keyFinding: string;
  application: string;
}

export interface PerformancePhase {
  key: PerformancePhaseKey;
  name: string;
  durationWeeks: number;
  objective: string;
  weeklyStructure: string[];
  strengthAndConditioning: string[];
  technicalPriorities: string[];
  loadRules: string[];
  peakingRules: string[];
  evidenceIds: string[];
}

export interface PerformanceBaseline {
  cadence: BaselineCadence;
  name: string;
  objective: string;
  actions: string[];
  thresholds: string[];
  owner: string;
  evidenceIds: string[];
}

export interface GameWeekLoadRule {
  type: GameWeekType;
  label: string;
  individualSessionCap: number;
  highIntensityCap: number;
  volumeMultiplier: number;
  competitionLoadAu: number;
  taperDays: number;
  neuralExposure: string;
  strengthDose: string;
  recoveryDose: string;
  notes: string[];
}

export interface TeamPracticeAdjustment {
  practiceCount: number;
  label: string;
  individualSessionCap: number;
  highIntensityCap: number;
  volumeMultiplier: number;
  estimatedPracticeLoadAu: number;
  notes: string[];
}

export interface CorrectiveExercise {
  name: string;
  dosage: string;
  coachingCue: string;
  progression: string;
}

export interface MovementScreen {
  test: string;
  passCriteria: string;
  riskFlag: string;
  frequency: string;
}

export interface ReturnToSportStage {
  stage: string;
  objective: string;
  entryCriteria: string;
  fieldProgression: string[];
  exitCriteria: string;
}

export interface InjuryProtocol {
  region: InjuryRegion;
  rootPattern: string;
  correctiveProtocol: CorrectiveExercise[];
  screening: MovementScreen[];
  returnToSport: ReturnToSportStage[];
  evidenceIds: string[];
}

export interface RecoveryProtocol {
  scenario: GameWeekType | "back-to-back" | "post-game" | "daily";
  name: string;
  firstHour: string[];
  sameDay: string[];
  nextDay: string[];
  loadManagement: string[];
}

export interface LaPrimaFitProduct {
  name: string;
  useCase: ProductUseCase;
  url: string;
  serving: string;
  keyNutrients: string[];
  useTiming: string;
  evidenceIds: string[];
  stockNote: string;
}

export interface SupplementStrategy {
  key: SupplementKey;
  name: string;
  category: SupplementCategory;
  decisionRule: string;
  flagFootballUseCase: string;
  protocol: string[];
  avoidWhen: string[];
  competitionRule: string;
  productNames: string[];
  evidenceIds: string[];
}

export interface NutritionProtocol {
  dailyTargets: string[];
  preTraining: string[];
  competitionDay: string[];
  betweenGames: string[];
  backToBackGames: string[];
  recoveryWindow: string[];
  supplementRules: string[];
  supplementStrategies: SupplementStrategy[];
  laPrimaFitProducts: LaPrimaFitProduct[];
  evidenceIds: string[];
}

export interface MentalRoutine {
  name: string;
  preCompetition: string[];
  thirtySecondReset: string[];
  inCompetitionCues: string[];
  thirtyDayProgram: string[];
  evidenceIds: string[];
}

export interface FlagFootballPerformanceSystem {
  phases: PerformancePhase[];
  baselines: PerformanceBaseline[];
  gameWeekRules: Record<GameWeekType, GameWeekLoadRule>;
  teamPracticeAdjustments: Record<number, TeamPracticeAdjustment>;
  injuryProtocols: Record<InjuryRegion, InjuryProtocol>;
  recoveryProtocols: RecoveryProtocol[];
  nutrition: NutritionProtocol;
  mental: MentalRoutine;
  evidence: Record<string, EvidenceReference>;
}

export const PERFORMANCE_EVIDENCE: Record<string, EvidenceReference> = {
  gabbett_2016: {
    id: "gabbett_2016",
    title: "The training-injury prevention paradox",
    authors: "Gabbett",
    year: 2016,
    source: "British Journal of Sports Medicine",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4789704/",
    keyFinding:
      "High chronic load can be protective when acute spikes are controlled.",
    application:
      "Use ACWR as a load conversation tool, not a stand-alone injury diagnosis.",
  },
  acwr_review_2020: {
    id: "acwr_review_2020",
    title: "The relationship between acute:chronic workload ratios and injury risk in sports",
    authors: "Maupin, Schram, Canetti, Orr",
    year: 2020,
    source: "Open Access Journal of Sports Medicine",
    url: "https://pubmed.ncbi.nlm.nih.gov/32158285/",
    keyFinding:
      "ACWR evidence is mixed and depends on sport, load measure, and injury definition.",
    application:
      "Pair ACWR with wellness, soreness, movement screens, and coach context.",
  },
  ioc_load_2016: {
    id: "ioc_load_2016",
    title: "IOC consensus statement on load in sport and risk of injury",
    authors: "Soligard et al.",
    year: 2016,
    source: "British Journal of Sports Medicine",
    url: "https://pubmed.ncbi.nlm.nih.gov/27535990/",
    keyFinding:
      "Poorly managed training, competition, travel, and psychological load increase risk.",
    application:
      "Flag football tournaments need load, travel, and stress monitoring in one plan.",
  },
  nordic_2019: {
    id: "nordic_2019",
    title:
      "Including the Nordic hamstring exercise in injury prevention programmes halves the rate of hamstring injuries",
    authors: "van Dyk, Behan, Whiteley",
    year: 2019,
    source: "British Journal of Sports Medicine",
    url: "https://bjsm.bmj.com/content/53/21/1362",
    keyFinding:
      "Programs including Nordic hamstring exercise reduced hamstring injuries by about half.",
    application:
      "Use low, consistent eccentric hamstring exposure instead of sporadic high-volume blocks.",
  },
  hamstring_rts_2017: {
    id: "hamstring_rts_2017",
    title: "Rehabilitation and return to sport after hamstring strain injury",
    authors: "Erickson, Sherry",
    year: 2017,
    source: "Journal of Sport and Health Science",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6189266/",
    keyFinding:
      "Return-to-sport decisions should include objective strength and near-max sport movements.",
    application:
      "Progress sprinting, cutting, jumping, and contact-free route actions before full games.",
  },
  achilles_hsr_2015: {
    id: "achilles_hsr_2015",
    title:
      "Heavy slow resistance versus eccentric training as treatment for Achilles tendinopathy",
    authors: "Beyer et al.",
    year: 2015,
    source: "American Journal of Sports Medicine",
    url: "https://pubmed.ncbi.nlm.nih.gov/26018970/",
    keyFinding:
      "Heavy slow resistance and eccentric loading are both viable loading options.",
    application:
      "Build soleus and gastrocnemius capacity with slow loaded calf work before plyometrics.",
  },
  achilles_cpg_2024: {
    id: "achilles_cpg_2024",
    title:
      "Achilles Pain, Stiffness, and Muscle Power Deficits: Midportion Achilles Tendinopathy Revision - 2024",
    authors: "Academy of Orthopaedic Physical Therapy",
    year: 2024,
    source: "APTA Clinical Practice Guideline",
    url: "https://www.apta.org/patient-care/evidence-based-practice-resources/cpgs/achilles-pain-stiffness-and-muscle-power-deficits-midportion-achilles-tendinopathy-revision-2024-cpg",
    keyFinding:
      "Guideline supports tailored clinical decision-making and progressive rehabilitation.",
    application:
      "Escalate tendon loading only when pain, morning stiffness, and function are acceptable.",
  },
  acsm_nutrition_2016: {
    id: "acsm_nutrition_2016",
    title: "Nutrition and Athletic Performance",
    authors: "Thomas, Erdman, Burke",
    year: 2016,
    source: "Medicine and Science in Sports and Exercise",
    url: "https://pubmed.ncbi.nlm.nih.gov/26891166/",
    keyFinding:
      "Carbohydrate, protein, fluid, and electrolyte plans should be matched to event demands.",
    application:
      "Use higher carbohydrate availability on high-speed, tournament, and doubleheader days.",
  },
  issn_protein_2017: {
    id: "issn_protein_2017",
    title: "International Society of Sports Nutrition Position Stand: protein and exercise",
    authors: "Jager et al.",
    year: 2017,
    source: "Journal of the International Society of Sports Nutrition",
    url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8",
    keyFinding:
      "Most exercising individuals can support adaptation with 1.4 to 2.0 g/kg/day protein.",
    application:
      "Distribute protein across meals and include a recovery serving after heavy sessions.",
  },
  issn_caffeine_2021: {
    id: "issn_caffeine_2021",
    title: "International society of sports nutrition position stand: caffeine and exercise performance",
    authors: "Guest et al.",
    year: 2021,
    source: "Journal of the International Society of Sports Nutrition",
    url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-020-00383-4",
    keyFinding:
      "Caffeine commonly improves performance at 3 to 6 mg/kg, with lower doses sometimes effective.",
    application:
      "Use small, tested doses for attention and repeated sprint quality; avoid late-day overdosing.",
  },
  issn_creatine_2017: {
    id: "issn_creatine_2017",
    title:
      "International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation",
    authors: "Kreider et al.",
    year: 2017,
    source: "Journal of the International Society of Sports Nutrition",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5469049/",
    keyFinding:
      "Creatine monohydrate supports high-intensity exercise performance and training adaptation.",
    application:
      "Use daily creatine for repeated sprints, jumps, strength, and rehab phases when appropriate.",
  },
  ais_supplement_2024: {
    id: "ais_supplement_2024",
    title: "AIS Sports Supplement Framework",
    authors: "Australian Institute of Sport",
    year: 2024,
    source: "Australian Institute of Sport",
    url: "https://www.ais.gov.au/__data/assets/pdf_file/0005/1085711/36837_AIS-sports-supplements-framework-position-statement-contextual-information.pdf",
    keyFinding:
      "Caffeine, creatine, bicarbonate, beta-alanine, nitrate, and sports foods have scenario-specific evidence.",
    application:
      "Prioritize batch-tested products and match supplements to a clear performance problem.",
  },
  ioc_supplement_2018: {
    id: "ioc_supplement_2018",
    title: "IOC Consensus Statement: Dietary Supplements and the High-Performance Athlete",
    authors: "Maughan et al.",
    year: 2018,
    source: "International Journal of Sport Nutrition and Exercise Metabolism",
    url: "https://pubmed.ncbi.nlm.nih.gov/29589768/",
    keyFinding:
      "Only a small number of supplements have good evidence, and responses vary by scenario and athlete.",
    application:
      "Use a supplement only when it solves a defined flag football performance problem and has been trialed.",
  },
  issn_beta_alanine_2015: {
    id: "issn_beta_alanine_2015",
    title: "International society of sports nutrition position stand: Beta-Alanine",
    authors: "Trexler et al.",
    year: 2015,
    source: "Journal of the International Society of Sports Nutrition",
    url: "https://pubmed.ncbi.nlm.nih.gov/26175657/",
    keyFinding:
      "Daily beta-alanine loading can raise muscle carnosine and is most relevant to high-intensity efforts lasting about 1 to 4 minutes.",
    application:
      "Consider it as a chronic block before dense tournaments, not as an acute game-day stimulant.",
  },
  beta_alanine_rsa_2026: {
    id: "beta_alanine_rsa_2026",
    title:
      "No ergogenic effect of beta-alanine on repeated sprint ability: systematic review and multilevel meta-analysis",
    authors: "Liang et al.",
    year: 2026,
    source: "Systematic review and meta-analysis",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13061858/",
    keyFinding:
      "Repeated-sprint ability benefits are uncertain when efforts are very short and phosphocreatine recovery dominates.",
    application:
      "Do not oversell beta-alanine for every flag football sprint; reserve it for repeated high-intensity fatigue blocks.",
  },
  nitrate_hiit_2023: {
    id: "nitrate_hiit_2023",
    title:
      "Effects of dietary nitrate supplementation on performance during single and repeated bouts of short-duration high-intensity exercise",
    authors: "Systematic review and meta-analysis",
    year: 2023,
    source: "Sports Medicine",
    url: "https://pubmed.ncbi.nlm.nih.gov/37371924/",
    keyFinding:
      "Dietary nitrate produced small positive effects on some high-intensity and repeated-bout outcomes.",
    application:
      "Use a 3 to 7 day nitrate trial before dense game blocks when gut response is known.",
  },
  issn_bicarbonate_2021: {
    id: "issn_bicarbonate_2021",
    title:
      "International Society of Sports Nutrition position stand: sodium bicarbonate and exercise performance",
    authors: "Grgic et al.",
    year: 2021,
    source: "Journal of the International Society of Sports Nutrition",
    url: "https://pubmed.ncbi.nlm.nih.gov/34503527/",
    keyFinding:
      "Sodium bicarbonate can support high-intensity exercise lasting about 30 seconds to 12 minutes, but GI side effects are common.",
    application:
      "Treat bicarbonate as a tested, high-risk optional tool for tournament simulation, not a default recommendation.",
  },
  imagery_meta_2025: {
    id: "imagery_meta_2025",
    title:
      "The effects of imagery practice on athletes' performance: a multilevel meta-analysis",
    authors: "Zhang et al.",
    year: 2025,
    source: "Behavioral Sciences",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12109254/",
    keyFinding:
      "Imagery practice can enhance athletic performance, especially when integrated with other psychological skills.",
    application:
      "Use short, repeated imagery sessions for routes, catches, pressure throws, and defensive reads.",
  },
  sport_psych_2022: {
    id: "sport_psych_2022",
    title: "Sport psychology and performance meta-analyses",
    authors: "Lochbaum et al.",
    year: 2022,
    source: "PLOS ONE",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8849618/",
    keyFinding:
      "Sport psychology interventions show a moderate beneficial effect on performance.",
    application:
      "Use self-talk, imagery, breathing, and goal-setting as trained skills, not game-day hacks.",
  },
  ppr_meta_2021: {
    id: "ppr_meta_2021",
    title: "The effectiveness of pre-performance routines in sports",
    authors: "Rupprecht, Tran, Gropel",
    year: 2021,
    source: "International Review of Sport and Exercise Psychology",
    url: "https://www.tandfonline.com/doi/abs/10.1080/1750984X.2021.1944271",
    keyFinding:
      "Pre-performance routines improve execution under both low-pressure and pressure conditions.",
    application:
      "Install a repeatable snap-to-snap reset before routes, pulls, throws, and catches.",
  },
};

export const PERFORMANCE_PHASES: PerformancePhase[] = [
  {
    key: "restore",
    name: "Restore and Audit",
    durationWeeks: 2,
    objective:
      "Exit the previous competition block fresh, pain-free, and technically clean.",
    weeklyStructure: [
      "2 low-intensity movement quality sessions",
      "2 tissue capacity microdoses",
      "No max sprinting unless soreness and tendon response are normal",
    ],
    strengthAndConditioning: [
      "Tempo aerobic work, trunk control, ankle and hip mobility",
      "Hamstring, soleus, quad, and Achilles isometrics",
    ],
    technicalPriorities: [
      "Low-speed route landmarks",
      "Catch mechanics without fatigue",
      "Defensive hip turn quality",
    ],
    loadRules: [
      "ACWR is tracked, but subjective pain and stiffness override progression.",
      "No weekly load increase if soreness or morning tendon stiffness is rising.",
    ],
    peakingRules: ["Do not chase speed in this phase."],
    evidenceIds: ["ioc_load_2016", "acwr_review_2020"],
  },
  {
    key: "foundation",
    name: "Foundation and Tissue Capacity",
    durationWeeks: 4,
    objective:
      "Build enough chronic load and tendon-muscle capacity to tolerate the season.",
    weeklyStructure: [
      "2 strength sessions",
      "1 acceleration mechanics session",
      "1 change-of-direction technique session",
      "Daily 8 to 12 minute tissue capacity microdose",
    ],
    strengthAndConditioning: [
      "Split squat, RDL, hip thrust, calf raise, seated soleus raise",
      "Low-amplitude pogos and snap-down landing mechanics",
    ],
    technicalPriorities: [
      "First three steps",
      "Route break posture",
      "Hands: late hands, eyes through catch, secure to tuck",
    ],
    loadRules: [
      "Build chronic load gradually before adding high-speed density.",
      "Limit high-intensity days to 2 unless team practice load is low.",
    ],
    peakingRules: ["No taper needed; build repeatability first."],
    evidenceIds: ["gabbett_2016", "nordic_2019", "achilles_hsr_2015"],
  },
  {
    key: "strength",
    name: "Relative Strength",
    durationWeeks: 4,
    objective:
      "Increase force production without adding unnecessary mass.",
    weeklyStructure: [
      "2 heavy strength sessions",
      "1 acceleration exposure",
      "1 low-volume plyometric session",
      "1 technique session if team practice count is below 2",
    ],
    strengthAndConditioning: [
      "3 to 5 reps on lower-body compound lifts",
      "Heavy slow calf and soleus work",
      "Nordic and Copenhagen progressions",
    ],
    technicalPriorities: [
      "Acceleration angle",
      "Deceleration shin angle",
      "One-step route break efficiency",
    ],
    loadRules: [
      "Keep sprint volume moderate while lifting is heavy.",
      "Avoid stacking heavy legs within 24 hours of team practice.",
    ],
    peakingRules: ["Maintain velocity quality; do not grind close to games."],
    evidenceIds: ["gabbett_2016", "achilles_hsr_2015", "hamstring_rts_2017"],
  },
  {
    key: "power",
    name: "Power and Elasticity",
    durationWeeks: 4,
    objective:
      "Convert strength into jumps, first-step speed, and violent but controlled cuts.",
    weeklyStructure: [
      "1 heavy strength maintenance session",
      "1 power session",
      "1 max velocity exposure",
      "1 reactive agility session",
    ],
    strengthAndConditioning: [
      "Jump squats, med ball throws, loaded jumps",
      "Pogos, bounds, low-contact depth drops",
      "Isometric calf and hamstring work after field speed",
    ],
    technicalPriorities: [
      "Vertical and horizontal jump mechanics",
      "Hip snap out of breaks",
      "Defensive mirror and break-on-ball decisions",
    ],
    loadRules: [
      "Plyometric contacts count as load and cannot be hidden from ACWR.",
      "If team has 3 or 4 practices, individual power becomes microdose only.",
    ],
    peakingRules: ["Keep intensity high and contacts low in the final 7 days."],
    evidenceIds: ["ioc_load_2016", "hamstring_rts_2017"],
  },
  {
    key: "speed",
    name: "Speed, COD, and Safe Hands",
    durationWeeks: 4,
    objective:
      "Peak high-speed exposure, route speed, ball skill reliability, and reaction speed.",
    weeklyStructure: [
      "1 acceleration or max velocity day",
      "1 COD and deceleration day",
      "1 strength maintenance day",
      "2 to 4 team practices replace extra individual conditioning",
    ],
    strengthAndConditioning: [
      "Low-volume heavy strength",
      "Hamstring lengthening and soleus capacity",
      "Reactive plyometrics with full rest",
    ],
    technicalPriorities: [
      "Route tree at game speed",
      "Safe hands under fatigue",
      "Flag pulls, pursuit angles, and defensive transitions",
    ],
    loadRules: [
      "Speed quality stops when mechanics degrade.",
      "No conditioning finishers after max velocity work.",
    ],
    peakingRules: [
      "Final speed exposure 72 to 96 hours before the key game.",
      "Last 48 hours are primer, mobility, hands, and tactical sharpness.",
    ],
    evidenceIds: ["gabbett_2016", "nordic_2019", "ppr_meta_2021"],
  },
  {
    key: "competition",
    name: "In-Season Performance Maintenance",
    durationWeeks: 12,
    objective:
      "Stay fast, robust, and technically sharp while games and team practices drive load.",
    weeklyStructure: [
      "1 neural speed primer",
      "1 strength maintenance or tissue capacity session",
      "Team practices count as primary sport load",
      "Recovery is scheduled, not optional",
    ],
    strengthAndConditioning: [
      "1 to 2 sets heavy enough to preserve strength",
      "Low-volume calf, soleus, hamstring, adductor, and quad work",
      "Mobility and tissue work after dense game days",
    ],
    technicalPriorities: [
      "Opponent-specific route and coverage reads",
      "Hands under fatigue",
      "Low-error situational execution",
    ],
    loadRules: [
      "Do not add individual conditioning when game density is high.",
      "Use ACWR, soreness, sleep, and movement screen flags together.",
    ],
    peakingRules: [
      "Taper by cutting volume, not intensity.",
      "Keep short, fast exposures to avoid feeling flat.",
    ],
    evidenceIds: ["ioc_load_2016", "acwr_review_2020", "acsm_nutrition_2016"],
  },
  {
    key: "taper",
    name: "Competition Week Taper",
    durationWeeks: 2,
    objective:
      "Arrive fast, springy, confident, and hungry to compete.",
    weeklyStructure: [
      "Reduce volume 40 to 60 percent",
      "Maintain short high-speed exposures",
      "No new exercises, shoes, supplements, or foods",
      "Daily mental routine and catch confidence work",
    ],
    strengthAndConditioning: [
      "1 low-volume strength primer early week",
      "1 neural primer 48 to 72 hours out",
      "Mobility, isometrics, and low-volume tissue capacity",
    ],
    technicalPriorities: [
      "First play script",
      "Red-zone and third-down execution",
      "Catch routine and pressure reset",
    ],
    loadRules: [
      "Do not compensate for missed training during taper.",
      "If ACWR is high, remove volume before removing speed quality.",
    ],
    peakingRules: [
      "Final heavy lower-body work 5 to 7 days before peak event.",
      "Final fast field touch 2 to 3 days out.",
    ],
    evidenceIds: ["ioc_load_2016", "acsm_nutrition_2016", "ppr_meta_2021"],
  },
  {
    key: "reload",
    name: "Mid-Season Reload",
    durationWeeks: 2,
    objective:
      "Refresh tissues and re-establish strength without losing speed.",
    weeklyStructure: [
      "1 strength rebuild session",
      "1 speed touch",
      "1 COD technique session",
      "More recovery than the previous competition block",
    ],
    strengthAndConditioning: [
      "Moderate heavy lower-body work",
      "Soleus and Achilles loading",
      "Low-volume plyometrics",
    ],
    technicalPriorities: [
      "Rebuild mechanics under lower fatigue",
      "Clean up error patterns from recent games",
    ],
    loadRules: [
      "Reload when chronic load is high and freshness is declining.",
      "Keep ACWR near the lower end of the sweet spot.",
    ],
    peakingRules: ["Reload is not detraining; keep short speed exposures."],
    evidenceIds: ["gabbett_2016", "acwr_review_2020"],
  },
];

export const GAME_WEEK_RULES: Record<GameWeekType, GameWeekLoadRule> = {
  "training-week": {
    type: "training-week",
    label: "Training week",
    individualSessionCap: 3,
    highIntensityCap: 2,
    volumeMultiplier: 1,
    competitionLoadAu: 0,
    taperDays: 0,
    neuralExposure: "2 high-quality speed/COD exposures with full rest.",
    strengthDose: "2 strength sessions if team practice count is 0 or 1.",
    recoveryDose: "1 full rest day plus mobility after high-intensity days.",
    notes: [
      "Use this week to build chronic load.",
      "Technique and safe hands can be trained at higher volume when games are absent.",
    ],
  },
  "single-game": {
    type: "single-game",
    label: "Single game week",
    individualSessionCap: 2,
    highIntensityCap: 1,
    volumeMultiplier: 0.85,
    competitionLoadAu: 450,
    taperDays: 3,
    neuralExposure: "1 short speed primer 48 to 72 hours before the game.",
    strengthDose: "1 low-volume strength maintenance session early week.",
    recoveryDose: "Post-game flush, protein/carbohydrate recovery, and next-day mobility.",
    notes: [
      "The game is the highest intensity session.",
      "Do not place a hard COD session inside the final 48 hours.",
    ],
  },
  doubleheader: {
    type: "doubleheader",
    label: "Doubleheader week",
    individualSessionCap: 1,
    highIntensityCap: 1,
    volumeMultiplier: 0.65,
    competitionLoadAu: 900,
    taperDays: 5,
    neuralExposure: "1 primer only; no fatigue-based speed work.",
    strengthDose: "1 micro strength dose early week or skip if ACWR is elevated.",
    recoveryDose: "Between-game refuel, cooling, mobility, and next-day restoration.",
    notes: [
      "Two games can replace all individual conditioning.",
      "Back-to-back games require stiffness management between games.",
    ],
  },
  tournament: {
    type: "tournament",
    label: "Tournament week",
    individualSessionCap: 1,
    highIntensityCap: 0,
    volumeMultiplier: 0.45,
    competitionLoadAu: 1600,
    taperDays: 10,
    neuralExposure: "1 very short speed primer 72 hours before first game.",
    strengthDose: "Tissue capacity only unless athlete is exceptionally fresh.",
    recoveryDose: "Game-by-game refuel, sodium, shade/cooling, compression, and sleep extension.",
    notes: [
      "Four games in a day are a competition-load spike even if each game is short.",
      "Tournament week is about freshness, not fitness building.",
    ],
  },
  "international-tournament": {
    type: "international-tournament",
    label: "International peak tournament",
    individualSessionCap: 1,
    highIntensityCap: 0,
    volumeMultiplier: 0.35,
    competitionLoadAu: 1800,
    taperDays: 14,
    neuralExposure: "1 to 2 micro primers depending on travel and soreness.",
    strengthDose: "No heavy lifting inside the final 5 days.",
    recoveryDose: "Travel hydration, sleep banking, daily mobility, and between-game fueling.",
    notes: [
      "Travel, national-team stress, and dense games count as load.",
      "Peak events get the most conservative volume, but speed intent stays high.",
    ],
  },
};

export const TEAM_PRACTICE_ADJUSTMENTS: Record<number, TeamPracticeAdjustment> = {
  0: {
    practiceCount: 0,
    label: "No team practice",
    individualSessionCap: 3,
    highIntensityCap: 2,
    volumeMultiplier: 1,
    estimatedPracticeLoadAu: 0,
    notes: ["Individual work can carry the training week."],
  },
  1: {
    practiceCount: 1,
    label: "1 team practice",
    individualSessionCap: 3,
    highIntensityCap: 2,
    volumeMultiplier: 0.9,
    estimatedPracticeLoadAu: 420,
    notes: ["Keep individual strength and speed, but avoid duplicate conditioning."],
  },
  2: {
    practiceCount: 2,
    label: "2 team practices",
    individualSessionCap: 2,
    highIntensityCap: 1,
    volumeMultiplier: 0.75,
    estimatedPracticeLoadAu: 840,
    notes: ["Team practice is primary sport load; individual work fills gaps."],
  },
  3: {
    practiceCount: 3,
    label: "3 team practices",
    individualSessionCap: 1,
    highIntensityCap: 1,
    volumeMultiplier: 0.55,
    estimatedPracticeLoadAu: 1260,
    notes: ["Only one meaningful individual session plus recovery microdoses."],
  },
  4: {
    practiceCount: 4,
    label: "4 team practices",
    individualSessionCap: 1,
    highIntensityCap: 0,
    volumeMultiplier: 0.4,
    estimatedPracticeLoadAu: 1680,
    notes: ["Treat individual work as prehab, primer, and recovery only."],
  },
};

export const INJURY_PROTOCOLS: Record<InjuryRegion, InjuryProtocol> = {
  hamstring: {
    region: "hamstring",
    rootPattern:
      "Repeated high-speed exposure with poor pelvic control, weak lengthened hamstrings, and fatigue-driven overstride during routes or defensive recovery runs.",
    correctiveProtocol: [
      {
        name: "Nordic hamstring lower",
        dosage: "2 sets of 3 to 5 reps, 2 times per week in-season",
        coachingCue: "Ribs down, hips tall, control the lowering phase.",
        progression: "Add reps before adding speed; never chase soreness.",
      },
      {
        name: "RDL isometric to long-lever bridge",
        dosage: "3 sets of 20 to 30 seconds",
        coachingCue: "Feel hamstring tension without lumbar extension.",
        progression: "Progress from double-leg to single-leg bridge holds.",
      },
      {
        name: "A-skip to wicket acceleration",
        dosage: "4 to 6 reps after warm-up",
        coachingCue: "Step down under hips; avoid reaching forward.",
        progression: "Move from drills to 10 to 20 m accelerations.",
      },
    ],
    screening: [
      {
        test: "Single-leg bridge endurance",
        passCriteria: "30 seconds each side with pelvis level",
        riskFlag: "Side-to-side difference greater than 10 seconds",
        frequency: "Weekly",
      },
      {
        test: "Nordic eccentric quality",
        passCriteria: "Smooth lowering without hip break",
        riskFlag: "Cramp, pain, or abrupt collapse",
        frequency: "Every 2 weeks",
      },
      {
        test: "10 m acceleration video",
        passCriteria: "No overstride and stable trunk in first 3 steps",
        riskFlag: "Foot lands far ahead of hip or pelvis rotates",
        frequency: "Every speed session",
      },
    ],
    returnToSport: [
      {
        stage: "Capacity",
        objective: "Restore pain-free isometrics and low-speed control.",
        entryCriteria: "Walking, jogging, and bridge holds are pain-free.",
        fieldProgression: ["March", "A-skip", "tempo run", "submax route stem"],
        exitCriteria: "Pain-free 70 percent acceleration and no next-day soreness spike.",
      },
      {
        stage: "Exposure",
        objective: "Reintroduce sprint and cut demands progressively.",
        entryCriteria: "Strength symmetry is acceptable and jogging is pain-free.",
        fieldProgression: ["80 percent sprint", "90 percent sprint", "planned cut", "route break"],
        exitCriteria: "Near-max sprint and planned route breaks are pain-free.",
      },
      {
        stage: "Chaos",
        objective: "Return to unpredictable flag football actions.",
        entryCriteria: "Near-max planned actions are pain-free and confidence is high.",
        fieldProgression: ["Reactive cut", "defensive mirror", "scramble route", "limited practice"],
        exitCriteria: "Full practice plus next-day response without pain or stiffness increase.",
      },
    ],
    evidenceIds: ["nordic_2019", "hamstring_rts_2017"],
  },
  soleus: {
    region: "soleus",
    rootPattern:
      "Insufficient bent-knee calf capacity for repeated accelerations, decelerations, and long tournament standing time.",
    correctiveProtocol: [
      {
        name: "Seated soleus raise",
        dosage: "4 sets of 6 to 8 reps, 3 seconds up and 3 seconds down",
        coachingCue: "Drive through big toe and keep knee stacked over foot.",
        progression: "Increase load before adding plyometrics.",
      },
      {
        name: "Bent-knee calf isometric",
        dosage: "5 sets of 30 to 45 seconds",
        coachingCue: "Hold mid-range; pain should stay tolerable and settle by next morning.",
        progression: "Move to loaded seated raises when morning stiffness is stable.",
      },
      {
        name: "Low pogo extensive contacts",
        dosage: "3 sets of 15 to 25 contacts",
        coachingCue: "Quiet contacts and stiff ankle, not high jumps.",
        progression: "Only progress contacts if next-day stiffness is unchanged.",
      },
    ],
    screening: [
      {
        test: "Bent-knee single-leg calf raise",
        passCriteria: "25 controlled reps each side",
        riskFlag: "Early fatigue, heel drop, or more than 10 percent side difference",
        frequency: "Weekly",
      },
      {
        test: "Morning calf stiffness score",
        passCriteria: "0 to 2 out of 10 and resolves quickly",
        riskFlag: "Rising stiffness for 2 consecutive mornings",
        frequency: "Daily during tournament blocks",
      },
    ],
    returnToSport: [
      {
        stage: "Load tolerance",
        objective: "Restore calf loading without next-day flare.",
        entryCriteria: "Walking and bent-knee isometrics are tolerable.",
        fieldProgression: ["Bike", "walk-jog", "tempo run"],
        exitCriteria: "25 bent-knee calf raises and 20 minutes easy run without flare.",
      },
      {
        stage: "Elastic tolerance",
        objective: "Rebuild repeated contacts.",
        entryCriteria: "Strength work is tolerated for 7 days.",
        fieldProgression: ["Low pogos", "ankle dribbles", "submax acceleration"],
        exitCriteria: "Pogos and 80 percent acceleration are tolerated next day.",
      },
      {
        stage: "Flag load",
        objective: "Return to acceleration and deceleration density.",
        entryCriteria: "Elastic contacts are tolerated.",
        fieldProgression: ["Planned cuts", "route stems", "limited practice", "game minutes cap"],
        exitCriteria: "Full practice and next-day stiffness stable.",
      },
    ],
    evidenceIds: ["achilles_hsr_2015", "achilles_cpg_2024"],
  },
  quadriceps: {
    region: "quadriceps",
    rootPattern:
      "Poor eccentric braking and hip-dominant avoidance during deceleration, causing the quad to absorb sudden stops unprepared.",
    correctiveProtocol: [
      {
        name: "Rear-foot elevated split squat eccentric",
        dosage: "3 sets of 5 reps each side with 4-second lowering",
        coachingCue: "Knee tracks over middle toes; torso tall.",
        progression: "Add load once knee control is clean.",
      },
      {
        name: "Spanish squat isometric",
        dosage: "4 sets of 30 to 45 seconds",
        coachingCue: "Sit back into strap and keep even pressure through both feet.",
        progression: "Progress duration, then load.",
      },
      {
        name: "Snap-down to stick",
        dosage: "3 sets of 4 to 6 reps",
        coachingCue: "Land quietly; knee and hip flex together.",
        progression: "Progress to lateral snap-down and planned cuts.",
      },
    ],
    screening: [
      {
        test: "Single-leg squat to box",
        passCriteria: "5 controlled reps without valgus collapse",
        riskFlag: "Knee cave, hip shift, or pain",
        frequency: "Weekly",
      },
      {
        test: "Deceleration stick from 5 m",
        passCriteria: "Stick within 2 steps with trunk and knee control",
        riskFlag: "Extra steps, knee collapse, or upright braking",
        frequency: "Every COD session",
      },
    ],
    returnToSport: [
      {
        stage: "Strength",
        objective: "Restore pain-free knee-dominant strength.",
        entryCriteria: "Pain-free squat pattern and walking stairs.",
        fieldProgression: ["Spanish squat", "split squat", "step-down"],
        exitCriteria: "Loaded split squat and step-down pain-free.",
      },
      {
        stage: "Brake",
        objective: "Rebuild eccentric deceleration.",
        entryCriteria: "Strength stage complete.",
        fieldProgression: ["Snap-down", "5 m decel", "lateral decel"],
        exitCriteria: "Planned decels at 90 percent without pain.",
      },
      {
        stage: "React",
        objective: "Return to game-speed cuts and defensive transitions.",
        entryCriteria: "Planned braking is pain-free.",
        fieldProgression: ["Reactive cut", "route break", "defensive mirror", "limited practice"],
        exitCriteria: "Full practice plus next-day response without symptoms.",
      },
    ],
    evidenceIds: ["hamstring_rts_2017", "ioc_load_2016"],
  },
  achilles: {
    region: "achilles",
    rootPattern:
      "Tendon load exceeds current calf-tendon capacity through spikes in sprinting, jumping, footwear changes, hard surfaces, and tournament density.",
    correctiveProtocol: [
      {
        name: "Mid-range standing calf raise heavy slow resistance",
        dosage: "4 sets of 6 to 8 reps, 3 seconds up and 3 seconds down",
        coachingCue: "Stay in tolerable mid-range; avoid aggressive heel drops during flare.",
        progression: "Increase load before adding speed or depth jumps.",
      },
      {
        name: "Seated soleus raise heavy slow resistance",
        dosage: "4 sets of 6 to 8 reps",
        coachingCue: "Bent knee, controlled tempo, full foot pressure.",
        progression: "Progress to single-leg loaded seated raises.",
      },
      {
        name: "Pogo reintroduction",
        dosage: "3 sets of 10 to 20 contacts",
        coachingCue: "Small amplitude and quiet ground contact.",
        progression: "Add contacts before height; monitor next-day stiffness.",
      },
    ],
    screening: [
      {
        test: "Morning Achilles stiffness",
        passCriteria: "Stable or improving trend",
        riskFlag: "Worse stiffness on 2 consecutive mornings",
        frequency: "Daily",
      },
      {
        test: "Single-leg heel raise endurance",
        passCriteria: "25 quality reps each side",
        riskFlag: "Pain, early fatigue, or large side difference",
        frequency: "Weekly",
      },
      {
        test: "Pogo response",
        passCriteria: "No symptom increase during or next morning",
        riskFlag: "Pain escalation or next-day stiffness spike",
        frequency: "Before plyometric progression",
      },
    ],
    returnToSport: [
      {
        stage: "Settle and load",
        objective: "Calm irritability while maintaining tendon stimulus.",
        entryCriteria: "Pain is tolerable and not worsening day to day.",
        fieldProgression: ["Isometrics", "bike", "walk-jog"],
        exitCriteria: "Calf raises and easy running do not worsen next-day stiffness.",
      },
      {
        stage: "Strength to elasticity",
        objective: "Build capacity before plyometrics.",
        entryCriteria: "Heavy slow resistance is tolerated.",
        fieldProgression: ["Loaded calf work", "low pogos", "submax accelerations"],
        exitCriteria: "Elastic contacts and 80 percent accelerations are tolerated.",
      },
      {
        stage: "Speed density",
        objective: "Return to sprint, jump, and COD density.",
        entryCriteria: "Pogos and submax field work are tolerated.",
        fieldProgression: ["Short sprints", "planned cuts", "limited practice", "game minutes cap"],
        exitCriteria: "Full practice and stable morning tendon response.",
      },
    ],
    evidenceIds: ["achilles_hsr_2015", "achilles_cpg_2024"],
  },
};

export const RECOVERY_PROTOCOLS: RecoveryProtocol[] = [
  {
    scenario: "daily",
    name: "Daily adaptation recovery",
    firstHour: [
      "Protein and carbohydrate after hard sessions if next session is within 24 hours.",
      "Log RPE, duration, soreness, sleep, and any tendon stiffness.",
    ],
    sameDay: [
      "8 to 12 minutes mobility: hips, calves, hamstrings, thoracic spine.",
      "Easy walk or bike flush if legs feel heavy.",
    ],
    nextDay: [
      "Morning stiffness and soreness screen before speed or jumps.",
      "Reduce load if soreness is rising and ACWR is elevated.",
    ],
    loadManagement: [
      "Adaptation requires stress plus recovery; do not fill every free day.",
    ],
  },
  {
    scenario: "post-game",
    name: "Post-game recovery",
    firstHour: [
      "Start fluids, sodium, carbohydrate, and 20 to 40 g protein.",
      "10 minutes low-intensity walking before sitting for long travel.",
    ],
    sameDay: [
      "Compression or legs-up only if it helps the athlete feel better.",
      "Light mobility before bed; avoid aggressive stretching of sore tissue.",
    ],
    nextDay: [
      "20 to 30 minutes zone 1 flush plus tissue capacity microdose.",
      "No hard sprinting if calf, Achilles, quad, or hamstring stiffness increased.",
    ],
    loadManagement: [
      "Count the game as a high-intensity load even if total minutes were low.",
    ],
  },
  {
    scenario: "back-to-back",
    name: "Back-to-back game recovery",
    firstHour: [
      "Replace carbohydrate immediately: drink mix, gel, banana, rice cake, or white bread.",
      "Sip electrolytes rather than plain water only.",
    ],
    sameDay: [
      "Stay warm but not overheated between games.",
      "Use 3 to 5 minutes mobility: calves, hip flexors, adductors, trunk rotation.",
    ],
    nextDay: [
      "Recovery only unless movement screen is clean and soreness is low.",
      "Use isometrics for tendon or muscle hot spots.",
    ],
    loadManagement: [
      "Do not add conditioning after the second game.",
      "If the second game is immediate, fueling and mental reset replace a long cooldown.",
    ],
  },
  {
    scenario: "tournament",
    name: "Tournament day recovery",
    firstHour: [
      "Begin refueling after every game, not after the final game only.",
      "Use shade, cooling towel, and dry socks/shoes if available.",
    ],
    sameDay: [
      "Small carbohydrate doses every 15 to 30 minutes between games.",
      "Keep protein moderate until the last game unless there is a long break.",
    ],
    nextDay: [
      "Mobility, hydration, protein, carbohydrate, and sleep extension.",
      "No max sprinting within 24 hours after a four-game day.",
    ],
    loadManagement: [
      "Four 2x20 games can exceed a normal training week's high-intensity exposure.",
    ],
  },
  {
    scenario: "international-tournament",
    name: "International tournament recovery",
    firstHour: [
      "Travel day hydration starts before the flight or bus.",
      "Use familiar foods and batch-tested supplements only.",
    ],
    sameDay: [
      "Anchor sleep timing to destination as early as possible.",
      "Add light mobility after long sitting before any intense primer.",
    ],
    nextDay: [
      "If travel stiffness is high, replace speed with mobility and ball skill.",
      "Use wellness and movement screens before every high-intensity exposure.",
    ],
    loadManagement: [
      "Travel stress, national-team pressure, and disrupted meals count as load.",
    ],
  },
];

export const PERFORMANCE_BASELINES: PerformanceBaseline[] = [
  {
    cadence: "daily",
    name: "Daily athlete operating check",
    objective:
      "Make every training day adjust to tissue status, fuel availability, and nervous-system freshness.",
    actions: [
      "Log sleep, soreness, mood, stress, hamstring/calf/Achilles/quad status, and session RPE.",
      "Hit protein distribution, hydration, and carbohydrate around hard work before adding supplements.",
      "Complete 8 to 12 minutes of tissue capacity or mobility after practices and games.",
      "Use the 30-second mental reset in practice so it is automatic in games.",
    ],
    thresholds: [
      "No speed or plyometric increase if morning tendon stiffness worsens on 2 consecutive days.",
      "If readiness is low and ACWR is elevated, convert extras to recovery microdose.",
      "New supplement trials only on low-risk training days.",
    ],
    owner: "Athlete with coach review",
    evidenceIds: [
      "ioc_load_2016",
      "acsm_nutrition_2016",
      "issn_protein_2017",
    ],
  },
  {
    cadence: "weekly",
    name: "Weekly load and game-density review",
    objective:
      "Protect speed and health by matching individual work to team practices, games, and travel.",
    actions: [
      "Review acute load, chronic load, ACWR, game minutes, practices, travel, and soreness trends.",
      "Decide how many individual speed, strength, COD, and recovery sessions are allowed.",
      "Plan competition fueling and between-game supplies before the week starts.",
      "Run hamstring, calf, Achilles, quad, jump, and deceleration screens.",
    ],
    thresholds: [
      "ACWR above 1.3 triggers volume reduction; above 1.5 triggers recovery-first planning.",
      "Three or four team practices plus games means individual power work becomes microdose only.",
      "Failed screen means no progression to higher sprint, jump, or COD density.",
    ],
    owner: "Performance coach",
    evidenceIds: ["gabbett_2016", "acwr_review_2020", "ioc_load_2016"],
  },
  {
    cadence: "monthly",
    name: "Monthly performance block audit",
    objective:
      "Check that training is improving the qualities that decide flag football games.",
    actions: [
      "Retest 10 m acceleration, flying sprint, broad or vertical jump, 5-0-5/COD, safe hands, and repeated-game tolerance.",
      "Audit strength markers: split squat/RDL pattern, calf/soleus capacity, hamstring eccentric tolerance.",
      "Review supplement trial logs: benefits, side effects, timing, and whether to continue.",
      "Adjust phase emphasis: tissue capacity, strength, power, speed, competition, taper, or reload.",
    ],
    thresholds: [
      "Performance drop plus soreness trend means reload before adding intensity.",
      "GI symptoms, sleep disruption, or anxiety from a supplement removes it from game plans.",
      "Beta-alanine, creatine, and other chronic tools are judged over blocks, not single sessions.",
    ],
    owner: "Performance coach plus nutrition lead",
    evidenceIds: [
      "issn_creatine_2017",
      "issn_beta_alanine_2015",
      "beta_alanine_rsa_2026",
    ],
  },
  {
    cadence: "yearly",
    name: "Yearly season architecture",
    objective:
      "Peak for the most important tournaments without losing chronic robustness across the season.",
    actions: [
      "Map off-season restore, foundation, strength, power, speed, competition, taper, and reload blocks.",
      "Choose A, B, and C events so taper depth matches tournament importance.",
      "Schedule medical screening, bloodwork where appropriate, nutrition assessment, and supplement risk review.",
      "Plan 6 to 12 week windows for chronic supplements only when they match a real performance need.",
    ],
    thresholds: [
      "No supplement replaces poor sleep, underfueling, or unmanaged sprint/COD load.",
      "International tournaments get travel, heat, food availability, and anti-doping review at least 4 weeks out.",
      "Every ergogenic aid must be practiced before it appears in a peak event plan.",
    ],
    owner: "Head coach, performance lead, medical/nutrition support",
    evidenceIds: ["ioc_supplement_2018", "ais_supplement_2024", "ioc_load_2016"],
  },
];

export const SUPPLEMENT_STRATEGIES: SupplementStrategy[] = [
  {
    key: "protein",
    name: "Protein distribution",
    category: "daily-baseline",
    decisionRule:
      "Use food first; add powder only when meals cannot hit daily protein.",
    flagFootballUseCase:
      "Supports strength adaptation, repair after tournament density, and lean mass maintenance.",
    protocol: [
      "Target 1.4 to 2.0 g/kg/day for most hard-training athletes.",
      "Distribute 0.25 to 0.4 g/kg per meal across 4 to 5 feedings.",
      "Use 20 to 40 g after the final game or hard lift when a meal is delayed.",
    ],
    avoidWhen: [
      "Known ingredient allergy or intolerance.",
      "Using shakes to replace total food quality.",
    ],
    competitionRule: "Useful after the final game; keep protein small between close games.",
    productNames: ["226ers Isolate Protein Drink"],
    evidenceIds: ["issn_protein_2017", "acsm_nutrition_2016"],
  },
  {
    key: "carbohydrate",
    name: "Carbohydrate availability",
    category: "daily-baseline",
    decisionRule:
      "Scale carbohydrate to the day's speed, strength, practice, game, and tournament load.",
    flagFootballUseCase:
      "Protects repeated sprint quality, late-game decision speed, and between-game recovery.",
    protocol: [
      "Place carbohydrate in the pre-game meal and between repeated games.",
      "Use 20 to 30 g quick carbohydrate 15 to 45 minutes before a game when needed.",
      "Use 30 to 60 g carbohydrate per hour of break time on dense tournament days if tolerated.",
    ],
    avoidWhen: [
      "Untested products before a key game.",
      "Large boluses that cause GI symptoms.",
    ],
    competitionRule: "This is the first-line tournament fuel before adding ergogenic aids.",
    productNames: [
      "Precision Fuel & Hydration PF 30 Gel",
      "Precision Fuel & Hydration Carb & Electrolyte Drink Mix",
    ],
    evidenceIds: ["acsm_nutrition_2016"],
  },
  {
    key: "electrolytes",
    name: "Sodium and fluid plan",
    category: "daily-baseline",
    decisionRule:
      "Use more sodium/fluid when heat, sweat rate, salt marks, or multiple games increase losses.",
    flagFootballUseCase:
      "Limits avoidable dehydration, cramping risk factors, and between-game performance drop.",
    protocol: [
      "Start hydrated before game one rather than chasing fluids late.",
      "Sip electrolytes between games, especially in heat or with heavy sweaters.",
      "Use body-mass change and urine color trends to personalize fluid needs.",
    ],
    avoidWhen: [
      "Medical sodium restriction unless clinician-approved.",
      "Drinking beyond thirst without sodium during long hot events.",
    ],
    competitionRule: "Prioritize sodium-containing fluids on tournament days.",
    productNames: ["Precision Fuel & Hydration Carb & Electrolyte Drink Mix"],
    evidenceIds: ["acsm_nutrition_2016"],
  },
  {
    key: "creatine",
    name: "Creatine monohydrate",
    category: "daily-baseline",
    decisionRule:
      "Use as a daily training adaptation tool when repeated sprint, jump, strength, or rehab power is a priority.",
    flagFootballUseCase:
      "Supports high-intensity training quality and repeated power development across the season.",
    protocol: [
      "Take 3 to 5 g/day with any meal or recovery shake.",
      "Do not treat it as a pre-game stimulant.",
      "Expect benefits from consistent daily intake over weeks.",
    ],
    avoidWhen: [
      "Kidney disease or relevant medical condition without clinician approval.",
      "Using a non-tested product in anti-doping environments.",
    ],
    competitionRule: "Continue daily if already tolerated; do not start it on competition day.",
    productNames: ["226ers Creatine Monohydrate"],
    evidenceIds: ["issn_creatine_2017", "ioc_supplement_2018"],
  },
  {
    key: "beta-alanine",
    name: "Beta-alanine loading",
    category: "chronic-loading",
    decisionRule:
      "Use only when a 4 to 12 week block matches repeated high-intensity fatigue demands.",
    flagFootballUseCase:
      "May help longer repeated high-intensity passages, but evidence is weaker for very short repeated sprints.",
    protocol: [
      "Load 4 to 6 g/day in divided doses for at least 4 weeks, or follow a tested product protocol.",
      "Use smaller divided doses to reduce tingling.",
      "Review after the block; stop if side effects outweigh benefit.",
    ],
    avoidWhen: [
      "Athlete dislikes paresthesia or has poor compliance.",
      "Goal is only single-sprint speed under 10 seconds.",
      "Competition is within days and no previous trial exists.",
    ],
    competitionRule: "Chronic tool only; it does not solve same-day underfueling.",
    productNames: ["Amacx Beta Alanine"],
    evidenceIds: [
      "issn_beta_alanine_2015",
      "beta_alanine_rsa_2026",
      "ais_supplement_2024",
    ],
  },
  {
    key: "nitrate",
    name: "Dietary nitrate / beetroot",
    category: "acute-performance",
    decisionRule:
      "Use a 3 to 7 day trial before tournaments if the athlete responds and tolerates it.",
    flagFootballUseCase:
      "Potential support for repeated high-intensity running, late-game power, and cognitive speed under fatigue.",
    protocol: [
      "Trial 2 to 3 hours pre-training first.",
      "For peak weeks, use 3 to 7 consecutive days if tolerated.",
      "Avoid antibacterial mouthwash around nitrate use because it can blunt nitrate conversion.",
    ],
    avoidWhen: [
      "GI symptoms or dislike of beetroot products.",
      "Low blood pressure concerns or nitrate-related medication without clinician approval.",
      "Untested use before a key event.",
    ],
    competitionRule: "Useful candidate for tournament weeks after practice testing.",
    productNames: ["226ers - NITROPRO BEETROOT"],
    evidenceIds: ["nitrate_hiit_2023", "ioc_supplement_2018"],
  },
  {
    key: "caffeine",
    name: "Caffeine",
    category: "acute-performance",
    decisionRule:
      "Use only when it improves alertness without harming sleep, anxiety, gut, or hand calmness.",
    flagFootballUseCase:
      "Can support attention, reaction, repeated sprint intent, and late-game focus.",
    protocol: [
      "Trial small doses in training before using in games.",
      "Plan timing so late games do not damage sleep and next-day recovery.",
      "Avoid stacking multiple caffeine products without tracking total intake.",
    ],
    avoidWhen: [
      "Caffeine sensitivity, anxiety spikes, palpitations, poor sleep, or clinician restriction.",
      "Late-day tournament games when sleep is the bigger performance lever.",
    ],
    competitionRule: "Optional; never required if the athlete performs better calm.",
    productNames: ["Precision Fuel & Hydration PF 30 Caffeine Gel"],
    evidenceIds: ["issn_caffeine_2021", "ioc_supplement_2018"],
  },
  {
    key: "sodium-bicarbonate",
    name: "Sodium bicarbonate",
    category: "high-risk-optional",
    decisionRule:
      "Use only after successful GI testing in hard simulation because the upside is paired with real downside risk.",
    flagFootballUseCase:
      "Potential support for repeated high-intensity bouts, but GI distress can ruin tournament performance.",
    protocol: [
      "Common evidence-based target is around 0.2 to 0.3 g/kg, with higher doses increasing side effects.",
      "Trial split dosing 2 to 8 hours before a hard session, never first time on game day.",
      "Track GI symptoms, body mass, sodium load, and perceived performance.",
    ],
    avoidWhen: [
      "Hypertension, sodium restriction, kidney disease, GI sensitivity, or relevant medication unless clinician-approved.",
      "Back-to-back games without a proven personal protocol.",
      "Hot events where high sodium plus GI upset could compromise fluid strategy.",
    ],
    competitionRule: "Optional tournament-simulation tool only; not a default flag football recommendation.",
    productNames: ["6d Sports Nutrition Sodium Bicarbonate"],
    evidenceIds: ["issn_bicarbonate_2021", "ioc_supplement_2018"],
  },
];

export const NUTRITION_PROTOCOL: NutritionProtocol = {
  dailyTargets: [
    "Protein: 1.4 to 2.0 g/kg/day for most hard-training athletes.",
    "Protein distribution: 0.25 to 0.4 g/kg per meal across 4 to 5 feedings.",
    "Carbohydrate: scale with load; higher on speed, strength, game, and tournament days.",
    "Hydration: monitor urine color, body mass changes, heat, and sweat salt marks.",
  ],
  preTraining: [
    "3 to 4 hours before: carbohydrate-dominant meal plus lean protein, low to moderate fat.",
    "30 to 60 minutes before: 20 to 30 g easy carbohydrate if hungry or session is intense.",
    "Avoid new high-fiber, high-fat, or spicy foods before speed sessions and games.",
  ],
  competitionDay: [
    "Breakfast 3 to 4 hours before first game: easy carbohydrates plus 25 to 35 g protein.",
    "Final 30 to 45 minutes: small carbohydrate dose and fluid if tolerated.",
    "Use caffeine only if tested in training and sleep impact is acceptable.",
  ],
  betweenGames: [
    "Break under 45 minutes: fluid, electrolytes, 20 to 30 g carbohydrate; skip heavy protein.",
    "Break 45 to 120 minutes: 30 to 60 g carbohydrate plus small protein if tolerated.",
    "Break over 2 hours: light meal with carbohydrate, lean protein, and low fat.",
  ],
  backToBackGames: [
    "Use gel or drink mix immediately after game one.",
    "Do not wait for appetite; nervous athletes often underfuel.",
    "Keep caffeine doses small and planned so late games do not damage sleep.",
  ],
  recoveryWindow: [
    "Within 60 minutes after final game: 20 to 40 g protein plus carbohydrate.",
    "If another game or hard practice is within 24 hours, prioritize carbohydrate replacement.",
    "Creatine is daily, not an acute stimulant; take 3 to 5 g/day if appropriate.",
  ],
  supplementRules: [
    "Use third-party tested products when possible.",
    "No new supplements on competition day.",
    "Daily baseline supplements are evaluated weekly; chronic loading supplements are evaluated by block.",
    "Beta-alanine, nitrate, and bicarbonate require training trials before tournament use.",
    "Athletes with medical conditions, medication, pregnancy, kidney disease, or caffeine sensitivity need clinician review.",
  ],
  supplementStrategies: SUPPLEMENT_STRATEGIES,
  laPrimaFitProducts: [
    {
      name: "Precision Fuel & Hydration Carb & Electrolyte Drink Mix",
      useCase: "electrolyte-carbohydrate",
      url: "https://www.laprimafit.com/hidracija/izotoniki-z-elektroliti/precision-fuel-and-hydration-carb-and-electrolyte-drink-mix",
      serving: "60 g carbohydrate and 1000 mg sodium per liter serving on product page",
      keyNutrients: ["maltodextrin", "fructose", "sodium", "potassium"],
      useTiming: "Before and during long practices, hot games, or tournament days.",
      evidenceIds: ["acsm_nutrition_2016"],
      stockNote: "Check live stock before planning team supply.",
    },
    {
      name: "Precision Fuel & Hydration PF 30 Gel",
      useCase: "carbohydrate",
      url: "https://www.laprimafit.com/pf-30-gel/precision-fuel-and-hydration-pf-30-geli",
      serving: "30 g carbohydrate per gel on product page",
      keyNutrients: ["maltodextrin", "fructose"],
      useTiming: "Between games or 15 to 30 minutes before a game when solid food is not practical.",
      evidenceIds: ["acsm_nutrition_2016"],
      stockNote: "Check live stock and athlete gut tolerance.",
    },
    {
      name: "Precision Fuel & Hydration PF 30 Caffeine Gel",
      useCase: "carbohydrate-caffeine",
      url: "https://www.laprimafit.com/en/pf-30-gels/precision-fuel-and-hydration-pf-30-caffeine-gel",
      serving: "30 g carbohydrate and 100 mg caffeine per gel on product page",
      keyNutrients: ["maltodextrin", "fructose", "caffeine"],
      useTiming: "Use before key games only when caffeine has been tested in training.",
      evidenceIds: ["issn_caffeine_2021", "acsm_nutrition_2016"],
      stockNote: "Caffeine products may be out of stock by locale; verify before purchase.",
    },
    {
      name: "226ers Isolate Protein Drink",
      useCase: "protein",
      url: "https://www.laprimafit.com/en/recovery/whey-protein/226ers-isolate-protein-drink-1kg",
      serving: "About 25 g protein per serving on product page",
      keyNutrients: ["whey protein isolate"],
      useTiming: "After final game, hard strength session, or when meal protein is insufficient.",
      evidenceIds: ["issn_protein_2017"],
      stockNote: "Contains milk/soy allergens per product page.",
    },
    {
      name: "226ers Creatine Monohydrate",
      useCase: "creatine",
      url: "https://www.laprimafit.com/en/performance/creatine-powder/226ers-creatine-monohydrate-300g",
      serving: "3 g creatine per day is described on product page",
      keyNutrients: ["creatine monohydrate"],
      useTiming: "Daily with any meal or recovery shake; not a game-day-only supplement.",
      evidenceIds: ["issn_creatine_2017", "ais_supplement_2024"],
      stockNote: "Avoid without clinician approval in kidney disease or relevant medical conditions.",
    },
    {
      name: "Amacx Beta Alanine",
      useCase: "beta-alanine",
      url: "https://www.laprimafit.com/en/amacx-beta-alanine-capsules",
      serving: "800 mg beta-alanine per tablet on product page",
      keyNutrients: ["beta-alanine"],
      useTiming: "Daily divided doses during a 4 to 12 week loading block; not acute game-day fuel.",
      evidenceIds: [
        "issn_beta_alanine_2015",
        "beta_alanine_rsa_2026",
        "ais_supplement_2024",
      ],
      stockNote: "Live stock may vary; verify before building a team block.",
    },
    {
      name: "226ers - NITROPRO BEETROOT",
      useCase: "nitrate",
      url: "https://www.laprimafit.com/en/226ers-nitropro-beetroot-nitrates",
      serving: "400 mg nitrates per serving on product page",
      keyNutrients: ["beetroot concentrate", "dietary nitrate"],
      useTiming: "Trial 2 to 3 hours pre-training; consider 3 to 7 days before peak/dense game weeks.",
      evidenceIds: ["nitrate_hiit_2023", "ioc_supplement_2018"],
      stockNote: "Use only after gut-tolerance testing and live stock check.",
    },
    {
      name: "6d Sports Nutrition Sodium Bicarbonate",
      useCase: "sodium-bicarbonate",
      url: "https://www.laprimafit.com/en/performance/no-boosters/6d-sports-nutrition-sodium-bicarbonate",
      serving: "1125 mg sodium bicarbonate per capsule on product page",
      keyNutrients: ["sodium bicarbonate"],
      useTiming: "High-risk optional: trial split dosing before hard simulations, never first time on game day.",
      evidenceIds: ["issn_bicarbonate_2021", "ioc_supplement_2018"],
      stockNote: "High sodium and GI risk; requires individual tolerance and medical review when relevant.",
    },
  ],
  evidenceIds: [
    "acsm_nutrition_2016",
    "issn_protein_2017",
    "issn_caffeine_2021",
    "issn_creatine_2017",
    "issn_beta_alanine_2015",
    "beta_alanine_rsa_2026",
    "nitrate_hiit_2023",
    "issn_bicarbonate_2021",
    "ioc_supplement_2018",
    "ais_supplement_2024",
  ],
};

export const MENTAL_ROUTINE: MentalRoutine = {
  name: "Pressure-to-execution system",
  preCompetition: [
    "Night before: write the first three controllables for tomorrow.",
    "Arrival: 3 minutes breathing, 3 minutes imagery, 3 technical cues.",
    "Warm-up: rehearse one pressure route, one contested catch, one defensive recovery.",
    "Final 60 seconds: choose one cue for the first snap only.",
  ],
  thirtySecondReset: [
    "Exhale longer than inhale for 2 breaths.",
    "Name the situation: down, distance, score, assignment.",
    "Say one action cue: win first step, eyes through ball, or pull near hip.",
    "Physically reset: clap, wrist tape touch, or towel squeeze.",
  ],
  inCompetitionCues: [
    "Anxiety means activation; direct it to the next assignment.",
    "After an error, the only allowed analysis is correction plus next cue.",
    "Use external focus under pressure: landmark, defender hip, ball point, flag belt.",
  ],
  thirtyDayProgram: [
    "Days 1 to 7: daily 5-minute breathing plus one cue journal.",
    "Days 8 to 14: add 8-minute imagery, 3 times per week.",
    "Days 15 to 21: pressure reps in practice with score/time constraints.",
    "Days 22 to 30: rehearse full pre-game routine before every intense session.",
  ],
  evidenceIds: ["imagery_meta_2025", "sport_psych_2022", "ppr_meta_2021"],
};

export const FLAG_FOOTBALL_PERFORMANCE_SYSTEM: FlagFootballPerformanceSystem = {
  phases: PERFORMANCE_PHASES,
  baselines: PERFORMANCE_BASELINES,
  gameWeekRules: GAME_WEEK_RULES,
  teamPracticeAdjustments: TEAM_PRACTICE_ADJUSTMENTS,
  injuryProtocols: INJURY_PROTOCOLS,
  recoveryProtocols: RECOVERY_PROTOCOLS,
  nutrition: NUTRITION_PROTOCOL,
  mental: MENTAL_ROUTINE,
  evidence: PERFORMANCE_EVIDENCE,
};
