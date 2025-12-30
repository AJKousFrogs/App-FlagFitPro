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
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { AccordionModule } from "primeng/accordion";
import { DividerModule } from "primeng/divider";
import { CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { DailyTrainingService, DailyTrainingResponse } from "../../../core/services/daily-training.service";
import { AuthService } from "../../../core/services/auth.service";
import { HeaderService } from "../../../core/services/header.service";
import { LoggerService } from "../../../core/services/logger.service";

interface WarmupPhase {
  name: string;
  duration: number;
  exercises: Array<{
    name: string;
    duration?: string;
    sets?: number;
    reps?: number | string;
    distance?: string;
    focus?: string;
    intensity?: string;
    variations?: string[];
    movements?: string[];
    breakdown?: Array<{ variation: string; duration: string }>;
  }>;
}

interface PlyometricExercise {
  exercise_name: string;
  description: string;
  difficulty_level: string;
  instructions: string[];
  recommended_contacts: number;
  session_sets: number;
  session_reps: number;
  intensity_level: string;
  safety_notes: string[];
}

interface IsometricExercise {
  name: string;
  description: string;
  category: string;
  setup_instructions: string;
  execution_cues: string[];
  session_duration: number;
  session_sets: number;
  rest_between_sets: number;
  difficulty_level: string;
}

interface ScheduleBlock {
  block: string;
  duration: number;
  completed: boolean;
  protocol?: {
    title: string;
    totalDuration: number;
    phases: WarmupPhase[];
  };
  exercises?: PlyometricExercise[] | IsometricExercise[];
  totalContacts?: number;
  totalDuration?: number;
  notes?: string;
  purpose?: string;
  type?: string;
  focus?: string[];
  activities?: string[];
}

@Component({
  selector: "app-daily-training",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    AccordionModule,
    DividerModule,
    CheckboxModule,
    FormsModule,
    MainLayoutComponent,
  ],
  template: `
    <app-main-layout>
      <div class="daily-training">
        <!-- Greeting Header -->
        <div class="greeting-section">
          <div class="greeting-content">
            <h1 class="greeting-text">{{ greeting() }}</h1>
            <p class="date-text">{{ dayOfWeek() }}, {{ formattedDate() }}</p>
          </div>
          <div class="motivation-badge">
            <i class="pi pi-bolt"></i>
            <span>{{ motivationalMessage() }}</span>
          </div>
        </div>

        <!-- Seasonal Context Banner -->
        @if (seasonalContext()) {
          <div class="seasonal-banner" [class]="'season-' + seasonalContext()?.season">
            <div class="seasonal-icon">
              <i [class]="getSeasonIcon()"></i>
            </div>
            <div class="seasonal-info">
              <span class="seasonal-focus">{{ seasonalContext()?.primaryFocus }}</span>
              @if (seasonalContext()?.coachingNotes) {
                <span class="seasonal-notes">{{ seasonalContext()?.coachingNotes }}</span>
              }
            </div>
            @if (!seasonalContext()?.outdoorSprintSuitable) {
              <div class="weather-warning">
                <i class="pi pi-cloud"></i>
                <span>Indoor training recommended</span>
              </div>
            }
          </div>
        }

        <!-- Training Status Overview -->
        <div class="status-cards">
          <div class="status-card phase-card">
            <div class="status-icon">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="status-info">
              <span class="status-label">Training Phase</span>
              <span class="status-value">{{ trainingPhase() }}</span>
            </div>
          </div>

          <div class="status-card acwr-card" [class.optimal]="isAcwrOptimal()" [class.warning]="!isAcwrOptimal()">
            <div class="status-icon">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="status-info">
              <span class="status-label">ACWR</span>
              <span class="status-value">{{ acwr() }}</span>
              <span class="status-subtitle">{{ acwrStatus() }}</span>
            </div>
          </div>

          <div class="status-card session-card">
            <div class="status-icon">
              <i class="pi pi-flag"></i>
            </div>
            <div class="status-info">
              <span class="status-label">Today's Focus</span>
              <span class="status-value">{{ sessionType() }}</span>
            </div>
          </div>
          
          <div class="status-card position-card">
            <div class="status-icon">
              <i class="pi pi-user"></i>
            </div>
            <div class="status-info">
              <span class="status-label">Position</span>
              <span class="status-value">{{ playerPosition() }}</span>
            </div>
          </div>

          <div class="status-card duration-card">
            <div class="status-icon">
              <i class="pi pi-clock"></i>
            </div>
            <div class="status-info">
              <span class="status-label">Total Duration</span>
              <span class="status-value">{{ totalDuration() }} min</span>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <div class="progress-header">
            <span>Session Progress</span>
            <span class="progress-text">{{ completedBlocks() }}/{{ totalBlocks() }} blocks completed</span>
          </div>
          <p-progressBar [value]="progressPercentage()" [showValue]="false"></p-progressBar>
        </div>

        <!-- Session Focus Areas -->
        @if (sessionFocus().length > 0) {
          <div class="focus-section">
            <h3>Today's Focus Areas</h3>
            <div class="focus-tags">
              @for (focus of sessionFocus(); track focus) {
                <p-tag [value]="focus" severity="info"></p-tag>
              }
            </div>
          </div>
        }

        <!-- Training Schedule Blocks -->
        <div class="schedule-section">
          @for (block of scheduleBlocks(); track block.block; let i = $index) {
            <p-card class="schedule-block" [class.completed]="block.completed">
              <div class="block-header">
                <div class="block-info">
                  <div class="block-number">{{ i + 1 }}</div>
                  <div class="block-details">
                    <h3>{{ block.block }}</h3>
                    <span class="block-duration">{{ block.duration }} minutes</span>
                  </div>
                </div>
                <div class="block-actions">
                  <p-checkbox
                    [(ngModel)]="block.completed"
                    [binary]="true"
                    (onChange)="markBlockComplete(block.block, block.completed)"
                  ></p-checkbox>
                  @if (block.completed) {
                    <i class="pi pi-check-circle completed-icon"></i>
                  }
                </div>
              </div>

              <!-- Warm-Up Protocol -->
              @if (block.block === 'Warm-Up' && block.protocol) {
                <p-accordion [multiple]="true">
                  @for (phase of block.protocol.phases; track phase.name) {
                    <p-accordion-panel [value]="phase.name">
                      <p-accordion-header>{{ phase.name }} ({{ phase.duration }} min)</p-accordion-header>
                      <p-accordion-content>
                        <div class="exercise-list">
                          @for (exercise of phase.exercises; track exercise.name) {
                            <div class="exercise-item">
                              <div class="exercise-name">{{ exercise.name }}</div>
                              <div class="exercise-details">
                                @if (exercise.duration) {
                                  <span class="detail-badge">{{ exercise.duration }}</span>
                                }
                                @if (exercise.sets && exercise.reps) {
                                  <span class="detail-badge">{{ exercise.sets }}×{{ exercise.reps }}</span>
                                }
                                @if (exercise.distance) {
                                  <span class="detail-badge">{{ exercise.distance }}</span>
                                }
                                @if (exercise.focus) {
                                  <span class="focus-badge">{{ exercise.focus }}</span>
                                }
                              </div>
                              @if (exercise.variations) {
                                <div class="variations">
                                  @for (v of exercise.variations; track v) {
                                    <span class="variation-tag">{{ v }}</span>
                                  }
                                </div>
                              }
                              @if (exercise.breakdown) {
                                <div class="breakdown">
                                  @for (b of exercise.breakdown; track b.variation) {
                                    <span class="breakdown-item">{{ b.variation }}: {{ b.duration }}</span>
                                  }
                                </div>
                              }
                            </div>
                          }
                        </div>
                      </p-accordion-content>
                    </p-accordion-panel>
                  }
                </p-accordion>
              }

              <!-- Plyometrics Block -->
              @if (block.block === 'Plyometrics' && block.exercises) {
                <div class="block-summary">
                  <span class="summary-item">
                    <i class="pi pi-bolt"></i>
                    Total Contacts: {{ block.totalContacts }}
                  </span>
                  @if (block.notes) {
                    <span class="summary-note">{{ block.notes }}</span>
                  }
                </div>
                <p-accordion [multiple]="true">
                  @for (exercise of asPlyoExercises(block.exercises); track exercise.exercise_name) {
                    <p-accordion-panel [value]="exercise.exercise_name">
                      <p-accordion-header>{{ exercise.exercise_name }}</p-accordion-header>
                      <p-accordion-content>
                        <div class="exercise-detail-card">
                          <p class="exercise-description">{{ exercise.description }}</p>
                          <div class="exercise-meta">
                            <p-tag [value]="exercise.difficulty_level" [severity]="getDifficultySeverity(exercise.difficulty_level)"></p-tag>
                            <span class="meta-item">{{ exercise.session_sets }} sets × {{ exercise.session_reps }} reps</span>
                            <span class="meta-item">{{ exercise.recommended_contacts }} contacts</span>
                          </div>
                          <div class="instructions">
                            <h4>Instructions</h4>
                            <ol>
                              @for (instruction of exercise.instructions; track instruction) {
                                <li>{{ instruction }}</li>
                              }
                            </ol>
                          </div>
                          @if (exercise.safety_notes.length) {
                            <div class="safety-notes">
                              <h4><i class="pi pi-exclamation-triangle"></i> Safety Notes</h4>
                              <ul>
                                @for (note of exercise.safety_notes; track note) {
                                  <li>{{ note }}</li>
                                }
                              </ul>
                            </div>
                          }
                        </div>
                      </p-accordion-content>
                    </p-accordion-panel>
                  }
                </p-accordion>
              }

              <!-- Isometrics Block -->
              @if (block.block === 'Isometrics' && block.exercises) {
                <div class="block-summary">
                  <span class="summary-item">
                    <i class="pi pi-stopwatch"></i>
                    Total Hold Time: {{ block.totalDuration }}s
                  </span>
                  @if (block.purpose) {
                    <span class="summary-note">{{ block.purpose }}</span>
                  }
                </div>
                <p-accordion [multiple]="true">
                  @for (exercise of asIsoExercises(block.exercises); track exercise.name) {
                    <p-accordion-panel [value]="exercise.name">
                      <p-accordion-header>{{ exercise.name }}</p-accordion-header>
                      <p-accordion-content>
                        <div class="exercise-detail-card">
                          <p class="exercise-description">{{ exercise.description }}</p>
                          <div class="exercise-meta">
                            <p-tag [value]="exercise.difficulty_level" [severity]="getDifficultySeverity(exercise.difficulty_level)"></p-tag>
                            <p-tag [value]="exercise.category" severity="secondary"></p-tag>
                            <span class="meta-item">{{ exercise.session_sets }} sets × {{ exercise.session_duration }}s hold</span>
                            <span class="meta-item">{{ exercise.rest_between_sets }}s rest</span>
                          </div>
                          <div class="setup">
                            <h4>Setup</h4>
                            <p>{{ exercise.setup_instructions }}</p>
                          </div>
                          @if (exercise.execution_cues.length) {
                            <div class="cues">
                              <h4>Execution Cues</h4>
                              <div class="cue-tags">
                                @for (cue of exercise.execution_cues; track cue) {
                                  <span class="cue-tag">{{ cue }}</span>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      </p-accordion-content>
                    </p-accordion-panel>
                  }
                </p-accordion>
              }

              <!-- Main Session Block -->
              @if (block.block === 'Main Session') {
                <div class="main-session-content">
                  <div class="session-type-badge">
                    <i class="pi pi-star"></i>
                    {{ block.type | titlecase }} Session
                  </div>
                  @if (block.focus) {
                    <div class="session-focus">
                      <h4>Focus Areas</h4>
                      <div class="focus-list">
                        @for (f of block.focus; track f) {
                          <div class="focus-item">
                            <i class="pi pi-check"></i>
                            {{ f }}
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Cool-Down Block -->
              @if (block.block === 'Cool-Down' && block.activities) {
                <div class="cooldown-content">
                  <div class="activity-list">
                    @for (activity of block.activities; track activity) {
                      <div class="activity-item">
                        <i class="pi pi-circle-fill"></i>
                        {{ activity }}
                      </div>
                    }
                  </div>
                </div>
              }
            </p-card>
          }
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="loading-overlay">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading your training plan...</span>
          </div>
        }
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .daily-training {
        padding: var(--space-6);
        max-width: 1200px;
        margin: 0 auto;
      }

      /* Greeting Section */
      .greeting-section {
        background: linear-gradient(135deg, var(--p-primary-600) 0%, var(--p-primary-800) 100%);
        border-radius: 16px;
        padding: var(--space-8);
        margin-bottom: var(--space-6);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-4);
      }

      .greeting-text {
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 var(--space-2) 0;
        font-family: 'Space Grotesk', sans-serif;
      }

      .date-text {
        font-size: 1.1rem;
        opacity: 0.9;
        margin: 0;
      }

      .motivation-badge {
        background: rgba(255, 255, 255, 0.15);
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: var(--space-4) var(--space-6);
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: 0.95rem;
        max-width: 400px;
      }

      .motivation-badge i {
        font-size: 1.25rem;
        color: var(--p-yellow-400);
      }

      /* Seasonal Banner */
      .seasonal-banner {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4) var(--space-6);
        border-radius: 12px;
        margin-bottom: var(--space-6);
        flex-wrap: wrap;
      }

      .seasonal-banner.season-winter {
        background: linear-gradient(135deg, var(--p-blue-50) 0%, var(--p-cyan-50) 100%);
        border: 1px solid var(--p-blue-200);
      }

      .seasonal-banner.season-spring {
        background: linear-gradient(135deg, var(--p-green-50) 0%, var(--p-lime-50) 100%);
        border: 1px solid var(--p-green-200);
      }

      .seasonal-banner.season-summer {
        background: linear-gradient(135deg, var(--p-yellow-50) 0%, var(--p-orange-50) 100%);
        border: 1px solid var(--p-yellow-200);
      }

      .seasonal-banner.season-fall {
        background: linear-gradient(135deg, var(--p-orange-50) 0%, var(--p-amber-50) 100%);
        border: 1px solid var(--p-orange-200);
      }

      .seasonal-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }

      .season-winter .seasonal-icon {
        background: var(--p-blue-100);
        color: var(--p-blue-600);
      }

      .season-spring .seasonal-icon {
        background: var(--p-green-100);
        color: var(--p-green-600);
      }

      .season-summer .seasonal-icon {
        background: var(--p-yellow-100);
        color: var(--p-yellow-700);
      }

      .season-fall .seasonal-icon {
        background: var(--p-orange-100);
        color: var(--p-orange-600);
      }

      .seasonal-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .seasonal-focus {
        font-weight: 600;
        font-size: 1rem;
        color: var(--text-primary);
      }

      .seasonal-notes {
        font-size: 0.85rem;
        color: var(--text-secondary);
        line-height: 1.4;
      }

      .weather-warning {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        background: var(--p-blue-100);
        color: var(--p-blue-700);
        padding: var(--space-2) var(--space-4);
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
      }

      .weather-warning i {
        font-size: 1rem;
      }

      /* Status Cards */
      .status-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .status-card {
        background: var(--p-surface-card);
        border-radius: 12px;
        padding: var(--space-5);
        display: flex;
        align-items: center;
        gap: var(--space-4);
        border: 1px solid var(--p-surface-200);
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .status-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .status-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }

      .phase-card .status-icon {
        background: var(--p-blue-50);
        color: var(--p-blue-600);
      }

      .acwr-card .status-icon {
        background: var(--p-green-50);
        color: var(--p-green-600);
      }

      .acwr-card.warning .status-icon {
        background: var(--p-orange-50);
        color: var(--p-orange-600);
      }

      .session-card .status-icon {
        background: var(--p-purple-50);
        color: var(--p-purple-600);
      }

      .duration-card .status-icon {
        background: var(--p-teal-50);
        color: var(--p-teal-600);
      }

      .position-card .status-icon {
        background: var(--p-indigo-50);
        color: var(--p-indigo-600);
      }

      .status-info {
        display: flex;
        flex-direction: column;
      }

      .status-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .status-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .status-subtitle {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      /* Progress Section */
      .progress-section {
        background: var(--p-surface-card);
        border-radius: 12px;
        padding: var(--space-5);
        margin-bottom: var(--space-6);
        border: 1px solid var(--p-surface-200);
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-3);
        font-weight: 600;
      }

      .progress-text {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      /* Focus Section */
      .focus-section {
        margin-bottom: var(--space-6);
      }

      .focus-section h3 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: var(--space-3);
        color: var(--text-primary);
      }

      .focus-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      /* Schedule Blocks */
      .schedule-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .schedule-block {
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s;
      }

      .schedule-block.completed {
        opacity: 0.8;
        background: var(--p-green-50);
      }

      .block-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
      }

      .block-info {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .block-number {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--p-primary-100);
        color: var(--p-primary-700);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1rem;
      }

      .block-details h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .block-duration {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .block-actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .completed-icon {
        color: var(--p-green-500);
        font-size: 1.5rem;
      }

      /* Exercise List */
      .exercise-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .exercise-item {
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: 8px;
      }

      .exercise-name {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      .exercise-details {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .detail-badge {
        background: var(--p-surface-200);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .focus-badge {
        background: var(--p-primary-100);
        color: var(--p-primary-700);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
      }

      .variations, .breakdown {
        margin-top: var(--space-2);
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
      }

      .variation-tag {
        background: var(--p-blue-50);
        color: var(--p-blue-700);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.7rem;
      }

      .breakdown-item {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      /* Block Summary */
      .block-summary {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: 8px;
      }

      .summary-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-weight: 600;
        color: var(--text-primary);
      }

      .summary-item i {
        color: var(--p-primary-500);
      }

      .summary-note {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-style: italic;
      }

      /* Exercise Detail Card */
      .exercise-detail-card {
        padding: var(--space-4);
      }

      .exercise-description {
        color: var(--text-secondary);
        margin-bottom: var(--space-4);
        line-height: 1.6;
      }

      .exercise-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .meta-item {
        font-size: 0.875rem;
        color: var(--text-secondary);
        background: var(--p-surface-100);
        padding: 4px 12px;
        border-radius: 20px;
      }

      .instructions, .setup, .cues {
        margin-top: var(--space-4);
      }

      .instructions h4, .setup h4, .cues h4, .safety-notes h4 {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      .instructions ol {
        padding-left: var(--space-5);
        color: var(--text-secondary);
      }

      .instructions li {
        margin-bottom: var(--space-2);
      }

      .safety-notes {
        margin-top: var(--space-4);
        padding: var(--space-4);
        background: var(--p-orange-50);
        border-radius: 8px;
        border-left: 4px solid var(--p-orange-400);
      }

      .safety-notes h4 {
        color: var(--p-orange-700);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .safety-notes ul {
        padding-left: var(--space-5);
        color: var(--p-orange-800);
        margin: 0;
      }

      .cue-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .cue-tag {
        background: var(--p-primary-50);
        color: var(--p-primary-700);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
      }

      /* Main Session Content */
      .main-session-content {
        padding: var(--space-4);
      }

      .session-type-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        background: var(--p-purple-100);
        color: var(--p-purple-700);
        padding: var(--space-2) var(--space-4);
        border-radius: 20px;
        font-weight: 600;
        margin-bottom: var(--space-4);
      }

      .session-focus h4 {
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: var(--space-3);
      }

      .focus-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .focus-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--text-secondary);
      }

      .focus-item i {
        color: var(--p-green-500);
        font-size: 0.75rem;
      }

      /* Cool-Down Content */
      .cooldown-content {
        padding: var(--space-3);
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .activity-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        color: var(--text-secondary);
      }

      .activity-item i {
        font-size: 0.5rem;
        color: var(--p-teal-500);
      }

      /* Loading State */
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-4);
        z-index: 1000;
      }

      .loading-overlay i {
        font-size: 3rem;
        color: var(--p-primary-500);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .greeting-section {
          flex-direction: column;
          text-align: center;
        }

        .greeting-text {
          font-size: 1.5rem;
        }

        .motivation-badge {
          max-width: 100%;
        }

        .status-cards {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 480px) {
        .status-cards {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DailyTrainingComponent implements OnInit {
  private dailyTrainingService = inject(DailyTrainingService);
  private authService = inject(AuthService);
  private headerService = inject(HeaderService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  // Signals
  loading = signal(true);
  trainingData = signal<DailyTrainingResponse | null>(null);

  // Computed values
  greeting = computed(() => this.trainingData()?.greeting || "Hello!");
  dayOfWeek = computed(() => this.trainingData()?.dayOfWeek || "");
  formattedDate = computed(() => {
    const date = this.trainingData()?.date;
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  });
  motivationalMessage = computed(
    () => this.trainingData()?.motivationalMessage || "Let's train!"
  );

  trainingPhase = computed(
    () => this.trainingData()?.trainingStatus?.phase || "Loading..."
  );
  acwr = computed(() => this.trainingData()?.trainingStatus?.acwr?.toFixed(2) || "0.00");
  acwrStatus = computed(
    () => this.trainingData()?.trainingStatus?.acwrStatus || ""
  );
  isAcwrOptimal = computed(() => {
    const acwr = this.trainingData()?.trainingStatus?.acwr || 0;
    return acwr >= 0.8 && acwr <= 1.3;
  });

  sessionType = computed(
    () => this.trainingData()?.todaysPractice?.sessionType || "Training"
  );
  totalDuration = computed(
    () => this.trainingData()?.todaysPractice?.totalDuration || 0
  );
  sessionFocus = computed(
    () => this.trainingData()?.todaysPractice?.focus || []
  );

  // Seasonal context
  seasonalContext = computed(() => this.trainingData()?.seasonalContext);
  
  // Player context
  playerPosition = computed(
    () => this.trainingData()?.playerContext?.position?.toUpperCase() || "PLAYER"
  );
  playerExperience = computed(
    () => this.trainingData()?.playerContext?.experienceLevel || "intermediate"
  );

  scheduleBlocks = computed<ScheduleBlock[]>(
    () => (this.trainingData()?.todaysPractice?.schedule as ScheduleBlock[]) || []
  );
  completedBlocks = computed(
    () => this.scheduleBlocks().filter((b) => b.completed).length
  );
  totalBlocks = computed(() => this.scheduleBlocks().length);
  progressPercentage = computed(() => {
    const total = this.totalBlocks();
    if (total === 0) return 0;
    return Math.round((this.completedBlocks() / total) * 100);
  });

  ngOnInit(): void {
    this.headerService.setConfig({
      title: "Daily Training",
      showBackButton: true,
      backRoute: "/dashboard",
    });
    this.loadDailyTraining();
  }

  private loadDailyTraining(): void {
    this.loading.set(true);

    this.dailyTrainingService
      .getDailyTraining()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.trainingData.set(data);
          this.loading.set(false);
          this.logger.info("[DailyTraining] Loaded training plan", data);
        },
        error: (error) => {
          this.logger.error("[DailyTraining] Error loading training plan", error);
          this.loading.set(false);
        },
      });
  }

  markBlockComplete(blockName: string, completed: boolean): void {
    const updateData: Record<string, boolean> = {};

    switch (blockName) {
      case "Warm-Up":
        updateData["warmup_completed"] = completed;
        break;
      case "Plyometrics":
        updateData["plyometrics_included"] = completed;
        break;
      case "Isometrics":
        updateData["isometrics_included"] = completed;
        break;
      case "Main Session":
        updateData["session_completed"] = completed;
        break;
      case "Cool-Down":
        updateData["cooldown_completed"] = completed;
        break;
    }

    this.dailyTrainingService
      .updateTrainingProgress(updateData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.logger.info(`[DailyTraining] Marked ${blockName} as ${completed ? "complete" : "incomplete"}`);
          
          // Dispatch trainingCompleted event for achievements system
          if (completed) {
            const now = new Date();
            const hour = now.getHours();
            
            document.dispatchEvent(new CustomEvent('trainingCompleted', {
              detail: {
                blockName,
                completed: true,
                timestamp: now.toISOString(),
                startTime: now.toISOString(),
                sessionType: this.sessionType(),
                duration: this.totalDuration(),
                isMorning: hour < 8,
                isEvening: hour >= 18,
              }
            }));
            
            this.logger.info(`[DailyTraining] Dispatched trainingCompleted event for ${blockName}`);
            
            // Check if all blocks are completed - dispatch full session completion
            const allBlocks = this.scheduleBlocks();
            const allCompleted = allBlocks.every(b => b.completed);
            
            if (allCompleted && allBlocks.length > 0) {
              document.dispatchEvent(new CustomEvent('trainingSessionCompleted', {
                detail: {
                  sessionType: this.sessionType(),
                  totalDuration: this.totalDuration(),
                  completedAt: now.toISOString(),
                  blocksCompleted: allBlocks.length,
                  isMorning: hour < 8,
                  isEvening: hour >= 18,
                }
              }));
              
              this.logger.info('[DailyTraining] Full session completed! Dispatched trainingSessionCompleted event');
            }
          }
        },
        error: (error) => {
          this.logger.error("[DailyTraining] Error updating progress", error);
        },
      });
  }

  getDifficultySeverity(level: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (level?.toLowerCase()) {
      case "beginner":
        return "success";
      case "intermediate":
        return "info";
      case "advanced":
        return "warn";
      default:
        return "secondary";
    }
  }

  getSeasonIcon(): string {
    const season = this.seasonalContext()?.season;
    switch (season) {
      case "winter":
        return "pi pi-cloud";
      case "spring":
        return "pi pi-sun";
      case "summer":
        return "pi pi-sun";
      case "fall":
        return "pi pi-cloud";
      default:
        return "pi pi-calendar";
    }
  }

  // Type guard helpers for template
  asPlyoExercises(exercises: PlyometricExercise[] | IsometricExercise[]): PlyometricExercise[] {
    return exercises as PlyometricExercise[];
  }

  asIsoExercises(exercises: PlyometricExercise[] | IsometricExercise[]): IsometricExercise[] {
    return exercises as IsometricExercise[];
  }
}
