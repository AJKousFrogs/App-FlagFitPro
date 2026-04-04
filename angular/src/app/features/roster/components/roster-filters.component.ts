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
  DestroyRef,
  inject,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { SearchInputComponent } from "../../../shared/components/search-input/search-input.component";
import { POSITION_FILTER_OPTIONS, STATUS_OPTIONS } from "../roster.models";

@Component({
  selector: "app-roster-filters",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    SelectComponent,
    ButtonComponent,
    IconButtonComponent,
    SearchInputComponent,
  ],
  template: `
    <div class="search-filter-bar ds-toolbar ds-toolbar--card">
      <app-search-input
        class="search-box"
        placeholder="Search players by name..."
        [formControl]="searchControl"
        ariaLabel="Search players by name"
        [clearable]="true"
      />

      <div class="filter-group">
        <app-select
          [options]="positionOptions"
          placeholder="All Positions"
          [showClear]="true"
          styleClass="filter-select"
          (change)="onPositionFilterSelect($event)"
        />

        <app-select
          [options]="statusOptions"
          placeholder="All Status"
          [showClear]="true"
          styleClass="filter-select"
          (change)="onStatusFilterSelect($event)"
        />
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
  private readonly destroyRef = inject(DestroyRef);

  // Two-way bindings
  searchQuery = model<string>("");
  searchControl = new FormControl("", { nonNullable: true });
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

  constructor() {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.searchQuery.set(value ?? "");
      });
  }

  onPositionFilterChange(value: string | null | undefined): void {
    const nextValue = value ?? null;
    this.positionFilter = nextValue;
    this.positionFilterChange.emit(nextValue);
  }

  onPositionFilterSelect(value: string | null | undefined): void {
    this.onPositionFilterChange(value ?? null);
  }

  onStatusFilterChange(value: string | null | undefined): void {
    const nextValue = value ?? null;
    this.statusFilter = nextValue;
    this.statusFilterChange.emit(nextValue);
  }

  onStatusFilterSelect(value: string | null | undefined): void {
    this.onStatusFilterChange(value ?? null);
  }
}
