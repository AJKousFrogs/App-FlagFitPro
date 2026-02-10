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
import { Select } from "primeng/select";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { SearchInputComponent } from "../../../shared/components/search-input/search-input.component";
import { POSITION_FILTER_OPTIONS, STATUS_OPTIONS } from "../roster.models";

@Component({
  selector: "app-roster-filters",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    Select,
    ButtonComponent,
    IconButtonComponent,
    SearchInputComponent,
  ],
  template: `
    <div class="search-filter-bar ds-toolbar ds-toolbar--card">
      <app-search-input
        class="search-box"
        placeholder="Search players by name..."
        [ngModel]="searchQuery()"
        (ngModelChange)="searchQuery.set($event)"
        ariaLabel="Search players by name"
        [clearable]="true"
      />

      <div class="filter-group">
        <p-select
          [options]="positionOptions"
          [(ngModel)]="positionFilter"
          placeholder="All Positions"
          [showClear]="true"
          class="filter-select"
          (ngModelChange)="positionFilterChange.emit($event)"
        ></p-select>

        <p-select
          [options]="statusOptions"
          [(ngModel)]="statusFilter"
          placeholder="All Status"
          [showClear]="true"
          class="filter-select"
          (ngModelChange)="statusFilterChange.emit($event)"
        ></p-select>
      </div>

      <!-- Bulk Actions -->
      @if (canManage() && selectedCount() > 0) {
        <div class="bulk-actions">
          <span class="selected-count">{{ selectedCount() }} selected</span>
          <app-button
            variant="outlined"
            size="sm"
            iconLeft="pi-tag"
            (clicked)="bulkStatusChange.emit()"
            >Change Status</app-button
          >
          @if (canDelete()) {
            <app-button
              variant="outlined"
              size="sm"
              iconLeft="pi-trash"
              (clicked)="bulkRemove.emit()"
              >Remove</app-button
            >
          }
          <app-icon-button
            icon="pi-times"
            variant="text"
            size="sm"
            (clicked)="clearSelection.emit()"
            ariaLabel="Clear all filters"
            tooltip="Clear filters"
          />
        </div>
      }
    </div>
  `,
  styleUrl: "./roster-filters.component.scss",
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
