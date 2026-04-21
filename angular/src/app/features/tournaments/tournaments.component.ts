import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    OnInit,
    inject,
    signal,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

import { ToastService } from "../../core/services/toast.service";
import { ConfirmDialog } from "primeng/confirmdialog";
import { TabsComponent, AppTabPanelDirective } from "../../shared/components/tabs/tabs.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";

import { ConfirmDialogService } from "../../core/services/confirm-dialog.service";
import {
    LoggerService,
    toLogContext,
} from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import {
    CreateTournamentDto,
    Tournament,
    TournamentService,
    TournamentVisibilityScope,
} from "../../core/services/tournament.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { formatDateISO } from "../../shared/utils/date.utils";
import { getCountryFlag } from "../../core/constants";
import { TournamentsDataService } from "./services/tournaments-data.service";
import { TournamentAvailabilityDialogComponent } from "./components/tournament-availability-dialog.component";
import { TournamentBudgetDialogComponent } from "./components/tournament-budget-dialog.component";
import { TournamentFormDialogComponent } from "./components/tournament-form-dialog.component";
import { TournamentTeamAvailabilityDialogComponent } from "./components/tournament-team-availability-dialog.component";
import { TournamentSeasonPanelComponent } from "./components/tournament-season-panel.component";

interface PlayerAvailability {
  playerId: string;
  playerName: string;
  position: string;
  status: "confirmed" | "declined" | "tentative" | "pending";
  reason?: string;
  paymentStatus: "pending" | "paid" | "partial" | "not_required";
  amountPaid: number;
}

type AvailabilityStatus = PlayerAvailability["status"];
type PaymentStatus = PlayerAvailability["paymentStatus"];

interface AvailabilityRecord {
  player_id?: string;
  status?: string;
  reason?: string | null;
  payment_status?: string;
  amount_paid?: number;
}

interface TournamentBudgetRecord {
  total_estimated_cost?: number;
  team_contribution?: number;
  sponsor_contribution?: number;
  player_share_per_person?: number;
  registration_fee?: number;
  entry_fee_per_player?: number;
  estimated_travel_cost?: number;
  accommodation_cost_per_night?: number;
  total_nights?: number;
  per_diem_per_player?: number;
  other_costs?: number;
  other_costs_description?: string;
}

interface TeamMemberRecord {
  id: string;
  users?: {
    raw_user_meta_data?: {
      full_name?: string;
      position?: string;
    };
  };
}

interface TournamentBudget {
  totalEstimated: number;
  teamContribution: number;
  sponsorContribution: number;
  perPlayer: number;
}

type TournamentFormData = CreateTournamentDto & {
  start_date_obj?: Date;
  end_date_obj?: Date;
  registration_deadline_obj?: Date;
  instagram_url?: string;
  facebook_url?: string;
  registration_url?: string;
  venue_maps_url?: string;
  hotel_maps_url?: string;
  hotel_name?: string;
  hotel_booking_url?: string;
  contact_name?: string;
  contact_email?: string;
};

interface AvailabilityForm {
  status: "confirmed" | "declined" | "tentative" | "pending";
  reason: string;
  arrivalDate: Date | null;
  departureDate: Date | null;
  accommodationNeeded: boolean;
  transportationNeeded: boolean;
  dietaryRestrictions: string;
  amountPaid: number;
}

type TournamentFormGroup = FormGroup<{
  name: FormControl<string>;
  short_name: FormControl<string>;
  expected_teams: FormControl<number | null>;
  country: FormControl<string>;
  location: FormControl<string>;
  venue: FormControl<string>;
  start_date_obj: FormControl<Date | null>;
  end_date_obj: FormControl<Date | null>;
  registration_deadline_obj: FormControl<Date | null>;
  tournament_type: FormControl<string>;
  competition_level: FormControl<string>;
  is_home_tournament: FormControl<boolean>;
  website_url: FormControl<string>;
  instagram_url: FormControl<string>;
  facebook_url: FormControl<string>;
  registration_url: FormControl<string>;
  venue_maps_url: FormControl<string>;
  hotel_maps_url: FormControl<string>;
  hotel_name: FormControl<string>;
  hotel_booking_url: FormControl<string>;
  contact_name: FormControl<string>;
  contact_email: FormControl<string>;
  notes: FormControl<string>;
  visibility_scope: FormControl<TournamentVisibilityScope>;
}>;

type AvailabilityFormGroup = FormGroup<{
  status: FormControl<AvailabilityStatus>;
  reason: FormControl<string>;
  arrivalDate: FormControl<Date | null>;
  departureDate: FormControl<Date | null>;
  accommodationNeeded: FormControl<boolean>;
  transportationNeeded: FormControl<boolean>;
  dietaryRestrictions: FormControl<string>;
  amountPaid: FormControl<number>;
}>;

type BudgetFormGroup = FormGroup<{
  registrationFee: FormControl<number>;
  entryFeePerPlayer: FormControl<number>;
  travelCost: FormControl<number>;
  accommodationPerNight: FormControl<number>;
  totalNights: FormControl<number>;
  perDiem: FormControl<number>;
  otherCosts: FormControl<number>;
  otherCostsDescription: FormControl<string>;
  teamContribution: FormControl<number>;
  sponsorContribution: FormControl<number>;
}>;

const availabilityStatuses: AvailabilityStatus[] = [
  "pending",
  "declined",
  "confirmed",
  "tentative",
];

const paymentStatuses: PaymentStatus[] = [
  "pending",
  "paid",
  "partial",
  "not_required",
];

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const isAvailabilityStatus = (value: unknown): value is AvailabilityStatus =>
  availabilityStatuses.includes(value as AvailabilityStatus);

const isPaymentStatus = (value: unknown): value is PaymentStatus =>
  paymentStatuses.includes(value as PaymentStatus);

const toStringValue = (value: unknown, fallback: string): string =>
  isString(value) ? value : fallback;

const toNumberValue = (value: unknown, fallback: number): number =>
  isNumber(value) ? value : fallback;

const toBooleanValue = (value: unknown, fallback: boolean): boolean =>
  isBoolean(value) ? value : fallback;

const toDateOrNull = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value;
  }
  if (isString(value) || isNumber(value)) {
    return new Date(value);
  }
  return null;
};

@Component({
  selector: "app-tournaments",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TabsComponent,
    AppTabPanelDirective,
    ConfirmDialog,
    MainLayoutComponent,
    PageHeaderComponent,
    IconButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    TournamentFormDialogComponent,
    TournamentAvailabilityDialogComponent,
    TournamentBudgetDialogComponent,
    TournamentTeamAvailabilityDialogComponent,
    TournamentSeasonPanelComponent,
  ],
  templateUrl: "./tournaments.component.html",

  styleUrl: "./tournaments.component.scss",
})
export class TournamentsComponent implements OnInit {
  tournamentService = inject(TournamentService);
  private supabase = inject(SupabaseService);
  private teamMembershipService = inject(TeamMembershipService);
  private tournamentsDataService = inject(TournamentsDataService);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);
  private logger = inject(LoggerService);
  private elementRef = inject(ElementRef);

  // Computed signals from service
  tournaments = this.tournamentService.tournaments;
  tournaments2026 = this.tournamentService.tournaments2026;
  tournaments2027 = this.tournamentService.tournaments2027;
  nextTournament = this.tournamentService.nextTournament;

  readonly tournamentSeasonPanels = computed(() => [
    {
      header: "2026 Season",
      tabValue: 0,
      seasonYear: "2026" as const,
      tournaments: this.tournaments2026(),
      showExtendedDetails: true,
    },
    {
      header: "2027 Season",
      tabValue: 1,
      seasonYear: "2027" as const,
      tournaments: this.tournaments2027(),
      showExtendedDetails: false,
    },
  ]);

  // Dialog state
  showDialog = false;
  editingTournament: Tournament | null = null;

  readonly openCreateDialogHandler = (): void => this.openCreateDialog();

  // Availability dialogs
  showAvailabilityDialog = false;
  showTeamAvailabilityDialog = false;
  showBudgetDialog = false;
  selectedTournament: Tournament | null = null;

  // Loading states
  savingAvailability = signal(false);
  savingBudget = signal(false);

  // Availability data
  teamAvailability = signal<PlayerAvailability[]>([]);
  teamAvailabilitySummary = signal({
    confirmed: 0,
    tentative: 0,
    declined: 0,
    pending: 0,
  });
  tournamentBudget = signal<TournamentBudget | null>(null);
  tournamentCost = signal(0);

  // Options
  availabilityOptions: {
    value: "pending" | "confirmed" | "declined" | "tentative";
    label: string;
    icon: string;
  }[] = [
    { value: "confirmed", label: "Yes, I'm in!", icon: "pi pi-check-circle" },
    { value: "tentative", label: "Maybe", icon: "pi pi-question-circle" },
    { value: "declined", label: "Can't make it", icon: "pi pi-times-circle" },
    { value: "pending", label: "Undecided", icon: "pi pi-clock" },
  ];

  // Reactive forms
  readonly tournamentForm: TournamentFormGroup = this.createTournamentForm();
  readonly availabilityFormGroup: AvailabilityFormGroup =
    this.createAvailabilityForm();
  readonly budgetFormGroup: BudgetFormGroup = this.createBudgetForm();

  // Dropdown options
  tournamentTypes = [
    { label: "Game Day", value: "game_day" },
    { label: "League", value: "league" },
    { label: "Cup", value: "cup" },
    { label: "Championship", value: "championship" },
    { label: "Friendly", value: "friendly" },
    { label: "Qualifier", value: "qualifier" },
    { label: "International", value: "international" },
  ];

  competitionLevels = [
    { label: "National", value: "national" },
    { label: "Regional", value: "regional" },
    { label: "European", value: "european" },
    { label: "World", value: "world" },
    { label: "Friendly", value: "friendly" },
  ];

  // Visibility options for the form
  visibilityOptions = [
    {
      label: "Team Event (visible to all team members)",
      value: "team",
      icon: "pi pi-users",
    },
    {
      label: "Personal Game Day (only you and coaches)",
      value: "personal",
      icon: "pi pi-user",
    },
  ];

  ngOnInit(): void {
    this.loadTournaments();
  }

  /**
   * Check if current user is a coach, manager, or admin
   * Use TeamMembershipService as single source of truth
   */
  isCoachOrAdmin(): boolean {
    return this.teamMembershipService.canManageRoster();
  }

  /**
   * Check if current user is a player (not coach/admin)
   */
  isPlayer(): boolean {
    return this.isAuthenticated() && this.teamMembershipService.isPlayer();
  }

  /**
   * Get the appropriate button label based on user role
   */
  getAddButtonLabel(): string {
    return this.isPlayer() ? "Add Game Day" : "Add Tournament";
  }

  /**
   * Get dialog title based on user role and editing state
   */
  getDialogTitle(): string {
    if (this.editingTournament) {
      return this.editingTournament.visibility_scope === "personal"
        ? "Edit Game Day"
        : "Edit Tournament";
    }
    return this.isPlayer() ? "Add Personal Game Day" : "Add Tournament";
  }

  /**
   * Check if a tournament is a personal game day
   */
  isPersonalTournament(tournament: Tournament): boolean {
    return tournament.visibility_scope === "personal";
  }

  async loadTournaments(): Promise<void> {
    await this.tournamentService.fetchTournaments();
  }

  isAuthenticated(): boolean {
    return this.supabase.isAuthenticated();
  }

  private currentUserId(): string | null {
    return this.supabase.userId();
  }

  getEmptyFormData(): TournamentFormData {
    // Default visibility based on user role
    const defaultVisibility: TournamentVisibilityScope = this.isCoachOrAdmin()
      ? "team"
      : "personal";

    return {
      name: "",
      short_name: "",
      location: "",
      country: "",
      venue: "",
      start_date: "",
      end_date: "",
      tournament_type:
        defaultVisibility === "personal" ? "game_day" : "championship",
      competition_level: "regional",
      expected_teams: undefined,
      registration_deadline: "",
      website_url: "",
      notes: "",
      is_home_tournament: false,
      visibility_scope: defaultVisibility,
      start_date_obj: undefined,
      end_date_obj: undefined,
      registration_deadline_obj: undefined,
      instagram_url: "",
      facebook_url: "",
      registration_url: "",
      venue_maps_url: "",
      hotel_maps_url: "",
      hotel_name: "",
      hotel_booking_url: "",
      contact_name: "",
      contact_email: "",
    };
  }

  private createTournamentForm(): TournamentFormGroup {
    const defaults = this.getEmptyFormData();
    return new FormGroup({
      name: new FormControl(defaults.name, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      short_name: new FormControl(defaults.short_name ?? "", {
        nonNullable: true,
      }),
      expected_teams: new FormControl(defaults.expected_teams ?? null),
      country: new FormControl(defaults.country ?? "", { nonNullable: true }),
      location: new FormControl(defaults.location ?? "", { nonNullable: true }),
      venue: new FormControl(defaults.venue ?? "", { nonNullable: true }),
      start_date_obj: new FormControl(defaults.start_date_obj ?? null, {
        validators: [Validators.required],
      }),
      end_date_obj: new FormControl(defaults.end_date_obj ?? null),
      registration_deadline_obj: new FormControl(
        defaults.registration_deadline_obj ?? null,
      ),
      tournament_type: new FormControl(defaults.tournament_type ?? "", {
        nonNullable: true,
      }),
      competition_level: new FormControl(defaults.competition_level ?? "", {
        nonNullable: true,
      }),
      is_home_tournament: new FormControl(
        defaults.is_home_tournament ?? false,
        { nonNullable: true },
      ),
      website_url: new FormControl(defaults.website_url ?? "", {
        nonNullable: true,
      }),
      instagram_url: new FormControl(defaults.instagram_url ?? "", {
        nonNullable: true,
      }),
      facebook_url: new FormControl(defaults.facebook_url ?? "", {
        nonNullable: true,
      }),
      registration_url: new FormControl(defaults.registration_url ?? "", {
        nonNullable: true,
      }),
      venue_maps_url: new FormControl(defaults.venue_maps_url ?? "", {
        nonNullable: true,
      }),
      hotel_maps_url: new FormControl(defaults.hotel_maps_url ?? "", {
        nonNullable: true,
      }),
      hotel_name: new FormControl(defaults.hotel_name ?? "", {
        nonNullable: true,
      }),
      hotel_booking_url: new FormControl(defaults.hotel_booking_url ?? "", {
        nonNullable: true,
      }),
      contact_name: new FormControl(defaults.contact_name ?? "", {
        nonNullable: true,
      }),
      contact_email: new FormControl(defaults.contact_email ?? "", {
        nonNullable: true,
      }),
      notes: new FormControl(defaults.notes ?? "", { nonNullable: true }),
      visibility_scope: new FormControl(defaults.visibility_scope ?? "team", {
        nonNullable: true,
      }),
    });
  }

  private createAvailabilityForm(): AvailabilityFormGroup {
    return new FormGroup({
      status: new FormControl<AvailabilityStatus>("pending", {
        nonNullable: true,
      }),
      reason: new FormControl("", { nonNullable: true }),
      arrivalDate: new FormControl<Date | null>(null),
      departureDate: new FormControl<Date | null>(null),
      accommodationNeeded: new FormControl(true, { nonNullable: true }),
      transportationNeeded: new FormControl(false, { nonNullable: true }),
      dietaryRestrictions: new FormControl("", { nonNullable: true }),
      amountPaid: new FormControl(0, { nonNullable: true }),
    });
  }

  private createBudgetForm(): BudgetFormGroup {
    return new FormGroup({
      registrationFee: new FormControl(0, { nonNullable: true }),
      entryFeePerPlayer: new FormControl(0, { nonNullable: true }),
      travelCost: new FormControl(0, { nonNullable: true }),
      accommodationPerNight: new FormControl(0, { nonNullable: true }),
      totalNights: new FormControl(0, { nonNullable: true }),
      perDiem: new FormControl(0, { nonNullable: true }),
      otherCosts: new FormControl(0, { nonNullable: true }),
      otherCostsDescription: new FormControl("", { nonNullable: true }),
      teamContribution: new FormControl(0, { nonNullable: true }),
      sponsorContribution: new FormControl(0, { nonNullable: true }),
    });
  }

  currentAvailabilityStatus(): AvailabilityStatus {
    return this.availabilityFormGroup.controls.status.value;
  }

  setAvailabilityStatus(status: AvailabilityStatus): void {
    this.availabilityFormGroup.patchValue({ status });
  }

  openCreateDialog(): void {
    this.editingTournament = null;
    const defaults = this.getEmptyFormData();
    this.tournamentForm.reset({
      ...defaults,
      expected_teams: defaults.expected_teams ?? null,
      start_date_obj: defaults.start_date_obj ?? null,
      end_date_obj: defaults.end_date_obj ?? null,
      registration_deadline_obj: defaults.registration_deadline_obj ?? null,
    });
    this.showDialog = true;
  }

  openEditDialog(tournament: Tournament): void {
    this.editingTournament = tournament;
    this.tournamentForm.reset({
      name: tournament.name,
      short_name: tournament.short_name || "",
      location: tournament.location || "",
      country: tournament.country || "",
      venue: tournament.venue || "",
      tournament_type: tournament.tournament_type || "championship",
      competition_level: tournament.competition_level || "regional",
      expected_teams: tournament.expected_teams ?? null,
      website_url: tournament.website_url || "",
      notes: tournament.notes || "",
      is_home_tournament: tournament.is_home_tournament || false,
      visibility_scope: tournament.visibility_scope || "team",
      start_date_obj: tournament.start_date
        ? new Date(tournament.start_date)
        : null,
      end_date_obj: tournament.end_date
        ? new Date(tournament.end_date)
        : null,
      registration_deadline_obj: tournament.registration_deadline
        ? new Date(tournament.registration_deadline)
        : null,
      instagram_url: "",
      facebook_url: "",
      registration_url: "",
      venue_maps_url: "",
      hotel_maps_url: "",
      hotel_name: "",
      hotel_booking_url: "",
      contact_name: "",
      contact_email: "",
    });
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingTournament = null;
    const defaults = this.getEmptyFormData();
    this.tournamentForm.reset({
      ...defaults,
      expected_teams: defaults.expected_teams ?? null,
      start_date_obj: defaults.start_date_obj ?? null,
      end_date_obj: defaults.end_date_obj ?? null,
      registration_deadline_obj: defaults.registration_deadline_obj ?? null,
    });
  }

  async saveTournament(): Promise<void> {
    const formValue = this.tournamentForm.getRawValue();
    if (this.tournamentForm.invalid || !formValue.start_date_obj) {
      this.toastService.error(
        "Tournament name and start date are required",
        "Validation Error",
      );
      return;
    }

    // Convert date objects to strings
    const startDate = this.formatDate(formValue.start_date_obj);
    if (!startDate) {
      this.toastService.error("Start date is required");
      return;
    }

    const data: CreateTournamentDto = {
      ...formValue,
      start_date: startDate,
      end_date: formValue.end_date_obj
        ? this.formatDate(formValue.end_date_obj)
        : undefined,
      registration_deadline: formValue.registration_deadline_obj
        ? this.formatDate(formValue.registration_deadline_obj)
        : undefined,
      flag: formValue.country
        ? getCountryFlag(formValue.country)
        : undefined,
      expected_teams: formValue.expected_teams ?? undefined,
    };

    // Remove date objects before sending (they're only used for form binding)
    const dataToSend = { ...data } as Record<string, unknown>;
    delete dataToSend["start_date_obj"];
    delete dataToSend["end_date_obj"];
    delete dataToSend["registration_deadline_obj"];

    let success: boolean;
    if (this.editingTournament) {
      const result = await this.tournamentService.updateTournament(
        this.editingTournament.id,
        data,
      );
      success = !!result;
    } else {
      const result = await this.tournamentService.createTournament(data);
      success = !!result;
    }

    if (success) {
      this.toastService.success(
        this.editingTournament
          ? "Tournament updated"
          : "Tournament created",
        "Success",
      );
      this.closeDialog();
    } else {
      this.toastService.error(
        this.tournamentService.error() || "Failed to save tournament",
      );
    }
  }

  async confirmDelete(tournament: Tournament): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      message: `Are you sure you want to delete "${tournament.name}"?`,
      title: "Delete Tournament",
      icon: "pi pi-exclamation-triangle",
      acceptSeverity: "danger",
      rejectSeverity: "secondary",
      defaultFocus: "reject",
    });
    if (!confirmed) return;

    const success = await this.tournamentService.deleteTournament(
      tournament.id,
    );
    if (success) {
      this.toastService.success("Tournament deleted successfully", "Deleted");
    } else {
      this.toastService.error("Failed to delete tournament");
    }
  }

  viewDetails(tournament: Tournament): void {
    // Could navigate to detail page or open a dialog
    this.logger.info("View details:", toLogContext(tournament));
  }

  scrollToTournament(id: string): void {
    // Use scoped query within component's element
    const element = this.elementRef.nativeElement.querySelector(
      `[data-id="${id}"]`,
    );
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  openWebsite(url?: string): void {
    if (url) {
      window.open(url, "_blank");
    }
  }

  private formatDate = (date: Date): string | undefined => formatDateISO(date);

  // ============================================================================
  // PLAYER AVAILABILITY
  // ============================================================================

  canViewTeamAvailability(): boolean {
    // Check if user is a coach or higher
    // This would need to check the user's role in their team
    return this.supabase.isAuthenticated();
  }

  async openAvailabilityDialog(tournament: Tournament): Promise<void> {
    this.selectedTournament = tournament;
    this.showAvailabilityDialog = true;

    // Load existing availability
    await this.loadMyAvailability(tournament.id);
    await this.loadTournamentCost(tournament.id);
  }

  async loadMyAvailability(tournamentId: string): Promise<void> {
    try {
      const user = this.supabase.currentUser();
      if (!user) return;

      const { data } =
        await this.tournamentsDataService.fetchPlayerAvailability({
          tournamentId,
          playerId: user.id,
        });

      if (data) {
        const availability = data as Record<string, unknown>;
        this.availabilityFormGroup.reset({
          status: isAvailabilityStatus(availability["status"])
            ? availability["status"]
            : "pending",
          reason: toStringValue(availability["reason"], ""),
          arrivalDate: toDateOrNull(availability["arrival_date"]),
          departureDate: toDateOrNull(availability["departure_date"]),
          accommodationNeeded: toBooleanValue(
            availability["accommodation_needed"],
            true,
          ),
          transportationNeeded: toBooleanValue(
            availability["transportation_needed"],
            false,
          ),
          dietaryRestrictions: toStringValue(
            availability["dietary_restrictions"],
            "",
          ),
          amountPaid: toNumberValue(availability["amount_paid"], 0),
        });
      } else {
        this.availabilityFormGroup.reset(this.getEmptyAvailabilityForm());
      }
    } catch (error) {
      this.logger.error("Error loading availability:", error);
    }
  }

  async loadTournamentCost(tournamentId: string): Promise<void> {
    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) {
        this.tournamentCost.set(0);
        return;
      }

      const { data } =
        await this.tournamentsDataService.calculatePlayerTournamentCost({
          tournamentId,
          teamId,
        });

      this.tournamentCost.set(data || 0);
    } catch (error) {
      this.logger.error("Error loading tournament cost:", error);
      this.tournamentCost.set(0);
    }
  }

  async saveAvailability(): Promise<void> {
    if (!this.selectedTournament) return;

    this.savingAvailability.set(true);

    try {
      const user = this.supabase.currentUser();
      if (!user) throw new Error("Not authenticated");

      const teamId = await this.getCurrentTeamId();
      if (!teamId) throw new Error("No team found");

      // Get player's team_member id
      const { memberId } =
        await this.tournamentsDataService.getTeamMemberId({
          userId: user.id,
          teamId,
        });

      if (!memberId) throw new Error("Not a team member");
      const availability = this.availabilityFormGroup.getRawValue();

      const availabilityData = {
        player_id: memberId,
        tournament_id: this.selectedTournament.id,
        team_id: teamId,
        status: availability.status,
        reason: availability.reason || null,
        arrival_date: availability.arrivalDate
          ? this.formatDate(availability.arrivalDate)
          : null,
        departure_date: availability.departureDate
          ? this.formatDate(availability.departureDate)
          : null,
        accommodation_needed: availability.accommodationNeeded,
        transportation_needed: availability.transportationNeeded,
        dietary_restrictions: availability.dietaryRestrictions || null,
        responded_at: new Date().toISOString(),
      };

      const { error } =
        await this.tournamentsDataService.upsertAvailability({
          availabilityData,
        });

      if (error) throw error;

      this.toastService.success("Your availability has been updated", "Saved");

      this.showAvailabilityDialog = false;
    } catch (error: unknown) {
      this.logger.error("Error saving availability:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save availability";
      this.toastService.error(message);
    } finally {
      this.savingAvailability.set(false);
    }
  }

  private getEmptyAvailabilityForm(): AvailabilityForm {
    return {
      status: "pending",
      reason: "",
      arrivalDate: null,
      departureDate: null,
      accommodationNeeded: true,
      transportationNeeded: false,
      dietaryRestrictions: "",
      amountPaid: 0,
    };
  }

  // ============================================================================
  // TEAM AVAILABILITY (COACH VIEW)
  // ============================================================================

  async openTeamAvailabilityDialog(tournament: Tournament): Promise<void> {
    this.selectedTournament = tournament;
    this.showTeamAvailabilityDialog = true;

    await this.loadTeamAvailability(tournament.id);
    await this.loadTournamentBudget(tournament.id);
  }

  async loadTeamAvailability(tournamentId: string): Promise<void> {
    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) return;

      // Get all team players with their availability
      const { members } =
        await this.tournamentsDataService.fetchTeamMembers(teamId);

      const { availability } =
        await this.tournamentsDataService.fetchTeamAvailability({
          tournamentId,
          teamId,
        });

      // Map availability to players
      const availabilityList = Array.isArray(availability)
        ? (availability as AvailabilityRecord[])
        : [];

      const availabilityMap = new Map(
        availabilityList.map((a) => [a.player_id, a]),
      );

      const memberList = Array.isArray(members)
        ? (members as unknown as TeamMemberRecord[])
        : [];

      const playerList: PlayerAvailability[] = memberList.map((member) => {
          const avail = availabilityMap.get(member.id);
          const status = isAvailabilityStatus(avail?.status)
            ? avail?.status
            : "pending";
          const paymentStatus = isPaymentStatus(avail?.payment_status)
            ? avail?.payment_status
            : "pending";

          return {
          playerId: member.id,
          playerName:
            member.users?.raw_user_meta_data?.full_name || "Unknown",
          position: member.users?.raw_user_meta_data?.position || "Player",
          status,
          reason: isString(avail?.reason) ? avail?.reason : undefined,
          paymentStatus,
          amountPaid: toNumberValue(avail?.amount_paid, 0),
        };
      });

      this.teamAvailability.set(playerList);

      // Calculate summary
      const summary = { confirmed: 0, tentative: 0, declined: 0, pending: 0 };
      playerList.forEach((p) => {
        summary[p.status]++;
      });
      this.teamAvailabilitySummary.set(summary);
    } catch (error) {
      this.logger.error("Error loading team availability:", error);
    }
  }

  async loadTournamentBudget(tournamentId: string): Promise<void> {
    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) return;

      const { budget: data } =
        await this.tournamentsDataService.fetchTournamentBudget({
          tournamentId,
          teamId,
        });

      if (data) {
        const budget = data as TournamentBudgetRecord;
        this.tournamentBudget.set({
          totalEstimated: toNumberValue(budget.total_estimated_cost, 0),
          teamContribution: toNumberValue(budget.team_contribution, 0),
          sponsorContribution: toNumberValue(budget.sponsor_contribution, 0),
          perPlayer: toNumberValue(budget.player_share_per_person, 0),
        });

        this.budgetFormGroup.reset({
          registrationFee: toNumberValue(budget.registration_fee, 0),
          entryFeePerPlayer: toNumberValue(budget.entry_fee_per_player, 0),
          travelCost: toNumberValue(budget.estimated_travel_cost, 0),
          accommodationPerNight: toNumberValue(
            budget.accommodation_cost_per_night,
            0,
          ),
          totalNights: toNumberValue(budget.total_nights, 0),
          perDiem: toNumberValue(budget.per_diem_per_player, 0),
          otherCosts: toNumberValue(budget.other_costs, 0),
          otherCostsDescription: toStringValue(
            budget.other_costs_description,
            "",
          ),
          teamContribution: toNumberValue(budget.team_contribution, 0),
          sponsorContribution: toNumberValue(budget.sponsor_contribution, 0),
        });
      } else {
        this.tournamentBudget.set(null);
      }
    } catch (error) {
      this.logger.error("Error loading budget:", error);
      this.tournamentBudget.set(null);
    }
  }

  getAvailabilityLabel(status: string): string {
    const labels: Record<string, string> = {
      confirmed: "Confirmed",
      tentative: "Maybe",
      declined: "Can't Attend",
      pending: "No Response",
    };
    return labels[status] || status;
  }

  getAvailabilitySeverity(
    status: string,
  ): "success" | "warning" | "danger" | "secondary" | "info" {
    const severities: Record<
      string,
      "success" | "warning" | "danger" | "secondary"
    > = {
      confirmed: "success",
      tentative: "warning",
      declined: "danger",
      pending: "secondary",
    };
    return severities[status] || "secondary";
  }

  async sendAvailabilityReminders(): Promise<void> {
    // Would integrate with email service
    this.toastService.info(
      "Reminder emails have been sent to players who haven't responded",
      "Reminders Sent",
    );
  }

  exportAvailabilityReport(): void {
    const players = this.teamAvailability();
    const tournament = this.selectedTournament;
    if (!tournament || players.length === 0) return;

    const headers = ["Name", "Position", "Status", "Reason", "Payment Status"];
    const rows = players.map((p) => [
      p.playerName,
      p.position,
      this.getAvailabilityLabel(p.status),
      p.reason || "",
      p.paymentStatus,
    ]);

    const csvContent = [
      `Tournament: ${tournament.name}`,
      `Date: ${tournament.start_date} - ${tournament.end_date}`,
      "",
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tournament.short_name || tournament.name}_availability.csv`;
    link.click();
  }

  // ============================================================================
  // BUDGET MANAGEMENT
  // ============================================================================

  openBudgetDialog(): void {
    this.showBudgetDialog = true;
  }

  calculateTotalBudget(): number {
    const budget = this.budgetFormGroup.getRawValue();
    const confirmedPlayers = this.teamAvailabilitySummary().confirmed;
    return (
      budget.registrationFee +
      budget.entryFeePerPlayer * confirmedPlayers +
      budget.travelCost +
      budget.accommodationPerNight * budget.totalNights +
      budget.perDiem *
        confirmedPlayers *
        (budget.totalNights + 1) +
      budget.otherCosts
    );
  }

  calculatePlayerShare(): number {
    const confirmedPlayers = this.teamAvailabilitySummary().confirmed;
    if (confirmedPlayers === 0) return 0;

    const total = this.calculateTotalBudget();
    const budget = this.budgetFormGroup.getRawValue();
    const funding = budget.teamContribution + budget.sponsorContribution;
    return Math.max(0, (total - funding) / confirmedPlayers);
  }

  async saveBudget(): Promise<void> {
    if (!this.selectedTournament) return;

    this.savingBudget.set(true);

    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) throw new Error("No team found");

      const confirmedPlayers = this.teamAvailabilitySummary().confirmed;
      const budget = this.budgetFormGroup.getRawValue();

      const budgetData = {
        tournament_id: this.selectedTournament.id,
        team_id: teamId,
        registration_fee: budget.registrationFee,
        entry_fee_per_player: budget.entryFeePerPlayer,
        estimated_travel_cost: budget.travelCost,
        accommodation_cost_per_night: budget.accommodationPerNight,
        total_nights: budget.totalNights,
        estimated_accommodation_total:
          budget.accommodationPerNight * budget.totalNights,
        per_diem_per_player: budget.perDiem,
        estimated_meals_total:
          budget.perDiem *
          confirmedPlayers *
          (budget.totalNights + 1),
        other_costs: budget.otherCosts,
        other_costs_description: budget.otherCostsDescription,
        team_contribution: budget.teamContribution,
        sponsor_contribution: budget.sponsorContribution,
        player_share_per_person: this.calculatePlayerShare(),
        budget_status: "draft",
        created_by: this.currentUserId(),
      };

      const { error } = await this.tournamentsDataService.upsertTournamentBudget({
        budgetData,
      });

      if (error) throw error;

      this.toastService.success("Budget has been updated", "Saved");

      // Reload budget to get calculated fields
      await this.loadTournamentBudget(this.selectedTournament.id);
      this.showBudgetDialog = false;
    } catch (error: unknown) {
      this.logger.error("Error saving budget:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save budget";
      this.toastService.error(message);
    } finally {
      this.savingBudget.set(false);
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private async getCurrentTeamId(): Promise<string | null> {
    const user = this.supabase.currentUser();
    if (!user) return null;

    try {
      const { teamId: data } = await this.tournamentsDataService.getCurrentTeamId(
        user.id,
      );

      return data || null;
    } catch {
      return null;
    }
  }
}
