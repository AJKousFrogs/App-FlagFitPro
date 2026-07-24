import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { switchMap, tap, catchError, finalize } from "rxjs/operators";
import { of } from "rxjs";

import { LoggerService } from "../core/services/logger.service";
import {
  RtpService,
  ProtocolAssignmentResponse,
  AdvancePhaseResponse,
} from "./services/rtp.service";
import { RtpAssessmentModalComponent } from "./rtp-assessment-modal.component";

interface FunctionalCriterion {
  id: string;
  criteria_name: string;
  criteria_type: string;
  target_value: string;
  measurement_method: string;
  pass_threshold: string;
  phase_required: number;
  latestAssessment?: {
    criteria_id: string;
    assessed_value: string;
    pass_fail: boolean;
    assessed_date: string;
  } | null;
}

interface ProtocolPhaseDetail {
  id: string;
  phase_number: number;
  phase_name: string;
  week_start: number;
  week_end: number;
  acwr_target_min: number;
  acwr_target_max: number;
  description: string;
  activities: string[];
  restrictions: string[];
  pain_level_max: number;
  key_milestones: string;
}

interface ProtocolDefinition {
  id: string;
  injury_type: string;
  display_name: string;
  evidence_grade: string;
  typical_rtp_timeline_days_min: number;
  typical_rtp_timeline_days_max: number;
  rts_rate_percent: number;
  description: string;
  key_studies: string[];
}

interface ProtocolAssignment {
  id: string;
  athlete_id: string;
  injury_id: string;
  protocol_id: string;
  current_phase: number;
  phase_start_date: string;
  estimated_return_date: string | null;
  individual_modifiers: Record<string, unknown> | null;
  biological_maturity_gate_passed: boolean;
  created_at: string;
  updated_at: string;
  rtp_protocol_definitions: ProtocolDefinition;
  currentPhase?: ProtocolPhaseDetail | null;
  criteria: FunctionalCriterion[];
}

/**
 * Physiotherapist Protocol Dashboard
 * Route: /staff/physio-protocol/:athleteId/:injuryId
 * Phase 1D: Evidence-based RTP protocol with criteria-based advancement
 * Audience: Physiotherapist, rehabilitation specialist
 */
@Component({
  selector: "app-physio-protocol-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule, RtpAssessmentModalComponent],
  template: `
    <div class="protocol-container">
      <div class="header">
        <h1>Return-to-Play Protocol</h1>
        <p class="subtitle">Evidence-based rehabilitation tracking</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading protocol...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else if (assignment()) {
        <div class="content">
          <!-- Assessment Modal -->
          @if (assessmentModalOpen() && selectedCriterion()) {
            <app-rtp-assessment-modal
              [criterion]="selectedCriterion()!"
              [assignmentId]="assignment()!.id"
              (assessmentSubmitted)="onAssessmentSubmitted($event)"
              (modalClosed)="onModalClosed()"
            />
          }

          <!-- Protocol Overview -->
          <section class="protocol-overview">
            <div class="overview-grid">
              <div class="card">
                <div class="card-label">Injury</div>
                <div class="card-value">
                  {{ assignment()!.rtp_protocol_definitions.display_name }}
                </div>
                <div class="card-detail">
                  Grade:
                  {{ assignment()!.rtp_protocol_definitions.evidence_grade }}
                </div>
              </div>

              <div class="card">
                <div class="card-label">Current Phase</div>
                <div class="card-value">
                  {{ assignment()!.current_phase }}/5
                </div>
                <div class="card-detail">
                  {{ assignment()!.currentPhase?.phase_name || "Loading..." }}
                </div>
              </div>

              <div class="card">
                <div class="card-label">Estimated Return</div>
                <div class="card-value">{{ daysToReturn() }}d</div>
                <div class="card-detail">
                  {{ assignment()!.estimated_return_date | date: "MMM dd" }}
                </div>
              </div>

              <div class="card">
                <div class="card-label">RTS Rate</div>
                <div class="card-value">
                  {{ assignment()!.rtp_protocol_definitions.rts_rate_percent }}%
                </div>
                <div class="card-detail">Successful return probability</div>
              </div>
            </div>
          </section>

          <!-- Current Phase Details -->
          @if (assignment()!.currentPhase) {
            <section class="phase-section">
              <h2>{{ assignment()!.currentPhase!.phase_name }}</h2>
              <p class="phase-description">
                {{ assignment()!.currentPhase!.description }}
              </p>

              <div class="phase-grid">
                <div class="phase-card">
                  <h3>ACWR Target</h3>
                  <div class="acwr-range">
                    {{ assignment()!.currentPhase!.acwr_target_min }} –
                    {{ assignment()!.currentPhase!.acwr_target_max }}
                  </div>
                  <p>Coaching load guidance for this phase</p>
                </div>

                <div class="phase-card">
                  <h3>Recommended Activities</h3>
                  <ul class="activity-list">
                    @for (
                      activity of assignment()!.currentPhase!.activities;
                      track $index
                    ) {
                      <li>{{ activity }}</li>
                    }
                  </ul>
                </div>

                <div class="phase-card">
                  <h3>Contraindications</h3>
                  <ul class="restriction-list">
                    @for (
                      restriction of assignment()!.currentPhase!.restrictions;
                      track $index
                    ) {
                      <li>{{ restriction }}</li>
                    }
                  </ul>
                </div>

                <div class="phase-card">
                  <h3>Key Milestones</h3>
                  <p>{{ assignment()!.currentPhase!.key_milestones }}</p>
                </div>
              </div>
            </section>
          }

          <!-- Functional Criteria -->
          <section class="criteria-section">
            <h2>Functional Criteria Assessment</h2>
            <p class="criteria-intro">
              Complete criteria for phase advancement. All required criteria
              must pass before advancing.
            </p>

            <div class="criteria-list">
              @for (criterion of assignment()!.criteria; track criterion.id) {
                <div class="criteria-card">
                  <div class="criteria-header">
                    <h3>{{ criterion.criteria_name }}</h3>
                    <span class="type-badge">{{
                      criterion.criteria_type
                    }}</span>
                  </div>

                  <div class="criteria-details">
                    <p><strong>Target:</strong> {{ criterion.target_value }}</p>
                    <p>
                      <strong>Method:</strong>
                      {{ criterion.measurement_method }}
                    </p>
                    <p>
                      <strong>Threshold:</strong> {{ criterion.pass_threshold }}
                    </p>
                  </div>

                  <div class="assessment-status">
                    @if (criterion.latestAssessment) {
                      <div class="assessed">
                        <span
                          class="status-badge"
                          [ngClass]="
                            criterion.latestAssessment.pass_fail
                              ? 'pass'
                              : 'fail'
                          "
                        >
                          {{
                            criterion.latestAssessment.pass_fail
                              ? "✓ Passed"
                              : "✗ Failed"
                          }}
                        </span>
                        <div class="assessment-value">
                          {{ criterion.latestAssessment.assessed_value }}
                          <span class="date"
                            >({{
                              criterion.latestAssessment.assessed_date
                                | date: "MMM dd"
                            }})</span
                          >
                        </div>
                      </div>
                    } @else {
                      <div class="pending">
                        <span class="status-badge pending">⊝ Pending</span>
                      </div>
                    }
                  </div>

                  <button
                    class="record-btn"
                    (click)="onRecordAssessment(criterion)"
                  >
                    Record Assessment
                  </button>
                </div>
              }
            </div>
          </section>

          <!-- Phase Advancement -->
          @if (assignment()!.current_phase < 5) {
            <section class="advancement-section">
              <h2>Phase Advancement</h2>
              <p>{{ advancement() }}</p>
              @if (canAdvance()) {
                <button class="advance-btn primary" (click)="onAdvancePhase()">
                  Advance to Phase {{ assignment()!.current_phase + 1 }}
                </button>
              } @else {
                <button class="advance-btn disabled" disabled>
                  Criteria not yet met
                </button>
              }
            </section>
          } @else {
            <div class="completion-banner">
              <h2>✓ Return to Sport Complete</h2>
              <p>
                Athlete has cleared all protocol phases and is approved for full
                participation.
              </p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .protocol-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background: var(--surface);
        min-height: 100vh;
      }

      .header {
        margin-bottom: 30px;
      }

      .header h1 {
        font-size: 28px;
        font-weight: 600;
        margin: 0 0 5px 0;
      }

      .subtitle {
        color: #666;
        font-size: 14px;
        margin: 0;
      }

      .loading,
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e0e0e0;
        border-top-color: #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .content {
        display: flex;
        flex-direction: column;
        gap: 30px;
      }

      h2 {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 15px 0;
        padding-bottom: 10px;
        border-bottom: 2px solid #f0f0f0;
      }

      /* Overview Cards */
      .overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 15px;
      }

      .card {
        background: #f9f9f9;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #007bff;
      }

      .card-label {
        font-size: 11px;
        text-transform: uppercase;
        color: #999;
        letter-spacing: 0.5px;
        margin-bottom: 5px;
      }

      .card-value {
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 5px;
      }

      .card-detail {
        font-size: 12px;
        color: #666;
      }

      /* Phase Section */
      .phase-section {
        background: #f9f9f9;
        padding: 20px;
        border-radius: 8px;
      }

      .phase-description {
        color: #555;
        margin: 10px 0 20px 0;
        line-height: 1.5;
      }

      .phase-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
      }

      .phase-card {
        background: white;
        padding: 15px;
        border-radius: 6px;
        border-left: 3px solid #28a745;
      }

      .phase-card h3 {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 600;
      }

      .acwr-range {
        font-size: 20px;
        font-weight: 600;
        color: #28a745;
        margin-bottom: 5px;
      }

      .activity-list,
      .restriction-list {
        margin: 0;
        padding-left: 20px;
      }

      .activity-list li,
      .restriction-list li {
        margin-bottom: 8px;
        font-size: 13px;
        color: #555;
      }

      /* Criteria Section */
      .criteria-intro {
        color: #666;
        margin: 0 0 20px 0;
      }

      .criteria-list {
        display: grid;
        gap: 15px;
      }

      .criteria-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 15px;
      }

      .criteria-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .criteria-header h3 {
        margin: 0;
        font-size: 16px;
      }

      .type-badge {
        display: inline-block;
        background: #e3f2fd;
        color: #1976d2;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .criteria-details {
        margin: 12px 0;
        padding: 12px;
        background: #f9f9f9;
        border-radius: 6px;
      }

      .criteria-details p {
        margin: 5px 0;
        font-size: 13px;
        color: #555;
      }

      .assessment-status {
        margin: 12px 0;
      }

      .assessed,
      .pending {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        min-width: 80px;
        text-align: center;
      }

      .status-badge.pass {
        background: #d4edda;
        color: #155724;
      }

      .status-badge.fail {
        background: #f8d7da;
        color: #721c24;
      }

      .status-badge.pending {
        background: #fff3cd;
        color: #856404;
      }

      .assessment-value {
        font-size: 13px;
        color: #555;
      }

      .date {
        color: #999;
        font-size: 12px;
        margin-left: 5px;
      }

      .record-btn {
        width: 100%;
        margin-top: 10px;
        padding: 8px 12px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
      }

      .record-btn:hover {
        background: #0056b3;
      }

      /* Advancement Section */
      .advancement-section {
        background: #e3f2fd;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #1976d2;
      }

      .advancement-section p {
        margin: 0 0 15px 0;
        color: #555;
      }

      .advance-btn {
        width: 100%;
        padding: 10px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
      }

      .advance-btn.primary {
        background: #28a745;
        color: white;
      }

      .advance-btn.primary:hover {
        background: #218838;
      }

      .advance-btn.disabled {
        background: #e0e0e0;
        color: #999;
        cursor: not-allowed;
      }

      .completion-banner {
        background: #d4edda;
        border: 2px solid #28a745;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
      }

      .completion-banner h2 {
        color: #155724;
        border: none;
        margin-bottom: 10px;
      }

      .completion-banner p {
        margin: 0;
        color: #155724;
      }
    `,
  ],
})
export class PhysioProtocolDashboardComponent implements OnInit {
  private rtpService = inject(RtpService);
  private route = inject(ActivatedRoute);
  private logger = inject(LoggerService);

  loading = signal(false);
  error = signal<string | null>(null);
  assignment = signal<ProtocolAssignment | null>(null);
  assessmentModalOpen = signal(false);
  selectedCriterion = signal<FunctionalCriterion | null>(null);

  daysToReturn = computed(() => {
    const a = this.assignment();
    if (!a?.estimated_return_date) return 0;
    const returnDate = new Date(a.estimated_return_date);
    const today = new Date();
    return Math.ceil(
      (returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  });

  advancement = computed(() => {
    const a = this.assignment();
    if (!a) return "";
    const criteria = a.criteria.filter(
      (c) => c.phase_required <= a.current_phase,
    );
    const passed = criteria.filter((c) => c.latestAssessment?.pass_fail).length;
    return `${passed}/${criteria.length} criteria passed for phase ${a.current_phase}`;
  });

  canAdvance = computed(() => {
    const a = this.assignment();
    if (!a || a.current_phase >= 5) return false;
    const nextPhase = a.current_phase + 1;
    const nextCriteria = a.criteria.filter(
      (c) => c.phase_required === nextPhase,
    );
    if (!nextCriteria.length) return true;
    return nextCriteria.every((c) => c.latestAssessment?.pass_fail);
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.route.params
      .pipe(
        switchMap(({ athleteId, injuryId }) =>
          this.rtpService.getProtocolAssignment(athleteId, injuryId),
        ),
        tap((res: ProtocolAssignmentResponse) => {
          if (res?.assignment) {
            this.assignment.set(res.assignment);
          } else {
            this.error.set("No protocol found for this injury");
          }
        }),
        catchError(() => {
          this.logger.error("Failed to load protocol");
          this.error.set("Failed to load protocol");
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  onRecordAssessment(criterion: FunctionalCriterion): void {
    this.selectedCriterion.set(criterion);
    this.assessmentModalOpen.set(true);
    this.logger.debug("Assessment modal opened for", criterion.criteria_name);
  }

  onModalClosed(): void {
    this.assessmentModalOpen.set(false);
    this.selectedCriterion.set(null);
  }

  onAssessmentSubmitted(event: {
    criteriaId: string;
    assessedValue: string;
    pass_fail: boolean;
    phaseAdvancementEligible: boolean;
  }): void {
    this.logger.info("Assessment recorded", event);

    const a = this.assignment();
    if (!a) return;

    const updatedCriteria = a.criteria.map((c) => {
      if (c.id === event.criteriaId) {
        return {
          ...c,
          latestAssessment: {
            criteria_id: event.criteriaId,
            assessed_value: event.assessedValue,
            pass_fail: event.pass_fail,
            assessed_date: new Date().toISOString(),
          },
        };
      }
      return c;
    });

    this.assignment.set({
      ...a,
      criteria: updatedCriteria,
    });

    this.assessmentModalOpen.set(false);
    this.selectedCriterion.set(null);

    if (event.phaseAdvancementEligible) {
      this.logger.info("Criteria complete for phase advancement");
    }
  }

  onAdvancePhase(): void {
    const a = this.assignment();
    if (!a) return;

    this.loading.set(true);
    this.rtpService.advancePhase(a.athlete_id, a.injury_id).subscribe({
      next: (res: AdvancePhaseResponse) => {
        if (res?.success && res?.assignment) {
          this.assignment.set(res.assignment);
          this.logger.info("Phase advanced successfully");
        }
        this.loading.set(false);
      },
      error: () => {
        this.logger.error("Failed to advance phase");
        this.error.set("Failed to advance phase");
        this.loading.set(false);
      },
    });
  }
}
