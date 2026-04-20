/**
 * Tournament Management Component (Coach View)
 *
 * Manage team tournament registrations, track RSVPs, handle payments,
 * set lineups, and monitor tournament progress.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { ToastService } from "../../../core/services/toast.service";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";

import { ProgressBar } from "primeng/progressbar";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { LoggerService } from "../../../core/services/logger.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { CoachTournamentManagementDataService } from "../services/coach-tournament-management-data.service";

// ===== Interfaces =====
interface Tournament {
  id: string;
  name: string;
  dates: string;
  location: string;
  division: string;
  entryFee: string;
  registrationStatus: "confirmed" | "pending" | "auto-qualified";
  paymentStatus: "paid" | "partial" | "unpaid";
  status: "upcoming" | "active" | "past" | "available";
  rsvpSummary: RsvpSummary;
  paymentSummary: PaymentSummary;
  rsvpDeadline?: string;
  games?: TournamentGame[];
}

interface RsvpSummary {
  going: number;
  cantGo: number;
  pending: number;
  minimum: number;
}

interface PaymentSummary {
  collected: number;
  total: number;
  outstanding: string;
}

interface TournamentRsvp {
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

interface LineupSlot {
  position: string;
  playerId: string | null;
  note?: string;
  isStarter: boolean;
}

interface TournamentGame {
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
}

// ===== Constants =====
const POSITIONS = [
  { label: "QB", value: "QB" },
  { label: "WR1", value: "WR1" },
  { label: "WR2", value: "WR2" },
  { label: "WR3", value: "WR3" },
  { label: "WR4", value: "WR4" },
  { label: "C", value: "C" },
  { label: "C2", value: "C2" },
  { label: "DB1", value: "DB1" },
  { label: "DB2", value: "DB2" },
  { label: "DB3", value: "DB3" },
  { label: "DB4", value: "DB4" },
  { label: "Rush1", value: "Rush1" },
  { label: "Rush2", value: "Rush2" },
];

@Component({
  selector: "app-tournament-management",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ProgressBar,
    SelectComponent,
    TableModule,
    StatusTagComponent,
    TextareaComponent,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
  ],
  templateUrl: "./tournament-management.component.html",
  styleUrl: "./tournament-management.component.scss",
})
export class TournamentManagementComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly tournamentManagementDataService = inject(
    CoachTournamentManagementDataService,
  );

  // State
  readonly tournaments = signal<Tournament[]>([]);
  readonly rsvps = signal<TournamentRsvp[]>([]);
  readonly lineupSlots = signal<LineupSlot[]>([]);
  readonly selectedTournament = signal<Tournament | null>(null);
  readonly activeTab = signal<"upcoming" | "active" | "past" | "available">(
    "upcoming",
  );
  readonly detailTab = signal<"overview" | "rsvps" | "lineup" | "schedule">(
    "overview",
  );
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  lineupNotes = "";

  // Dialog state
  showDetailDialog = false;

  // Options
  readonly positionOptions = POSITIONS;

  // Computed
  readonly filteredTournaments = computed(() =>
    this.tournaments().filter((t) => t.status === this.activeTab()),
  );

  readonly goingRsvps = computed(() =>
    this.rsvps().filter((r) => r.status === "going"),
  );

  readonly pendingRsvps = computed(() =>
    this.rsvps().filter((r) => r.status === "pending"),
  );

  readonly cantGoRsvps = computed(() =>
    this.rsvps().filter((r) => r.status === "cant-go"),
  );

  readonly starterSlots = computed(() =>
    this.lineupSlots().filter((s) => s.isStarter),
  );

  readonly rotationSlots = computed(() =>
    this.lineupSlots().filter((s) => !s.isStarter),
  );

  readonly availablePlayers = computed(() =>
    this.goingRsvps().map((r) => ({ id: r.id, name: r.playerName })),
  );

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const { data, error } =
        await this.tournamentManagementDataService.listTournaments();
      if (error) {
        throw error;
      }
      this.tournaments.set(data);
    } catch (err) {
      this.logger.error("Failed to load tournaments", err);
      this.tournaments.set([]);
      this.loadError.set(
        "We couldn't load tournaments. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  retryLoadData(): void {
    void this.loadData();
  }

  // Actions
  registerTeam(): void {
    this.activeTab.set("available");

    const firstAvailableTournament = this.tournaments().find(
      (tournament) => tournament.status === "available",
    );

    if (firstAvailableTournament) {
      void this.openTournamentDetail(firstAvailableTournament, "overview");
      return;
    }

    this.toastService.info(
      "No available tournaments are ready for registration yet.",
      "No Available Tournaments",
    );
  }

  manageTournament(tournament: Tournament): void {
    void this.openTournamentDetail(tournament, "overview");
  }

  viewRsvps(tournament: Tournament): void {
    void this.openTournamentDetail(tournament, "rsvps");
  }

  setLineup(tournament: Tournament): void {
    void this.openTournamentDetail(tournament, "lineup");
  }

  sendReminders(tournament: Tournament): void {
    void this.openTournamentDetail(tournament, "rsvps");
  }

  sendPendingReminders(): void {
    const count = this.pendingRsvps().length;
    if (count === 0) {
      this.toastService.info("No pending RSVPs need a reminder.");
      return;
    }

    const tournamentName = this.selectedTournament()?.name || "the tournament";
    const draft = `Reminder: ${count} RSVP responses are still pending for ${tournamentName}. Please update your availability as soon as possible.`;
    void this.openReminderComposer(draft, "Tournament Reminder Draft");
  }

  sendNudge(rsvp: TournamentRsvp): void {
    const tournamentName = this.selectedTournament()?.name || "the tournament";
    const draft = `Hi ${rsvp.playerName}, this is a reminder to update your RSVP for ${tournamentName}.`;
    void this.openReminderComposer(draft, "Player Reminder Draft");
  }

  async saveLineup(): Promise<void> {
    const tournament = this.selectedTournament();
    if (!tournament) {
      this.toastService.warn("Open a tournament before saving the lineup.");
      return;
    }

    const { error } = await this.tournamentManagementDataService.saveLineup({
      tournamentId: tournament.id,
      slots: this.lineupSlots(),
      notes: this.lineupNotes,
    });

    if (error) {
      this.logger.error("Failed to save tournament lineup", error);
      this.toastService.error("We couldn't save this lineup.", "Save Failed");
      return;
    }

    this.toastService.success(
      "Tournament lineup has been saved",
      "Lineup Saved",
    );
  }

  browseTournaments(): void {
    this.activeTab.set("available");
  }

  readonly browseTournamentsHandler = (): void => this.browseTournaments();

  onLineupSlotChange(slot: LineupSlot, value: unknown): void {
    if (value == null) {
      slot.playerId = null;
      return;
    }
    if (typeof value === "object" && "id" in value) {
      slot.playerId = String((value as { id: string }).id);
      return;
    }
    slot.playerId = String(value);
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
  }

  getGamesForDay(day: number): TournamentGame[] {
    return this.selectedTournament()?.games?.filter((g) => g.day === day) || [];
  }

  private showDetailDialogForTab(tab: "overview" | "rsvps" | "lineup" | "schedule"): void {
    this.detailTab.set(tab);
    this.showDetailDialog = true;
  }

  private async openTournamentDetail(
    tournament: Tournament,
    tab: "overview" | "rsvps" | "lineup" | "schedule",
  ): Promise<void> {
    this.selectedTournament.set(tournament);
    await this.hydrateLineupState(tournament.id);
    this.showDetailDialogForTab(tab);
  }

  private async openReminderComposer(
    draft: string,
    toastTitle: string,
  ): Promise<void> {
    this.closeDetailDialog();
    await this.router.navigate(["/team-chat"], {
      queryParams: {
        source: "tournaments",
        draft,
      },
    });
    this.toastService.success(
      "Reminder draft opened in team chat.",
      toastTitle,
    );
  }

  private async hydrateLineupState(tournamentId: string): Promise<void> {
    const { rsvps, lineup, error } =
      await this.tournamentManagementDataService.loadTournamentDetail(
        tournamentId,
      );

    if (error) {
      this.logger.error("Failed to load tournament detail", error);
      this.rsvps.set([]);
      this.lineupSlots.set(this.getDefaultLineupSlots());
      this.lineupNotes = "";
      return;
    }

    this.rsvps.set(rsvps);
    this.lineupSlots.set(lineup?.slots?.length ? lineup.slots : this.getDefaultLineupSlots());
    this.lineupNotes = lineup?.notes ?? "";
  }

  private getDefaultLineupSlots(): LineupSlot[] {
    return POSITIONS.map((position, index) => ({
      position: position.value,
      playerId: null,
      note: "",
      isStarter: index < 7,
    }));
  }

  // Helpers
  getPaymentPercent(tournament: Tournament): number {
    if (tournament.paymentSummary.total === 0) return 100;
    return Math.round(
      (tournament.paymentSummary.collected / tournament.paymentSummary.total) *
        100,
    );
  }

  getRegistrationLabel(status: string): string {
    const labels: Record<string, string> = {
      confirmed: "Confirmed",
      pending: "Pending",
      "auto-qualified": "Auto-qualified",
    };
    return labels[status] || status;
  }

  getRegistrationSeverity(
    status: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary" | "contrast"
    > = {
      confirmed: "success",
      pending: "warning",
      "auto-qualified": "info",
    };
    return severities[status] || "secondary";
  }

  getGameTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      pool: "Pool Play",
      quarterfinal: "Quarterfinal",
      semifinal: "Semifinal",
      final: "Final",
    };
    return labels[type] || type;
  }

  getEmptyMessage(): string {
    const messages: Record<string, string> = {
      upcoming: "No upcoming tournaments registered",
      active: "No tournaments currently active",
      past: "No past tournament history",
      available: "No tournaments available for registration",
    };
    return messages[this.activeTab()] || "";
  }
}
