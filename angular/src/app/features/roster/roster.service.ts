/**
 * Roster Service
 * Handles all roster-related data operations and business logic
 * Extracted from roster.component.ts for better separation of concerns
 */
import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "../../core/services/supabase.service";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import {
  Player,
  StaffMember,
  TeamStat,
  TeamInvitation,
  TeamRole,
  StaffCategory,
  StaffByCategory,
  PlayerStatus,
} from "./roster.models";

/**
 * Team member record from database
 */
interface TeamMemberRecord {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  users?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
      country?: string;
      experience?: string;
      phone?: string;
      specialization?: string;
      certifications?: string[];
      achievements?: string[];
    };
  };
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
 */
interface InvitationRecord {
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

  readonly canManageRoster = computed(() => {
    const role = this.currentUserRole();
    const managementRoles = [
      "owner",
      "admin",
      "head_coach",
      "coach",
      "offense_coordinator",
      "defense_coordinator",
      "assistant_coach",
    ];
    return managementRoles.includes(role);
  });

  readonly canDeletePlayers = computed(() => {
    const role = this.currentUserRole();
    return ["owner", "admin", "head_coach", "coach"].includes(role);
  });

  readonly canViewHealthData = computed(() => {
    const role = this.currentUserRole();
    const healthDataRoles = [
      "owner",
      "admin",
      "head_coach",
      "coach",
      "physiotherapist",
      "nutritionist",
      "psychologist",
      "strength_conditioning_coach",
    ];
    return healthDataRoles.includes(role);
  });

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
      const { data: teamMember, error: teamError } = await this.supabaseService.client
        .from("team_members")
        .select("team_id, role, teams(name)")
        .eq("user_id", userId)
        .single();
      
      this.logger.warn(`[RosterService] Team member query result:`, JSON.stringify(teamMember));
      if (teamError) {
        this.logger.warn(`[RosterService] Team member query error:`, JSON.stringify(teamError));
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
      const { data: members } = await this.supabaseService.client
        .from("team_members")
        .select(
          `
          id,
          user_id,
          role,
          users:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `,
        )
        .eq("team_id", teamMember.team_id);

      // Load team members with player role and their user profile data
      // First get team members with role='player' - include position and jersey_number from team_members
      const { data: playerMemberIds } = await this.supabaseService.client
        .from("team_members")
        .select("id, team_id, user_id, role, position, jersey_number")
        .eq("team_id", teamMember.team_id)
        .eq("role", "player");
      
      this.logger.warn(`[RosterService] Player member IDs:`, JSON.stringify(playerMemberIds));
      
      // Then fetch user data for those members
      let playerMembers: PlayerMemberRecord[] = [];
      if (playerMemberIds && playerMemberIds.length > 0) {
        const userIds = playerMemberIds.map(m => m.user_id).filter(Boolean);
        const { data: userData } = await this.supabaseService.client
          .from("users")
          .select("id, email, first_name, last_name, full_name, position, jersey_number, country, height_cm, weight_kg, date_of_birth, onboarding_completed")
          .in("id", userIds);
        
        this.logger.warn(`[RosterService] User data:`, JSON.stringify(userData));
        
        // Combine member and user data - team_members fields take priority
        const userMap = new Map((userData || []).map(u => [u.id, u]));
        playerMembers = playerMemberIds.map(m => ({
          id: m.id,
          team_id: m.team_id,
          user_id: m.user_id,
          role: m.role,
          position: m.position, // From team_members (primary source)
          jersey_number: m.jersey_number, // From team_members (primary source)
          users: userMap.get(m.user_id) || undefined,
        }));
      }
      
      this.logger.info(`[RosterService] Combined player members:`, JSON.stringify(playerMembers));

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
      const staff = this.processStaffMembers(
        members as TeamMemberRecord[] | null,
      );
      this.coachingStaff.set(staff);

      // Process players from team_players table
      const playersFromTable = this.processPlayers(players);
      
      // Process players from team_members with role='player'
      const playersFromMembers = this.processPlayerMembers(
        playerMembers as PlayerMemberRecord[] | null,
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
      for (const player of playersFromMembers) {
        if (player.user_id && seenUserIds.has(player.user_id)) {
          continue; // Skip if already in team_players
        }
        allPlayersList.push(player);
      }
      
      this.allPlayers.set(allPlayersList);

      // Calculate team stats
      this.calculateTeamStats(allPlayersList, staff);
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
            Date.now() + 7 * 24 * 60 * 60 * 1000,
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
      const { data, error } = await this.supabaseService.client
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
          created_at,
          inviter:invited_by(raw_user_meta_data)
        `,
        )
        .eq("team_id", teamId)
        .in("status", ["pending", "expired"])
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code !== "42P01") throw error;
        return;
      }

      this.pendingInvitations.set(
        (data || []).map((inv) => {
          const invRecord = inv as InvitationRecord;
          return {
            id: invRecord.id,
            email: invRecord.email,
            role: invRecord.role,
            message: invRecord.message,
            status: invRecord.status as TeamInvitation["status"],
            invitedBy:
              invRecord.inviter?.raw_user_meta_data?.full_name || "Unknown",
            expiresAt: invRecord.expires_at,
            createdAt: invRecord.created_at,
            isExpired: new Date(invRecord.expires_at) < new Date(),
          };
        }),
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
            Date.now() + 7 * 24 * 60 * 60 * 1000,
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
          position: this.getRoleDisplayName(role),
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
   */
  private processPlayerMembers(members: PlayerMemberRecord[] | null): Player[] {
    return (members || [])
      .filter((m) => m.users?.onboarding_completed) // Only include onboarded users
      .map((m) => {
        const user = m.users;
        
        // Calculate age from date of birth
        let age = 0;
        if (user?.date_of_birth) {
          const birthDate = new Date(user.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        // Format height and weight
        const height = user?.height_cm ? `${user.height_cm} cm` : "N/A";
        const weight = user?.weight_kg ? `${user.weight_kg} kg` : "N/A";

        // Build name from first_name + last_name or full_name
        const name = user?.full_name || 
          [user?.first_name, user?.last_name].filter(Boolean).join(" ") || 
          user?.email?.split("@")[0] || 
          "Unknown";

        // PRIORITY: team_members fields > users fields (team_members is the authoritative source)
        const position = m.position || user?.position || "Unknown";
        const jerseyNumber = m.jersey_number ?? user?.jersey_number;

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
          status: "active" as PlayerStatus,
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

  private loadFallbackData(members: any[] | null): void {
    const staff = this.processStaffMembers(members);
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

  getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      owner: "Team Owner",
      admin: "Administrator",
      head_coach: "Head Coach",
      coach: "Head Coach",
      offense_coordinator: "Offense Coordinator",
      defense_coordinator: "Defense Coordinator",
      assistant_coach: "Assistant Coach",
      physiotherapist: "Physiotherapist",
      nutritionist: "Nutritionist",
      strength_conditioning_coach: "Strength & Conditioning Coach",
      player: "Player",
      manager: "Team Manager",
    };
    return roleNames[role] || role;
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
