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
import { Card } from "primeng/card";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";

import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { Tooltip } from "primeng/tooltip";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../../core/services/api.service";
import { SharedInsightFeedService } from "../../../core/services/shared-insight-feed.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { LazyChartComponent } from "../../../shared/components/lazy-chart/lazy-chart.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";

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

// Extended interface for nutritionist dashboard with additional fields
interface NutritionistSupplementCompliance {
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
    Card,
    LazyChartComponent,
    Dialog,
    InputText,
    ProgressBar,
    Select,
    TableModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    StatusTagComponent,
    Tooltip,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    IconButtonComponent,
    AppLoadingComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./nutritionist-dashboard.component.html",
  styleUrl: "./nutritionist-dashboard.component.scss",
})
export class NutritionistDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private logger = inject(LoggerService);
  private insightFeedService = inject(SharedInsightFeedService);

  // State
  loading = signal(true);
  athletes = signal<AthleteNutritionData[]>([]);
  bodyCompositionData = signal<Map<string, BodyCompositionData>>(new Map());
  trainingLoadData = signal<Map<string, TrainingLoadData>>(new Map());
  supplementCompliance = signal<NutritionistSupplementCompliance[]>([]);
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
          borderColor: "var(--color-brand-primary)",
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
      this.logger.error("Failed to load nutrition data", error);
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
        const supplements: NutritionistSupplementCompliance[] =
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
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    const status = this.wellnessMetrics().get(athleteId)?.hydrationStatus;
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary"
    > = {
      optimal: "success",
      good: "info",
      adequate: "warning",
      poor: "danger",
    };
    return severities[status || ""] || "secondary";
  }

  getComplianceSeverity(
    rate: number,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    if (rate >= 90) return "success";
    if (rate >= 75) return "info";
    if (rate >= 60) return "warning";
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
