import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";

interface ExerciseProgress {
  exercise_id: string;
  exercise_name: string;
  prescribed_sets: number;
  prescribed_reps: number;
  actual_sets_completed: number;
  compliance_percent: number;
  pain_during_exercise: number;
  progression_ready: boolean;
}

interface PhaseProgressDetail {
  phase: number;
  phase_name: string;
  started_date: string;
  target_duration_weeks: number;
  weeks_elapsed: number;
  completion_percent: number;
  key_milestones: {
    milestone: string;
    achieved: boolean;
    achieved_date?: string;
  }[];
  exercises: ExerciseProgress[];
}

interface AthleteRtpStatus {
  athlete_id: string;
  athlete_name: string;
  injury_id: string;
  injury_type: string;
  current_phase: number;
  phase_details: PhaseProgressDetail;
  overall_compliance: number;
  red_flags: string[];
  recommendations: string[];
}

interface PhysioResponse {
  success: boolean;
  athlete: AthleteRtpStatus;
  lastUpdated: string;
}

/**
 * Physiotherapist Protocol Adherence Dashboard
 * Route: /staff/physio-protocol/:athleteId/:injuryId
 * Tracks rehab compliance, exercise progression, and functional milestones.
 * Audience: Physiotherapist, rehabilitation specialist
 */
@Component({
  selector: "app-physio-protocol-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="physio-container">
      <div class="header">
        <h1>Rehabilitation Protocol Tracking</h1>
        <p class="subtitle">Monitor exercise compliance and functional progression</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading protocol data...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else if (athlete()) {
        <div class="content">
          <!-- Athlete Header -->
          <section class="athlete-header">
            <div class="athlete-info">
              <h2>{{ athlete().athlete_name }}</h2>
              <p class="injury-info">{{ athlete().injury_type }} | Phase {{ athlete().current_phase }}</p>
            </div>
            <div class="compliance-summary">
              <div class="compliance-badge">
                <span class="label">Overall Compliance</span>
                <span
                  class="value"
                  [class.excellent]="athlete().overall_compliance >= 90"
                  [class.good]="athlete().overall_compliance >= 70 && athlete().overall_compliance < 90"
                  [class.fair]="athlete().overall_compliance < 70"
                >
                  {{ athlete().overall_compliance }}%
                </span>
              </div>
            </div>
          </section>

          <!-- Red Flags Alert -->
          @if (athlete().red_flags && athlete().red_flags.length > 0) {
            <section class="red-flags">
              <div class="flag-header">
                <i-lucide name="alert-circle" class="icon"></i-lucide>
                <h3>Red Flags</h3>
              </div>
              <ul class="flag-list">
                @for (flag of athlete().red_flags; track flag) {
                  <li>{{ flag }}</li>
                }
              </ul>
            </section>
          }

          <!-- Phase Progress -->
          <section class="phase-progress">
            <h3>Phase Progress: {{ phaseDetails().phase_name }}</h3>
            <div class="phase-info">
              <div class="timeline">
                <span class="weeks">
                  {{ phaseDetails().weeks_elapsed }}/{{ phaseDetails().target_duration_weeks }} weeks
                </span>
              </div>
              <div class="progress-bar">
                <div
                  class="filled"
                  [style.width.%]="phaseDetails().completion_percent"
                ></div>
              </div>
              <span class="percent">{{ phaseDetails().completion_percent }}%</span>
            </div>

            <!-- Milestones -->
            @if (phaseDetails().key_milestones && phaseDetails().key_milestones.length > 0) {
              <div class="milestones">
                <h4>Key Milestones</h4>
                <ul class="milestone-list">
                  @for (milestone of phaseDetails().key_milestones; track milestone.milestone) {
                    <li [class.achieved]="milestone.achieved">
                      <span class="checkbox">
                        @if (milestone.achieved) {
                          <i-lucide name="check" size="16"></i-lucide>
                        }
                      </span>
                      <span class="text">{{ milestone.milestone }}</span>
                      @if (milestone.achieved_date) {
                        <span class="date">{{ formatDate(milestone.achieved_date) }}</span>
                      }
                    </li>
                  }
                </ul>
              </div>
            }
          </section>

          <!-- Exercise Compliance -->
          @if (phaseDetails().exercises && phaseDetails().exercises.length > 0) {
            <section class="exercise-section">
              <h3>Exercise Prescription & Compliance</h3>
              <div class="exercises-grid">
                @for (exercise of phaseDetails().exercises; track exercise.exercise_id) {
                  <div class="exercise-card" [class.ready-to-progress]="exercise.progression_ready">
                    <div class="exercise-header">
                      <h4>{{ exercise.exercise_name }}</h4>
                      @if (exercise.progression_ready) {
                        <span class="badge ready">Ready to Progress</span>
                      }
                    </div>

                    <div class="exercise-details">
                      <div class="detail-row">
                        <span class="label">Prescription</span>
                        <span class="value">
                          {{ exercise.prescribed_sets }} × {{ exercise.prescribed_reps }}
                        </span>
                      </div>
                      <div class="detail-row">
                        <span class="label">Completed</span>
                        <span class="value">{{ exercise.actual_sets_completed }}/{{ exercise.prescribed_sets }} sets</span>
                      </div>
                      <div class="detail-row">
                        <span class="label">Compliance</span>
                        <div class="compliance-bar">
                          <div
                            class="filled"
                            [style.width.%]="exercise.compliance_percent"
                            [class.excellent]="exercise.compliance_percent >= 90"
                            [class.good]="exercise.compliance_percent >= 70 && exercise.compliance_percent < 90"
                            [class.fair]="exercise.compliance_percent < 70"
                          ></div>
                        </div>
                        <span class="percent">{{ exercise.compliance_percent }}%</span>
                      </div>
                    </div>

                    <div class="pain-assessment">
                      <span class="label">Pain During Exercise</span>
                      <div class="pain-scale">
                        <div class="pain-bar">
                          <div
                            class="filled"
                            [style.width.%]="(exercise.pain_during_exercise / 10) * 100"
                            [class.acceptable]="exercise.pain_during_exercise <= 3"
                            [class.elevated]="exercise.pain_during_exercise > 3 && exercise.pain_during_exercise <= 6"
                            [class.concerning]="exercise.pain_during_exercise > 6"
                          ></div>
                        </div>
                        <span class="pain-value">{{ exercise.pain_during_exercise }}/10</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Recommendations -->
          @if (athlete().recommendations && athlete().recommendations.length > 0) {
            <section class="recommendations">
              <div class="rec-header">
                <i-lucide name="lightbulb" class="icon"></i-lucide>
                <h3>Clinical Recommendations</h3>
              </div>
              <ul class="rec-list">
                @for (rec of athlete().recommendations; track rec) {
                  <li>{{ rec }}</li>
                }
              </ul>
            </section>
          }

          <div class="last-updated">
            <p>Last updated: {{ lastUpdated() }}</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .physio-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--s-5);
        background: var(--surface);
        min-height: 100vh;
      }

      .header {
        margin-bottom: var(--s-6);
      }

      .header h1 {
        font-size: var(--fs-xl);
        color: var(--text-strong);
        margin: 0 0 var(--s-2) 0;
      }

      .subtitle {
        color: var(--text-muted);
        font-size: var(--fs-sm);
        margin: 0;
      }

      .loading,
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        gap: var(--s-3);
        color: var(--text-muted);
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--surface-2);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .error-state {
        color: var(--danger);
        gap: var(--s-2);
      }

      .content {
        display: flex;
        flex-direction: column;
        gap: var(--s-5);
      }

      section {
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: var(--s-4);
      }

      section h3 {
        font-size: var(--fs-md);
        color: var(--text-strong);
        margin: 0 0 var(--s-3) 0;
      }

      /* Athlete Header */
      .athlete-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, var(--accent-soft), var(--surface-2));
        border-color: var(--accent-faint);
      }

      .athlete-info h2 {
        font-size: var(--fs-lg);
        color: var(--text-strong);
        margin: 0 0 var(--s-1) 0;
      }

      .injury-info {
        color: var(--text-muted);
        font-size: var(--fs-sm);
        margin: 0;
      }

      .compliance-summary {
        display: flex;
        gap: var(--s-3);
      }

      .compliance-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-1);
        padding: var(--s-3);
        background: var(--surface);
        border-radius: var(--r-md);
        border: 1px solid var(--border);
      }

      .compliance-badge .label {
        font-size: var(--fs-xs);
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .compliance-badge .value {
        font-size: var(--fs-xl);
        font-weight: var(--fw-bold);
      }

      .compliance-badge .value.excellent {
        color: var(--good);
      }

      .compliance-badge .value.good {
        color: var(--accent);
      }

      .compliance-badge .value.fair {
        color: var(--warn);
      }

      /* Red Flags */
      .red-flags {
        background: color-mix(in srgb, var(--danger) 10%, transparent);
        border-color: var(--danger);
        border-left: 4px solid var(--danger);
      }

      .flag-header {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        margin-bottom: var(--s-2);
      }

      .flag-header .icon {
        color: var(--danger);
      }

      .flag-header h3 {
        color: var(--danger);
        margin: 0;
      }

      .flag-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .flag-list li {
        padding-left: var(--s-3);
        color: var(--text-strong);
        font-size: var(--fs-sm);
        position: relative;
      }

      .flag-list li::before {
        content: "⚠";
        position: absolute;
        left: 0;
        color: var(--danger);
      }

      /* Phase Progress */
      .phase-progress h3 {
        margin-bottom: var(--s-3);
      }

      .phase-info {
        display: flex;
        align-items: center;
        gap: var(--s-3);
        margin-bottom: var(--s-4);
      }

      .timeline {
        min-width: 120px;
        font-size: var(--fs-sm);
        color: var(--text-muted);
      }

      .progress-bar {
        flex: 1;
        height: 8px;
        background: var(--surface);
        border-radius: var(--r-pill);
        overflow: hidden;
      }

      .progress-bar .filled {
        height: 100%;
        background: var(--accent);
        border-radius: var(--r-pill);
        transition: width 0.3s ease;
      }

      .percent {
        min-width: 50px;
        text-align: right;
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .milestones {
        margin-top: var(--s-4);
      }

      .milestones h4 {
        font-size: var(--fs-sm);
        color: var(--text-strong);
        margin: 0 0 var(--s-2) 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .milestone-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .milestone-list li {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        padding: var(--s-2);
        background: var(--surface);
        border-radius: var(--r-sm);
        border: 1px solid var(--border);
        opacity: 0.6;
        transition: all 0.2s ease;
      }

      .milestone-list li.achieved {
        opacity: 1;
        border-color: var(--good);
        background: color-mix(in srgb, var(--good) 10%, transparent);
      }

      .checkbox {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        border: 2px solid var(--border);
        color: var(--text-muted);
        flex-shrink: 0;
      }

      .milestone-list li.achieved .checkbox {
        background: var(--good);
        border-color: var(--good);
        color: white;
      }

      .text {
        flex: 1;
        color: var(--text-strong);
        font-size: var(--fs-sm);
      }

      .date {
        font-size: var(--fs-xs);
        color: var(--text-faint);
      }

      /* Exercise Section */
      .exercise-section {
      }

      .exercises-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--s-3);
      }

      .exercise-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        padding: var(--s-3);
        display: flex;
        flex-direction: column;
        gap: var(--s-3);
        transition: all 0.2s ease;
      }

      .exercise-card.ready-to-progress {
        border-color: var(--good);
        background: color-mix(in srgb, var(--good) 5%, transparent);
      }

      .exercise-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--s-2);
      }

      .exercise-header h4 {
        margin: 0;
        font-size: var(--fs-sm);
        color: var(--text-strong);
      }

      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: var(--r-sm);
        font-size: var(--fs-xs);
        font-weight: var(--fw-bold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .badge.ready {
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
      }

      .exercise-details {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--fs-sm);
      }

      .detail-row .label {
        color: var(--text-muted);
      }

      .detail-row .value {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .compliance-bar {
        flex: 1;
        height: 6px;
        background: var(--surface-2);
        border-radius: var(--r-pill);
        overflow: hidden;
      }

      .compliance-bar .filled {
        height: 100%;
        border-radius: var(--r-pill);
        transition: width 0.3s ease;
      }

      .compliance-bar .filled.excellent {
        background: var(--good);
      }

      .compliance-bar .filled.good {
        background: var(--accent);
      }

      .compliance-bar .filled.fair {
        background: var(--warn);
      }

      .percent {
        font-size: var(--fs-xs);
        font-weight: var(--fw-bold);
        min-width: 40px;
        text-align: right;
      }

      .pain-assessment {
        padding: var(--s-2);
        background: var(--surface-2);
        border-radius: var(--r-sm);
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .pain-assessment .label {
        font-size: var(--fs-xs);
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .pain-scale {
        display: flex;
        align-items: center;
        gap: var(--s-2);
      }

      .pain-bar {
        flex: 1;
        height: 6px;
        background: var(--surface);
        border-radius: var(--r-pill);
        overflow: hidden;
      }

      .pain-bar .filled {
        height: 100%;
        border-radius: var(--r-pill);
      }

      .pain-bar .filled.acceptable {
        background: var(--good);
      }

      .pain-bar .filled.elevated {
        background: var(--warn);
      }

      .pain-bar .filled.concerning {
        background: var(--danger);
      }

      .pain-value {
        font-weight: var(--fw-bold);
        min-width: 40px;
        text-align: right;
      }

      /* Recommendations */
      .recommendations {
        background: color-mix(in srgb, var(--accent) 10%, transparent);
        border-color: var(--accent-faint);
      }

      .rec-header {
        display: flex;
        align-items: center;
        gap: var(--s-2);
        margin-bottom: var(--s-3);
      }

      .rec-header .icon {
        color: var(--accent);
      }

      .rec-header h3 {
        color: var(--text-strong);
        margin: 0;
      }

      .rec-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .rec-list li {
        padding-left: var(--s-3);
        color: var(--text-strong);
        font-size: var(--fs-sm);
        position: relative;
      }

      .rec-list li::before {
        content: "→";
        position: absolute;
        left: 0;
        color: var(--accent);
        font-weight: var(--fw-bold);
      }

      /* Last Updated */
      .last-updated {
        text-align: center;
        color: var(--text-faint);
        font-size: var(--fs-xs);
        padding: var(--s-3);
      }

      .last-updated p {
        margin: 0;
      }
    `,
  ],
})
export class PhysioProtocolDashboardComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly athleteData = signal<AthleteRtpStatus | null>(null);
  readonly updatedTime = signal<string>("");

  readonly athlete = computed(() => this.athleteData());
  readonly phaseDetails = computed(() => this.athleteData()?.phase_details || {
    phase: 0,
    phase_name: "Loading...",
    started_date: "",
    target_duration_weeks: 0,
    weeks_elapsed: 0,
    completion_percent: 0,
    key_milestones: [],
    exercises: [],
  });

  readonly lastUpdated = computed(() => {
    if (this.updatedTime()) {
      const date = new Date(this.updatedTime());
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "—";
  });

  constructor() {
    this.fetchProtocolData();
  }

  private fetchProtocolData(): void {
    this.api.get<PhysioResponse>("/api/physio-protocol").subscribe({
      next: (apiResponse) => {
        const response = extractApiPayload<PhysioResponse>(apiResponse);
        if (response?.athlete) {
          this.athleteData.set(response.athlete);
          this.updatedTime.set(response.lastUpdated);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error("physio_protocol_fetch_failed", err);
        this.error.set("Failed to load protocol data");
        this.loading.set(false);
      },
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}
