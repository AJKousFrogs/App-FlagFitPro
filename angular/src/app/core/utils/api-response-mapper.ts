/**
 * API Response Mapper Utility
 *
 * Normalizes API responses to handle camelCase ↔ snake_case field name mismatches
 * between backend Netlify functions and frontend TypeScript interfaces.
 *
 * The backend may return either format (or both), and the frontend expects snake_case
 * for most fields to match the ProtocolJson interface.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Normalizes Daily Protocol API response
 * Maps camelCase fields from backend to snake_case expected by ProtocolJson interface
 */
export function mapDailyProtocolResponse<T>(data: T): T {
  if (!data || typeof data !== "object") return data;

  const mapped = { ...data } as any;
  const source = data as any;

  // confidence_metadata mapping (CRITICAL - affects "Check-in not logged" banner)
  if ("confidenceMetadata" in source && !("confidence_metadata" in source)) {
    mapped.confidence_metadata = source.confidenceMetadata;
  }

  // readiness_score mapping
  if ("readinessScore" in source && !("readiness_score" in source)) {
    mapped.readiness_score = source.readinessScore;
  }

  // acwr_value mapping
  if ("acwrValue" in source && !("acwr_value" in source)) {
    mapped.acwr_value = source.acwrValue;
  }

  // protocol_date mapping
  if ("protocolDate" in source && !("protocol_date" in source)) {
    mapped.protocol_date = source.protocolDate;
  }

  // session_resolution mapping
  if ("sessionResolution" in source && !("session_resolution" in source)) {
    mapped.session_resolution = source.sessionResolution;
  }

  // coach_note mapping
  if ("coachNote" in source && !("coach_note" in source)) {
    mapped.coach_note = source.coachNote;
  }

  // ai_rationale mapping
  if ("aiRationale" in source && !("ai_rationale" in source)) {
    mapped.ai_rationale = source.aiRationale;
  }

  // coach_alert fields
  if ("coachAlertActive" in source && !("coach_alert_active" in source)) {
    mapped.coach_alert_active = source.coachAlertActive;
  }
  if ("coachAlertMessage" in source && !("coach_alert_message" in source)) {
    mapped.coach_alert_message = source.coachAlertMessage;
  }
  if (
    "coachAlertRequiresAcknowledgment" in source &&
    !("coach_alert_requires_acknowledgment" in source)
  ) {
    mapped.coach_alert_requires_acknowledgment =
      source.coachAlertRequiresAcknowledgment;
  }
  if ("coachAcknowledged" in source && !("coach_acknowledged" in source)) {
    mapped.coach_acknowledged = source.coachAcknowledged;
  }

  // modified_by fields
  if ("modifiedByCoachId" in source && !("modified_by_coach_id" in source)) {
    mapped.modified_by_coach_id = source.modifiedByCoachId;
  }
  if (
    "modifiedByCoachName" in source &&
    !("modified_by_coach_name" in source)
  ) {
    mapped.modified_by_coach_name = source.modifiedByCoachName;
  }
  if ("modifiedAt" in source && !("modified_at" in source)) {
    mapped.modified_at = source.modifiedAt;
  }

  // taper fields
  if ("taperActive" in source && !("taper_active" in source)) {
    mapped.taper_active = source.taperActive;
  }
  if ("taperDaysUntil" in source && !("taper_days_until" in source)) {
    mapped.taper_days_until = source.taperDaysUntil;
  }
  if ("tournamentName" in source && !("tournament_name" in source)) {
    mapped.tournament_name = source.tournamentName;
  }

  // weather fields
  if ("weatherOverride" in source && !("weather_override" in source)) {
    mapped.weather_override = source.weatherOverride;
  }
  if ("weatherCondition" in source && !("weather_condition" in source)) {
    mapped.weather_condition = source.weatherCondition;
  }

  return mapped as T;
}

/**
 * Normalizes Wellness Check-in API response
 * Maps camelCase wellness fields to the format expected by WellnessService
 */
export function mapWellnessResponse<T>(data: T): T {
  if (!data || typeof data !== "object") return data;

  const mapped = { ...data } as any;
  const source = data as any;

  // Core wellness fields - map to short names used in frontend
  if ("sleepQuality" in source && !("sleep" in source)) {
    mapped.sleep = source.sleepQuality;
  }
  if ("sleep_quality" in source && !("sleep" in source)) {
    mapped.sleep = source.sleep_quality;
  }

  if ("energyLevel" in source && !("energy" in source)) {
    mapped.energy = source.energyLevel;
  }
  if ("energy_level" in source && !("energy" in source)) {
    mapped.energy = source.energy_level;
  }

  if ("stressLevel" in source && !("stress" in source)) {
    mapped.stress = source.stressLevel;
  }
  if ("stress_level" in source && !("stress" in source)) {
    mapped.stress = source.stress_level;
  }

  if ("muscleSoreness" in source && !("soreness" in source)) {
    mapped.soreness = source.muscleSoreness;
  }
  if ("muscle_soreness" in source && !("soreness" in source)) {
    mapped.soreness = source.muscle_soreness;
  }

  // Date field
  if ("checkinDate" in source && !("date" in source)) {
    mapped.date = source.checkinDate;
  }
  if ("checkin_date" in source && !("date" in source)) {
    mapped.date = source.checkin_date;
  }

  // Sleep hours
  if ("sleepHours" in source && !("sleepHours" in mapped)) {
    mapped.sleepHours = source.sleepHours;
  }
  if ("sleep_hours" in source && !("sleepHours" in mapped)) {
    mapped.sleepHours = source.sleep_hours;
  }

  // Readiness
  if ("calculatedReadiness" in source && !("readinessScore" in source)) {
    mapped.readinessScore = source.calculatedReadiness;
  }
  if ("calculated_readiness" in source && !("readinessScore" in source)) {
    mapped.readinessScore = source.calculated_readiness;
  }

  return mapped as T;
}

/**
 * Normalizes Training Session API response
 */
export function mapTrainingSessionResponse<T>(data: T): T {
  if (!data || typeof data !== "object") return data;

  const mapped = { ...data } as any;
  const source = data as any;

  if ("sessionType" in source && !("session_type" in source)) {
    mapped.session_type = source.sessionType;
  }

  if ("durationMinutes" in source && !("duration_minutes" in source)) {
    mapped.duration_minutes = source.durationMinutes;
  }

  if ("sessionDate" in source && !("session_date" in source)) {
    mapped.session_date = source.sessionDate;
  }

  if ("actualRpe" in source && !("actual_rpe" in source)) {
    mapped.actual_rpe = source.actualRpe;
  }

  if ("completedAt" in source && !("completed_at" in source)) {
    mapped.completed_at = source.completedAt;
  }

  if ("trainingType" in source && !("training_type" in source)) {
    mapped.training_type = source.trainingType;
  }

  if ("userId" in source && !("user_id" in source)) {
    mapped.user_id = source.userId;
  }

  if ("athleteId" in source && !("athlete_id" in source)) {
    mapped.athlete_id = source.athleteId;
  }

  return mapped as T;
}

/**
 * Normalizes Performance Data API response
 */
export function mapPerformanceDataResponse<T>(data: T): T {
  if (!data || typeof data !== "object") return data;

  const mapped = { ...data } as any;
  const source = data as any;

  // Body composition fields
  if ("bodyFat" in source && !("body_fat" in source)) {
    mapped.body_fat = source.bodyFat;
  }
  if ("muscleMass" in source && !("muscle_mass" in source)) {
    mapped.muscle_mass = source.muscleMass;
  }
  if ("bodyWaterMass" in source && !("body_water_mass" in source)) {
    mapped.body_water_mass = source.bodyWaterMass;
  }
  if ("fatMass" in source && !("fat_mass" in source)) {
    mapped.fat_mass = source.fatMass;
  }
  if ("proteinMass" in source && !("protein_mass" in source)) {
    mapped.protein_mass = source.proteinMass;
  }
  if ("boneMineralContent" in source && !("bone_mineral_content" in source)) {
    mapped.bone_mineral_content = source.boneMineralContent;
  }
  if ("skeletalMuscleMass" in source && !("skeletal_muscle_mass" in source)) {
    mapped.skeletal_muscle_mass = source.skeletalMuscleMass;
  }
  if ("musclePercentage" in source && !("muscle_percentage" in source)) {
    mapped.muscle_percentage = source.musclePercentage;
  }
  if ("bodyWaterPercentage" in source && !("body_water_percentage" in source)) {
    mapped.body_water_percentage = source.bodyWaterPercentage;
  }
  if ("proteinPercentage" in source && !("protein_percentage" in source)) {
    mapped.protein_percentage = source.proteinPercentage;
  }
  if (
    "boneMineralPercentage" in source &&
    !("bone_mineral_percentage" in source)
  ) {
    mapped.bone_mineral_percentage = source.boneMineralPercentage;
  }
  if ("visceralFatRating" in source && !("visceral_fat_rating" in source)) {
    mapped.visceral_fat_rating = source.visceralFatRating;
  }
  if ("basalMetabolicRate" in source && !("basal_metabolic_rate" in source)) {
    mapped.basal_metabolic_rate = source.basalMetabolicRate;
  }
  if ("waistToHipRatio" in source && !("waist_to_hip_ratio" in source)) {
    mapped.waist_to_hip_ratio = source.waistToHipRatio;
  }
  if ("bodyAge" in source && !("body_age" in source)) {
    mapped.body_age = source.bodyAge;
  }

  // Performance test fields
  if ("testType" in source && !("test_type" in source)) {
    mapped.test_type = source.testType;
  }
  if ("resultValue" in source && !("result_value" in source)) {
    mapped.result_value = source.resultValue;
  }
  if ("targetValue" in source && !("target_value" in source)) {
    mapped.target_value = source.targetValue;
  }
  if ("testDate" in source && !("test_date" in source)) {
    mapped.test_date = source.testDate;
  }

  // Common fields
  if ("createdAt" in source && !("created_at" in source)) {
    mapped.created_at = source.createdAt;
  }
  if ("userId" in source && !("user_id" in source)) {
    mapped.user_id = source.userId;
  }

  return mapped as T;
}

/**
 * Maps an array of items using the provided mapper function
 */
export function mapArrayResponse<T>(
  data: T[] | undefined | null,
  mapper: (item: T) => T,
): T[] {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapper);
}

/**
 * Generic API response normalizer that handles common patterns
 * Use specific mappers above for better type safety
 */
export function normalizeApiResponse<T>(
  data: T,
  fieldMappings: Record<string, string>,
): T {
  if (!data || typeof data !== "object") return data;

  const mapped = { ...data } as any;
  const source = data as any;

  for (const [camelCase, snakeCase] of Object.entries(fieldMappings)) {
    if (camelCase in source && !(snakeCase in source)) {
      mapped[snakeCase] = source[camelCase];
    }
  }

  return mapped as T;
}
