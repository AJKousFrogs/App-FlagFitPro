/**
 * Roster Component (Refactored)
 *
 * ⭐ CANONICAL PAGE — Design System Exemplar (Pending Cleanup)
 * ============================================================
 * This page is marked as canonical but requires cleanup before freeze.
 *
 * RULES:
 * - Future refactors copy FROM this page, never INTO it
 * - Changes require design system curator approval
 * - Must be cleaned to full compliance before canonical freeze
 *
 * See docs/CANONICAL_PAGES.md for full documentation.
 *
 * CLEANUP REQUIRED:
 * - Remove PrimeNG overrides from component SCSS
 * - Replace raw colors with tokens
 *
 * Container component that orchestrates roster sub-components
 *
 * Refactored from 3,360 lines to ~800 lines by extracting:
 * - RosterService: Data operations and state management
 * - RosterPlayerCardComponent: Player card display
 * - RosterStaffCardComponent: Staff card display
 * - RosterOverviewComponent: Team stats overview
 * - RosterFiltersComponent: Search and filters
 * - RosterPlayerFormDialogComponent: Add/Edit player form
 * - roster.models.ts: Shared interfaces
 * - roster-utils.ts: Helper functions
 */
import { DatePipe, DecimalPipe, TitleCasePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";

import { ConfirmDialog } from "primeng/confirmdialog";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { ConfirmDialogService } from "../../core/services/confirm-dialog.service";

import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../shared/components/ui-components";

import {
  PlayerFormData,
  RosterFiltersComponent,
  RosterPlayerFormDialogComponent,
  RosterOverviewComponent,
  RosterPlayerCardComponent,
  RosterStaffCardComponent,
} from "./components";
import { RosterStatusOptionsComponent } from "./components/roster-status-options.component";
import { getPositionDisplayName } from "../../core/constants";
import { getCountryFlag } from "../../core/constants";
import {
  formatHeight,
  formatWeight,
  getJerseyColor,
  getPlayerStats,
  getPositionIcon,
} from "./roster-utils";
import {
  getMappedStatusSeverity,
  rosterStatusSeverityMap,
} from "../../shared/utils/status.utils";
import {
  Player,
  PlayerRiskLevel,
  PlayerStatus,
  PositionGroup,
} from "./roster.models";
import { RosterService } from "./roster.service";
import {
  PlayerMetricsService,
  PlayerWithMetrics,
  RiskAssessment,
} from "./services/player-metrics.service";
import {
  TeamMembershipService,
  TeamRole,
} from "../../core/services/team-membership.service";

@Component({
  selector: "app-roster",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StatusTagComponent,
    ConfirmDialog,
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    MainLayoutComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    PageErrorStateComponent,
    AppLoadingComponent,
    RosterPlayerCardComponent,
    RosterStaffCardComponent,
    RosterOverviewComponent,
    RosterFiltersComponent,
    RosterPlayerFormDialogComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    ButtonComponent,
    RosterStatusOptionsComponent,
  ],
  templateUrl: "./roster.component.html",

  styleUrl: "./roster.component.scss",
})
export class RosterComponent implements OnInit {
  readonly rosterViews = ["all", "invites", "staff", "players"] as const;

  // Services
  readonly rosterService = inject(RosterService);
  private readonly metricsService = inject(PlayerMetricsService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private toastService = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  // Page state
  isPageLoading = signal(true);
  hasPageError = signal(false);
  isSaving = signal(false);

  // Dialog visibility
  showPlayerDialog = signal(false);
  showDetailsDialog = signal(false);
  showStatusDialog = signal(false);
  showBulkStatusDialog = signal(false);

  // Player editing
  editingPlayer = signal<Player | null>(null);
  selectedPlayer = signal<Player | null>(null);
  statusChangePlayer = signal<Player | null>(null);
  newStatus = signal<PlayerStatus>("active");
  bulkStatus = signal<PlayerStatus>("active");

  // Selection
  selectedPlayerIds = signal<Set<string>>(new Set());

  // Filters
  searchQuery = signal("");
  positionFilter: string | null = null;
  statusFilter: string | null = null;
  activeRosterView = signal<(typeof this.rosterViews)[number]>("all");

  // Options
  // Expose utility functions
  getPositionDisplayName = getPositionDisplayName;
  getPositionIcon = getPositionIcon;
  getJerseyColor = getJerseyColor;
  getStatusSeverity = (status: string) =>
    getMappedStatusSeverity(status, rosterStatusSeverityMap, "secondary");
  getPlayerStats = getPlayerStats;
  formatHeight = formatHeight;
  formatWeight = formatWeight;
  getCountryFlag = getCountryFlag;

  /**
   * Get display name for a role (for template use)
   */
  getRoleDisplayName(role: string): string {
    return this.teamMembershipService.getRoleDisplayName(role as TeamRole);
  }

  // Phase 1: Enriched player computed signals
  enrichedSelectedPlayer = computed<PlayerWithMetrics | null>(() => {
    const player = this.selectedPlayer();
    if (!player) return null;
    return this.metricsService.enrichPlayer(player);
  });

  trainingPriorities = computed<string[]>(() => {
    const player = this.selectedPlayer();
    if (!player) return [];
    return this.metricsService.getTrainingPriorities(player);
  });

  riskAssessment = computed<RiskAssessment | null>(() => {
    const player = this.selectedPlayer();
    if (!player) return null;
    return this.metricsService.getRiskAssessment(player);
  });

  // Computed
  headerSubtitle = computed(() => {
    const stats = this.rosterService.teamStats();
    if (stats.length === 0) return "Manage your team";
    const countryStat = stats.find((s) => s.label === "Countries");
    return `Manage your team • ${countryStat?.value || 0} countries represented`;
  });

  readonly hasStaffSection = computed(
    () => this.rosterService.coachingStaff().length > 0,
  );
  readonly hasInvitationSection = computed(
    () =>
      this.rosterService.canManageRoster() &&
      this.rosterService.pendingInvitations().length > 0,
  );
  readonly showInvitationSection = computed(
    () =>
      this.hasInvitationSection() &&
      (this.activeRosterView() === "all" ||
        this.activeRosterView() === "invites"),
  );
  readonly showStaffSection = computed(
    () =>
      this.hasStaffSection() &&
      (this.activeRosterView() === "all" || this.activeRosterView() === "staff"),
  );
  readonly showPlayersSection = computed(
    () =>
      this.activeRosterView() === "all" ||
      this.activeRosterView() === "players",
  );

  filteredPlayers = computed(() => {
    let players = this.rosterService.allPlayers();

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      players = players.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.position.toLowerCase().includes(query) ||
          p.country.toLowerCase().includes(query),
      );
    }

    if (this.positionFilter) {
      players = players.filter((p) => p.position === this.positionFilter);
    }

    if (this.statusFilter) {
      players = players.filter((p) => p.status === this.statusFilter);
    }

    return players;
  });

  filteredPlayersByPosition = computed<PositionGroup[]>(() => {
    const players = this.filteredPlayers();
    const positionMap = new Map<string, Player[]>();

    players.forEach((player) => {
      const positionName = getPositionDisplayName(player.position);
      if (!positionMap.has(positionName)) {
        positionMap.set(positionName, []);
      }
      const positionPlayers = positionMap.get(positionName);
      if (positionPlayers) {
        positionPlayers.push(player);
      }
    });

    return Array.from(positionMap.entries()).map(([position, players]) => ({
      position,
      players,
    }));
  });

  // Phase 1: Helper methods for details dialog styling
  getReadinessClass(readiness: number): string {
    if (readiness >= 75) return "readiness-high";
    if (readiness >= 55) return "readiness-medium";
    return "readiness-low";
  }

  getACWRClass(acwr: number): string {
    if (acwr >= 0.8 && acwr <= 1.3) return "acwr-safe";
    if (acwr > 1.3 && acwr <= 1.5) return "acwr-elevated";
    if (acwr > 1.5) return "acwr-danger";
    if (acwr < 0.8) return "acwr-low";
    return "acwr-safe";
  }

  getPerformanceClass(score: number): string {
    if (score >= 80) return "perf-excellent";
    if (score >= 60) return "perf-good";
    if (score >= 40) return "perf-average";
    return "perf-poor";
  }

  getRiskSeverity(
    level: PlayerRiskLevel,
  ): "success" | "info" | "warning" | "danger" {
    switch (level) {
      case "low":
        return "success";
      case "moderate":
        return "warning";
      case "high":
        return "warning";
      case "critical":
        return "danger";
      default:
        return "info";
    }
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParamMap) => {
        this.applyRouteState(queryParamMap);
      });

    this.initializePage();
  }

  private async initializePage(): Promise<void> {
    this.isPageLoading.set(true);
    this.hasPageError.set(false);

    await this.rosterService.loadRosterData();
    if (this.rosterService.canManageRoster()) {
      await this.rosterService.loadPendingInvitations();
    }

    if (this.rosterService.error()) {
      this.hasPageError.set(true);
    }

    this.applyRouteState(this.route.snapshot.queryParamMap);
    this.isPageLoading.set(false);
  }

  private applyRouteState(queryParamMap: ParamMap): void {
    const playerId = queryParamMap.get("player");
    const routeFilter = queryParamMap.get("filter");
    const routeSection = queryParamMap.get("section");

    if (this.isPlayerStatus(routeFilter)) {
      this.statusFilter = routeFilter;
    }

    if (this.isRosterView(routeSection)) {
      this.activeRosterView.set(routeSection);
    } else {
      this.activeRosterView.set("all");
    }

    if (!playerId) {
      this.showDetailsDialog.set(false);
      this.selectedPlayer.set(null);
      return;
    }

    const player = this.rosterService
      .allPlayers()
      .find((candidate) => candidate.id === playerId);

    if (!player) {
      return;
    }

    this.selectedPlayer.set(player);
    this.showDetailsDialog.set(true);
  }

  private isPlayerStatus(value: string | null): value is PlayerStatus {
    return (
      value === "active" ||
      value === "injured" ||
      value === "inactive" ||
      value === "limited" ||
      value === "returning"
    );
  }

  private isRosterView(
    value: string | null,
  ): value is (typeof this.rosterViews)[number] {
    return (
      value === "all" ||
      value === "invites" ||
      value === "staff" ||
      value === "players"
    );
  }

  retryLoad(): void {
    this.initializePage();
  }

  setRosterView(view: (typeof this.rosterViews)[number]): void {
    this.activeRosterView.set(view);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        section: view === "all" ? null : view,
      },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  // Player CRUD
  openAddPlayer(): void {
    this.editingPlayer.set(null);
    this.showPlayerDialog.set(true);
  }

  editPlayer(player: Player): void {
    this.editingPlayer.set(player);
    this.showPlayerDialog.set(true);
  }

  async savePlayer(formData: PlayerFormData): Promise<void> {
    // Validate jersey number
    const excludeId = this.editingPlayer()?.id;
    if (this.rosterService.isJerseyNumberTaken(formData.jersey, excludeId)) {
      this.toastService.error(
        `Jersey number ${formData.jersey} is already taken`,
      );
      return;
    }

    const editingPlayer = this.editingPlayer();
    await this.runRosterMutation({
      request: () =>
        editingPlayer
          ? this.rosterService.updatePlayer(
              editingPlayer.id,
              formData as Partial<Player>,
            )
          : this.rosterService.addPlayer(formData as Partial<Player>),
      successMessage: editingPlayer
        ? TOAST.SUCCESS.PLAYER_UPDATED
        : TOAST.SUCCESS.PLAYER_ADDED,
      errorMessage: TOAST.ERROR.PLAYER_SAVE_FAILED,
      onSuccess: () => this.closePlayerDialog(),
    });
  }

  async confirmRemovePlayer(player: Player): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      message: `Are you sure you want to remove ${player.name} from the team?`,
      title: "Confirm Removal",
      icon: "pi pi-exclamation-triangle",
      acceptSeverity: "danger",
      rejectSeverity: "secondary",
      defaultFocus: "reject",
    });
    if (!confirmed) return;

    const result = await this.rosterService.removePlayer(player.id);
    if (result.success) {
      this.toastService.success(`${player.name} has been removed`);
    } else {
      this.toastService.error(result.error || TOAST.ERROR.PLAYER_REMOVE_FAILED);
    }
  }

  // Player details
  viewPlayerDetails(player: Player): void {
    this.selectedPlayer.set(player);
    this.showDetailsDialog.set(true);
  }

  editPlayerFromDetails(): void {
    const player = this.selectedPlayer();
    if (player) {
      this.showDetailsDialog.set(false);
      this.editPlayer(player);
    }
  }

  openPlayerDevelopment(): void {
    const player = this.selectedPlayer();
    if (!player) {
      return;
    }

    this.showDetailsDialog.set(false);
    void this.router.navigate(["/coach/analytics"], {
      queryParams: { player: player.id },
    });
  }

  openTeamWorkspace(): void {
    void this.router.navigate(["/team/workspace"]);
  }

  // Status management
  openStatusDialog(player: Player): void {
    this.statusChangePlayer.set(player);
    this.newStatus.set(player.status);
    this.showStatusDialog.set(true);
  }

  async updatePlayerStatus(): Promise<void> {
    const player = this.statusChangePlayer();
    if (!player) return;

    await this.runRosterMutation({
      request: () =>
        this.rosterService.updatePlayerStatus(player.id, this.newStatus()),
      successMessage: `${player.name}'s status updated`,
      errorMessage: TOAST.ERROR.STATUS_UPDATE_FAILED,
      onSuccess: () => this.closeStatusDialog(),
    });
  }

  // Bulk operations
  togglePlayerSelection(playerId: string): void {
    const current = this.selectedPlayerIds();
    const newSet = new Set(current);

    if (newSet.has(playerId)) {
      newSet.delete(playerId);
    } else {
      newSet.add(playerId);
    }

    this.selectedPlayerIds.set(newSet);
  }

  isPlayerSelected(playerId: string): boolean {
    return this.selectedPlayerIds().has(playerId);
  }

  clearSelection(): void {
    this.selectedPlayerIds.set(new Set());
  }

  scrollToSection(
    sectionId: "invites-section" | "staff-section" | "players-section",
  ): void {
    const rosterContainer = this.elementRef.nativeElement;
    const section = rosterContainer.querySelector(`#${sectionId}`) as
      | HTMLElement
      | null;

    if (!section) {
      return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async resendInvitation(invitationId: string, email: string): Promise<void> {
    await this.runRosterMutation({
      request: () => this.rosterService.resendInvitation(invitationId),
      successMessage: `Invitation resent to ${email}`,
      errorMessage: "Failed to resend invitation",
    });
  }

  async cancelInvitation(invitationId: string, email: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      message: `Cancel the invitation for ${email}?`,
      title: "Cancel Invitation",
      icon: "pi pi-exclamation-triangle",
      acceptSeverity: "danger",
      rejectSeverity: "secondary",
      defaultFocus: "reject",
    });
    if (!confirmed) {
      return;
    }

    await this.runRosterMutation({
      request: () => this.rosterService.cancelInvitation(invitationId),
      successMessage: `Invitation cancelled for ${email}`,
      errorMessage: "Failed to cancel invitation",
    });
  }

  openBulkStatusDialog(): void {
    this.bulkStatus.set("active");
    this.showBulkStatusDialog.set(true);
  }

  async updateBulkStatus(): Promise<void> {
    const ids = Array.from(this.selectedPlayerIds());
    if (ids.length === 0) return;

    await this.runRosterMutation({
      request: () => this.rosterService.bulkUpdateStatus(ids, this.bulkStatus()),
      successMessage: `Updated status for ${ids.length} players`,
      errorMessage: TOAST.ERROR.STATUS_UPDATE_FAILED,
      onSuccess: () => {
        this.closeBulkStatusDialog();
        this.clearSelection();
      },
    });
  }

  async confirmBulkRemove(): Promise<void> {
    const count = this.selectedPlayerIds().size;
    const confirmed = await this.confirmDialog.confirm({
      message: `Are you sure you want to remove ${count} player(s)?`,
      title: "Confirm Bulk Removal",
      icon: "pi pi-exclamation-triangle",
      acceptSeverity: "danger",
      rejectSeverity: "secondary",
      defaultFocus: "reject",
    });
    if (!confirmed) return;

    const ids = Array.from(this.selectedPlayerIds());
    const result = await this.rosterService.bulkRemovePlayers(ids);

    if (result.success) {
      this.toastService.success(`Removed ${count} players`);
      this.clearSelection();
    } else {
      this.toastService.error(
        result.error || TOAST.ERROR.PLAYERS_REMOVE_FAILED,
      );
    }
  }

  // Filters
  clearFilters(): void {
    this.searchQuery.set("");
    this.positionFilter = null;
    this.statusFilter = null;
  }

  // Export
  exportRoster(): void {
    const csv = this.rosterService.exportRosterToCsv();
    if (!csv) {
      this.toastService.warn(TOAST.WARN.NO_PLAYERS_TO_EXPORT);
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `roster_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastService.success(TOAST.SUCCESS.ROSTER_EXPORTED);
  }

  closePlayerDialog(): void {
    this.showPlayerDialog.set(false);
    this.editingPlayer.set(null);
  }

  closeStatusDialog(): void {
    this.showStatusDialog.set(false);
    this.statusChangePlayer.set(null);
  }

  closeBulkStatusDialog(): void {
    this.showBulkStatusDialog.set(false);
  }

  private async runRosterMutation({
    request,
    successMessage,
    errorMessage,
    onSuccess,
  }: {
    request: () => Promise<{ success: boolean; error?: string }>;
    successMessage: string;
    errorMessage: string;
    onSuccess?: () => void;
  }): Promise<void> {
    this.isSaving.set(true);

    try {
      const result = await request();
      if (result.success) {
        this.toastService.success(successMessage);
        onSuccess?.();
      } else {
        this.toastService.error(result.error || errorMessage);
      }
    } finally {
      this.isSaving.set(false);
    }
  }

}
