import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AvatarModule } from "primeng/avatar";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { DialogModule } from "primeng/dialog";
import { Select } from "primeng/select";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { getInitials } from "../../utils/format.utils";
import { PlayerWithStats } from "../../../core/models/player.models";

interface StatComparison {
  label: string;
  key: string;
  player1Value: number | string;
  player2Value: number | string;
  winner: "player1" | "player2" | "tie" | null;
  unit?: string;
  higherIsBetter: boolean;
}

@Component({
  selector: "app-player-comparison",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    Select,
    ChartModule,
    AvatarModule,
    TagModule,
    TooltipModule,
    DialogModule,
  ],
  template: `
    <div class="player-comparison">
      <!-- Player Selection -->
      <div class="selection-row">
        <div class="player-select">
          <label>Player 1</label>
          <p-select
            [options]="availablePlayers()"
            [(ngModel)]="selectedPlayer1"
            optionLabel="name"
            optionValue="id"
            placeholder="Select player"
            [filter]="true"
            filterPlaceholder="Search players..."
            (onValueChange)="onPlayerChange()"
            styleClass="w-full"
          >
            <ng-template pTemplate="selectedItem" let-selected>
              @if (selected) {
                <div class="player-option">
                  <p-avatar
                    [label]="getInitialsStr(selected.name)"
                    [image]="selected.avatarUrl"
                    shape="circle"
                    size="normal"
                  ></p-avatar>
                  <span>{{ selected.name }}</span>
                  <p-tag
                    [value]="selected.position"
                    severity="secondary"
                  ></p-tag>
                </div>
              }
            </ng-template>
            <ng-template pTemplate="item" let-player>
              <div class="player-option">
                <p-avatar
                  [label]="getInitialsStr(player.name)"
                  [image]="player.avatarUrl"
                  shape="circle"
                  size="normal"
                ></p-avatar>
                <span>{{ player.name }}</span>
                <p-tag [value]="player.position" severity="secondary"></p-tag>
              </div>
            </ng-template>
          </p-select>
        </div>

        <div class="vs-badge">VS</div>

        <div class="player-select">
          <label>Player 2</label>
          <p-select
            [options]="availablePlayers()"
            [(ngModel)]="selectedPlayer2"
            optionLabel="name"
            optionValue="id"
            placeholder="Select player"
            [filter]="true"
            filterPlaceholder="Search players..."
            (onValueChange)="onPlayerChange()"
            styleClass="w-full"
          >
            <ng-template pTemplate="selectedItem" let-selected>
              @if (selected) {
                <div class="player-option">
                  <p-avatar
                    [label]="getInitialsStr(selected.name)"
                    [image]="selected.avatarUrl"
                    shape="circle"
                    size="normal"
                  ></p-avatar>
                  <span>{{ selected.name }}</span>
                  <p-tag
                    [value]="selected.position"
                    severity="secondary"
                  ></p-tag>
                </div>
              }
            </ng-template>
            <ng-template pTemplate="item" let-player>
              <div class="player-option">
                <p-avatar
                  [label]="getInitialsStr(player.name)"
                  [image]="player.avatarUrl"
                  shape="circle"
                  size="normal"
                ></p-avatar>
                <span>{{ player.name }}</span>
                <p-tag [value]="player.position" severity="secondary"></p-tag>
              </div>
            </ng-template>
          </p-select>
        </div>
      </div>

      @if (player1() && player2()) {
        <!-- Player Headers -->
        <div class="comparison-header">
          <div class="player-header player1">
            <p-avatar
              [label]="getInitialsStr(player1()!.name)"
              [image]="player1()!.avatarUrl"
              shape="circle"
              size="xlarge"
            ></p-avatar>
            <div class="player-info">
              <h3>{{ player1()!.name }}</h3>
              <p-tag [value]="player1()!.position" severity="info"></p-tag>
              @if (player1()!.jerseyNumber) {
                <span class="jersey-number"
                  >#{{ player1()!.jerseyNumber }}</span
                >
              }
            </div>
            <div class="wins-badge">
              <span class="wins-count">{{ player1Wins() }}</span>
              <span class="wins-label">Wins</span>
            </div>
          </div>

          <div class="player-header player2">
            <div class="wins-badge">
              <span class="wins-count">{{ player2Wins() }}</span>
              <span class="wins-label">Wins</span>
            </div>
            <div class="player-info">
              <h3>{{ player2()!.name }}</h3>
              <p-tag [value]="player2()!.position" severity="info"></p-tag>
              @if (player2()!.jerseyNumber) {
                <span class="jersey-number"
                  >#{{ player2()!.jerseyNumber }}</span
                >
              }
            </div>
            <p-avatar
              [label]="getInitialsStr(player2()!.name)"
              [image]="player2()!.avatarUrl"
              shape="circle"
              size="xlarge"
            ></p-avatar>
          </div>
        </div>

        <!-- Radar Chart -->
        <p-card class="chart-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <h4>Performance Overview</h4>
            </div>
          </ng-template>
          <div class="chart-container">
            @if (radarChartData().datasets.length > 0) {
              <p-chart
                type="radar"
                [data]="radarChartData()"
                [options]="radarChartOptions"
              ></p-chart>
            }
          </div>
        </p-card>

        <!-- Stat Comparisons -->
        <div class="stats-comparison">
          @for (category of statCategories; track category.key) {
            <p-card class="category-card">
              <ng-template pTemplate="header">
                <div class="card-header">
                  <i [class]="'pi ' + category.icon"></i>
                  <h4>{{ category.label }}</h4>
                </div>
              </ng-template>
              <div class="stats-list">
                @for (
                  stat of getStatsForCategory(category.key);
                  track stat.key
                ) {
                  <div
                    class="stat-row"
                    [class.winner-player1]="stat.winner === 'player1'"
                    [class.winner-player2]="stat.winner === 'player2'"
                  >
                    <div
                      class="stat-block__value player1"
                      [class.winner]="stat.winner === 'player1'"
                    >
                      <span class="value">{{
                        formatStatValue(stat.player1Value, stat.unit)
                      }}</span>
                      @if (stat.winner === "player1") {
                        <i class="pi pi-crown winner-icon"></i>
                      }
                    </div>
                    <div class="stat-block__label">
                      <span>{{ stat.label }}</span>
                      <div class="comparison-bar">
                        <div
                          class="bar player1-bar"
                          [style.width.%]="getBarWidth(stat, 'player1')"
                        ></div>
                        <div
                          class="bar player2-bar"
                          [style.width.%]="getBarWidth(stat, 'player2')"
                        ></div>
                      </div>
                    </div>
                    <div
                      class="stat-block__value player2"
                      [class.winner]="stat.winner === 'player2'"
                    >
                      @if (stat.winner === "player2") {
                        <i class="pi pi-crown winner-icon"></i>
                      }
                      <span class="value">{{
                        formatStatValue(stat.player2Value, stat.unit)
                      }}</span>
                    </div>
                  </div>
                }
              </div>
            </p-card>
          }
        </div>

        <!-- Summary -->
        <div class="comparison-summary">
          <div class="summary-item">
            <span class="summary-label">Overall Winner</span>
            <span
              class="summary-value"
              [class.player1]="overallWinner() === 'player1'"
              [class.player2]="overallWinner() === 'player2'"
            >
              @if (overallWinner() === "tie") {
                Tie!
              } @else if (overallWinner() === "player1") {
                {{ player1()!.name }}
              } @else {
                {{ player2()!.name }}
              }
            </span>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <i class="pi pi-users"></i>
          <h3>Select Two Players to Compare</h3>
          <p>
            Choose players from the dropdowns above to see a detailed comparison
            of their stats and performance.
          </p>
        </div>
      }
    </div>
  `,
  styleUrl: "./player-comparison.component.scss",
})
export class PlayerComparisonComponent {
  readonly players = input<PlayerWithStats[]>([]);
  readonly initialPlayer1Id = input<string>();
  readonly initialPlayer2Id = input<string>();
  readonly comparisonChanged = output<{
    player1Id: string;
    player2Id: string;
  }>();

  selectedPlayer1: string | null = null;
  selectedPlayer2: string | null = null;

  availablePlayers = signal<PlayerWithStats[]>([]);
  player1 = signal<PlayerWithStats | null>(null);
  player2 = signal<PlayerWithStats | null>(null);

  constructor() {
    // Use effects to react to input changes
    effect(() => {
      this.availablePlayers.set(this.players());
    });

    effect(() => {
      const id = this.initialPlayer1Id();
      if (id) {
        this.selectedPlayer1 = id;
        this.updatePlayer1();
      }
    });

    effect(() => {
      const id = this.initialPlayer2Id();
      if (id) {
        this.selectedPlayer2 = id;
        this.updatePlayer2();
      }
    });
  }

  statCategories = [
    { key: "game", label: "Game Stats", icon: "pi-flag" },
    { key: "training", label: "Training", icon: "pi-bolt" },
    { key: "physical", label: "Physical", icon: "pi-heart" },
  ];

  // Define stats for comparison
  private statDefinitions: Array<{
    key: string;
    label: string;
    category: string;
    unit?: string;
    higherIsBetter: boolean;
  }> = [
    // Game stats
    {
      key: "touchdowns",
      label: "Touchdowns",
      category: "game",
      higherIsBetter: true,
    },
    {
      key: "receptions",
      label: "Receptions",
      category: "game",
      higherIsBetter: true,
    },
    {
      key: "rushingYards",
      label: "Rushing Yards",
      category: "game",
      unit: "yds",
      higherIsBetter: true,
    },
    {
      key: "passingYards",
      label: "Passing Yards",
      category: "game",
      unit: "yds",
      higherIsBetter: true,
    },
    {
      key: "flagPulls",
      label: "Flag Pulls",
      category: "game",
      higherIsBetter: true,
    },
    {
      key: "interceptions",
      label: "Interceptions",
      category: "game",
      higherIsBetter: true,
    },
    {
      key: "completionRate",
      label: "Completion Rate",
      category: "game",
      unit: "%",
      higherIsBetter: true,
    },
    // Training stats
    {
      key: "trainingHours",
      label: "Training Hours",
      category: "training",
      unit: "hrs",
      higherIsBetter: true,
    },
    {
      key: "workoutsCompleted",
      label: "Workouts Completed",
      category: "training",
      higherIsBetter: true,
    },
    {
      key: "attendanceRate",
      label: "Attendance Rate",
      category: "training",
      unit: "%",
      higherIsBetter: true,
    },
    // Physical stats
    {
      key: "speed40yd",
      label: "40-Yard Dash",
      category: "physical",
      unit: "s",
      higherIsBetter: false,
    },
    {
      key: "verticalJump",
      label: "Vertical Jump",
      category: "physical",
      unit: "in",
      higherIsBetter: true,
    },
    {
      key: "agility",
      label: "Agility Score",
      category: "physical",
      higherIsBetter: true,
    },
  ];

  radarChartOptions = {
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  radarChartData = computed(() => {
    const p1 = this.player1();
    const p2 = this.player2();

    if (!p1 || !p2) {
      return { labels: [], datasets: [] };
    }

    const labels = [
      "Touchdowns",
      "Receptions",
      "Flag Pulls",
      "Training",
      "Speed",
      "Agility",
    ];

    return {
      labels,
      datasets: [
        {
          label: p1.name,
          data: [
            this.normalizeValue(p1.touchdowns || 0, 0, 20),
            this.normalizeValue(p1.receptions || 0, 0, 50),
            this.normalizeValue(p1.flagPulls || 0, 0, 30),
            this.normalizeValue(p1.workoutsCompleted || 0, 0, 100),
            this.normalizeValue(p1.speed40yd || 5, 4, 6, true),
            this.normalizeValue(p1.agility || 0, 0, 100),
          ],
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          borderColor: "rgb(59, 130, 246)",
          pointBackgroundColor: "rgb(59, 130, 246)",
        },
        {
          label: p2.name,
          data: [
            this.normalizeValue(p2.touchdowns || 0, 0, 20),
            this.normalizeValue(p2.receptions || 0, 0, 50),
            this.normalizeValue(p2.flagPulls || 0, 0, 30),
            this.normalizeValue(p2.workoutsCompleted || 0, 0, 100),
            this.normalizeValue(p2.speed40yd || 5, 4, 6, true),
            this.normalizeValue(p2.agility || 0, 0, 100),
          ],
          backgroundColor: "rgba(139, 92, 246, 0.2)",
          borderColor: "rgb(139, 92, 246)",
          pointBackgroundColor: "rgb(139, 92, 246)",
        },
      ],
    };
  });

  player1Wins = computed(() => {
    const comparisons = this.getAllComparisons();
    return comparisons.filter((c) => c.winner === "player1").length;
  });

  player2Wins = computed(() => {
    const comparisons = this.getAllComparisons();
    return comparisons.filter((c) => c.winner === "player2").length;
  });

  overallWinner = computed(() => {
    const p1Wins = this.player1Wins();
    const p2Wins = this.player2Wins();

    if (p1Wins > p2Wins) return "player1";
    if (p2Wins > p1Wins) return "player2";
    return "tie";
  });

  onPlayerChange(): void {
    this.updatePlayer1();
    this.updatePlayer2();

    if (this.selectedPlayer1 && this.selectedPlayer2) {
      this.comparisonChanged.emit({
        player1Id: this.selectedPlayer1,
        player2Id: this.selectedPlayer2,
      });
    }
  }

  private updatePlayer1(): void {
    const player = this.players().find((p) => p.id === this.selectedPlayer1);
    this.player1.set(player || null);
  }

  private updatePlayer2(): void {
    const player = this.players().find((p) => p.id === this.selectedPlayer2);
    this.player2.set(player || null);
  }

  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }

  getStatsForCategory(category: string): StatComparison[] {
    const p1 = this.player1();
    const p2 = this.player2();

    if (!p1 || !p2) return [];

    return this.statDefinitions
      .filter((stat) => stat.category === category)
      .map((stat) => {
        const p1Value = this.getStatValue(p1, stat.key);
        const p2Value = this.getStatValue(p2, stat.key);

        return {
          label: stat.label,
          key: stat.key,
          player1Value: p1Value,
          player2Value: p2Value,
          winner: this.determineWinner(p1Value, p2Value, stat.higherIsBetter),
          unit: stat.unit,
          higherIsBetter: stat.higherIsBetter,
        };
      })
      .filter(
        (stat) => stat.player1Value !== null || stat.player2Value !== null,
      );
  }

  private getAllComparisons(): StatComparison[] {
    return this.statCategories.flatMap((cat) =>
      this.getStatsForCategory(cat.key),
    );
  }

  private getStatValue(player: PlayerWithStats, key: string): number | string {
    // Check direct property first
    const playerRecord = player as unknown as Record<string, unknown>;
    if (key in player && playerRecord[key] !== undefined) {
      return playerRecord[key] as number | string;
    }
    // Check stats object
    if (player.stats && key in player.stats) {
      return player.stats[key];
    }
    return 0;
  }

  private determineWinner(
    value1: number | string,
    value2: number | string,
    higherIsBetter: boolean,
  ): "player1" | "player2" | "tie" | null {
    const num1 =
      typeof value1 === "number" ? value1 : parseFloat(value1 as string) || 0;
    const num2 =
      typeof value2 === "number" ? value2 : parseFloat(value2 as string) || 0;

    if (num1 === num2) return "tie";

    if (higherIsBetter) {
      return num1 > num2 ? "player1" : "player2";
    } else {
      return num1 < num2 ? "player1" : "player2";
    }
  }

  formatStatValue(value: number | string, unit?: string): string {
    if (value === null || value === undefined) return "-";
    const formatted =
      typeof value === "number"
        ? value.toFixed(value % 1 === 0 ? 0 : 1)
        : value;
    return unit ? `${formatted}${unit}` : formatted.toString();
  }

  getBarWidth(stat: StatComparison, player: "player1" | "player2"): number {
    const value = player === "player1" ? stat.player1Value : stat.player2Value;
    const otherValue =
      player === "player1" ? stat.player2Value : stat.player1Value;

    const num =
      typeof value === "number" ? value : parseFloat(value as string) || 0;
    const otherNum =
      typeof otherValue === "number"
        ? otherValue
        : parseFloat(otherValue as string) || 0;

    const total = num + otherNum;
    if (total === 0) return 50;

    return (num / total) * 100;
  }

  private normalizeValue(
    value: number,
    min: number,
    max: number,
    inverse = false,
  ): number {
    const normalized = ((value - min) / (max - min)) * 100;
    const clamped = Math.max(0, Math.min(100, normalized));
    return inverse ? 100 - clamped : clamped;
  }
}
