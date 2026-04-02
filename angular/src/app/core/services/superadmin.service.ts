import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { from, Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs";
import { LoggerService } from "./logger.service";

export interface ApprovalRequest {
  id: string;
  request_type: "team_creation" | "role_elevation" | "team_reinstatement";
  team_id: string | null;
  user_id: string | null;
  requested_role: string | null;
  request_reason: string | null;
  olympic_goals: string | null;
  experience_level: string | null;
  federation_affiliation: string | null;
  status: "pending" | "approved" | "rejected" | "more_info_needed";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  team_name?: string;
  team_type?: string;
  country_code?: string;
  olympic_track?: string;
  requester_email?: string;
  requester_name?: string;
}

export interface TeamApproval {
  id: string;
  name: string;
  team_type: string;
  country_code: string;
  olympic_track: string | null;
  approval_status: "pending_approval" | "approved" | "rejected" | "suspended";
  approved_at: string | null;
  rejection_reason: string | null;
  application_notes: string | null;
  created_at: string;
  coach_email?: string;
  coach_name?: string;
}

export interface SuperadminStats {
  pendingTeams: number;
  pendingRoles: number;
  approvedTeams: number;
  totalUsers: number;
  activeTeams: number;
}

export interface ManagedUserAccount {
  id: string;
  email: string;
  full_name: string;
  role: "player" | "coach" | "admin" | "superadmin";
  team_name?: string;
  status: "active" | "suspended" | "pending";
  created_at: string;
  last_login?: string;
}

@Injectable({
  providedIn: "root",
})
export class SuperadminService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  // Signals for reactive state
  isSuperadmin = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  loadError = signal<string | null>(null);
  pendingApprovals = signal<ApprovalRequest[]>([]);
  stats = signal<SuperadminStats>({
    pendingTeams: 0,
    pendingRoles: 0,
    approvedTeams: 0,
    totalUsers: 0,
    activeTeams: 0,
  });

  // Computed values
  hasPendingApprovals = computed(() => this.pendingApprovals().length > 0);
  pendingCount = computed(() => this.pendingApprovals().length);

  constructor() {
    // Check superadmin status when auth changes
    this.checkSuperadminStatus();
  }

  /**
   * Check if current user is a superadmin
   */
  async checkSuperadminStatus(): Promise<boolean> {
    const user = this.supabaseService.currentUser();
    if (!user) {
      this.isSuperadmin.set(false);
      return false;
    }

    try {
      const { data, error } = await this.supabaseService.client
        .from("superadmins")
        .select("id, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      const isSuperadmin = !error && !!data;
      this.isSuperadmin.set(isSuperadmin);

      if (isSuperadmin) {
        // Load pending approvals if superadmin
        this.loadPendingApprovals();
        this.loadStats();
      }

      return isSuperadmin;
    } catch {
      this.isSuperadmin.set(false);
      return false;
    }
  }

  /**
   * Load all pending approval requests
   */
  async loadPendingApprovals(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const { data, error } = await this.supabaseService.client
        .from("approval_requests")
        .select(
          `
          *,
          teams:team_id (
            name,
            team_type,
            country_code,
            olympic_track
          )
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Transform data
      const approvals: ApprovalRequest[] = (data || []).map(
        (item: Record<string, unknown>) => ({
          ...item,
          team_name: (item["teams"] as Record<string, unknown>)?.[
            "name"
          ] as string,
          team_type: (item["teams"] as Record<string, unknown>)?.[
            "team_type"
          ] as string,
          country_code: (item["teams"] as Record<string, unknown>)?.[
            "country_code"
          ] as string,
          olympic_track: (item["teams"] as Record<string, unknown>)?.[
            "olympic_track"
          ] as string,
        }),
      ) as ApprovalRequest[];

      this.pendingApprovals.set(approvals);
    } catch (error) {
      this.logger.error("Error loading pending approvals:", error);
      this.loadError.set(
        "Unable to load pending approvals right now. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Load superadmin dashboard stats
   */
  async loadStats(): Promise<void> {
    try {
      // Get pending teams count
      const { count: pendingTeams } = await this.supabaseService.client
        .from("teams")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "pending_approval");

      // Get pending role approvals count
      const { count: pendingRoles } = await this.supabaseService.client
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("role_approval_status", "pending_approval")
        .in("role", ["admin", "coach"]);

      // Get approved teams count
      const { count: approvedTeams } = await this.supabaseService.client
        .from("teams")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "approved");

      // Get total users count
      const { count: totalUsers } = await this.supabaseService.client
        .from("users")
        .select("*", { count: "exact", head: true });

      this.stats.set({
        pendingTeams: pendingTeams || 0,
        pendingRoles: pendingRoles || 0,
        approvedTeams: approvedTeams || 0,
        totalUsers: totalUsers || 0,
        activeTeams: approvedTeams || 0,
      });
      this.loadError.set(null);
    } catch (error) {
      this.logger.error("Error loading stats:", error);
      this.loadError.set(
        "Unable to load superadmin dashboard data right now. Please try again.",
      );
    }
  }

  /**
   * Get all teams with their approval status
   */
  async getAllTeams(): Promise<TeamApproval[]> {
    const { data, error } = await this.supabaseService.client
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as TeamApproval[];
  }

  async getAllUsers(): Promise<ManagedUserAccount[]> {
    const [{ data: userRows, error: usersError }, { data: superadminRows, error: superadminError }] =
      await Promise.all([
        this.supabaseService.client
          .from("users")
          .select(
            `
              id,
              email,
              full_name,
              account_status,
              is_active,
              created_at,
              last_login,
              team_members (
                role,
                status,
                team_id,
                teams:team_id (
                  name
                )
              )
            `,
          )
          .order("created_at", { ascending: false }),
        this.supabaseService.client
          .from("superadmins")
          .select("user_id")
          .eq("is_active", true),
      ]);

    if (usersError) {
      throw usersError;
    }

    if (superadminError) {
      throw superadminError;
    }

    const superadminIds = new Set(
      (superadminRows || [])
        .map((row) => row.user_id)
        .filter((value): value is string => typeof value === "string"),
    );

    return (userRows || []).map((row) => this.mapManagedUser(row, superadminIds));
  }

  async updateUserAccount(
    userId: string,
    input: Pick<ManagedUserAccount, "role" | "status">,
  ): Promise<void> {
    const accountStatus = input.status;
    const isActive = accountStatus !== "suspended";

    const { error: userError } = await this.supabaseService.client
      .from("users")
      .update({
        account_status: accountStatus,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (userError) {
      throw userError;
    }

    const { data: memberships, error: membershipError } =
      await this.supabaseService.client
        .from("team_members")
        .select("id")
        .eq("user_id", userId);

    if (membershipError) {
      throw membershipError;
    }

    const nextMembershipStatus =
      accountStatus === "active"
        ? "active"
        : accountStatus === "pending"
          ? "pending"
          : "inactive";

    if (Array.isArray(memberships) && memberships.length > 0) {
      const { error: updateMembershipError } = await this.supabaseService.client
        .from("team_members")
        .update({
          role: input.role === "superadmin" ? "admin" : this.mapUiRoleToMembershipRole(input.role),
          status: nextMembershipStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateMembershipError) {
        throw updateMembershipError;
      }
    }

    if (input.role === "superadmin") {
      const currentUser = this.supabaseService.currentUser();
      const { data: existingSuperadmin, error: existingSuperadminError } =
        await this.supabaseService.client
          .from("superadmins")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

      if (existingSuperadminError) {
        throw existingSuperadminError;
      }

      if (existingSuperadmin?.id) {
        const { error: updateSuperadminError } = await this.supabaseService.client
          .from("superadmins")
          .update({
            is_active: true,
            notes: "Updated from superadmin user management",
          })
          .eq("id", existingSuperadmin.id);

        if (updateSuperadminError) {
          throw updateSuperadminError;
        }
      } else {
        const { error: insertSuperadminError } = await this.supabaseService.client
          .from("superadmins")
          .insert({
            user_id: userId,
            granted_by: currentUser?.id ?? null,
            notes: "Granted from superadmin user management",
            is_active: true,
          });

        if (insertSuperadminError) {
          throw insertSuperadminError;
        }
      }
    } else {
      const { error: deactivateSuperadminError } = await this.supabaseService.client
        .from("superadmins")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (
        deactivateSuperadminError &&
        deactivateSuperadminError.code !== "PGRST116"
      ) {
        throw deactivateSuperadminError;
      }
    }
  }

  /**
   * Approve a team
   */
  approveTeam(teamId: string, notes?: string): Observable<boolean> {
    return from(
      this.supabaseService.client.rpc("approve_team", {
        p_team_id: teamId,
        p_notes: notes || null,
      }),
    ).pipe(
      map(() => true),
      tap(() => {
        this.loadPendingApprovals();
        this.loadStats();
      }),
      catchError((error) => {
        this.logger.error("Error approving team:", error);
        return of(false);
      }),
    );
  }

  /**
   * Reject a team
   */
  rejectTeam(teamId: string, reason: string): Observable<boolean> {
    return from(
      this.supabaseService.client.rpc("reject_team", {
        p_team_id: teamId,
        p_reason: reason,
      }),
    ).pipe(
      map(() => true),
      tap(() => {
        this.loadPendingApprovals();
        this.loadStats();
      }),
      catchError((error) => {
        this.logger.error("Error rejecting team:", error);
        return of(false);
      }),
    );
  }

  /**
   * Approve an admin/coach role
   */
  approveAdminRole(
    teamId: string,
    userId: string,
    notes?: string,
  ): Observable<boolean> {
    return from(
      this.supabaseService.client.rpc("approve_admin_role", {
        p_team_id: teamId,
        p_user_id: userId,
        p_notes: notes || null,
      }),
    ).pipe(
      map(() => true),
      tap(() => {
        this.loadPendingApprovals();
        this.loadStats();
      }),
      catchError((error) => {
        this.logger.error("Error approving admin role:", error);
        return of(false);
      }),
    );
  }

  /**
   * Add a new superadmin (only existing superadmins can do this)
   */
  async addSuperadmin(userId: string, notes?: string): Promise<boolean> {
    try {
      const currentUser = this.supabaseService.currentUser();

      const { error } = await this.supabaseService.client
        .from("superadmins")
        .insert({
          user_id: userId,
          granted_by: currentUser?.id,
          notes: notes || null,
          is_active: true,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      this.logger.error("Error adding superadmin:", error);
      return false;
    }
  }

  /**
   * Remove a superadmin (deactivate)
   */
  async removeSuperadmin(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.client
        .from("superadmins")
        .update({ is_active: false })
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      this.logger.error("Error removing superadmin:", error);
      return false;
    }
  }

  /**
   * Get all superadmins
   */
  async getSuperadmins(): Promise<
    { user_id: string; granted_at: string; notes: string | null }[]
  > {
    const { data, error } = await this.supabaseService.client
      .from("superadmins")
      .select("user_id, granted_at, notes")
      .eq("is_active", true);

    if (error) throw error;
    return (data || []) as {
      user_id: string;
      granted_at: string;
      notes: string | null;
    }[];
  }

  /**
   * Suspend a team
   */
  async suspendTeam(teamId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.client
        .from("teams")
        .update({
          approval_status: "suspended",
          rejection_reason: reason,
        })
        .eq("id", teamId);

      if (error) throw error;
      this.loadStats();
      return true;
    } catch (error) {
      this.logger.error("Error suspending team:", error);
      return false;
    }
  }

  /**
   * Reinstate a suspended team
   */
  async reinstateTeam(teamId: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.client
        .from("teams")
        .update({
          approval_status: "approved",
          rejection_reason: null,
        })
        .eq("id", teamId);

      if (error) throw error;
      this.loadStats();
      return true;
    } catch (error) {
      this.logger.error("Error reinstating team:", error);
      return false;
    }
  }

  private mapManagedUser(
    row: Record<string, unknown>,
    superadminIds: Set<string>,
  ): ManagedUserAccount {
    const memberships = Array.isArray(row["team_members"])
      ? (row["team_members"] as Record<string, unknown>[])
      : [];
    const primaryMembership = memberships[0] || null;
    const team = primaryMembership?.["teams"];
    const membershipRole =
      typeof primaryMembership?.["role"] === "string"
        ? primaryMembership["role"]
        : "player";
    const accountStatus =
      typeof row["account_status"] === "string" ? row["account_status"] : null;
    const isActive = row["is_active"] !== false;

    return {
      id: typeof row["id"] === "string" ? row["id"] : "",
      email: typeof row["email"] === "string" ? row["email"] : "",
      full_name: typeof row["full_name"] === "string" ? row["full_name"] : "",
      role: superadminIds.has(String(row["id"]))
        ? "superadmin"
        : this.mapMembershipRoleToUiRole(membershipRole),
      team_name:
        team && typeof team === "object" && typeof (team as Record<string, unknown>)["name"] === "string"
          ? ((team as Record<string, unknown>)["name"] as string)
          : undefined,
      status: this.mapAccountStatus(accountStatus, isActive),
      created_at:
        typeof row["created_at"] === "string" ? row["created_at"] : "",
      last_login:
        typeof row["last_login"] === "string" ? row["last_login"] : undefined,
    };
  }

  private mapMembershipRoleToUiRole(
    role: string,
  ): ManagedUserAccount["role"] {
    if (["owner", "admin"].includes(role)) {
      return "admin";
    }

    if (
      [
        "coach",
        "head_coach",
        "assistant_coach",
        "offense_coordinator",
        "defense_coordinator",
        "manager",
      ].includes(role)
    ) {
      return "coach";
    }

    return "player";
  }

  private mapUiRoleToMembershipRole(
    role: ManagedUserAccount["role"],
  ): string {
    switch (role) {
      case "admin":
        return "admin";
      case "coach":
        return "coach";
      case "player":
      case "superadmin":
      default:
        return "player";
    }
  }

  private mapAccountStatus(
    accountStatus: string | null,
    isActive: boolean,
  ): ManagedUserAccount["status"] {
    if (accountStatus === "pending") {
      return "pending";
    }

    if (accountStatus === "suspended" || !isActive) {
      return "suspended";
    }

    return "active";
  }
}
