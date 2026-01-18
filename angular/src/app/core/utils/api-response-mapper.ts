/**
 * API Response Mapper Utility
 * 
 * Normalizes API responses to handle camelCase ↔ snake_case field name mismatches
 * between backend Netlify functions and frontend TypeScript interfaces.
 * 
 * The backend may return either format (or both), and the frontend expects snake_case
 * for most fields to match the ProtocolJson interface.
 */

/**
 * Maps a single field from camelCase to snake_case equivalent
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Generic type for API response with potential camelCase variants
 */
type ApiResponseData = Record<string, unknown>;

/**
 * Normalizes Daily Protocol API response
 * Maps camelCase fields from backend to snake_case expected by ProtocolJson interface
 */
export function mapDailyProtocolResponse<T extends ApiResponseData>(data: T): T {
  if (!data || typeof data !== 'object') return data;

  const mapped = { ...data } as T & Record<string, unknown>;

  // confidence_metadata mapping (CRITICAL - affects "Check-in not logged" banner)
  if ('confidenceMetadata' in data && !('confidence_metadata' in data)) {
    mapped.confidence_metadata = data.confidenceMetadata;
  }

  // readiness_score mapping
  if ('readinessScore' in data && !('readiness_score' in data)) {
    mapped.readiness_score = data.readinessScore;
  }

  // acwr_value mapping  
  if ('acwrValue' in data && !('acwr_value' in data)) {
    mapped.acwr_value = data.acwrValue;
  }

  // protocol_date mapping
  if ('protocolDate' in data && !('protocol_date' in data)) {
    mapped.protocol_date = data.protocolDate;
  }

  // session_resolution mapping
  if ('sessionResolution' in data && !('session_resolution' in data)) {
    mapped.session_resolution = data.sessionResolution;
  }

  // coach_note mapping
  if ('coachNote' in data && !('coach_note' in data)) {
    mapped.coach_note = data.coachNote;
  }

  // ai_rationale mapping
  if ('aiRationale' in data && !('ai_rationale' in data)) {
    mapped.ai_rationale = data.aiRationale;
  }

  // coach_alert fields
  if ('coachAlertActive' in data && !('coach_alert_active' in data)) {
    mapped.coach_alert_active = data.coachAlertActive;
  }
  if ('coachAlertMessage' in data && !('coach_alert_message' in data)) {
    mapped.coach_alert_message = data.coachAlertMessage;
  }
  if ('coachAlertRequiresAcknowledgment' in data && !('coach_alert_requires_acknowledgment' in data)) {
    mapped.coach_alert_requires_acknowledgment = data.coachAlertRequiresAcknowledgment;
  }
  if ('coachAcknowledged' in data && !('coach_acknowledged' in data)) {
    mapped.coach_acknowledged = data.coachAcknowledged;
  }

  // modified_by fields
  if ('modifiedByCoachId' in data && !('modified_by_coach_id' in data)) {
    mapped.modified_by_coach_id = data.modifiedByCoachId;
  }
  if ('modifiedByCoachName' in data && !('modified_by_coach_name' in data)) {
    mapped.modified_by_coach_name = data.modifiedByCoachName;
  }
  if ('modifiedAt' in data && !('modified_at' in data)) {
    mapped.modified_at = data.modifiedAt;
  }

  // taper fields
  if ('taperActive' in data && !('taper_active' in data)) {
    mapped.taper_active = data.taperActive;
  }
  if ('taperDaysUntil' in data && !('taper_days_until' in data)) {
    mapped.taper_days_until = data.taperDaysUntil;
  }
  if ('tournamentName' in data && !('tournament_name' in data)) {
    mapped.tournament_name = data.tournamentName;
  }

  // weather fields
  if ('weatherOverride' in data && !('weather_override' in data)) {
    mapped.weather_override = data.weatherOverride;
  }
  if ('weatherCondition' in data && !('weather_condition' in data)) {
    mapped.weather_condition = data.weatherCondition;
  }

  return mapped as T;
}

/**
 * Normalizes Wellness Check-in API response
 * Maps camelCase wellness fields to the format expected by WellnessService
 */
export function mapWellnessResponse<T extends ApiResponseData>(data: T): T {
  if (!data || typeof data !== 'object') return data;

  const mapped = { ...data } as T & Record<string, unknown>;

  // Core wellness fields - map to short names used in frontend
  if ('sleepQuality' in data && !('sleep' in data)) {
    mapped.sleep = data.sleepQuality;
  }
  if ('sleep_quality' in data && !('sleep' in data)) {
    mapped.sleep = data.sleep_quality;
  }

  if ('energyLevel' in data && !('energy' in data)) {
    mapped.energy = data.energyLevel;
  }
  if ('energy_level' in data && !('energy' in data)) {
    mapped.energy = data.energy_level;
  }

  if ('stressLevel' in data && !('stress' in data)) {
    mapped.stress = data.stressLevel;
  }
  if ('stress_level' in data && !('stress' in data)) {
    mapped.stress = data.stress_level;
  }

  if ('muscleSoreness' in data && !('soreness' in data)) {
    mapped.soreness = data.muscleSoreness;
  }
  if ('muscle_soreness' in data && !('soreness' in data)) {
    mapped.soreness = data.muscle_soreness;
  }

  // Date field
  if ('checkinDate' in data && !('date' in data)) {
    mapped.date = data.checkinDate;
  }
  if ('checkin_date' in data && !('date' in data)) {
    mapped.date = data.checkin_date;
  }

  // Sleep hours
  if ('sleepHours' in data && !('sleepHours' in mapped)) {
    mapped.sleepHours = data.sleepHours;
  }
  if ('sleep_hours' in data && !('sleepHours' in mapped)) {
    mapped.sleepHours = data.sleep_hours;
  }

  // Readiness
  if ('calculatedReadiness' in data && !('readinessScore' in data)) {
    mapped.readinessScore = data.calculatedReadiness;
  }
  if ('calculated_readiness' in data && !('readinessScore' in data)) {
    mapped.readinessScore = data.calculated_readiness;
  }

  return mapped as T;
}

/**
 * Normalizes Training Session API response
 */
export function mapTrainingSessionResponse<T extends ApiResponseData>(data: T): T {
  if (!data || typeof data !== 'object') return data;

  const mapped = { ...data } as T & Record<string, unknown>;

  if ('sessionType' in data && !('session_type' in data)) {
    mapped.session_type = data.sessionType;
  }

  if ('durationMinutes' in data && !('duration_minutes' in data)) {
    mapped.duration_minutes = data.durationMinutes;
  }

  if ('sessionDate' in data && !('session_date' in data)) {
    mapped.session_date = data.sessionDate;
  }

  if ('actualRpe' in data && !('actual_rpe' in data)) {
    mapped.actual_rpe = data.actualRpe;
  }

  if ('completedAt' in data && !('completed_at' in data)) {
    mapped.completed_at = data.completedAt;
  }

  if ('trainingType' in data && !('training_type' in data)) {
    mapped.training_type = data.trainingType;
  }

  if ('userId' in data && !('user_id' in data)) {
    mapped.user_id = data.userId;
  }

  if ('athleteId' in data && !('athlete_id' in data)) {
    mapped.athlete_id = data.athleteId;
  }

  return mapped as T;
}

/**
 * Normalizes Performance Data API response
 */
export function mapPerformanceDataResponse<T extends ApiResponseData>(data: T): T {
  if (!data || typeof data !== 'object') return data;

  const mapped = { ...data } as T & Record<string, unknown>;

  // Body composition fields
  if ('bodyFat' in data && !('body_fat' in data)) {
    mapped.body_fat = data.bodyFat;
  }
  if ('muscleMass' in data && !('muscle_mass' in data)) {
    mapped.muscle_mass = data.muscleMass;
  }
  if ('bodyWaterMass' in data && !('body_water_mass' in data)) {
    mapped.body_water_mass = data.bodyWaterMass;
  }
  if ('fatMass' in data && !('fat_mass' in data)) {
    mapped.fat_mass = data.fatMass;
  }
  if ('proteinMass' in data && !('protein_mass' in data)) {
    mapped.protein_mass = data.proteinMass;
  }
  if ('boneMineralContent' in data && !('bone_mineral_content' in data)) {
    mapped.bone_mineral_content = data.boneMineralContent;
  }
  if ('skeletalMuscleMass' in data && !('skeletal_muscle_mass' in data)) {
    mapped.skeletal_muscle_mass = data.skeletalMuscleMass;
  }
  if ('musclePercentage' in data && !('muscle_percentage' in data)) {
    mapped.muscle_percentage = data.musclePercentage;
  }
  if ('bodyWaterPercentage' in data && !('body_water_percentage' in data)) {
    mapped.body_water_percentage = data.bodyWaterPercentage;
  }
  if ('proteinPercentage' in data && !('protein_percentage' in data)) {
    mapped.protein_percentage = data.proteinPercentage;
  }
  if ('boneMineralPercentage' in data && !('bone_mineral_percentage' in data)) {
    mapped.bone_mineral_percentage = data.boneMineralPercentage;
  }
  if ('visceralFatRating' in data && !('visceral_fat_rating' in data)) {
    mapped.visceral_fat_rating = data.visceralFatRating;
  }
  if ('basalMetabolicRate' in data && !('basal_metabolic_rate' in data)) {
    mapped.basal_metabolic_rate = data.basalMetabolicRate;
  }
  if ('waistToHipRatio' in data && !('waist_to_hip_ratio' in data)) {
    mapped.waist_to_hip_ratio = data.waistToHipRatio;
  }
  if ('bodyAge' in data && !('body_age' in data)) {
    mapped.body_age = data.bodyAge;
  }

  // Performance test fields
  if ('testType' in data && !('test_type' in data)) {
    mapped.test_type = data.testType;
  }
  if ('resultValue' in data && !('result_value' in data)) {
    mapped.result_value = data.resultValue;
  }
  if ('targetValue' in data && !('target_value' in data)) {
    mapped.target_value = data.targetValue;
  }
  if ('testDate' in data && !('test_date' in data)) {
    mapped.test_date = data.testDate;
  }

  // Common fields
  if ('createdAt' in data && !('created_at' in data)) {
    mapped.created_at = data.createdAt;
  }
  if ('userId' in data && !('user_id' in data)) {
    mapped.user_id = data.userId;
  }

  return mapped as T;
}

/**
 * Maps an array of items using the provided mapper function
 */
export function mapArrayResponse<T extends ApiResponseData>(
  data: T[] | undefined | null,
  mapper: (item: T) => T
): T[] {
  if (!data || !Array.isArray(data)) return [];
  return data.map(mapper);
}

/**
 * Generic API response normalizer that handles common patterns
 * Use specific mappers above for better type safety
 */
export function normalizeApiResponse<T extends ApiResponseData>(
  data: T,
  fieldMappings: Record<string, string>
): T {
  if (!data || typeof data !== 'object') return data;

  const mapped = { ...data } as T & Record<string, unknown>;

  for (const [camelCase, snakeCase] of Object.entries(fieldMappings)) {
    if (camelCase in data && !(snakeCase in data)) {
      mapped[snakeCase] = data[camelCase];
    }
  }

  return mapped as T;
}
