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
import { Observable, firstValueFrom, from, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ApiService } from "./api.service";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { ApiResponse } from "../models/common.models";

// Service-specific response interface (extends canonical ApiResponse)
// DirectSupabaseApiService uses the same structure as canonical ApiResponse
export type DirectApiResponse<T = unknown> = ApiResponse<T>;

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
   * If protocol exists but has 0 exercises, regenerates exercises automatically
   */
  getDailyProtocol(
    date: string,
  ): Observable<DirectApiResponse<DailyProtocolData>> {
    const userId = this.authService.getUser()?.id;

    if (!userId) {
      return of({ success: false, error: "Not authenticated" });
    }

    return from(this.fetchDailyProtocolWithAutoFix(userId, date)).pipe(
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

  /**
   * Fetch protocol with automatic exercise regeneration if needed
   */
  private async fetchDailyProtocolWithAutoFix(
    userId: string,
    date: string,
  ): Promise<DailyProtocolData | undefined> {
    // First, fetch the protocol
    const protocol = await this.fetchDailyProtocol(userId, date);
    
    // If no protocol, return undefined to trigger generation
    if (!protocol) {
      return undefined;
    }
    
    // If protocol exists but has 0 exercises, regenerate them
    if (protocol.totalExercises === 0) {
      this.logger.warn("[DirectSupabaseApi] Protocol has 0 exercises - regenerating...");
      
      // Get user config for personalization
      const { data: config } = await this.supabase.client
        .from("athlete_training_config")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      // Force regenerate exercises with date for periodization
      await this.generateProtocolExercises(
        protocol.id,
        protocol.trainingFocus || "general",
        config?.primary_position,
        true, // force regenerate
        date  // pass date for periodization
      );
      
      // Re-fetch with the new exercises
      return this.fetchDailyProtocol(userId, date);
    }
    
    return protocol;
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
    // Block types must match database CHECK constraint
    // After migration 113 is applied, additional types can be added
    const blockMap = new Map<string, ProtocolExercise[]>();
    const blockTypes = [
      "morning_mobility",
      "foam_roll",
      "warm_up",
      "main_session",
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
    // Note: Use calculated_readiness or overall_readiness_score (not readiness_score which doesn't exist)
    const { data: todayWellness } = await this.supabase.client
      .from("daily_wellness_checkin")
      .select("id, calculated_readiness, overall_readiness_score, created_at")
      .eq("user_id", userId)
      .eq("checkin_date", date)
      .maybeSingle();

    const hasCheckinToday = !!todayWellness;
    // Prefer calculated_readiness, fallback to overall_readiness_score, then protocol value
    const readinessScore = todayWellness?.calculated_readiness ?? todayWellness?.overall_readiness_score ?? protocol.readiness_score;

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
   * Note: The table uses calculated_readiness or overall_readiness_score, not readiness_score
   */
  private async getTodaysReadinessScore(userId: string, date: string): Promise<number | null> {
    const { data } = await this.supabase.client
      .from("daily_wellness_checkin")
      .select("calculated_readiness, overall_readiness_score")
      .eq("user_id", userId)
      .eq("checkin_date", date)
      .maybeSingle();

    // Prefer calculated_readiness, fallback to overall_readiness_score
    return data?.calculated_readiness ?? data?.overall_readiness_score ?? null;
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

    // Check if protocol already exists
    const { data: existingProtocol } = await this.supabase.client
      .from("daily_protocols")
      .select("id, total_exercises")
      .eq("user_id", userId)
      .eq("protocol_date", date)
      .maybeSingle();

    // Insert or update the protocol
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

    // Generate exercises - force regenerate if existing protocol had 0 exercises
    const forceRegenerate = !!(existingProtocol && (existingProtocol.total_exercises === 0 || existingProtocol.total_exercises === null));
    await this.generateProtocolExercises(
      protocol.id,
      trainingFocus,
      config?.primary_position,
      forceRegenerate,
      date, // pass date for periodization
    );

    // Return the created protocol
    return this.fetchDailyProtocol(userId, date) as Promise<DailyProtocolData>;
  }

  /**
   * Generate protocol exercises using real exercises from the database
   * @param forceRegenerate - If true, delete existing exercises and regenerate
   * @param date - The protocol date for periodization
   */
  private async generateProtocolExercises(
    protocolId: string,
    focus: string,
    _position?: string,
    forceRegenerate: boolean = false,
    date?: string,
  ): Promise<void> {
    const protocolDate = date || new Date().toISOString().split('T')[0];
    
    // First, check if exercises already exist for this protocol
    const { data: existingExercises } = await this.supabase.client
      .from("protocol_exercises")
      .select("id")
      .eq("protocol_id", protocolId)
      .limit(1);

    if (existingExercises && existingExercises.length > 0 && !forceRegenerate) {
      this.logger.info("[DirectSupabaseApi] Protocol already has exercises, skipping generation");
      return;
    }

    // If force regenerate, delete existing exercises first
    if (forceRegenerate && existingExercises && existingExercises.length > 0) {
      this.logger.info("[DirectSupabaseApi] Force regenerating - deleting existing exercises");
      await this.supabase.client
        .from("protocol_exercises")
        .delete()
        .eq("protocol_id", protocolId);
    }

    // Try to fetch from exercisedb_exercises first (500+ exercises)
    let allExercises: Array<{
      id: string;
      name: string;
      category: string | null;
      default_sets?: number | null;
      default_reps?: number | null;
      default_hold_seconds?: number | null;
      default_duration_seconds?: number | null;
    }> = [];

    // First try exercisedb_exercises (curated library with 500+ exercises)
    const { data: exerciseDbExercises } = await this.supabase.client
      .from("exercisedb_exercises")
      .select("id, name, ff_category, recommended_sets, recommended_reps")
      .eq("is_active", true)
      .eq("is_approved", true)
      .limit(500);

    if (exerciseDbExercises && exerciseDbExercises.length > 0) {
      this.logger.info(`[DirectSupabaseApi] Found ${exerciseDbExercises.length} exercises from ExerciseDB library`);
      // Map ExerciseDB format to our format
      allExercises = exerciseDbExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        category: this.mapExerciseDbCategory(ex.ff_category),
        default_sets: ex.recommended_sets || 3,
        default_reps: parseInt(ex.recommended_reps || '10', 10) || 10,
      }));
    }

    // Also fetch from exercises table
    const { data: localExercises, error: fetchError } = await this.supabase.client
      .from("exercises")
      .select(
        "id, name, category, default_sets, default_reps, default_hold_seconds, default_duration_seconds",
      )
      .eq("active", true);

    if (fetchError) {
      this.logger.error("[DirectSupabaseApi] Error fetching exercises:", fetchError);
    }

    if (localExercises && localExercises.length > 0) {
      this.logger.info(`[DirectSupabaseApi] Found ${localExercises.length} exercises from local exercises table`);
      allExercises = [...allExercises, ...localExercises];
    }

    // If still no exercises, seed defaults
    if (allExercises.length === 0) {
      this.logger.warn("[DirectSupabaseApi] No exercises found in database - seeding default exercises");
      await this.seedDefaultExercises();
      
      const { data: seededExercises } = await this.supabase.client
        .from("exercises")
        .select(
          "id, name, category, default_sets, default_reps, default_hold_seconds, default_duration_seconds",
        )
        .eq("active", true);
      
      if (!seededExercises || seededExercises.length === 0) {
        this.logger.error("[DirectSupabaseApi] Failed to seed exercises");
        return;
      }
      allExercises = seededExercises;
    }

    this.logger.info(`[DirectSupabaseApi] Total exercises available: ${allExercises.length}`);
    return this.generateProtocolExercisesWithData(protocolId, focus, allExercises, protocolDate);
  }

  /**
   * Map ExerciseDB ff_category to our standard categories
   */
  private mapExerciseDbCategory(ffCategory: string | null): string {
    if (!ffCategory) return 'strength';
    
    const categoryMap: Record<string, string> = {
      'Hip Power & Explosiveness': 'plyometrics',
      'Leg Strength': 'strength',
      'Posterior Chain': 'strength',
      'Lateral Movement': 'conditioning',
      'Ankle Stability': 'isometrics',
      'Core Stability': 'isometrics',
      'Rotational Core': 'strength',
      'Shoulder Stability': 'strength',
      'Upper Body Power': 'plyometrics',
      'Pushing Power': 'strength',
      'Arm Extension': 'strength',
      'Arm Strength': 'strength',
      'Conditioning': 'conditioning',
      'Mobility': 'mobility',
    };
    
    return categoryMap[ffCategory] || 'strength';
  }

  /**
   * Seed default exercises when the exercises table is empty
   * This provides a comprehensive set of evidence-based exercises for flag football
   * Based on the training video database and 1.5h gym periodization structure
   */
  private async seedDefaultExercises(): Promise<void> {
    const defaultExercises = [
      // ============================================================================
      // MORNING MOBILITY (10-15 min YouTube follow-along routines)
      // These are the day-specific routines from our video database
      // ============================================================================
      { name: 'Morning Mobility - Day 1 (Monday)', slug: 'morning-mobility-day-1-monday', category: 'mobility', 
        description: '10-minute morning mobility routine. Focus on hips, spine, and ankles.',
        video_url: 'https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf',
        video_id: 'IWNnTJFwi3s',
        default_sets: 1, default_duration_seconds: 600, active: true },
      { name: 'Morning Mobility - Day 2 (Tuesday)', slug: 'morning-mobility-day-2-tuesday', category: 'mobility',
        description: '10-minute morning mobility routine. Hip flexor and thoracic focus.',
        video_url: 'https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf',
        video_id: 'IWNnTJFwi3s',
        default_sets: 1, default_duration_seconds: 600, active: true },
      { name: 'Morning Mobility - Day 3 (Wednesday)', slug: 'morning-mobility-day-3-wednesday', category: 'mobility',
        description: '10-minute morning mobility routine. Groin and adductor focus.',
        video_url: 'https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf',
        video_id: 'IWNnTJFwi3s',
        default_sets: 1, default_duration_seconds: 600, active: true },
      { name: 'Morning Mobility - Day 4 (Thursday)', slug: 'morning-mobility-day-4-thursday', category: 'mobility',
        description: '10-minute morning mobility routine. Ankle and achilles focus.',
        video_url: 'https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf',
        video_id: 'IWNnTJFwi3s',
        default_sets: 1, default_duration_seconds: 600, active: true },
      { name: 'Morning Mobility - Day 5 (Friday)', slug: 'morning-mobility-day-5-friday', category: 'mobility',
        description: '10-minute morning mobility routine. Full body flow.',
        video_url: 'https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf',
        video_id: 'IWNnTJFwi3s',
        default_sets: 1, default_duration_seconds: 600, active: true },
      { name: 'Morning Mobility - Day 6 (Saturday)', slug: 'morning-mobility-day-6-saturday', category: 'mobility',
        description: '10-minute morning mobility routine. Light recovery focus.',
        video_url: 'https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf',
        video_id: 'IWNnTJFwi3s',
        default_sets: 1, default_duration_seconds: 600, active: true },
      { name: 'Morning Mobility - Day 7 (Sunday)', slug: 'morning-mobility-day-7-sunday', category: 'mobility',
        description: '10-minute morning mobility routine. Gentle recovery day.',
        video_url: 'https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf',
        video_id: 'IWNnTJFwi3s',
        default_sets: 1, default_duration_seconds: 600, active: true },

      // ============================================================================
      // FOAM ROLLING (Pre-workout tissue prep - 8 min)
      // ============================================================================
      { name: 'Quad Foam Roll', slug: 'quad-foam-roll', category: 'foam_roll',
        description: 'Lie face down, roll from above knee to hip. Rotate leg to target different quad muscles.',
        default_sets: 1, default_duration_seconds: 60, active: true },
      { name: 'IT Band Foam Roll', slug: 'it-band-foam-roll', category: 'foam_roll',
        description: 'Lie on side, roll outer thigh from knee to hip. Control pressure with supporting foot.',
        default_sets: 1, default_duration_seconds: 60, active: true },
      { name: 'Hamstring Foam Roll', slug: 'hamstring-foam-roll', category: 'foam_roll',
        description: 'Sit on roller, roll from above knee to glutes. Cross legs for more pressure.',
        default_sets: 1, default_duration_seconds: 60, active: true },
      { name: 'Glute Foam Roll', slug: 'glute-foam-roll', category: 'foam_roll',
        description: 'Sit in figure-4 position on roller, roll glute muscle.',
        default_sets: 1, default_duration_seconds: 60, active: true },
      { name: 'Calf Foam Roll', slug: 'calf-foam-roll', category: 'foam_roll',
        description: 'Sit with roller under calves, roll from ankle to knee.',
        default_sets: 1, default_duration_seconds: 45, active: true },

      // ============================================================================
      // WARM-UP (15 min dynamic movement prep)
      // ============================================================================
      { name: 'Leg Swings (Front-to-Back)', slug: 'leg-swings-front-back', category: 'warm_up',
        description: 'Stand sideways to wall, swing leg forward and backward in controlled arc.',
        default_sets: 2, default_reps: 10, active: true },
      { name: 'Leg Swings (Side-to-Side)', slug: 'leg-swings-side-to-side', category: 'warm_up',
        description: 'Face wall, swing leg across body and out to side.',
        default_sets: 2, default_reps: 10, active: true },
      { name: 'A-Skips', slug: 'a-skips', category: 'warm_up',
        description: 'Skip forward driving knee to hip height. Quick ground contacts.',
        default_sets: 2, default_reps: 10, active: true },
      { name: 'High Knees', slug: 'high-knees', category: 'warm_up',
        description: 'Run in place or forward, driving knees to hip height.',
        default_sets: 2, default_duration_seconds: 20, active: true },
      { name: 'Butt Kicks', slug: 'butt-kicks', category: 'warm_up',
        description: 'Run in place kicking heels up toward glutes.',
        default_sets: 2, default_duration_seconds: 20, active: true },
      { name: 'Lateral Shuffles', slug: 'lateral-shuffles', category: 'warm_up',
        description: 'Athletic stance, shuffle sideways keeping hips low.',
        default_sets: 2, default_reps: 10, active: true },

      // ============================================================================
      // ISOMETRICS (15 min - position holds for tendon health)
      // ============================================================================
      { name: 'Wall Sit', slug: 'wall-sit', category: 'isometrics',
        description: 'Back against wall, thighs parallel to floor. Hold position.',
        default_sets: 3, default_hold_seconds: 45, active: true },
      { name: 'Single Leg Wall Sit', slug: 'single-leg-wall-sit', category: 'isometrics',
        description: 'Wall sit with one leg extended. Switch legs each set.',
        default_sets: 2, default_hold_seconds: 30, active: true },
      { name: 'Isometric Lunge Hold', slug: 'isometric-lunge-hold', category: 'isometrics',
        description: 'Deep lunge position, hold at bottom. Great for hip flexor and quad strength.',
        default_sets: 2, default_hold_seconds: 30, active: true },
      { name: 'Isometric Calf Raise Hold', slug: 'isometric-calf-raise-hold', category: 'isometrics',
        description: 'Rise up on toes, hold at top. Single leg for progression.',
        default_sets: 3, default_hold_seconds: 30, active: true },
      { name: 'Glute Bridge Hold', slug: 'glute-bridge-hold', category: 'isometrics',
        description: 'Bridge position, squeeze glutes, hold at top.',
        default_sets: 3, default_hold_seconds: 30, active: true },
      { name: 'Copenhagen Hold', slug: 'copenhagen-hold', category: 'isometrics',
        description: 'Side plank with top leg on bench. Hold for adductor strength.',
        default_sets: 2, default_hold_seconds: 20, active: true },

      // ============================================================================
      // PLYOMETRICS (15 min - explosive power development)
      // ============================================================================
      { name: 'Box Jumps', slug: 'box-jumps', category: 'plyometrics',
        description: 'Explosive jump onto box, step down. Focus on soft landing.',
        default_sets: 3, default_reps: 5, active: true },
      { name: 'Broad Jumps', slug: 'broad-jumps', category: 'plyometrics',
        description: 'Maximum horizontal jump from standing. Stick the landing.',
        default_sets: 3, default_reps: 5, active: true },
      { name: 'Single Leg Bounds', slug: 'single-leg-bounds', category: 'plyometrics',
        description: 'Hop forward on one leg, maximizing distance. Alternate legs.',
        default_sets: 3, default_reps: 5, active: true },
      { name: 'Lateral Bounds', slug: 'lateral-bounds', category: 'plyometrics',
        description: 'Explosive side-to-side jumps. Land softly, control the decel.',
        default_sets: 3, default_reps: 6, active: true },
      { name: 'Depth Jumps', slug: 'depth-jumps', category: 'plyometrics',
        description: 'Step off box, immediately explode upward on landing. Advanced.',
        default_sets: 3, default_reps: 4, active: true },
      { name: 'Pogos', slug: 'pogos', category: 'plyometrics',
        description: 'Quick, stiff ankle hops. Minimal ground contact time.',
        default_sets: 3, default_reps: 15, active: true },

      // ============================================================================
      // STRENGTH (15 min - injury prevention focused)
      // ============================================================================
      { name: 'Nordic Curls', slug: 'nordic-curls', category: 'strength',
        description: '51% hamstring injury reduction (Al Attar et al.). Kneel, lower body forward under control.',
        video_url: 'https://www.youtube.com/watch?v=d8AAPcYxHKE',
        default_sets: 3, default_reps: 5, active: true },
      { name: 'Copenhagen Adductors', slug: 'copenhagen-adductors', category: 'strength',
        description: '41% groin injury reduction (Harøy et al.). Side plank with top leg on bench.',
        default_sets: 3, default_reps: 8, active: true },
      { name: 'Single Leg RDL', slug: 'single-leg-rdl', category: 'strength',
        description: 'Balance on one leg, hinge at hip reaching toward ground.',
        default_sets: 3, default_reps: 8, active: true },
      { name: 'Split Squat', slug: 'split-squat', category: 'strength',
        description: 'Staggered stance, lower until back knee nearly touches ground.',
        default_sets: 3, default_reps: 10, active: true },
      { name: 'Glute Bridge', slug: 'glute-bridge', category: 'strength',
        description: 'Lie on back, drive hips up squeezing glutes at top.',
        default_sets: 3, default_reps: 12, active: true },
      { name: 'Calf Raises', slug: 'calf-raises', category: 'strength',
        description: 'Rise up on toes, control the lowering. Single leg for progression.',
        default_sets: 3, default_reps: 15, active: true },

      // ============================================================================
      // CONDITIONING (15 min - ACWR-adjusted based on load)
      // ============================================================================
      { name: 'Sprint Intervals (20yd)', slug: 'sprint-intervals-20yd', category: 'conditioning',
        description: '20-yard sprints at 85% effort with walk-back recovery.',
        default_sets: 6, default_reps: 1, active: true },
      { name: 'Pro Agility (5-10-5)', slug: 'pro-agility', category: 'conditioning',
        description: 'Pro agility drill - 5 yards, touch, 10 yards back, 5 yards finish.',
        default_sets: 4, default_reps: 1, active: true },
      { name: 'Tempo Runs', slug: 'tempo-runs', category: 'conditioning',
        description: '60-70% effort runs for aerobic base. 100-200 yards.',
        default_sets: 4, default_duration_seconds: 30, active: true },
      { name: 'Ladder Drills', slug: 'ladder-drills', category: 'conditioning',
        description: 'Quick feet through agility ladder. Various patterns.',
        default_sets: 4, default_reps: 1, active: true },
      { name: 'Cone Drills', slug: 'cone-drills', category: 'conditioning',
        description: 'Change of direction around cones. L-drill, T-drill, etc.',
        default_sets: 4, default_reps: 1, active: true },

      // ============================================================================
      // SKILL DRILLS (15 min - position-specific)
      // ============================================================================
      { name: 'Route Running Drills', slug: 'route-running-drills', category: 'skill',
        description: 'Practice route tree at 75% speed. Focus on cuts and stems.',
        default_sets: 4, default_reps: 3, active: true },
      { name: 'Backpedal & Break', slug: 'backpedal-break', category: 'skill',
        description: 'DB drill - backpedal, hip turn, accelerate to ball.',
        default_sets: 4, default_reps: 4, active: true },
      { name: 'Pass Rush Get-Off', slug: 'pass-rush-getoff', category: 'skill',
        description: 'First step explosion from rusher stance.',
        default_sets: 4, default_reps: 4, active: true },
      { name: 'QB Footwork Drops', slug: 'qb-footwork-drops', category: 'skill',
        description: '3-step, 5-step drops with proper mechanics.',
        default_sets: 4, default_reps: 4, active: true },

      // ============================================================================
      // COOL DOWN (15 min - static stretching)
      // ============================================================================
      { name: 'Standing Quad Stretch', slug: 'standing-quad-stretch', category: 'cool_down',
        description: 'Stand on one leg, pull heel toward glute.',
        default_sets: 1, default_hold_seconds: 30, active: true },
      { name: 'Standing Hamstring Stretch', slug: 'standing-hamstring-stretch', category: 'cool_down',
        description: 'Foot forward, heel down, hinge at hips toward toes.',
        default_sets: 1, default_hold_seconds: 30, active: true },
      { name: 'Kneeling Hip Flexor Stretch', slug: 'kneeling-hip-flexor-stretch', category: 'cool_down',
        description: 'Kneeling lunge, push hips forward.',
        default_sets: 1, default_hold_seconds: 30, active: true },
      { name: 'Calf Stretch', slug: 'standing-calf-stretch', category: 'cool_down',
        description: 'Step back, press heel into ground, lean into wall.',
        default_sets: 1, default_hold_seconds: 30, active: true },
      { name: 'Pigeon Stretch', slug: 'pigeon-stretch', category: 'cool_down',
        description: 'Hip opener - front leg bent, back leg extended.',
        default_sets: 1, default_hold_seconds: 45, active: true },

      // ============================================================================
      // EVENING RECOVERY (Home routine)
      // ============================================================================
      { name: 'Child\'s Pose', slug: 'childs-pose', category: 'recovery',
        description: 'Kneel, sit back on heels, fold forward with arms extended.',
        default_sets: 1, default_hold_seconds: 60, active: true },
      { name: 'Supine Twist', slug: 'supine-twist', category: 'recovery',
        description: 'Lie on back, drop knees to one side for spinal rotation.',
        default_sets: 1, default_hold_seconds: 45, active: true },
      { name: 'Deep Breathing', slug: 'deep-breathing', category: 'recovery',
        description: 'Belly breathing - inhale 4 counts, exhale 6-8 counts.',
        default_sets: 1, default_duration_seconds: 120, active: true },
      { name: 'Legs Up The Wall', slug: 'legs-up-wall', category: 'recovery',
        description: 'Lie on back with legs up against wall for circulation.',
        default_sets: 1, default_duration_seconds: 180, active: true },
    ];

    const { error } = await this.supabase.client
      .from("exercises")
      .upsert(defaultExercises, { onConflict: 'slug' });

    if (error) {
      this.logger.error("[DirectSupabaseApi] Error seeding default exercises:", error);
    } else {
      this.logger.success("[DirectSupabaseApi] Successfully seeded", defaultExercises.length, "exercises");
    }
  }

  /**
   * Get user's practice days from preferences
   */
  private async getUserPracticeDays(userId: string): Promise<string[]> {
    try {
      // First try to get from user_preferences by email
      const user = this.authService.getUser();
      if (user?.email) {
        const { data } = await this.supabase.client
          .from("user_preferences")
          .select("practice_days")
          .eq("email", user.email)
          .maybeSingle();
        
        if (data?.practice_days) {
          return data.practice_days;
        }
      }
      
      // Default to Monday/Wednesday if not set
      return ["Monday", "Wednesday"];
    } catch {
      return ["Monday", "Wednesday"];
    }
  }

  /**
   * Check if a given date is a practice day for the user
   */
  private async isPracticeDay(userId: string, date: string): Promise<boolean> {
    const practiceDays = await this.getUserPracticeDays(userId);
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    return practiceDays.map(d => d.toLowerCase()).includes(dayOfWeek.toLowerCase());
  }

  /**
   * Get the current training week number (1-52) for periodization
   * Uses the protocol date to calculate week of year
   */
  private getWeekNumber(date: string): number {
    const d = new Date(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  /**
   * Get load percentage based on current week in periodization
   * Foundation Phase (weeks 1-4): 20% -> 40% progression
   * Build Phase (weeks 5-12): 40% -> 60% progression
   * Peak Phase (weeks 13-16): 60% -> 75% (deload weeks included)
   * Maintenance/In-season: 50-60%
   */
  private getLoadPercentage(weekNumber: number): number {
    // Simplified periodization - max 40% BW as specified
    if (weekNumber <= 4) return 20; // Foundation
    if (weekNumber <= 8) return 30; // Early build
    if (weekNumber <= 12) return 35; // Mid build
    return 40; // Max load (capped at 40% as per requirement)
  }

  /**
   * Generate protocol exercises with provided exercise data
   * Uses week number for periodization - each week gets different exercises
   */
  private async generateProtocolExercisesWithData(
    protocolId: string,
    _focus: string,
    allExercises: Array<{
      id: string;
      name: string;
      category: string | null;
      default_sets?: number | null;
      default_reps?: number | null;
      default_hold_seconds?: number | null;
      default_duration_seconds?: number | null;
    }>,
    date?: string,
  ): Promise<void> {
    // Get week number for periodization
    const protocolDate = date || new Date().toISOString().split('T')[0];
    const weekNumber = this.getWeekNumber(protocolDate);
    const dayOfYear = Math.floor((new Date(protocolDate).getTime() - new Date(new Date(protocolDate).getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
    const loadPercentage = this.getLoadPercentage(weekNumber);
    
    this.logger.info(`[DirectSupabaseApi] Generating protocol for week ${weekNumber}, day ${dayOfYear}, load ${loadPercentage}%`);

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

    // Helper to get exercises from a category with DETERMINISTIC selection based on day
    // This ensures each day gets different exercises, but the same day always gets the same ones
    const getExercises = (category: string, count: number, fallbackCategories: string[] = []) => {
      let exercises = exercisesByCategory.get(category) || [];
      
      // Try fallback categories if primary is empty
      if (exercises.length === 0 && fallbackCategories.length > 0) {
        for (const fallback of fallbackCategories) {
          exercises = exercisesByCategory.get(fallback) || [];
          if (exercises.length > 0) break;
        }
      }
      
      // If still empty, try to get any available exercises
      if (exercises.length === 0) {
        exercises = allExercises;
      }
      
      // Use deterministic selection based on dayOfYear + category hash
      // This makes Tuesday Jan 20 different from Tuesday Jan 27, but repeatable
      const categoryHash = category.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const seed = dayOfYear + categoryHash + weekNumber;
      
      // Deterministic shuffle using seed
      const shuffled = [...exercises].sort((a, b) => {
        const hashA = (a.id || a.name).split('').reduce((acc, c) => acc + c.charCodeAt(0), seed);
        const hashB = (b.id || b.name).split('').reduce((acc, c) => acc + c.charCodeAt(0), seed);
        return (hashA % 1000) - (hashB % 1000);
      });
      
      return shuffled.slice(0, count);
    };

    // Helper to add exercises to a block with fallback categories
    const addBlockExercises = (
      blockType: string,
      category: string,
      count: number,
      options: { useSets?: boolean; useHold?: boolean; useDuration?: boolean; fallbackCategories?: string[] } = { useSets: true }
    ) => {
      const exercises = getExercises(category, count, options.fallbackCategories || []);
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
    // MAIN TRAINING BLOCKS - 1.5h GYM STRUCTURE
    // Evidence-based periodization with all training components
    // =========================================================================

    // ISOMETRICS (15 min) - tendon health and strength foundation
    addBlockExercises("main_session", "isometrics", 3, { 
      useHold: true,
      fallbackCategories: ["strength"] 
    });

    // PLYOMETRICS (15 min) - explosive power development
    addBlockExercises("main_session", "plyometrics", 3, { 
      fallbackCategories: ["conditioning", "warm_up"] 
    });

    // STRENGTH (15 min) - injury prevention focused (Nordic curls, Copenhagen, etc.)
    addBlockExercises("main_session", "strength", 3, { 
      fallbackCategories: ["isometrics"] 
    });

    // CONDITIONING (15 min) - ACWR-adjusted sprint/agility work
    addBlockExercises("main_session", "conditioning", 2, { 
      fallbackCategories: ["warm_up"] 
    });

    // SKILL DRILLS (15 min) - position-specific work
    addBlockExercises("main_session", "skill", 2, { 
      fallbackCategories: ["conditioning", "warm_up"] 
    });

    // =========================================================================
    // RECOVERY BLOCKS
    // =========================================================================

    // Cool Down (15 min) - static stretching
    addBlockExercises("cool_down", "cool_down", 4, { 
      useHold: true, 
      fallbackCategories: ["mobility", "recovery"] 
    });

    // Evening Recovery (at home) - done at home before bed
    addBlockExercises("evening_recovery", "recovery", 2, { 
      useDuration: true, 
      fallbackCategories: ["mobility", "foam_roll"] 
    });

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

  /**
   * Submit wellness check-in directly to Supabase
   * This bypasses the API for local development
   */
  submitWellnessCheckin(data: {
    date?: string;
    sleepQuality?: number | null;
    sleepHours?: number | null;
    energyLevel?: number | null;
    stressLevel?: number | null;
    muscleSoreness?: number | null;
    sorenessAreas?: string[];
    notes?: string;
    readinessScore?: number | null;
    motivationLevel?: number | null;
    mood?: number | null;
    hydrationLevel?: number | null;
  }): Observable<DirectApiResponse<{ id: string }>> {
    const userId = this.authService.getUser()?.id;

    if (!userId) {
      return of({ success: false, error: "Not authenticated" });
    }

    const targetDate = data.date || new Date().toISOString().split("T")[0];
    
    // Calculate readiness if not provided
    const calculatedReadiness = data.readinessScore ?? this.calculateReadiness(data);

    return from(
      this.supabase.client
        .from("daily_wellness_checkin")
        .upsert(
          {
            user_id: userId,
            checkin_date: targetDate,
            sleep_quality: data.sleepQuality,
            sleep_hours: data.sleepHours,
            energy_level: data.energyLevel,
            stress_level: data.stressLevel,
            muscle_soreness: data.muscleSoreness,
            soreness_areas: data.sorenessAreas || [],
            notes: data.notes,
            calculated_readiness: calculatedReadiness,
            overall_readiness_score: calculatedReadiness,
            motivation_level: data.motivationLevel,
            mood: data.mood,
            hydration_level: data.hydrationLevel,
          },
          {
            onConflict: "user_id,checkin_date",
          }
        )
        .select("id")
        .single()
    ).pipe(
      map((result) => {
        if (result.error) {
          this.logger.error("[DirectSupabaseApi] Wellness save error:", result.error);
          return { success: false, error: result.error.message };
        }
        this.logger.success("[DirectSupabaseApi] Wellness check-in saved:", result.data?.id);
        return { success: true, data: result.data };
      }),
      catchError((error) => {
        this.logger.error("[DirectSupabaseApi] Wellness submission error:", error);
        return of({ success: false, error: error.message || "Failed to save wellness" });
      })
    );
  }

  /**
   * Calculate readiness score from wellness data
   * 
   * IMPORTANT: Returns null if required data is missing.
   * DO NOT use default/mock values - readiness must be calculated from real user input.
   * 
   * Required fields: sleepQuality AND energyLevel (minimum for valid calculation)
   * 
   * Evidence-based weights:
   * - Sleep: 30% (strong evidence base - Halson 2014, Fullagar et al. 2015)
   * - Energy: 25% (correlates with perceived performance)
   * - Stress: 25% (inverted - lower stress = better readiness)
   * - Soreness: 20% (inverted - lower soreness = better readiness)
   */
  private calculateReadiness(data: {
    sleepQuality?: number | null;
    energyLevel?: number | null;
    stressLevel?: number | null;
    muscleSoreness?: number | null;
  }): number | null {
    // CRITICAL: Require at least sleep AND energy for valid readiness calculation
    // DO NOT use defaults - user must provide real data
    if (data.sleepQuality === null || data.sleepQuality === undefined ||
        data.energyLevel === null || data.energyLevel === undefined) {
      this.logger.warn(
        "[DirectSupabaseApi] Cannot calculate readiness: missing required fields (sleepQuality and/or energyLevel)"
      );
      return null;
    }

    const sleep = data.sleepQuality;
    const energy = data.energyLevel;
    
    // Stress and soreness are optional but improve accuracy when provided
    const hasStress = data.stressLevel !== null && data.stressLevel !== undefined;
    const hasSoreness = data.muscleSoreness !== null && data.muscleSoreness !== undefined;

    // Calculate scores (all on 0-100 scale)
    const sleepScore = (sleep / 10) * 100;
    const energyScore = (energy / 10) * 100;

    let readiness: number;
    
    if (hasStress && hasSoreness) {
      // Full calculation with all 4 metrics
      const stressScore = ((10 - data.stressLevel!) / 10) * 100; // Invert stress
      const sorenessScore = ((10 - data.muscleSoreness!) / 10) * 100; // Invert soreness
      
      readiness = Math.round(
        sleepScore * 0.30 +
        energyScore * 0.25 +
        stressScore * 0.25 +
        sorenessScore * 0.20
      );
    } else if (hasStress) {
      // Calculation with sleep, energy, stress (redistribute soreness weight)
      const stressScore = ((10 - data.stressLevel!) / 10) * 100;
      readiness = Math.round(
        sleepScore * 0.375 +  // 30 + (20 * 30/80)
        energyScore * 0.3125 + // 25 + (20 * 25/80)
        stressScore * 0.3125   // 25 + (20 * 25/80)
      );
    } else if (hasSoreness) {
      // Calculation with sleep, energy, soreness (redistribute stress weight)
      const sorenessScore = ((10 - data.muscleSoreness!) / 10) * 100;
      readiness = Math.round(
        sleepScore * 0.40 +   // 30 + (25 * 30/75)
        energyScore * 0.333 + // 25 + (25 * 25/75)
        sorenessScore * 0.267 // 20 + (25 * 20/75)
      );
    } else {
      // Minimal calculation with just sleep and energy
      // Weights: sleep 55%, energy 45% (based on relative original weights)
      readiness = Math.round(
        sleepScore * 0.55 +
        energyScore * 0.45
      );
    }

    return Math.max(0, Math.min(100, readiness));
  }
}
