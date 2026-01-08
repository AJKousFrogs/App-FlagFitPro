import { CommonModule } from "@angular/common";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { SharedInsightFeedService } from "../../../core/services/shared-insight-feed.service";
import { ToastService } from "../../../core/services/toast.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

// Interfaces based on FEATURE_DOCUMENTATION.md §30
interface AthleteNutritionData {
  id: string;
  name: string;
  position: string;
  age: number;
  currentWeight: number;
  targetWeight?: number;
  bodyFatPercentage?: number;
  bmr?: number;
  bodyWaterPercentage?: number;
}

interface BodyCompositionData {
  athleteId: string;
  weightHistory: { date: string; weight: number }[];
  bodyFatHistory: { date: string; percentage: number }[];
  muscleMassHistory: { date: string; mass: number }[];
  alerts: string[];
}

interface TrainingLoadData {
  athleteId: string;
  weeklyTrainingLoad: number;
  acwrRatio: number;
  trainingIntensityDistribution: {
    low: number;
    moderate: number;
    high: number;
  };
  upcomingTournament?: { name: string; daysUntil: number };
  trainingPhase: "off-season" | "pre-season" | "in-season" | "tournament";
}

interface SupplementCompliance {
  athleteId: string;
  supplements: {
    name: string;
    complianceRate: number;
    missedDays: number;
    timingAdherence: number;
  }[];
  overallComplianceRate: number;
  timingIssues: string[];
}

interface WellnessMetrics {
  athleteId: string;
  avgSleepHours: number;
  avgEnergyLevel: number;
  avgSoreness: number;
  hydrationStatus: "poor" | "adequate" | "good" | "optimal";
}

//   recommendations: string[];
// }

interface TournamentNutritionBrief {
  tournament: {
    name: string;
    dates: { start: Date; end: Date };
    location: string;
    expectedGames: number;
    climate: { temperature: number; humidity: number };
  };
  athleteProfile: {
    weight: number;
    position: string;
    knownAllergies: string[];
    dietaryRestrictions: string[];
  };
  calculatedNeeds: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyHydration: number;
    electrolyteServings: number;
  };
  gameDay: {
    preGameMealTiming: string;
    preGameMealSuggestions: string[];
    betweenGameSnacks: string[];
    hydrationSchedule: { time: string; amount: string }[];
    postGameRecovery: string[];
  };
}

@Component({
  selector: "app-nutritionist-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    // ChartModule, // REMOVED: Using LazyChartComponent

    LazyChartComponent,
    DialogModule,
    InputTextModule,
    ProgressBarModule,
    Select,
    TableModule,
    TabsModule,
    TagModule,
    TooltipModule,
    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="nutritionist-dashboard">
        <app-page-header
          title="Nutritionist Dashboard"
          subtitle="Monitor athlete nutrition, body composition, and supplement compliance"
          icon="pi-apple"
        >
          <app-button
            iconLeft="pi-file-pdf"
            (clicked)="showReportDialog.set(true)"
            >Generate Report</app-button
          >
        </app-page-header>

        @if (loading()) {
          <div class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading nutrition data...</span>
          </div>
        } @else {
          <!-- Overview Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon athletes">
                <i class="pi pi-users"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ athletes().length }}</span>
                <span class="stat-label">Athletes Monitored</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon compliance">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ avgSupplementCompliance() }}%</span>
                <span class="stat-label">Avg Supplement Compliance</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon alerts">
                <i class="pi pi-exclamation-triangle"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ alertCount() }}</span>
                <span class="stat-label">Active Alerts</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon hydration">
                <i class="pi pi-bolt"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ avgHydrationScore() }}</span>
                <span class="stat-label">Avg Hydration Status</span>
              </div>
            </div>
          </div>

          <!-- Tabs for different views -->
          <p-tabs [value]="0">
            <p-tablist>
              <p-tab [value]="0">
                <i class="pi pi-users"></i>
                Athletes Overview
              </p-tab>
              <p-tab [value]="1">
                <i class="pi pi-chart-line"></i>
                Body Composition
              </p-tab>
              <p-tab [value]="2">
                <i class="pi pi-check-square"></i>
                Supplement Compliance
              </p-tab>
              <p-tab [value]="3">
                <i class="pi pi-calendar"></i>
                Tournament Prep
              </p-tab>
            </p-tablist>

            <p-tabpanels>
              <!-- Athletes Overview -->
              <p-tabpanel [value]="0">
                <div class="athletes-section">
                  <div class="section-header">
                    <h3>Athletes Under Care</h3>
                    <div class="search-box">
                      <i class="pi pi-search"></i>
                      <input
                        type="text"
                        pInputText
                        [(ngModel)]="searchQuery"
                        placeholder="Search athletes..."
                      />
                    </div>
                  </div>

                  <p-table
                    [value]="filteredAthletes()"
                    [paginator]="true"
                    [rows]="10"
                    styleClass="p-datatable-sm"
                  >
                    <ng-template #header>
                      <tr>
                        <th>Athlete</th>
                        <th>Position</th>
                        <th>Weight</th>
                        <th>Body Fat %</th>
                        <th>Compliance</th>
                        <th>Hydration</th>
                        <th>Alerts</th>
                        <th>Actions</th>
                      </tr>
                    </ng-template>
                    <ng-template #body let-athlete>
                      <tr>
                        <td>
                          <div class="athlete-cell">
                            <span class="athlete-name">{{ athlete.name }}</span>
                            <span class="athlete-age"
                              >{{ athlete.age }} yrs</span
                            >
                          </div>
                        </td>
                        <td>{{ athlete.position }}</td>
                        <td>
                          {{ athlete.currentWeight }} kg
                          @if (athlete.targetWeight) {
                            <span class="target-weight">
                              → {{ athlete.targetWeight }} kg
                            </span>
                          }
                        </td>
                        <td>
                          @if (athlete.bodyFatPercentage) {
                            {{ athlete.bodyFatPercentage }}%
                          } @else {
                            <span class="no-data">N/A</span>
                          }
                        </td>
                        <td>
                          <div class="compliance-cell">
                            <p-progressBar
                              [value]="getAthleteCompliance(athlete.id)"
                              [showValue]="false"
                              styleClass="compliance-bar"
                            ></p-progressBar>
                            <span>{{ getAthleteCompliance(athlete.id) }}%</span>
                          </div>
                        </td>
                        <td>
                          <p-tag
                            [value]="getHydrationLabel(athlete.id)"
                            [severity]="getHydrationSeverity(athlete.id)"
                          ></p-tag>
                        </td>
                        <td>
                          @if (getAthleteAlerts(athlete.id).length > 0) {
                            <span class="alert-badge">
                              {{ getAthleteAlerts(athlete.id).length }}
                            </span>
                          } @else {
                            <i
                              class="pi pi-check-circle ok-icon"
                              pTooltip="No alerts"
                            ></i>
                          }
                        </td>
                        <td>
                          <app-icon-button
                            icon="pi-eye"
                            variant="text"
                            (clicked)="viewAthleteDetails(athlete)"
                            ariaLabel="eye"
                          />
                          <app-icon-button
                            icon="pi-file"
                            variant="text"
                            (clicked)="generateAthleteReport(athlete)"
                            ariaLabel="file"
                          />
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                      <tr>
                        <td colspan="8" class="empty-message">
                          No athletes found matching your search.
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                </div>
              </p-tabpanel>

              <!-- Body Composition -->
              <p-tabpanel [value]="1">
                <div class="body-composition-section">
                  <div class="section-header">
                    <h3>Body Composition Trends</h3>
                    <p-select
                      [options]="athleteSelectOptions()"
                      [(ngModel)]="selectedAthleteId"
                      placeholder="Select athlete"
                      (onChange)="loadAthleteComposition()"
                    ></p-select>
                  </div>

                  @if (selectedAthleteId) {
                    <div class="charts-grid">
                      <p-card header="Weight Trend">
                        <app-lazy-chart
                          type="line"
                          [data]="weightChartData()"
                          [options]="chartOptions"
                        ></app-lazy-chart>
                      </p-card>
                      <p-card header="Body Fat %">
                        <app-lazy-chart
                          type="line"
                          [data]="bodyFatChartData()"
                          [options]="chartOptions"
                        ></app-lazy-chart>
                      </p-card>
                    </div>

                    @if (compositionAlerts().length > 0) {
                      <div class="alerts-section">
                        <h4>
                          <i class="pi pi-exclamation-triangle"></i>
                          Composition Alerts
                        </h4>
                        <ul class="alert-list">
                          @for (alert of compositionAlerts(); track $index) {
                            <li class="alert-item">{{ alert }}</li>
                          }
                        </ul>
                      </div>
                    }
                  } @else {
                    <div class="select-prompt">
                      <i class="pi pi-user"></i>
                      <p>Select an athlete to view body composition trends</p>
                    </div>
                  }
                </div>
              </p-tabpanel>

              <!-- Supplement Compliance -->
              <p-tabpanel [value]="2">
                <div class="supplement-section">
                  <div class="section-header">
                    <h3>Supplement Compliance Overview</h3>
                  </div>

                  <div class="compliance-grid">
                    @for (
                      compliance of supplementCompliance();
                      track compliance.athleteId
                    ) {
                      <p-card styleClass="compliance-card">
                        <ng-template #header>
                          <div class="compliance-header">
                            <span class="athlete-name">{{
                              getAthleteName(compliance.athleteId)
                            }}</span>
                            <p-tag
                              [value]="compliance.overallComplianceRate + '%'"
                              [severity]="
                                getComplianceSeverity(
                                  compliance.overallComplianceRate
                                )
                              "
                            ></p-tag>
                          </div>
                        </ng-template>
                        <div class="supplement-list">
                          @for (
                            supplement of compliance.supplements;
                            track supplement.name
                          ) {
                            <div class="supplement-item">
                              <span class="supplement-name">{{
                                supplement.name
                              }}</span>
                              <div class="supplement-stats">
                                <p-progressBar
                                  [value]="supplement.complianceRate"
                                  [showValue]="false"
                                  styleClass="supplement-bar"
                                ></p-progressBar>
                                <span>{{ supplement.complianceRate }}%</span>
                              </div>
                              @if (supplement.missedDays > 0) {
                                <span class="missed-days"
                                  >{{ supplement.missedDays }} missed</span
                                >
                              }
                            </div>
                          }
                        </div>
                        @if (compliance.timingIssues.length > 0) {
                          <div class="timing-issues">
                            <strong>Timing Issues:</strong>
                            <ul>
                              @for (
                                issue of compliance.timingIssues;
                                track $index
                              ) {
                                <li>{{ issue }}</li>
                              }
                            </ul>
                          </div>
                        }
                      </p-card>
                    }
                  </div>
                </div>
              </p-tabpanel>

              <!-- Tournament Prep -->
              <p-tabpanel [value]="3">
                <div class="tournament-section">
                  <div class="section-header">
                    <h3>Tournament Nutrition Briefs</h3>
                    <app-button
                      iconLeft="pi-plus"
                      (clicked)="showTournamentDialog.set(true)"
                      >Create Brief</app-button
                    >
                  </div>

                  @if (upcomingTournaments().length > 0) {
                    <div class="tournament-grid">
                      @for (
                        tournament of upcomingTournaments();
                        track tournament.tournament.name
                      ) {
                        <p-card styleClass="tournament-card">
                          <ng-template #header>
                            <div class="tournament-header">
                              <h4>{{ tournament.tournament.name }}</h4>
                              <p-tag
                                value="{{
                                  tournament.tournament.expectedGames
                                }} games"
                                severity="info"
                              ></p-tag>
                            </div>
                          </ng-template>
                          <div class="tournament-details">
                            <div class="detail-row">
                              <i class="pi pi-calendar"></i>
                              <span
                                >{{
                                  tournament.tournament.dates.start
                                    | date: "MMM d"
                                }}
                                -
                                {{
                                  tournament.tournament.dates.end
                                    | date: "MMM d, yyyy"
                                }}</span
                              >
                            </div>
                            <div class="detail-row">
                              <i class="pi pi-map-marker"></i>
                              <span>{{ tournament.tournament.location }}</span>
                            </div>
                            <div class="detail-row">
                              <i class="pi pi-sun"></i>
                              <span
                                >{{
                                  tournament.tournament.climate.temperature
                                }}°C,
                                {{ tournament.tournament.climate.humidity }}%
                                humidity</span
                              >
                            </div>
                          </div>
                          <div class="nutrition-needs">
                            <h5>Calculated Needs</h5>
                            <div class="needs-grid">
                              <div class="need-item">
                                <span class="need-value"
                                  >{{
                                    tournament.calculatedNeeds.dailyCalories
                                  }}
                                  kcal</span
                                >
                                <span class="need-label">Daily Calories</span>
                              </div>
                              <div class="need-item">
                                <span class="need-value"
                                  >{{
                                    tournament.calculatedNeeds.dailyProtein
                                  }}g</span
                                >
                                <span class="need-label">Protein</span>
                              </div>
                              <div class="need-item">
                                <span class="need-value"
                                  >{{
                                    tournament.calculatedNeeds.dailyCarbs
                                  }}g</span
                                >
                                <span class="need-label">Carbs</span>
                              </div>
                              <div class="need-item">
                                <span class="need-value"
                                  >{{
                                    tournament.calculatedNeeds.dailyHydration
                                  }}
                                  ml</span
                                >
                                <span class="need-label">Hydration</span>
                              </div>
                            </div>
                          </div>
                          <ng-template #footer>
                            <app-button
                              variant="text"
                              iconLeft="pi-eye"
                              (clicked)="viewTournamentBrief(tournament)"
                              >View Full Brief</app-button
                            >
                            <app-button
                              variant="text"
                              iconLeft="pi-download"
                              (clicked)="exportTournamentBrief(tournament)"
                              >Export PDF</app-button
                            >
                          </ng-template>
                        </p-card>
                      }
                    </div>
                  } @else {
                    <div class="empty-state">
                      <i class="pi pi-calendar-times"></i>
                      <h4>No Upcoming Tournaments</h4>
                      <p>
                        Create a tournament nutrition brief when a competition
                        is scheduled.
                      </p>
                    </div>
                  }
                </div>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
        }

        <!-- Athlete Details Dialog -->
        <p-dialog
          header="Athlete Nutrition Details"
          [(visible)]="showAthleteDialog"
          [modal]="true"
          [style]="{ width: '800px' }"
          [dismissableMask]="true"
        >
          @if (selectedAthlete()) {
            <div class="athlete-details">
              <div class="detail-header">
                <div class="athlete-info">
                  <h3>{{ selectedAthlete()!.name }}</h3>
                  <p>
                    {{ selectedAthlete()!.position }} •
                    {{ selectedAthlete()!.age }} years
                  </p>
                </div>
                <div class="weight-info">
                  <span class="current-weight"
                    >{{ selectedAthlete()!.currentWeight }} kg</span
                  >
                  @if (selectedAthlete()!.targetWeight) {
                    <span class="target"
                      >Target: {{ selectedAthlete()!.targetWeight }} kg</span
                    >
                  }
                </div>
              </div>

              <div class="metrics-grid">
                <div class="metric-card">
                  <span class="metric-label">Body Fat</span>
                  <span class="metric-value"
                    >{{ selectedAthlete()!.bodyFatPercentage || "N/A" }}%</span
                  >
                </div>
                <div class="metric-card">
                  <span class="metric-label">BMR</span>
                  <span class="metric-value"
                    >{{ selectedAthlete()!.bmr || "N/A" }} kcal</span
                  >
                </div>
                <div class="metric-card">
                  <span class="metric-label">Body Water</span>
                  <span class="metric-value"
                    >{{
                      selectedAthlete()!.bodyWaterPercentage || "N/A"
                    }}%</span
                  >
                </div>
              </div>

              <div class="recommendations-section">
                <h4>AI Recommendations</h4>
                <ul class="recommendations-list">
                  @for (rec of athleteRecommendations(); track $index) {
                    <li>{{ rec }}</li>
                  }
                </ul>
              </div>
            </div>
          }
          <ng-template #footer>
            <app-button
              iconLeft="pi-file-pdf"
              (clicked)="generateAthleteReport(selectedAthlete()!)"
              >Generate Full Report</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- Report Generation Dialog -->
        <p-dialog
          header="Generate Nutrition Report"
          [(visible)]="showReportDialog"
          [modal]="true"
          [style]="{ width: '500px' }"
          [dismissableMask]="true"
        >
          <div class="report-form">
            <div class="form-group">
              <label>Report Type</label>
              <p-select
                [options]="reportTypes"
                [(ngModel)]="selectedReportType"
                placeholder="Select report type"
                styleClass="w-full"
              ></p-select>
            </div>
            <div class="form-group">
              <label>Athlete</label>
              <p-select
                [options]="athleteSelectOptions()"
                [(ngModel)]="reportAthleteId"
                placeholder="Select athlete"
                styleClass="w-full"
              ></p-select>
            </div>
            <div class="form-group">
              <label>Time Period</label>
              <p-select
                [options]="timePeriods"
                [(ngModel)]="selectedTimePeriod"
                placeholder="Select period"
                styleClass="w-full"
              ></p-select>
            </div>
          </div>
          <ng-template #footer>
            <app-button variant="text" (clicked)="showReportDialog.set(false)"
              >Cancel</app-button
            >
            <app-button iconLeft="pi-file-pdf" (clicked)="generateReport()"
              >Generate</app-button
            >
          </ng-template>
        </p-dialog>

        <!-- Tournament Brief Dialog -->
        <p-dialog
          header="Create Tournament Nutrition Brief"
          [(visible)]="showTournamentDialog"
          [modal]="true"
          [style]="{ width: '600px' }"
          [dismissableMask]="true"
        >
          <div class="tournament-form">
            <div class="form-group">
              <label>Tournament Name</label>
              <input
                type="text"
                pInputText
                [(ngModel)]="newTournament.name"
                placeholder="e.g., National Championships"
                class="w-full"
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Location</label>
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="newTournament.location"
                  placeholder="City, Country"
                  class="w-full"
                />
              </div>
              <div class="form-group">
                <label>Expected Games</label>
                <input
                  type="number"
                  pInputText
                  [(ngModel)]="newTournament.expectedGames"
                  min="1"
                  class="w-full"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Expected Temperature (°C)</label>
                <input
                  type="number"
                  pInputText
                  [(ngModel)]="newTournament.temperature"
                  class="w-full"
                />
              </div>
              <div class="form-group">
                <label>Humidity (%)</label>
                <input
                  type="number"
                  pInputText
                  [(ngModel)]="newTournament.humidity"
                  min="0"
                  max="100"
                  class="w-full"
                />
              </div>
            </div>
          </div>
          <ng-template #footer>
            <app-button
              variant="text"
              (clicked)="showTournamentDialog.set(false)"
              >Cancel</app-button
            >
            <app-button iconLeft="pi-plus" (clicked)="createTournamentBrief()"
              >Create Brief</app-button
            >
          </ng-template>
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrls: ["./nutritionist-dashboard.component.scss"],
})
export class NutritionistDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private insightFeedService = inject(SharedInsightFeedService);

  // State
  loading = signal(true);
  athletes = signal<AthleteNutritionData[]>([]);
  bodyCompositionData = signal<Map<string, BodyCompositionData>>(new Map());
  trainingLoadData = signal<Map<string, TrainingLoadData>>(new Map());
  supplementCompliance = signal<SupplementCompliance[]>([]);
  wellnessMetrics = signal<Map<string, WellnessMetrics>>(new Map());
  upcomingTournaments = signal<TournamentNutritionBrief[]>([]);

  // UI State
  searchQuery = "";
  selectedAthleteId: string | null = null;
  showAthleteDialog = signal(false);
  showReportDialog = signal(false);
  showTournamentDialog = signal(false);
  selectedAthlete = signal<AthleteNutritionData | null>(null);
  athleteRecommendations = signal<string[]>([]);

  // Report form
  selectedReportType = "weekly";
  reportAthleteId: string | null = null;
  selectedTimePeriod = "7days";

  reportTypes = [
    { label: "Weekly Nutrition Context", value: "weekly" },
    { label: "Tournament Brief", value: "tournament" },
    { label: "Body Composition Report", value: "body_comp" },
    { label: "Supplement Audit", value: "supplement" },
  ];

  timePeriods = [
    { label: "Last 7 Days", value: "7days" },
    { label: "Last 14 Days", value: "14days" },
    { label: "Last 30 Days", value: "30days" },
    { label: "Last 90 Days", value: "90days" },
  ];

  // Tournament form
  newTournament = {
    name: "",
    location: "",
    expectedGames: 3,
    temperature: 25,
    humidity: 60,
  };

  // Chart options
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: false },
    },
  };

  // Computed
  filteredAthletes = computed(() => {
    const query = this.searchQuery.toLowerCase();
    if (!query) return this.athletes();
    return this.athletes().filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.position.toLowerCase().includes(query),
    );
  });

  athleteSelectOptions = computed(() =>
    this.athletes().map((a) => ({
      label: `${a.name} (${a.position})`,
      value: a.id,
    })),
  );

  avgSupplementCompliance = computed(() => {
    const compliances = this.supplementCompliance();
    if (compliances.length === 0) return 0;
    const avg =
      compliances.reduce((sum, c) => sum + c.overallComplianceRate, 0) /
      compliances.length;
    return Math.round(avg);
  });

  alertCount = computed(() => {
    let count = 0;
    this.bodyCompositionData().forEach((data) => {
      count += data.alerts.length;
    });
    return count;
  });

  avgHydrationScore = computed(() => {
    const metrics = Array.from(this.wellnessMetrics().values());
    if (metrics.length === 0) return "N/A";
    const scores = { poor: 1, adequate: 2, good: 3, optimal: 4 };
    const avg =
      metrics.reduce((sum, m) => sum + scores[m.hydrationStatus], 0) /
      metrics.length;
    if (avg >= 3.5) return "Optimal";
    if (avg >= 2.5) return "Good";
    if (avg >= 1.5) return "Adequate";
    return "Poor";
  });

  compositionAlerts = computed(() => {
    if (!this.selectedAthleteId) return [];
    return this.bodyCompositionData().get(this.selectedAthleteId)?.alerts || [];
  });

  weightChartData = computed(() => {
    if (!this.selectedAthleteId) return { labels: [], datasets: [] };
    const data = this.bodyCompositionData().get(this.selectedAthleteId);
    if (!data) return { labels: [], datasets: [] };

    return {
      labels: data.weightHistory.map((h) => h.date),
      datasets: [
        {
          label: "Weight (kg)",
          data: data.weightHistory.map((h) => h.weight),
          borderColor: "var(--primary-color)",
          fill: false,
          tension: 0.4,
        },
      ],
    };
  });

  bodyFatChartData = computed(() => {
    if (!this.selectedAthleteId) return { labels: [], datasets: [] };
    const data = this.bodyCompositionData().get(this.selectedAthleteId);
    if (!data) return { labels: [], datasets: [] };

    return {
      labels: data.bodyFatHistory.map((h) => h.date),
      datasets: [
        {
          label: "Body Fat %",
          data: data.bodyFatHistory.map((h) => h.percentage),
          borderColor: "var(--orange-500)",
          fill: false,
          tension: 0.4,
        },
      ],
    };
  });

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      // Load real data from API
      const response = await firstValueFrom(
        this.api.get<{
          athletes: Array<{
            id: string;
            name: string;
            position: string;
            weight: number;
            bodyFat: number;
            leanMass: number;
            hydrationStatus: string;
            supplementCompliance: number;
            dailyCalories: number;
            proteinTarget: number;
            lastUpdated: string;
          }>;
        }>("/api/staff-nutritionist/athletes"),
      );

      if (response?.data?.athletes) {
        const athletes = response.data.athletes.map((a) => ({
          id: a.id,
          name: a.name,
          position: a.position,
          age: 0, // Not returned from API, could be calculated from DOB
          currentWeight: a.weight || 0,
          bodyFatPercentage: a.bodyFat,
          bmr: a.dailyCalories ? Math.round(a.dailyCalories / 1.5) : undefined,
          bodyWaterPercentage: undefined,
        }));
        this.athletes.set(athletes);

        // Load body composition trends for each athlete
        await this.loadBodyCompositionData(athletes);

        // Load supplement compliance
        await this.loadSupplementCompliance();

        // Load wellness/hydration data
        this.loadWellnessFromAthletes(response.data.athletes);
      }
    } catch (error) {
      console.error("Failed to load nutrition data:", error);
      this.toast.error("Failed to load nutrition data");
    } finally {
      this.loading.set(false);
    }
  }

  private async loadBodyCompositionData(
    athletes: AthleteNutritionData[],
  ): Promise<void> {
    const compData = new Map<string, BodyCompositionData>();

    for (const athlete of athletes) {
      try {
        const response = await firstValueFrom(
          this.api.get<{
            trends: Array<{
              date: string;
              weight: number;
              bodyFat: number;
              leanMass: number;
            }>;
          }>(`/api/staff-nutritionist/athletes/${athlete.id}/trends`),
        );

        if (response?.data?.trends) {
          compData.set(athlete.id, {
            athleteId: athlete.id,
            weightHistory: response.data.trends.map((t) => ({
              date: t.date,
              weight: t.weight,
            })),
            bodyFatHistory: response.data.trends.map((t) => ({
              date: t.date,
              percentage: t.bodyFat,
            })),
            muscleMassHistory: response.data.trends.map((t) => ({
              date: t.date,
              mass: t.leanMass,
            })),
            alerts: this.detectAlerts(response.data.trends),
          });
        }
      } catch {
        // If no trend data, create empty entry
        compData.set(athlete.id, {
          athleteId: athlete.id,
          weightHistory: [],
          bodyFatHistory: [],
          muscleMassHistory: [],
          alerts: [],
        });
      }
    }

    this.bodyCompositionData.set(compData);
  }

  private detectAlerts(
    trends: Array<{ date: string; weight: number }>,
  ): string[] {
    const alerts: string[] = [];
    if (trends.length >= 3) {
      const recent = trends.slice(-3);
      const weightChange = recent[recent.length - 1].weight - recent[0].weight;
      if (weightChange < -1.5) {
        alerts.push(
          `Rapid weight loss detected (${weightChange.toFixed(1)}kg in 3 days)`,
        );
      } else if (weightChange > 2) {
        alerts.push(
          `Rapid weight gain detected (+${weightChange.toFixed(1)}kg in 3 days)`,
        );
      }
    }
    return alerts;
  }

  private async loadSupplementCompliance(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.get<{
          compliance: Array<{
            athleteId: string;
            athleteName: string;
            supplements: string[];
            compliance: number;
            takenCount: number;
            missedCount: number;
          }>;
        }>("/api/staff-nutritionist/supplements"),
      );

      if (response?.data?.compliance) {
        const supplements: SupplementCompliance[] =
          response.data.compliance.map((c) => ({
            athleteId: c.athleteId,
            overallComplianceRate: c.compliance,
            supplements: c.supplements.map((name) => ({
              name,
              complianceRate: c.compliance,
              missedDays: c.missedCount,
              timingAdherence: c.compliance,
            })),
            timingIssues: [],
          }));
        this.supplementCompliance.set(supplements);
      }
    } catch {
      this.supplementCompliance.set([]);
    }
  }

  private loadWellnessFromAthletes(
    athletes: Array<{ id: string; hydrationStatus: string }>,
  ): void {
    const wellness = new Map<string, WellnessMetrics>();
    athletes.forEach((athlete) => {
      const hydrationMap: Record<
        string,
        "poor" | "adequate" | "good" | "optimal"
      > = {
        critical: "poor",
        warning: "adequate",
        adequate: "good",
        unknown: "adequate",
      };
      wellness.set(athlete.id, {
        athleteId: athlete.id,
        avgSleepHours: 7,
        avgEnergyLevel: 7,
        avgSoreness: 4,
        hydrationStatus: hydrationMap[athlete.hydrationStatus] || "adequate",
      });
    });
    this.wellnessMetrics.set(wellness);
  }

  getAthleteCompliance(athleteId: string): number {
    const compliance = this.supplementCompliance().find(
      (c) => c.athleteId === athleteId,
    );
    return compliance?.overallComplianceRate || 0;
  }

  getAthleteName(athleteId: string): string {
    return this.athletes().find((a) => a.id === athleteId)?.name || "Unknown";
  }

  getAthleteAlerts(athleteId: string): string[] {
    return this.bodyCompositionData().get(athleteId)?.alerts || [];
  }

  getHydrationLabel(athleteId: string): string {
    const status = this.wellnessMetrics().get(athleteId)?.hydrationStatus;
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : "N/A";
  }

  getHydrationSeverity(
    athleteId: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    const status = this.wellnessMetrics().get(athleteId)?.hydrationStatus;
    const severities: Record<
      string,
      "success" | "info" | "warn" | "danger" | "secondary"
    > = {
      optimal: "success",
      good: "info",
      adequate: "warn",
      poor: "danger",
    };
    return severities[status || ""] || "secondary";
  }

  getComplianceSeverity(
    rate: number,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    if (rate >= 90) return "success";
    if (rate >= 75) return "info";
    if (rate >= 60) return "warn";
    return "danger";
  }

  viewAthleteDetails(athlete: AthleteNutritionData): void {
    this.selectedAthlete.set(athlete);
    this.athleteRecommendations.set([
      "Increase daily protein intake to support current training phase",
      "Consider adding Vitamin D supplementation during winter months",
      "Monitor hydration more closely on high-intensity training days",
      "Review iron intake timing to avoid calcium interactions",
    ]);
    this.showAthleteDialog.set(true);
  }

  generateAthleteReport(athlete: AthleteNutritionData): void {
    this.toast.success(`Generating report for ${athlete.name}...`);
    // In production, this would generate a PDF report
    this.showAthleteDialog.set(false);
  }

  loadAthleteComposition(): void {
    // Data already loaded in demo, in production would fetch specific athlete data
  }

  viewTournamentBrief(brief: TournamentNutritionBrief): void {
    this.toast.info(`Viewing brief for ${brief.tournament.name}`);
  }

  exportTournamentBrief(brief: TournamentNutritionBrief): void {
    this.toast.success(`Exporting PDF for ${brief.tournament.name}...`);
  }

  generateReport(): void {
    if (!this.reportAthleteId) {
      this.toast.warn("Please select an athlete");
      return;
    }
    this.toast.success("Generating report...");
    this.showReportDialog.set(false);
  }

  createTournamentBrief(): void {
    if (!this.newTournament.name) {
      this.toast.warn("Please enter a tournament name");
      return;
    }
    this.toast.success(
      `Tournament brief created for ${this.newTournament.name}`,
    );
    this.showTournamentDialog.set(false);
    this.newTournament = {
      name: "",
      location: "",
      expectedGames: 3,
      temperature: 25,
      humidity: 60,
    };
  }
}
