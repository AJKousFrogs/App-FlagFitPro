/**
 * Tournament Management Component (Coach View)
 *
 * Manage team tournament registrations, track RSVPs, handle payments,
 * set lineups, and monitor tournament progress.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
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
import { Select, type SelectChangeEvent } from "primeng/select";
import { TableModule } from "primeng/table";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { Textarea } from "primeng/textarea";
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
    CommonModule,
    ProgressBar,
    Select,
    TableModule,
    StatusTagComponent,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
  ],
  template: `
    <app-main-layout>
<div class="tournament-management-page ui-page-stack">
        <app-page-header
          title="Tournament Management"
          subtitle="Manage registrations and lineups"
          icon="pi-trophy"
        >
          <app-button iconLeft="pi-plus" (clicked)="registerTeam()"
            >Register Team</app-button
          >
        </app-page-header>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'upcoming'"
            (click)="activeTab.set('upcoming')"
          >
            Upcoming
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'active'"
            (click)="activeTab.set('active')"
          >
            Active
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'past'"
            (click)="activeTab.set('past')"
          >
            Past
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'available'"
            (click)="activeTab.set('available')"
          >
            Available
          </button>
        </div>

        <!-- Tournaments List -->
        @if (isLoading()) {
          <app-loading message="Loading tournaments..." />
        } @else if (loadError()) {
          <app-page-error-state
            title="Unable to load tournaments"
            [message]="loadError()!"
            (retry)="retryLoadData()"
          />
        } @else if (filteredTournaments().length > 0) {
          <div class="tournaments-list">
            @for (tournament of filteredTournaments(); track tournament.id) {
              <div class="tournament-card">
                <div class="tournament-header">
                  <div class="tournament-title">
                    <span class="tournament-icon"><i class="pi pi-trophy" aria-hidden="true"></i></span>
                    <h3>{{ tournament.name }}</h3>
                  </div>
                  <div class="tournament-actions">
                    <app-button
                      size="sm"
                      (clicked)="manageTournament(tournament)"
                      >Manage</app-button
                    >
                    <app-button
                      variant="text"
                      size="sm"
                      iconLeft="pi-ellipsis-v"
                      >More options</app-button
                    >
                  </div>
                </div>

                <div class="tournament-details">
                  <div class="detail-row">
                    <span class="detail-item">{{ tournament.dates }}</span>
                    <span class="detail-item"
                      >{{ tournament.location }}</span
                    >
                  </div>
                  <div class="detail-row">
                    <span class="detail-item"
                      >Division: {{ tournament.division }}</span
                    >
                  </div>
                  <div class="detail-row">
                    <span class="detail-item">
                      Registration:
                      <app-status-tag
                        [value]="
                          getRegistrationLabel(tournament.registrationStatus)
                        "
                        [severity]="
                          getRegistrationSeverity(tournament.registrationStatus)
                        "
                        size="sm"
                      />
                    </span>
                    <span class="detail-item"
                      >Entry Fee: {{ tournament.entryFee }}</span
                    >
                  </div>
                </div>

                <div class="tournament-status-sections">
                  <!-- RSVP Status -->
                  <div class="status-section rsvp-section">
                    <h4>👥 ROSTER STATUS</h4>
                    <div class="rsvp-summary">
                      <span class="rsvp-item going"
                        >✅ Going: {{ tournament.rsvpSummary.going }}</span
                      >
                      <span class="rsvp-item cant-go"
                        >❌ Can't Go: {{ tournament.rsvpSummary.cantGo }}</span
                      >
                      <span class="rsvp-item pending"
                        >❓ Pending: {{ tournament.rsvpSummary.pending }}</span
                      >
                    </div>
                    <div class="minimum-check">
                      Minimum Required: {{ tournament.rsvpSummary.minimum }}
                      <span
                        class="current-count"
                        [class.met]="
                          tournament.rsvpSummary.going >=
                          tournament.rsvpSummary.minimum
                        "
                      >
                        Current: {{ tournament.rsvpSummary.going }}
                        @if (
                          tournament.rsvpSummary.going >=
                          tournament.rsvpSummary.minimum
                        ) {
                          ✓
                        }
                      </span>
                    </div>
                    @if (tournament.rsvpSummary.pending > 0) {
                      <div class="pending-warning">
                        <i class="pi pi-exclamation-triangle"></i>
                        {{ tournament.rsvpSummary.pending }} player RSVP pending
                      </div>
                    }
                  </div>

                  <!-- Payment Status -->
                  @if (tournament.paymentSummary.total > 0) {
                    <div class="status-section payment-section">
                      <h4>💰 PAYMENT STATUS</h4>
                      <div class="payment-info">
                        <span
                          >Collected: \${{
                            tournament.paymentSummary.collected
                          }}
                          / \${{ tournament.paymentSummary.total }} ({{
                            getPaymentPercent(tournament)
                          }}%)</span
                        >
                        @if (tournament.paymentSummary.outstanding) {
                          <span class="outstanding"
                            >Outstanding:
                            {{ tournament.paymentSummary.outstanding }}</span
                          >
                        }
                      </div>
                      <p-progressBar
                        [value]="getPaymentPercent(tournament)"
                        [showValue]="false"
                        class="tournament-payment-bar"
                      ></p-progressBar>
                    </div>
                  }
                </div>

                <div class="tournament-quick-actions">
                  <app-button
                    variant="secondary"
                    size="sm"
                    (clicked)="viewRsvps(tournament)"
                    >View RSVPs</app-button
                  >
                  <app-button
                    variant="secondary"
                    size="sm"
                    (clicked)="setLineup(tournament)"
                    >Set Lineup</app-button
                  >
                  <app-button
                    variant="text"
                    size="sm"
                    (clicked)="sendReminders(tournament)"
                    >Send Reminders</app-button
                  >
                </div>
              </div>
            }
          </div>
        } @else {
          <app-empty-state
            [useCard]="true"
            icon="pi-trophy"
            [heading]="'No ' + activeTab() + ' Tournaments'"
            [description]="getEmptyMessage()"
            [actionLabel]="(activeTab() === 'available' || activeTab() === 'upcoming') ? 'Browse Available' : null"
            [actionIcon]="(activeTab() === 'available' || activeTab() === 'upcoming') ? 'pi-search' : null"
            [actionHandler]="(activeTab() === 'available' || activeTab() === 'upcoming') ? browseTournamentsHandler : null"
          />
        }
      </div>

      <!-- Tournament Detail Dialog -->
      <app-dialog
        [(visible)]="showDetailDialog"
        class="tournament-detail-dialog"
        (hide)="showDetailDialog = false"
      >
        <app-dialog-header
          [title]="selectedTournament()?.name || 'Tournament Detail'"
          subtitle="RSVPs, lineups, and schedule for your selected event"
          icon="calendar"
          (close)="showDetailDialog = false"
        ></app-dialog-header>
        @if (selectedTournament()) {
          <div class="detail-tabs">
            <button
              class="detail-tab"
              [class.active]="detailTab() === 'overview'"
              (click)="detailTab.set('overview')"
            >
              Overview
            </button>
            <button
              class="detail-tab"
              [class.active]="detailTab() === 'rsvps'"
              (click)="detailTab.set('rsvps')"
            >
              RSVPs
            </button>
            <button
              class="detail-tab"
              [class.active]="detailTab() === 'lineup'"
              (click)="detailTab.set('lineup')"
            >
              Lineup
            </button>
            <button
              class="detail-tab"
              [class.active]="detailTab() === 'schedule'"
              (click)="detailTab.set('schedule')"
            >
              Schedule
            </button>
          </div>

          @switch (detailTab()) {
            @case ("overview") {
              <div class="overview-content">
                <div class="overview-info">
                  <p>
                    <strong>Dates:</strong> {{ selectedTournament()?.dates }}
                  </p>
                  <p>
                    <strong>Location:</strong>
                    {{ selectedTournament()?.location }}
                  </p>
                  <p>
                    <strong>Division:</strong>
                    {{ selectedTournament()?.division }}
                  </p>
                  <p>
                    <strong>Entry Fee:</strong>
                    {{ selectedTournament()?.entryFee }}
                  </p>
                </div>
              </div>
            }
            @case ("rsvps") {
              <div class="rsvps-content">
                <div class="rsvps-header">
                  <span
                    >RSVP Deadline:
                    {{ selectedTournament()?.rsvpDeadline }}</span
                  >
                  <app-button size="sm" (clicked)="sendPendingReminders()"
                    >Send Reminder to Pending</app-button
                  >
                </div>

                <h4>Going ({{ goingRsvps().length }})</h4>
                <div class="rsvp-list">
                  @for (rsvp of goingRsvps(); track rsvp.id) {
                    <div class="rsvp-row">
                      <span class="rsvp-status">✅</span>
                      <span class="rsvp-name">{{ rsvp.playerName }}</span>
                      <span class="rsvp-position">{{ rsvp.position }}</span>
                      <span
                        class="rsvp-payment"
                        [class.owes]="rsvp.paymentStatus === 'owes'"
                      >
                        @if (rsvp.paymentStatus === "paid") {
                          Paid: \${{ rsvp.amountPaid }}
                        } @else if (rsvp.paymentStatus === "owes") {
                          OWES: \${{ rsvp.amountOwed }} ⚠️
                        }
                      </span>
                      <span class="rsvp-guests"
                        >Guests: {{ rsvp.guests }}
                        {{ rsvp.guestDetails || "" }}</span
                      >
                    </div>
                  }
                </div>

                @if (pendingRsvps().length > 0) {
                  <h4>Pending ({{ pendingRsvps().length }})</h4>
                  <div class="rsvp-list">
                    @for (rsvp of pendingRsvps(); track rsvp.id) {
                      <div class="rsvp-row pending">
                        <span class="rsvp-status">❓</span>
                        <span class="rsvp-name">{{ rsvp.playerName }}</span>
                        <span class="rsvp-position">{{ rsvp.position }}</span>
                        <span class="no-response">No response</span>
                        <app-button size="sm" (clicked)="sendNudge(rsvp)"
                          >Send Nudge</app-button
                        >
                      </div>
                    }
                  </div>
                }

                @if (cantGoRsvps().length > 0) {
                  <h4>Can't Go ({{ cantGoRsvps().length }})</h4>
                  <div class="rsvp-list">
                    @for (rsvp of cantGoRsvps(); track rsvp.id) {
                      <div class="rsvp-row cant-go">
                        <span class="rsvp-status">❌</span>
                        <span class="rsvp-name">{{ rsvp.playerName }}</span>
                        <span class="rsvp-position">{{ rsvp.position }}</span>
                        <span class="rsvp-reason">{{
                          rsvp.reason || "No reason given"
                        }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
            @case ("lineup") {
              <div class="lineup-content">
                <div class="lineup-header">
                  <span>Tournament Lineup</span>
                  <app-button
                    size="sm"
                    iconLeft="pi-save"
                    (clicked)="saveLineup()"
                    >Save Lineup</app-button
                  >
                </div>

                <h4>Starting 5</h4>
                <div class="lineup-grid">
                  @for (slot of starterSlots(); track slot.position) {
                    <div class="lineup-slot">
                      <span class="slot-position">{{ slot.position }}</span>
                      <p-select
                        [options]="availablePlayers()"
                        (onChange)="onLineupSlotSelect(slot, $event)"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select Player"
                        class="w-full"
                      ></p-select>
                      @if (slot.note) {
                        <span class="slot-note">{{ slot.note }}</span>
                      }
                    </div>
                  }
                </div>

                <h4>Rotations</h4>
                <div class="lineup-grid">
                  @for (slot of rotationSlots(); track slot.position) {
                    <div class="lineup-slot">
                      <span class="slot-position">{{ slot.position }}</span>
                      <p-select
                        [options]="availablePlayers()"
                        (onChange)="onLineupSlotSelect(slot, $event)"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select Player"
                        class="w-full"
                      ></p-select>
                      @if (slot.note) {
                        <span
                          class="slot-note"
                          [class.warning]="slot.note.includes('Limited')"
                          >{{ slot.note }}</span
                        >
                      }
                    </div>
                  }
                </div>

                <div class="lineup-notes">
                  <h5>💡 Lineup Notes</h5>
                  <textarea
                    pTextarea
                    [value]="lineupNotes"
                    (input)="onLineupNotesInput($event)"
                    rows="3"
                    placeholder="Add lineup notes..."
                  ></textarea>
                </div>
              </div>
            }
            @case ("schedule") {
              <div class="schedule-content">
                @if (
                  selectedTournament()?.games &&
                  selectedTournament()!.games!.length > 0
                ) {
                  @for (day of [1, 2]; track day) {
                    @if (getGamesForDay(day).length > 0) {
                      <h4>Day {{ day }}</h4>
                      <div class="games-list">
                        @for (game of getGamesForDay(day); track game.id) {
                          <div
                            class="game-card"
                            [class.win]="game.result === 'win'"
                            [class.loss]="game.result === 'loss'"
                          >
                            <div class="game-info">
                              <span class="game-type">{{
                                getGameTypeLabel(game.type)
                              }}</span>
                              <span class="game-time"
                                >{{ game.time }}, {{ game.field }}</span
                              >
                            </div>
                            <div class="game-matchup">
                              Panthers vs {{ game.opponent }}
                            </div>
                            <div class="game-result">
                              @if (game.result === "pending") {
                                <span class="pending">Result: Pending</span>
                              } @else {
                                <span
                                  [class.win]="game.result === 'win'"
                                  [class.loss]="game.result === 'loss'"
                                >
                                  Panthers {{ game.ourScore }} -
                                  {{ game.opponent }} {{ game.theirScore }}
                                  @if (game.result === "win") {
                                    ✅ WIN
                                  }
                                  @if (game.result === "loss") {
                                    ❌ LOSS
                                  }
                                </span>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    }
                  }
                  <div class="bracket-link">
                    <app-button variant="secondary" iconLeft="pi-external-link"
                      >View Full Bracket</app-button
                    >
                  </div>
                } @else {
                  <div class="no-schedule">
                    <p>
                      Schedule not yet available. Check back closer to the
                      tournament date.
                    </p>
                  </div>
                }
              </div>
            }
          }
        }
      </app-dialog>
    </app-main-layout>
  `,
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

  onLineupSlotChange(slot: LineupSlot, playerId: string | null | undefined): void {
    slot.playerId = playerId ?? null;
  }

  onLineupSlotSelect(slot: LineupSlot, event: SelectChangeEvent): void {
    this.onLineupSlotChange(
      slot,
      (event.value as string | null | undefined) ?? null,
    );
  }

  onLineupNotesInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement | null;
    this.lineupNotes = input?.value ?? "";
  }

  getGamesForDay(day: number): TournamentGame[] {
    return this.selectedTournament()?.games?.filter((g) => g.day === day) || [];
  }

  private async openTournamentDetail(
    tournament: Tournament,
    tab: "overview" | "rsvps" | "lineup" | "schedule",
  ): Promise<void> {
    this.selectedTournament.set(tournament);
    await this.hydrateLineupState(tournament.id);
    this.detailTab.set(tab);
    this.showDetailDialog = true;
  }

  private async openReminderComposer(
    draft: string,
    toastTitle: string,
  ): Promise<void> {
    this.showDetailDialog = false;
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
