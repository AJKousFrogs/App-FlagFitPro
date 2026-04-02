import { Injectable, computed, inject, signal } from "@angular/core";
import { normalizePlayerName } from "../../shared/utils/format.utils";
import { isBenignSupabaseQueryError } from "../../shared/utils/error.utils";
import { LoggerService, toLogContext } from "./logger.service";
import { SupabaseService } from "./supabase.service";

/**
 * Team membership data structure
 */
export interface TeamMembership {
  id: string;
  teamId: string;
  teamName: string | null;
  userId: string;
  role: TeamRole;
  position: string | null;
  jerseyNumber: number | null;
  status: "active" | "inactive" | "pending";
  joinedAt: string | null;
}

/**
 * Team role types
 */
export type TeamRole =
  | "owner"
  | "admin"
  | "head_coach"
  | "coach"
  | "offense_coordinator"
  | "defense_coordinator"
  | "assistant_coach"
  | "physiotherapist"
  | "nutritionist"
  | "strength_conditioning_coach"
  | "psychologist"
  | "player"
  | "manager";

/**
 * Coach information for contact
 */
export interface CoachInfo {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  role: TeamRole;
}

/**
 * TeamMembershipService
 *
 * Centralized service for all team membership queries.
 * SINGLE SOURCE OF TRUTH for team membership data.
 *
 * Eliminates duplicated team_members queries across 22+ files.
 *
 * @example
 * // Get current team ID
 * const teamId = this.teamMembershipService.teamId();
 *
 * // Check if user is a coach
 * if (this.teamMembershipService.isCoach()) { ... }
 *
 * // Get coach for DM
 * const coach = await this.teamMembershipService.getTeamCoach();
 */
@Injectable({
  providedIn: "root",
})
export class TeamMembershipService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  // Reactive membership data
  private readonly _membership = signal<TeamMembership | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _lastUpdated = signal<Date | null>(null);

  /** In-flight request deduplication */
  private _loadPromise: Promise<TeamMembership | null> | null = null;

  /** Cache TTL in ms - skip refetch if data is newer than this */
  private static readonly CACHE_TTL_MS = 30_000;

  // Public readonly signals
  readonly membership = this._membership.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();

  // Computed helpers - instant access, no API calls
  readonly teamId = computed(() => this._membership()?.teamId || null);
  readonly teamName = computed(() => this._membership()?.teamName || null);
  readonly role = computed(() => this._membership()?.role || null);
  readonly position = computed(() => this._membership()?.position || null);
  readonly jerseyNumber = computed(
    () => this._membership()?.jerseyNumber || null,
  );

  /**
   * Check if user has coach/staff role
   */
  readonly isCoach = computed(() => {
    const role = this._membership()?.role;
    if (!role) return false;
    return [
      "coach",
      "head_coach",
      "offense_coordinator",
      "defense_coordinator",
      "assistant_coach",
    ].includes(role);
  });

  /**
   * Check if user has admin/owner role
   */
  readonly isAdmin = computed(() => {
    const role = this._membership()?.role;
    if (!role) return false;
    return ["owner", "admin"].includes(role);
  });

  /**
   * Check if user is a player
   */
  readonly isPlayer = computed(() => {
    return this._membership()?.role === "player";
  });

  /**
   * Check if user can manage roster (coaches + admins)
   */
  readonly canManageRoster = computed(() => {
    const role = this._membership()?.role;
    if (!role) return false;
    return [
      "owner",
      "admin",
      "head_coach",
      "coach",
      "offense_coordinator",
      "defense_coordinator",
      "assistant_coach",
    ].includes(role);
  });

  /**
   * Check if user can view health data (coaches + medical staff)
   */
  readonly canViewHealthData = computed(() => {
    const role = this._membership()?.role;
    if (!role) return false;
    return [
      "owner",
      "admin",
      "head_coach",
      "coach",
      "physiotherapist",
      "nutritionist",
      "psychologist",
      "strength_conditioning_coach",
    ].includes(role);
  });

  /**
   * Check if user can delete players (owners, admins, head coaches, coaches)
   * Matches database function is_team_owner_or_admin
   */
  readonly canDeletePlayers = computed(() => {
    const role = this._membership()?.role;
    if (!role) return false;
    return ["owner", "admin", "head_coach", "coach"].includes(role);
  });

  /**
   * Check if user has a team
   */
  readonly hasTeam = computed(() => !!this._membership()?.teamId);

  /**
   * Load team membership for current user
   * Deduplicates concurrent calls and returns cached data if fresh (< 30s)
   */
  async loadMembership(forceRefresh = false): Promise<TeamMembership | null> {
    if (!this.supabaseService.isAuthenticated()) {
      this._membership.set(null);
      return null;
    }

    const user = this.supabaseService.currentUser();
    if (!user?.id) {
      this.logger.warn("[TeamMembership] No authenticated user");
      this._membership.set(null);
      return null;
    }

    if (!forceRefresh) {
      const last = this._lastUpdated();
      const cached = this._membership();
      if (cached && last && Date.now() - last.getTime() < TeamMembershipService.CACHE_TTL_MS) {
        return cached;
      }
      if (this._loadPromise) {
        return this._loadPromise;
      }
    }

    this._loadPromise = this.fetchMembership(user.id);
    try {
      return await this._loadPromise;
    } finally {
      this._loadPromise = null;
    }
  }

  private async fetchMembership(userId: string): Promise<TeamMembership | null> {
    this._isLoading.set(true);
    try {
      const { data: teamMember, error } = await this.supabaseService.client
        .from("team_members")
        .select(
          `
          id,
          team_id,
          user_id,
          role,
          position,
          jersey_number,
          status,
          joined_at,
          teams:team_id(id, name)
        `,
        )
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        if (isBenignSupabaseQueryError(error)) {
          this._membership.set(null);
          return null;
        }
        this.logger.error("[TeamMembership] Error loading membership:", error);
        return null;
      }

      if (!teamMember) {
        this.logger.debug("[TeamMembership] No team membership found for user");
        this._membership.set(null);
        return null;
      }

      // Extract team name from joined data
      const teamsData = teamMember.teams as { name?: string } | null | undefined;
      const teamName = teamsData?.name || null;

      const membership: TeamMembership = {
        id: teamMember.id,
        teamId: teamMember.team_id,
        teamName,
        userId: teamMember.user_id,
        role: teamMember.role as TeamRole,
        position: teamMember.position,
        jerseyNumber: teamMember.jersey_number,
        status: teamMember.status as TeamMembership["status"],
        joinedAt: teamMember.joined_at,
      };

      this._membership.set(membership);
      this._lastUpdated.set(new Date());
      this.logger.debug("[TeamMembership] Membership loaded:", {
        role: membership.role,
        teamName,
      });

      return membership;
    } catch (error) {
      if (!isBenignSupabaseQueryError(error)) {
        this.logger.error("[TeamMembership] Unexpected error:", error);
      }
      return null;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Force refresh membership data
   */
  async refresh(): Promise<void> {
    await this.loadMembership(true);
  }

  /**
   * Get team coach for direct messaging
   * Returns the first coach found for the user's team
   */
  async getTeamCoach(): Promise<CoachInfo | null> {
    const teamId = this.teamId();
    if (!teamId) {
      this.logger.warn("[TeamMembership] No team ID for coach lookup");
      return null;
    }

    try {
      const { data: coach, error } = await this.supabaseService.client
        .from("team_members")
        .select(
          `
          user_id,
          role,
          users:user_id(first_name, last_name, full_name)
        `,
        )
        .eq("team_id", teamId)
        .in("role", ["head_coach", "coach"])
        .limit(1)
        .maybeSingle();

      if (error || !coach) {
        this.logger.warn(
          "[TeamMembership] No coach found for team:",
          toLogContext(teamId),
        );
        return null;
      }

      const userData = coach.users as
        | { first_name?: string; last_name?: string; full_name?: string }
        | null
        | undefined;
      const firstName = userData?.first_name || null;
      const lastName = userData?.last_name || null;
      const fullName = normalizePlayerName(
        {
          full_name: userData?.full_name,
          first_name: firstName,
          last_name: lastName,
        },
        "Coach",
      );

      return {
        userId: coach.user_id,
        firstName,
        lastName,
        fullName,
        role: coach.role as TeamRole,
      };
    } catch (error) {
      this.logger.error("[TeamMembership] Error getting coach:", error);
      return null;
    }
  }

  /**
   * Get all coaches for the user's team
   */
  async getTeamCoaches(): Promise<CoachInfo[]> {
    const teamId = this.teamId();
    if (!teamId) return [];

    try {
      const { data: coaches, error } = await this.supabaseService.client
        .from("team_members")
        .select(
          `
          user_id,
          role,
          users:user_id(first_name, last_name, full_name)
        `,
        )
        .eq("team_id", teamId)
        .in("role", [
          "head_coach",
          "coach",
          "offense_coordinator",
          "defense_coordinator",
          "assistant_coach",
        ]);

      if (error || !coaches) return [];

      return coaches.map((coach) => {
        const userData = coach.users as
          | { first_name?: string; last_name?: string; full_name?: string }
          | null
          | undefined;
        const firstName = userData?.first_name || null;
        const lastName = userData?.last_name || null;
        const fullName = normalizePlayerName(
          {
            full_name: userData?.full_name,
            first_name: firstName,
            last_name: lastName,
          },
          "Coach",
        );

        return {
          userId: coach.user_id,
          firstName,
          lastName,
          fullName,
          role: coach.role as TeamRole,
        };
      });
    } catch (error) {
      this.logger.error("[TeamMembership] Error getting coaches:", error);
      return [];
    }
  }

  /**
   * Get team member user IDs for a specific team
   * Useful for filtering, notifications, etc.
   */
  async getTeamMemberIds(
    teamId?: string,
    options?: { role?: TeamRole | TeamRole[] },
  ): Promise<string[]> {
    const targetTeamId = teamId || this.teamId();
    if (!targetTeamId) return [];

    try {
      let query = this.supabaseService.client
        .from("team_members")
        .select("user_id")
        .eq("team_id", targetTeamId)
        .eq("status", "active");

      if (options?.role) {
        if (Array.isArray(options.role)) {
          query = query.in("role", options.role);
        } else {
          query = query.eq("role", options.role);
        }
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error("[TeamMembership] Error getting member IDs:", error);
        return [];
      }

      return (data || []).map((m) => m.user_id);
    } catch (error) {
      this.logger.error("[TeamMembership] Unexpected error:", error);
      return [];
    }
  }

  /**
   * Update position and jersey number for current user
   * Updates team_members table (authoritative source)
   */
  async updatePositionAndJersey(
    position: string | null,
    jerseyNumber: number | null,
  ): Promise<boolean> {
    const membership = this._membership();
    if (!membership?.id) {
      this.logger.warn("[TeamMembership] No membership to update");
      return false;
    }

    try {
      const { error } = await this.supabaseService.client
        .from("team_members")
        .update({
          position,
          jersey_number: jerseyNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", membership.id);

      if (error) {
        this.logger.error("[TeamMembership] Error updating membership:", error);
        return false;
      }

      // Refresh membership data
      await this.loadMembership(true);
      return true;
    } catch (error) {
      this.logger.error("[TeamMembership] Unexpected error:", error);
      return false;
    }
  }

  /**
   * Check if a user is a coach for a specific team
   * Static check - doesn't require membership to be loaded
   */
  async isUserCoachForTeam(userId: string, teamId: string): Promise<boolean> {
    try {
      const { data } = await this.supabaseService.client
        .from("team_members")
        .select("role")
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .in("role", ["coach", "head_coach", "assistant_coach"])
        .maybeSingle();

      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Get display name for a role
   */
  getRoleDisplayName(role: TeamRole): string {
    const roleNames: Record<TeamRole, string> = {
      owner: "Team Owner",
      admin: "Administrator",
      head_coach: "Head Coach",
      coach: "Coach",
      offense_coordinator: "Offense Coordinator",
      defense_coordinator: "Defense Coordinator",
      assistant_coach: "Assistant Coach",
      physiotherapist: "Physiotherapist",
      nutritionist: "Nutritionist",
      strength_conditioning_coach: "Strength & Conditioning Coach",
      psychologist: "Sport Psychologist",
      player: "Player",
      manager: "Team Manager",
    };
    return roleNames[role] || role;
  }
}
