import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { ToastService } from "./toast.service";
import { TOAST } from "../constants/toast-messages.constants";

/**
 * Privacy Settings Service
 *
 * Manages user privacy preferences as defined in PRIVACY_POLICY.md:
 * - AI Processing opt-out (Article 22 GDPR)
 * - Research data opt-in
 * - Emergency sharing levels
 * - Team-specific data sharing
 * - Marketing communications
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

// ============================================================================
// TYPES
// ============================================================================

export type EmergencySharingLevel =
  | "none"
  | "medical_only"
  | "medical_and_location"
  | "full";

export interface EmergencyContact {
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

export interface PrivacySettings {
  userId: string;

  // AI Processing
  aiProcessingEnabled: boolean;
  aiProcessingConsentDate: string | null;

  // Research
  researchOptIn: boolean;
  researchConsentDate: string | null;

  // Emergency
  emergencySharingLevel: EmergencySharingLevel;
  emergencyContacts: EmergencyContact[];

  // Marketing
  marketingOptIn: boolean;
  marketingConsentDate: string | null;

  // Data Sharing Defaults
  performanceSharingDefault: boolean;
  healthSharingDefault: boolean;

  // Metadata
  consentVersion: string;
  updatedAt: string;
}

export interface TeamSharingSettings {
  id: string;
  userId: string;
  teamId: string;
  teamName?: string;

  performanceSharingEnabled: boolean;
  healthSharingEnabled: boolean;
  allowedMetricCategories: string[];

  updatedAt: string;
}

export interface ParentalConsentStatus {
  id: string;
  status: "pending" | "verified" | "revoked" | "expired";
  guardianEmail: string;
  guardianName?: string;

  healthDataConsent: boolean;
  biometricsConsent: boolean;
  locationConsent: boolean;
  researchConsent: boolean;

  verifiedAt?: string;
  expiresAt?: string;
}

// Available metric categories for team sharing
export const METRIC_CATEGORIES = [
  {
    value: "performance",
    label: "Performance Metrics",
    description: "Speed, agility, strength scores",
  },
  {
    value: "training_load",
    label: "Training Load",
    description: "ACWR, session RPE, volume",
  },
  {
    value: "readiness",
    label: "Readiness Scores",
    description: "Daily readiness assessments",
  },
  {
    value: "wellness",
    label: "Wellness Data",
    description: "Sleep, stress, recovery",
  },
  {
    value: "injury_history",
    label: "Injury History",
    description: "Past injuries and recovery",
  },
  {
    value: "body_composition",
    label: "Body Composition",
    description: "Weight, body fat, measurements",
  },
] as const;

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class PrivacySettingsService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private toastService = inject(ToastService);

  // Reactive state
  private _settings = signal<PrivacySettings | null>(null);
  private _teamSettings = signal<TeamSharingSettings[]>([]);
  private _parentalConsent = signal<ParentalConsentStatus | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly settings = this._settings.asReadonly();
  readonly teamSettings = this._teamSettings.asReadonly();
  readonly parentalConsent = this._parentalConsent.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly aiProcessingEnabled = computed(
    () => this._settings()?.aiProcessingEnabled ?? true,
  );
  readonly researchOptIn = computed(
    () => this._settings()?.researchOptIn ?? false,
  );
  readonly emergencySharingLevel = computed(
    () => this._settings()?.emergencySharingLevel ?? "medical_only",
  );
  readonly hasParentalConsent = computed(
    () => this._parentalConsent()?.status === "verified",
  );

  // ============================================================================
  // LOAD SETTINGS
  // ============================================================================

  /**
   * Load user's privacy settings
   */
  async loadSettings(): Promise<void> {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      this._error.set("Not authenticated");
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    try {
      // Load privacy settings (create default if doesn't exist)
      let settingsData;
      const { data: existingSettings, error } = await this.supabase.client
        .from("privacy_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // No settings found, create default
        const { data: newSettings, error: insertError } =
          await this.supabase.client
            .from("privacy_settings")
            .insert({ user_id: userId })
            .select()
            .single();

        if (insertError) throw insertError;
        settingsData = newSettings;
      } else if (error) {
        throw error;
      } else {
        settingsData = existingSettings;
      }

      if (settingsData) {
        this._settings.set(this.mapDbToSettings(settingsData));
      }

      // Load team sharing settings
      await this.loadTeamSettings();

      // Check if user is a minor and load parental consent status
      await this.checkParentalConsentStatus();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load privacy settings";
      this._error.set(message);
      this.logger.error("Error loading privacy settings:", err);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Load team-specific sharing settings
   */
  private async loadTeamSettings(): Promise<void> {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    try {
      // Get user's teams
      const { data: memberships } = await this.supabase.client
        .from("team_members")
        .select("team_id, teams(id, name)")
        .eq("user_id", userId);

      if (!memberships?.length) {
        this._teamSettings.set([]);
        return;
      }

      // Get sharing settings for each team
      const teamIds = memberships.map((m) => m.team_id);
      const { data: settings } = await this.supabase.client
        .from("team_sharing_settings")
        .select("*")
        .eq("user_id", userId)
        .in("team_id", teamIds);

      // Map settings with team names
      const teamSettingsMap = new Map(
        settings?.map((s) => [s.team_id, s]) || [],
      );

      const teamSettings: TeamSharingSettings[] = memberships.map((m) => {
        const existing = teamSettingsMap.get(m.team_id);
        // Supabase returns related data - could be object or array depending on relationship
        const teamsData = m.teams as
          | { id: string; name: string }
          | { id: string; name: string }[]
          | null;
        const team = Array.isArray(teamsData) ? teamsData[0] : teamsData;

        return {
          id: existing?.id || "",
          userId,
          teamId: m.team_id,
          teamName: team?.name || "Unknown Team",
          performanceSharingEnabled:
            existing?.performance_sharing_enabled ?? false,
          healthSharingEnabled: existing?.health_sharing_enabled ?? false,
          allowedMetricCategories: existing?.allowed_metric_categories || [],
          updatedAt: existing?.updated_at || new Date().toISOString(),
        };
      });

      this._teamSettings.set(teamSettings);
    } catch (err) {
      this.logger.warn("Error loading team settings:", err);
    }
  }

  /**
   * Check parental consent status for minors
   */
  private async checkParentalConsentStatus(): Promise<void> {
    const userId = this.authService.getUser()?.id;
    if (!userId) return;

    try {
      // Check if user is a minor (has date_of_birth and is 13-17)
      const { data: user } = await this.supabase.client
        .from("users")
        .select("date_of_birth")
        .eq("id", userId)
        .single();

      if (!user?.date_of_birth) return;

      const birthDate = new Date(user.date_of_birth);
      const today = new Date();

      // Calculate age correctly: account for whether birthday has occurred this year
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      // If birthday hasn't occurred yet this year, subtract 1 from age
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      // Only check for minors (13-17)
      // GDPR Article 8: Parental consent required for users under 18
      if (age < 13 || age >= 18) {
        this._parentalConsent.set(null);
        return;
      }

      // Load parental consent status
      const { data: consent } = await this.supabase.client
        .from("parental_consent")
        .select("*")
        .eq("minor_user_id", userId)
        .in("consent_status", ["pending", "verified"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (consent) {
        this._parentalConsent.set({
          id: consent.id,
          status: consent.consent_status,
          guardianEmail: consent.guardian_email,
          guardianName: consent.guardian_name,
          healthDataConsent: consent.health_data_consent,
          biometricsConsent: consent.biometrics_consent,
          locationConsent: consent.location_consent,
          researchConsent: consent.research_consent,
          verifiedAt: consent.verified_at,
          expiresAt: consent.expires_at,
        });
      }
    } catch (err) {
      this.logger.warn("Error checking parental consent:", err);
    }
  }

  // ============================================================================
  // UPDATE SETTINGS
  // ============================================================================

  /**
   * Update AI processing preference
   */
  async updateAiProcessing(enabled: boolean): Promise<boolean> {
    return this.updateSetting({
      ai_processing_enabled: enabled,
      ai_processing_consent_date: enabled ? new Date().toISOString() : null,
    });
  }

  /**
   * Update research opt-in preference
   */
  async updateResearchOptIn(optIn: boolean): Promise<boolean> {
    return this.updateSetting({
      research_opt_in: optIn,
      research_consent_date: optIn ? new Date().toISOString() : null,
    });
  }

  /**
   * Update emergency sharing level
   */
  async updateEmergencySharing(level: EmergencySharingLevel): Promise<boolean> {
    return this.updateSetting({
      emergency_sharing_level: level,
    });
  }

  /**
   * Update emergency contacts
   */
  async updateEmergencyContacts(
    contacts: EmergencyContact[],
  ): Promise<boolean> {
    return this.updateSetting({
      emergency_contacts: contacts,
    });
  }

  /**
   * Update marketing preference
   */
  async updateMarketingOptIn(optIn: boolean): Promise<boolean> {
    return this.updateSetting({
      marketing_opt_in: optIn,
      marketing_consent_date: optIn ? new Date().toISOString() : null,
    });
  }

  /**
   * Update default data sharing preferences
   */
  async updateDataSharingDefaults(
    performance: boolean,
    health: boolean,
  ): Promise<boolean> {
    return this.updateSetting({
      performance_sharing_default: performance,
      health_sharing_default: health,
    });
  }

  /**
   * Generic setting update helper
   */
  private async updateSetting(
    updates: Record<string, unknown>,
  ): Promise<boolean> {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
      return false;
    }

    try {
      const { error } = await this.supabase.client
        .from("privacy_settings")
        .update(updates)
        .eq("user_id", userId);

      if (error) throw error;

      // Reload settings to get updated values
      await this.loadSettings();
      this.toastService.success(TOAST.SUCCESS.PRIVACY_UPDATED);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update settings";
      this.toastService.error(message);
      this.logger.error("Error updating privacy settings:", err);
      return false;
    }
  }

  // ============================================================================
  // TEAM SHARING
  // ============================================================================

  /**
   * Update team-specific sharing settings
   */
  async updateTeamSharing(
    teamId: string,
    settings: {
      performanceSharingEnabled?: boolean;
      healthSharingEnabled?: boolean;
      allowedMetricCategories?: string[];
    },
  ): Promise<boolean> {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
      return false;
    }

    try {
      const updateData = {
        user_id: userId,
        team_id: teamId,
        ...(settings.performanceSharingEnabled !== undefined && {
          performance_sharing_enabled: settings.performanceSharingEnabled,
        }),
        ...(settings.healthSharingEnabled !== undefined && {
          health_sharing_enabled: settings.healthSharingEnabled,
        }),
        ...(settings.allowedMetricCategories !== undefined && {
          allowed_metric_categories: settings.allowedMetricCategories,
        }),
      };

      const { error } = await this.supabase.client
        .from("team_sharing_settings")
        .upsert(updateData, {
          onConflict: "user_id,team_id",
        });

      if (error) throw error;

      await this.loadTeamSettings();
      this.toastService.success(TOAST.SUCCESS.UPDATED);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update team sharing";
      this.toastService.error(message);
      this.logger.error("Error updating team sharing:", err);
      return false;
    }
  }

  // ============================================================================
  // PARENTAL CONSENT
  // ============================================================================

  /**
   * Request parental consent (for minors)
   */
  async requestParentalConsent(
    guardianEmail: string,
    guardianName?: string,
  ): Promise<boolean> {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
      return false;
    }

    try {
      // Generate verification token
      const verificationToken = crypto.randomUUID();

      const { error } = await this.supabase.client
        .from("parental_consent")
        .insert({
          minor_user_id: userId,
          guardian_email: guardianEmail,
          guardian_name: guardianName,
          verification_token: verificationToken,
          verification_sent_at: new Date().toISOString(),
          consent_status: "pending",
        });

      if (error) throw error;

      // TODO: Send email to guardian with verification link
      // This would typically be done via an Edge Function

      await this.checkParentalConsentStatus();
      this.toastService.success(TOAST.SUCCESS.CONSENT_REQUEST_SENT);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to request consent";
      this.toastService.error(message);
      this.logger.error("Error requesting parental consent:", err);
      return false;
    }
  }

  // ============================================================================
  // DATA ACCESS CHECKS (for use by other services)
  // ============================================================================

  /**
   * Check if AI processing is allowed for user
   * Used by AI services to respect user preferences
   */
  canProcessWithAi(): boolean {
    const settings = this._settings();
    if (!settings) return false; // Privacy-first: default to NOT allowed if settings not loaded
    return settings.aiProcessingEnabled;
  }

  /**
   * Get detailed AI consent status using the database function
   * Returns status with explanation for UI display
   */
  async getAiConsentStatus(): Promise<{
    aiEnabled: boolean;
    consentDate: string | null;
    canProcess: boolean;
    reason: string;
  }> {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      return {
        aiEnabled: false,
        consentDate: null,
        canProcess: false,
        reason: "Not authenticated",
      };
    }

    try {
      const { data, error } = await this.supabase.client.rpc(
        "get_ai_consent_status",
        { p_user_id: userId },
      );

      if (error) throw error;

      const result = data?.[0];
      return {
        aiEnabled: result?.ai_enabled ?? false,
        consentDate: result?.consent_date ?? null,
        canProcess: result?.can_process ?? false,
        reason: result?.reason ?? "Unknown status",
      };
    } catch (err) {
      this.logger.error("Error getting AI consent status:", err);
      return {
        aiEnabled: false,
        consentDate: null,
        canProcess: false,
        reason: "Error checking consent status",
      };
    }
  }

  /**
   * Require AI consent before processing - throws error if not consented
   * Use this before any AI processing to fail fast
   */
  async requireAiConsent(): Promise<void> {
    const userId = this.authService.getUser()?.id;
    if (!userId) {
      throw new Error("Not authenticated");
    }

    try {
      const { error } = await this.supabase.client.rpc("require_ai_consent", {
        p_user_id: userId,
      });

      if (error) {
        // Check if it's our custom consent error
        if (error.message.includes("AI_CONSENT_REQUIRED")) {
          throw new Error(
            "AI processing is disabled. Enable AI processing in Privacy Settings to use this feature.",
          );
        }
        throw error;
      }
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("AI processing is disabled")
      ) {
        throw err;
      }
      throw new Error("Failed to verify AI consent");
    }
  }

  /**
   * Check if coach can access player's data for a team
   * Uses the database function for consistent consent checking
   */
  async canCoachAccessPlayerData(
    playerId: string,
    teamId: string,
    dataType: "performance" | "health",
  ): Promise<boolean> {
    try {
      const functionName =
        dataType === "performance"
          ? "check_performance_sharing"
          : "check_health_sharing";

      const { data, error } = await this.supabase.client.rpc(functionName, {
        p_player_id: playerId,
        p_team_id: teamId,
      });

      if (error) throw error;
      return data === true;
    } catch (err) {
      this.logger.warn(`Error checking ${dataType} sharing:`, err);
      return false; // Privacy-first: deny access on error
    }
  }

  /**
   * Check if a specific metric category is allowed for team sharing
   */
  async isMetricCategoryAllowed(
    playerId: string,
    teamId: string,
    category: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.client.rpc(
        "check_metric_category_allowed",
        {
          p_player_id: playerId,
          p_team_id: teamId,
          p_category: category,
        },
      );

      if (error) throw error;
      return data === true;
    } catch (err) {
      this.logger.warn("Error checking metric category:", err);
      return false;
    }
  }

  /**
   * Get teams where current user is a coach
   * Useful for coach dashboards to know which teams they can view
   */
  async getCoachedTeams(): Promise<string[]> {
    try {
      const { data, error } =
        await this.supabase.client.rpc("get_coached_teams");

      if (error) throw error;
      return data || [];
    } catch (err) {
      this.logger.warn("Error getting coached teams:", err);
      return [];
    }
  }

  /**
   * Check if minor has required parental consent for a feature
   */
  hasParentalConsentFor(
    feature: "health" | "biometrics" | "location" | "research",
  ): boolean {
    const consent = this._parentalConsent();
    if (!consent || consent.status !== "verified") return false;

    switch (feature) {
      case "health":
        return consent.healthDataConsent;
      case "biometrics":
        return consent.biometricsConsent;
      case "location":
        return consent.locationConsent;
      case "research":
        return consent.researchConsent;
      default:
        return false;
    }
  }

  // ============================================================================
  // CONSENT-AWARE DATA FETCHING
  // ============================================================================

  /**
   * Fetch load monitoring data with consent awareness
   * Returns data with consent_blocked flag for UI handling
   */
  async getConsentAwareLoadMonitoring(playerId?: string): Promise<{
    data: Array<{
      id: string;
      playerId: string;
      dailyLoad: number | null;
      acuteLoad: number | null;
      chronicLoad: number | null;
      acwr: number | null;
      injuryRiskLevel: string | null;
      consentBlocked: boolean;
      accessReason: string;
    }>;
    error: string | null;
  }> {
    try {
      let query = this.supabase.client
        .from("v_load_monitoring_consent")
        .select("*");

      if (playerId) {
        query = query.eq("player_id", playerId);
      }

      const { data, error } = await query.order("calculated_at", {
        ascending: false,
      });

      if (error) throw error;

      return {
        data: (data || []).map((row) => ({
          id: row.id,
          playerId: row.player_id,
          dailyLoad: row.daily_load,
          acuteLoad: row.acute_load,
          chronicLoad: row.chronic_load,
          acwr: row.acwr,
          injuryRiskLevel: row.injury_risk_level,
          consentBlocked: row.consent_blocked,
          accessReason: row.access_reason,
        })),
        error: null,
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to fetch load monitoring data";
      return { data: [], error: message };
    }
  }

  /**
   * Fetch workout logs with consent awareness
   */
  async getConsentAwareWorkoutLogs(playerId?: string): Promise<{
    data: Array<{
      id: string;
      playerId: string;
      sessionId: string;
      completedAt: string | null;
      rpe: number | null;
      durationMinutes: number | null;
      notes: string | null;
      consentBlocked: boolean;
    }>;
    error: string | null;
  }> {
    try {
      let query = this.supabase.client
        .from("v_workout_logs_consent")
        .select("*");

      if (playerId) {
        query = query.eq("player_id", playerId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      return {
        data: (data || []).map((row) => ({
          id: row.id,
          playerId: row.player_id,
          sessionId: row.session_id,
          completedAt: row.completed_at,
          rpe: row.rpe,
          durationMinutes: row.duration_minutes,
          notes: row.notes,
          consentBlocked: row.consent_blocked,
        })),
        error: null,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch workout logs";
      return { data: [], error: message };
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private mapDbToSettings(db: Record<string, unknown>): PrivacySettings {
    return {
      userId: db["user_id"] as string,
      aiProcessingEnabled: db["ai_processing_enabled"] as boolean,
      aiProcessingConsentDate: db["ai_processing_consent_date"] as
        | string
        | null,
      researchOptIn: db["research_opt_in"] as boolean,
      researchConsentDate: db["research_consent_date"] as string | null,
      emergencySharingLevel: db[
        "emergency_sharing_level"
      ] as EmergencySharingLevel,
      emergencyContacts: (db["emergency_contacts"] as EmergencyContact[]) || [],
      marketingOptIn: db["marketing_opt_in"] as boolean,
      marketingConsentDate: db["marketing_consent_date"] as string | null,
      performanceSharingDefault: db["performance_sharing_default"] as boolean,
      healthSharingDefault: db["health_sharing_default"] as boolean,
      consentVersion: db["consent_version"] as string,
      updatedAt: db["updated_at"] as string,
    };
  }
}
