import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { RtpService, RtpPhaseProgress, PsychologicalAssessment } from "./services/rtp.service";
import { LoggerService } from "../core/services/logger.service";

interface PhaseInfo {
  phase: number;
  name: string;
  duration: string;
  description: string;
}

const PHASES: PhaseInfo[] = [
  { phase: 0, name: "Protect", duration: "0-2w", description: "Immobilization & passive ROM" },
  { phase: 1, name: "ROM", duration: "2-8w", description: "Restore range of motion" },
  { phase: 2, name: "Strength", duration: "8-16w", description: "Build isometric strength" },
  { phase: 3, name: "Power", duration: "16-28w", description: "Plyometric & power development" },
  { phase: 4, name: "Sport", duration: "28-52w", description: "Sport-specific drills" },
  { phase: 5, name: "Return", duration: "52w+", description: "Full return & maintenance" },
];

/**
 * Athlete RTP Progress Dashboard
 * Route: /return-to-play/:injuryId
 * Displays injury summary, phase progression, functional criteria, weekly progress, and readiness gates.
 */
@Component({
  selector: "app-rtp-progress-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="dashboard">
      <div class="header">
        <h1>Return to Play</h1>
        <p class="subtitle">Track recovery milestones and functional criteria</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading injury data...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else if (latestProgress(); as latest) {
        <div class="content">
          <!-- Injury Summary Card -->
          <section class="injury-summary">
            <div class="summary-card">
              <div class="summary-header">
                <div>
                  <h2>{{ injuryType() }}</h2>
                  <p class="location">{{ injuryLocation() }}</p>
                </div>
                <div class="dates">
                  <p><strong>Injured:</strong> {{ injuryDate() }}</p>
                  <p><strong>Expected Return:</strong> {{ expectedReturnDate() }}</p>
                </div>
              </div>
              <div class="summary-details">
                <div class="detail-group">
                  <span class="label">Current Phase</span>
                  <span class="value">{{ currentPhaseLabel() }}</span>
                </div>
                <div class="detail-group">
                  <span class="label">Progress</span>
                  <span class="value">{{ weeksInRecovery() }} weeks / ~52w target</span>
                </div>
                <div class="progress-bar">
                  <div class="filled" [style.width.%]="progressPercentage()"></div>
                </div>
              </div>
            </div>
          </section>

          <!-- Phase Progression Timeline -->
          <section class="phase-timeline">
            <h3>Phase Progression</h3>
            <div class="timeline">
              @for (p of PHASES; track p.phase) {
                <div
                  class="phase-marker"
                  [class.completed]="p.phase < currentPhase()"
                  [class.current]="p.phase === currentPhase()"
                  [title]="p.description"
                >
                  <div class="pip">
                    @if (p.phase < currentPhase()) {
                      <i-lucide name="check" size="14"></i-lucide>
                    } @else if (p.phase === currentPhase()) {
                      <span>{{ p.phase }}</span>
                    } @else {
                      <span>{{ p.phase }}</span>
                    }
                  </div>
                  <div class="label">
                    <strong>{{ p.name }}</strong>
                    <small>{{ p.duration }}</small>
                  </div>
                </div>
              }
            </div>
            <p class="phase-info">
              Current: Phase {{ currentPhase() }} / {{ currentPhaseLabel() }}
            </p>
          </section>

          <!-- Functional Criteria Grid -->
          <section class="criteria-grid">
            <h3>Functional Criteria Compliance</h3>
            <div class="criteria-list">
              <div class="criterion">
                <div class="criterion-header">
                  <span class="name">Strength LSI</span>
                  <span class="value">
                    {{ strengthLsiPercent() }}%
                    <span class="target">(target: ≥90%)</span>
                  </span>
                </div>
                <div class="bar-container">
                  <div class="bar">
                    <div
                      class="filled"
                      [style.width.%]="strengthLsiPercent()"
                      [class.met]="strengthLsiPercent() >= 90"
                    ></div>
                  </div>
                  <div class="target-line" style="left: 90%"></div>
                </div>
              </div>

              <div class="criterion">
                <div class="criterion-header">
                  <span class="name">Hop Test Battery</span>
                  <span class="value">
                    {{ hopTestPercent() }}%
                    <span class="target">(target: ≥90%)</span>
                  </span>
                </div>
                <div class="bar-container">
                  <div class="bar">
                    <div
                      class="filled"
                      [style.width.%]="hopTestPercent()"
                      [class.met]="hopTestPercent() >= 90"
                    ></div>
                  </div>
                  <div class="target-line" style="left: 90%"></div>
                </div>
              </div>

              <div class="criterion">
                <div class="criterion-header">
                  <span class="name">ACL-RSI (Psychological)</span>
                  <span class="value">
                    {{ aclRsiScore() }}/100
                    <span class="target">(target: ≥56)</span>
                  </span>
                </div>
                <div class="bar-container">
                  <div class="bar">
                    <div
                      class="filled"
                      [style.width.%]="(aclRsiScore() / 100) * 100"
                      [class.met]="aclRsiScore() >= 56"
                    ></div>
                  </div>
                  <div class="target-line" [style.left.%]="56"></div>
                </div>
              </div>

              <div class="criterion">
                <div class="criterion-header">
                  <span class="name">TSK-11 (Fear-Avoidance)</span>
                  <span class="value">
                    {{ tsk11Score() }}/55
                    <span class="target">(target: &lt;37)</span>
                  </span>
                </div>
                <div class="bar-container">
                  <div class="bar">
                    <div
                      class="filled"
                      [style.width.%]="(tsk11Score() / 55) * 100"
                      [class.inverted]="true"
                      [class.met]="tsk11Score() < 37"
                    ></div>
                  </div>
                  <div class="target-line" [style.left.%]="(37 / 55) * 100"></div>
                </div>
              </div>

              @if (latest.biomechanics_symmetrical !== null) {
                <div class="criterion">
                  <div class="criterion-header">
                    <span class="name">Biomechanics Symmetry</span>
                    <span class="value">
                      @if (latest.biomechanics_symmetrical) {
                        <span class="badge good">✓ Symmetrical</span>
                      } @else {
                        <span class="badge warn">✗ Asymmetrical</span>
                      }
                    </span>
                  </div>
                </div>
              }
            </div>

            <div class="readiness-summary">
              <div class="readiness-card">
                <span class="label">Overall Readiness</span>
                <span class="percentage">{{ overallReadiness() }}%</span>
                @if (readinessGap() > 0) {
                  <p class="gap-message">
                    Not ready yet — {{ readinessGap() }}% gap to advance
                  </p>
                }
              </div>
            </div>
          </section>

          <!-- Weekly Progress Card -->
          <section class="weekly-progress">
            <h3>This Week's Progress</h3>
            <div class="progress-card">
              <div class="week-info">
                <span>Week ending {{ weekEnding() }}</span>
              </div>

              <form (ngSubmit)="submitWeeklyUpdate()" #weeklyForm="ngForm">
                <div class="form-group">
                  <label for="painLevel">Pain Level (0-10)</label>
                  <div class="pain-input">
                    <input
                      id="painLevel"
                      type="range"
                      min="0"
                      max="10"
                      [(ngModel)]="painLevel"
                      name="painLevel"
                      class="slider"
                    />
                    <span class="value">{{ painLevel() }}/10</span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="athleteConfidence">Athlete Confidence (0-10)</label>
                  <div class="confidence-input">
                    <input
                      id="athleteConfidence"
                      type="range"
                      min="0"
                      max="10"
                      [(ngModel)]="athleteConfidence"
                      name="athleteConfidence"
                      class="slider"
                    />
                    <span class="value">{{ athleteConfidence() }}/10</span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="coachConfidence">Coach Confidence (0-10)</label>
                  <div class="confidence-input">
                    <input
                      id="coachConfidence"
                      type="range"
                      min="0"
                      max="10"
                      [(ngModel)]="coachConfidence"
                      name="coachConfidence"
                      class="slider"
                    />
                    <span class="value">{{ coachConfidence() }}/10</span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="coachNotes">Coach Notes</label>
                  <textarea
                    id="coachNotes"
                    [(ngModel)]="coachNotes"
                    name="coachNotes"
                    placeholder="Add any observations or notes about this week's progress"
                    class="notes-input"
                  ></textarea>
                </div>

                <div class="form-actions">
                  <button
                    type="submit"
                    [disabled]="submitting()"
                    class="btn-primary"
                  >
                    {{ submitting() ? "Saving..." : "Save Weekly Update" }}
                  </button>
                </div>
              </form>

              @if (submitMessage()) {
                <div class="message" [class.error]="isError()">
                  {{ submitMessage() }}
                </div>
              }
            </div>
          </section>

          <!-- Assessment History Table -->
          <section class="assessment-history">
            <h3>Assessment History</h3>
            @if (assessmentHistory().length > 0) {
              <div class="table-container">
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>ACL-RSI</th>
                      <th>TSK-11</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (assessment of assessmentHistory(); track assessment.id) {
                      <tr>
                        <td>{{ formatDate(assessment.assessment_date) }}</td>
                        <td>{{ assessment.acl_rsi_score }}/100</td>
                        <td>{{ assessment.tsk11_score }}/55</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="empty-state">
                <p>No assessment history yet</p>
              </div>
            }
          </section>

          <!-- Readiness Gate Button -->
          <section class="readiness-gate">
            <button
              (click)="advancePhase()"
              [disabled]="!canAdvancePhase() || submitting()"
              class="btn-advance"
              [class.disabled]="!canAdvancePhase()"
            >
              @if (canAdvancePhase()) {
                <span>✓ Ready for Phase {{ currentPhase() + 1 }}</span>
              } @else {
                <span>⧖ Not ready yet — complete criteria first</span>
              }
            </button>
          </section>
        </div>
      } @else {
        <div class="empty-state">
          <p>No injury data found</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .dashboard {
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
      .error-state,
      .empty-state {
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
        gap: var(--s-6);
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

      /* Injury Summary Card */
      .injury-summary {
        background: linear-gradient(135deg, var(--accent-soft), var(--surface-2));
        border-color: var(--accent-faint);
      }

      .summary-card {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
      }

      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--s-4);
      }

      .summary-header h2 {
        font-size: var(--fs-lg);
        color: var(--text-strong);
        margin: 0 0 var(--s-1) 0;
      }

      .summary-header .location {
        color: var(--text-muted);
        font-size: var(--fs-sm);
        margin: 0;
      }

      .dates {
        text-align: right;
        font-size: var(--fs-sm);
      }

      .dates p {
        margin: var(--s-1) 0;
        color: var(--text-muted);
      }

      .summary-details {
        display: flex;
        gap: var(--s-4);
        align-items: center;
      }

      .detail-group {
        display: flex;
        flex-direction: column;
        gap: var(--s-1);
      }

      .detail-group .label {
        font-size: var(--fs-xs);
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .detail-group .value {
        font-size: var(--fs-md);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
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

      /* Phase Timeline */
      .timeline {
        display: flex;
        gap: var(--s-2);
        align-items: center;
        overflow-x: auto;
        padding: var(--s-2) 0;
      }

      .phase-marker {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-2);
        flex: 0 0 auto;
        text-align: center;
      }

      .phase-marker .pip {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--surface);
        color: var(--text-muted);
        border: 2px solid var(--border);
        font-weight: var(--fw-bold);
        font-size: var(--fs-sm);
        transition: all 0.3s ease;
      }

      .phase-marker.completed .pip {
        background: var(--good);
        color: var(--surface);
        border-color: var(--good);
      }

      .phase-marker.current .pip {
        background: var(--accent);
        color: var(--on-accent);
        border-color: var(--accent);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 20%, transparent);
      }

      .phase-marker .label {
        font-size: var(--fs-xs);
        min-width: 60px;
      }

      .phase-marker .label strong {
        display: block;
        color: var(--text-strong);
      }

      .phase-marker .label small {
        color: var(--text-faint);
        font-size: var(--fs-xs);
      }

      .phase-info {
        color: var(--text-muted);
        font-size: var(--fs-sm);
        text-align: center;
        margin-top: var(--s-3);
      }

      /* Functional Criteria Grid */
      .criteria-list {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
      }

      .criterion {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
        padding: var(--s-3);
        background: var(--surface);
        border-radius: var(--r-md);
        border: 1px solid var(--border);
      }

      .criterion-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .criterion-header .name {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .criterion-header .value {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .target {
        font-size: var(--fs-xs);
        color: var(--text-muted);
        font-weight: normal;
      }

      .bar-container {
        position: relative;
        height: 20px;
      }

      .bar {
        height: 100%;
        background: var(--surface-2);
        border-radius: var(--r-pill);
        overflow: hidden;
      }

      .bar .filled {
        height: 100%;
        background: var(--warn);
        border-radius: var(--r-pill);
        transition: width 0.3s ease;
      }

      .bar .filled.met {
        background: var(--good);
      }

      .bar .filled.inverted {
        background: var(--good);
      }

      .target-line {
        position: absolute;
        top: 0;
        width: 2px;
        height: 100%;
        background: var(--accent);
        opacity: 0.5;
      }

      .badge {
        display: inline-block;
        padding: var(--s-1) var(--s-2);
        border-radius: var(--r-sm);
        font-size: var(--fs-xs);
        font-weight: var(--fw-bold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .badge.good {
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
      }

      .badge.warn {
        background: color-mix(in srgb, var(--warn) 20%, transparent);
        color: var(--warn);
      }

      .readiness-summary {
        display: flex;
        justify-content: center;
        margin-top: var(--s-4);
      }

      .readiness-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-2);
        background: var(--accent-soft);
        border: 1px solid var(--accent-faint);
        border-radius: var(--r-md);
        padding: var(--s-3);
        min-width: 250px;
      }

      .readiness-card .label {
        font-size: var(--fs-xs);
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .readiness-card .percentage {
        font-size: var(--fs-xl);
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .gap-message {
        font-size: var(--fs-sm);
        color: var(--text-muted);
        margin: 0;
      }

      /* Weekly Progress Card */
      .weekly-progress {
      }

      .progress-card {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
      }

      .week-info {
        font-size: var(--fs-sm);
        color: var(--text-muted);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      .form-group label {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
        font-size: var(--fs-sm);
      }

      .pain-input,
      .confidence-input {
        display: flex;
        align-items: center;
        gap: var(--s-3);
      }

      .slider {
        flex: 1;
        height: 6px;
        border-radius: var(--r-pill);
        background: var(--surface);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--accent);
        cursor: pointer;
        border: 2px solid var(--surface);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--accent);
        cursor: pointer;
        border: 2px solid var(--surface);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .slider::-webkit-slider-thumb:hover {
        background: var(--accent-strong);
      }

      .slider::-moz-range-thumb:hover {
        background: var(--accent-strong);
      }

      .value {
        font-weight: var(--fw-bold);
        color: var(--text-strong);
        min-width: 40px;
        text-align: right;
      }

      .notes-input {
        width: 100%;
        min-height: 100px;
        padding: var(--s-2);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--surface);
        color: var(--text-strong);
        font-family: var(--font-body);
        font-size: var(--fs-sm);
        resize: vertical;
      }

      .notes-input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
      }

      .form-actions {
        display: flex;
        gap: var(--s-3);
        justify-content: flex-end;
      }

      .btn-primary,
      .btn-advance {
        padding: var(--s-2) var(--s-4);
        border: none;
        border-radius: var(--r-md);
        font-weight: var(--fw-bold);
        font-size: var(--fs-sm);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-primary {
        background: var(--accent);
        color: var(--on-accent);
      }

      .btn-primary:hover:not(:disabled) {
        background: var(--accent-strong);
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .message {
        padding: var(--s-3);
        border-radius: var(--r-md);
        background: color-mix(in srgb, var(--good) 20%, transparent);
        color: var(--good);
        font-size: var(--fs-sm);
        border: 1px solid color-mix(in srgb, var(--good) 40%, transparent);
      }

      .message.error {
        background: color-mix(in srgb, var(--danger) 20%, transparent);
        color: var(--danger);
        border-color: color-mix(in srgb, var(--danger) 40%, transparent);
      }

      /* Assessment History */
      .table-container {
        overflow-x: auto;
      }

      .history-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--fs-sm);
      }

      .history-table thead {
        background: var(--surface);
        border-bottom: 2px solid var(--border);
      }

      .history-table th {
        padding: var(--s-3);
        text-align: left;
        font-weight: var(--fw-bold);
        color: var(--text-strong);
      }

      .history-table td {
        padding: var(--s-3);
        border-bottom: 1px solid var(--border);
        color: var(--text-muted);
      }

      .history-table tbody tr:hover {
        background: color-mix(in srgb, var(--accent) 10%, transparent);
      }

      /* Readiness Gate */
      .readiness-gate {
        display: flex;
        justify-content: center;
        margin-top: var(--s-6);
      }

      .btn-advance {
        min-width: 300px;
        padding: var(--s-3) var(--s-5);
        background: var(--good);
        color: var(--surface);
        font-size: var(--fs-md);
      }

      .btn-advance:hover:not(:disabled) {
        background: var(--good-strong);
      }

      .btn-advance:disabled,
      .btn-advance.disabled {
        background: var(--surface-2);
        color: var(--text-muted);
        cursor: not-allowed;
        opacity: 0.6;
      }
    `,
  ],
})
export class RtpProgressDashboardComponent {
  private readonly rtpService = inject(RtpService);
  private readonly logger = inject(LoggerService);
  private readonly route = inject(ActivatedRoute);

  readonly PHASES = PHASES;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly latestProgress = signal<RtpPhaseProgress | null>(null);
  readonly assessmentHistory = signal<PsychologicalAssessment[]>([]);
  readonly injuryId = signal<string>("");
  readonly athleteId = signal<string>("");

  // Form fields for weekly update
  readonly painLevel = signal(5);
  readonly athleteConfidence = signal(7);
  readonly coachConfidence = signal(6);
  readonly coachNotes = signal("");

  // Submission state
  readonly submitting = signal(false);
  readonly submitMessage = signal<string | null>(null);
  readonly isError = signal(false);

  constructor() {
    const injId = this.route.snapshot.paramMap.get("injuryId");
    const athId = this.route.snapshot.paramMap.get("athleteId") || "";

    if (injId) {
      this.injuryId.set(injId);
      this.athleteId.set(athId);
      this.fetchData();
    } else {
      this.error.set("Missing injury ID");
      this.loading.set(false);
    }
  }

  private fetchData(): void {
    const injuryId = this.injuryId();
    const athleteId = this.athleteId();

    if (!injuryId) return;

    // Pass athleteId if provided (for coaches viewing an athlete's data)
    // Otherwise backend uses auth context for current user
    this.rtpService.getRtpProgress(athleteId, injuryId).subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          this.latestProgress.set(response.data[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error("rtp_progress_fetch_failed", err);
        this.error.set("Failed to load RTP progress data");
        this.loading.set(false);
      },
    });

    this.rtpService.getPsychologicalAssessments(athleteId, 12).subscribe({
      next: (response) => {
        this.assessmentHistory.set(response.data);
      },
      error: (err) => {
        this.logger.error("psych_assessment_fetch_failed", err);
      },
    });
  }

  // Computed properties for display
  readonly injuryType = computed(() => this.latestProgress()?.injury_id ?? "Unknown Injury");
  readonly injuryLocation = computed(() => "TBD from athlete_injuries");
  readonly injuryDate = computed(() => "TBD");
  readonly expectedReturnDate = computed(() => "TBD");
  readonly weekEnding = computed(() => this.latestProgress()?.week_ending ?? "TBD");

  readonly currentPhase = computed(() => this.latestProgress()?.current_rtp_phase ?? 0);
  readonly currentPhaseLabel = computed(() => {
    const phase = this.currentPhase();
    const phaseInfo = PHASES.find((p) => p.phase === phase);
    return phaseInfo ? phaseInfo.name : `Phase ${phase}`;
  });

  readonly weeksInRecovery = computed(() => {
    const progress = this.latestProgress();
    return progress ? Math.ceil((new Date().getTime() - new Date(progress.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)) : 0;
  });

  readonly progressPercentage = computed(() => {
    const weeks = this.weeksInRecovery();
    return Math.min((weeks / 52) * 100, 100);
  });

  readonly strengthLsiPercent = computed(() => this.latestProgress()?.strength_lsi_pct ?? 0);
  readonly hopTestPercent = computed(() => this.latestProgress()?.hop_test_battery_pct ?? 0);
  readonly aclRsiScore = computed(() => this.latestProgress()?.acl_rsi_pct ?? 0);
  readonly tsk11Score = computed(() => this.latestProgress()?.tsk11_normalized ? 32 : 40);

  readonly overallReadiness = computed(() => {
    const strength = this.strengthLsiPercent() / 100;
    const hop = this.hopTestPercent() / 100;
    const aclRsi = this.aclRsiScore() / 100;
    const tsk11 = Math.max(0, 1 - this.tsk11Score() / 55);
    const biomechanics = this.latestProgress()?.biomechanics_symmetrical ? 1 : 0.7;
    return Math.round((strength + hop + aclRsi + tsk11 + biomechanics) / 5 * 100);
  });

  readonly readinessGap = computed(() => {
    const readiness = this.overallReadiness();
    return Math.max(0, 100 - readiness);
  });

  readonly canAdvancePhase = computed(() => {
    return (
      this.strengthLsiPercent() >= 90 &&
      this.hopTestPercent() >= 90 &&
      this.aclRsiScore() >= 56 &&
      this.tsk11Score() < 37 &&
      this.latestProgress()?.biomechanics_symmetrical
    );
  });

  submitWeeklyUpdate(): void {
    this.submitting.set(true);
    this.submitMessage.set(null);

    const payload: Partial<RtpPhaseProgress> = {
      user_id: this.athleteId(),
      injury_id: this.injuryId(),
      pain_level_0_10: this.painLevel(),
      athlete_confidence_1_10: this.athleteConfidence(),
      coach_confidence_1_10: this.coachConfidence(),
      coach_notes: this.coachNotes() || null,
    };

    this.rtpService.updateRtpProgress(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitMessage.set("Weekly update saved successfully!");
        this.isError.set(false);
        setTimeout(() => this.submitMessage.set(null), 3000);
        this.fetchData();
      },
      error: (err) => {
        this.submitting.set(false);
        this.logger.error("weekly_update_failed", err);
        this.submitMessage.set("Failed to save update. Try again.");
        this.isError.set(true);
      },
    });
  }

  advancePhase(): void {
    if (!this.canAdvancePhase() || this.submitting()) return;

    this.submitting.set(true);
    const payload: Partial<RtpPhaseProgress> = {
      user_id: this.athleteId(),
      injury_id: this.injuryId(),
      current_rtp_phase: this.currentPhase() + 1,
      ready_for_next_phase: true,
    };

    this.rtpService.updateRtpProgress(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitMessage.set(`Advanced to Phase ${this.currentPhase() + 1}!`);
        this.isError.set(false);
        setTimeout(() => this.submitMessage.set(null), 3000);
        this.fetchData();
      },
      error: (err) => {
        this.submitting.set(false);
        this.logger.error("phase_advance_failed", err);
        this.submitMessage.set("Failed to advance phase. Try again.");
        this.isError.set(true);
      },
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}
