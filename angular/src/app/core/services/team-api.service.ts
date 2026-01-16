/**
 * Team API Service
 * 
 * Centralized service for common Supabase team-related queries.
 * Extracts repeated patterns for querying team_members, teams, and related data.
 * 
 * @example
 * // Get team members with user data
 * const members = await this.teamApiService.getTeamMembers(teamId);
 * 
 * // Get team players
 * const players = await this.teamApiService.getTeamPlayers(teamId);
 * 
 * // Get team coaches
 * const coaches = await this.teamApiService.getTeamCoaches(teamId);
 */

import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { normalizePlayerName } from "../../shared/utils/format.utils";

export interface TeamMemberWithUser {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  position?: string | null;
  jersey_number?: number | null;
  status?: string;
  joined_at?: string;
  users?: {
    id: string;
    email?: string;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    position?: string | null;
    jersey_number?: number | null;
    country?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    date_of_birth?: string | null;
    onboarding_completed?: boolean;
    profile_photo_url?: string | null;
  };
}

export interface TeamMemberBasic {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  position?: string | null;
  jersey_number?: number | null;
  status?: string;
  joined_at?: string;
  name: string;
  email?: string;
}

@Injectable({
  providedIn: "root",
})
export class TeamApiService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  /**
   * Get team members with user data
   * NOTE: team_members.user_id references auth.users (not public.users), so PostgREST
   * cannot do implicit joins. We query team_members first, then fetch user data separately.
   * 
   * @param teamId - Team ID
   * @param options - Query options
   * @returns Array of team members with user data
   */
  async getTeamMembers(
    teamId: string,
    options: {
      role?: string | string[];
      status?: string;
      includeUserData?: boolean;
    } = {},
  ): Promise<TeamMemberWithUser[]> {
    // Validate teamId to prevent unnecessary API calls
    if (!teamId || teamId === 'undefined' || teamId === 'null') {
      this.logger.warn("[TeamApi] getTeamMembers called with invalid teamId:", teamId);
      return [];
    }

    try {
      const { role, status, includeUserData = true } = options;

      // Step 1: Query team_members (no user join - FK is to auth.users)
      let query = this.supabaseService.client
        .from("team_members")
        .select("id, team_id, user_id, role, position, jersey_number, status, joined_at")
        .eq("team_id", teamId);

      if (role) {
        if (Array.isArray(role)) {
          query = query.in("role", role);
        } else {
          query = query.eq("role", role);
        }
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data: membersData, error } = await query;

      if (error) {
        // Handle RLS policy denial gracefully (400 error means user not in team)
        if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
          this.logger.warn("[TeamApi] User not authorized to view team members for team:", teamId);
          return [];
        }
        this.logger.error("[TeamApi] Error fetching team members:", error);
        throw error;
      }

      // Type guard: ensure data is an array, not a parser error
      if (!membersData || !Array.isArray(membersData)) {
        this.logger.warn("[TeamApi] No team members found or invalid data format");
        return [];
      }

      // Step 2: Fetch user data from public.users if requested
      if (includeUserData && membersData.length > 0) {
        const userIds = membersData.map((m) => m.user_id).filter(Boolean);
        
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await this.supabaseService.client
            .from("users")
            .select("id, email, first_name, last_name, full_name, position, jersey_number, country, height_cm, weight_kg, date_of_birth, onboarding_completed, profile_photo_url")
            .in("id", userIds);
          
          if (usersError) {
            this.logger.warn("[TeamApi] Error fetching user data:", usersError);
          }
          
          // Create lookup map for users
          const usersMap = new Map<string, typeof usersData[0]>();
          if (usersData) {
            usersData.forEach((u) => usersMap.set(u.id, u));
          }
          
          // Combine members with user data
          return membersData.map((m) => ({
            ...m,
            users: usersMap.get(m.user_id) || null,
          })) as unknown as TeamMemberWithUser[];
        }
      }

      // Return members without user data
      return membersData.map((m) => ({
        ...m,
        users: null,
      })) as unknown as TeamMemberWithUser[];
    } catch (error) {
      // Don't throw for common RLS/permission errors, just return empty
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        this.logger.warn("[TeamApi] Permission error in getTeamMembers:", errorMessage);
        return [];
      }
      this.logger.error("[TeamApi] Error in getTeamMembers:", error);
      throw error;
    }
  }

  /**
   * Get team players (members with role='player')
   * 
   * @param teamId - Team ID
   * @param options - Query options
   * @returns Array of team players with user data
   */
  async getTeamPlayers(
    teamId: string,
    options: {
      status?: string;
      includeUserData?: boolean;
    } = {},
  ): Promise<TeamMemberWithUser[]> {
    return this.getTeamMembers(teamId, {
      role: "player",
      ...options,
    });
  }

  /**
   * Get team coaches (members with coach roles)
   * 
   * @param teamId - Team ID
   * @returns Array of team coaches with user data
   */
  async getTeamCoaches(
    teamId: string,
  ): Promise<TeamMemberWithUser[]> {
    return this.getTeamMembers(teamId, {
      role: [
        "head_coach",
        "coach",
        "offense_coordinator",
        "defense_coordinator",
        "assistant_coach",
      ],
      includeUserData: true,
    });
  }

  /**
   * Get team members as basic objects with normalized names
   * Useful for dropdowns, lists, etc.
   * 
   * @param teamId - Team ID
   * @param options - Query options
   * @returns Array of team members with normalized names
   */
  async getTeamMembersBasic(
    teamId: string,
    options: {
      role?: string | string[];
      status?: string;
    } = {},
  ): Promise<TeamMemberBasic[]> {
    const members = await this.getTeamMembers(teamId, {
      ...options,
      includeUserData: true,
    });

    return members.map((member) => ({
      id: member.id,
      team_id: member.team_id,
      user_id: member.user_id,
      role: member.role,
      position: member.position || member.users?.position || null,
      jersey_number: member.jersey_number ?? member.users?.jersey_number ?? null,
      status: member.status || "active",
      joined_at: member.joined_at,
      name: normalizePlayerName(
        {
          full_name: member.users?.full_name,
          first_name: member.users?.first_name,
          last_name: member.users?.last_name,
          email: member.users?.email,
        },
        "Unknown",
      ),
      email: member.users?.email,
    }));
  }

  /**
   * Get team data with members
   * 
   * @param teamId - Team ID
   * @returns Team data with members
   */
  async getTeamWithMembers(teamId: string): Promise<{
    id: string;
    name: string;
    description?: string;
    created_at?: string;
    members: TeamMemberWithUser[];
  } | null> {
    try {
      const { data: team, error: teamError } =
        await this.supabaseService.client
          .from("teams")
          .select("*")
          .eq("id", teamId)
          .single();

      if (teamError || !team) {
        this.logger.warn("[TeamApi] Team not found:", teamId);
        return null;
      }

      const members = await this.getTeamMembers(teamId);

      return {
        ...team,
        members,
      };
    } catch (error) {
      this.logger.error("[TeamApi] Error fetching team with members:", error);
      throw error;
    }
  }
}
