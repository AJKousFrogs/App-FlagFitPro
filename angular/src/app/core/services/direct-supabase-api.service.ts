/**
 * Direct Supabase API Service
 *
 * Provides direct database access for local development without Netlify Functions.
 * This service mirrors the API endpoints but calls Supabase directly.
 *
 * Use case:
 * - When running `ng serve` (port 4200), this service is used
 * - When running `netlify dev` (port 8888), the regular API endpoints are used
 *
 * This allows faster local development without needing Netlify Dev running.
 */

import { Injectable, inject } from "@angular/core";
import { firstValueFrom, Observable, from, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ApiService } from "./api.service";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";

export interface DirectApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Protocol block types
interface ProtocolBlock {
  type: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  exercises: ProtocolExercise[];
  estimatedMinutes: number;
}

interface ProtocolExercise {
  id: string;
  name: string;
  prescription: string;
  category: string;
  status: "pending" | "completed" | "skipped";
  notes?: string;
  videoUrl?: string;
  videoId?: string;
}

interface ConfidenceMetadata {
  readiness?: {
    hasData?: boolean;
    source?: string;
    daysStale?: number | null;
    confidence?: "none" | "stale" | "measured" | "high";
  };
  acwr?: {
    hasData?: boolean;
    source?: string;
    trainingDaysLogged?: number | null;
    confidence?: "none" | "building_baseline" | "high";
  };
  sessionResolution?: {
    success?: boolean;
    status?: string;
    hasProgram?: boolean;
    hasSessionTemplate?: boolean;
  };
}

interface DailyProtocolData {
  id: string;
  date: string;
  userId: string;
  readinessScore: number | null;
  acwrValue?: number | null;
  trainingFocus: string;
  blocks: ProtocolBlock[];
  overallProgress: number;
  totalExercises: number;
  completedExercises: number;
  confidenceMetadata?: ConfidenceMetadata;
  override?: {
    type: string;
    reason: string;
    replaceSession: boolean;
  } | null;
}

interface TrainingSession {
  id: string;
  athleteId?: string | null;
  userId: string;
  teamId: string | null;
  sessionDate: string;
  sessionName: string | null;
  trainingType: string | null;
  status: string;
  durationMinutes: number | null;
  intensityLevel: number | null;
  notes: string | null;
  rpe: number | null;
}

@Injectable({
  providedIn: "root",
})
export class DirectSupabaseApiService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private api = inject(ApiService);

  constructor() {
    this.logger.info(
      "[DirectSupabaseApi] Service initialized for direct database access",
    );
  }

  /**
   * GET /api/daily-protocol?date=YYYY-MM-DD
   * Fetches daily protocol directly from Supabase
   */
  getDailyProtocol(
    date: string,
  ): Observable<DirectApiResponse<DailyProtocolData>> {
    const userId = this.authService.getUser()?.id;

    if (!userId) {
      return of({ success: false, error: "Not authenticated" });
    }

    return from(this.fetchDailyProtocol(userId, date)).pipe(
      map((data) => ({ success: true, data })),
      catchError((error) => {
        this.logger.error(
          "[DirectSupabaseApi] Error fetching daily protocol:",
          error,
        );
        return of({
          success: false,
          error: error.message || "Failed to fetch protocol",
        });
      }),
    );
  }

  private async fetchDailyProtocol(
    userId: string,
    date: string,
  ): Promise<DailyProtocolData | undefined> {
    // Fetch from daily_protocols table
    const { data: protocol, error } = await this.supabase.client
      .from("daily_protocols")
      .select("*")
      .eq("user_id", userId)
      .eq("protocol_date", date)
      .maybeSingle();

    if (error) {
      this.logger.error("[DirectSupabaseApi] Supabase error:", error);
      throw error;
    }

    if (!protocol) {
      // No protocol found for this date - return undefined to trigger generation
      return undefined;
    }

    // Fetch protocol exercises with exercise details joined (including video)
    const { data: protocolExercises } = await this.supabase.client
      .from("protocol_exercises")
      .select(
        `
        id,
        block_type,
        sequence_order,
        status,
        prescribed_sets,
        prescribed_reps,
        prescribed_hold_seconds,
        prescribed_duration_seconds,
        ai_note,
        exercises:exercise_id (
          id,
          name,
          category,
          description,
          default_sets,
          default_reps,
          video_url,
          video_id
        )
      `,
      )
      .eq("protocol_id", protocol.id)
      .order("block_type", { ascending: true })
      .order("sequence_order", { ascending: true });

    // Group exercises into blocks
    // Evidence-based 1.5h gym structure with separate training blocks
    const blockMap = new Map<string, ProtocolExercise[]>();
    const blockTypes = [
      "morning_mobility",
      "foam_roll",
      "warm_up",
      "isometrics",
      "plyometrics",
      "strength",
      "conditioning",
      "skill_drills",
      "cool_down",
      "evening_recovery",
    ];

    // Initialize all block types
    blockTypes.forEach((type) => blockMap.set(type, []));

    // Populate exercises into blocks
    if (protocolExercises) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      protocolExercises.forEach((ex: any) => {
        const exercise = ex.exercises;
        const blockExercises = blockMap.get(ex.block_type) || [];

        // Format prescription based on available data
        let prescription = "";
        if (ex.prescribed_sets && ex.prescribed_reps) {
          prescription = `${ex.prescribed_sets}x${ex.prescribed_reps}`;
        } else if (ex.prescribed_hold_seconds) {
          prescription = `${ex.prescribed_hold_seconds}s hold`;
        } else if (ex.prescribed_duration_seconds) {
          prescription = `${Math.round(ex.prescribed_duration_seconds / 60)} min`;
        } else if (exercise?.default_sets && exercise?.default_reps) {
          prescription = `${exercise.default_sets}x${exercise.default_reps}`;
        }

        blockExercises.push({
          id: ex.id,
          name: exercise?.name || "Exercise",
          prescription,
          category: exercise?.category || ex.block_type,
          status: ex.status || "pending",
          notes: ex.ai_note || exercise?.description,
          videoUrl: exercise?.video_url,
          videoId: exercise?.video_id,
        });
        blockMap.set(ex.block_type, blockExercises);
      });
    }

    // Build blocks array
    const blocks: ProtocolBlock[] = blockTypes.map((type) => {
      const blockExercises = blockMap.get(type) || [];
      const completedCount = blockExercises.filter(
        (e) => e.status === "completed",
      ).length;
      const status =
        blockExercises.length === 0
          ? ("pending" as const)
          : completedCount === blockExercises.length
            ? ("completed" as const)
            : completedCount > 0
              ? ("in_progress" as const)
              : ("pending" as const);

      return {
        type,
        status,
        exercises: blockExercises,
        estimatedMinutes: this.getBlockEstimatedMinutes(type),
      };
    });

    // Determine if there's an override based on conditions
    let override = null;

    // Check for active injuries/rehab from notes field via API
    try {
      const today = new Date().toISOString().split("T")[0];
      const wellnessResponse = await firstValueFrom(
        this.api.get<{ notes?: string }>(`/api/wellness-checkin?date=${today}`),
      );

      if (wellnessResponse.success && wellnessResponse.data?.notes) {
        // Parse notes to check for injury keywords
        const notes = wellnessResponse.data.notes.toLowerCase();
        const injuryKeywords = [
          "injury",
          "injured",
          "pain",
          "rehab",
          "rehabilitation",
        ];
        const hasInjuryNote = injuryKeywords.some((keyword) =>
          notes.includes(keyword),
        );

        if (hasInjuryNote) {
          override = {
            type: "rehab_protocol",
            reason: `Active injury protocol: ${wellnessResponse.data.notes}`,
            replaceSession: true,
          };
        }
      }
    } catch {
      // Wellness API failed, continue without override
    }

    // Compute confidence_metadata dynamically based on CURRENT wellness data
    // This ensures we reflect the latest check-in status, not stale stored values
    const confidenceMetadata = await this.computeConfidenceMetadata(userId, date, protocol);

    return {
      id: protocol.id,
      date: protocol.protocol_date,
      userId: protocol.user_id,
      readinessScore: confidenceMetadata.readiness?.hasData 
        ? (await this.getTodaysReadinessScore(userId, date)) ?? protocol.readiness_score
        : protocol.readiness_score,
      acwrValue: protocol.acwr_value,
      trainingFocus: protocol.training_focus || "general",
      blocks,
      overallProgress: protocol.overall_progress || 0,
      totalExercises:
        protocol.total_exercises ||
        blocks.reduce((sum, b) => sum + b.exercises.length, 0),
      completedExercises: protocol.completed_exercises || 0,
      confidenceMetadata,
      override,
    };
  }

  /**
   * Compute confidence_metadata dynamically based on current wellness data
   * This ensures we reflect the latest check-in status
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async computeConfidenceMetadata(userId: string, date: string, protocol: any): Promise<ConfidenceMetadata> {
    // Check for today's wellness check-in (table is daily_wellness_checkin)
    const { data: todayWellness } = await this.supabase.client
      .from("daily_wellness_checkin")
      .select("id, readiness_score, created_at")
      .eq("user_id", userId)
      .eq("checkin_date", date)
      .maybeSingle();

    const hasCheckinToday = !!todayWellness;
    const readinessScore = todayWellness?.readiness_score ?? protocol.readiness_score;

    // Calculate days stale if no check-in today but we have stored data
    let daysStale: number | null = null;
    if (!hasCheckinToday && protocol.readiness_score !== null) {
      // Find last check-in to calculate staleness (table is daily_wellness_checkin)
      const { data: lastCheckin } = await this.supabase.client
        .from("daily_wellness_checkin")
        .select("checkin_date")
        .eq("user_id", userId)
        .order("checkin_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastCheckin?.checkin_date) {
        const lastDate = new Date(lastCheckin.checkin_date);
        const today = new Date(date);
        daysStale = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    } else if (hasCheckinToday) {
      daysStale = 0;
    }

    // Determine readiness confidence
    let readinessConfidence: "none" | "stale" | "measured" | "high" = "none";
    if (hasCheckinToday) {
      readinessConfidence = "high";
    } else if (daysStale !== null && daysStale <= 2) {
      readinessConfidence = "stale";
    } else if (readinessScore !== null) {
      readinessConfidence = "stale";
    }

    // Use stored confidence_metadata for ACWR and sessionResolution (these don't change as frequently)
    const storedMeta = protocol.confidence_metadata || {};

    return {
      readiness: {
        hasData: hasCheckinToday || readinessScore !== null,
        source: hasCheckinToday ? "wellness_checkin" : (readinessScore !== null ? "stored" : "none"),
        daysStale,
        confidence: readinessConfidence,
      },
      acwr: storedMeta.acwr || {
        hasData: protocol.acwr_value !== null,
        source: protocol.acwr_value !== null ? "training_sessions" : "none",
        trainingDaysLogged: null,
        confidence: protocol.acwr_value !== null ? "high" : "building_baseline",
      },
      sessionResolution: storedMeta.sessionResolution || {
        success: true,
        status: "resolved",
        hasProgram: true,
        hasSessionTemplate: true,
      },
    };
  }

  /**
   * Get today's readiness score from wellness check-in (table is daily_wellness_checkin)
   */
  private async getTodaysReadinessScore(userId: string, date: string): Promise<number | null> {
    const { data } = await this.supabase.client
      .from("daily_wellness_checkin")
      .select("readiness_score")
      .eq("user_id", userId)
      .eq("checkin_date", date)
      .maybeSingle();

    return data?.readiness_score ?? null;
  }

  private getBlockEstimatedMinutes(blockType: string): number {
    // Evidence-based 1.5h gym structure timing
    const estimates: Record<string, number> = {
      morning_mobility: 10,
      foam_roll: 8,
      warm_up: 15,
      isometrics: 15,
      plyometrics: 15,
      strength: 15,
      conditioning: 15,
      skill_drills: 15,
      cool_down: 15,
      evening_recovery: 10,
    };
    return estimates[blockType] || 15;
  }

  /**
   * POST /api/daily-protocol/generate
   * Generates a new daily protocol (simplified version for direct access)
   */
  generateDailyProtocol(
    date: string,
  ): Observable<DirectApiResponse<DailyProtocolData>> {
    const userId = this.authService.getUser()?.id;

    if (!userId) {
      return of({ success: false, error: "Not authenticated" });
    }

    return from(this.createDailyProtocol(userId, date)).pipe(
      map((data) => ({ success: true, data })),
      catchError((error) => {
        this.logger.error(
          "[DirectSupabaseApi] Error generating protocol:",
          error,
        );
        return of({
          success: false,
          error: error.message || "Failed to generate protocol",
        });
      }),
    );
  }

  private async createDailyProtocol(
    userId: string,
    date: string,
  ): Promise<DailyProtocolData> {
    // Get user's training config for personalization
    const { data: config } = await this.supabase.client
      .from("athlete_training_config")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Determine training focus based on day of week
    const dayOfWeek = new Date(date).getDay();
    const focusMap: Record<number, string> = {
      0: "recovery", // Sunday
      1: "strength", // Monday
      2: "speed", // Tuesday
      3: "agility", // Wednesday
      4: "strength", // Thursday
      5: "conditioning", // Friday
      6: "recovery", // Saturday
    };
    const trainingFocus = focusMap[dayOfWeek] || "general";

    // Insert the protocol
    const { data: protocol, error } = await this.supabase.client
      .from("daily_protocols")
      .upsert(
        {
          user_id: userId,
          protocol_date: date,
          training_focus: trainingFocus,
          readiness_score: null, // Will be calculated from wellness checkin
          overall_progress: 0,
          total_exercises: 12,
          completed_exercises: 0,
          morning_status: "pending",
          foam_roll_status: "pending",
          main_session_status: "pending",
          evening_status: "pending",
          generated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,protocol_date",
        },
      )
      .select()
      .single();

    if (error) {
      this.logger.error("[DirectSupabaseApi] Error creating protocol:", error);
      throw error;
    }

    // Generate default exercises using real exercise IDs from the database
    await this.generateProtocolExercises(
      protocol.id,
      trainingFocus,
      config?.primary_position,
    );

    // Return the created protocol
    return this.fetchDailyProtocol(userId, date) as Promise<DailyProtocolData>;
  }

  /**
   * Generate protocol exercises using real exercises from the database
   */
  private async generateProtocolExercises(
    protocolId: string,
    focus: string,
    _position?: string,
  ): Promise<void> {
    // Fetch exercises by category
    const { data: allExercises } = await this.supabase.client
      .from("exercises")
      .select(
        "id, name, category, default_sets, default_reps, default_hold_seconds, default_duration_seconds",
      )
      .eq("active", true);

    if (!allExercises || allExercises.length === 0) {
      this.logger.warn("[DirectSupabaseApi] No exercises found in database");
      return;
    }

    // Group exercises by category (case-insensitive)
    const exercisesByCategory = new Map<string, typeof allExercises>();
    allExercises.forEach((ex) => {
      const category = (ex.category || "").toLowerCase();
      if (!exercisesByCategory.has(category)) {
        exercisesByCategory.set(category, []);
      }
      const categoryExercises = exercisesByCategory.get(category);
      if (categoryExercises) {
        categoryExercises.push(ex);
      }
    });

    const protocolExercises: Array<{
      protocol_id: string;
      exercise_id: string;
      block_type: string;
      sequence_order: number;
      status: string;
      prescribed_sets?: number;
      prescribed_reps?: number;
      prescribed_hold_seconds?: number;
      prescribed_duration_seconds?: number;
    }> = [];

    // Helper to get random exercises from a category
    const getExercises = (category: string, count: number) => {
      const exercises = exercisesByCategory.get(category) || [];
      const shuffled = [...exercises].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    // Helper to add exercises to a block
    const addBlockExercises = (
      blockType: string,
      category: string,
      count: number,
      options: { useSets?: boolean; useHold?: boolean; useDuration?: boolean } = { useSets: true }
    ) => {
      const exercises = getExercises(category, count);
      exercises.forEach((ex, i) => {
        const exercise: {
          protocol_id: string;
          exercise_id: string;
          block_type: string;
          sequence_order: number;
          status: string;
          prescribed_sets: number;
          prescribed_reps?: number;
          prescribed_hold_seconds?: number;
          prescribed_duration_seconds?: number;
        } = {
          protocol_id: protocolId,
          exercise_id: ex.id,
          block_type: blockType,
          sequence_order: i + 1,
          status: "pending",
          prescribed_sets: ex.default_sets || (options.useSets ? 3 : 1),
        };

        if (options.useHold) {
          exercise.prescribed_hold_seconds = ex.default_hold_seconds || 30;
        } else if (options.useDuration) {
          exercise.prescribed_duration_seconds = ex.default_duration_seconds || 60;
        } else {
          exercise.prescribed_reps = ex.default_reps || 10;
        }

        protocolExercises.push(exercise);
      });
    };

    // =========================================================================
    // EVIDENCE-BASED 1.5H GYM STRUCTURE
    // =========================================================================

    // Morning Mobility - Use day-specific routine if available (e.g., "Morning Mobility - Day 5 (Friday)")
    // These are complete follow-along routines. Fall back to individual exercises if not found.
    const dayOfWeek = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek; // Sunday = 7
    const dayName = dayNames[dayOfWeek];
    
    // Find day-specific morning mobility routine
    const daySpecificMobility = allExercises.find(ex => 
      ex.name.toLowerCase().includes(`day ${dayNumber}`) && 
      ex.name.toLowerCase().includes(dayName.toLowerCase()) &&
      ex.category?.toLowerCase() === 'mobility'
    );
    
    if (daySpecificMobility) {
      // Use the day-specific morning mobility routine
      protocolExercises.push({
        protocol_id: protocolId,
        exercise_id: daySpecificMobility.id,
        block_type: "morning_mobility",
        sequence_order: 1,
        status: "pending",
        prescribed_sets: 1,
        prescribed_reps: 1, // Follow along with routine
      });
    } else {
      // Fallback: use individual mobility exercises
      addBlockExercises("morning_mobility", "mobility", 2);
    }

    // Foam Roll (3 exercises) - pre-workout tissue prep
    addBlockExercises("foam_roll", "foam_roll", 3, { useDuration: true });

    // Warm-Up (3 exercises) - dynamic movement prep
    addBlockExercises("warm_up", "warm_up", 3);

    // =========================================================================
    // MAIN TRAINING BLOCKS (15 min each = 75 min total)
    // =========================================================================

    // Isometrics (3 exercises) - tendon loading, injury prevention
    addBlockExercises("isometrics", "isometric", 3, { useHold: true });

    // Plyometrics (3 exercises) - power development, reactive strength
    addBlockExercises("plyometrics", "plyometric", 3);

    // Strength (4 exercises) - primary strength work
    addBlockExercises("strength", "strength", 4);

    // Conditioning (3 exercises) - metabolic conditioning
    addBlockExercises("conditioning", "conditioning", 3);

    // Skill Drills (3 exercises) - sport-specific skills
    addBlockExercises("skill_drills", "skill", 3);

    // =========================================================================
    // RECOVERY BLOCKS
    // =========================================================================

    // Cool Down (3 exercises) - post-workout recovery
    addBlockExercises("cool_down", "cool_down", 3, { useHold: true });

    // Evening Recovery (2 exercises) - done at home
    addBlockExercises("evening_recovery", "recovery", 2, { useDuration: true });

    // Insert all exercises
    if (protocolExercises.length > 0) {
      const { error } = await this.supabase.client
        .from("protocol_exercises")
        .insert(protocolExercises);

      if (error) {
        this.logger.error(
          "[DirectSupabaseApi] Error inserting protocol exercises:",
          error,
        );
      }
    }

    // Update total exercises count
    await this.supabase.client
      .from("daily_protocols")
      .update({ total_exercises: protocolExercises.length })
      .eq("id", protocolId);
  }

  /**
   * GET /api/training/sessions
   * Fetches training sessions directly from Supabase
   */
  getTrainingSessions(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
  }): Observable<DirectApiResponse<TrainingSession[]>> {
    const userId = this.authService.getUser()?.id;

    if (!userId) {
      return of({ success: false, error: "Not authenticated" });
    }

    return from(this.fetchTrainingSessions(userId, params)).pipe(
      map((data) => ({ success: true, data })),
      catchError((error) => {
        this.logger.error(
          "[DirectSupabaseApi] Error fetching training sessions:",
          error,
        );
        return of({
          success: false,
          error: error.message || "Failed to fetch sessions",
        });
      }),
    );
  }

  private async fetchTrainingSessions(
    userId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      status?: string;
      limit?: number;
    },
  ): Promise<TrainingSession[]> {
    let query = this.supabase.client
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("session_date", { ascending: false });

    if (params?.startDate) {
      query = query.gte("session_date", params.startDate);
    }
    if (params?.endDate) {
      query = query.lte("session_date", params.endDate);
    }
    if (params?.status) {
      query = query.eq("status", params.status);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    } else {
      query = query.limit(50); // Default limit
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(
        "[DirectSupabaseApi] Supabase error fetching sessions:",
        error,
      );
      throw error;
    }

    return (data || []).map((session) => ({
      id: session.id,
      athleteId: session.athlete_id || session.user_id || null,
      userId: session.user_id,
      teamId: session.team_id,
      sessionDate: session.session_date,
      sessionName: session.session_name,
      trainingType: session.session_type || session.training_type || null,
      status: session.status,
      durationMinutes: session.duration_minutes,
      intensityLevel: session.intensity_level,
      notes: session.notes,
      rpe: session.rpe,
    }));
  }

  /**
   * Generic method to check if we have data in a table for the user
   */
  async hasDataForUser(
    tableName: string,
    userColumn: string = "user_id",
  ): Promise<boolean> {
    const userId = this.authService.getUser()?.id;
    if (!userId) return false;

    const { count, error } = await this.supabase.client
      .from(tableName)
      .select("*", { count: "exact", head: true })
      .eq(userColumn, userId);

    if (error) {
      this.logger.warn(
        `[DirectSupabaseApi] Error checking ${tableName}:`,
        error,
      );
      return false;
    }

    return (count ?? 0) > 0;
  }
}
