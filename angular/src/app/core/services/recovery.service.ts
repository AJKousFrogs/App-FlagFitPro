import { Injectable, inject, computed, signal, effect } from "@angular/core";
import { Observable, of, from } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { RealtimeService } from "./realtime.service";
import { ApiService } from "./api.service";

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
  name: string;
  description: string;
  category: string;
  duration_minutes: number;
  priority: "high" | "medium" | "low";
  evidence_level: string;
  study_count: number;
  benefits: string[];
  steps: ProtocolStep[];
  created_at?: string;
  updated_at?: string;
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
        .order("start_time", { ascending: false });

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
      protocol: this.transformProtocol(data.protocol!),
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
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      duration: data.duration_minutes,
      priority: data.priority as "high" | "medium" | "low",
      evidenceLevel: data.evidence_level,
      studyCount: data.study_count || 0,
      benefits: data.benefits || [],
      steps: data.steps || [],
    };
  }

  /**
   * Get current recovery metrics from wellness data
   * Calculates recovery score based on latest wellness entry
   */
  getRecoveryMetrics(): Observable<RecoveryData> {
    const userId = this.userId();

    if (!userId) {
      this.logger.warn("[Recovery] No user logged in, using mock data");
      return of(this.getMockRecoveryData());
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
          this.logger.warn("[Recovery] No wellness data, using mock");
          return this.getMockRecoveryData();
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
              color:
                sleepQuality >= 7
                  ? "#10c96b"
                  : sleepQuality >= 5
                    ? "#f1c40f"
                    : "#e74c3c",
            },
            {
              name: "Energy Level",
              value: energyLevel,
              unit: "/10",
              percentage: energyLevel * 10,
              icon: "pi pi-bolt",
              color:
                energyLevel >= 7
                  ? "#10c96b"
                  : energyLevel >= 5
                    ? "#f1c40f"
                    : "#e74c3c",
            },
            {
              name: "Muscle Soreness",
              value: soreness,
              unit: "/10",
              percentage: (10 - soreness) * 10, // Invert: lower soreness = better
              icon: "pi pi-exclamation-circle",
              color:
                soreness <= 3
                  ? "#10c96b"
                  : soreness <= 6
                    ? "#f1c40f"
                    : "#e74c3c",
            },
            {
              name: "Stress Level",
              value: stressLevel,
              unit: "/10",
              percentage: (10 - stressLevel) * 10, // Invert: lower stress = better
              icon: "pi pi-info-circle",
              color:
                stressLevel <= 3
                  ? "#10c96b"
                  : stressLevel <= 6
                    ? "#f1c40f"
                    : "#e74c3c",
            },
          ],
        };
      })(),
    ).pipe(
      catchError((error) => {
        this.logger.error("[Recovery] Error fetching metrics:", error);
        return of(this.getMockRecoveryData());
      }),
    );
  }

  /**
   * Get recommended recovery protocols based on current metrics
   * First tries to load from database, falls back to default protocols
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
        .order("name");

      if (error) {
        this.logger.debug("[Recovery] Protocols table not available, using defaults");
        return this.getMockProtocols();
      }

      if (data && data.length > 0) {
        return data.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type || "active",
          duration: p.duration || 20,
          description: p.description || "",
          benefits: p.benefits || [],
          steps: p.steps || [],
          equipment: p.equipment || [],
          targetMuscles: p.target_muscles || [],
          intensity: p.intensity || "low",
          icon: p.icon || "pi pi-heart",
        }));
      }

      return this.getMockProtocols();
    } catch {
      return this.getMockProtocols();
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
      return of(this.createMockSession(protocol));
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
        this.logger.error("[Recovery] Failed to start session:", error);
        return of(this.createMockSession(protocol));
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
        map((response) => response.data || []),
        catchError(() => of(this.getMockResearchInsights())),
      );
  }

  /**
   * Get weekly recovery trends
   */
  getWeeklyRecoveryTrends(): Observable<number[]> {
    return this.apiService
      .get<number[]>(API_ENDPOINTS.recovery.weeklyTrends)
      .pipe(
        map((response) => response.data || []),
        catchError(() => of([75, 78, 72, 85, 80, 77, 82])),
      );
  }

  /**
   * Get protocol effectiveness data
   */
  getProtocolEffectiveness(): Observable<Record<string, number>> {
    return this.apiService
      .get<Record<string, number>>(API_ENDPOINTS.recovery.protocolEffectiveness)
      .pipe(
        map((response) => response.data || {}),
        catchError(() =>
          of({
            Cryotherapy: 8.5,
            Compression: 7.8,
            "Manual Therapy": 8.2,
            "Heat Therapy": 7.5,
          }),
        ),
      );
  }

  // Mock data methods for development
  private getMockRecoveryData(): RecoveryData {
    return {
      overallScore: 78,
      metrics: [
        {
          name: "Sleep Quality",
          value: 8.2,
          unit: "/10",
          percentage: 82,
          icon: "pi pi-moon",
          color: "#10c96b",
        },
        {
          name: "Heart Rate Variability",
          value: 45,
          unit: "ms",
          percentage: 75,
          icon: "pi pi-heart",
          color: "#10c96b",
        },
        {
          name: "Muscle Soreness",
          value: 3,
          unit: "/10",
          percentage: 70,
          icon: "pi pi-exclamation-circle",
          color: "#f1c40f",
        },
        {
          name: "Stress Level",
          value: 4,
          unit: "/10",
          percentage: 60,
          icon: "pi pi-info-circle",
          color: "#f1c40f",
        },
      ],
    };
  }

  private getMockProtocols(): RecoveryProtocol[] {
    return [
      {
        id: "1",
        name: "Cold Water Immersion",
        description:
          "15-minute cold water immersion protocol shown to reduce muscle soreness and inflammation.",
        category: "Cryotherapy",
        duration: 15,
        priority: "high",
        evidenceLevel: "Strong",
        studyCount: 24,
        benefits: [
          "Reduces muscle soreness",
          "Decreases inflammation",
          "Improves recovery time",
          "Enhances sleep quality",
        ],
        steps: [
          {
            id: "1",
            title: "Preparation",
            description: "Prepare cold water bath (10-15°C)",
            duration: 2,
            icon: "pi pi-cog",
            completed: false,
            active: false,
          },
          {
            id: "2",
            title: "Immersion",
            description: "Immerse body up to shoulders for 10 minutes",
            duration: 10,
            icon: "pi pi-water",
            completed: false,
            active: false,
          },
          {
            id: "3",
            title: "Warm-up",
            description: "Gradual warm-up with light movement",
            duration: 3,
            icon: "pi pi-sun",
            completed: false,
            active: false,
          },
        ],
      },
      {
        id: "2",
        name: "Compression Therapy",
        description:
          "30-minute compression session using compression garments or devices.",
        category: "Compression",
        duration: 30,
        priority: "medium",
        evidenceLevel: "Moderate",
        studyCount: 18,
        benefits: [
          "Improves circulation",
          "Reduces swelling",
          "Accelerates recovery",
        ],
        steps: [
          {
            id: "1",
            title: "Setup",
            description: "Apply compression garments or device",
            duration: 2,
            icon: "pi pi-cog",
            completed: false,
            active: false,
          },
          {
            id: "2",
            title: "Compression Session",
            description: "Maintain compression for 25 minutes",
            duration: 25,
            icon: "pi pi-compress",
            completed: false,
            active: false,
          },
          {
            id: "3",
            title: "Recovery",
            description: "Remove compression and assess",
            duration: 3,
            icon: "pi pi-check",
            completed: false,
            active: false,
          },
        ],
      },
      {
        id: "3",
        name: "Foam Rolling Protocol",
        description:
          "20-minute self-myofascial release using foam roller targeting major muscle groups.",
        category: "Manual Therapy",
        duration: 20,
        priority: "medium",
        evidenceLevel: "Moderate",
        studyCount: 15,
        benefits: [
          "Improves flexibility",
          "Reduces muscle tension",
          "Enhances mobility",
        ],
        steps: [
          {
            id: "1",
            title: "Warm-up",
            description: "Light movement to warm muscles",
            duration: 3,
            icon: "pi pi-sun",
            completed: false,
            active: false,
          },
          {
            id: "2",
            title: "Rolling",
            description: "Foam roll major muscle groups",
            duration: 15,
            icon: "pi pi-circle",
            completed: false,
            active: false,
          },
          {
            id: "3",
            title: "Stretching",
            description: "Light stretching to finish",
            duration: 2,
            icon: "pi pi-arrows-alt",
            completed: false,
            active: false,
          },
        ],
      },
    ];
  }

  private createMockSession(protocol: RecoveryProtocol): RecoverySession {
    return {
      id: "session-1",
      protocol,
      startTime: new Date(),
      duration: protocol.duration * 60, // Convert to seconds
      progress: 0,
      paused: false,
    };
  }

  private getMockResearchInsights(): ResearchInsight[] {
    return [
      {
        id: "1",
        title:
          "Effects of Cold Water Immersion on Recovery from Exercise-Induced Muscle Damage",
        summary:
          "This systematic review found that cold water immersion significantly reduces muscle soreness and improves recovery markers compared to passive recovery.",
        authors: "Bleakley et al.",
        year: 2012,
        journal: "British Journal of Sports Medicine",
        doi: "10.1136/bjsports-2011-090061",
        category: "Cryotherapy",
      },
      {
        id: "2",
        title:
          "Compression Garments and Recovery from Exercise-Induced Muscle Damage",
        summary:
          "Research demonstrates that compression garments can reduce perceived muscle soreness and improve recovery time following intense exercise.",
        authors: "Hill et al.",
        year: 2014,
        journal: "Journal of Strength and Conditioning Research",
        doi: "10.1519/JSC.0000000000000288",
        category: "Compression",
      },
    ];
  }
}
