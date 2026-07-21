import {
  Component,
  OnInit,
  computed,
  signal,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable, of } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import { RtpService } from "./services/rtp.service";

interface ReadinessMetrics {
  readinessScore: number;
  acuteLoad: number;
  chronicLoad: number;
  acwrRatio: number;
  rpeAverage: number;
  sleepQuality: number;
  recoverySessions: number;
  injuryRiskLevel: "low" | "moderate" | "high";
}

interface CoachingRecommendation {
  id: string;
  category:
    | "training"
    | "recovery"
    | "nutrition"
    | "psychology"
    | "medical";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  actionItems: string[];
}

interface AthleteReadinessSnapshot {
  athleteId: string;
  athleteName: string;
  position: string;
  timestamp: string;
  metrics: ReadinessMetrics;
  trend: "improving" | "stable" | "declining";
  lastModifiedBy: string;
}

@Component({
  selector: "app-coach-athlete-readiness",
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="coach-readiness-container">
      <!-- Header -->
      <div class="readiness-header">
        <div class="athlete-info">
          <div class="athlete-name">{{ athleteName() }}</div>
          <div class="athlete-position">{{ athletePosition() }}</div>
        </div>
        <div class="trend-badge" [class]="'trend-' + trend()">
          {{ trend() | uppercase }}
        </div>
      </div>

      <!-- Primary Readiness Score -->
      <div class="readiness-score-card">
        <div class="score-circle">
          <div class="score-value">{{ readinessScore() }}</div>
          <div class="score-label">READINESS</div>
        </div>
        <div class="score-status" [class]="'status-' + readinessStatus()">
          {{ readinessStatus() }}
        </div>
        <div class="last-updated">
          Last updated {{ lastUpdated() | date: "short" }}
        </div>
      </div>

      <!-- Load Management Section -->
      <div class="load-management-section">
        <h2>Load Management</h2>
        <div class="load-metrics">
          <div class="metric-card">
            <div class="metric-label">Acute Load</div>
            <div class="metric-value">{{ acuteLoad() }}</div>
            <div class="metric-unit">AU</div>
            <div class="metric-bar">
              <div
                class="bar-fill"
                [style.width.%]="(acuteLoad() / 100) * 100"
              ></div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Chronic Load</div>
            <div class="metric-value">{{ chronicLoad() }}</div>
            <div class="metric-unit">AU</div>
            <div class="metric-bar">
              <div
                class="bar-fill"
                [style.width.%]="(chronicLoad() / 100) * 100"
              ></div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">ACWR Ratio</div>
            <div class="metric-value">{{ acwrRatio().toFixed(2) }}</div>
            <div class="metric-unit">ratio</div>
            <div
              class="acwr-status"
              [class]="'acwr-' + acwrStatus()"
            >
              {{ acwrStatusLabel() }}
            </div>
          </div>
        </div>
      </div>

      <!-- Recovery & Wellness -->
      <div class="recovery-section">
        <h2>Recovery & Wellness</h2>
        <div class="wellness-metrics">
          <div class="wellness-item">
            <div class="wellness-label">Sleep Quality</div>
            <div class="wellness-bar">
              <div
                class="bar-fill sleep"
                [style.width.%]="sleepQuality()"
              ></div>
            </div>
            <div class="wellness-value">{{ sleepQuality() }}%</div>
          </div>

          <div class="wellness-item">
            <div class="wellness-label">Avg RPE</div>
            <div class="wellness-value">{{ rpeAverage().toFixed(1) }}/10</div>
            <div class="wellness-indicator">
              <span
                class="rpe-dot"
                [class]="'rpe-level-' + rpeLevel()"
              ></span>
              {{ rpeDescription() }}
            </div>
          </div>

          <div class="wellness-item">
            <div class="wellness-label">Recovery Sessions</div>
            <div class="wellness-value">{{ recoverySessions() }}</div>
            <div class="wellness-indicator">This week</div>
          </div>

          <div class="wellness-item">
            <div class="wellness-label">Injury Risk</div>
            <div
              class="risk-badge"
              [class]="'risk-' + injuryRiskLevel()"
            >
              {{ injuryRiskLevel() | uppercase }}
            </div>
          </div>
        </div>
      </div>

      <!-- Coaching Recommendations -->
      <div class="recommendations-section">
        <h2>Coaching Recommendations</h2>
        <div class="recommendations-list">
          @for (rec of recommendations(); track rec.id) {
            <div
              class="recommendation-card"
              [class]="'priority-' + rec.priority"
            >
              <div class="rec-header">
                <div class="rec-title">{{ rec.title }}</div>
                <div class="rec-priority-badge">{{ rec.priority }}</div>
              </div>
              <div class="rec-category">{{ rec.category }}</div>
              <div class="rec-description">{{ rec.description }}</div>
              @if (rec.actionItems?.length) {
                <div class="action-items">
                  <div class="action-label">Action items:</div>
                  <ul>
                    @for (item of rec.actionItems; track item) {
                      <li>{{ item }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
        </div>
        @if (!recommendations().length) {
          <div class="no-recommendations">
            No specific recommendations at this time. Athlete is performing well.
          </div>
        }
      </div>

      <!-- Data Quality & Attribution -->
      <div class="data-attribution">
        <div class="updated-info">
          Last modified by {{ lastModifiedBy() }} on {{ lastUpdated() | date: "short" }}
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .coach-readiness-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
        background: var(--color-surface);
        min-height: 100vh;
      }

      .readiness-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding: 15px;
        background: var(--color-surface-elevated);
        border-radius: 12px;
        border-left: 4px solid var(--color-primary);
      }

      .athlete-info {
        flex: 1;
      }

      .athlete-name {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .athlete-position {
        font-size: 14px;
        color: var(--color-text-secondary);
      }

      .trend-badge {
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .trend-improving {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }

      .trend-stable {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }

      .trend-declining {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      /* Readiness Score Card */
      .readiness-score-card {
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
        color: white;
        border-radius: 16px;
        padding: 30px;
        margin-bottom: 30px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .score-circle {
        margin-bottom: 20px;
      }

      .score-value {
        font-size: 64px;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 8px;
      }

      .score-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.9;
      }

      .score-status {
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        display: inline-block;
        margin-bottom: 15px;
      }

      .status-ready {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
      }

      .status-caution {
        background: rgba(250, 204, 21, 0.2);
        color: #facc15;
      }

      .status-caution-high {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
      }

      .last-updated {
        font-size: 12px;
        opacity: 0.8;
      }

      /* Load Management */
      .load-management-section {
        margin-bottom: 30px;
      }

      .load-management-section h2 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
      }

      .load-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .metric-card {
        background: var(--color-surface-elevated);
        padding: 16px;
        border-radius: 12px;
        border: 1px solid var(--color-border);
      }

      .metric-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary);
        margin-bottom: 8px;
      }

      .metric-value {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .metric-unit {
        font-size: 12px;
        color: var(--color-text-secondary);
        margin-bottom: 12px;
      }

      .metric-bar {
        height: 6px;
        background: var(--color-border);
        border-radius: 3px;
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      .acwr-status {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        margin-top: 8px;
      }

      .acwr-safe {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }

      .acwr-caution {
        background: rgba(250, 204, 21, 0.1);
        color: #facc15;
      }

      .acwr-high {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      /* Recovery Section */
      .recovery-section {
        margin-bottom: 30px;
      }

      .recovery-section h2 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
      }

      .wellness-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }

      .wellness-item {
        background: var(--color-surface-elevated);
        padding: 16px;
        border-radius: 12px;
        border: 1px solid var(--color-border);
      }

      .wellness-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary);
        margin-bottom: 8px;
      }

      .wellness-value {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .wellness-bar {
        height: 8px;
        background: var(--color-border);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .bar-fill.sleep {
        background: linear-gradient(90deg, #8b5cf6, #6366f1);
      }

      .wellness-indicator {
        font-size: 12px;
        color: var(--color-text-secondary);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .rpe-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .rpe-level-low {
        background: #22c55e;
      }

      .rpe-level-moderate {
        background: #facc15;
      }

      .rpe-level-high {
        background: #ef4444;
      }

      .risk-badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .risk-low {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }

      .risk-moderate {
        background: rgba(250, 204, 21, 0.1);
        color: #facc15;
      }

      .risk-high {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      /* Recommendations */
      .recommendations-section {
        margin-bottom: 30px;
      }

      .recommendations-section h2 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
      }

      .recommendations-list {
        display: grid;
        gap: 12px;
      }

      .recommendation-card {
        background: var(--color-surface-elevated);
        border: 1px solid var(--color-border);
        border-left: 4px solid;
        border-radius: 12px;
        padding: 16px;
      }

      .priority-high {
        border-left-color: #ef4444;
        background: rgba(239, 68, 68, 0.02);
      }

      .priority-medium {
        border-left-color: #facc15;
        background: rgba(250, 204, 21, 0.02);
      }

      .priority-low {
        border-left-color: #3b82f6;
        background: rgba(59, 130, 246, 0.02);
      }

      .rec-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .rec-title {
        font-size: 14px;
        font-weight: 600;
      }

      .rec-priority-badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .priority-high .rec-priority-badge {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      .priority-medium .rec-priority-badge {
        background: rgba(250, 204, 21, 0.2);
        color: #facc15;
      }

      .priority-low .rec-priority-badge {
        background: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
      }

      .rec-category {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary);
        margin-bottom: 4px;
      }

      .rec-description {
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 8px;
        color: var(--color-text);
      }

      .action-items {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--color-border);
      }

      .action-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-text-secondary);
        margin-bottom: 6px;
        font-weight: 600;
      }

      .action-items ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .action-items li {
        font-size: 13px;
        margin-bottom: 4px;
        padding-left: 16px;
        position: relative;
      }

      .action-items li::before {
        content: "▪";
        position: absolute;
        left: 0;
      }

      .no-recommendations {
        text-align: center;
        padding: 30px 20px;
        background: var(--color-surface-elevated);
        border-radius: 12px;
        border: 1px solid var(--color-border);
        color: var(--color-text-secondary);
        font-size: 14px;
      }

      /* Data Attribution */
      .data-attribution {
        padding: 16px;
        background: var(--color-surface-elevated);
        border-radius: 8px;
        border-top: 1px solid var(--color-border);
        text-align: center;
      }

      .updated-info {
        font-size: 12px;
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class CoachAthleteReadinessComponent implements OnInit {
  private rtpService = inject(RtpService);
  private route = inject(ActivatedRoute);

  athleteId = signal<string>("");
  athleteName = signal<string>("Loading...");
  athletePosition = signal<string>("");
  lastUpdated = signal<Date>(new Date());
  lastModifiedBy = signal<string>("");

  readinessScore = signal<number>(0);
  acuteLoad = signal<number>(0);
  chronicLoad = signal<number>(0);
  acwrRatio = signal<number>(0);
  rpeAverage = signal<number>(0);
  sleepQuality = signal<number>(0);
  recoverySessions = signal<number>(0);
  injuryRiskLevel = signal<"low" | "moderate" | "high">("low");
  trend = signal<"improving" | "stable" | "declining">("stable");

  recommendations = signal<CoachingRecommendation[]>([]);

  readinessStatus = computed(() => {
    const score = this.readinessScore();
    if (score >= 80) return "ready";
    if (score >= 60) return "caution";
    return "caution-high";
  });

  acwrStatus = computed(() => {
    const ratio = this.acwrRatio();
    if (ratio < 0.8) return "safe";
    if (ratio < 1.3) return "caution";
    return "high";
  });

  acwrStatusLabel = computed(() => {
    const status = this.acwrStatus();
    if (status === "safe") return "Safe";
    if (status === "caution") return "Optimal";
    return "High Risk";
  });

  rpeLevel = computed(() => {
    const rpe = this.rpeAverage();
    if (rpe <= 4) return "low";
    if (rpe <= 6) return "moderate";
    return "high";
  });

  rpeDescription = computed(() => {
    const level = this.rpeLevel();
    if (level === "low") return "Well recovered";
    if (level === "moderate") return "Normal training";
    return "High intensity";
  });

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          this.athleteId.set(params["id"] || "");
          return this.loadAthleteReadiness();
        }),
        catchError((error) => {
          console.error("Error loading athlete readiness:", error);
          return of(undefined);
        }),
      )
      .subscribe({});
  }

  private loadAthleteReadiness(): Observable<void> {
    const athleteId = this.athleteId();
    if (!athleteId) {
      return of(undefined);
    }
    return of(undefined);
  }

  private updateFromSnapshot(snapshot: AthleteReadinessSnapshot): void {
    this.athleteName.set(snapshot.athleteName);
    this.athletePosition.set(snapshot.position);
    this.lastUpdated.set(new Date(snapshot.timestamp));
    this.lastModifiedBy.set(snapshot.lastModifiedBy);
    this.trend.set(snapshot.trend);

    const metrics = snapshot.metrics;
    this.readinessScore.set(metrics.readinessScore);
    this.acuteLoad.set(metrics.acuteLoad);
    this.chronicLoad.set(metrics.chronicLoad);
    this.acwrRatio.set(metrics.acwrRatio);
    this.rpeAverage.set(metrics.rpeAverage);
    this.sleepQuality.set(metrics.sleepQuality);
    this.recoverySessions.set(metrics.recoverySessions);
    this.injuryRiskLevel.set(metrics.injuryRiskLevel);

    this.generateRecommendations(metrics);
  }

  private generateRecommendations(metrics: ReadinessMetrics): void {
    const recs: CoachingRecommendation[] = [];

    if (metrics.readinessScore < 60) {
      recs.push({
        id: "readiness-1",
        category: "training",
        title: "Consider reduced training load",
        description:
          "Athlete is showing low readiness. Consider reducing intensity or volume for today's session.",
        priority: "high",
        actionItems: [
          "Monitor ACWR ratio closely",
          "Incorporate more recovery modalities",
          "Assess for overtraining symptoms",
        ],
      });
    }

    if (metrics.acwrRatio > 1.3) {
      recs.push({
        id: "acwr-1",
        category: "training",
        title: "High acute-to-chronic load ratio",
        description:
          "ACWR is elevated. Gradual load reduction or extended recovery may be needed.",
        priority: "high",
        actionItems: [
          "Plan recovery week in the next 7-10 days",
          "Monitor for fatigue and soreness",
          "Consider injury prevention protocols",
        ],
      });
    }

    if (metrics.sleepQuality < 60) {
      recs.push({
        id: "sleep-1",
        category: "recovery",
        title: "Prioritize sleep quality",
        description:
          "Recent sleep quality is below optimal levels. Address sleep hygiene and schedule.",
        priority: "medium",
        actionItems: [
          "Review sleep schedule with athlete",
          "Reduce screen time before bed",
          "Consider sleep tracking devices",
        ],
      });
    }

    if (metrics.rpeAverage > 7) {
      recs.push({
        id: "rpe-1",
        category: "training",
        title: "High perceived exertion",
        description:
          "Athletes are reporting high RPE. Verify effort-performance balance and fatigue levels.",
        priority: "medium",
        actionItems: [
          "Conduct fatigue assessment",
          "Review recent training volume",
          "Consider active recovery sessions",
        ],
      });
    }

    if (metrics.injuryRiskLevel === "high") {
      recs.push({
        id: "injury-1",
        category: "medical",
        title: "Elevated injury risk",
        description:
          "Injury risk indicators are high. Enhanced monitoring and conservative training approach recommended.",
        priority: "high",
        actionItems: [
          "Consult with medical staff",
          "Implement injury prevention drills",
          "Review recent injuries and loading patterns",
        ],
      });
    }

    if (metrics.recoverySessions < 2) {
      recs.push({
        id: "recovery-1",
        category: "recovery",
        title: "Increase recovery interventions",
        description:
          "Limited recovery sessions this week. Consider scheduling additional recovery modalities.",
        priority: "low",
        actionItems: [
          "Schedule massage or soft tissue work",
          "Add stretching/mobility sessions",
          "Consider ice bath or contrast therapy",
        ],
      });
    }

    this.recommendations.set(recs);
  }
}
