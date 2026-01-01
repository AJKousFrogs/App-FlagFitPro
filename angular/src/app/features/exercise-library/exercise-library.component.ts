import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule } from "primeng/paginator";
import { RippleModule } from "primeng/ripple";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { ApiService } from "../../core/services/api.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  muscleGroups: string[];
  equipment: string[];
  description: string;
}

interface Category {
  name: string;
  icon: string;
  color: string;
}

@Component({
  selector: "app-exercise-library",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    PaginatorModule,
    TooltipModule,
    RippleModule,
    BadgeModule,
    DialogModule,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <div class="exercise-library-page">
        <!-- Premium Header with Stats -->
        <div class="page-hero">
          <div class="hero-content">
            <div class="hero-text">
              <h1 class="hero-title">
                <i class="pi pi-book"></i>
                Exercise Library
              </h1>
              <p class="hero-subtitle">
                Browse and discover {{ totalExercises() }} evidence-based
                exercises for your training program
              </p>
            </div>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-value">{{ totalExercises() }}</span>
                <span class="stat-label">Exercises</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ categories.length - 1 }}</span>
                <span class="stat-label">Categories</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modern Search and Filters -->
        <div class="search-filters-section">
          <!-- Search Bar with Icon -->
          <p-iconfield class="search-container">
            <p-inputicon>
              <i class="pi pi-search"></i>
            </p-inputicon>
            <input
              pInputText
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              placeholder="Search exercises by name, muscle group, or equipment..."
              class="search-input"
            />
          </p-iconfield>

          <!-- Category Filters -->
          <div class="filter-section">
            <h3 class="filter-title">
              <i class="pi pi-filter"></i>
              Filter by Category
            </h3>
            <div class="filter-chips">
              @for (category of categoryList; track category.name) {
                <button
                  class="filter-chip"
                  [class.active]="selectedCategory() === category.name"
                  (click)="filterByCategory(category.name)"
                  [pTooltip]="'Filter by ' + category.name"
                  pRipple
                >
                  <i [class]="'pi ' + category.icon"></i>
                  <span>{{ category.name }}</span>
                  @if (
                    selectedCategory() === category.name &&
                    category.name !== "all"
                  ) {
                    <i class="pi pi-times-circle close-icon"></i>
                  }
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Results Summary -->
        @if (filteredExercises().length > 0) {
          <div class="results-summary">
            <p>
              <strong>{{ filteredExercises().length }}</strong>
              {{ filteredExercises().length === 1 ? "exercise" : "exercises" }}
              found
              @if (selectedCategory() !== "all") {
                <span>
                  in <strong>{{ selectedCategory() }}</strong></span
                >
              }
            </p>
          </div>
        }

        <!-- Exercises Grid -->
        <div class="exercises-grid">
          @for (exercise of paginatedExercises(); track exercise.id) {
            <div class="exercise-card">
              <div class="card-header">
                <div class="header-left">
                  <i
                    [class]="
                      'pi ' +
                      getCategoryIcon(exercise.category) +
                      ' category-icon'
                    "
                  ></i>
                  <div class="title-group">
                    <h3 class="exercise-name">{{ exercise.name }}</h3>
                    <span class="exercise-category">{{
                      exercise.category
                    }}</span>
                  </div>
                </div>
                <span
                  class="difficulty-badge"
                  [class]="'difficulty-' + exercise.difficulty"
                  [pTooltip]="getDifficultyTooltip(exercise.difficulty)"
                >
                  {{ exercise.difficulty }}
                </span>
              </div>

              <p class="exercise-description">{{ exercise.description }}</p>

              <div class="muscle-groups">
                <span class="section-label">
                  <i class="pi pi-heart-fill"></i>
                  Target Muscles
                </span>
                <div class="muscle-tags">
                  @for (group of exercise.muscleGroups; track group) {
                    <span class="muscle-tag">{{ group }}</span>
                  }
                </div>
              </div>

              @if (
                exercise.equipment.length > 0 &&
                exercise.equipment[0] !== "None"
              ) {
                <div class="equipment-info">
                  <i class="pi pi-wrench"></i>
                  <span>{{ exercise.equipment.join(", ") }}</span>
                </div>
              }

              <div class="card-actions">
                <button
                  class="action-btn secondary"
                  (click)="viewExerciseDetails(exercise)"
                  pRipple
                  [pTooltip]="'View full exercise details'"
                >
                  <i class="pi pi-eye"></i>
                  <span>View Details</span>
                </button>
                <button
                  class="action-btn primary"
                  (click)="addToWorkout(exercise)"
                  pRipple
                  [pTooltip]="'Add to your workout plan'"
                >
                  <i class="pi pi-plus"></i>
                  <span>Add to Workout</span>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Empty State -->
        @if (filteredExercises().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <i class="pi pi-search"></i>
            </div>
            <h3>No exercises found</h3>
            <p>
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
            <button class="reset-btn" (click)="resetFilters()" pRipple>
              <i class="pi pi-refresh"></i>
              Reset Filters
            </button>
          </div>
        }

        <!-- Pagination -->
        @if (filteredExercises().length > itemsPerPage) {
          <div class="pagination-container">
            <p-paginator
              [rows]="itemsPerPage"
              [totalRecords]="filteredExercises().length"
              [first]="currentPage * itemsPerPage"
              (onPageChange)="onPageChange($event)"
              [rowsPerPageOptions]="[8, 12, 24]"
            />
          </div>
        }
      </div>

      <!-- Exercise Details Dialog -->
      <p-dialog
        [(visible)]="showDetailsDialog"
        [modal]="true"
        [closable]="true"
        [closeOnEscape]="true"
        [dismissableMask]="true"
        [style]="{ width: '600px', maxWidth: '90vw' }"
        header="Exercise Details"
        styleClass="exercise-details-dialog"
      >
        @if (selectedExercise()) {
          <div class="dialog-content">
            <div class="detail-header">
              <i
                [class]="
                  'pi ' +
                  getCategoryIcon(selectedExercise()!.category) +
                  ' detail-icon'
                "
              ></i>
              <div>
                <h2 class="exercise-title">{{ selectedExercise()!.name }}</h2>
                <span class="category-label">{{
                  selectedExercise()!.category
                }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3><i class="pi pi-info-circle"></i> Description</h3>
              <p>{{ selectedExercise()!.description }}</p>
            </div>

            <div class="detail-section">
              <h3><i class="pi pi-signal"></i> Difficulty</h3>
              <span
                class="difficulty-badge-large"
                [class]="'difficulty-' + selectedExercise()!.difficulty"
              >
                {{ selectedExercise()!.difficulty }}
              </span>
            </div>

            <div class="detail-section">
              <h3><i class="pi pi-heart-fill"></i> Target Muscle Groups</h3>
              <div class="muscle-tags-large">
                @for (group of selectedExercise()!.muscleGroups; track group) {
                  <span class="muscle-tag-large">{{ group }}</span>
                }
              </div>
            </div>

            @if (
              selectedExercise()!.equipment.length > 0 &&
              selectedExercise()!.equipment[0] !== "None"
            ) {
              <div class="detail-section">
                <h3><i class="pi pi-wrench"></i> Required Equipment</h3>
                <div class="equipment-list">
                  @for (item of selectedExercise()!.equipment; track item) {
                    <span class="equipment-item">{{ item }}</span>
                  }
                </div>
              </div>
            }
          </div>

          <ng-template pTemplate="footer">
            <p-button
              label="Add to Workout"
              icon="pi pi-plus"
              (onClick)="
                addToWorkout(selectedExercise()!); showDetailsDialog.set(false)
              "
              styleClass="p-button-success"
            />
            <p-button
              label="Close"
              icon="pi pi-times"
              (onClick)="showDetailsDialog.set(false)"
              styleClass="p-button-secondary"
            />
          </ng-template>
        }
      </p-dialog>

      <!-- Toast for notifications -->
      <p-toast position="top-right" />
    </app-main-layout>
  `,
  styles: [
    `
      @use "styles/animations" as *;

      .exercise-library-page {
        padding: var(--space-6);
        max-width: 1400px;
        margin: 0 auto;
      }

      /* ===== HERO SECTION - Theme Aware ===== */
      .page-hero {
        margin-bottom: var(--space-8);
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-xl);
        padding: var(--space-8);
        box-shadow: var(--shadow-lg);
        animation: fadeInDown 400ms ease-out;
        position: relative;
        overflow: hidden;
      }

      .page-hero::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          135deg,
          rgba(8, 153, 73, 0.08) 0%,
          transparent 60%
        );
        pointer-events: none;
      }

      .hero-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-6);
        flex-wrap: wrap;
        position: relative;
        z-index: 1;
      }

      .hero-title {
        font-size: var(--font-heading-2xl);
        font-weight: var(--font-weight-bold);
        margin: 0 0 var(--space-2) 0;
        display: flex;
        align-items: center;
        gap: var(--space-3);
        color: var(--ds-primary-green);
      }

      .hero-title i {
        font-size: var(--font-heading-xl);
        color: var(--ds-primary-green);
      }

      .hero-subtitle {
        font-size: var(--font-body-lg);
        margin: 0;
        color: var(--text-secondary);
      }

      .hero-stats {
        display: flex;
        gap: var(--space-6);
      }

      .stat-item {
        text-align: center;
        padding: var(--space-3) var(--space-5);
        background: rgba(8, 153, 73, 0.1);
        border: 1px solid rgba(8, 153, 73, 0.2);
        border-radius: var(--radius-lg);
      }

      .stat-value {
        display: block;
        font-size: var(--font-heading-xl);
        font-weight: var(--font-weight-bold);
        color: var(--ds-primary-green);
      }

      .stat-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      /* ===== SEARCH & FILTERS ===== */
      .search-filters-section {
        margin-bottom: var(--space-6);
      }

      .search-container {
        width: 100%;
        margin-bottom: var(--space-6);
      }

      .search-input {
        width: 100%;
        font-size: var(--font-body-md);
        padding: var(--space-4);
        border-radius: var(--radius-lg);
        border: 2px solid var(--color-border-secondary);
        transition: all var(--transition-fast);
      }

      .search-input:focus {
        border-color: var(--ds-primary-green);
        box-shadow: 0 0 0 3px rgba(8, 153, 73, 0.1);
      }

      :host ::ng-deep .search-container .p-inputicon {
        color: var(--color-text-muted);
        font-size: 1.25rem;
      }

      .filter-section {
        background: var(--surface-card);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--color-border-secondary);
      }

      .filter-title {
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-4) 0;
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .filter-title i {
        color: var(--ds-primary-green);
      }

      .filter-chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .filter-chip {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        background: var(--surface-secondary);
        color: var(--color-text-primary);
        border: 2px solid var(--color-border-secondary);
        border-radius: var(--radius-full);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all var(--transition-fast);
        position: relative;
        overflow: hidden;
      }

      .filter-chip:hover {
        background: var(--surface-tertiary);
        border-color: var(--ds-primary-green);
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }

      .filter-chip.active {
        background: var(--ds-primary-green);
        color: white; /* CRITICAL: White text on green */
        border-color: var(--ds-primary-green);
        box-shadow: 0 0 0 3px rgba(8, 153, 73, 0.15);
      }

      .filter-chip.active i {
        color: white; /* CRITICAL: White icon on green */
      }

      .filter-chip i {
        font-size: 1rem;
      }

      .close-icon {
        margin-left: var(--space-1);
        opacity: 0.8;
      }

      /* ===== RESULTS SUMMARY ===== */
      .results-summary {
        margin-bottom: var(--space-4);
        padding: var(--space-3) var(--space-4);
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
        border-left: 4px solid var(--ds-primary-green);
      }

      .results-summary p {
        margin: 0;
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
      }

      /* ===== EXERCISES GRID ===== */
      .exercises-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: var(--space-5);
        margin-bottom: var(--space-6);
      }

      .exercise-card {
        background: var(--surface-card);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
        border: 1px solid var(--color-border-secondary);
        transition: all var(--transition-base);
        animation: scaleIn 300ms ease-out backwards;
      }

      @for $i from 1 through 12 {
        .exercise-card:nth-child(#{$i}) {
          animation-delay: #{$i * 50}ms;
        }
      }

      .exercise-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--ds-primary-green);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-4);
        gap: var(--space-3);
      }

      .header-left {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        flex: 1;
      }

      .category-icon {
        font-size: 1.75rem;
        color: var(--ds-primary-green);
        background: rgba(8, 153, 73, 0.1);
        padding: var(--space-2);
        border-radius: var(--radius-md);
        flex-shrink: 0;
      }

      .title-group {
        flex: 1;
      }

      .exercise-name {
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-1) 0;
        line-height: 1.3;
      }

      .exercise-category {
        font-size: var(--font-body-xs);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-wide);
        font-weight: var(--font-weight-medium);
      }

      .difficulty-badge {
        padding: var(--space-1) var(--space-3);
        border-radius: var(--radius-full);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex-shrink: 0;
      }

      .difficulty-beginner {
        background: var(--color-status-success-light);
        color: var(--color-status-success);
      }

      .difficulty-intermediate {
        background: var(--color-status-info-light);
        color: var(--color-status-info);
      }

      .difficulty-advanced {
        background: var(--color-status-warning-light);
        color: var(--color-status-warning);
      }

      .exercise-description {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
        line-height: 1.6;
        margin-bottom: var(--space-4);
      }

      .muscle-groups {
        margin-bottom: var(--space-4);
      }

      .section-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-wide);
        margin-bottom: var(--space-2);
      }

      .section-label i {
        color: var(--ds-primary-green);
      }

      .muscle-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .muscle-tag {
        padding: var(--space-1) var(--space-3);
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
        border-radius: var(--radius-md);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-medium);
      }

      .equipment-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--surface-tertiary);
        border-radius: var(--radius-md);
        font-size: var(--font-body-xs);
        color: var(--color-text-secondary);
        margin-bottom: var(--space-4);
      }

      .equipment-info i {
        color: var(--color-text-muted);
      }

      .card-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        margin-top: var(--space-4);
      }

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-lg);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition: all var(--transition-fast);
        border: 2px solid;
        min-height: 44px;
        white-space: nowrap;
      }

      .action-btn.secondary {
        background: transparent;
        color: var(--ds-primary-green);
        border-color: var(--ds-primary-green);
      }

      .action-btn.secondary:hover {
        background: rgba(8, 153, 73, 0.05);
        transform: translateY(-1px);
      }

      .action-btn.primary {
        background: var(--ds-primary-green);
        color: white; /* CRITICAL: White text on green */
        border-color: var(--ds-primary-green);
        box-shadow: var(--shadow-sm);
      }

      .action-btn.primary i {
        color: white; /* CRITICAL: White icon on green */
      }

      .action-btn.primary:hover {
        background: #0caf58;
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      /* ===== EMPTY STATE ===== */
      .empty-state {
        text-align: center;
        padding: var(--space-10) var(--space-6);
        background: var(--surface-secondary);
        border-radius: var(--radius-xl);
        border: 2px dashed var(--color-border-secondary);
      }

      .empty-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto var(--space-4);
        background: rgba(8, 153, 73, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-icon i {
        font-size: 2.5rem;
        color: var(--ds-primary-green);
      }

      .empty-state h3 {
        font-size: var(--font-heading-md);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-2) 0;
      }

      .empty-state p {
        font-size: var(--font-body-md);
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-4) 0;
      }

      .reset-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-5);
        background: var(--ds-primary-green);
        color: white; /* CRITICAL: White text on green */
        border: none;
        border-radius: var(--radius-lg);
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .reset-btn i {
        color: white; /* CRITICAL: White icon on green */
      }

      .reset-btn:hover {
        background: #0caf58;
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      /* ===== PAGINATION ===== */
      .pagination-container {
        margin-top: var(--space-6);
        display: flex;
        justify-content: center;
      }

      /* ===== EXERCISE DETAILS DIALOG ===== */
      :host ::ng-deep .exercise-details-dialog {
        .p-dialog-header {
          background: var(--ds-primary-green);
          color: white;
        }

        .p-dialog-header-icon {
          color: white;
        }

        .p-dialog-header-icon:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }

      .dialog-content {
        padding: var(--space-2) 0;
      }

      .detail-header {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-6);
        padding-bottom: var(--space-4);
        border-bottom: 2px solid var(--color-border-secondary);
      }

      .detail-icon {
        font-size: 3rem;
        color: var(--ds-primary-green);
        background: rgba(8, 153, 73, 0.1);
        padding: var(--space-4);
        border-radius: var(--radius-lg);
      }

      .exercise-title {
        font-size: var(--font-heading-md);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-1) 0;
      }

      .category-label {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-wide);
        font-weight: var(--font-weight-medium);
      }

      .detail-section {
        margin-bottom: var(--space-5);
      }

      .detail-section h3 {
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-3) 0;
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .detail-section h3 i {
        color: var(--ds-primary-green);
      }

      .detail-section p {
        font-size: var(--font-body-md);
        color: var(--color-text-secondary);
        line-height: 1.6;
        margin: 0;
      }

      .difficulty-badge-large {
        display: inline-block;
        padding: var(--space-2) var(--space-5);
        border-radius: var(--radius-full);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .muscle-tags-large {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .muscle-tag-large {
        padding: var(--space-2) var(--space-4);
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
        border-radius: var(--radius-lg);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
      }

      .equipment-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .equipment-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        background: var(--surface-tertiary);
        border-radius: var(--radius-lg);
        font-size: var(--font-body-sm);
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
      }

      /* ===== RESPONSIVE ===== */
      @media (max-width: 1024px) {
        .exercises-grid {
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }
      }

      @media (max-width: 768px) {
        .exercise-library-page {
          padding: var(--space-4);
        }

        .page-hero {
          padding: var(--space-6);
        }

        .hero-content {
          flex-direction: column;
          align-items: flex-start;
        }

        .hero-stats {
          width: 100%;
          justify-content: space-around;
        }

        .exercises-grid {
          grid-template-columns: 1fr;
        }

        .card-actions {
          grid-template-columns: 1fr;
        }
      }

      /* ===== REDUCED MOTION ===== */
      @media (prefers-reduced-motion: reduce) {
        .exercise-card {
          animation: none;
        }

        .exercise-card:hover {
          transform: none;
        }

        * {
          transition-duration: 0.01ms !important;
        }
      }
    `,
  ],
})
export class ExerciseLibraryComponent implements OnInit {
  private apiService = inject(ApiService);
  private messageService = inject(MessageService);

  searchQuery = "";
  selectedCategory = signal<string>("all");
  showDetailsDialog = signal(false);
  selectedExercise = signal<Exercise | null>(null);

  categoryList: Category[] = [
    { name: "all", icon: "pi-th-large", color: "#6b7280" },
    { name: "Strength", icon: "pi-bolt", color: "#ef4444" },
    { name: "Cardio", icon: "pi-heart", color: "#f59e0b" },
    { name: "Flexibility", icon: "pi-arrows-alt", color: "#8b5cf6" },
    { name: "Speed", icon: "pi-forward", color: "#3b82f6" },
    { name: "Agility", icon: "pi-sync", color: "#10b981" },
  ];

  categories = ["all", "Strength", "Cardio", "Flexibility", "Speed", "Agility"];

  exercises = signal<Exercise[]>([]);
  filteredExercises = signal<Exercise[]>([]);
  totalExercises = computed(() => this.exercises().length);

  itemsPerPage = 8;
  currentPage = 0;

  paginatedExercises = computed(() => {
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredExercises().slice(start, end);
  });

  ngOnInit(): void {
    this.loadExercises();
  }

  loadExercises(): void {
    const allExercises: Exercise[] = [
      {
        id: "1",
        name: "40-Yard Dash",
        category: "Speed",
        difficulty: "beginner",
        muscleGroups: ["Legs", "Core"],
        equipment: ["None"],
        description:
          "Sprint 40 yards as fast as possible to measure speed and acceleration.",
      },
      {
        id: "2",
        name: "Vertical Jump",
        category: "Strength",
        difficulty: "intermediate",
        muscleGroups: ["Legs", "Glutes"],
        equipment: ["None"],
        description:
          "Jump vertically as high as possible to measure explosive leg power.",
      },
      {
        id: "3",
        name: "Broad Jump",
        category: "Speed",
        difficulty: "beginner",
        muscleGroups: ["Legs", "Core"],
        equipment: ["None"],
        description:
          "Jump horizontally as far as possible to measure lower body power.",
      },
      {
        id: "4",
        name: "Bench Press",
        category: "Strength",
        difficulty: "advanced",
        muscleGroups: ["Chest", "Shoulders", "Triceps"],
        equipment: ["Barbell", "Bench"],
        description:
          "Press weight upward from chest to measure upper body strength.",
      },
      {
        id: "5",
        name: "Box Jumps",
        category: "Agility",
        difficulty: "intermediate",
        muscleGroups: ["Legs", "Core"],
        equipment: ["Plyometric Box"],
        description:
          "Jump onto elevated platform to develop explosive power and coordination.",
      },
      {
        id: "6",
        name: "Cone Drills",
        category: "Agility",
        difficulty: "beginner",
        muscleGroups: ["Legs", "Core"],
        equipment: ["Cones"],
        description:
          "Navigate around cones to improve change of direction and footwork.",
      },
      {
        id: "7",
        name: "Burpees",
        category: "Cardio",
        difficulty: "intermediate",
        muscleGroups: ["Full Body"],
        equipment: ["None"],
        description:
          "Full-body exercise combining squat, plank, and jump for conditioning.",
      },
      {
        id: "8",
        name: "Yoga Flow",
        category: "Flexibility",
        difficulty: "beginner",
        muscleGroups: ["Full Body"],
        equipment: ["Mat"],
        description:
          "Flowing sequence of poses to improve flexibility and mobility.",
      },
    ];

    this.exercises.set(allExercises);
    this.applyFilters();
  }

  filterByCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage = 0;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.exercises()];

    // Filter by category
    if (this.selectedCategory() !== "all") {
      filtered = filtered.filter(
        (ex) => ex.category === this.selectedCategory(),
      );
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.description.toLowerCase().includes(query) ||
          ex.muscleGroups.some((g) => g.toLowerCase().includes(query)) ||
          ex.equipment.some((e) => e.toLowerCase().includes(query)),
      );
    }

    this.filteredExercises.set(filtered);
  }

  onPageChange(event: { page?: number; rows?: number; first?: number }): void {
    this.currentPage = event.page ?? 0;
    this.itemsPerPage = event.rows ?? 8;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      Strength: "pi-bolt",
      Cardio: "pi-heart",
      Flexibility: "pi-arrows-alt",
      Speed: "pi-forward",
      Agility: "pi-sync",
    };
    return icons[category] || "pi-circle";
  }

  getDifficultyTooltip(difficulty: string): string {
    const tooltips: Record<string, string> = {
      beginner: "Suitable for beginners - No experience required",
      intermediate: "Intermediate level - Some experience recommended",
      advanced: "Advanced level - Significant experience required",
    };
    return tooltips[difficulty] || "";
  }

  viewExerciseDetails(exercise: Exercise): void {
    this.selectedExercise.set(exercise);
    this.showDetailsDialog.set(true);
  }

  addToWorkout(exercise: Exercise): void {
    // Show success toast notification
    this.messageService.add({
      severity: "success",
      summary: "Added to Workout",
      detail: `"${exercise.name}" has been added to your workout plan`,
      life: 3000,
    });

    // TODO: Implement actual API call to add exercise to workout
    console.log("Exercise added to workout:", exercise);
  }

  resetFilters(): void {
    this.searchQuery = "";
    this.selectedCategory.set("all");
    this.currentPage = 0;
    this.applyFilters();
  }
}
