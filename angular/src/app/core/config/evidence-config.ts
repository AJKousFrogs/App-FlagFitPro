/**
 * Evidence-Based Configuration System
 * 
 * Centralized configuration for all evidence-based training parameters.
 * Each config includes:
 * - Numeric values and ranges
 * - Population assumptions
 * - Supporting research citations
 * - Version information
 * 
 * This makes explicit that values are "defaults derived from research X, Y, Z"
 * and allows for versioned presets and team-specific calibration.
 */

/**
 * Population assumptions for evidence-based parameters
 */
export interface PopulationAssumptions {
  ageRange: string;              // e.g., "18-35 years"
  sportType: string;             // e.g., "5v5 flag football"
  competitionLevel: string;      // e.g., "competitive", "elite", "recreational"
  trainingFrequency: string;     // e.g., "3-6 sessions/week"
  gender?: string;               // Optional: "mixed", "male", "female"
  notes?: string;                // Additional population context
}

/**
 * Research citation for evidence-based parameters
 */
export interface ResearchCitation {
  authors: string;               // e.g., "Gabbett, T. J."
  year: number;                  // e.g., 2016
  title: string;                 // e.g., "The training—injury prevention paradox"
  journal?: string;              // Optional journal name
  doi?: string;                  // Optional DOI
  url?: string;                  // Optional URL
  notes?: string;                // Brief summary of findings
}

/**
 * Evidence-based ACWR configuration
 */
export interface ACWREvidenceConfig {
  version: string;               // e.g., "v1.0"
  population: PopulationAssumptions;
  citations: ResearchCitation[];
  
  // Window sizes
  acuteWindowDays: number;
  chronicWindowDays: number;
  
  // EWMA decay factors
  acuteLambda: number;
  chronicLambda: number;
  
  // Evidence-based thresholds (from citations)
  thresholds: {
    sweetSpotLow: number;
    sweetSpotHigh: number;
    dangerHigh: number;
    maxWeeklyIncreasePercent: number;
    maxWeeklyIncreasePercentConservative?: number;
  };
  
  // Safeguards
  minChronicLoad: number;
  minDaysForChronic: number;
  minSessionsForChronic: number;
  
  // Data quality
  dataQuality: {
    lowConfidenceThreshold: number;
    enableQualityFlags: boolean;
  };
  
  // Notes on science vs coach choice
  scienceNotes: {
    thresholds: string;          // What comes from research
    coachOverride: string;       // What coaches can adjust
  };
}

/**
 * Evidence-based Readiness configuration
 */
export interface ReadinessEvidenceConfig {
  version: string;
  population: PopulationAssumptions;
  citations: ResearchCitation[];
  
  // Component weightings (team-sport optimized)
  weightings: {
    workload: number;
    wellness: number;
    sleep: number;
    proximity: number;
  };
  
  // Cut-points (starting points - require calibration)
  cutPoints: {
    lowMax: number;
    moderateMax: number;
  };
  
  // Reduced data mode
  reducedDataMode: {
    enabled: boolean;
    wellnessCompletenessThreshold: number;
    sleepWeightMultiplier: number;
  };
  
  // Wellness index settings
  wellnessIndex: {
    use1to5Scale: boolean;
    requiredFields: string[];
    optionalFields: string[];
  };
  
  // Science vs coach choice notes
  scienceNotes: {
    weightings: string;
    cutPoints: string;
    coachOverride: string;
  };
}

/**
 * Evidence-based Tapering configuration
 */
export interface TaperingEvidenceConfig {
  version: string;
  population: PopulationAssumptions;
  citations: ResearchCitation[];
  
  // Taper duration ranges (days)
  taperDuration: {
    major: { min: number; max: number };
    high: { min: number; max: number };
    medium: { min: number; max: number };
    minor: { min: number; max: number };
  };
  
  // Volume reduction ranges
  targetVolumeReduction: {
    major: { min: number; max: number };
    high: { min: number; max: number };
    medium: { min: number; max: number };
    minor: { min: number; max: number };
  };
  
  // Intensity floor (maintain during taper)
  minIntensityFloor: number;
  maxIntensityFloor: number;
  
  // Post-overload taper
  postOverloadTaper: {
    volumeReduction: { min: number; max: number };
    duration: { min: number; max: number };
  };
  
  // Overload period before major events
  overloadPeriod: {
    duration: { min: number; max: number };
    volumeMultiplier: number;
    intensityMultiplier: number;
  };
  
  // Science vs coach choice notes
  scienceNotes: {
    taperDuration: string;
    volumeReduction: string;
    intensityFloor: string;
    coachOverride: string;
  };
}

/**
 * Evidence-based Phase definitions
 */
export interface PhaseEvidenceConfig {
  version: string;
  population: PopulationAssumptions;
  citations: ResearchCitation[];
  
  phases: {
    [phaseName: string]: {
      volumeRange: { min: number; max: number };
      intensityRange: { min: number; max: number };
      durationWeeks: { min: number; max: number };
      rationale: string;
      citations: string[]; // References to citation IDs
    };
  };
  
  scienceNotes: {
    phaseStructure: string;
    coachOverride: string;
  };
}

/**
 * Complete evidence configuration preset
 */
export interface EvidencePreset {
  id: string;                    // e.g., "adult_flag_competitive_v1"
  name: string;                  // e.g., "Adult Flag Football Competitive v1"
  version: string;               // e.g., "1.0"
  description: string;
  population: PopulationAssumptions;
  
  acwr: ACWREvidenceConfig;
  readiness: ReadinessEvidenceConfig;
  tapering: TaperingEvidenceConfig;
  phases?: PhaseEvidenceConfig;  // Optional phase definitions
  
  // Metadata
  createdAt: string;             // ISO date string
  updatedAt: string;             // ISO date string
  changelog?: string[];          // Version changelog
}

