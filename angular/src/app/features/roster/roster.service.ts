/**
 * Roster Service
 * Handles all roster-related data operations and business logic
 * Extracted from roster.component.ts for better separation of concerns
 */
import { Injectable, computed, inject, signal } from "@angular/core";
import { TIME } from "../../core/constants/app.constants";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { normalizePlayerName } from "../../shared/utils/format.utils";
import {
  Player,
  PlayerStatus,
  StaffByCategory,
  StaffCategory,
  StaffMember,
  TeamInvitation,
  TeamRole,
  TeamStat,
} from "./roster.models";

/**
 * User data from public.users table (simplified for team member queries)
 */
interface TeamMemberUserData {
  id: string;
  email?: string;
  full_name?: string;
  raw_user_meta_data?: {
    full_name?: string;
    country?: string;
    experience?: string;
    phone?: string;
    specialization?: string;
    certifications?: string[];
    achievements?: string[];
  };
}

/**
 * Team member record from database
 */
interface TeamMemberRecord {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  users?: TeamMemberUserData;
  teams?: {
    name: string;
  };
}

/**
 * Team player record from database
 */
interface TeamPlayerRecord {
  id: string;
  team_id: string;
  user_id?: string;
  name: string;
  position: string;
  jersey_number?: number | string;
  country?: string;
  age?: number;
  height?: string;
  weight?: string;
  email?: string;
  phone?: string;
  status: "active" | "injured" | "inactive" | "suspended";
  stats?: Record<string, unknown>;
  created_at: string;
}

/**
 * Team member record with player role and user profile data
 */
interface PlayerMemberRecord {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  position?: string; // From team_members (primary source)
  jersey_number?: number; // From team_members (primary source)
  users?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    position?: string; // From users (fallback)
    jersey_number?: number; // From users (fallback)
    country?: string;
    height_cm?: number;
    weight_kg?: number;
    date_of_birth?: string;
    onboarding_completed?: boolean;
  };
}

/**
 * Invitation record from database
 * @internal Reserved for future use - maps directly to DB schema
 */
interface _InvitationRecord {
  id: string;
  email: string;
  role: string;
  message?: string;
  status: string;
  expires_at: string;
  created_at: string;
  inviter?: {
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
}

@Injectable({
  providedIn: "root",
})
export class RosterService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private teamMembershipService = inject(TeamMembershipService);

  // State signals
  readonly isLoading = signal(false);
  readonly teamStats = signal<TeamStat[]>([]);
  readonly coachingStaff = signal<StaffMember[]>([]);
  readonly allPlayers = signal<Player[]>([]);
  readonly currentTeamId = signal<string | null>(null);
  readonly currentUserRole = signal<TeamRole>("player");
  readonly pendingInvitations = signal<TeamInvitation[]>([]);
  readonly error = signal<string | null>(null);

  // Computed values
  readonly coachingStaffByCategory = computed<StaffByCategory>(() => {
    const staff = this.coachingStaff();
    return {
      coaching: staff.filter((s) => s.roleCategory === "coaching"),
      medical: staff.filter((s) => s.roleCategory === "medical"),
      performance: staff.filter((s) => s.roleCategory === "performance"),
    };
  });

  // Use TeamMembershipService as single source of truth for role checks
  readonly canManageRoster = this.teamMembershipService.canManageRoster;
  readonly canDeletePlayers = this.teamMembershipService.canDeletePlayers;
  readonly canViewHealthData = this.teamMembershipService.canViewHealthData;

  /**
   * Load all roster data for the current user's team
   */
  async loadRosterData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    const userId = this.authService.currentUser()?.id;

    this.logger.warn(`[RosterService] Loading roster for user: ${userId}`);

    if (!userId) {
      this.logger.warn("[RosterService] No user ID found");
      this.isLoading.set(false);
      return;
    }

    try {
      // Get user's team and role
      const { data: teamMember, error: teamError } =
        await this.supabaseService.client
          .from("team_members")
          .select("team_id, role, teams(name)")
          .eq("user_id", userId)
          .single();

      this.logger.warn(
        `[RosterService] Team member query result:`,
        JSON.stringify(teamMember),
      );
      if (teamError) {
        this.logger.warn(
          `[RosterService] Team member query error:`,
          JSON.stringify(teamError),
        );
      }

      if (!teamMember?.team_id) {
        this.logger.warn("[RosterService] No team found for user");
        this.teamStats.set([]);
        this.coachingStaff.set([]);
        this.allPlayers.set([]);
        this.isLoading.set(false);
        return;
      }

      this.currentTeamId.set(teamMember.team_id);
      this.currentUserRole.set(teamMember.role as TeamRole);

      // Load team members (coaches/staff)
      // NOTE: team_members.user_id references auth.users (not public.users), so PostgREST
      // cannot do an implicit join. We query team_members first, then fetch user data separately.
      let members: TeamMemberRecord[] | null = null;

      // Step 1: Get team members without user join (FK is to auth.users, not public.users)
      const { data: membersData, error: membersError } =
        await this.supabaseService.client
          .from("team_members")
          .select("id, team_id, user_id, role")
          .eq("team_id", teamMember.team_id);

      if (membersError) {
        this.logger.warn(
          `[RosterService] Error loading team members:`,
          JSON.stringify(membersError),
        );
        members = [];
      } else {
        // Step 2: Fetch user data from public.users for these member user_ids
        const userIds = (membersData || [])
          .map((m) => m.user_id)
          .filter(Boolean);
        const usersMap = new Map<string, TeamMemberUserData>();

        if (userIds.length > 0) {
          const { data: usersData, error: usersError } =
            await this.supabaseService.client
              .from("users")
              .select("id, email, full_name")
              .in("id", userIds);

          if (usersError) {
            this.logger.warn(
              `[RosterService] Error fetching user data:`,
              JSON.stringify(usersError),
            );
          } else if (usersData) {
            usersData.forEach((u) => usersMap.set(u.id, u));
          }
        }

        // Map members with user data
        members = (membersData || []).map((m) => ({
          id: m.id,
          team_id: m.team_id,
          user_id: m.user_id,
          role: m.role,
          users: usersMap.get(m.user_id),
        }));
      }

      // Load team members with player role and their user profile data
      // First get team members with role='player' - include position and jersey_number from team_members
      const { data: playerMemberIds, error: playerMemberIdsError } =
        await this.supabaseService.client
          .from("team_members")
          .select("id, team_id, user_id, role, position, jersey_number")
          .eq("team_id", teamMember.team_id)
          .eq("role", "player");

      if (playerMemberIdsError) {
        this.logger.warn(
          `[RosterService] Error loading player member IDs:`,
          JSON.stringify(playerMemberIdsError),
        );
      }

      this.logger.warn(
        `[RosterService] Player member IDs:`,
        JSON.stringify(playerMemberIds),
      );

      // Then fetch user data for those members
      let playerMembers: PlayerMemberRecord[] = [];
      if (
        playerMemberIds &&
        Array.isArray(playerMemberIds) &&
        playerMemberIds.length > 0
      ) {
        const userIds = playerMemberIds.map((m) => m.user_id).filter(Boolean);

        let userData = null;
        let userError = null;

        if (userIds.length > 0) {
          const userQueryResult = await this.supabaseService.client
            .from("users")
            .select(
              "id, email, first_name, last_name, full_name, position, jersey_number, country, height_cm, weight_kg, date_of_birth, onboarding_completed",
            )
            .in("id", userIds);

          userData = userQueryResult.data;
          userError = userQueryResult.error;
        }

        if (userError) {
          this.logger.warn(
            `[RosterService] Error fetching user data:`,
            JSON.stringify(userError),
          );
        }

        this.logger.debug(
          `[RosterService] Found ${playerMemberIds.length} team members, ${userData?.length || 0} user records`,
        );

        // Combine member and user data - team_members fields take priority
        const userMap = new Map((userData || []).map((u) => [u.id, u]));
        playerMembers = playerMemberIds.map((m) => ({
          id: m.id,
          team_id: m.team_id,
          user_id: m.user_id,
          role: m.role,
          position: m.position, // From team_members (primary source)
          jersey_number: m.jersey_number, // From team_members (primary source)
          users: userMap.get(m.user_id) || undefined,
        }));

        // Log players without user records for debugging
        const playersWithoutUsers = playerMembers.filter((m) => !m.users);
        if (playersWithoutUsers.length > 0) {
          this.logger.warn(
            `[RosterService] Found ${playersWithoutUsers.length} players without user records:`,
            playersWithoutUsers.map((m) => ({ id: m.id, user_id: m.user_id })),
          );
        }
      }

      this.logger.info(
        `[RosterService] Combined player members:`,
        JSON.stringify(playerMembers),
      );

      // Load players from team_players table
      const { data: players, error: playersError } =
        await this.supabaseService.client
          .from("team_players")
          .select("*")
          .eq("team_id", teamMember.team_id)
          .order("position", { ascending: true });

      if (playersError) {
        this.logger.warn(
          "[RosterService] team_players table may not exist, using fallback",
        );
        this.loadFallbackData(members);
        return;
      }

      // Process coaching staff
      const staff = this.processStaffMembers(members);
      this.coachingStaff.set(staff);

      // Process players from team_players table
      const playersFromTable = this.processPlayers(players);
      this.logger.warn(
        `[RosterService] Processed ${playersFromTable.length} players from team_players table`,
      );

      // Process players from team_members with role='player'
      const playersFromMembers = this.processPlayerMembers(
        playerMembers as PlayerMemberRecord[] | null,
      );
      this.logger.warn(
        `[RosterService] Processed ${playersFromMembers.length} players from team_members`,
      );

      // Merge both player lists, avoiding duplicates by user_id
      const seenUserIds = new Set<string>();
      const allPlayersList: Player[] = [];

      // First add players from team_players (these are explicitly added players)
      for (const player of playersFromTable) {
        if (player.user_id) {
          seenUserIds.add(player.user_id);
        }
        allPlayersList.push(player);
      }

      // Then add players from team_members who don't already exist in team_players
      let skippedCount = 0;
      for (const player of playersFromMembers) {
        if (player.user_id && seenUserIds.has(player.user_id)) {
          skippedCount++;
          continue; // Skip if already in team_players
        }
        allPlayersList.push(player);
      }

      this.logger.warn(
        `[RosterService] Merged players: ${playersFromTable.length} from team_players, ${playersFromMembers.length} from team_members, ${skippedCount} skipped (duplicates), total: ${allPlayersList.length}`,
      );

      this.allPlayers.set(allPlayersList);

      // Calculate team stats
      this.calculateTeamStats(allPlayersList, staff);
      this.logger.warn(
        `[RosterService] Team stats calculated with ${allPlayersList.length} total players`,
      );
    } catch (error: unknown) {
      this.logger.error("[RosterService] Error loading roster:", error);
      this.error.set(this.getErrorMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Add a new player to the team
   */
  async addPlayer(
    playerData: Partial<Player>,
  ): Promise<{ success: boolean; error?: string }> {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      return { success: false, error: "You must be logged in" };
    }

    try {
      let teamId = this.currentTeamId();

      if (!teamId) {
        teamId = await this.ensureTeamExists(userId);
      }

      const { error } = await this.supabaseService.client
        .from("team_players")
        .insert({
          team_id: teamId,
          name: playerData.name,
          position: playerData.position,
          jersey_number: playerData.jersey,
          country: playerData.country || null,
          age: playerData.age || null,
          height: playerData.height || null,
          weight: playerData.weight || null,
          email: playerData.email || null,
          phone: playerData.phone || null,
          status: playerData.status || "active",
          created_by: userId,
        });

      if (error) throw error;

      await this.loadRosterData();
      return { success: true };
    } catch (error: unknown) {
      this.logger.error("[RosterService] Error adding player:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error) || "Failed to add player",
      };
    }
  }

  /**
   * Update an existing player
   */
  async updatePlayer(
    playerId: string,
    playerData: Partial<Player>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseService.client
        .from("team_players")
        .update({
          name: playerData.name,
          position: playerData.position,
          jersey_number: playerData.jersey,
          country: playerData.country || null,
          age: playerData.age || null,
          height: playerData.height || null,
          weight: playerData.weight || null,
          email: playerData.email || null,
          phone: playerData.phone || null,
          status: playerData.status || "active",
        })
        .eq("id", playerId);

      if (error) throw error;

      await this.loadRosterData();
      return { success: true };
    } catch (error: unknown) {
      this.logger.error("[RosterService] Error updating player:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error) || "Failed to update player",
      };
    }
  }

  /**
   * Remove a player from the team
   */
  async removePlayer(
    playerId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseService.client
        .from("team_players")
        .delete()
        .eq("id", playerId);

      if (error) throw error;

      await this.loadRosterData();
      return { success: true };
    } catch (error: unknown) {
      this.logger.error("[RosterService] Error removing player:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error) || "Failed to remove player",
      };
    }
  }

  /**
   * Update player status
   */
  async updatePlayerStatus(
    playerId: string,
    status: PlayerStatus,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseService.client
        .from("team_players")
        .update({ status })
        .eq("id", playerId);

      if (error) throw error;

      await this.loadRosterData();
      return { success: true };
    } catch (error: unknown) {
      this.logger.error("[RosterService] Error updating status:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error) || "Failed to update status",
      };
    }
  }

  /**
   * Bulk update player status
   */
  async bulkUpdateStatus(
    playerIds: string[],
    status: PlayerStatus,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseService.client
        .from("team_players")
        .update({ status })
        .in("id", playerIds);

      if (error) throw error;

      await this.loadRosterData();
      return { success: true };
    } catch (error: unknown) {
      this.logger.error("[RosterService] Error bulk updating status:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error) || "Failed to update status",
      };
    }
  }

  /**
   * Bulk remove players
   */
  async bulkRemovePlayers(
    playerIds: string[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseService.client
        .from("team_players")
        .delete()
        .in("id", playerIds);

      if (error) throw error;

      await this.loadRosterData();
      return { success: true };
    } catch (error: unknown) {
      this.logger.error("[RosterService] Error bulk removing players:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error) || "Failed to remove players",
      };
    }
  }

  /**
   * Send team invitation
   */
  async sendInvitation(
    email: string,
    role: string,
    message?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const teamId = this.currentTeamId();
    if (!teamId) {
      return { success: false, error: "No team selected" };
    }

    try {
      // Check if invitation already exists
      const { data: existing } = await this.supabaseService.client
        .from("team_invitations")
        .select("id, status")
        .eq("team_id", teamId)
        .eq("email", email)
        .eq("status", "pending")
        .single();

      if (existing) {
        return {
          success: false,
          error: "An invitation is already pending for this email",
        };
      }

      const { error } = await this.supabaseService.client
        .from("team_invitations")
        .insert({
          team_id: teamId,
          email,
          role,
          message: message || null,
          invited_by: this.authService.currentUser()?.id,
          status: "pending",
          expires_at: new Date(
            Date.now() + TIME.INVITATION_EXPIRY_DAYS * TIME.MS_PER_DAY,
          ).toISOString(),
        });

      if (error) {
        if (error.code === "42P01") {
          return { success: false, error: "Invitation feature coming soon!" };
        }
        throw error;
      }

      await this.loadPendingInvitations();
      return { success: true };
    } catch (error: unknown) {
      this.logger.error("[RosterService] Error sending invitation:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error) || "Failed to send invitation",
      };
    }
  }

  /**
   * Load pending invitations
   */
  async loadPendingInvitations(): Promise<void> {
    const teamId = this.currentTeamId();
    if (!teamId) return;

    try {
      // Fetch invitations without trying to embed auth.users (PostgREST can't follow that relationship)
      const { data: invitations, error } = await this.supabaseService.client
        .from("team_invitations")
        .select(
          `
          id,
          email,
          role,
          message,
          status,
          invited_by,
          expires_at,
          created_at
        `,
        )
        .eq("team_id", teamId)
        .in("status", ["pending", "expired"])
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code !== "42P01") throw error;
        return;
      }

      // Fetch inviter details separately from users table
      const inviterIds = [
        ...new Set(
          (invitations || [])
            .map((inv) => inv.invited_by)
            .filter(Boolean) as string[],
        ),
      ];

      let invitersMap = new Map<string, string>();
      if (inviterIds.length > 0) {
        const { data: users } = await this.supabaseService.client
          .from("users")
          .select("id, full_name, first_name, last_name")
          .in("id", inviterIds);

        if (users) {
          invitersMap = new Map(
            users.map((u) => [
              u.id,
              u.full_name ||
                [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                "Unknown",
            ]),
          );
        }
      }

      this.pendingInvitations.set(
        (invitations || []).map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          message: inv.message,
          status: inv.status as TeamInvitation["status"],
          invitedBy: invitersMap.get(inv.invited_by) || "Unknown",
          expiresAt: inv.expires_at,
          createdAt: inv.created_at,
          isExpired: new Date(inv.expires_at) < new Date(),
        })),
      );
    } catch (error: unknown) {
      this.logger.error("[RosterService] Error loading invitations:", error);
    }
  }

  /**
   * Resend invitation
   */
  async resendInvitation(
    invitationId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseService.client
        .from("team_invitations")
        .update({
          status: "pending",
          expires_at: new Date(
            Date.now() + TIME.INVITATION_EXPIRY_DAYS * TIME.MS_PER_DAY,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (error) throw error;

      await this.loadPendingInvitations();
      return { success: true };
    } catch (error: unknown) {
      this.logger.error("[RosterService] Error resending invitation:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error) || "Failed to resend invitation",
      };
    }
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(
    invitationId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseService.client
        .from("team_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      await this.loadPendingInvitations();
      return { success: true };
    } catch (error: unknown) {
      this.logger.error("[RosterService] Error cancelling invitation:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error) || "Failed to cancel invitation",
      };
    }
  }

  /**
   * Check if jersey number is taken
   */
  isJerseyNumberTaken(jerseyNumber: string, excludePlayerId?: string): boolean {
    const players = this.allPlayers();
    return players.some(
      (p) => p.jersey === jerseyNumber && p.id !== excludePlayerId,
    );
  }

  /**
   * Get available jersey numbers
   */
  getAvailableJerseyNumbers(): string[] {
    const usedNumbers = new Set(this.allPlayers().map((p) => p.jersey));
    const available: string[] = [];

    for (let i = 0; i <= 99; i++) {
      const num = i.toString();
      if (!usedNumbers.has(num)) {
        available.push(num);
      }
    }

    return available;
  }

  /**
   * Export roster to CSV
   */
  exportRosterToCsv(): string {
    const players = this.allPlayers();
    if (players.length === 0) return "";

    const headers = [
      "Name",
      "Position",
      "Jersey #",
      "Country",
      "Age",
      "Height",
      "Weight",
      "Status",
      "Email",
    ];
    const rows = players.map((p) => [
      p.name,
      p.position,
      p.jersey,
      p.country,
      p.age.toString(),
      p.height,
      p.weight,
      p.status,
      p.email || "",
    ]);

    return [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private processStaffMembers(
    members: TeamMemberRecord[] | null,
  ): StaffMember[] {
    const staffRoles = [
      "owner",
      "admin",
      "head_coach",
      "coach",
      "offense_coordinator",
      "defense_coordinator",
      "assistant_coach",
      "physiotherapist",
      "nutritionist",
      "strength_conditioning_coach",
    ];

    return (members || [])
      .filter((m: TeamMemberRecord) => staffRoles.includes(m.role))
      .map((m: TeamMemberRecord) => {
        const role = m.role;
        const category = this.getStaffCategoryFromRole(role);
        return {
          id: m.id,
          user_id: m.user_id,
          name:
            m.users?.raw_user_meta_data?.full_name ||
            m.users?.email?.split("@")[0] ||
            "Unknown",
          position: this.teamMembershipService.getRoleDisplayName(
            role as TeamRole,
          ),
          role: role,
          roleCategory: category,
          country: m.users?.raw_user_meta_data?.country || "Unknown",
          experience: m.users?.raw_user_meta_data?.experience || "N/A",
          email: m.users?.email,
          phone: m.users?.raw_user_meta_data?.phone,
          specialization: m.users?.raw_user_meta_data?.specialization,
          certifications: m.users?.raw_user_meta_data?.certifications || [],
          achievements: m.users?.raw_user_meta_data?.achievements || [],
        };
      });
  }

  private processPlayers(players: TeamPlayerRecord[] | null): Player[] {
    return (players || []).map((p: TeamPlayerRecord) => {
      // Map database status to Player status type
      let status: PlayerStatus = "active";
      if (p.status === "injured") status = "injured";
      else if (p.status === "inactive" || p.status === "suspended")
        status = "inactive";

      return {
        id: p.id,
        name: p.name,
        position: p.position,
        jersey: p.jersey_number?.toString() || "0",
        country: p.country || "Unknown",
        age: p.age || 0,
        height: p.height || "N/A",
        weight: p.weight || "N/A",
        email: p.email || "",
        phone: p.phone || "",
        status,
        stats: (p.stats || {}) as Record<string, number | string>,
        created_at: p.created_at,
        user_id: p.user_id,
      };
    });
  }

  /**
   * Process team_members with role='player' into Player objects
   * Uses user profile data from the users table
   * Note: Includes ALL players regardless of onboarding status
   * Players without completed onboarding will show with "pending" status
   */
  private processPlayerMembers(members: PlayerMemberRecord[] | null): Player[] {
    return (members || []).map((m) => {
      // Include players even without user records (show placeholder data)
      if (!m.users) {
        this.logger.debug(
          `[RosterService] Processing player without user record: team_member_id=${m.id}, user_id=${m.user_id}`,
        );
      }
      const user = m.users;

      // Calculate age from date of birth
      let age = 0;
      if (user?.date_of_birth) {
        const birthDate = new Date(user.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
      }

      // Format height and weight
      const height = user?.height_cm ? `${user.height_cm} cm` : "N/A";
      const weight = user?.weight_kg ? `${user.weight_kg} kg` : "N/A";

      // Build name from first_name + last_name or full_name
      // Fallback to user_id if no user record exists
      const name = user
        ? normalizePlayerName(
            {
              full_name: user.full_name,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
            },
            "Unknown",
          )
        : `Player ${m.user_id?.substring(0, 8) || "Unknown"}`;

      // PRIORITY: team_members fields > users fields (team_members is the authoritative source)
      const position = m.position || user?.position || "Unknown";
      const jerseyNumber = m.jersey_number ?? user?.jersey_number;

      // Set status based on onboarding completion
      const status: PlayerStatus = user?.onboarding_completed
        ? "active"
        : "inactive";

      return {
        id: m.id, // Use team_member id as the player id
        name,
        position,
        jersey: jerseyNumber?.toString() || "0",
        country: user?.country || "Unknown",
        age,
        height,
        weight,
        email: user?.email || "",
        phone: "",
        status,
        stats: {},
        created_at: new Date().toISOString(),
        user_id: m.user_id,
      };
    });
  }

  private calculateTeamStats(players: Player[], staff: StaffMember[]): void {
    const activePlayers = players.filter((p) => p.status === "active");
    const injuredPlayers = players.filter((p) => p.status === "injured");
    const uniqueCountries = new Set(
      players.map((p) => p.country).filter((c) => c !== "Unknown"),
    );
    const avgAge =
      players.length > 0
        ? Math.round(
            players.reduce((sum, p) => sum + (p.age || 0), 0) / players.length,
          )
        : 0;

    this.teamStats.set([
      { value: players.length.toString(), label: "Total Players" },
      { value: activePlayers.length.toString(), label: "Active" },
      { value: injuredPlayers.length.toString(), label: "Injured" },
      { value: uniqueCountries.size.toString(), label: "Countries" },
      { value: avgAge.toString(), label: "Avg Age" },
      { value: staff.length.toString(), label: "Staff" },
    ]);
  }

  private loadFallbackData(members: Array<{ role: string }> | null): void {
    const staff = this.processStaffMembers(
      members as TeamMemberRecord[] | null,
    );
    this.coachingStaff.set(staff);
    this.allPlayers.set([]);
    this.teamStats.set([
      { value: "0", label: "Total Players" },
      { value: "0", label: "Active" },
      { value: "0", label: "Injured" },
      { value: "0", label: "Countries" },
      { value: "0", label: "Avg Age" },
      { value: staff.length.toString(), label: "Staff" },
    ]);
    this.isLoading.set(false);
  }

  private async ensureTeamExists(userId: string): Promise<string> {
    // Check if user has a team
    const { data: teamMember } = await this.supabaseService.client
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .single();

    if (teamMember?.team_id) {
      this.currentTeamId.set(teamMember.team_id);
      return teamMember.team_id;
    }

    // Create a default team
    const { data: newTeam, error: teamError } =
      await this.supabaseService.client
        .from("teams")
        .insert({
          name: "My Team",
          created_by: userId,
        })
        .select()
        .single();

    if (teamError) throw teamError;

    this.currentTeamId.set(newTeam.id);

    await this.supabaseService.client.from("team_members").insert({
      team_id: newTeam.id,
      user_id: userId,
      role: "owner",
    });

    return newTeam.id;
  }

  private getStaffCategoryFromRole(role: string): StaffCategory {
    const medicalRoles = ["physiotherapist", "nutritionist"];
    const performanceRoles = ["strength_conditioning_coach"];

    if (medicalRoles.includes(role)) return "medical";
    if (performanceRoles.includes(role)) return "performance";
    return "coaching";
  }

  private getErrorMessage(error: unknown): string {
    const err = error as { status?: number };
    if (err?.status === 401 || err?.status === 403) {
      return "Your session has expired. Please log in again.";
    } else if (err?.status && err.status >= 500) {
      return "The server is temporarily unavailable. Please try again later.";
    }
    return "Failed to load roster data. Please try again.";
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "object" && error !== null && "message" in error) {
      return String((error as { message: unknown }).message);
    }
    return String(error);
  }
}
