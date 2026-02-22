/**
 * Decision Ledger Dashboard Component
 *
 * Main dashboard for viewing and managing decisions
 */

import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { UI_LIMITS } from "@core/constants";
import type {
  CreateDecisionRequest,
  DecisionFilters,
  DecisionLedgerEntry,
  ReviewDecisionRequest,
} from "@core/models/decision-ledger.models";
import { DecisionLedgerService } from "@core/services/decision-ledger.service";
import { LoggerService } from "@core/services/logger.service";
import { CardShellComponent } from "@shared/components/card-shell/card-shell.component";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { ButtonComponent } from "@shared/components/button/button.component";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "@shared/components/loading/loading.component";

import { Select } from "primeng/select";

import { CreateDecisionDialogComponent } from "./create-decision-dialog.component";
import { DecisionCardComponent } from "./decision-card.component";
import { ReviewDecisionDialogComponent } from "./review-decision-dialog.component";

@Component({
  selector: "app-decision-ledger-dashboard",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    Select,
    PageHeaderComponent,
    CardShellComponent,
    DecisionCardComponent,
    CreateDecisionDialogComponent,
    ReviewDecisionDialogComponent,
  ],
  template: `
    <div class="decision-ledger-dashboard">
      <app-page-header
        title="Decision Ledger"
        subtitle="Track decisions, reviews, and outcomes"
      >
        <app-button iconLeft="pi-plus" (clicked)="openCreateDialog()"
          >New Decision</app-button
        >
      </app-page-header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <app-card-shell title="Active Decisions" headerIcon="pi-check-circle">
          <div class="stat-block stat-block--compact">
            <div class="stat-block__content">
              <div class="stat-block__value">{{ stats()?.active || 0 }}</div>
              <div class="stat-block__label">Currently active</div>
            </div>
          </div>
        </app-card-shell>

        <app-card-shell title="Due for Review" headerIcon="pi-clock">
          <div class="stat-block stat-block--compact">
            <div class="stat-block__content">
              <div class="stat-block__value stat-value--warning">
                {{ stats()?.dueForReview || 0 }}
              </div>
              <div class="stat-block__label">Requires attention</div>
            </div>
          </div>
        </app-card-shell>

        <app-card-shell title="Overdue" headerIcon="pi-exclamation-triangle">
          <div class="stat-block stat-block--compact">
            <div class="stat-block__content">
              <div class="stat-block__value stat-value--danger">
                {{ stats()?.overdue || 0 }}
              </div>
              <div class="stat-block__label">Past review date</div>
            </div>
          </div>
        </app-card-shell>

        <app-card-shell title="Low Confidence" headerIcon="pi-info-circle">
          <div class="stat-block stat-block--compact">
            <div class="stat-block__content">
              <div class="stat-block__value stat-value--warning">
                {{ stats()?.lowConfidence || 0 }}
              </div>
              <div class="stat-block__label">Need more data</div>
            </div>
          </div>
        </app-card-shell>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <app-card-shell title="Filters" headerIcon="pi-filter">
          <div class="filters-grid">
            <div class="filter-item">
              <label>Status</label>
              <p-select
                [options]="statusOptions"
                [ngModel]="filters().status"
                (onChange)="onStatusFilterChange($event.value)"
                placeholder="All Statuses"
              ></p-select>
            </div>

            <div class="filter-item">
              <label>Category</label>
              <p-select
                [options]="categoryOptions"
                [ngModel]="filters().decisionCategory"
                (onChange)="onCategoryFilterChange($event.value)"
                placeholder="All Categories"
              ></p-select>
            </div>

            <div class="filter-item">
              <label>Priority</label>
              <p-select
                [options]="priorityOptions"
                [ngModel]="filters().reviewPriority"
                (onChange)="onPriorityFilterChange($event.value)"
                placeholder="All Priorities"
              ></p-select>
            </div>

            <div class="filter-item">
              <app-button
                iconLeft="pi-times"
                variant="outlined"
                size="sm"
                (clicked)="clearFilters()"
                >Clear Filters</app-button
              >
            </div>
          </div>
        </app-card-shell>
      </div>

      <!-- Loading State -->
      @if (decisionService.isLoading()) {
        <app-loading
          [visible]="true"
          variant="inline"
          message="Loading decisions..."
        />
      }

      <!-- Error State -->
      @if (decisionService.error()) {
        <div class="error-state">
          <p>Error: {{ decisionService.error() }}</p>
          <app-button (clicked)="loadData()">Retry</app-button>
        </div>
      }

      <!-- Due for Review Section -->
      @if (dueForReview().length > 0) {
        <div class="section">
          <app-card-shell
            title="Due for Review ({{ dueForReview().length }})"
            headerIcon="pi-clock"
          >
            <ng-container header-actions>
              <app-button
                variant="outlined"
                size="sm"
                [routerLink]="['/staff/decisions']"
                [queryParams]="{ dueForReview: 'true' }"
                >View All</app-button
              >
            </ng-container>

            <div class="decisions-grid">
              @for (
                decision of dueForReview().slice(
                  0,
                  UI_LIMITS.DECISIONS_PREVIEW
                );
                track decision.id
              ) {
                <app-decision-card
                  [decision]="decision"
                  [canReview]="true"
                  (review)="onReviewDecision($event)"
                ></app-decision-card>
              }
            </div>
          </app-card-shell>
        </div>
      }

      <!-- Recent Decisions -->
      <div class="section">
        <app-card-shell title="Recent Decisions" headerIcon="pi-history">
          <ng-container header-actions>
            <app-button
              variant="outlined"
              size="sm"
              [routerLink]="['/staff/decisions']"
              >View All</app-button
            >
          </ng-container>

          @if (decisions().length === 0) {
            <app-empty-state
              icon="pi-inbox"
              heading="No decisions found"
              actionLabel="Create First Decision"
              actionIcon="pi-plus"
              [actionHandler]="openCreateDialogHandler"
            />
          } @else {
            <div class="decisions-grid">
              @for (
                decision of decisions().slice(
                  0,
                  UI_LIMITS.DECISIONS_LIST_COUNT
                );
                track decision.id
              ) {
                <app-decision-card
                  [decision]="decision"
                  [canReview]="canReviewDecision(decision)"
                  (review)="onReviewDecision($event)"
                ></app-decision-card>
              }
            </div>
          }
        </app-card-shell>
      </div>

      <!-- Create Decision Dialog -->
      <app-create-decision-dialog
        [visible]="showCreateDialog()"
        (visibleChange)="onCreateDialogVisibleChange($event)"
        (created)="onDecisionCreated($event)"
      ></app-create-decision-dialog>

      <!-- Review Decision Dialog -->
      <app-review-decision-dialog
        [visible]="showReviewDialog()"
        [decision]="selectedDecisionForReview()"
        (visibleChange)="onReviewDialogVisibleChange($event)"
        (reviewed)="onDecisionReviewed($event)"
      ></app-review-decision-dialog>
    </div>
  `,
  styles: [
    `
      .decision-ledger-dashboard {
        padding: var(--space-6);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(
          auto-fit,
          minmax(calc(var(--size-100) + var(--size-150)), 1fr)
        );
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .stat-block__value {
        font-size: var(--ds-font-size-3xl);
        font-weight: var(--ds-font-weight-bold);
        color: var(--color-text-primary);
        margin-bottom: var(--space-1);
      }

      .stat-value--warning {
        color: var(--ds-primary-orange);
      }

      .stat-value--danger {
        color: var(--ds-primary-red);
      }

      .stat-block__label {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      .filters-section {
        margin-bottom: var(--space-6);
      }

      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--size-200), 1fr));
        gap: var(--space-4);
        align-items: end;
      }

      .filter-item label {
        display: block;
        font-size: var(--ds-font-size-sm);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
        margin-bottom: var(--space-2);
      }

      .section {
        margin-bottom: var(--space-6);
      }

      .decisions-grid {
        display: grid;
        grid-template-columns: repeat(
          auto-fill,
          minmax(calc(var(--size-200) + var(--size-150)), 1fr)
        );
        gap: var(--space-4);
      }

      .error-state {
        padding: var(--space-8);
        text-align: center;
      }

      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }

        .decisions-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DecisionLedgerDashboardComponent implements OnInit {
  decisionService = inject(DecisionLedgerService);
  private logger = inject(LoggerService);

  // State
  filters = signal<DecisionFilters>({});
  showCreateDialog = signal(false);
  showReviewDialog = signal(false);
  selectedDecisionForReview = signal<DecisionLedgerEntry | null>(null);

  // Computed
  decisions = computed(() => this.decisionService.decisions());
  stats = computed(() => this.decisionService.stats());
  dueForReview = computed(() => this.decisionService.dueForReview());

  // Constants exposed to template
  protected readonly UI_LIMITS = UI_LIMITS;

  // Filter options
  statusOptions = [
    { label: "All Statuses", value: undefined },
    { label: "Active", value: "active" },
    { label: "Reviewed", value: "reviewed" },
    { label: "Superseded", value: "superseded" },
    { label: "Expired", value: "expired" },
    { label: "Cancelled", value: "cancelled" },
  ];

  categoryOptions = [
    { label: "All Categories", value: undefined },
    { label: "Medical", value: "medical" },
    { label: "Load", value: "load" },
    { label: "Nutrition", value: "nutrition" },
    { label: "Psychological", value: "psychological" },
    { label: "Tactical", value: "tactical" },
    { label: "Recovery", value: "recovery" },
  ];

  priorityOptions = [
    { label: "All Priorities", value: undefined },
    { label: "Critical", value: "critical" },
    { label: "High", value: "high" },
    { label: "Normal", value: "normal" },
    { label: "Low", value: "low" },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    await this.decisionService.refresh();
    await this.applyFilters();
  }

  async applyFilters(): Promise<void> {
    const currentFilters = this.filters();
    await this.decisionService.getDecisions(currentFilters);
  }

  onStatusFilterChange(value: DecisionFilters["status"] | undefined): void {
    this.filters.update((current) => ({ ...current, status: value }));
    this.applyFilters();
  }

  onCategoryFilterChange(
    value: DecisionFilters["decisionCategory"] | undefined,
  ): void {
    this.filters.update((current) => ({ ...current, decisionCategory: value }));
    this.applyFilters();
  }

  onPriorityFilterChange(
    value: DecisionFilters["reviewPriority"] | undefined,
  ): void {
    this.filters.update((current) => ({ ...current, reviewPriority: value }));
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters.set({});
    this.applyFilters();
  }

  canReviewDecision(decision: DecisionLedgerEntry): boolean {
    return (
      decision.status === "active" &&
      new Date(decision.reviewDate) <= new Date()
    );
  }

  onReviewDecision(decision: DecisionLedgerEntry): void {
    this.selectedDecisionForReview.set(decision);
    this.showReviewDialog.set(true);
  }

  async onDecisionReviewed(request: ReviewDecisionRequest): Promise<void> {
    try {
      await this.decisionService.reviewDecision(request.decisionId, request);
      this.showReviewDialog.set(false);
      this.selectedDecisionForReview.set(null);
      await this.loadData();
    } catch (error) {
      this.logger.error("Error reviewing decision", error);
    }
  }

  openCreateDialog(): void {
    this.showCreateDialog.set(true);
  }

  readonly openCreateDialogHandler = (): void => this.openCreateDialog();

  onCreateDialogVisibleChange(visible: boolean): void {
    this.showCreateDialog.set(visible);
  }

  onReviewDialogVisibleChange(visible: boolean): void {
    this.showReviewDialog.set(visible);
  }

  async onDecisionCreated(request: CreateDecisionRequest): Promise<void> {
    try {
      await this.decisionService.createDecision(request);
      this.showCreateDialog.set(false);
      await this.loadData();
    } catch (error) {
      this.logger.error("Error creating decision", error);
    }
  }
}
