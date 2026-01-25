import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Card } from "primeng/card";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { InputText } from "primeng/inputtext";

import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { Select } from "primeng/select";
import { MultiSelect } from "primeng/multiselect";
import { Dialog } from "primeng/dialog";
import { Toast } from "primeng/toast";
import { ProgressBar } from "primeng/progressbar";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";
import { Slider } from "primeng/slider";
import { Chip } from "primeng/chip";
import { Skeleton } from "primeng/skeleton";
import { Badge } from "primeng/badge";

import { MessageService , PrimeTemplate } from "primeng/api";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { SearchInputComponent } from "../../shared/components/search-input/search-input.component";
import { formatDate as formatDateValue } from "../../shared/utils/date.utils";
import { getStatusSeverity } from "../../shared/utils/status.utils";
import {
  ExerciseDBService,
  ExerciseDBExercise,
  ExerciseDBFilters,
  ImportStats,
  ImportLog,
  ExerciseApprovalData
} from "../../core/services/exercisedb.service";
import { MobileOptimizedImageDirective } from "../../shared/directives/mobile-optimized-image.directive";
import { capitalize } from "../../shared/utils/format.utils";

@Component({
  selector: "app-exercisedb-manager",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    Card,
    InputText,
    Select,
    MultiSelect,
    Dialog,
    PrimeTemplate,
    Toast,
    ProgressBar,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Slider,
    Chip,
    Skeleton,
    Badge,
    MainLayoutComponent,
    PageHeaderComponent,
    MobileOptimizedImageDirective,
    ButtonComponent,
    StatusTagComponent,
    SearchInputComponent
  ],
  template: `
    <app-main-layout>
      <p-toast></p-toast>
      <div class="exercisedb-manager">
        <app-page-header
          title="Exercise Database Manager"
          subtitle="Curate and manage flag football exercises from ExerciseDB"
          icon="pi-database"
        ></app-page-header>

        <!-- Stats Overview -->
        <div class="stats-grid">
          <p-card styleClass="stat-card">
              <div class="stat-content">
              <i class="pi pi-database stat-icon"></i>
              <div class="stat-details stat-block__content">
                <span class="stat-block__value">{{ totalExercises() }}</span>
                <span class="stat-block__label">Total Exercises</span>
              </div>
            </div>
          </p-card>
          <p-card styleClass="stat-card approved">
            <div class="stat-content">
              <i class="pi pi-check-circle stat-icon"></i>
              <div class="stat-details stat-block__content">
                <span class="stat-block__value">{{ approvedCount() }}</span>
                <span class="stat-block__label">Approved</span>
              </div>
            </div>
          </p-card>
          <p-card styleClass="stat-card pending">
            <div class="stat-content">
              <i class="pi pi-clock stat-icon"></i>
              <div class="stat-details stat-block__content">
                <span class="stat-block__value">{{ pendingCount() }}</span>
                <span class="stat-block__label">Pending Review</span>
              </div>
            </div>
          </p-card>
          <p-card styleClass="stat-card curated">
            <div class="stat-content">
              <i class="pi pi-star stat-icon"></i>
              <div class="stat-details stat-block__content">
                <span class="stat-block__value">{{ curatedCount() }}</span>
                <span class="stat-block__label">Curated</span>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Tab View -->
        <p-tabs value="0" styleClass="exercise-tabs tabs-standard">
          <p-tablist>
            <p-tab value="0">Browse Exercises</p-tab>
            <p-tab value="1">Import from ExerciseDB</p-tab>
            <p-tab value="2">Approval Queue</p-tab>
          </p-tablist>

          <p-tabpanels>
            <!-- Browse Tab -->
            <p-tabpanel value="0">
              <div class="tab-content">
                <!-- Filters -->
                <p-card styleClass="filters-card">
                  <div class="filters-row">
                    <div class="filter-group">
                      <label>Search</label>
                      <app-search-input
                        class="filter-search"
                        [(ngModel)]="searchQuery"
                        (ngModelChange)="onSearchChange()"
                        placeholder="Search exercises..."
                        ariaLabel="Search exercises"
                      />
                    </div>
                    <div class="filter-group">
                      <label for="body-part-filter">Body Part</label>
                      <p-select
                        inputId="body-part-filter"
                        [options]="bodyPartOptions()"
                        [(ngModel)]="selectedBodyPart"
                        placeholder="All Body Parts"
                        [showClear]="true"
                        (onValueChange)="applyFilters()"
                        [attr.aria-label]="'Filter by body part'"
                      ></p-select>
                    </div>
                    <div class="filter-group">
                      <label for="equipment-filter">Equipment</label>
                      <p-select
                        inputId="equipment-filter"
                        [options]="equipmentOptions()"
                        [(ngModel)]="selectedEquipment"
                        placeholder="All Equipment"
                        [showClear]="true"
                        (onValueChange)="applyFilters()"
                        [attr.aria-label]="'Filter by equipment'"
                      ></p-select>
                    </div>
                    <div class="filter-group">
                      <label for="position-filter">Position</label>
                      <p-select
                        inputId="position-filter"
                        [options]="positionOptions"
                        [(ngModel)]="selectedPosition"
                        placeholder="All Positions"
                        [showClear]="true"
                        (onValueChange)="applyFilters()"
                        [attr.aria-label]="'Filter by position'"
                      ></p-select>
                    </div>
                    <div class="filter-group">
                      <label for="category-filter">Category</label>
                      <p-select
                        inputId="category-filter"
                        [options]="categoryOptions()"
                        [(ngModel)]="selectedCategory"
                        placeholder="All Categories"
                        [showClear]="true"
                        (onValueChange)="applyFilters()"
                        [attr.aria-label]="'Filter by category'"
                      ></p-select>
                    </div>
                    <div class="filter-group status-filter">
                      <label for="status-filter">Status</label>
                      <p-select
                        inputId="status-filter"
                        [options]="statusOptions"
                        [(ngModel)]="selectedStatus"
                        (onValueChange)="applyFilters()"
                        [attr.aria-label]="'Filter by status'"
                      ></p-select>
                    </div>
                  </div>
                </p-card>

                <!-- Exercise Grid -->
                @if (loading()) {
                  <div class="exercises-grid">
                    @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                      <p-card styleClass="exercise-card skeleton-card">
                        <p-skeleton height="200px"></p-skeleton>
                        <p-skeleton
                          width="70%"
                          height="1.5rem"
                          styleClass="mt-3"
                        ></p-skeleton>
                        <p-skeleton
                          width="40%"
                          height="1rem"
                          styleClass="mt-2"
                        ></p-skeleton>
                      </p-card>
                    }
                  </div>
                } @else {
                  <div class="exercises-grid">
                    @for (exercise of filteredExercises(); track exercise.id) {
                      <p-card
                        styleClass="exercise-card"
                        (click)="openExerciseDetail(exercise)"
                      >
                        <div class="exercise-image-container">
                          @if (exercise.gif_url) {
                            <img
                              appMobileOptimized
                              [width]="300"
                              [height]="300"
                              [src]="exercise.gif_url"
                              [alt]="exercise.name"
                              class="exercise-gif"
                            />
                          } @else {
                            <div class="exercise-placeholder">
                              <i class="pi pi-image"></i>
                            </div>
                          }
                          <div class="exercise-badges">
                            @if (exercise.is_approved) {
                              <p-badge
                                value="Approved"
                                severity="success"
                                styleClass="status-tag status-tag--success"
                              ></p-badge>
                            }
                            @if (exercise.is_curated && !exercise.is_approved) {
                              <p-badge
                                value="Curated"
                                severity="info"
                              ></p-badge>
                            }
                            @if (exercise.flag_football_relevance) {
                              <p-badge
                                [value]="
                                  exercise.flag_football_relevance + '/10'
                                "
                                [severity]="
                                  getRelevanceSeverity(
                                    exercise.flag_football_relevance
                                  )
                                "
                              ></p-badge>
                            }
                          </div>
                        </div>
                        <div class="exercise-info">
                          <h3 class="exercise-name">{{ exercise.name }}</h3>
                          <div class="exercise-meta">
                            <span class="meta-item">
                              <i class="pi pi-user"></i>
                              {{ exercise.body_part }}
                            </span>
                            <span class="meta-item">
                              <i class="pi pi-cog"></i>
                              {{ exercise.equipment }}
                            </span>
                          </div>
                          @if (exercise.ff_category) {
                            <app-status-tag
                              [value]="exercise.ff_category"
                              severity="info"
                              size="sm"
                            />
                          }
                          @if (exercise.applicable_positions?.length) {
                            <div class="position-chips">
                              @for (
                                pos of exercise.applicable_positions?.slice(
                                  0,
                                  3
                                );
                                track pos
                              ) {
                                <p-chip
                                  [label]="pos"
                                  styleClass="position-chip"
                                ></p-chip>
                              }
                              @if (
                                (exercise.applicable_positions?.length || 0) > 3
                              ) {
                                <span class="more-positions">
                                  +{{
                                    (exercise.applicable_positions?.length ||
                                      0) - 3
                                  }}
                                </span>
                              }
                            </div>
                          }
                        </div>
                      </p-card>
                    }
                  </div>

                  @if (filteredExercises().length === 0) {
                    <div class="empty-state">
                      <i class="pi pi-inbox"></i>
                      <h3>No exercises found</h3>
                      <p>
                        Try adjusting your filters or import exercises from
                        ExerciseDB
                      </p>
                    </div>
                  }
                }
              </div>
            </p-tabpanel>

            <!-- Import Tab -->
            <p-tabpanel value="1">
              <div class="tab-content import-tab">
                <p-card styleClass="import-card">
                  <h3 class="import-title">
                    <i class="pi pi-cloud-download"></i>
                    Import Exercises from ExerciseDB API
                  </h3>
                  <p class="import-description">
                    Import exercises from the ExerciseDB API and automatically
                    categorize them for flag football training. Exercises will
                    be auto-tagged based on body part and target muscle
                    relevance.
                  </p>

                  <div class="import-options">
                    <div class="option-group">
                      <label>Body Parts to Import</label>
                      <p-multiSelect
                        [options]="importBodyPartOptions"
                        [(ngModel)]="importBodyParts"
                        placeholder="Select body parts (leave empty for all)"
                        display="chip"
                        styleClass="import-multiselect"
                      ></p-multiSelect>
                    </div>
                    <div class="option-group">
                      <label for="import-equipment-filter">Equipment Filter</label>
                      <p-select
                        inputId="import-equipment-filter"
                        [options]="importEquipmentOptions"
                        [(ngModel)]="importEquipment"
                        placeholder="All equipment"
                        [showClear]="true"
                        [attr.aria-label]="'Filter import by equipment'"
                      ></p-select>
                    </div>
                    <div class="option-group checkbox-group">
                      <label>
                        <input type="checkbox" [(ngModel)]="autoApprove" />
                        Auto-approve high relevance exercises (8+)
                      </label>
                    </div>
                  </div>

                  @if (importing()) {
                    <div class="import-progress">
                      <p-progressBar
                        mode="indeterminate"
                        styleClass="import-bar"
                      ></p-progressBar>
                      <p class="progress-text">
                        Importing exercises from ExerciseDB...
                      </p>
                    </div>
                  } @else {
                    <app-button iconLeft="pi-download" (clicked)="startImport()"
                      >Start Import</app-button
                    >
                  }

                  @if (lastImportStats()) {
                    <div class="import-results">
                      <h4>Last Import Results</h4>
                      <div class="results-grid">
                        <div class="result-item">
                          <span class="result-value">{{
                            lastImportStats()?.fetched
                          }}</span>
                          <span class="result-label">Fetched</span>
                        </div>
                        <div class="result-item success">
                          <span class="result-value">{{
                            lastImportStats()?.imported
                          }}</span>
                          <span class="result-label">Imported</span>
                        </div>
                        <div class="result-item info">
                          <span class="result-value">{{
                            lastImportStats()?.updated
                          }}</span>
                          <span class="result-label">Updated</span>
                        </div>
                        <div class="result-item warning">
                          <span class="result-value">{{
                            lastImportStats()?.skipped
                          }}</span>
                          <span class="result-label">Skipped</span>
                        </div>
                        @if ((lastImportStats()?.errors || 0) > 0) {
                          <div class="result-item error">
                            <span class="result-value">{{
                              lastImportStats()?.errors
                            }}</span>
                            <span class="result-label">Errors</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </p-card>

                <!-- Import History -->
                <p-card styleClass="history-card">
                  <h3 class="history-title">
                    <i class="pi pi-history"></i>
                    Import History
                  </h3>
                  @if (importLogs().length > 0) {
                    <div class="history-list">
                      @for (log of importLogs(); track log.id) {
                        <div class="history-item">
                          <div class="history-status">
                            <app-status-tag
                              [value]="log.status"
                              [severity]="getStatusSeverity(log.status)"
                              size="sm"
                            />
                          </div>
                          <div class="history-details">
                            <span class="history-type"
                              >{{ log.import_type }} import</span
                            >
                            <span class="history-date">{{
                              formatDate(log.started_at)
                            }}</span>
                          </div>
                          <div class="history-stats">
                            <span>{{ log.total_imported }} imported</span>
                            <span>{{ log.total_updated }} updated</span>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="no-history">No import history yet</p>
                  }
                </p-card>
              </div>
            </p-tabpanel>

            <!-- Approval Queue Tab -->
            <p-tabpanel value="2">
              <div class="tab-content approval-tab">
                <p-card styleClass="queue-info">
                  <p>
                    <i class="pi pi-info-circle"></i>
                    Review and approve exercises for use in training programs.
                    Exercises with high flag football relevance are prioritized.
                  </p>
                </p-card>

                <div class="approval-grid">
                  @for (exercise of pendingExercises(); track exercise.id) {
                    <p-card styleClass="approval-card">
                      <div class="approval-header">
                        @if (exercise.gif_url) {
                          <img
                            appMobileOptimized
                            [width]="200"
                            [height]="200"
                            [src]="exercise.gif_url"
                            [alt]="exercise.name"
                            class="approval-gif"
                          />
                        }
                        <div class="approval-info">
                          <h4>{{ exercise.name }}</h4>
                          <div class="approval-meta">
                            <app-status-tag
                              [value]="exercise.body_part"
                              severity="info"
                              size="sm"
                            />
                            <app-status-tag
                              [value]="exercise.equipment"
                              severity="secondary"
                              size="sm"
                            />
                            <app-status-tag
                              [value]="exercise.target_muscle"
                              severity="secondary"
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                      @if (exercise.ff_category) {
                        <div class="auto-categorization">
                          <span class="label">Auto-categorized as:</span>
                          <strong>{{ exercise.ff_category }}</strong>
                          @if (exercise.flag_football_relevance) {
                            <span class="relevance">
                              (Relevance:
                              {{ exercise.flag_football_relevance }}/10)
                            </span>
                          }
                        </div>
                      }
                      <div class="approval-actions">
                        <app-button
                          variant="success"
                          iconLeft="pi-check"
                          (clicked)="openApprovalDialog(exercise)"
                          >Review & Approve</app-button
                        >
                        <app-button
                          variant="outlined"
                          iconLeft="pi-times"
                          (clicked)="skipExercise(exercise)"
                          >Skip</app-button
                        >
                      </div>
                    </p-card>
                  }
                </div>

                @if (pendingExercises().length === 0) {
                  <div class="empty-state">
                    <i class="pi pi-check-circle"></i>
                    <h3>All caught up!</h3>
                    <p>No exercises pending approval</p>
                  </div>
                }
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>

        <!-- Exercise Detail Dialog -->
        <p-dialog
          [(visible)]="showDetailDialog"
          [header]="selectedExercise()?.name || 'Exercise Details'"
          [modal]="true"
          [draggable]="false"
          [resizable]="false"
          styleClass="exercisedb-detail-dialog"
        >
          @if (selectedExercise()) {
            <div class="detail-content">
              <div class="detail-media">
                @if (selectedExercise()?.gif_url) {
                  <img
                    appMobileOptimized
                    [width]="400"
                    [height]="400"
                    [src]="selectedExercise()?.gif_url"
                    [alt]="selectedExercise()?.name"
                    class="detail-gif"
                  />
                }
              </div>
              <div class="detail-info">
                <div class="detail-section">
                  <h4>Target</h4>
                  <div class="detail-tags">
                    <app-status-tag
                      [value]="selectedExercise()?.body_part || ''"
                      severity="info"
                      size="sm"
                    />
                    <app-status-tag
                      [value]="selectedExercise()?.target_muscle || ''"
                      severity="secondary"
                      size="sm"
                    />
                    <app-status-tag
                      [value]="selectedExercise()?.equipment || ''"
                      severity="secondary"
                      size="sm"
                    />
                  </div>
                </div>

                @if (selectedExercise()?.secondary_muscles?.length) {
                  <div class="detail-section">
                    <h4>Secondary Muscles</h4>
                    <div class="detail-tags">
                      @for (
                        muscle of selectedExercise()?.secondary_muscles;
                        track muscle
                      ) {
                        <p-chip [label]="muscle"></p-chip>
                      }
                    </div>
                  </div>
                }

                @if (selectedExercise()?.ff_category) {
                  <div class="detail-section">
                    <h4>Flag Football Category</h4>
                    <app-status-tag
                      [value]="selectedExercise()?.ff_category || ''"
                      severity="info"
                      size="sm"
                    />
                  </div>
                }

                @if (selectedExercise()?.ff_training_focus?.length) {
                  <div class="detail-section">
                    <h4>Training Focus</h4>
                    <div class="detail-tags">
                      @for (
                        focus of selectedExercise()?.ff_training_focus;
                        track focus
                      ) {
                        <p-chip
                          [label]="focus"
                          styleClass="focus-chip"
                        ></p-chip>
                      }
                    </div>
                  </div>
                }

                @if (selectedExercise()?.applicable_positions?.length) {
                  <div class="detail-section">
                    <h4>Applicable Positions</h4>
                    <div class="detail-tags">
                      @for (
                        pos of selectedExercise()?.applicable_positions;
                        track pos
                      ) {
                        <p-chip
                          [label]="pos"
                          styleClass="position-chip"
                        ></p-chip>
                      }
                    </div>
                  </div>
                }

                @if (selectedExercise()?.instructions?.length) {
                  <div class="detail-section">
                    <h4>Instructions</h4>
                    <ol class="instructions-list">
                      @for (
                        instruction of selectedExercise()?.instructions;
                        track instruction
                      ) {
                        <li>{{ instruction }}</li>
                      }
                    </ol>
                  </div>
                }

                @if (selectedExercise()?.safety_notes?.length) {
                  <div class="detail-section safety">
                    <h4>
                      <i class="pi pi-exclamation-triangle"></i> Safety Notes
                    </h4>
                    <ul>
                      @for (
                        note of selectedExercise()?.safety_notes;
                        track note
                      ) {
                        <li>{{ note }}</li>
                      }
                    </ul>
                  </div>
                }

                @if (selectedExercise()?.coaching_cues?.length) {
                  <div class="detail-section">
                    <h4><i class="pi pi-megaphone"></i> Coaching Cues</h4>
                    <ul>
                      @for (
                        cue of selectedExercise()?.coaching_cues;
                        track cue
                      ) {
                        <li>{{ cue }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>
            </div>
            <ng-template pTemplate="footer">
              @if (!selectedExercise()?.is_approved) {
                <app-button
                  variant="success"
                  iconLeft="pi-check"
                  (clicked)="openApprovalDialog(selectedExercise()!)"
                  >Approve Exercise</app-button
                >
              }
              <app-button
                variant="secondary"
                iconLeft="pi-times"
                (clicked)="showDetailDialog = false"
                >Close</app-button
              >
            </ng-template>
          }
        </p-dialog>

        <!-- Approval Dialog -->
        <p-dialog
          [(visible)]="showApprovalDialog"
          header="Approve Exercise"
          [modal]="true"
          [draggable]="false"
          [resizable]="false"
          styleClass="exercisedb-approval-dialog"
        >
          @if (exerciseToApprove()) {
            <div class="approval-form">
              <h4>{{ exerciseToApprove()?.name }}</h4>

              <div class="form-group">
                <label>Flag Football Relevance (1-10)</label>
                <p-slider
                  [(ngModel)]="approvalData.flag_football_relevance"
                  [min]="1"
                  [max]="10"
                  [step]="1"
                ></p-slider>
                <span class="slider-value"
                  >{{ approvalData.flag_football_relevance }}/10</span
                >
              </div>

              <div class="form-group">
                <label for="approval-category">Category</label>
                <p-select
                  inputId="approval-category"
                  [options]="ffCategoryOptions"
                  [(ngModel)]="approvalData.ff_category"
                  placeholder="Select category"
                  [attr.aria-label]="'Select flag football category'"
                ></p-select>
              </div>

              <div class="form-group">
                <label for="approval-focus">Training Focus</label>
                <p-multiSelect
                  inputId="approval-focus"
                  [options]="trainingFocusOptions"
                  [(ngModel)]="approvalData.ff_training_focus"
                  placeholder="Select training focuses"
                  display="chip"
                  [attr.aria-label]="'Select training focus areas'"
                ></p-multiSelect>
              </div>

              <div class="form-group">
                <label for="approval-positions">Applicable Positions</label>
                <p-multiSelect
                  inputId="approval-positions"
                  [options]="positionOptions"
                  [(ngModel)]="approvalData.applicable_positions"
                  placeholder="Select positions"
                  display="chip"
                  [attr.aria-label]="'Select applicable positions'"
                ></p-multiSelect>
              </div>

              <div class="form-group">
                <label for="approval-difficulty">Difficulty Level</label>
                <p-select
                  inputId="approval-difficulty"
                  [options]="difficultyOptions"
                  [(ngModel)]="approvalData.difficulty_level"
                  placeholder="Select difficulty"
                  [attr.aria-label]="'Select difficulty level'"
                ></p-select>
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label>Recommended Sets</label>
                  <input
                    pInputText
                    type="number"
                    [(ngModel)]="approvalData.recommended_sets"
                    placeholder="e.g., 3"
                  />
                </div>
                <div class="form-group half">
                  <label>Recommended Reps</label>
                  <input
                    pInputText
                    [(ngModel)]="approvalData.recommended_reps"
                    placeholder="e.g., 8-12"
                  />
                </div>
              </div>
            </div>
          }
          <ng-template pTemplate="footer">
            <app-button
              variant="text"
              iconLeft="pi-times"
              (clicked)="showApprovalDialog = false"
              >Cancel</app-button
            >
            <app-button
              variant="success"
              iconLeft="pi-check"
              (clicked)="approveExercise()"
              >Approve</app-button
            >
          </ng-template>
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./exercisedb-manager.component.scss",
})
export class ExerciseDBManagerComponent implements OnInit {
  private exerciseDBService = inject(ExerciseDBService);
  private messageService = inject(MessageService);

  // Design system tokens
  // State
  exercises = signal<ExerciseDBExercise[]>([]);
  filteredExercises = signal<ExerciseDBExercise[]>([]);
  filters = signal<ExerciseDBFilters | null>(null);
  importLogs = signal<ImportLog[]>([]);
  selectedExercise = signal<ExerciseDBExercise | null>(null);
  exerciseToApprove = signal<ExerciseDBExercise | null>(null);
  lastImportStats = signal<ImportStats | null>(null);

  // Loading states
  loading = signal(false);
  importing = signal(false);

  // Dialogs
  showDetailDialog = false;
  showApprovalDialog = false;

  // Filters
  searchQuery = "";
  selectedBodyPart: string | null = null;
  selectedEquipment: string | null = null;
  selectedPosition: string | null = null;
  selectedCategory: string | null = null;
  selectedStatus = "all";

  // Import options
  importBodyParts: string[] = [];
  importEquipment: string | null = null;
  autoApprove = false;

  // Approval data
  approvalData: ExerciseApprovalData = {
    flag_football_relevance: 7,
    ff_category: "",
    ff_training_focus: [],
    applicable_positions: ["All"],
    difficulty_level: "Intermediate",
    recommended_sets: 3,
    recommended_reps: "8-12",
  };

  // Options
  positionOptions = [
    { label: "All Positions", value: "All" },
    { label: "Quarterback", value: "QB" },
    { label: "Wide Receiver", value: "WR" },
    { label: "Running Back", value: "RB" },
    { label: "Defensive Back", value: "DB" },
    { label: "Rusher", value: "Rusher" },
    { label: "Center", value: "Center" },
  ];

  statusOptions = [
    { label: "All", value: "all" },
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Curated", value: "curated" },
  ];

  importBodyPartOptions = [
    { label: "Back", value: "back" },
    { label: "Cardio", value: "cardio" },
    { label: "Chest", value: "chest" },
    { label: "Lower Arms", value: "lower arms" },
    { label: "Lower Legs", value: "lower legs" },
    { label: "Neck", value: "neck" },
    { label: "Shoulders", value: "shoulders" },
    { label: "Upper Arms", value: "upper arms" },
    { label: "Upper Legs", value: "upper legs" },
    { label: "Waist", value: "waist" },
  ];

  importEquipmentOptions = [
    { label: "Body Weight", value: "body weight" },
    { label: "Barbell", value: "barbell" },
    { label: "Dumbbell", value: "dumbbell" },
    { label: "Kettlebell", value: "kettlebell" },
    { label: "Cable", value: "cable" },
    { label: "Band", value: "band" },
    { label: "Medicine Ball", value: "medicine ball" },
  ];

  ffCategoryOptions = this.exerciseDBService.FF_CATEGORIES.map((c) => ({
    label: c,
    value: c,
  }));

  trainingFocusOptions = this.exerciseDBService.TRAINING_FOCUSES.map((f) => ({
    label: f,
    value: f,
  }));

  difficultyOptions = [
    { label: "Beginner", value: "Beginner" },
    { label: "Intermediate", value: "Intermediate" },
    { label: "Advanced", value: "Advanced" },
    { label: "Elite", value: "Elite" },
  ];

  // Computed values
  totalExercises = computed(() => this.exercises().length);
  approvedCount = computed(
    () => this.exercises().filter((e) => e.is_approved).length,
  );
  pendingCount = computed(
    () => this.exercises().filter((e) => !e.is_approved && e.is_curated).length,
  );
  curatedCount = computed(
    () => this.exercises().filter((e) => e.is_curated).length,
  );
  pendingExercises = computed(() =>
    this.exercises()
      .filter((e) => !e.is_approved && e.is_curated)
      .sort(
        (a, b) =>
          (b.flag_football_relevance || 0) - (a.flag_football_relevance || 0),
      ),
  );

  bodyPartOptions = computed(() => {
    const parts = this.filters()?.bodyParts || [];
    return [
      { label: "All Body Parts", value: null },
      ...parts.map((p) => ({ label: capitalize(p), value: p })),
    ];
  });

  equipmentOptions = computed(() => {
    const equipment = this.filters()?.equipment || [];
    return [
      { label: "All Equipment", value: null },
      ...equipment.map((e) => ({ label: capitalize(e), value: e })),
    ];
  });

  categoryOptions = computed(() => {
    const categories = this.filters()?.categories || [];
    return [
      { label: "All Categories", value: null },
      ...categories.map((c) => ({ label: c, value: c })),
    ];
  });

  ngOnInit(): void {
    this.loadExercises();
    this.loadFilters();
    this.loadImportLogs();

    // Subscribe to loading states using effect
    effect(() => {
      this.loading.set(this.exerciseDBService.isLoading());
    });

    effect(() => {
      this.importing.set(this.exerciseDBService.isImporting());
    });
  }

  loadExercises(): void {
    this.exerciseDBService.getCuratedExercises().subscribe((exercises) => {
      this.exercises.set(exercises);
      this.applyFilters();
    });
  }

  loadFilters(): void {
    this.exerciseDBService.getFilterOptions().subscribe((filters) => {
      this.filters.set(filters);
    });
  }

  loadImportLogs(): void {
    this.exerciseDBService.getImportLogs().subscribe((logs) => {
      this.importLogs.set(logs);
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.exercises()];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.body_part?.toLowerCase().includes(query) ||
          e.target_muscle?.toLowerCase().includes(query) ||
          e.equipment?.toLowerCase().includes(query),
      );
    }

    // Body part filter
    if (this.selectedBodyPart) {
      filtered = filtered.filter((e) => e.body_part === this.selectedBodyPart);
    }

    // Equipment filter
    if (this.selectedEquipment) {
      filtered = filtered.filter((e) => e.equipment === this.selectedEquipment);
    }

    // Position filter
    if (this.selectedPosition) {
      const position = this.selectedPosition;
      filtered = filtered.filter(
        (e) =>
          e.applicable_positions?.includes(position) ||
          e.applicable_positions?.includes("All"),
      );
    }

    // Category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(
        (e) => e.ff_category === this.selectedCategory,
      );
    }

    // Status filter
    if (this.selectedStatus !== "all") {
      switch (this.selectedStatus) {
        case "approved":
          filtered = filtered.filter((e) => e.is_approved);
          break;
        case "pending":
          filtered = filtered.filter((e) => !e.is_approved && e.is_curated);
          break;
        case "curated":
          filtered = filtered.filter((e) => e.is_curated);
          break;
      }
    }

    this.filteredExercises.set(filtered);
  }

  openExerciseDetail(exercise: ExerciseDBExercise): void {
    this.selectedExercise.set(exercise);
    this.showDetailDialog = true;
  }

  openApprovalDialog(exercise: ExerciseDBExercise): void {
    this.exerciseToApprove.set(exercise);
    this.approvalData = {
      flag_football_relevance: exercise.flag_football_relevance || 7,
      ff_category: exercise.ff_category || "",
      ff_training_focus: exercise.ff_training_focus || [],
      applicable_positions: exercise.applicable_positions || ["All"],
      difficulty_level: exercise.difficulty_level || "Intermediate",
      recommended_sets: exercise.recommended_sets || 3,
      recommended_reps: exercise.recommended_reps || "8-12",
    };
    this.showDetailDialog = false;
    this.showApprovalDialog = true;
  }

  approveExercise(): void {
    const exercise = this.exerciseToApprove();
    if (!exercise) return;

    this.exerciseDBService
      .approveExercise(exercise.id, this.approvalData)
      .subscribe((result) => {
        if (result.success) {
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: `${exercise.name} has been approved`,
          });
          this.showApprovalDialog = false;
          this.loadExercises();
        } else {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: result.error || "Failed to approve exercise",
          });
        }
      });
  }

  skipExercise(exercise: ExerciseDBExercise): void {
    // Just remove from pending view for now
    this.messageService.add({
      severity: "info",
      summary: "Skipped",
      detail: `${exercise.name} skipped`,
    });
  }

  startImport(): void {
    this.exerciseDBService
      .importExercises({
        body_parts:
          this.importBodyParts.length > 0 ? this.importBodyParts : undefined,
        equipment_filter: this.importEquipment || undefined,
        auto_approve: this.autoApprove,
      })
      .subscribe((result) => {
        if (result.success) {
          this.lastImportStats.set(result.stats || null);
          this.messageService.add({
            severity: "success",
            summary: "Import Complete",
            detail: `Successfully imported ${result.stats?.imported || 0} exercises`,
          });
          this.loadExercises();
          this.loadFilters();
          this.loadImportLogs();
        } else {
          this.messageService.add({
            severity: "error",
            summary: "Import Failed",
            detail: result.error || "Failed to import exercises",
          });
        }
      });
  }

  getRelevanceSeverity(
    relevance: number,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    if (relevance >= 8) return "success";
    if (relevance >= 6) return "info";
    if (relevance >= 4) return "warn";
    return "secondary";
  }

  getStatusSeverity = (status: string) =>
    getStatusSeverity(status, "secondary");

  formatDate(dateString: string): string {
    return formatDateValue(dateString, "MMM d, yyyy, p");
  }
}
