import { Injectable, inject } from "@angular/core";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import {
  CoachTeamContextService,
  CoachTeamPlayerSummary,
} from "./coach-team-context.service";

export interface CoachTournamentSummary {
  id: string;
  name: string;
  dates: string;
  location: string;
  division: string;
  entryFee: string;
  registrationStatus: "confirmed" | "pending" | "auto-qualified";
  paymentStatus: "paid" | "partial" | "unpaid";
  status: "upcoming" | "active" | "past" | "available";
  rsvpSummary: {
    going: number;
    cantGo: number;
    pending: number;
    minimum: number;
  };
  paymentSummary: {
    collected: number;
    total: number;
    outstanding: string;
  };
  rsvpDeadline?: string;
  games?: Array<{
    id: string;
    gameNum: number;
    type: "pool" | "quarterfinal" | "semifinal" | "final";
    time: string;
    field: string;
    opponent: string;
    ourScore?: number;
    theirScore?: number;
    result?: "win" | "loss" | "pending";
    day: number;
  }>;
}

export interface CoachTournamentRsvp {
  id: string;
  playerName: string;
  position: string;
  status: "going" | "pending" | "cant-go";
  paymentStatus: "paid" | "owes" | "na";
  amountOwed?: number;
  amountPaid?: number;
  guests: number;
  guestDetails?: string;
  reason?: string;
}

export interface CoachTournamentLineup {
  slots: Array<{
    position: string;
    playerId: string | null;
    note?: string;
    isStarter: boolean;
  }>;
  notes: string;
}

type ServiceError = { message?: string } | null;

@Injectable({
  providedIn: "root",
})
export class CoachTournamentManagementDataService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly coachTeamContextService = inject(CoachTeamContextService);
  private readonly logger = inject(LoggerService);

  async listTournaments(): Promise<{
    data: CoachTournamentSummary[];
    error: ServiceError;
  }> {
    try {
      const { teamId } = await this.coachTeamContextService.resolveCoachContext();
      const [tournamentsQuery, availabilityQuery, budgetsQuery] =
        await Promise.all([
          this.supabaseService.client
            .from("tournaments")
            .select("*")
            .eq("team_id", teamId)
            .order("start_date", { ascending: true }),
          this.supabaseService.client
            .from("player_tournament_availability")
            .select("*")
            .eq("team_id", teamId),
          this.supabaseService.client
            .from("tournament_budgets")
            .select("*")
            .eq("team_id", teamId),
        ]);

      const firstError =
        tournamentsQuery.error ?? availabilityQuery.error ?? budgetsQuery.error;
      if (firstError) {
        return { data: [], error: firstError };
      }

      const availability = Array.isArray(availabilityQuery.data)
        ? availabilityQuery.data
        : [];
      const budgets = Array.isArray(budgetsQuery.data) ? budgetsQuery.data : [];

      return {
        data: Array.isArray(tournamentsQuery.data)
          ? tournamentsQuery.data.map((row) =>
              this.mapTournamentSummary(row, availability, budgets),
            )
          : [],
        error: null,
      };
    } catch (error) {
      this.logger.error(
        "[CoachTournamentManagementDataService] Failed to load tournaments",
        toLogContext(error),
      );
      return {
        data: [],
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load tournaments",
        },
      };
    }
  }

  async loadTournamentDetail(tournamentId: string): Promise<{
    rsvps: CoachTournamentRsvp[];
    lineup: CoachTournamentLineup | null;
    error: ServiceError;
  }> {
    try {
      const [{ teamId }, playersResult] = await Promise.all([
        this.coachTeamContextService.resolveCoachContext(),
        this.coachTeamContextService.listTeamPlayers(),
      ]);

      if (playersResult.error) {
        return { rsvps: [], lineup: null, error: playersResult.error };
      }

      const [availabilityQuery, lineupQuery] = await Promise.all([
        this.supabaseService.client
          .from("player_tournament_availability")
          .select("*")
          .eq("team_id", teamId)
          .eq("tournament_id", tournamentId),
        this.supabaseService.client
          .from("tournament_lineups")
          .select("slots, notes")
          .eq("team_id", teamId)
          .eq("tournament_id", tournamentId)
          .maybeSingle(),
      ]);

      const firstError = availabilityQuery.error ?? lineupQuery.error;
      if (firstError) {
        return { rsvps: [], lineup: null, error: firstError };
      }

      return {
        rsvps: this.mapRsvps(
          playersResult.data,
          Array.isArray(availabilityQuery.data) ? availabilityQuery.data : [],
        ),
        lineup: lineupQuery.data
          ? {
              slots: Array.isArray(lineupQuery.data["slots"])
                ? (lineupQuery.data["slots"] as CoachTournamentLineup["slots"])
                : [],
              notes:
                typeof lineupQuery.data["notes"] === "string"
                  ? lineupQuery.data["notes"]
                  : "",
            }
          : null,
        error: null,
      };
    } catch (error) {
      this.logger.error(
        "[CoachTournamentManagementDataService] Failed to load tournament detail",
        toLogContext(error),
      );
      return {
        rsvps: [],
        lineup: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load tournament detail",
        },
      };
    }
  }

  async saveLineup(input: {
    tournamentId: string;
    slots: CoachTournamentLineup["slots"];
    notes: string;
  }): Promise<{ error: ServiceError }> {
    try {
      const { teamId, userId } =
        await this.coachTeamContextService.resolveCoachContext();

      const { error } = await this.supabaseService.client
        .from("tournament_lineups")
        .upsert(
          {
            team_id: teamId,
            tournament_id: input.tournamentId,
            slots: input.slots,
            notes: input.notes.trim() || null,
            saved_by: userId,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "team_id,tournament_id",
          },
        );

      return { error };
    } catch (error) {
      this.logger.error(
        "[CoachTournamentManagementDataService] Failed to save lineup",
        toLogContext(error),
      );
      return {
        error: {
          message:
            error instanceof Error ? error.message : "Failed to save lineup",
        },
      };
    }
  }

  private mapTournamentSummary(
    row: Record<string, unknown>,
    availabilityRows: Record<string, unknown>[],
    budgetRows: Record<string, unknown>[],
  ): CoachTournamentSummary {
    const tournamentId = this.toString(row["id"]);
    const tournamentAvailability = availabilityRows.filter(
      (entry) => this.toString(entry["tournament_id"]) === tournamentId,
    );
    const tournamentBudgets = budgetRows.filter(
      (entry) => this.toString(entry["tournament_id"]) === tournamentId,
    );
    const going = tournamentAvailability.filter(
      (entry) => entry["status"] === "confirmed",
    ).length;
    const cantGo = tournamentAvailability.filter(
      (entry) => entry["status"] === "declined",
    ).length;
    const pending = tournamentAvailability.filter(
      (entry) => !entry["status"] || entry["status"] === "pending",
    ).length;
    const collected = tournamentAvailability.reduce(
      (sum, entry) =>
        sum + this.toNumber(entry["amount_paid"]),
      0,
    );
    const total =
      tournamentAvailability.reduce(
        (sum, entry) => sum + this.toNumber(entry["amount_due"]),
        0,
      ) ||
      tournamentBudgets.reduce(
        (sum, entry) => sum + this.toNumber(entry["estimated_cost"]),
        0,
      );
    const budgetRegistration = tournamentBudgets.find(
      (entry) => this.toString(entry["budget_category"]) === "registration",
    );

    return {
      id: tournamentId,
      name: this.toString(row["name"]),
      dates: this.formatDateRange(
        this.toString(row["start_date"]),
        this.toString(row["end_date"]),
      ),
      location: [this.toString(row["location"]), this.toString(row["country"])]
        .filter(Boolean)
        .join(", "),
      division:
        this.toString(row["competition_level"]) ||
        this.toString(row["tournament_type"]) ||
        "Tournament",
      entryFee: this.formatCurrency(
        this.toNumber(budgetRegistration?.["estimated_cost"]),
      ),
      registrationStatus: "confirmed",
      paymentStatus:
        total > 0 && collected >= total
          ? "paid"
          : collected > 0
            ? "partial"
            : "unpaid",
      status: this.getTournamentStatus(
        this.toString(row["start_date"]),
        this.toString(row["end_date"]),
      ),
      rsvpSummary: {
        going,
        cantGo,
        pending,
        minimum: 5,
      },
      paymentSummary: {
        collected,
        total,
        outstanding: this.formatCurrency(Math.max(total - collected, 0), "$0"),
      },
      rsvpDeadline: this.toString(row["registration_deadline"]) || undefined,
      games: [],
    };
  }

  private mapRsvps(
    players: CoachTeamPlayerSummary[],
    availabilityRows: Record<string, unknown>[],
  ): CoachTournamentRsvp[] {
    const availabilityMap = new Map(
      availabilityRows.map((row) => [this.toString(row["player_id"]), row]),
    );

    return players.map((player) => {
      const availability = availabilityMap.get(player.id);
      const statusValue = this.toString(availability?.["status"]);
      return {
        id: player.id,
        playerName: player.name,
        position: player.position,
        status:
          statusValue === "confirmed"
            ? "going"
            : statusValue === "declined"
              ? "cant-go"
              : "pending",
        paymentStatus:
          this.toString(availability?.["payment_status"]) === "paid"
            ? "paid"
            : this.toNumber(availability?.["amount_due"]) > 0
              ? "owes"
              : "na",
        amountOwed: this.toNumber(availability?.["amount_due"]),
        amountPaid: this.toNumber(availability?.["amount_paid"]),
        guests: 0,
        reason: this.toString(availability?.["reason"]) || undefined,
      };
    });
  }

  private getTournamentStatus(
    startDateValue: string,
    endDateValue: string,
  ): "upcoming" | "active" | "past" | "available" {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = startDateValue ? new Date(startDateValue) : null;
    const endDate = endDateValue ? new Date(endDateValue) : startDate;

    if (!startDate || Number.isNaN(startDate.getTime())) {
      return "upcoming";
    }

    const safeEndDate = endDate && !Number.isNaN(endDate.getTime()) ? endDate : startDate;
    safeEndDate.setHours(23, 59, 59, 999);

    if (safeEndDate < today) {
      return "past";
    }

    if (startDate <= today && safeEndDate >= today) {
      return "active";
    }

    return "upcoming";
  }

  private formatDateRange(startValue: string, endValue: string): string {
    if (!startValue) {
      return "";
    }

    const startDate = new Date(startValue);
    const endDate = endValue ? new Date(endValue) : null;
    if (Number.isNaN(startDate.getTime())) {
      return startValue;
    }

    const startLabel = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (!endDate || Number.isNaN(endDate.getTime()) || startValue === endValue) {
      return startLabel;
    }

    const endLabel = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startLabel} - ${endLabel}`;
  }

  private formatCurrency(value: number, fallback = "TBD"): string {
    if (!value) {
      return fallback;
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  private toString(value: unknown): string {
    return typeof value === "string" ? value : "";
  }

  private toNumber(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  }
}
