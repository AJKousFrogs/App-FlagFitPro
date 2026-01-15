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
   * Common pattern: team_members join users
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
    try {
      const { role, status, includeUserData = true } = options;

      let query = this.supabaseService.client
        .from("team_members")
        .select(
          includeUserData
            ? `
            id,
            team_id,
            user_id,
            role,
            position,
            jersey_number,
            status,
            joined_at,
            users:user_id (
              id,
              email,
              first_name,
              last_name,
              full_name,
              position,
              jersey_number,
              country,
              height_cm,
              weight_kg,
              date_of_birth,
              onboarding_completed,
              profile_photo_url
            )
          `
            : "id, team_id, user_id, role, position, jersey_number, status, joined_at",
        )
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

      const { data, error } = await query;

      if (error) {
        this.logger.error("[TeamApi] Error fetching team members:", error);
        throw error;
      }

      // Type guard: ensure data is an array, not a parser error
      if (!data || !Array.isArray(data)) {
        this.logger.error("[TeamApi] Invalid data format received");
        return [];
      }

      // Explicitly cast after type guard to satisfy TypeScript
      return data as unknown as TeamMemberWithUser[];
    } catch (error) {
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
