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
  styleUrl: './roster-filters.component.scss',
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
