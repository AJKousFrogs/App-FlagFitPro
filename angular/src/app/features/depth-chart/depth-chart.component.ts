import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Avatar } from "primeng/avatar";

import { Select } from "primeng/select";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { AuthService } from "../../core/services/auth.service";
import {
  DepthChartEntry,
  DepthChartService,
  DepthChartTemplate,
  DepthChartWithEntries,
} from "../../core/services/depth-chart.service";
import { LoggerService } from "../../core/services/logger.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { ToastService } from "../../core/services/toast.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { getInitials } from "../../shared/utils/format.utils";

interface PositionGroup {
  position: string;
  abbreviation: string;
  players: DepthChartEntry[];
}

@Component({
  selector: "app-depth-chart",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DragDropModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Select,
    Avatar,
    StatusTagComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardShellComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    IconButtonComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-main-layout>
      <div class="depth-chart-page ui-page-stack">
        <app-page-header
          title="Depth Chart"
          subtitle="Manage team roster positions"
        >
          <div class="header-actions">
            @if (isCoach()) {
              <app-button
                iconLeft="pi-refresh"
                (clicked)="initializeDepthCharts()"
                [disabled]="depthCharts().length > 0"
                >Initialize Charts</app-button
              >
            }
          </div>
        </app-page-header>

        <div class="depth-chart-content ui-page-stack">
          @if (depthCharts().length === 0) {
            <app-card-shell class="empty-card">
              <app-empty-state
                icon="pi-sitemap"
                heading="No Depth Charts"
                description="Initialize depth charts to start managing your roster positions."
                [actionLabel]="isCoach() ? 'Initialize Depth Charts' : null"
                [actionHandler]="isCoach() ? initializeDepthChartsHandler : null"
              />
            </app-card-shell>
          } @else {
            <p-tabs
              [(value)]="activeTabIndex"
              (valueChange)="onTabChange($event)"
            >
              <p-tablist>
                @for (chart of depthCharts(); track chart.id; let i = $index) {
                  <p-tab [value]="i">{{
                    getChartTypeLabel(chart.chart_type)
                  }}</p-tab>
                }
              </p-tablist>
              <p-tabpanels>
                @for (chart of depthCharts(); track chart.id; let i = $index) {
                  <p-tabpanel [value]="i">
                    <div class="chart-container">
                      @if (activeChart()) {
                        <div class="positions-grid">
                          @for (
                            group of positionGroups();
                            track group.position
                          ) {
                            <div class="position-card">
                              <div class="position-header">
                                <span class="position-abbr">{{
                                  group.abbreviation
                                }}</span>
                                <span class="position-name">{{
                                  group.position
                                }}</span>
                              </div>
                              <div
                                class="players-list"
                                cdkDropList
                                [cdkDropListData]="group.players"
                                (cdkDropListDropped)="onDrop($event, group)"
                              >
                                @for (
                                  entry of group.players;
                                  track entry.id;
                                  let j = $index
                                ) {
                                  <div
                                    class="player-slot"
                                    [class.empty]="!entry.player_id"
                                    [class.starter]="j === 0"
                                    cdkDrag
                                    [cdkDragDisabled]="!isCoach()"
                                  >
                                    <div class="depth-indicator">
                                      {{ j + 1 }}
                                    </div>
                                    @if (entry.player_id) {
                                      <p-avatar
                                        [label]="
                                          getInitialsStr(
                                            entry.player_name || 'U'
                                          )
                                        "
                                        shape="circle"
                                        size="normal"
                                      ></p-avatar>
                                      <div class="player-info">
                                        <span class="player-name">{{
                                          entry.player_name
                                        }}</span>
                                        @if (entry.player_number) {
                                          <span class="player-number"
                                            >#{{ entry.player_number }}</span
                                          >
                                        }
                                      </div>
                                      @if (isCoach()) {
                                        <app-icon-button
                                          icon="pi-times"
                                          variant="text"
                                          size="sm"
                                          (clicked)="removePlayer(entry)"
                                          ariaLabel="Remove player from position"
                                          tooltip="Remove"
                                        />
                                      }
                                    } @else {
                                      <div
                                        class="empty-slot"
                                        (click)="openAssignDialog(entry)"
                                      >
                                        <i class="pi pi-user-plus"></i>
                                        <span>Assign Player</span>
                                      </div>
                                    }
                                    <div class="drag-handle" cdkDragHandle>
                                      <i class="pi pi-bars"></i>
                                    </div>
                                  </div>
                                }
                                @if (isCoach()) {
                                  <app-button
                                    variant="text"
                                    size="sm"
                                    iconLeft="pi-plus"
                                    (clicked)="addBackupSlot(group)"
                                    >Add Backup</app-button
                                  >
                                }
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </p-tabpanel>
                }
              </p-tabpanels>
            </p-tabs>

            <!-- Unassigned Players -->
            @if (isCoach() && unassignedPlayers().length > 0) {
              <app-card-shell class="unassigned-card" title="Unassigned Players">
                <app-status-tag
                  header-actions
                  [value]="unassignedPlayers().length + ' players'"
                  severity="warning"
                  size="sm"
                />
                <div class="unassigned-list">
                  @for (player of unassignedPlayers(); track player.id) {
                    <div class="unassigned-player">
                      <p-avatar
                        [label]="getInitialsStr(player.name || 'U')"
                        shape="circle"
                      ></p-avatar>
                      <span>{{ player.name }}</span>
                    </div>
                  }
                </div>
              </app-card-shell>
            }
          }
        </div>

        <!-- Assign Player Dialog -->
        <app-dialog
          [(visible)]="showAssignDialog"
          [modal]="true"
          [closable]="false"
          [draggable]="false"
          [resizable]="false"
          [dismissableMask]="true"
          [styleClass]="'dialog-max-w-sm'"
        >
          <app-dialog-header
            icon="users"
            title="Assign Player"
            subtitle="Add an unassigned player to the selected depth slot"
            (close)="showAssignDialog = false"
          />
          <div class="assign-dialog">
            <p class="assign-info">
              Assign a player to
              <strong>{{ selectedEntry()?.position_name }}</strong> (Depth
              {{ selectedEntry()?.depth_order || 0 }})
            </p>
            <p-select
              [options]="availablePlayersForAssign()"
              (onChange)="onSelectedPlayerChange({ value: $event.value })"
              optionLabel="name"
              optionValue="id"
              placeholder="Select a player"
              [filter]="true"
              filterBy="name"
              class="w-full"
            ></p-select>
          </div>
          <div class="dialog-actions">
            <app-button variant="text" (clicked)="showAssignDialog = false"
              >Cancel</app-button
            >
            <app-button
              iconLeft="pi-check"
              [disabled]="!selectedPlayerId"
              (clicked)="assignPlayer()"
              >Assign</app-button
            >
          </div>
        </app-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./depth-chart.component.scss",
})
export class DepthChartComponent implements OnInit {
  private depthChartService = inject(DepthChartService);
  private authService = inject(AuthService);
  private teamMembershipService = inject(TeamMembershipService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);

  // State
  depthCharts = signal<DepthChartTemplate[]>([]);
  activeChart = signal<DepthChartWithEntries | null>(null);
  unassignedPlayers = signal<Array<{ id: string; name: string }>>([]);
  selectedEntry = signal<DepthChartEntry | null>(null);

  // UI State
  activeTabIndex = 0;
  showAssignDialog = false;
  selectedPlayerId: string | null = null;

  // Computed
  positionGroups = computed(() => {
    const chart = this.activeChart();
    if (!chart) return [];

    const groups = new Map<string, PositionGroup>();

    for (const entry of chart.entries) {
      const key = entry.position_name;
      if (!groups.has(key)) {
        groups.set(key, {
          position: entry.position_name,
          abbreviation: entry.position_abbreviation,
          players: [],
        });
      }
      const group = groups.get(key);
      if (group) {
        group.players.push(entry);
      }
    }

    // Sort players by depth order
    for (const group of groups.values()) {
      group.players.sort((a, b) => a.depth_order - b.depth_order);
    }

    return Array.from(groups.values());
  });

  availablePlayersForAssign = computed(() => {
    const chart = this.activeChart();
    if (!chart) return this.unassignedPlayers();

    // Get all assigned player IDs in this chart
    const assignedIds = new Set(
      chart.entries.filter((e) => e.player_id).map((e) => e.player_id),
    );

    // Return unassigned players
    return this.unassignedPlayers().filter((p) => !assignedIds.has(p.id));
  });

  ngOnInit(): void {
    this.loadDepthCharts();
  }

  /**
   * Check if user is a coach - uses TeamMembershipService as single source of truth
   */
  isCoach(): boolean {
    return this.teamMembershipService.canManageRoster();
  }

  loadDepthCharts(): void {
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
    if (!teamId) return;

    this.depthChartService
      .getTeamDepthCharts(teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (charts) => {
          this.depthCharts.set(charts);
          if (charts.length > 0) {
            this.loadChartDetails(charts[0].id);
          }
        },
        error: () =>
          this.toastService.error(TOAST.ERROR.DEPTH_CHART_LOAD_FAILED),
      });
  }

  loadChartDetails(chartId: string): void {
    this.depthChartService
      .getDepthChartWithEntries(chartId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (chart) => {
          this.activeChart.set(chart);
          if (chart) {
            this.loadUnassignedPlayers(chart.id);
          }
        },
        error: () =>
          this.toastService.error(TOAST.ERROR.DEPTH_CHART_DETAILS_FAILED),
      });
  }

  loadUnassignedPlayers(templateId: string): void {
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
    if (!teamId) return;

    this.depthChartService
      .getUnassignedPlayers(teamId, templateId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (players) => this.unassignedPlayers.set(players),
        error: () => this.logger.error("Failed to load unassigned players"),
      });
  }

  onTabChange(index: string | number | undefined): void {
    if (index === undefined) return;
    const numIndex = typeof index === "string" ? parseInt(index, 10) : index;
    const charts = this.depthCharts();
    if (charts[numIndex]) {
      this.loadChartDetails(charts[numIndex].id);
    }
  }

  getChartTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      offense: "Offense",
      defense: "Defense",
      special_teams: "Special Teams",
    };
    return labels[type] || type;
  }

  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }

  readonly initializeDepthChartsHandler = (): void =>
    this.initializeDepthCharts();

  initializeDepthCharts(): void {
    const teamId = this.authService.getUser()?.user_metadata?.team_id;
    if (!teamId) return;

    this.depthChartService
      .initializeTeamDepthCharts(teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (charts) => {
          this.depthCharts.set(charts);
          if (charts.length > 0) {
            this.loadChartDetails(charts[0].id);
          }
          this.toastService.success(TOAST.SUCCESS.DEPTH_CHART_INITIALIZED);
        },
        error: () =>
          this.toastService.error(TOAST.ERROR.DEPTH_CHART_INIT_FAILED),
      });
  }

  onDrop(event: CdkDragDrop<DepthChartEntry[]>, group: PositionGroup): void {
    if (!this.isCoach()) return;

    moveItemInArray(group.players, event.previousIndex, event.currentIndex);

    // Update depth orders
    group.players.forEach((entry, index) => {
      if (entry.depth_order !== index + 1) {
        this.depthChartService
          .updateEntry(entry.id, { depth_order: index + 1 })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      }
    });
  }

  openAssignDialog(entry: DepthChartEntry): void {
    if (!this.isCoach()) return;
    this.selectedEntry.set(entry);
    this.selectedPlayerId = null;
    this.showAssignDialog = true;
  }

  onSelectedPlayerChange(event: { value: string | null }): void {
    this.selectedPlayerId = event.value;
  }

  assignPlayer(): void {
    const entry = this.selectedEntry();
    if (!entry || !this.selectedPlayerId) return;

    this.depthChartService
      .updateEntry(entry.id, { player_id: this.selectedPlayerId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(TOAST.SUCCESS.PLAYER_ASSIGNED);
          this.showAssignDialog = false;
          // Reload chart to get updated data
          const chart = this.activeChart();
          if (chart) {
            this.loadChartDetails(chart.id);
          }
        },
        error: () => this.toastService.error(TOAST.ERROR.PLAYER_ASSIGN_FAILED),
      });
  }

  removePlayer(entry: DepthChartEntry): void {
    if (!this.isCoach()) return;

    this.depthChartService
      .updateEntry(entry.id, { player_id: null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(TOAST.SUCCESS.PLAYER_REMOVED);
          const chart = this.activeChart();
          if (chart) {
            this.loadChartDetails(chart.id);
          }
        },
        error: () => this.toastService.error(TOAST.ERROR.PLAYER_REMOVE_FAILED),
      });
  }

  addBackupSlot(group: PositionGroup): void {
    const chart = this.activeChart();
    if (!chart || !this.isCoach()) return;

    const _newDepthOrder = group.players.length + 1; // Available for future position ordering

    this.depthChartService
      .addPosition(chart.id, group.position, group.abbreviation)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entry) => {
          if (entry) {
            this.loadChartDetails(chart.id);
          }
        },
        error: () =>
          this.toastService.error(TOAST.ERROR.BACKUP_SLOT_ADD_FAILED),
      });
  }
}
