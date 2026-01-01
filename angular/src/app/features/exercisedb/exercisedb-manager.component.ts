import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TagModule } from "primeng/tag";
import { Select } from "primeng/select";
import { MultiSelect } from "primeng/multiselect";
import { DialogModule } from "primeng/dialog";
import { ToastModule } from "primeng/toast";
import { ProgressBarModule } from "primeng/progressbar";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";
import { Slider } from "primeng/slider";
import { Chip } from "primeng/chip";
import { SkeletonModule } from "primeng/skeleton";
import { BadgeModule } from "primeng/badge";
import { TooltipModule } from "primeng/tooltip";
import { MessageService } from "primeng/api";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
  ExerciseDBService,
  ExerciseDBExercise,
  ExerciseDBFilters,
  ImportStats,
  ImportLog,
  ExerciseApprovalData,
} from "../../core/services/exercisedb.service";

@Component({
  selector: "app-exercisedb-manager",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    Select,
    MultiSelect,
    DialogModule,
    ToastModule,
    ProgressBarModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Slider,
    Chip,
    SkeletonModule,
    BadgeModule,
    TooltipModule,
    MainLayoutComponent,
    PageHeaderComponent,
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
              <div class="stat-details">
                <span class="stat-value">{{ totalExercises() }}</span>
                <span class="stat-label">Total Exercises</span>
              </div>
            </div>
          </p-card>
          <p-card styleClass="stat-card approved">
            <div class="stat-content">
              <i class="pi pi-check-circle stat-icon"></i>
              <div class="stat-details">
                <span class="stat-value">{{ approvedCount() }}</span>
                <span class="stat-label">Approved</span>
              </div>
            </div>
          </p-card>
          <p-card styleClass="stat-card pending">
            <div class="stat-content">
              <i class="pi pi-clock stat-icon"></i>
              <div class="stat-details">
                <span class="stat-value">{{ pendingCount() }}</span>
                <span class="stat-label">Pending Review</span>
              </div>
            </div>
          </p-card>
          <p-card styleClass="stat-card curated">
            <div class="stat-content">
              <i class="pi pi-star stat-icon"></i>
              <div class="stat-details">
                <span class="stat-value">{{ curatedCount() }}</span>
                <span class="stat-label">Curated</span>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Tab View -->
        <p-tabView styleClass="exercise-tabs">
          <!-- Browse Tab -->
          <p-tabPanel header="Browse Exercises">
            <div class="tab-content">
              <!-- Filters -->
              <p-card styleClass="filters-card">
                <div class="filters-row">
                  <div class="filter-group">
                    <label>Search</label>
                    <input
                      pInputText
                      [(ngModel)]="searchQuery"
                      placeholder="Search exercises..."
                      (input)="onSearchChange()"
                      class="search-input"
                    />
                  </div>
                  <div class="filter-group">
                    <label>Body Part</label>
                    <p-dropdown
                      [options]="bodyPartOptions()"
                      [(ngModel)]="selectedBodyPart"
                      placeholder="All Body Parts"
                      [showClear]="true"
                      (onChange)="applyFilters()"
                    ></p-dropdown>
                  </div>
                  <div class="filter-group">
                    <label>Equipment</label>
                    <p-dropdown
                      [options]="equipmentOptions()"
                      [(ngModel)]="selectedEquipment"
                      placeholder="All Equipment"
                      [showClear]="true"
                      (onChange)="applyFilters()"
                    ></p-dropdown>
                  </div>
                  <div class="filter-group">
                    <label>Position</label>
                    <p-dropdown
                      [options]="positionOptions"
                      [(ngModel)]="selectedPosition"
                      placeholder="All Positions"
                      [showClear]="true"
                      (onChange)="applyFilters()"
                    ></p-dropdown>
                  </div>
                  <div class="filter-group">
                    <label>Category</label>
                    <p-dropdown
                      [options]="categoryOptions()"
                      [(ngModel)]="selectedCategory"
                      placeholder="All Categories"
                      [showClear]="true"
                      (onChange)="applyFilters()"
                    ></p-dropdown>
                  </div>
                  <div class="filter-group status-filter">
                    <label>Status</label>
                    <p-dropdown
                      [options]="statusOptions"
                      [(ngModel)]="selectedStatus"
                      (onChange)="applyFilters()"
                    ></p-dropdown>
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
                            [src]="exercise.gif_url"
                            [alt]="exercise.name"
                            class="exercise-gif"
                            loading="lazy"
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
                            ></p-badge>
                          }
                          @if (exercise.is_curated && !exercise.is_approved) {
                            <p-badge value="Curated" severity="info"></p-badge>
                          }
                          @if (exercise.flag_football_relevance) {
                            <p-badge
                              [value]="exercise.flag_football_relevance + '/10'"
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
                          <p-tag
                            [value]="exercise.ff_category"
                            styleClass="category-tag"
                          ></p-tag>
                        }
                        @if (exercise.applicable_positions?.length) {
                          <div class="position-chips">
                            @for (
                              pos of exercise.applicable_positions?.slice(0, 3);
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
                                  (exercise.applicable_positions?.length || 0) -
                                    3
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
          </p-tabPanel>

          <!-- Import Tab -->
          <p-tabPanel header="Import from ExerciseDB">
            <div class="tab-content import-tab">
              <p-card styleClass="import-card">
                <h3 class="import-title">
                  <i class="pi pi-cloud-download"></i>
                  Import Exercises from ExerciseDB API
                </h3>
                <p class="import-description">
                  Import exercises from the ExerciseDB API and automatically
                  categorize them for flag football training. Exercises will be
                  auto-tagged based on body part and target muscle relevance.
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
                    <label>Equipment Filter</label>
                    <p-dropdown
                      [options]="importEquipmentOptions"
                      [(ngModel)]="importEquipment"
                      placeholder="All equipment"
                      [showClear]="true"
                    ></p-dropdown>
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
                  <p-button
                    label="Start Import"
                    icon="pi pi-download"
                    [rounded]="true"
                    (onClick)="startImport()"
                    styleClass="import-button"
                  ></p-button>
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
                          <p-tag
                            [value]="log.status"
                            [severity]="getStatusSeverity(log.status)"
                          ></p-tag>
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
          </p-tabPanel>

          <!-- Approval Queue Tab -->
          <p-tabPanel header="Approval Queue">
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
                          [src]="exercise.gif_url"
                          [alt]="exercise.name"
                          class="approval-gif"
                        />
                      }
                      <div class="approval-info">
                        <h4>{{ exercise.name }}</h4>
                        <div class="approval-meta">
                          <p-tag
                            [value]="exercise.body_part"
                            severity="info"
                          ></p-tag>
                          <p-tag [value]="exercise.equipment"></p-tag>
                          <p-tag
                            [value]="exercise.target_muscle"
                            severity="secondary"
                          ></p-tag>
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
                      <p-button
                        label="Review & Approve"
                        icon="pi pi-check"
                        [rounded]="true"
                        severity="success"
                        (onClick)="openApprovalDialog(exercise)"
                      ></p-button>
                      <p-button
                        label="Skip"
                        icon="pi pi-times"
                        [rounded]="true"
                        severity="secondary"
                        [outlined]="true"
                        (onClick)="skipExercise(exercise)"
                      ></p-button>
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
          </p-tabPanel>
        </p-tabView>

        <!-- Exercise Detail Dialog -->
        <p-dialog
          [(visible)]="showDetailDialog"
          [header]="selectedExercise()?.name || 'Exercise Details'"
          [modal]="true"
          [style]="{ width: '90vw', maxWidth: '800px' }"
          [draggable]="false"
          [resizable]="false"
        >
          @if (selectedExercise()) {
            <div class="detail-content">
              <div class="detail-media">
                @if (selectedExercise()?.gif_url) {
                  <img
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
                    <p-tag
                      [value]="selectedExercise()?.body_part || ''"
                      severity="info"
                    ></p-tag>
                    <p-tag
                      [value]="selectedExercise()?.target_muscle || ''"
                      severity="secondary"
                    ></p-tag>
                    <p-tag
                      [value]="selectedExercise()?.equipment || ''"
                    ></p-tag>
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
                    <p-tag
                      [value]="selectedExercise()?.ff_category || ''"
                      styleClass="ff-category-tag"
                    ></p-tag>
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
                <p-button
                  label="Approve Exercise"
                  icon="pi pi-check"
                  [rounded]="true"
                  severity="success"
                  (onClick)="openApprovalDialog(selectedExercise()!)"
                ></p-button>
              }
              <p-button
                label="Close"
                icon="pi pi-times"
                [rounded]="true"
                severity="secondary"
                (onClick)="showDetailDialog = false"
              ></p-button>
            </ng-template>
          }
        </p-dialog>

        <!-- Approval Dialog -->
        <p-dialog
          [(visible)]="showApprovalDialog"
          header="Approve Exercise"
          [modal]="true"
          [style]="{ width: '90vw', maxWidth: '600px' }"
          [draggable]="false"
          [resizable]="false"
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
                <label>Category</label>
                <p-dropdown
                  [options]="ffCategoryOptions"
                  [(ngModel)]="approvalData.ff_category"
                  placeholder="Select category"
                ></p-dropdown>
              </div>

              <div class="form-group">
                <label>Training Focus</label>
                <p-multiSelect
                  [options]="trainingFocusOptions"
                  [(ngModel)]="approvalData.ff_training_focus"
                  placeholder="Select training focuses"
                  display="chip"
                ></p-multiSelect>
              </div>

              <div class="form-group">
                <label>Applicable Positions</label>
                <p-multiSelect
                  [options]="positionOptions"
                  [(ngModel)]="approvalData.applicable_positions"
                  placeholder="Select positions"
                  display="chip"
                ></p-multiSelect>
              </div>

              <div class="form-group">
                <label>Difficulty Level</label>
                <p-dropdown
                  [options]="difficultyOptions"
                  [(ngModel)]="approvalData.difficulty_level"
                  placeholder="Select difficulty"
                ></p-dropdown>
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
            <p-button
              label="Cancel"
              icon="pi pi-times"
              [rounded]="true"
              severity="secondary"
              [text]="true"
              (onClick)="showApprovalDialog = false"
            ></p-button>
            <p-button
              label="Approve"
              icon="pi pi-check"
              [rounded]="true"
              severity="success"
              (onClick)="approveExercise()"
            ></p-button>
          </ng-template>
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .exercisedb-manager {
        padding: var(--space-6);
        min-height: 100vh;
        background: linear-gradient(
          135deg,
          var(--surface-ground) 0%,
          var(--surface-section) 100%
        );
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      :host ::ng-deep .stat-card {
        background: var(--surface-card);
        border-radius: var(--border-radius-lg);
        border: 1px solid var(--surface-border);
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      :host ::ng-deep .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      :host ::ng-deep .stat-card.approved {
        border-left: 4px solid var(--green-500);
      }

      :host ::ng-deep .stat-card.pending {
        border-left: 4px solid var(--yellow-500);
      }

      :host ::ng-deep .stat-card.curated {
        border-left: 4px solid var(--blue-500);
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .stat-icon {
        font-size: var(--icon-2xl); /* 2rem/32px */
        color: var(--ds-primary-green);
        opacity: 0.8;
      }

      .stat-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .stat-value {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .stat-label {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
      }

      /* Tabs */
      :host ::ng-deep .exercise-tabs .p-tabview-panels {
        background: transparent;
        padding: 0;
      }

      :host ::ng-deep .exercise-tabs .p-tabview-nav {
        background: var(--surface-card);
        border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
      }

      .tab-content {
        padding: var(--space-4) 0;
      }

      /* Filters */
      :host ::ng-deep .filters-card {
        margin-bottom: var(--space-5);
        background: var(--surface-card);
        border-radius: var(--border-radius-lg);
      }

      .filters-row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        align-items: flex-end;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        min-width: 150px;
        flex: 1;
      }

      .filter-group label {
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        color: var(--text-color-secondary);
      }

      .search-input {
        width: 100%;
      }

      .status-filter {
        max-width: 180px;
      }

      /* Exercise Grid */
      .exercises-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--space-4);
      }

      :host ::ng-deep .exercise-card {
        cursor: pointer;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
        background: var(--surface-card);
        border-radius: var(--border-radius-lg);
        overflow: hidden;
      }

      :host ::ng-deep .exercise-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      :host ::ng-deep .exercise-card .p-card-body {
        padding: 0;
      }

      :host ::ng-deep .exercise-card .p-card-content {
        padding: 0;
      }

      .exercise-image-container {
        position: relative;
        width: 100%;
        height: 180px;
        background: var(--surface-ground);
        overflow: hidden;
      }

      .exercise-gif {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .exercise-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
          135deg,
          var(--surface-100) 0%,
          var(--surface-200) 100%
        );
      }

      .exercise-placeholder i {
        font-size: var(--icon-3xl); /* 3rem/48px */
        color: var(--color-text-secondary);
        opacity: 0.5;
      }

      .exercise-badges {
        position: absolute;
        top: var(--space-2);
        right: var(--space-2);
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .exercise-info {
        padding: var(--space-4);
      }

      .exercise-name {
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-semibold);
        margin: 0 0 var(--space-2) 0;
        color: var(--color-text-primary);
        line-height: var(--line-height-tight);
      }

      .exercise-meta {
        display: flex;
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
      }

      .meta-item i {
        font-size: var(--font-body-xs); /* 0.75rem/12px */
      }

      :host ::ng-deep .category-tag {
        margin-bottom: var(--space-2);
      }

      .position-chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
        margin-top: var(--space-2);
      }

      :host ::ng-deep .position-chip {
        font-size: var(--font-body-xs); /* 0.75rem/12px */
      }

      .more-positions {
        font-size: var(--font-body-xs);
        color: var(--text-color-secondary);
        padding: var(--space-1);
      }

      /* Import Tab */
      .import-tab {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      :host ::ng-deep .import-card {
        background: var(--surface-card);
        border-radius: var(--border-radius-lg);
      }

      .import-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin: 0 0 var(--space-3) 0;
        font-size: var(--font-heading-md);
        color: var(--text-color);
      }

      .import-description {
        color: var(--text-color-secondary);
        margin-bottom: var(--space-5);
        line-height: 1.6;
      }

      .import-options {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        margin-bottom: var(--space-5);
      }

      .option-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .option-group label {
        font-weight: var(--font-weight-medium);
        color: var(--text-color);
      }

      .checkbox-group label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        cursor: pointer;
      }

      :host ::ng-deep .import-multiselect {
        width: 100%;
      }

      .import-progress {
        text-align: center;
        padding: var(--space-4);
      }

      :host ::ng-deep .import-bar {
        margin-bottom: var(--space-3);
      }

      .progress-text {
        color: var(--text-color-secondary);
        font-style: italic;
      }

      :host ::ng-deep .import-button {
        width: 100%;
      }

      .import-results {
        margin-top: var(--space-5);
        padding-top: var(--space-5);
        border-top: 1px solid var(--surface-border);
      }

      .import-results h4 {
        margin: 0 0 var(--space-4) 0;
        color: var(--text-color);
      }

      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: var(--space-3);
      }

      .result-item {
        text-align: center;
        padding: var(--space-3);
        background: var(--surface-ground);
        border-radius: var(--border-radius);
      }

      .result-item.success {
        background: var(--green-50);
      }

      .result-item.info {
        background: var(--blue-50);
      }

      .result-item.warning {
        background: var(--yellow-50);
      }

      .result-item.error {
        background: var(--red-50);
      }

      .result-value {
        display: block;
        font-size: var(--font-heading-md);
        font-weight: var(--font-weight-bold);
        color: var(--text-color);
      }

      .result-label {
        font-size: var(--font-body-sm);
        color: var(--text-color-secondary);
      }

      /* History */
      :host ::ng-deep .history-card {
        background: var(--surface-card);
        border-radius: var(--border-radius-lg);
      }

      .history-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin: 0 0 var(--space-4) 0;
        font-size: var(--font-heading-md);
        color: var(--text-color);
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .history-item {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-3);
        background: var(--surface-ground);
        border-radius: var(--border-radius);
      }

      .history-details {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .history-type {
        font-weight: var(--font-weight-medium);
        color: var(--text-color);
        text-transform: capitalize;
      }

      .history-date {
        font-size: var(--font-body-sm);
        color: var(--text-color-secondary);
      }

      .history-stats {
        display: flex;
        gap: var(--space-3);
        font-size: var(--font-body-sm);
        color: var(--text-color-secondary);
      }

      .no-history {
        text-align: center;
        color: var(--text-color-secondary);
        padding: var(--space-4);
      }

      /* Approval Tab */
      .approval-tab {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      :host ::ng-deep .queue-info {
        background: var(--blue-50);
        border: 1px solid var(--blue-200);
      }

      :host ::ng-deep .queue-info p {
        margin: 0;
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--blue-700);
      }

      .approval-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: var(--space-4);
      }

      :host ::ng-deep .approval-card {
        background: var(--surface-card);
        border-radius: var(--border-radius-lg);
      }

      .approval-header {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .approval-gif {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: var(--border-radius);
      }

      .approval-info {
        flex: 1;
      }

      .approval-info h4 {
        margin: 0 0 var(--space-2) 0;
        color: var(--text-color);
      }

      .approval-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .auto-categorization {
        padding: var(--space-3);
        background: var(--surface-ground);
        border-radius: var(--border-radius);
        margin-bottom: var(--space-4);
        font-size: var(--font-body-sm);
      }

      .auto-categorization .label {
        color: var(--text-color-secondary);
      }

      .auto-categorization .relevance {
        color: var(--primary-color);
        margin-left: var(--space-2);
      }

      .approval-actions {
        display: flex;
        gap: var(--space-2);
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: var(--space-8);
        color: var(--text-color-secondary);
      }

      .empty-state i {
        font-size: 4rem;
        opacity: 0.5;
        margin-bottom: var(--space-4);
      }

      .empty-state h3 {
        margin: 0 0 var(--space-2) 0;
        color: var(--text-color);
      }

      .empty-state p {
        margin: 0;
      }

      /* Detail Dialog */
      .detail-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-5);
      }

      .detail-gif {
        width: 100%;
        border-radius: var(--border-radius-lg);
      }

      .detail-section {
        margin-bottom: var(--space-4);
      }

      .detail-section h4 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--font-body-md);
        color: var(--text-color-secondary);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .detail-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      :host ::ng-deep .ff-category-tag {
        background: var(--primary-color);
        color: white;
      }

      :host ::ng-deep .focus-chip {
        background: var(--blue-100);
        color: var(--blue-700);
      }

      .instructions-list {
        margin: 0;
        padding-left: var(--space-5);
        line-height: 1.8;
      }

      .detail-section.safety {
        background: var(--yellow-50);
        padding: var(--space-3);
        border-radius: var(--border-radius);
        border-left: 4px solid var(--yellow-500);
      }

      .detail-section.safety h4 {
        color: var(--yellow-700);
      }

      .detail-section.safety ul {
        margin: 0;
        padding-left: var(--space-5);
        color: var(--yellow-800);
      }

      /* Approval Form */
      .approval-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .approval-form h4 {
        margin: 0;
        color: var(--text-color);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .form-group label {
        font-weight: var(--font-weight-medium);
        color: var(--text-color);
      }

      .form-row {
        display: flex;
        gap: var(--space-4);
      }

      .form-group.half {
        flex: 1;
      }

      .slider-value {
        text-align: center;
        font-weight: var(--font-weight-bold);
        color: var(--primary-color);
      }

      /* Skeleton */
      :host ::ng-deep .skeleton-card .p-card-body {
        padding: 0;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .exercisedb-manager {
          padding: var(--space-4);
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .filters-row {
          flex-direction: column;
        }

        .filter-group {
          width: 100%;
        }

        .exercises-grid {
          grid-template-columns: 1fr;
        }

        .detail-content {
          grid-template-columns: 1fr;
        }

        .approval-grid {
          grid-template-columns: 1fr;
        }

        .approval-header {
          flex-direction: column;
        }

        .approval-gif {
          width: 100%;
          height: 200px;
        }
      }
    `,
  ],
})
export class ExerciseDBManagerComponent implements OnInit {
  private exerciseDBService = inject(ExerciseDBService);
  private messageService = inject(MessageService);

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
      ...parts.map((p) => ({ label: this.capitalize(p), value: p })),
    ];
  });

  equipmentOptions = computed(() => {
    const equipment = this.filters()?.equipment || [];
    return [
      { label: "All Equipment", value: null },
      ...equipment.map((e) => ({ label: this.capitalize(e), value: e })),
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

    // Subscribe to loading states
    this.exerciseDBService.loading$.subscribe((loading) =>
      this.loading.set(loading),
    );
    this.exerciseDBService.importing$.subscribe((importing) =>
      this.importing.set(importing),
    );
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
      filtered = filtered.filter(
        (e) =>
          e.applicable_positions?.includes(this.selectedPosition!) ||
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

  getStatusSeverity(
    status: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (status) {
      case "completed":
        return "success";
      case "started":
        return "info";
      case "failed":
        return "danger";
      default:
        return "secondary";
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  capitalize(str: string): string {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
