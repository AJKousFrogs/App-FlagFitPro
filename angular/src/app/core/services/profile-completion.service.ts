import { Injectable, computed, inject, signal } from "@angular/core";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

/**
 * Profile field definition for completion tracking
 */
export interface ProfileField {
  name: string;
  key: string;
  value: unknown;
  required: boolean;
  weight: number; // Higher weight = more important for completion %
}

/**
 * Profile completion status
 */
export interface ProfileCompletionStatus {
  percentage: number;
  isComplete: boolean;
  completedFields: string[];
  missingFields: string[];
  missingRequired: string[];
  nextAction: string | null;
}

/**
 * User profile data for completion calculation
 */
export interface UserProfileData {
  id: string;
  email: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  jerseyNumber: number | null;
  teamId: string | null;
  teamName: string | null;
  avatarUrl: string | null;
  heightCm: number | null;
  weightKg: number | null;
  dateOfBirth: string | null;
  phone: string | null;
  onboardingCompleted: boolean;
  /** Gender from user profile: male, female, other, undisclosed */
  gender: "male" | "female" | "other" | "undisclosed" | null;
}

/**
 * ProfileCompletionService
 *
 * Centralized service for calculating profile completion percentage.
 * Ensures consistent display across dashboard, profile page, and other components.
 *
 * SINGLE SOURCE OF TRUTH for profile completion calculations.
 */
@Injectable({
  providedIn: "root",
})
export class ProfileCompletionService {
  private readonly authService = inject(AuthService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  // Reactive profile data
  private readonly _profileData = signal<UserProfileData | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _lastUpdated = signal<Date | null>(null);

  /** In-flight request deduplication - prevents duplicate API calls when multiple components call loadProfileData() */
  private _loadPromise: Promise<UserProfileData | null> | null = null;

  /** Cache TTL in ms - skip refetch if data is newer than this */
  private static readonly CACHE_TTL_MS = 30_000;

  // Public readonly signals
  readonly profileData = this._profileData.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();

  /**
   * Computed profile completion status - updates reactively
   */
  readonly completionStatus = computed<ProfileCompletionStatus>(() => {
    const data = this._profileData();
    if (!data) {
      return {
        percentage: 0,
        isComplete: false,
        completedFields: [],
        missingFields: ["Profile not loaded"],
        missingRequired: ["Profile not loaded"],
        nextAction: "Load profile",
      };
    }
    return this.calculateCompletion(data);
  });

  /**
   * Quick check: is profile complete? (100%)
   */
  readonly isProfileComplete = computed(
    () => this.completionStatus().isComplete,
  );

  /**
   * Quick check: completion percentage
   */
  readonly completionPercentage = computed(
    () => this.completionStatus().percentage,
  );

  /**
   * Quick check: is the user female?
   * Used for features like cycle tracking that are female-athlete-specific.
   */
  readonly isFemale = computed(() => this._profileData()?.gender === "female");

  /**
   * Load profile data from database
   * Call this on app init and after profile updates
   * Deduplicates concurrent calls and returns cached data if fresh (< 30s)
   */
  async loadProfileData(forceRefresh = false): Promise<UserProfileData | null> {
    const user = this.authService.getUser();
    if (!user?.id) {
      this.logger.warn("[ProfileCompletion] No authenticated user");
      this._profileData.set(null);
      return null;
    }

    // Return cached data if fresh and not forcing refresh
    if (!forceRefresh) {
      const last = this._lastUpdated();
      const cached = this._profileData();
      if (cached && last && Date.now() - last.getTime() < ProfileCompletionService.CACHE_TTL_MS) {
        return cached;
      }
      // Deduplicate concurrent in-flight requests
      if (this._loadPromise) {
        return this._loadPromise;
      }
    }

    this._loadPromise = this.fetchProfileData(user.id);

    try {
      const result = await this._loadPromise;
      return result;
    } finally {
      this._loadPromise = null;
    }
  }

  private async fetchProfileData(userId: string): Promise<UserProfileData | null> {
    this._isLoading.set(true);
    try {
      // Load user data from users table
      const { data: userData, error: userError } =
        await this.supabaseService.client
          .from("users")
          .select(
            `
          id, email, full_name, first_name, last_name, position, jersey_number,
          profile_photo_url, height_cm, weight_kg, date_of_birth, phone,
          onboarding_completed, gender
        `,
          )
          .eq("id", userId)
          .maybeSingle();

      if (userError) {
        this.logger.error("[ProfileCompletion] Error loading user:", userError);
        return null;
      }

      // If user doesn't exist in users table yet, return null gracefully
      if (!userData) {
        this.logger.warn(
        "[ProfileCompletion] User not found in users table:",
        userId,
        );
        return null;
      }

      // Load team membership
      const { data: teamMember } = await this.supabaseService.client
        .from("team_members")
        .select("team_id, position, jersey_number, teams(id, name)")
        .eq("user_id", userId)
        .eq("role", "player")
        .maybeSingle();

      // Extract team name from joined data
      const teamsData = teamMember?.teams as { name?: string } | null | undefined;
      const teamName = teamsData?.name || null;

      // Build profile data with team_members taking priority for position/jersey
      const profileData: UserProfileData = {
        id: userData.id as string,
        email: userData.email,
        fullName: userData.full_name,
        firstName: userData.first_name,
        lastName: userData.last_name,
        // Team members is authoritative source for position/jersey
        position: teamMember?.position || userData.position,
        jerseyNumber: teamMember?.jersey_number ?? userData.jersey_number,
        teamId: teamMember?.team_id || null,
        teamName,
        avatarUrl: userData.profile_photo_url,
        heightCm: userData.height_cm,
        weightKg: userData.weight_kg,
        dateOfBirth: userData.date_of_birth,
        phone: userData.phone,
        onboardingCompleted: userData.onboarding_completed || false,
        gender: userData.gender || null,
      };

      this._profileData.set(profileData);
      this._lastUpdated.set(new Date());
      this.logger.debug(
        "[ProfileCompletion] Profile loaded:",
        profileData.email,
      );

      return profileData;
    } catch (error) {
      this.logger.error("[ProfileCompletion] Unexpected error:", error);
      return null;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Calculate profile completion from data
   */
  private calculateCompletion(data: UserProfileData): ProfileCompletionStatus {
    // Define all profile fields with weights
    // Required fields have higher weight
    const fields: ProfileField[] = [
      {
        name: "Email",
        key: "email",
        value: data.email,
        required: true,
        weight: 15,
      },
      {
        name: "Display Name",
        key: "fullName",
        value:
          data.fullName ||
          `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        required: true,
        weight: 15,
      },
      {
        name: "Position",
        key: "position",
        value: data.position,
        required: true,
        weight: 15,
      },
      {
        name: "Jersey Number",
        key: "jerseyNumber",
        value: data.jerseyNumber,
        required: false,
        weight: 10,
      },
      {
        name: "Team",
        key: "teamName",
        value: data.teamName,
        required: false,
        weight: 10,
      },
      {
        name: "Profile Photo",
        key: "avatarUrl",
        value: data.avatarUrl,
        required: false,
        weight: 10,
      },
      {
        name: "Height",
        key: "heightCm",
        value: data.heightCm,
        required: false,
        weight: 10,
      },
      {
        name: "Weight",
        key: "weightKg",
        value: data.weightKg,
        required: false,
        weight: 10,
      },
      {
        name: "Date of Birth",
        key: "dateOfBirth",
        value: data.dateOfBirth,
        required: false,
        weight: 5,
      },
    ];

    const completedFields: string[] = [];
    const missingFields: string[] = [];
    const missingRequired: string[] = [];
    let totalWeight = 0;
    let completedWeight = 0;

    for (const field of fields) {
      totalWeight += field.weight;
      const hasValue = this.hasValidValue(field.value);

      if (hasValue) {
        completedFields.push(field.name);
        completedWeight += field.weight;
      } else {
        missingFields.push(field.name);
        if (field.required) {
          missingRequired.push(field.name);
        }
      }
    }

    const percentage = Math.round((completedWeight / totalWeight) * 100);
    const isComplete = percentage >= 100 && missingRequired.length === 0;

    // Determine next action
    let nextAction: string | null = null;
    if (missingRequired.length > 0) {
      nextAction = `Add your ${missingRequired[0].toLowerCase()}`;
    } else if (missingFields.length > 0) {
      nextAction = `Add ${missingFields[0].toLowerCase()} to complete your profile`;
    }

    return {
      percentage,
      isComplete,
      completedFields,
      missingFields,
      missingRequired,
      nextAction,
    };
  }

  /**
   * Check if a value is valid (not null, empty, or placeholder)
   */
  private hasValidValue(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") {
      const trimmed = value.trim();
      // Exclude placeholder values
      const placeholders = ["Loading...", "User", "Unknown", ""];
      return !placeholders.includes(trimmed);
    }
    if (typeof value === "number") {
      return !isNaN(value) && value > 0;
    }
    return Boolean(value);
  }

  /**
   * Force refresh profile data
   */
  async refresh(): Promise<void> {
    await this.loadProfileData(true);
  }

  /**
   * Get current weight (for daily tracking)
   * Returns the most recent weight from body_measurements or users table
   */
  async getCurrentWeight(): Promise<number | null> {
    const user = this.authService.getUser();
    if (!user?.id) return null;

    try {
      // Get most recent weight from physical_measurements
      const { data: measurement } = await this.supabaseService.client
        .from("physical_measurements")
        .select("weight")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (measurement?.weight) {
        return measurement.weight;
      }

      // Fallback to users table
      const profileData = this._profileData();
      return profileData?.weightKg || null;
    } catch (error) {
      this.logger.error("[ProfileCompletion] Error getting weight:", error);
      return null;
    }
  }

  /**
   * Update weight (creates physical_measurement entry for tracking)
   */
  async updateWeight(weightKg: number): Promise<boolean> {
    const user = this.authService.getUser();
    if (!user?.id) return false;

    try {
      // Insert to physical_measurements for daily tracking
      // Table has: user_id (UUID), weight (NUMERIC), created_at (TIMESTAMP)
      const { error: measurementError } = await this.supabaseService.client
        .from("physical_measurements")
        .insert({
          user_id: user.id,
          weight: weightKg,
        });

      if (measurementError) {
        this.logger.error(
          "[ProfileCompletion] Error saving measurement:",
          measurementError,
        );
        // Don't fail if measurement insert fails - continue to update user table
      }

      // Also update users table for profile display
      const { error: userError } = await this.supabaseService.client
        .from("users")
        .update({ weight_kg: weightKg, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (userError) {
        this.logger.error(
          "[ProfileCompletion] Error updating user weight:",
          userError,
        );
        return false;
      }

      // Refresh profile data
      await this.loadProfileData(true);
      return true;
    } catch (error) {
      this.logger.error("[ProfileCompletion] Error updating weight:", error);
      return false;
    }
  }

  /**
   * Get jersey number (from team_members, authoritative source)
   */
  getJerseyNumber(): number | null {
    return this._profileData()?.jerseyNumber || null;
  }

  /**
   * Get height
   */
  getHeight(): number | null {
    return this._profileData()?.heightCm || null;
  }

  /**
   * Get weight
   */
  getWeight(): number | null {
    return this._profileData()?.weightKg || null;
  }
}
