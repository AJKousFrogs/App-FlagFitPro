import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ProgressBar } from "primeng/progressbar";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { PerformanceAchievement } from "../../../core/services/team-performance-ranking.service";
import { DevelopmentGoal, Metric } from "../analytics.models";

@Component({
  selector: "app-analytics-overview-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ProgressBar,
    CardShellComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./analytics-overview-section.component.html",
  styleUrl: "./analytics-overview-section.component.scss",
})
export class AnalyticsOverviewSectionComponent {
  nextGenEnabled = input(false);
  developmentGoals = input<DevelopmentGoal[]>([]);
  metrics = input<Metric[]>([]);
  teamPerformanceAchievements = input<PerformanceAchievement[]>([]);
  teamRankingBadgeCounts = input({ gold: 0, silver: 0, bronze: 0 });
  goalsPreviewCount = input(3);

  trackByMetricLabel(index: number, metric: Metric): string {
    return metric.label;
  }

  getGoalIcon(metricType: DevelopmentGoal["metricType"]): string {
    const icons: Record<string, string> = {
      speed: "pi pi-bolt",
      agility: "pi pi-arrows-alt",
      strength: "pi pi-heart-fill",
      power: "pi pi-lightning",
      skill: "pi pi-star",
    };
    return icons[metricType] || "pi pi-bullseye";
  }

  calculateGoalProgress(goal: DevelopmentGoal): number {
    const startValue = goal.startValue || goal.currentValue * 1.1;
    const improvement = startValue - goal.currentValue;
    const totalNeeded = startValue - goal.targetValue;
    if (totalNeeded === 0) return 100;
    return Math.min(100, Math.max(0, Math.round((improvement / totalNeeded) * 100)));
  }

  getDaysRemaining(deadline: Date): number {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getRankEmoji(rank: number): string {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🏅";
  }
}
