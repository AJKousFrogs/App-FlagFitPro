/**
 * Decision Ledger Dashboard Component
 * 
 * Main dashboard for viewing and managing decisions
 */

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
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { DropdownModule } from "primeng/dropdown";
import { MainLayoutComponent } from "@shared/layouts/main-layout/main-layout.component";
import { PageHeaderComponent } from "@shared/components/page-header/page-header.component";
import { CardShellComponent } from "@shared/components/card-shell/card-shell.component";
import { DecisionCardComponent } from "./decision-card.component";
import { CreateDecisionDialogComponent } from "./create-decision-dialog.component";
import { ReviewDecisionDialogComponent } from "./review-decision-dialog.component";
import { DecisionLedgerService } from "@core/services/decision-ledger.service";
import type {
  DecisionLedgerEntry,
  DecisionFilters,
  CreateDecisionRequest,
  ReviewDecisionRequest,
} from "@core/models/decision-ledger.models";

@Component({
  selector: "app-decision-ledger-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    MainLayoutComponent,
    PageHeaderComponent,
    CardShellComponent,
    DecisionCardComponent,
    CreateDecisionDialogComponent,
    ReviewDecisionDialogComponent,
  ],
  template: `
    <app-main-layout>
      <div class="decision-ledger-dashboard">
        <app-page-header
          title="Decision Ledger"
          subtitle="Track decisions, reviews, and outcomes"
        >
          <p-button
            label="New Decision"
            icon="pi pi-plus"
            (onClick)="openCreateDialog()"
          ></p-button>
        </app-page-header>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <app-card-shell title="Active Decisions" headerIcon="pi-check-circle">
            <div class="stat-value">{{ stats()?.active || 0 }}</div>
            <div class="stat-label">Currently active</div>
          </app-card-shell>

          <app-card-shell title="Due for Review" headerIcon="pi-clock">
            <div class="stat-value stat-value--warning">
              {{ stats()?.dueForReview || 0 }}
            </div>
            <div class="stat-label">Requires attention</div>
          </app-card-shell>

          <app-card-shell title="Overdue" headerIcon="pi-exclamation-triangle">
            <div class="stat-value stat-value--danger">
              {{ stats()?.overdue || 0 }}
            </div>
            <div class="stat-label">Past review date</div>
          </app-card-shell>

          <app-card-shell title="Low Confidence" headerIcon="pi-info-circle">
            <div class="stat-value stat-value--warning">
              {{ stats()?.lowConfidence || 0 }}
            </div>
            <div class="stat-label">Need more data</div>
          </app-card-shell>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <app-card-shell title="Filters" headerIcon="pi-filter">
            <div class="filters-grid">
              <div class="filter-item">
                <label>Status</label>
                <p-dropdown
                  [options]="statusOptions"
                  [(ngModel)]="filters().status"
                  placeholder="All Statuses"
                  (onChange)="applyFilters()"
                ></p-dropdown>
              </div>

              <div class="filter-item">
                <label>Category</label>
                <p-dropdown
                  [options]="categoryOptions"
                  [(ngModel)]="filters().decisionCategory"
                  placeholder="All Categories"
                  (onChange)="applyFilters()"
                ></p-dropdown>
              </div>

              <div class="filter-item">
                <label>Priority</label>
                <p-dropdown
                  [options]="priorityOptions"
                  [(ngModel)]="filters().reviewPriority"
                  placeholder="All Priorities"
                  (onChange)="applyFilters()"
                ></p-dropdown>
              </div>

              <div class="filter-item">
                <p-button
                  label="Clear Filters"
                  icon="pi pi-times"
                  [outlined]="true"
                  size="small"
                  (onClick)="clearFilters()"
                ></p-button>
              </div>
            </div>
          </app-card-shell>
        </div>

        <!-- Loading State -->
        @if (decisionService.isLoading()) {
          <div class="loading-state">
            <p>Loading decisions...</p>
          </div>
        }

        <!-- Error State -->
        @if (decisionService.error()) {
          <div class="error-state">
            <p>Error: {{ decisionService.error() }}</p>
            <p-button label="Retry" (onClick)="loadData()"></p-button>
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
                <p-button
                  label="View All"
                  [outlined]="true"
                  size="small"
                  [routerLink]="['/staff/decisions']"
                  [queryParams]="{ dueForReview: true }"
                ></p-button>
              </ng-container>

              <div class="decisions-grid">
                @for (decision of dueForReview().slice(0, 3); track decision.id) {
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
          <app-card-shell
            title="Recent Decisions"
            headerIcon="pi-history"
          >
            <ng-container header-actions>
              <p-button
                label="View All"
                [outlined]="true"
                size="small"
                [routerLink]="['/staff/decisions']"
              ></p-button>
            </ng-container>

            @if (decisions().length === 0) {
              <div class="empty-state">
                <p>No decisions found</p>
                <p-button
                  label="Create First Decision"
                  icon="pi pi-plus"
                  (onClick)="openCreateDialog()"
                ></p-button>
              </div>
            } @else {
              <div class="decisions-grid">
                @for (decision of decisions().slice(0, 6); track decision.id) {
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
          (visibleChange)="showCreateDialog.set($event)"
          (created)="onDecisionCreated($event)"
        ></app-create-decision-dialog>

        <!-- Review Decision Dialog -->
        <app-review-decision-dialog
          [visible]="showReviewDialog()"
          [decision]="selectedDecisionForReview()"
          (visibleChange)="showReviewDialog.set($event)"
          (reviewed)="onDecisionReviewed($event)"
        ></app-review-decision-dialog>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .decision-ledger-dashboard {
        padding: var(--space-6);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: var(--space-1);
      }

      .stat-value--warning {
        color: var(--ds-primary-orange);
      }

      .stat-value--danger {
        color: var(--ds-primary-red);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .filters-section {
        margin-bottom: var(--space-6);
      }

      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        align-items: end;
      }

      .filter-item label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-text-primary);
        margin-bottom: var(--space-2);
      }

      .section {
        margin-bottom: var(--space-6);
      }

      .decisions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: var(--space-4);
      }

      .loading-state,
      .error-state {
        padding: var(--space-8);
        text-align: center;
      }

      .empty-state {
        padding: var(--space-8);
        text-align: center;
        color: var(--color-text-secondary);
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

  // State
  filters = signal<DecisionFilters>({});
  showCreateDialog = signal(false);
  showReviewDialog = signal(false);
  selectedDecisionForReview = signal<DecisionLedgerEntry | null>(null);

  // Computed
  decisions = computed(() => this.decisionService.decisions());
  stats = computed(() => this.decisionService.stats());
  dueForReview = computed(() => this.decisionService.dueForReview());

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
      await this.decisionService.reviewDecision(
        request.decisionId,
        request,
      );
      this.showReviewDialog.set(false);
      this.selectedDecisionForReview.set(null);
      await this.loadData();
    } catch (error) {
      console.error("Error reviewing decision:", error);
    }
  }

  openCreateDialog(): void {
    this.showCreateDialog.set(true);
  }

  async onDecisionCreated(request: CreateDecisionRequest): Promise<void> {
    try {
      await this.decisionService.createDecision(request);
      this.showCreateDialog.set(false);
      await this.loadData();
    } catch (error) {
      console.error("Error creating decision:", error);
    }
  }
}

