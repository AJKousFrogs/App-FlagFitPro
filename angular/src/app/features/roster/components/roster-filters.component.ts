/**
 * Roster Filters Component
 * Search and filter bar for roster
 */
import {
  Component,
  input,
  output,
  model,
  ChangeDetectionStrategy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { Select } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { POSITION_FILTER_OPTIONS, STATUS_OPTIONS } from "../roster.models";

@Component({
  selector: "app-roster-filters",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, InputTextModule, Select, ButtonModule],
  template: `
    <div class="search-filter-bar">
      <div class="search-box">
        <i class="pi pi-search"></i>
        <input
          type="text"
          pInputText
          placeholder="Search players by name..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          class="search-input"
        />
        @if (searchQuery()) {
          <button class="clear-search" (click)="searchQuery.set('')">
            <i class="pi pi-times"></i>
          </button>
        }
      </div>

      <div class="filter-group">
        <p-select
          [options]="positionOptions"
          [(ngModel)]="positionFilter"
          placeholder="All Positions"
          [showClear]="true"
          styleClass="filter-select"
          (ngModelChange)="positionFilterChange.emit($event)"
        ></p-select>

        <p-select
          [options]="statusOptions"
          [(ngModel)]="statusFilter"
          placeholder="All Status"
          [showClear]="true"
          styleClass="filter-select"
          (ngModelChange)="statusFilterChange.emit($event)"
        ></p-select>
      </div>

      <!-- Bulk Actions -->
      @if (canManage() && selectedCount() > 0) {
        <div class="bulk-actions">
          <span class="selected-count">{{ selectedCount() }} selected</span>
          <p-button
            label="Change Status"
            icon="pi pi-tag"
            [outlined]="true"
            size="small"
            (onClick)="bulkStatusChange.emit()"
          ></p-button>
          @if (canDelete()) {
            <p-button
              label="Remove"
              icon="pi pi-trash"
              severity="danger"
              [outlined]="true"
              size="small"
              (onClick)="bulkRemove.emit()"
            ></p-button>
          }
          <p-button
            icon="pi pi-times"
            [rounded]="true"
            [text]="true"
            size="small"
            (onClick)="clearSelection.emit()"
            pTooltip="Clear selection"
          ></p-button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .search-filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        align-items: center;
        margin-bottom: var(--space-6);
        padding: var(--space-4);
        background: var(--p-surface-card);
        border-radius: var(--p-border-radius);
        box-shadow: var(--shadow-sm);
      }

      .search-box {
        position: relative;
        flex: 1;
        min-width: 250px;
      }

      .search-box i {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
      }

      .search-input {
        width: 100%;
        padding-left: 40px !important;
        padding-right: 36px !important;
      }

      .clear-search {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 4px;
        border-radius: 50%;
        transition: background 0.2s;
      }

      .clear-search:hover {
        background: var(--p-surface-100);
      }

      .filter-group {
        display: flex;
        gap: var(--space-3);
      }

      :host ::ng-deep .filter-select {
        min-width: 150px;
      }

      .bulk-actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding-left: var(--space-4);
        border-left: 1px solid var(--p-surface-200);
        margin-left: auto;
      }

      .selected-count {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
      }

      /* Responsive */
      @media (min-width: 769px) and (max-width: 1023px) {
        .search-filter-bar {
          flex-wrap: wrap;
        }

        .search-box {
          min-width: 200px;
        }

        :host ::ng-deep .filter-select {
          min-width: 130px;
        }
      }

      @media (max-width: 768px) {
        .search-filter-bar {
          flex-direction: column;
          align-items: stretch;
          padding: var(--space-3);
        }

        .search-box {
          min-width: 100%;
        }

        .filter-group {
          flex-direction: column;
          width: 100%;
        }

        :host ::ng-deep .filter-select {
          min-width: 100%;
        }

        .bulk-actions {
          border-left: none;
          padding-left: 0;
          padding-top: var(--space-3);
          border-top: 1px solid var(--p-surface-200);
          margin-left: 0;
          justify-content: center;
          width: 100%;
        }
      }
    `,
  ],
})
export class RosterFiltersComponent {
  // Two-way bindings
  searchQuery = model<string>("");
  positionFilter: string | null = null;
  statusFilter: string | null = null;

  // Inputs
  selectedCount = input<number>(0);
  canManage = input<boolean>(false);
  canDelete = input<boolean>(false);

  // Outputs
  positionFilterChange = output<string | null>();
  statusFilterChange = output<string | null>();
  bulkStatusChange = output<void>();
  bulkRemove = output<void>();
  clearSelection = output<void>();

  // Options
  positionOptions = POSITION_FILTER_OPTIONS;
  statusOptions = STATUS_OPTIONS;
}
