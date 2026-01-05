import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import {
  getInvertedStatusHexColor,
  getStatusHexColor,
} from "../utils/design-tokens.util";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { RealtimeService } from "./realtime.service";
import { SupabaseService } from "./supabase.service";

// API Endpoints for recovery data
const API_ENDPOINTS = {
  recovery: {
    researchInsights: "/api/recovery/research-insights",
    weeklyTrends: "/api/recovery/weekly-trends",
    protocolEffectiveness: "/api/recovery/protocol-effectiveness",
  },
};

export interface RecoveryMetric {
  name: string;
  value: number;
  unit: string;
  percentage: number;
  icon: string;
  color: string;
}

export interface RecoveryProtocol {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // in minutes
  priority: "high" | "medium" | "low";
  evidenceLevel: string;
  studyCount: number;
  benefits: string[];
  steps: ProtocolStep[];
  type?: string;
  equipment?: string[];
  targetMuscles?: string[];
  intensity?: string;
  icon?: string;
}

export interface ProtocolStep {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  icon: string;
  completed: boolean;
  active: boolean;
}

export interface RecoverySession {
  id: string;
  protocol: RecoveryProtocol;
  startTime: Date;
  duration: number;
  progress: number;
  paused: boolean;
}

export interface RecoveryData {
  overallScore: number;
  metrics: RecoveryMetric[];
}

export interface ResearchInsight {
  id: string;
  title: string;
  summary: string;
  authors: string;
  year: number;
  journal: string;
  doi: string;
  category: string;
}

// Database Types for Recovery
interface DatabaseRecoveryProtocol {
  id: string;
  protocol_name: string;
  protocol_description: string;
  category: string;
  duration_minutes: number;
  priority: "high" | "medium" | "low";
  evidence_level: string;
  study_count: number;
  benefits: string[];
  steps: ProtocolStep[];
  equipment_required: string[];
  target_muscles: string[];
  contraindications: string[];
  precautions: string;
  optimal_timing: string;
  frequency_recommendation: string;
  intensity_level: string;
  icon: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Athlete Recovery Profile interface
export interface AthleteRecoveryProfile {
  id: string;
  athleteId: string;
  recoveryPreferences: {
    preferredModalities: string[];
    avoidedModalities: string[];
    temperatureSensitivity: "low" | "normal" | "high";
    pressureTolerance: "low" | "moderate" | "high";
  };
  sleepPattern: {
    typicalBedtime: string;
    typicalWakeTime: string;
    sleepQualityAverage: number;
    sleepIssues: string[];
    chronotype: "early" | "intermediate" | "late";
  };
  stressTriggers: string[];
  recoveryAccelerators: string[];
  recoveryGoals: string[];
  preferredRecoveryTimes: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
  recoveryEnvironment: "home" | "gym" | "facility" | "mixed";
  recoveryEquipmentOwned: string[];
  recoveryEquipmentDesired: string[];
  recoveryBudgetMonthly: number | null;
  timeAvailableDailyMinutes: number;
  injuryHistory: string[];
  chronicConditions: string[];
  areasOfConcern: string[];
  baselineHrv: number | null;
  baselineRestingHr: number | null;
  baselineSleepScore: number | null;
  baselineRecoveryScore: number | null;
  protocolEffectiveness: Record<string, number>;
  favoriteProtocols: string[];
  profileCompleted: boolean;
  lastAssessmentDate: Date | null;
}

interface DatabaseRecoverySession {
  id: string;
  athlete_id: string;
  protocol_id: string;
  protocol?: DatabaseRecoveryProtocol;
  start_time: string;
  duration_minutes: number;
  progress_percentage: number;
  is_paused: boolean;
  status: "in_progress" | "paused" | "completed" | "stopped";
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Allow additional properties for Record<string, unknown> compatibility
}

@Injectable({
  providedIn: "root",
})
export class RecoveryService {
  private supabaseService = inject(SupabaseService);
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);
  private realtimeService = inject(RealtimeService);

  // Get current user ID reactively
  private userId = computed(() => this.supabaseService.userId());

  // State signals for recovery sessions
  private readonly _activeSessions = signal<RecoverySession[]>([]);
  readonly activeSessions = this._activeSessions.asReadonly();

  constructor() {
    // Set up realtime subscription when user logs in/out
    effect(() => {
      const userId = this.userId();

      if (userId) {
        this.logger.info(
          "[Recovery] User logged in, setting up realtime subscriptions",
        );
        this.loadActiveSessions(userId);
        this.subscribeToSessionUpdates(userId);
      } else {
        this.logger.info("[Recovery] User logged out, cleaning up");
        this._activeSessions.set([]);
        this.realtimeService.unsubscribe("recovery_sessions");
      }
    });
  }

  /**
   * Load active recovery sessions from database
   */
  private async loadActiveSessions(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("recovery_sessions")
        .select(
          `
          *,
          protocol:recovery_protocols(*)
        `,
        )
        .eq("athlete_id", userId)
        .in("status", ["in_progress", "paused"])
        .order("started_at", { ascending: false });

      if (error) {
        this.logger.error("[Recovery] Error loading active sessions:", error);
        return;
      }

      const sessions = (data || []).map(this.transformSession.bind(this));
      this._activeSessions.set(sessions);
      this.logger.success(
        `[Recovery] Loaded ${sessions.length} active sessions`,
      );
    } catch (error) {
      this.logger.error("[Recovery] Failed to load active sessions:", error);
    }
  }

  /**
   * Subscribe to realtime recovery session updates
   */
  private subscribeToSessionUpdates(userId: string): void {
    this.realtimeService.subscribe<DatabaseRecoverySession>(
      "recovery_sessions",
      `athlete_id=eq.${userId}`,
      {
        onInsert: async (payload) => {
          this.logger.info("[Recovery] New session received via realtime");
          const session = await this.fetchSessionWithProtocol(payload.new.id);
          if (session) {
            const current = this._activeSessions();
            this._activeSessions.set([session, ...current]);
          }
        },
        onUpdate: async (payload) => {
          this.logger.info("[Recovery] Session updated via realtime");
          const session = await this.fetchSessionWithProtocol(payload.new.id);
          if (session) {
            const current = this._activeSessions();
            const index = current.findIndex((s) => s.id === session.id);

            if (index !== -1) {
              const updated = [...current];
              updated[index] = session;
              this._activeSessions.set(updated);
            } else if (session.progress < 100) {
              // New active session
              this._activeSessions.set([session, ...current]);
            }
          }
        },
        onDelete: (payload) => {
          this.logger.info("[Recovery] Session deleted via realtime");
          const current = this._activeSessions();
          const filtered = current.filter((s) => s.id !== payload.old.id);
          this._activeSessions.set(filtered);
        },
      },
    );
  }

  /**
   * Fetch session with protocol details
   */
  private async fetchSessionWithProtocol(
    sessionId: string,
  ): Promise<RecoverySession | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("recovery_sessions")
        .select(
          `
          *,
          protocol:recovery_protocols(*)
        `,
        )
        .eq("id", sessionId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.transformSession(data);
    } catch (error) {
      this.logger.error("[Recovery] Error fetching session:", error);
      return null;
    }
  }

  /**
   * Transform database session to RecoverySession
   */
  private transformSession(data: DatabaseRecoverySession): RecoverySession {
    return {
      id: data.id,
      protocol: this.transformProtocol(
        data.protocol ?? ({} as DatabaseRecoveryProtocol),
      ),
      startTime: new Date(data.start_time),
      duration: data.duration_minutes,
      progress: data.progress_percentage || 0,
      paused: data.is_paused || false,
    };
  }

  /**
   * Transform database protocol to RecoveryProtocol
   */
  private transformProtocol(data: DatabaseRecoveryProtocol): RecoveryProtocol {
    return this.transformDatabaseProtocol(data);
  }

  /**
   * Get current recovery metrics from wellness data
   * Calculates recovery score based on latest wellness entry
   */
  getRecoveryMetrics(): Observable<RecoveryData> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("[Recovery] No user logged in - real data required");
      throw new Error("Authentication required for recovery metrics");
    }

    return from(
      (async () => {
        // Get latest wellness entry
        const { data, error } = await this.supabaseService.client
          .from("wellness_entries")
          .select("*")
          .eq("athlete_id", userId)
          .order("date", { ascending: false })
          .limit(1)
          .single();

        if (error || !data) {
          throw new Error("No wellness data available for this athlete");
        }

        // Calculate recovery metrics from wellness data
        const sleepQuality = data.sleep_quality || 5;
        const energyLevel = data.energy_level || 5;
        const stressLevel = data.stress_level || 5;
        const soreness = data.muscle_soreness || 5;

        // Overall score (0-100)
        const overallScore = Math.round(
          ((sleepQuality + energyLevel + (10 - stressLevel) + (10 - soreness)) /
            40) *
            100,
        );

        return {
          overallScore,
          metrics: [
            {
              name: "Sleep Quality",
              value: sleepQuality,
              unit: "/10",
              percentage: sleepQuality * 10,
              icon: "pi pi-moon",
              color: getStatusHexColor(sleepQuality, 7, 5), // ≥7 green, ≥5 warning, <5 error
            },
            {
              name: "Energy Level",
              value: energyLevel,
              unit: "/10",
              percentage: energyLevel * 10,
              icon: "pi pi-bolt",
              color: getStatusHexColor(energyLevel, 7, 5), // ≥7 green, ≥5 warning, <5 error
            },
            {
              name: "Muscle Soreness",
              value: soreness,
              unit: "/10",
              percentage: (10 - soreness) * 10, // Invert: lower soreness = better
              icon: "pi pi-exclamation-circle",
              color: getInvertedStatusHexColor(soreness, 3, 6), // ≤3 green, ≤6 warning, >6 error
            },
            {
              name: "Stress Level",
              value: stressLevel,
              unit: "/10",
              percentage: (10 - stressLevel) * 10, // Invert: lower stress = better
              icon: "pi pi-info-circle",
              color: getInvertedStatusHexColor(stressLevel, 3, 6), // ≤3 green, ≤6 warning, >6 error
            },
          ],
        };
      })(),
    ).pipe(
      catchError((error) => {
        this.logger.error("[Recovery] Error fetching real metrics:", error);
        throw error;
      }),
    );
  }

  /**
   * Get recommended recovery protocols based on current metrics
   * First tries to load from database, fails if unavailable
   */
  getRecommendedProtocols(): Observable<RecoveryProtocol[]> {
    return from(this.loadProtocolsFromDatabase());
  }

  private async loadProtocolsFromDatabase(): Promise<RecoveryProtocol[]> {
    try {
      // Try to load from recovery_protocols table
      const { data, error } = await this.supabaseService.client
        .from("recovery_protocols")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true })
        .order("protocol_name");

      if (error) {
        this.logger.error("[Recovery] Protocols table not available:", error);
        throw error;
      }

      if (data && data.length > 0) {
        this.logger.success(
          `[Recovery] Loaded ${data.length} protocols from database`,
        );
        return data.map((p: DatabaseRecoveryProtocol) =>
          this.transformDatabaseProtocol(p),
        );
      }

      throw new Error("No recovery protocols found in database");
    } catch (error) {
      this.logger.error("[Recovery] Failed to load protocols:", error);
      throw error;
    }
  }

  /**
   * Transform database protocol record to RecoveryProtocol interface
   */
  private transformDatabaseProtocol(
    p: DatabaseRecoveryProtocol,
  ): RecoveryProtocol {
    // Map category to display-friendly format
    const categoryDisplayMap: Record<string, string> = {
      cryotherapy: "Cryotherapy",
      compression: "Compression",
      manual_therapy: "Manual Therapy",
      heat_therapy: "Heat Therapy",
      sleep: "Sleep",
      nutrition: "Nutrition",
      hydration: "Hydration",
      mobility: "Mobility",
      breathing: "Breathing",
      mental_recovery: "Mental Recovery",
      active_recovery: "Active Recovery",
      passive_recovery: "Passive Recovery",
    };

    // Map evidence level to display format
    const evidenceLevelMap: Record<string, string> = {
      A: "Strong",
      B: "Moderate",
      C: "Limited",
      D: "Expert Opinion",
    };

    return {
      id: p.id,
      name: p.protocol_name,
      description: p.protocol_description || "",
      category: categoryDisplayMap[p.category] || p.category,
      duration: p.duration_minutes || 20,
      priority: p.priority || "medium",
      evidenceLevel:
        evidenceLevelMap[p.evidence_level] || p.evidence_level || "Moderate",
      studyCount: p.study_count || 0,
      benefits: p.benefits || [],
      steps: p.steps || [],
      type: p.category,
      equipment: p.equipment_required || [],
      targetMuscles: p.target_muscles || [],
      intensity: p.intensity_level || "low",
      icon: p.icon || "pi pi-heart",
    };
  }

  /**
   * Get protocols filtered by category
   */
  getProtocolsByCategory(category: string): Observable<RecoveryProtocol[]> {
    return from(this.loadProtocolsByCategoryFromDatabase(category));
  }

  private async loadProtocolsByCategoryFromDatabase(
    category: string,
  ): Promise<RecoveryProtocol[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("recovery_protocols")
        .select("*")
        .eq("is_active", true)
        .eq("category", category.toLowerCase().replace(" ", "_"))
        .order("priority", { ascending: true })
        .order("protocol_name");

      if (error) {
        this.logger.debug(
          `[Recovery] Error loading ${category} protocols:`,
          error,
        );
        return [];
      }

      return (data || []).map((p: DatabaseRecoveryProtocol) =>
        this.transformDatabaseProtocol(p),
      );
    } catch {
      return [];
    }
  }

  /**
   * Get athlete's recovery profile
   */
  getAthleteRecoveryProfile(): Observable<AthleteRecoveryProfile | null> {
    const userId = this.userId();

    if (!userId) {
      this.logger.warn(
        "[Recovery] No user logged in, cannot fetch recovery profile",
      );
      return of(null);
    }

    return from(this.loadAthleteRecoveryProfile(userId));
  }

  private async loadAthleteRecoveryProfile(
    userId: string,
  ): Promise<AthleteRecoveryProfile | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from("athlete_recovery_profiles")
        .select("*")
        .eq("athlete_id", userId)
        .single();

      if (error || !data) {
        this.logger.debug("[Recovery] No recovery profile found for user");
        return null;
      }

      return this.transformRecoveryProfile(data);
    } catch {
      return null;
    }
  }

  private transformRecoveryProfile(
    data: Record<string, unknown>,
  ): AthleteRecoveryProfile {
    const preferences =
      (data["recovery_preferences"] as Record<string, unknown>) || {};
    const sleepPattern =
      (data["sleep_pattern"] as Record<string, unknown>) || {};
    const recoveryTimes =
      (data["preferred_recovery_times"] as Record<string, boolean>) || {};

    return {
      id: data["id"] as string,
      athleteId: data["athlete_id"] as string,
      recoveryPreferences: {
        preferredModalities:
          (preferences["preferred_modalities"] as string[]) || [],
        avoidedModalities:
          (preferences["avoided_modalities"] as string[]) || [],
        temperatureSensitivity:
          (preferences["temperature_sensitivity"] as
            | "low"
            | "normal"
            | "high") || "normal",
        pressureTolerance:
          (preferences["pressure_tolerance"] as "low" | "moderate" | "high") ||
          "moderate",
      },
      sleepPattern: {
        typicalBedtime: (sleepPattern["typical_bedtime"] as string) || "22:00",
        typicalWakeTime:
          (sleepPattern["typical_wake_time"] as string) || "06:00",
        sleepQualityAverage:
          (sleepPattern["sleep_quality_average"] as number) || 7,
        sleepIssues: (sleepPattern["sleep_issues"] as string[]) || [],
        chronotype:
          (sleepPattern["chronotype"] as "early" | "intermediate" | "late") ||
          "intermediate",
      },
      stressTriggers: (data["stress_triggers"] as string[]) || [],
      recoveryAccelerators: (data["recovery_accelerators"] as string[]) || [],
      recoveryGoals: (data["recovery_goals"] as string[]) || [],
      preferredRecoveryTimes: {
        morning: recoveryTimes["morning"] || false,
        afternoon: recoveryTimes["afternoon"] || true,
        evening: recoveryTimes["evening"] || true,
      },
      recoveryEnvironment:
        (data["recovery_environment"] as
          | "home"
          | "gym"
          | "facility"
          | "mixed") || "mixed",
      recoveryEquipmentOwned:
        (data["recovery_equipment_owned"] as string[]) || [],
      recoveryEquipmentDesired:
        (data["recovery_equipment_desired"] as string[]) || [],
      recoveryBudgetMonthly: data["recovery_budget_monthly"] as number | null,
      timeAvailableDailyMinutes:
        (data["time_available_daily_minutes"] as number) || 30,
      injuryHistory: (data["injury_history"] as string[]) || [],
      chronicConditions: (data["chronic_conditions"] as string[]) || [],
      areasOfConcern: (data["areas_of_concern"] as string[]) || [],
      baselineHrv: data["baseline_hrv"] as number | null,
      baselineRestingHr: data["baseline_resting_hr"] as number | null,
      baselineSleepScore: data["baseline_sleep_score"] as number | null,
      baselineRecoveryScore: data["baseline_recovery_score"] as number | null,
      protocolEffectiveness:
        (data["protocol_effectiveness"] as Record<string, number>) || {},
      favoriteProtocols: (data["favorite_protocols"] as string[]) || [],
      profileCompleted: (data["profile_completed"] as boolean) || false,
      lastAssessmentDate: data["last_assessment_date"]
        ? new Date(data["last_assessment_date"] as string)
        : null,
    };
  }

  /**
   * Create or update athlete recovery profile
   */
  saveAthleteRecoveryProfile(
    profile: Partial<AthleteRecoveryProfile>,
  ): Observable<boolean> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("[Recovery] Cannot save profile: No user logged in");
      return of(false);
    }

    return from(this.upsertRecoveryProfile(userId, profile));
  }

  private async upsertRecoveryProfile(
    userId: string,
    profile: Partial<AthleteRecoveryProfile>,
  ): Promise<boolean> {
    try {
      const dbProfile = {
        athlete_id: userId,
        recovery_preferences: profile.recoveryPreferences
          ? {
              preferred_modalities:
                profile.recoveryPreferences.preferredModalities,
              avoided_modalities: profile.recoveryPreferences.avoidedModalities,
              temperature_sensitivity:
                profile.recoveryPreferences.temperatureSensitivity,
              pressure_tolerance: profile.recoveryPreferences.pressureTolerance,
            }
          : undefined,
        sleep_pattern: profile.sleepPattern
          ? {
              typical_bedtime: profile.sleepPattern.typicalBedtime,
              typical_wake_time: profile.sleepPattern.typicalWakeTime,
              sleep_quality_average: profile.sleepPattern.sleepQualityAverage,
              sleep_issues: profile.sleepPattern.sleepIssues,
              chronotype: profile.sleepPattern.chronotype,
            }
          : undefined,
        stress_triggers: profile.stressTriggers,
        recovery_accelerators: profile.recoveryAccelerators,
        recovery_goals: profile.recoveryGoals,
        preferred_recovery_times: profile.preferredRecoveryTimes,
        recovery_environment: profile.recoveryEnvironment,
        recovery_equipment_owned: profile.recoveryEquipmentOwned,
        recovery_equipment_desired: profile.recoveryEquipmentDesired,
        recovery_budget_monthly: profile.recoveryBudgetMonthly,
        time_available_daily_minutes: profile.timeAvailableDailyMinutes,
        injury_history: profile.injuryHistory,
        chronic_conditions: profile.chronicConditions,
        areas_of_concern: profile.areasOfConcern,
        baseline_hrv: profile.baselineHrv,
        baseline_resting_hr: profile.baselineRestingHr,
        baseline_sleep_score: profile.baselineSleepScore,
        baseline_recovery_score: profile.baselineRecoveryScore,
        protocol_effectiveness: profile.protocolEffectiveness,
        favorite_protocols: profile.favoriteProtocols,
        profile_completed: profile.profileCompleted,
        last_assessment_date: profile.lastAssessmentDate?.toISOString(),
      };

      // Remove undefined values
      const cleanProfile = Object.fromEntries(
        Object.entries(dbProfile).filter(([, v]) => v !== undefined),
      );

      const { error } = await this.supabaseService.client
        .from("athlete_recovery_profiles")
        .upsert(cleanProfile, { onConflict: "athlete_id" });

      if (error) {
        this.logger.error("[Recovery] Error saving recovery profile:", error);
        return false;
      }

      this.logger.success("[Recovery] Recovery profile saved successfully");
      return true;
    } catch (error) {
      this.logger.error("[Recovery] Failed to save recovery profile:", error);
      return false;
    }
  }

  /**
   * Update protocol effectiveness after completing a session
   */
  updateProtocolEffectiveness(
    protocolId: string,
    rating: number,
  ): Observable<boolean> {
    const userId = this.userId();

    if (!userId) {
      return of(false);
    }

    return from(this.saveProtocolEffectiveness(userId, protocolId, rating));
  }

  private async saveProtocolEffectiveness(
    userId: string,
    protocolId: string,
    rating: number,
  ): Promise<boolean> {
    try {
      // Get current profile
      const { data: profile, error: fetchError } =
        await this.supabaseService.client
          .from("athlete_recovery_profiles")
          .select("protocol_effectiveness")
          .eq("athlete_id", userId)
          .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        this.logger.error(
          "[Recovery] Error fetching profile for effectiveness update:",
          fetchError,
        );
        return false;
      }

      const currentEffectiveness =
        (profile?.protocol_effectiveness as Record<string, number>) || {};
      const updatedEffectiveness = {
        ...currentEffectiveness,
        [protocolId]: rating,
      };

      const { error } = await this.supabaseService.client
        .from("athlete_recovery_profiles")
        .upsert(
          {
            athlete_id: userId,
            protocol_effectiveness: updatedEffectiveness,
          },
          { onConflict: "athlete_id" },
        );

      if (error) {
        this.logger.error(
          "[Recovery] Error updating protocol effectiveness:",
          error,
        );
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Start a recovery session and save to database
   */
  startRecoverySession(
    protocol: RecoveryProtocol,
  ): Observable<RecoverySession> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("[Recovery] Cannot start session: No user logged in");
      throw new Error("Authentication required");
    }

    return from(
      (async () => {
        const { data, error } = await this.supabaseService.client
          .from("recovery_sessions")
          .insert({
            athlete_id: userId,
            protocol_id: protocol.id,
            protocol_name: protocol.name,
            started_at: new Date().toISOString(),
            duration_planned: protocol.duration,
            status: "in_progress",
          })
          .select()
          .single();

        if (error) {
          this.logger.error("[Recovery] Error starting session:", error);
          throw error;
        }

        this.logger.success("[Recovery] Session started:", data.id);

        return {
          id: data.id,
          protocol,
          startTime: new Date(data.started_at),
          duration: protocol.duration * 60,
          progress: 0,
          paused: false,
        };
      })(),
    ).pipe(
      catchError((error) => {
        this.logger.error("[Recovery] Failed to start real session:", error);
        throw error;
      }),
    );
  }

  /**
   * Complete current recovery session
   */
  completeRecoverySession(sessionId: string): Observable<boolean> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error(
        "[Recovery] Cannot complete session: No user logged in",
      );
      return of(false);
    }

    return from(
      this.supabaseService.client
        .from("recovery_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .eq("athlete_id", userId),
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error("[Recovery] Error completing session:", error);
          return false;
        }
        this.logger.success("[Recovery] Session completed:", sessionId);
        return true;
      }),
      catchError((error) => {
        this.logger.error("[Recovery] Failed to complete session:", error);
        return of(false);
      }),
    );
  }

  /**
   * Stop current recovery session
   */
  stopRecoverySession(sessionId: string): Observable<boolean> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("[Recovery] Cannot stop session: No user logged in");
      return of(false);
    }

    return from(
      this.supabaseService.client
        .from("recovery_sessions")
        .update({
          status: "stopped",
          stopped_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .eq("athlete_id", userId),
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error("[Recovery] Error stopping session:", error);
          return false;
        }
        this.logger.success("[Recovery] Session stopped:", sessionId);
        return true;
      }),
      catchError((error) => {
        this.logger.error("[Recovery] Failed to stop session:", error);
        return of(false);
      }),
    );
  }

  /**
   * Get research insights related to recovery
   */
  getResearchInsights(): Observable<ResearchInsight[]> {
    return this.apiService
      .get<ResearchInsight[]>(API_ENDPOINTS.recovery.researchInsights)
      .pipe(
        map((response) => {
          if (response.success && response.data) return response.data;
          throw new Error("No research insights available");
        }),
        catchError((error) => {
          this.logger.error(
            "[Recovery] Error fetching research insights:",
            error,
          );
          throw error;
        }),
      );
  }

  /**
   * Get weekly recovery trends
   */
  getWeeklyRecoveryTrends(): Observable<number[]> {
    return this.apiService
      .get<number[]>(API_ENDPOINTS.recovery.weeklyTrends)
      .pipe(
        map((response) => {
          if (response.success && response.data) return response.data;
          throw new Error("No recovery trends available");
        }),
        catchError((error) => {
          this.logger.error(
            "[Recovery] Error fetching recovery trends:",
            error,
          );
          throw error;
        }),
      );
  }

  /**
   * Get protocol effectiveness data
   */
  getProtocolEffectiveness(): Observable<Record<string, number>> {
    return this.apiService
      .get<Record<string, number>>(API_ENDPOINTS.recovery.protocolEffectiveness)
      .pipe(
        map((response) => {
          if (response.success && response.data) return response.data;
          throw new Error("No effectiveness data available");
        }),
        catchError((error) => {
          this.logger.error(
            "[Recovery] Error fetching effectiveness data:",
            error,
          );
          throw error;
        }),
      );
  }
}
