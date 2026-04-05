/**
 * Travel Recovery Service
 *
 * EVIDENCE-BASED JET LAG & TRAVEL RECOVERY PROTOCOLS FOR ATHLETES
 *
 * Travel across time zones AND long-distance car travel significantly
 * impact athletic performance. This service provides personalized
 * recovery protocols based on:
 * - Direction of travel (eastward vs westward)
 * - Number of time zones crossed
 * - Days until competition
 * - Individual circadian preferences
 * - Car travel duration (6-12+ hours)
 * - Blood circulation management
 *
 * Research Base - Jet Lag:
 * - Waterhouse et al. (2007) - Jet lag and the athlete
 * - Reilly et al. (2007) - Travel fatigue and jet-lag
 * - Eastman & Burgess (2009) - How to travel the world without jet lag
 * - Fowler et al. (2015) - Team travel in elite sport
 * - Leatherwood & Dragoo (2013) - Effect of airline travel on performance
 *
 * Research Base - Blood Circulation & Compression:
 * - Engel et al. (2016) - Sports compression garments enhance venous blood flow
 *   (PubMed: 36622554) - Systematic review & meta-analysis
 * - Brophy-Williams et al. (2017) - Lower-limb compression tights improve
 *   muscle blood flow during repeated-sprint cycling (PubMed: 29252067)
 * - Born et al. (2013) - Compression garments enhance central hemodynamic
 *   responses (PubMed: 33065703)
 *
 * Research Base - Massage Guns / Percussion Therapy:
 * - Konrad et al. (2023) - Localized percussion vibration increases blood
 *   flow velocity and muscle volume (MDPI: 10.3390/jcm12052047)
 * - Cheatham et al. (2021) - Massage guns improve flexibility in iliopsoas,
 *   hamstrings, triceps surae (PubMed: 37754971)
 * - Mayo Clinic (2024) - Percussion therapy stimulates mechanoreceptors
 *   and proprioceptors, reducing pain perception
 * - CAUTION: Szabo et al. (2020) - Rhabdomyolysis reported after improper
 *   massage gun use (PubMed: 33156927)
 *
 * Research Base - DVT Prevention:
 * - Scurr et al. (2001) - Graduated compression stockings reduce DVT
 *   incidence during long-haul flights
 * - Clarke et al. (2016) - Compression stockings for preventing DVT
 *   in airline passengers (Cochrane Review)
 *
 * Key Findings:
 * - Eastward travel is harder (advancing circadian rhythm)
 * - Rule of thumb: 1 day recovery per timezone crossed
 * - Light exposure is the primary zeitgeber (time-giver)
 * - Performance decrements of 5-10% immediately after travel
 * - Melatonin can accelerate adaptation by 50%
 * - Compression garments (15-30 mmHg) significantly enhance venous blood flow
 * - Massage guns increase blood flow velocity by 30-50% when used correctly
 * - Regular movement breaks every 1-2 hours critical for DVT prevention
 * - Prolonged sitting (>4 hours) increases DVT risk 2-3x
 *
 * @author FlagFit Pro Team
 * @version 2.0.0
 */

import { Injectable, inject, signal, computed, effect } from "@angular/core";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { RecoveryService } from "./recovery.service";

// ============================================================================
// INTERFACES
// ============================================================================

export interface TravelPlan {
  id: string;
  persistedLogId?: string;
  userId: string;
  tripName: string;
  departureDate: Date;
  arrivalDate: Date;
  returnDate?: Date;
  competitionDate?: Date;
  departureTimezone: string;
  arrivalTimezone: string;
  timezonesEast: number; // Positive = east, negative = west
  travelDirection: "eastward" | "westward" | "none";
  flightDuration: number; // hours
  layovers: number;
  notes?: string;
  createdAt: Date;
}

export interface JetLagSeverity {
  level: "none" | "mild" | "moderate" | "severe";
  score: number; // 0-100
  estimatedRecoveryDays: number;
  performanceImpact: number; // 0-1 multiplier
  symptoms: string[];
}

export interface RecoveryProtocol {
  phase: "pre-travel" | "in-flight" | "post-arrival" | "competition-ready";
  day: number;
  date: Date;
  recommendations: ProtocolRecommendation[];
  sleepWindow: { bedTime: string; wakeTime: string };
  lightExposure: LightExposureWindow[];
  mealTiming: MealTiming[];
  trainingGuidelines: TrainingGuideline;
  hydrationTarget: number; // ml
  supplements: SupplementRecommendation[];
}

export interface ProtocolRecommendation {
  time: string;
  action: string;
  importance: "critical" | "high" | "medium" | "low";
  category:
    | "sleep"
    | "light"
    | "nutrition"
    | "training"
    | "hydration"
    | "general";
  evidenceBase?: string;
}

export interface LightExposureWindow {
  startTime: string;
  endTime: string;
  type: "seek" | "avoid";
  intensity: "bright" | "moderate" | "dim";
  reason: string;
}

export interface MealTiming {
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  time: string;
  notes: string;
  emphasis: string[]; // e.g., ["high protein", "complex carbs"]
}

export interface TrainingGuideline {
  allowedIntensity: "none" | "light" | "moderate" | "full";
  maxDuration: number; // minutes
  recommendedActivities: string[];
  avoidActivities: string[];
  notes: string;
}

export interface SupplementRecommendation {
  name: string;
  dosage: string;
  timing: string;
  purpose: string;
  evidenceLevel: "strong" | "moderate" | "emerging";
  caution?: string;
}

export interface TravelChecklist {
  category: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  item: string;
  packed: boolean;
  essential: boolean;
  notes?: string;
}

export interface CircadianProfile {
  chronotype: "early_bird" | "neutral" | "night_owl";
  naturalWakeTime: string;
  naturalBedTime: string;
  adaptabilityScore: number; // 0-100, how easily they adjust
}

// ============================================================================
// CAR TRAVEL INTERFACES
// ============================================================================

export interface CarTravelPlan {
  id: string;
  userId: string;
  tripName: string;
  departureDate: Date;
  departureTime: string;
  estimatedDuration: number; // hours
  competitionDate?: Date;
  competitionTime?: string;
  isDriver: boolean;
  numberOfPassengers: number;
  vehicleType: "car" | "suv" | "van" | "bus";
  notes?: string;
  createdAt: Date;
}

export interface CarTravelProtocol {
  phase: "pre-departure" | "during-travel" | "rest-stop" | "post-arrival";
  hourMark: number; // hours into journey
  recommendations: CarTravelRecommendation[];
  circulationExercises: CirculationExercise[];
  compressionGuidelines: CompressionGuideline;
  hydrationTarget: number; // ml
  nutritionGuidelines: NutritionGuideline[];
}

export interface CarTravelRecommendation {
  time: string;
  action: string;
  importance: "critical" | "high" | "medium" | "low";
  category:
    | "circulation"
    | "compression"
    | "hydration"
    | "nutrition"
    | "rest"
    | "driver-safety";
  evidenceBase?: string;
  duration?: number; // minutes
}

export interface CirculationExercise {
  name: string;
  description: string;
  sets: number;
  reps: number;
  duration?: number; // seconds
  targetArea: "calves" | "thighs" | "glutes" | "lower-back" | "full-body";
  canDoSeated: boolean;
  evidenceBase?: string;
}

export interface CompressionGuideline {
  garmentType: "socks" | "calf-sleeves" | "full-leggings" | "shorts";
  pressureLevel: "light" | "moderate" | "firm";
  pressureMmHg: string; // e.g., "15-20 mmHg"
  wearDuration: string;
  whenToWear: string;
  whenToRemove: string;
  cautions: string[];
  evidenceBase: string;
}

export interface NutritionGuideline {
  timing: string;
  recommendation: string;
  foods: string[];
  avoid: string[];
  reason: string;
}

export interface MassageGunProtocol {
  timing: "pre-travel" | "rest-stop" | "post-arrival";
  targetMuscles: MuscleTarget[];
  totalDuration: number; // minutes
  frequency: string; // e.g., "Every 2-3 hours at rest stops"
  cautions: string[];
  evidenceBase: string;
}

export interface MuscleTarget {
  muscle: string;
  duration: number; // seconds
  pressure: "light" | "moderate" | "firm";
  technique: string;
  purpose: string;
}

export interface BloodCirculationRisk {
  riskLevel: "low" | "moderate" | "high" | "very-high";
  score: number; // 0-100
  factors: string[];
  recommendations: string[];
  warningSymptoms: string[];
}

// ============================================================================
// TIMEZONE DATA
// ============================================================================

const MAJOR_TIMEZONES: Record<string, { offset: number; city: string }> = {
  "America/Los_Angeles": { offset: -8, city: "Los Angeles" },
  "America/Denver": { offset: -7, city: "Denver" },
  "America/Chicago": { offset: -6, city: "Chicago" },
  "America/New_York": { offset: -5, city: "New York" },
  "America/Sao_Paulo": { offset: -3, city: "São Paulo" },
  "Europe/London": { offset: 0, city: "London" },
  "Europe/Paris": { offset: 1, city: "Paris" },
  "Europe/Berlin": { offset: 1, city: "Berlin" },
  "Asia/Dubai": { offset: 4, city: "Dubai" },
  "Asia/Tokyo": { offset: 9, city: "Tokyo" },
  "Australia/Sydney": { offset: 11, city: "Sydney" },
  "Australia/Brisbane": { offset: 10, city: "Brisbane" },
  "Pacific/Auckland": { offset: 13, city: "Auckland" },
};

// Olympic venues for LA28 and Brisbane 2032
const OLYMPIC_VENUES = {
  LA28: { timezone: "America/Los_Angeles", offset: -8, city: "Los Angeles" },
  BRISBANE32: { timezone: "Australia/Brisbane", offset: 10, city: "Brisbane" },
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class TravelRecoveryService {
  private logger = inject(LoggerService);
  private supabaseService = inject(SupabaseService);
  private recoveryService = inject(RecoveryService);

  // State
  private readonly _currentPlan = signal<TravelPlan | null>(null);
  private readonly _recoveryProtocol = signal<RecoveryProtocol[]>([]);
  private readonly _circadianProfile = signal<CircadianProfile>({
    chronotype: "neutral",
    naturalWakeTime: "07:00",
    naturalBedTime: "23:00",
    adaptabilityScore: 70,
  });

  // Public signals
  readonly currentPlan = this._currentPlan.asReadonly();
  readonly recoveryProtocol = this._recoveryProtocol.asReadonly();
  readonly circadianProfile = this._circadianProfile.asReadonly();

  // Computed
  readonly hasActivePlan = computed(() => this._currentPlan() !== null);

  readonly jetLagSeverity = computed<JetLagSeverity>(() => {
    const plan = this._currentPlan();
    if (!plan) {
      return {
        level: "none",
        score: 0,
        estimatedRecoveryDays: 0,
        performanceImpact: 1.0,
        symptoms: [],
      };
    }
    return this.calculateJetLagSeverity(plan);
  });

  readonly daysUntilCompetition = computed(() => {
    const plan = this._currentPlan();
    if (!plan?.competitionDate) return null;
    const now = new Date();
    const comp = new Date(plan.competitionDate);
    return Math.ceil((comp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  });

  readonly isCompetitionReady = computed(() => {
    const days = this.daysUntilCompetition();
    const severity = this.jetLagSeverity();
    if (days === null) return true;
    return days >= severity.estimatedRecoveryDays;
  });

  constructor() {
    effect(() => {
      const userId = this.supabaseService.userId();
      if (!userId) {
        this._currentPlan.set(null);
        this._recoveryProtocol.set([]);
        return;
      }

      void this.loadPersistedPlan(userId);
    });
  }

  // ============================================================================
  // TRAVEL PLAN MANAGEMENT
  // ============================================================================

  /**
   * Create a new travel plan
   */
  async createTravelPlan(
    planData: Omit<
      TravelPlan,
      "id" | "userId" | "createdAt" | "timezonesEast" | "travelDirection"
    >,
  ): Promise<TravelPlan> {
    this.logger.debug("travel_recovery_service_create_plan", {
      planData,
    });
    const userId = this.supabaseService.userId() || "anonymous";

    // Calculate timezone difference
    const depTz = MAJOR_TIMEZONES[planData.departureTimezone];
    const arrTz = MAJOR_TIMEZONES[planData.arrivalTimezone];

    this.logger.debug("travel_recovery_service_timezone", {
      departure: depTz,
      arrival: arrTz,
    });

    let timezonesEast = 0;
    let travelDirection: TravelPlan["travelDirection"] = "none";

    if (depTz && arrTz) {
      timezonesEast = arrTz.offset - depTz.offset;

      // Handle international date line
      if (timezonesEast > 12) timezonesEast -= 24;
      if (timezonesEast < -12) timezonesEast += 24;

      if (timezonesEast > 0) {
        travelDirection = "eastward";
      } else if (timezonesEast < 0) {
        travelDirection = "westward";
      }
    }

    this.logger.debug("travel_recovery_service_calculation", {
      timezonesEast,
      travelDirection,
    });

    const plan: TravelPlan = {
      ...planData,
      id: `travel-${Date.now()}`,
      userId,
      timezonesEast,
      travelDirection,
      createdAt: new Date(),
    };

    const persistedLogId = await this.persistPlan(plan);
    if (persistedLogId) {
      plan.persistedLogId = persistedLogId;
    }

    this.logger.debug("travel_recovery_service_plan_object", { plan });
    this._currentPlan.set(plan);
    this.logger.debug("travel_recovery_service_plan_signal_set");

    this.generateRecoveryProtocol(plan);
    this.logger.debug("travel_recovery_service_protocol_generated");

    this.logger.info("travel_recovery_plan_created", {
      direction: travelDirection,
      timezones: Math.abs(timezonesEast),
    });

    return plan;
  }

  /**
   * Set circadian profile for personalized recommendations
   */
  setCircadianProfile(profile: CircadianProfile): void {
    this._circadianProfile.set(profile);

    // Regenerate protocol if plan exists
    const plan = this._currentPlan();
    if (plan) {
      this.generateRecoveryProtocol(plan);
    }
  }

  /**
   * Clear current travel plan
   */
  async clearPlan(): Promise<void> {
    await this.deletePersistedPlan();
    this._currentPlan.set(null);
    this._recoveryProtocol.set([]);
  }

  private async loadPersistedPlan(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("athlete_travel_log")
        .select("id, arrival_date, timezone_difference, notes, created_at")
        .eq("user_id", userId)
        .order("arrival_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && !String(error.message || "").includes("relation")) {
        this.logger.warn("travel_recovery_persist_load_failed", {
          error,
        });
        return;
      }

      if (!data) {
        if (!this._currentPlan()) {
          this._recoveryProtocol.set([]);
        }
        return;
      }

      const hydratedPlan = this.deserializePlanFromLog(
        data as {
          id: string;
          arrival_date: string;
          timezone_difference: number | null;
          notes: string | null;
          created_at: string | null;
        },
        userId,
      );

      if (!hydratedPlan) {
        return;
      }

      const currentPlan = this._currentPlan();
      if (currentPlan?.persistedLogId === hydratedPlan.persistedLogId) {
        return;
      }

      this._currentPlan.set(hydratedPlan);
      this.generateRecoveryProtocol(hydratedPlan);
    } catch (error) {
      this.logger.warn("travel_recovery_restore_failed", {
        error,
      });
    }
  }

  private serializePlanNotes(plan: TravelPlan): string {
    return JSON.stringify({
      noteType: "travel_plan_v1",
      tripName: plan.tripName,
      departureDate: plan.departureDate.toISOString(),
      returnDate: plan.returnDate?.toISOString() ?? null,
      competitionDate: plan.competitionDate?.toISOString() ?? null,
      departureTimezone: plan.departureTimezone,
      arrivalTimezone: plan.arrivalTimezone,
      flightDuration: plan.flightDuration,
      layovers: plan.layovers,
      createdAt: plan.createdAt.toISOString(),
    });
  }

  private deserializePlanFromLog(
    log: {
      id: string;
      arrival_date: string;
      timezone_difference: number | null;
      notes: string | null;
      created_at: string | null;
    },
    userId: string,
  ): TravelPlan | null {
    if (!log.notes) {
      return null;
    }

    try {
      const parsed = JSON.parse(log.notes) as {
        tripName?: string;
        departureDate?: string;
        returnDate?: string | null;
        competitionDate?: string | null;
        departureTimezone?: string;
        arrivalTimezone?: string;
        flightDuration?: number;
        layovers?: number;
        createdAt?: string;
      };
      const timezonesEast = log.timezone_difference ?? 0;

      return {
        id: `travel-${log.id}`,
        persistedLogId: log.id,
        userId,
        tripName: parsed.tripName || "Travel Plan",
        departureDate: parsed.departureDate
          ? new Date(parsed.departureDate)
          : new Date(log.arrival_date),
        arrivalDate: new Date(log.arrival_date),
        returnDate: parsed.returnDate ? new Date(parsed.returnDate) : undefined,
        competitionDate: parsed.competitionDate
          ? new Date(parsed.competitionDate)
          : undefined,
        departureTimezone: parsed.departureTimezone || "UTC",
        arrivalTimezone: parsed.arrivalTimezone || "UTC",
        timezonesEast,
        travelDirection:
          timezonesEast > 0
            ? "eastward"
            : timezonesEast < 0
              ? "westward"
              : "none",
        flightDuration: parsed.flightDuration || 0,
        layovers: parsed.layovers || 0,
        createdAt: parsed.createdAt
          ? new Date(parsed.createdAt)
          : new Date(log.created_at || log.arrival_date),
      };
    } catch (error) {
      this.logger.warn("travel_recovery_notes_parse_failed", {
        error,
      });
      return null;
    }
  }

  private async persistPlan(plan: TravelPlan): Promise<string | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("athlete_travel_log")
        .insert({
          user_id: plan.userId,
          arrival_date: plan.arrivalDate.toISOString().split("T")[0],
          adaptation_day: 0,
          timezone_difference: plan.timezonesEast,
          notes: this.serializePlanNotes(plan),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        this.logger.warn("travel_recovery_persist_save_failed", {
          error,
        });
        return null;
      }

      return (data as { id?: string } | null)?.id ?? null;
    } catch (error) {
      this.logger.warn("travel_recovery_persistence_unavailable", {
        error,
      });
      return null;
    }
  }

  private async deletePersistedPlan(): Promise<void> {
    const persistedLogId = this._currentPlan()?.persistedLogId;
    if (!persistedLogId) {
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from("athlete_travel_log")
        .delete()
        .eq("id", persistedLogId);

      if (error) {
        this.logger.warn("travel_recovery_clear_log_failed", {
          error,
        });
      }
    } catch (error) {
      this.logger.warn("travel_recovery_cleanup_unavailable", {
        error,
      });
    }
  }

  // ============================================================================
  // JET LAG CALCULATIONS
  // ============================================================================

  /**
   * Calculate jet lag severity based on travel plan
   */
  calculateJetLagSeverity(plan: TravelPlan): JetLagSeverity {
    const timezones = Math.abs(plan.timezonesEast);
    const symptoms: string[] = [];

    // No significant jet lag for < 3 timezones
    if (timezones < 3) {
      return {
        level: "none",
        score: timezones * 10,
        estimatedRecoveryDays: timezones <= 1 ? 0 : 1,
        performanceImpact: 1.0 - timezones * 0.02,
        symptoms: timezones > 0 ? ["Minor fatigue"] : [],
      };
    }

    // Calculate base severity
    // Eastward travel is ~50% harder than westward
    const directionMultiplier = plan.travelDirection === "eastward" ? 1.5 : 1.0;
    const baseScore = timezones * 10 * directionMultiplier;

    // Adjust for flight duration and layovers
    const flightFatigue = Math.min(20, plan.flightDuration * 1.5);
    const layoverFatigue = plan.layovers * 5;

    const totalScore = Math.min(
      100,
      baseScore + flightFatigue + layoverFatigue,
    );

    // Determine level
    let level: JetLagSeverity["level"] = "mild";
    if (totalScore >= 70) {
      level = "severe";
    } else if (totalScore >= 45) {
      level = "moderate";
    }

    // Calculate recovery days (1 day per timezone for eastward, 0.7 for westward)
    const recoveryRate = plan.travelDirection === "eastward" ? 1.0 : 0.7;
    const estimatedRecoveryDays = Math.ceil(timezones * recoveryRate);

    // Performance impact (5-15% decrement based on severity)
    const performanceImpact = 1.0 - (totalScore / 100) * 0.15;

    // Common symptoms
    if (totalScore > 20) symptoms.push("Daytime fatigue");
    if (totalScore > 30) symptoms.push("Difficulty sleeping at night");
    if (totalScore > 40) symptoms.push("Reduced concentration");
    if (totalScore > 50) symptoms.push("Digestive issues");
    if (totalScore > 60) symptoms.push("Mood disturbances");
    if (totalScore > 70) symptoms.push("Significant performance decrement");
    if (totalScore > 80) symptoms.push("Headaches");

    return {
      level,
      score: Math.round(totalScore),
      estimatedRecoveryDays,
      performanceImpact: Math.round(performanceImpact * 100) / 100,
      symptoms,
    };
  }

  // ============================================================================
  // RECOVERY PROTOCOL GENERATION
  // ============================================================================

  /**
   * Generate personalized recovery protocol
   */
  generateRecoveryProtocol(plan: TravelPlan): RecoveryProtocol[] {
    const protocol: RecoveryProtocol[] = [];
    const profile = this._circadianProfile();
    const severity = this.calculateJetLagSeverity(plan);

    // Pre-travel phase (3 days before)
    for (let day = -3; day <= -1; day++) {
      const date = new Date(plan.departureDate);
      date.setDate(date.getDate() + day);
      protocol.push(this.generatePreTravelDay(day, date, plan, profile));
    }

    // Travel day
    protocol.push(this.generateTravelDay(plan, profile));

    // Post-arrival phase
    for (let day = 1; day <= severity.estimatedRecoveryDays + 2; day++) {
      const date = new Date(plan.arrivalDate);
      date.setDate(date.getDate() + day - 1);
      protocol.push(
        this.generatePostArrivalDay(day, date, plan, profile, severity),
      );
    }

    this._recoveryProtocol.set(protocol);
    return protocol;
  }

  /**
   * Generate pre-travel day protocol
   */
  private generatePreTravelDay(
    day: number,
    date: Date,
    plan: TravelPlan,
    profile: CircadianProfile,
  ): RecoveryProtocol {
    const timezones = Math.abs(plan.timezonesEast);
    const isEastward = plan.travelDirection === "eastward";

    // Calculate shift amount (shift 30-60 min per day before travel)
    const shiftMinutes = Math.min(60, timezones * 15);
    const shiftDirection = isEastward ? "earlier" : "later";

    // Adjust sleep times
    const daysBeforeTravel = Math.abs(day);
    const totalShift = shiftMinutes * (4 - daysBeforeTravel);

    const baseBedTime = this.parseTime(profile.naturalBedTime);
    const baseWakeTime = this.parseTime(profile.naturalWakeTime);

    const adjustedBedTime = isEastward
      ? this.addMinutes(baseBedTime, -totalShift)
      : this.addMinutes(baseBedTime, totalShift);

    const adjustedWakeTime = isEastward
      ? this.addMinutes(baseWakeTime, -totalShift)
      : this.addMinutes(baseWakeTime, totalShift);

    const recommendations: ProtocolRecommendation[] = [
      {
        time: "All day",
        action: `Begin shifting sleep schedule ${shiftDirection} by ${shiftMinutes} minutes`,
        importance: "high",
        category: "sleep",
        evidenceBase:
          "Eastman & Burgess (2009) - Gradual shift reduces jet lag",
      },
      {
        time: "Morning",
        action: "Stay well hydrated - aim for 3L of water today",
        importance: "medium",
        category: "hydration",
      },
      {
        time: "Evening",
        action: "Avoid alcohol and caffeine after 2pm",
        importance: "high",
        category: "nutrition",
      },
    ];

    if (daysBeforeTravel === 3) {
      recommendations.push({
        time: "Today",
        action: "Confirm all travel documents and pack essentials",
        importance: "high",
        category: "general",
      });
    }

    if (daysBeforeTravel === 1) {
      recommendations.push({
        time: "Today",
        action: "Light training only - save energy for travel",
        importance: "high",
        category: "training",
      });
    }

    return {
      phase: "pre-travel",
      day,
      date,
      recommendations,
      sleepWindow: {
        bedTime: adjustedBedTime,
        wakeTime: adjustedWakeTime,
      },
      lightExposure: isEastward
        ? [
            {
              startTime: this.addMinutes(baseWakeTime, -60),
              endTime: this.addMinutes(baseWakeTime, 60),
              type: "seek",
              intensity: "bright",
              reason: "Advance circadian rhythm for eastward travel",
            },
            {
              startTime: "20:00",
              endTime: "23:00",
              type: "avoid",
              intensity: "bright",
              reason: "Allow earlier sleep onset",
            },
          ]
        : [
            {
              startTime: "18:00",
              endTime: "21:00",
              type: "seek",
              intensity: "bright",
              reason: "Delay circadian rhythm for westward travel",
            },
          ],
      mealTiming: [
        {
          meal: "breakfast",
          time: isEastward
            ? this.addMinutes("07:00", -totalShift)
            : this.addMinutes("07:00", totalShift),
          notes: "High protein to promote alertness",
          emphasis: ["high protein", "complex carbs"],
        },
        {
          meal: "dinner",
          time: isEastward
            ? this.addMinutes("19:00", -totalShift)
            : this.addMinutes("19:00", totalShift),
          notes: "Earlier dinner to support earlier sleep",
          emphasis: ["complex carbs", "tryptophan-rich foods"],
        },
      ],
      trainingGuidelines: {
        allowedIntensity: daysBeforeTravel === 1 ? "light" : "moderate",
        maxDuration: daysBeforeTravel === 1 ? 45 : 60,
        recommendedActivities: ["mobility work", "light cardio", "skill work"],
        avoidActivities: ["high-intensity intervals", "heavy lifting"],
        notes: "Conserve energy for travel",
      },
      hydrationTarget: 3000,
      supplements: [
        {
          name: "Melatonin",
          dosage: "0.5-3mg",
          timing: isEastward
            ? "Early evening (6-7pm)"
            : "Not needed pre-travel",
          purpose: "Begin circadian shift for eastward travel",
          evidenceLevel: "strong",
          caution: "Start with low dose to assess tolerance",
        },
      ],
    };
  }

  /**
   * Generate travel day protocol
   */
  private generateTravelDay(
    plan: TravelPlan,
    _profile: CircadianProfile,
  ): RecoveryProtocol {
    const isEastward = plan.travelDirection === "eastward";

    const recommendations: ProtocolRecommendation[] = [
      {
        time: "Before flight",
        action: "Set watch to destination time immediately",
        importance: "critical",
        category: "general",
        evidenceBase: "Psychological preparation aids adaptation",
      },
      {
        time: "During flight",
        action: "Stay hydrated - drink 250ml water per hour of flight",
        importance: "critical",
        category: "hydration",
      },
      {
        time: "During flight",
        action: "Move and stretch every 2 hours to prevent stiffness",
        importance: "high",
        category: "training",
      },
      {
        time: "During flight",
        action: "Avoid alcohol completely - it worsens dehydration and jet lag",
        importance: "critical",
        category: "nutrition",
      },
      {
        time: "During flight",
        action: "Use compression socks to reduce swelling and DVT risk",
        importance: "high",
        category: "general",
      },
    ];

    // Sleep strategy depends on arrival time
    if (isEastward) {
      recommendations.push({
        time: "During flight",
        action: "Try to sleep on the plane - use eye mask and earplugs",
        importance: "high",
        category: "sleep",
      });
    } else {
      recommendations.push({
        time: "During flight",
        action:
          "Stay awake if arriving in evening, sleep if arriving in morning",
        importance: "high",
        category: "sleep",
      });
    }

    return {
      phase: "in-flight",
      day: 0,
      date: plan.departureDate,
      recommendations,
      sleepWindow: {
        bedTime: "Destination evening",
        wakeTime: "Destination morning",
      },
      lightExposure: [
        {
          startTime: "N/A",
          endTime: "N/A",
          type: "avoid",
          intensity: "bright",
          reason: "Use eye mask during intended sleep periods",
        },
      ],
      mealTiming: [
        {
          meal: "breakfast",
          time: "Destination breakfast time",
          notes: "Eat according to destination time, not departure time",
          emphasis: ["light meals", "easy to digest"],
        },
        {
          meal: "snack",
          time: "Every 3-4 hours",
          notes: "Small, healthy snacks to maintain energy",
          emphasis: ["nuts", "fruit", "protein bars"],
        },
      ],
      trainingGuidelines: {
        allowedIntensity: "light",
        maxDuration: 20,
        recommendedActivities: [
          "in-seat stretches",
          "walking the aisle",
          "ankle circles",
        ],
        avoidActivities: ["anything strenuous"],
        notes: "Focus on movement to prevent stiffness",
      },
      hydrationTarget: plan.flightDuration * 250, // 250ml per hour
      supplements: [
        {
          name: "Melatonin",
          dosage: "0.5-3mg",
          timing: "When you want to sleep (destination night time)",
          purpose: "Promote sleep at appropriate destination time",
          evidenceLevel: "strong",
        },
        {
          name: "Electrolytes",
          dosage: "1-2 tablets",
          timing: "During flight",
          purpose: "Combat dehydration from cabin air",
          evidenceLevel: "moderate",
        },
      ],
    };
  }

  /**
   * Generate post-arrival day protocol
   */
  private generatePostArrivalDay(
    day: number,
    date: Date,
    plan: TravelPlan,
    _profile: CircadianProfile,
    severity: JetLagSeverity,
  ): RecoveryProtocol {
    const isEastward = plan.travelDirection === "eastward";
    const _timezones = Math.abs(plan.timezonesEast);
    const isRecovered = day > severity.estimatedRecoveryDays;

    const recommendations: ProtocolRecommendation[] = [];

    // Day 1 specific advice
    if (day === 1) {
      recommendations.push({
        time: "Arrival",
        action: "Get outside in natural light as soon as possible",
        importance: "critical",
        category: "light",
        evidenceBase:
          "Light is the primary zeitgeber for circadian resynchronization",
      });
      recommendations.push({
        time: "Arrival day",
        action: "Stay awake until at least 9pm local time, even if exhausted",
        importance: "critical",
        category: "sleep",
      });
      recommendations.push({
        time: "Arrival day",
        action: "Light walk or mobility work only - no intense training",
        importance: "high",
        category: "training",
      });
    }

    // General post-arrival advice
    if (!isRecovered) {
      recommendations.push({
        time: "Morning",
        action: isEastward
          ? "Get bright light exposure immediately upon waking"
          : "Avoid bright light in early morning",
        importance: "high",
        category: "light",
      });

      recommendations.push({
        time: "Evening",
        action: isEastward
          ? "Avoid bright light after 6pm to promote earlier sleep"
          : "Get bright light exposure in late afternoon/evening",
        importance: "high",
        category: "light",
      });
    }

    // Training progression
    let trainingIntensity: TrainingGuideline["allowedIntensity"] = "none";
    let maxDuration = 0;

    if (day === 1) {
      trainingIntensity = "light";
      maxDuration = 30;
    } else if (day === 2) {
      trainingIntensity = "light";
      maxDuration = 45;
    } else if (day <= severity.estimatedRecoveryDays) {
      trainingIntensity = "moderate";
      maxDuration = 60;
    } else {
      trainingIntensity = "full";
      maxDuration = 90;
    }

    // Competition readiness check
    const daysToCompetition = plan.competitionDate
      ? Math.ceil(
          (new Date(plan.competitionDate).getTime() - date.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    if (daysToCompetition !== null && daysToCompetition <= 2) {
      recommendations.push({
        time: "Today",
        action: `Competition in ${daysToCompetition} day(s) - focus on rest and mental preparation`,
        importance: "critical",
        category: "general",
      });
    }

    // Light exposure windows
    const lightExposure: LightExposureWindow[] = [];

    if (isEastward) {
      // Seek morning light, avoid evening light
      lightExposure.push({
        startTime: "06:00",
        endTime: "10:00",
        type: "seek",
        intensity: "bright",
        reason: "Advance circadian rhythm",
      });
      lightExposure.push({
        startTime: "18:00",
        endTime: "22:00",
        type: "avoid",
        intensity: "bright",
        reason: "Allow earlier sleep onset",
      });
    } else {
      // Avoid morning light, seek evening light
      lightExposure.push({
        startTime: "05:00",
        endTime: "09:00",
        type: "avoid",
        intensity: "bright",
        reason: "Prevent premature awakening",
      });
      lightExposure.push({
        startTime: "16:00",
        endTime: "20:00",
        type: "seek",
        intensity: "bright",
        reason: "Delay circadian rhythm",
      });
    }

    return {
      phase: isRecovered ? "competition-ready" : "post-arrival",
      day,
      date,
      recommendations,
      sleepWindow: {
        bedTime: isRecovered
          ? _profile.naturalBedTime
          : isEastward
            ? "21:00"
            : "23:30",
        wakeTime: isRecovered
          ? _profile.naturalWakeTime
          : isEastward
            ? "06:00"
            : "08:00",
      },
      lightExposure,
      mealTiming: [
        {
          meal: "breakfast",
          time: "07:00",
          notes: "Eat at local time to help reset body clock",
          emphasis: ["high protein", "complex carbs"],
        },
        {
          meal: "lunch",
          time: "12:00",
          notes: "Balanced meal at local time",
          emphasis: ["lean protein", "vegetables", "healthy fats"],
        },
        {
          meal: "dinner",
          time: isEastward ? "18:00" : "19:30",
          notes: "Earlier dinner for eastward travel to support earlier sleep",
          emphasis: ["complex carbs", "tryptophan-rich foods"],
        },
      ],
      trainingGuidelines: {
        allowedIntensity: trainingIntensity,
        maxDuration,
        recommendedActivities:
          day <= 2
            ? ["walking", "light stretching", "mobility work", "pool recovery"]
            : ["position-specific drills", "moderate cardio", "skills work"],
        avoidActivities:
          day <= 2
            ? [
                "high-intensity intervals",
                "heavy lifting",
                "competition simulation",
              ]
            : day <= severity.estimatedRecoveryDays
              ? ["max effort work"]
              : [],
        notes: isRecovered
          ? "Fully adapted - normal training permitted"
          : `Day ${day} of ${severity.estimatedRecoveryDays} recovery days`,
      },
      hydrationTarget: 3500, // Extra hydration during recovery
      supplements:
        day <= 3
          ? [
              {
                name: "Melatonin",
                dosage: "0.5-3mg",
                timing: "30 min before target bedtime",
                purpose: "Support circadian adaptation",
                evidenceLevel: "strong",
              },
              {
                name: "Magnesium",
                dosage: "200-400mg",
                timing: "Evening",
                purpose: "Support sleep quality and muscle recovery",
                evidenceLevel: "moderate",
              },
            ]
          : [],
    };
  }

  // ============================================================================
  // TRAVEL CHECKLIST
  // ============================================================================

  /**
   * Get travel checklist for athletes
   */
  getTravelChecklist(): TravelChecklist[] {
    return [
      {
        category: "Sleep & Recovery",
        items: [
          {
            id: "sleep-1",
            item: "Eye mask (blackout quality)",
            packed: false,
            essential: true,
          },
          {
            id: "sleep-2",
            item: "Earplugs or noise-canceling headphones",
            packed: false,
            essential: true,
          },
          {
            id: "sleep-3",
            item: "Neck pillow for flight",
            packed: false,
            essential: false,
          },
          {
            id: "sleep-4",
            item: "Melatonin supplements",
            packed: false,
            essential: true,
            notes: "0.5-3mg doses",
          },
          {
            id: "sleep-5",
            item: "Compression socks",
            packed: false,
            essential: true,
          },
          {
            id: "sleep-6",
            item: "Light blanket/layer for cold planes",
            packed: false,
            essential: false,
          },
        ],
      },
      {
        category: "Hydration & Nutrition",
        items: [
          {
            id: "hydration-1",
            item: "Reusable water bottle (empty for security)",
            packed: false,
            essential: true,
          },
          {
            id: "hydration-2",
            item: "Electrolyte tablets/powder",
            packed: false,
            essential: true,
          },
          {
            id: "hydration-3",
            item: "Healthy snacks (nuts, protein bars)",
            packed: false,
            essential: true,
          },
          {
            id: "hydration-4",
            item: "Ginger chews (for nausea)",
            packed: false,
            essential: false,
          },
        ],
      },
      {
        category: "Training & Recovery Gear",
        items: [
          {
            id: "training-1",
            item: "Resistance bands",
            packed: false,
            essential: false,
          },
          {
            id: "training-2",
            item: "Foam roller (travel size)",
            packed: false,
            essential: false,
          },
          {
            id: "training-3",
            item: "Massage ball",
            packed: false,
            essential: false,
          },
          {
            id: "training-4",
            item: "Training shoes",
            packed: false,
            essential: true,
          },
          {
            id: "training-5",
            item: "Competition gear",
            packed: false,
            essential: true,
          },
        ],
      },
      {
        category: "Health & Wellness",
        items: [
          {
            id: "health-1",
            item: "Sunglasses (for light management)",
            packed: false,
            essential: true,
          },
          {
            id: "health-2",
            item: "Sunscreen",
            packed: false,
            essential: false,
          },
          {
            id: "health-3",
            item: "Basic first aid kit",
            packed: false,
            essential: false,
          },
          {
            id: "health-4",
            item: "Any prescription medications",
            packed: false,
            essential: true,
          },
          {
            id: "health-5",
            item: "Hand sanitizer",
            packed: false,
            essential: true,
          },
        ],
      },
      {
        category: "Documents & Tech",
        items: [
          {
            id: "docs-1",
            item: "Passport (valid 6+ months)",
            packed: false,
            essential: true,
          },
          {
            id: "docs-2",
            item: "Travel insurance documents",
            packed: false,
            essential: true,
          },
          {
            id: "docs-3",
            item: "Competition registration/credentials",
            packed: false,
            essential: true,
          },
          {
            id: "docs-4",
            item: "Phone charger & adapter",
            packed: false,
            essential: true,
          },
          { id: "docs-5", item: "Headphones", packed: false, essential: false },
        ],
      },
    ];
  }

  // ============================================================================
  // OLYMPIC VENUE HELPERS
  // ============================================================================

  /**
   * Get travel info for Olympic venues
   */
  getOlympicVenueInfo(venue: "LA28" | "BRISBANE32"): {
    timezone: string;
    offset: number;
    city: string;
  } {
    return OLYMPIC_VENUES[venue];
  }

  /**
   * Calculate jet lag for Olympic travel from user's timezone
   */
  calculateOlympicTravelImpact(
    homeTimezone: string,
    olympicVenue: "LA28" | "BRISBANE32",
  ): {
    timezonesDifference: number;
    direction: string;
    estimatedRecoveryDays: number;
  } {
    const home = MAJOR_TIMEZONES[homeTimezone];
    const venue = OLYMPIC_VENUES[olympicVenue];

    if (!home) {
      return {
        timezonesDifference: 0,
        direction: "unknown",
        estimatedRecoveryDays: 0,
      };
    }

    let diff = venue.offset - home.offset;
    if (diff > 12) diff -= 24;
    if (diff < -12) diff += 24;

    const direction = diff > 0 ? "eastward" : diff < 0 ? "westward" : "none";
    const absDiff = Math.abs(diff);
    const recoveryRate = direction === "eastward" ? 1.0 : 0.7;

    return {
      timezonesDifference: diff,
      direction,
      estimatedRecoveryDays: Math.ceil(absDiff * recoveryRate),
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get available timezones for selection
   */
  getAvailableTimezones(): Array<{
    value: string;
    label: string;
    offset: number;
  }> {
    return Object.entries(MAJOR_TIMEZONES).map(([tz, data]) => ({
      value: tz,
      label: `${data.city} (UTC${data.offset >= 0 ? "+" : ""}${data.offset})`,
      offset: data.offset,
    }));
  }

  /**
   * Parse time string to object
   */
  private parseTime(time: string): string {
    return time;
  }

  /**
   * Add minutes to time string
   */
  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor((((totalMinutes % 1440) + 1440) % 1440) / 60);
    const newMins = ((totalMinutes % 60) + 60) % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
  }

  /**
   * Get current protocol day
   */
  getCurrentProtocolDay(): RecoveryProtocol | null {
    const protocol = this._recoveryProtocol();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      protocol.find((p) => {
        const pDate = new Date(p.date);
        pDate.setHours(0, 0, 0, 0);
        return pDate.getTime() === today.getTime();
      }) || null
    );
  }

  // ============================================================================
  // CAR TRAVEL PROTOCOLS
  // ============================================================================

  /**
   * Calculate blood circulation risk for car travel
   * Based on duration, driver status, and other factors
   */
  calculateCarTravelRisk(
    durationHours: number,
    isDriver: boolean,
  ): BloodCirculationRisk {
    const factors: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Duration-based risk (primary factor)
    if (durationHours >= 10) {
      score += 40;
      factors.push("Very long travel duration (10+ hours)");
    } else if (durationHours >= 6) {
      score += 25;
      factors.push("Long travel duration (6-10 hours)");
    } else if (durationHours >= 4) {
      score += 15;
      factors.push("Moderate travel duration (4-6 hours)");
    }

    // Driver vs passenger (drivers have less movement options)
    if (isDriver) {
      score += 15;
      factors.push("Driving limits movement opportunities");
      recommendations.push("Switch drivers every 2 hours if possible");
    }

    // Determine risk level
    let riskLevel: BloodCirculationRisk["riskLevel"] = "low";
    if (score >= 50) {
      riskLevel = "very-high";
    } else if (score >= 35) {
      riskLevel = "high";
    } else if (score >= 20) {
      riskLevel = "moderate";
    }

    // Add risk-appropriate recommendations
    if (riskLevel === "very-high" || riskLevel === "high") {
      recommendations.push(
        "Wear compression garments throughout entire journey",
      );
      recommendations.push("Stop every 1-1.5 hours for movement breaks");
      recommendations.push("Use massage gun at every rest stop");
      recommendations.push("Perform seated exercises every 30 minutes");
    } else if (riskLevel === "moderate") {
      recommendations.push("Wear compression socks during travel");
      recommendations.push("Stop every 2 hours for movement breaks");
      recommendations.push("Perform ankle pumps every 30 minutes while seated");
    } else {
      recommendations.push("Stay hydrated and take periodic breaks");
    }

    const warningSymptoms = [
      "Leg swelling or puffiness",
      "Pain or tenderness in calf or thigh",
      "Warmth in one leg",
      "Red or discolored skin on leg",
      "Leg cramps that don't resolve with stretching",
      "Numbness or tingling in legs/feet",
    ];

    return {
      riskLevel,
      score,
      factors,
      recommendations,
      warningSymptoms,
    };
  }

  /**
   * Generate comprehensive car travel protocol
   */
  generateCarTravelProtocol(
    durationHours: number,
    isDriver: boolean,
  ): CarTravelProtocol[] {
    const protocols: CarTravelProtocol[] = [];

    // Pre-departure protocol
    protocols.push(this.generatePreDepartureProtocol());

    // During travel protocols (every 2 hours)
    const numStops = Math.floor(durationHours / 2);
    for (let i = 1; i <= numStops; i++) {
      protocols.push(
        this.generateDuringTravelProtocol(i * 2, isDriver, durationHours),
      );
    }

    // Post-arrival protocol
    protocols.push(this.generatePostArrivalProtocol(durationHours));

    return protocols;
  }

  /**
   * Pre-departure protocol for car travel
   */
  private generatePreDepartureProtocol(): CarTravelProtocol {
    return {
      phase: "pre-departure",
      hourMark: 0,
      recommendations: [
        {
          time: "30 min before",
          action: "Put on compression garments (socks or full leggings)",
          importance: "critical",
          category: "compression",
          evidenceBase:
            "Engel et al. (2016) - Compression enhances venous blood flow at rest",
        },
        {
          time: "30 min before",
          action: "Pre-hydrate with 500ml water + electrolytes",
          importance: "high",
          category: "hydration",
          evidenceBase: "Dehydration increases blood viscosity and DVT risk",
        },
        {
          time: "15 min before",
          action:
            "Use massage gun on calves, quads, and glutes for 5 minutes total",
          importance: "high",
          category: "circulation",
          evidenceBase:
            "Konrad et al. (2023) - Percussion therapy increases blood flow velocity",
          duration: 5,
        },
        {
          time: "Before departure",
          action:
            "Adjust seat for optimal posture - knees slightly higher than hips if possible",
          importance: "medium",
          category: "circulation",
        },
        {
          time: "Before departure",
          action:
            "Pack healthy snacks: bananas (potassium), nuts, whole grain crackers",
          importance: "medium",
          category: "nutrition",
        },
      ],
      circulationExercises: this.getSeatedExercises(),
      compressionGuidelines: this.getCompressionGuidelines("pre-travel"),
      hydrationTarget: 500,
      nutritionGuidelines: [
        {
          timing: "Before departure",
          recommendation: "Light, balanced meal 1-2 hours before travel",
          foods: ["Oatmeal", "Banana", "Eggs", "Whole grain toast"],
          avoid: ["Heavy fatty foods", "Excessive caffeine", "Alcohol"],
          reason:
            "Heavy meals divert blood to digestion; caffeine/alcohol cause dehydration",
        },
      ],
    };
  }

  /**
   * During travel protocol (rest stops)
   */
  private generateDuringTravelProtocol(
    hourMark: number,
    isDriver: boolean,
    totalDuration: number,
  ): CarTravelProtocol {
    const isLongTrip = totalDuration >= 8;
    const isMidPoint =
      hourMark >= totalDuration / 2 - 1 && hourMark <= totalDuration / 2 + 1;

    const recommendations: CarTravelRecommendation[] = [
      {
        time: `Hour ${hourMark}`,
        action: "STOP - Take a 10-15 minute break",
        importance: "critical",
        category: "rest",
        evidenceBase:
          "Regular breaks every 2 hours reduce DVT risk significantly",
        duration: 15,
      },
      {
        time: "At stop",
        action: "Walk briskly for 5 minutes minimum",
        importance: "critical",
        category: "circulation",
        evidenceBase:
          "Walking activates calf muscle pump, promoting venous return",
        duration: 5,
      },
      {
        time: "At stop",
        action: "Perform dynamic stretches: leg swings, lunges, calf raises",
        importance: "high",
        category: "circulation",
        duration: 3,
      },
      {
        time: "At stop",
        action: "Drink 250-500ml water or electrolyte drink",
        importance: "high",
        category: "hydration",
      },
    ];

    // Add massage gun recommendation at longer stops
    if (isMidPoint || isLongTrip) {
      recommendations.push({
        time: "At stop",
        action:
          "Use massage gun on calves (60s each), quads (60s each), glutes (60s each)",
        importance: "high",
        category: "circulation",
        evidenceBase:
          "Konrad et al. (2023) - 60-120s application increases blood flow 30-50%",
        duration: 6,
      });
    }

    // Driver-specific recommendations
    if (isDriver) {
      recommendations.push({
        time: "At stop",
        action: "Switch drivers if possible to allow leg movement",
        importance: "medium",
        category: "driver-safety",
      });
      recommendations.push({
        time: "At stop",
        action: "Do eye exercises and neck rolls to reduce driver fatigue",
        importance: "medium",
        category: "driver-safety",
      });
    }

    // Mid-trip meal recommendation
    if (isMidPoint) {
      recommendations.push({
        time: "At stop",
        action:
          "Have a light meal: sandwich, fruit, yogurt - avoid heavy/greasy food",
        importance: "medium",
        category: "nutrition",
      });
    }

    return {
      phase: "rest-stop",
      hourMark,
      recommendations,
      circulationExercises: this.getRestStopExercises(),
      compressionGuidelines: this.getCompressionGuidelines("during-travel"),
      hydrationTarget: 500,
      nutritionGuidelines: [
        {
          timing: `Hour ${hourMark}`,
          recommendation: "Light snack with potassium and complex carbs",
          foods: [
            "Banana",
            "Trail mix",
            "Whole grain crackers",
            "Apple with nut butter",
          ],
          avoid: ["Chips", "Candy", "Soda", "Fast food"],
          reason:
            "Potassium helps prevent muscle cramps; complex carbs provide sustained energy",
        },
      ],
    };
  }

  /**
   * Post-arrival protocol
   */
  private generatePostArrivalProtocol(
    totalDuration: number,
  ): CarTravelProtocol {
    const isLongTrip = totalDuration >= 8;

    return {
      phase: "post-arrival",
      hourMark: totalDuration,
      recommendations: [
        {
          time: "Immediately",
          action: "Walk for 10-15 minutes before sitting again",
          importance: "critical",
          category: "circulation",
          evidenceBase:
            "Post-travel movement critical for restoring normal circulation",
          duration: 15,
        },
        {
          time: "Within 30 min",
          action:
            "Use massage gun comprehensively: calves, quads, hamstrings, glutes, lower back",
          importance: "critical",
          category: "circulation",
          evidenceBase:
            "Konrad et al. (2023) - Post-activity percussion reduces muscle stiffness",
          duration: 10,
        },
        {
          time: "Within 30 min",
          action:
            "Perform full stretching routine focusing on hip flexors, hamstrings, calves",
          importance: "high",
          category: "circulation",
          duration: 10,
        },
        {
          time: "Within 1 hour",
          action: isLongTrip
            ? "Consider a 20-30 min light jog or swim to fully restore circulation"
            : "Light walk or mobility work recommended",
          importance: "high",
          category: "circulation",
        },
        {
          time: "Within 1 hour",
          action: "Rehydrate with 500-750ml water + electrolytes",
          importance: "high",
          category: "hydration",
        },
        {
          time: "Evening",
          action: "Keep compression garments on for 2-4 hours post-arrival",
          importance: "medium",
          category: "compression",
          evidenceBase:
            "Extended compression wear aids recovery from prolonged sitting",
        },
        {
          time: "Before bed",
          action: "Elevate legs for 15-20 minutes",
          importance: "medium",
          category: "circulation",
        },
      ],
      circulationExercises: this.getPostArrivalExercises(),
      compressionGuidelines: this.getCompressionGuidelines("post-arrival"),
      hydrationTarget: 750,
      nutritionGuidelines: [
        {
          timing: "Post-arrival meal",
          recommendation: "Anti-inflammatory meal with lean protein",
          foods: [
            "Grilled salmon or chicken",
            "Leafy greens",
            "Sweet potato",
            "Berries",
            "Turmeric/ginger",
          ],
          avoid: ["Alcohol", "Processed foods", "Excessive sodium"],
          reason:
            "Anti-inflammatory foods support recovery; protein aids muscle repair",
        },
      ],
    };
  }

  /**
   * Get seated exercises for during travel
   */
  getSeatedExercises(): CirculationExercise[] {
    return [
      {
        name: "Ankle Pumps",
        description:
          "Point toes down, then pull up toward shin. Alternate rhythmically.",
        sets: 3,
        reps: 20,
        targetArea: "calves",
        canDoSeated: true,
        evidenceBase: "Activates soleus muscle pump, promoting venous return",
      },
      {
        name: "Ankle Circles",
        description: "Rotate ankles in circles, 10 each direction per foot.",
        sets: 2,
        reps: 10,
        targetArea: "calves",
        canDoSeated: true,
      },
      {
        name: "Heel Raises (Seated)",
        description:
          "Lift heels off floor while keeping toes down, hold 2 seconds.",
        sets: 3,
        reps: 15,
        duration: 2,
        targetArea: "calves",
        canDoSeated: true,
        evidenceBase: "Engages gastrocnemius and soleus muscles",
      },
      {
        name: "Toe Raises",
        description:
          "Lift toes off floor while keeping heels down, hold 2 seconds.",
        sets: 3,
        reps: 15,
        duration: 2,
        targetArea: "calves",
        canDoSeated: true,
      },
      {
        name: "Knee Lifts",
        description: "Lift knee toward chest, hold 3 seconds, alternate legs.",
        sets: 2,
        reps: 10,
        duration: 3,
        targetArea: "thighs",
        canDoSeated: true,
        evidenceBase: "Activates hip flexors and promotes femoral vein flow",
      },
      {
        name: "Glute Squeezes",
        description: "Squeeze glutes tightly, hold 5 seconds, release.",
        sets: 3,
        reps: 10,
        duration: 5,
        targetArea: "glutes",
        canDoSeated: true,
        evidenceBase:
          "Activates gluteal muscles and promotes pelvic circulation",
      },
      {
        name: "Thigh Squeezes",
        description: "Press knees together firmly, hold 5 seconds, release.",
        sets: 3,
        reps: 10,
        duration: 5,
        targetArea: "thighs",
        canDoSeated: true,
      },
    ];
  }

  /**
   * Get rest stop exercises
   */
  getRestStopExercises(): CirculationExercise[] {
    return [
      {
        name: "Walking",
        description: "Brisk walking around rest area or parking lot.",
        sets: 1,
        reps: 1,
        duration: 300, // 5 minutes
        targetArea: "full-body",
        canDoSeated: false,
        evidenceBase:
          "Walking is the most effective way to activate muscle pumps",
      },
      {
        name: "Standing Calf Raises",
        description: "Rise up on toes, hold 2 seconds, lower slowly.",
        sets: 3,
        reps: 15,
        duration: 2,
        targetArea: "calves",
        canDoSeated: false,
        evidenceBase: "Stronger calf muscle activation than seated version",
      },
      {
        name: "Leg Swings (Forward/Back)",
        description: "Hold onto car for balance, swing leg forward and back.",
        sets: 2,
        reps: 15,
        targetArea: "thighs",
        canDoSeated: false,
      },
      {
        name: "Leg Swings (Side to Side)",
        description:
          "Hold onto car for balance, swing leg across body and out.",
        sets: 2,
        reps: 15,
        targetArea: "thighs",
        canDoSeated: false,
      },
      {
        name: "Walking Lunges",
        description:
          "Step forward into lunge, alternate legs for 10 steps each.",
        sets: 2,
        reps: 10,
        targetArea: "thighs",
        canDoSeated: false,
        evidenceBase: "Opens hip flexors compressed during sitting",
      },
      {
        name: "Hip Circles",
        description: "Hands on hips, rotate hips in large circles.",
        sets: 2,
        reps: 10,
        targetArea: "lower-back",
        canDoSeated: false,
      },
      {
        name: "Standing Quad Stretch",
        description: "Pull foot to glute, hold 30 seconds each leg.",
        sets: 1,
        reps: 1,
        duration: 30,
        targetArea: "thighs",
        canDoSeated: false,
      },
      {
        name: "Standing Hamstring Stretch",
        description: "Place heel on bumper/bench, lean forward gently.",
        sets: 1,
        reps: 1,
        duration: 30,
        targetArea: "thighs",
        canDoSeated: false,
      },
    ];
  }

  /**
   * Get post-arrival exercises
   */
  getPostArrivalExercises(): CirculationExercise[] {
    return [
      ...this.getRestStopExercises(),
      {
        name: "Foam Rolling - Calves",
        description: "Roll calves on foam roller, 60 seconds each leg.",
        sets: 1,
        reps: 1,
        duration: 60,
        targetArea: "calves",
        canDoSeated: false,
        evidenceBase:
          "Foam rolling increases blood flow and reduces muscle tension",
      },
      {
        name: "Foam Rolling - Quads",
        description: "Roll quads on foam roller, 60 seconds each leg.",
        sets: 1,
        reps: 1,
        duration: 60,
        targetArea: "thighs",
        canDoSeated: false,
      },
      {
        name: "Foam Rolling - IT Band",
        description: "Roll outer thigh on foam roller, 60 seconds each leg.",
        sets: 1,
        reps: 1,
        duration: 60,
        targetArea: "thighs",
        canDoSeated: false,
      },
      {
        name: "Hip Flexor Stretch (Lunge)",
        description: "Deep lunge position, push hips forward, hold 60 seconds.",
        sets: 1,
        reps: 1,
        duration: 60,
        targetArea: "thighs",
        canDoSeated: false,
        evidenceBase:
          "Hip flexors shorten significantly during prolonged sitting",
      },
      {
        name: "Pigeon Pose",
        description:
          "Yoga pigeon pose to open hips, hold 60 seconds each side.",
        sets: 1,
        reps: 1,
        duration: 60,
        targetArea: "glutes",
        canDoSeated: false,
      },
      {
        name: "Cat-Cow Stretches",
        description: "On hands and knees, alternate arching and rounding back.",
        sets: 2,
        reps: 10,
        targetArea: "lower-back",
        canDoSeated: false,
        evidenceBase: "Restores spinal mobility after prolonged sitting",
      },
    ];
  }

  /**
   * Get compression guidelines based on phase
   */
  getCompressionGuidelines(
    phase: "pre-travel" | "during-travel" | "post-arrival",
  ): CompressionGuideline {
    const baseGuideline: CompressionGuideline = {
      garmentType: "full-leggings",
      pressureLevel: "moderate",
      pressureMmHg: "15-20 mmHg",
      wearDuration: "Entire journey",
      whenToWear: "Put on 30 minutes before departure",
      whenToRemove: "2-4 hours after arrival",
      cautions: [
        "Ensure proper fit - should be snug but not painful",
        "Remove immediately if numbness, tingling, or increased pain occurs",
        "Not recommended if you have peripheral artery disease",
        "Consult doctor if you have diabetes or circulation issues",
      ],
      evidenceBase:
        "Engel et al. (2016) - Meta-analysis: compression garments enhance venous blood flow during rest and recovery",
    };

    switch (phase) {
      case "pre-travel":
        return {
          ...baseGuideline,
          whenToWear: "Put on 30 minutes before departure",
          whenToRemove: "Keep on during travel",
        };
      case "during-travel":
        return {
          ...baseGuideline,
          whenToWear: "Should already be wearing from pre-departure",
          whenToRemove: "Keep on until 2-4 hours after arrival",
        };
      case "post-arrival":
        return {
          ...baseGuideline,
          wearDuration: "2-4 hours after arrival",
          whenToWear: "Continue wearing from travel",
          whenToRemove: "Remove after 2-4 hours, or before bed if comfortable",
        };
    }
  }

  /**
   * Get massage gun protocol for car travel
   */
  getMassageGunProtocol(): MassageGunProtocol[] {
    return [
      {
        timing: "pre-travel",
        targetMuscles: [
          {
            muscle: "Calves (Gastrocnemius & Soleus)",
            duration: 60,
            pressure: "moderate",
            technique: "Slow sweeping motions from ankle to knee",
            purpose: "Prime calf muscle pump for travel",
          },
          {
            muscle: "Quadriceps",
            duration: 60,
            pressure: "moderate",
            technique: "Work from knee to hip in sections",
            purpose: "Increase blood flow to large muscle group",
          },
          {
            muscle: "Glutes",
            duration: 60,
            pressure: "firm",
            technique: "Circular motions on gluteus maximus",
            purpose: "Activate glutes that will be compressed during sitting",
          },
        ],
        totalDuration: 5,
        frequency: "Once before departure",
        cautions: [
          "Do NOT use on bony areas (kneecap, shin bone, spine)",
          "Avoid if you have blood clots or DVT history",
          "Start with lower intensity and increase gradually",
          "Never use for more than 2 minutes on one spot",
        ],
        evidenceBase:
          "Konrad et al. (2023) - Localized percussion vibration increases blood flow velocity by 30-50%",
      },
      {
        timing: "rest-stop",
        targetMuscles: [
          {
            muscle: "Calves",
            duration: 45,
            pressure: "moderate",
            technique: "Focus on any areas of tightness",
            purpose: "Restore circulation after sitting",
          },
          {
            muscle: "Quadriceps",
            duration: 45,
            pressure: "moderate",
            technique: "Quick passes over entire muscle",
            purpose: "Reduce stiffness from static position",
          },
          {
            muscle: "Hip Flexors",
            duration: 30,
            pressure: "light",
            technique: "Gentle work on front of hip",
            purpose: "Release tension from hip flexion",
          },
        ],
        totalDuration: 3,
        frequency: "Every 2-3 hours at rest stops",
        cautions: [
          "Keep sessions brief during travel",
          "Focus on comfort, not deep tissue work",
          "Stay hydrated after use",
        ],
        evidenceBase:
          "Mayo Clinic (2024) - Percussion therapy stimulates mechanoreceptors, reducing pain perception",
      },
      {
        timing: "post-arrival",
        targetMuscles: [
          {
            muscle: "Calves",
            duration: 90,
            pressure: "moderate",
            technique: "Thorough work from ankle to knee, all sides",
            purpose: "Full restoration of calf circulation",
          },
          {
            muscle: "Quadriceps",
            duration: 90,
            pressure: "moderate",
            technique: "Work entire quad including VMO and outer quad",
            purpose: "Release tension and restore blood flow",
          },
          {
            muscle: "Hamstrings",
            duration: 90,
            pressure: "moderate",
            technique: "Work from behind knee to glute fold",
            purpose: "Address muscles compressed against seat",
          },
          {
            muscle: "Glutes",
            duration: 90,
            pressure: "firm",
            technique: "Deep work on gluteus maximus and medius",
            purpose: "Release tension from prolonged compression",
          },
          {
            muscle: "Lower Back (Erector Spinae)",
            duration: 60,
            pressure: "light",
            technique: "Gentle work along spine muscles, NOT on spine",
            purpose: "Relieve tension from driving posture",
          },
        ],
        totalDuration: 10,
        frequency: "Once within 30 minutes of arrival",
        cautions: [
          "This is the most comprehensive session",
          "Take your time and focus on problem areas",
          "If any area is particularly sore, use lighter pressure",
          "STOP if you experience sharp pain",
          "WARNING: Excessive use can cause rhabdomyolysis (Szabo et al. 2020)",
        ],
        evidenceBase:
          "Cheatham et al. (2021) - Massage guns improve flexibility and reduce muscle soreness post-activity",
      },
    ];
  }

  /**
   * Get car travel checklist
   */
  getCarTravelChecklist(): TravelChecklist[] {
    return [
      {
        category: "Compression & Circulation",
        items: [
          {
            id: "comp-1",
            item: "Compression leggings (15-20 mmHg)",
            packed: false,
            essential: true,
            notes: "Full-length for maximum coverage",
          },
          {
            id: "comp-2",
            item: "Compression socks (backup pair)",
            packed: false,
            essential: true,
            notes: "Knee-high, graduated compression",
          },
          {
            id: "comp-3",
            item: "Massage gun + charger",
            packed: false,
            essential: true,
            notes: "Fully charged before departure",
          },
          {
            id: "comp-4",
            item: "Foam roller (travel size)",
            packed: false,
            essential: false,
            notes: "For post-arrival recovery",
          },
          {
            id: "comp-5",
            item: "Massage ball / lacrosse ball",
            packed: false,
            essential: false,
            notes: "For trigger point release",
          },
          {
            id: "comp-6",
            item: "Resistance bands",
            packed: false,
            essential: false,
            notes: "For rest stop exercises",
          },
        ],
      },
      {
        category: "Hydration & Nutrition",
        items: [
          {
            id: "hyd-1",
            item: "Large water bottles (2-3L total)",
            packed: false,
            essential: true,
            notes: "Aim for 250ml per hour of travel",
          },
          {
            id: "hyd-2",
            item: "Electrolyte tablets/powder",
            packed: false,
            essential: true,
            notes: "Prevents cramping and dehydration",
          },
          {
            id: "hyd-3",
            item: "Bananas (potassium)",
            packed: false,
            essential: true,
            notes: "Natural cramp prevention",
          },
          {
            id: "hyd-4",
            item: "Trail mix / nuts",
            packed: false,
            essential: true,
            notes: "Healthy fats and protein",
          },
          {
            id: "hyd-5",
            item: "Whole grain crackers / rice cakes",
            packed: false,
            essential: false,
            notes: "Complex carbs for energy",
          },
          {
            id: "hyd-6",
            item: "Protein bars",
            packed: false,
            essential: false,
            notes: "Low fiber for travel",
          },
          {
            id: "hyd-7",
            item: "Cooler with ice packs",
            packed: false,
            essential: true,
            notes: "Keep drinks and snacks cold",
          },
        ],
      },
      {
        category: "Comfort & Ergonomics",
        items: [
          {
            id: "comf-1",
            item: "Lumbar support cushion",
            packed: false,
            essential: true,
            notes: "Maintains proper spine alignment",
          },
          {
            id: "comf-2",
            item: "Seat cushion (if needed)",
            packed: false,
            essential: false,
            notes: "Reduces pressure on glutes",
          },
          {
            id: "comf-3",
            item: "Neck pillow",
            packed: false,
            essential: false,
            notes: "For passenger rest periods",
          },
          {
            id: "comf-4",
            item: "Blanket / light layer",
            packed: false,
            essential: false,
            notes: "AC can affect circulation",
          },
        ],
      },
      {
        category: "Driver Safety",
        items: [
          {
            id: "drive-1",
            item: "Sunglasses",
            packed: false,
            essential: true,
            notes: "Reduce eye strain",
          },
          {
            id: "drive-2",
            item: "Caffeine (coffee/tea/gum)",
            packed: false,
            essential: false,
            notes: "Use strategically, not excessively",
          },
          {
            id: "drive-3",
            item: "Podcast/audiobook/music playlist",
            packed: false,
            essential: false,
            notes: "Mental stimulation for alertness",
          },
          {
            id: "drive-4",
            item: "Phone mount",
            packed: false,
            essential: true,
            notes: "For safe navigation",
          },
        ],
      },
      {
        category: "Emergency & Health",
        items: [
          {
            id: "emerg-1",
            item: "First aid kit",
            packed: false,
            essential: true,
          },
          {
            id: "emerg-2",
            item: "Pain relievers (ibuprofen)",
            packed: false,
            essential: false,
            notes: "For unexpected soreness",
          },
          {
            id: "emerg-3",
            item: "Phone charger / car charger",
            packed: false,
            essential: true,
          },
          {
            id: "emerg-4",
            item: "Emergency contact info",
            packed: false,
            essential: true,
          },
        ],
      },
    ];
  }

  /**
   * Get evidence-based research summary for car travel
   */
  getCarTravelResearchSummary(): Array<{
    topic: string;
    finding: string;
    source: string;
    pubmedId?: string;
    recommendation: string;
  }> {
    return [
      {
        topic: "Compression Garments & Blood Flow",
        finding:
          "Sports compression garments significantly enhance venous blood flow at rest, during exercise, and in recovery. Meta-analysis of 29 studies showed consistent improvements in peripheral blood flow.",
        source: "Engel et al. (2016) - Systematic Review & Meta-Analysis",
        pubmedId: "36622554",
        recommendation:
          "Wear 15-20 mmHg graduated compression socks or leggings during all travel >2 hours.",
      },
      {
        topic: "Compression & Performance",
        finding:
          "Lower-limb compression tights worn during repeated-sprint cycling improved muscle blood flow and overall performance. Benefits seen in both blood flow velocity and muscle oxygenation.",
        source: "Brophy-Williams et al. (2017)",
        pubmedId: "29252067",
        recommendation:
          "Compression can help maintain performance readiness during travel to competitions.",
      },
      {
        topic: "Compression & Hemodynamics",
        finding:
          "Compression garments enhance central hemodynamic responses, including increased stroke volume and reduced heart rate, particularly after physiological challenges.",
        source: "Born et al. (2013)",
        pubmedId: "33065703",
        recommendation:
          "Continue wearing compression for 2-4 hours post-travel for optimal recovery.",
      },
      {
        topic: "Massage Gun & Blood Flow",
        finding:
          "Localized percussion vibration using massage guns increases blood flow velocity by 30-50% and muscle volume. Higher frequencies (40-53 Hz) and longer durations (60-120s) produce greater increases.",
        source: "Konrad et al. (2023) - Journal of Clinical Medicine",
        pubmedId: "MDPI: 10.3390/jcm12052047",
        recommendation:
          "Use massage gun for 60-90 seconds per muscle group at rest stops and post-arrival.",
      },
      {
        topic: "Massage Gun & Flexibility",
        finding:
          "Systematic review found massage guns effectively improve flexibility in iliopsoas, hamstrings, triceps surae, and posterior chain muscles.",
        source: "Cheatham et al. (2021)",
        pubmedId: "37754971",
        recommendation:
          "Combine massage gun use with stretching for optimal flexibility restoration.",
      },
      {
        topic: "Massage Gun Safety Warning",
        finding:
          "Case reports of severe rhabdomyolysis following excessive massage gun use, particularly in young athletes. Risk increases with prolonged application (>2 min per area) and high pressure.",
        source: "Szabo et al. (2020)",
        pubmedId: "33156927",
        recommendation:
          "NEVER use massage gun for more than 2 minutes on one area. Use moderate pressure. Stop if pain occurs.",
      },
      {
        topic: "Prolonged Sitting & DVT Risk",
        finding:
          "Sitting for more than 4 hours increases DVT risk 2-3 times. Risk compounds with duration and is present in car travel as well as air travel.",
        source: "Scurr et al. (2001) / Clarke et al. (2016) Cochrane Review",
        recommendation:
          "Take mandatory breaks every 2 hours. Perform seated exercises every 30 minutes.",
      },
      {
        topic: "Movement & Venous Return",
        finding:
          "The calf muscle pump (soleus and gastrocnemius) is critical for venous return. Simple ankle pumps and calf raises significantly improve blood flow even when seated.",
        source: "Multiple studies on venous physiology",
        recommendation:
          "Perform 20 ankle pumps every 30 minutes during travel. Do standing calf raises at every stop.",
      },
      {
        topic: "Hydration & Blood Viscosity",
        finding:
          "Dehydration increases blood viscosity, making clot formation more likely. Adequate hydration is essential for maintaining healthy blood flow during prolonged sitting.",
        source: "General cardiovascular research",
        recommendation:
          "Drink 250ml water per hour of travel. Include electrolytes to maintain hydration.",
      },
    ];
  }
}
