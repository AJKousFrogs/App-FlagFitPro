import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CdkDragDrop, DragDropModule, moveItemInArray } from "@angular/cdk/drag-drop";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";
import { DialogModule } from "primeng/dialog";
import { Select } from "primeng/select";
import { InputTextModule } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import { AvatarModule } from "primeng/avatar";
import { TagModule } from "primeng/tag";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  DepthChartService,
  DepthChartTemplate,
  DepthChartEntry,
  DepthChartWithEntries,
} from "../../core/services/depth-chart.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";
import { LoggerService } from "../../core/services/logger.service";

interface PositionGroup {
  position: string;
  abbreviation: string;
  players: DepthChartEntry[];
}

@Component({
  selector: "app-depth-chart",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    CardModule,
    ButtonModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    DialogModule,
    Select,
    InputTextModule,
    TooltipModule,
    AvatarModule,
    TagModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="depth-chart-page">
        <app-page-header
          title="Depth Chart"
          subtitle="Manage team roster positions"
        >
          <div class="header-actions">
            @if (isCoach()) {
              <p-button
                label="Initialize Charts"
                icon="pi pi-refresh"
                [outlined]="true"
                (onClick)="initializeDepthCharts()"
                [disabled]="depthCharts().length > 0"
              ></p-button>
            }
          </div>
        </app-page-header>

        <div class="depth-chart-content">
          @if (depthCharts().length === 0) {
            <p-card styleClass="empty-card">
              <div class="empty-state">
                <i class="pi pi-sitemap"></i>
                <h3>No Depth Charts</h3>
                <p>Initialize depth charts to start managing your roster positions.</p>
                @if (isCoach()) {
                  <p-button
                    label="Initialize Depth Charts"
                    icon="pi pi-plus"
                    (onClick)="initializeDepthCharts()"
                  ></p-button>
                }
              </div>
            </p-card>
          } @else {
            <p-tabs [(value)]="activeTabIndex" (valueChange)="onTabChange($event)">
              <p-tablist>
                @for (chart of depthCharts(); track chart.id; let i = $index) {
                  <p-tab [value]="i">{{ getChartTypeLabel(chart.chart_type) }}</p-tab>
                }
              </p-tablist>
              <p-tabpanels>
                @for (chart of depthCharts(); track chart.id; let i = $index) {
                  <p-tabpanel [value]="i">
                    <div class="chart-container">
                      @if (activeChart()) {
                        <div class="positions-grid">
                          @for (group of positionGroups(); track group.position) {
                            <div class="position-card">
                              <div class="position-header">
                                <span class="position-abbr">{{ group.abbreviation }}</span>
                                <span class="position-name">{{ group.position }}</span>
                              </div>
                              <div
                                class="players-list"
                                cdkDropList
                                [cdkDropListData]="group.players"
                                (cdkDropListDropped)="onDrop($event, group)"
                              >
                                @for (entry of group.players; track entry.id; let j = $index) {
                                  <div
                                    class="player-slot"
                                    [class.empty]="!entry.player_id"
                                    [class.starter]="j === 0"
                                    cdkDrag
                                    [cdkDragDisabled]="!isCoach()"
                                  >
                                    <div class="depth-indicator">{{ j + 1 }}</div>
                                    @if (entry.player_id) {
                                      <p-avatar
                                        [label]="getInitials(entry.player_name || 'U')"
                                        shape="circle"
                                        size="normal"
                                      ></p-avatar>
                                      <div class="player-info">
                                        <span class="player-name">{{ entry.player_name }}</span>
                                        @if (entry.player_number) {
                                          <span class="player-number">#{{ entry.player_number }}</span>
                                        }
                                      </div>
                                      @if (isCoach()) {
                                        <p-button
                                          icon="pi pi-times"
                                          [text]="true"
                                          [rounded]="true"
                                          size="small"
                                          severity="danger"
                                          pTooltip="Remove player"
                                          (onClick)="removePlayer(entry)"
                                        ></p-button>
                                      }
                                    } @else {
                                      <div class="empty-slot" (click)="openAssignDialog(entry)">
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
                                  <p-button
                                    label="Add Backup"
                                    icon="pi pi-plus"
                                    [text]="true"
                                    size="small"
                                    styleClass="add-backup-btn"
                                    (onClick)="addBackupSlot(group)"
                                  ></p-button>
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
              <p-card styleClass="unassigned-card">
                <ng-template pTemplate="header">
                  <div class="card-header">
                    <h3>Unassigned Players</h3>
                    <p-tag [value]="unassignedPlayers().length + ' players'" severity="warn"></p-tag>
                  </div>
                </ng-template>
                <div class="unassigned-list">
                  @for (player of unassignedPlayers(); track player.id) {
                    <div class="unassigned-player">
                      <p-avatar
                        [label]="getInitials(player.name || 'U')"
                        shape="circle"
                      ></p-avatar>
                      <span>{{ player.name }}</span>
                    </div>
                  }
                </div>
              </p-card>
            }
          }
        </div>

        <!-- Assign Player Dialog -->
        <p-dialog
          header="Assign Player"
          [(visible)]="showAssignDialog"
          [modal]="true"
          [style]="{ width: '400px' }"
        >
          <div class="assign-dialog">
            <p class="assign-info">
              Assign a player to <strong>{{ selectedEntry()?.position_name }}</strong>
              (Depth {{ (selectedEntry()?.depth_order || 0) }})
            </p>
            <p-select
              [options]="availablePlayersForAssign()"
              [(ngModel)]="selectedPlayerId"
              optionLabel="name"
              optionValue="id"
              placeholder="Select a player"
              [filter]="true"
              filterBy="name"
              [style]="{ width: '100%' }"
            ></p-select>
          </div>
          <ng-template pTemplate="footer">
            <p-button
              label="Cancel"
              [text]="true"
              (onClick)="showAssignDialog = false"
            ></p-button>
            <p-button
              label="Assign"
              icon="pi pi-check"
              (onClick)="assignPlayer()"
              [disabled]="!selectedPlayerId"
            ></p-button>
          </ng-template>
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .depth-chart-page {
        padding: var(--space-6);
      }

      .header-actions {
        display: flex;
        gap: var(--space-3);
      }

      .depth-chart-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        text-align: center;

        i {
          font-size: 4rem;
          color: var(--text-color-secondary);
          margin-bottom: var(--space-4);
        }

        h3 {
          margin: 0 0 var(--space-2) 0;
        }

        p {
          color: var(--text-color-secondary);
          margin-bottom: var(--space-4);
        }
      }

      .chart-container {
        padding: var(--space-4) 0;
      }

      .positions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--space-4);
      }

      .position-card {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: var(--border-radius);
        overflow: hidden;
      }

      .position-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        background: var(--surface-100);
        border-bottom: 1px solid var(--surface-border);
      }

      .position-abbr {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: var(--primary-color);
        color: white;
        border-radius: var(--border-radius);
        font-weight: 700;
        font-size: 0.875rem;
      }

      .position-name {
        font-weight: 600;
      }

      .players-list {
        padding: var(--space-3);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        min-height: 80px;
      }

      .player-slot {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        background: var(--surface-50);
        border-radius: var(--border-radius);
        border: 1px solid var(--surface-border);
        cursor: grab;
        transition: all 0.2s;

        &:hover {
          border-color: var(--primary-color);
        }

        &.starter {
          background: var(--primary-50);
          border-color: var(--primary-200);
        }

        &.empty {
          cursor: pointer;
          border-style: dashed;
        }

        &.cdk-drag-preview {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &.cdk-drag-placeholder {
          opacity: 0.5;
        }
      }

      .depth-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: var(--surface-200);
        border-radius: 50%;
        font-size: 0.75rem;
        font-weight: 600;
        flex-shrink: 0;
      }

      .player-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .player-name {
        font-weight: 500;
      }

      .player-number {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
      }

      .empty-slot {
        flex: 1;
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--text-color-secondary);

        i {
          font-size: 1.25rem;
        }
      }

      .drag-handle {
        cursor: grab;
        color: var(--text-color-secondary);
        padding: var(--space-2);

        &:hover {
          color: var(--text-color);
        }
      }

      .add-backup-btn {
        width: 100%;
        justify-content: center;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        border-bottom: 1px solid var(--surface-border);

        h3 {
          margin: 0;
        }
      }

      .unassigned-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
        padding: var(--space-4);
      }

      .unassigned-player {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--surface-100);
        border-radius: var(--border-radius);
      }

      .assign-dialog {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .assign-info {
        margin: 0;
        color: var(--text-color-secondary);
      }
    `,
  ],
})
export class DepthChartComponent implements OnInit {
  private depthChartService = inject(DepthChartService);
  private authService = inject(AuthService);
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
      groups.get(key)!.players.push(entry);
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
      chart.entries.filter((e) => e.player_id).map((e) => e.player_id)
    );

    // Return unassigned players
    return this.unassignedPlayers().filter((p) => !assignedIds.has(p.id));
  });

  ngOnInit(): void {
    this.loadDepthCharts();
  }

  isCoach(): boolean {
    const user = this.authService.getUser();
    return user?.user_metadata?.role === "coach" || user?.user_metadata?.role === "admin";
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
        error: () => this.toastService.error("Failed to load depth charts"),
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
        error: () => this.toastService.error("Failed to load depth chart details"),
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
    const numIndex = typeof index === 'string' ? parseInt(index, 10) : index;
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

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

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
          this.toastService.success("Depth charts initialized successfully");
        },
        error: () => this.toastService.error("Failed to initialize depth charts"),
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

  assignPlayer(): void {
    const entry = this.selectedEntry();
    if (!entry || !this.selectedPlayerId) return;

    this.depthChartService
      .updateEntry(entry.id, { player_id: this.selectedPlayerId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success("Player assigned successfully");
          this.showAssignDialog = false;
          // Reload chart to get updated data
          const chart = this.activeChart();
          if (chart) {
            this.loadChartDetails(chart.id);
          }
        },
        error: () => this.toastService.error("Failed to assign player"),
      });
  }

  removePlayer(entry: DepthChartEntry): void {
    if (!this.isCoach()) return;

    this.depthChartService
      .updateEntry(entry.id, { player_id: null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success("Player removed from position");
          const chart = this.activeChart();
          if (chart) {
            this.loadChartDetails(chart.id);
          }
        },
        error: () => this.toastService.error("Failed to remove player"),
      });
  }

  addBackupSlot(group: PositionGroup): void {
    const chart = this.activeChart();
    if (!chart || !this.isCoach()) return;

    const newDepthOrder = group.players.length + 1;

    this.depthChartService
      .addPosition(chart.id, group.position, group.abbreviation)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entry) => {
          if (entry) {
            this.loadChartDetails(chart.id);
          }
        },
        error: () => this.toastService.error("Failed to add backup slot"),
      });
  }
}
