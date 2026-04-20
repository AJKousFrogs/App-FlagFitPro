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
import { TRAVEL_CHECKLIST } from "./travel-recovery.data";

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
    return TRAVEL_CHECKLIST;
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

}
