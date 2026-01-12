import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  TableModule,
  TableColumnReorderEvent,
  TableColResizeEvent,
} from "primeng/table";
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";
import { CheckboxModule } from "primeng/checkbox";
import { InputTextModule } from "primeng/inputtext";
import { MultiSelect } from "primeng/multiselect";
import { MenuModule } from "primeng/menu";

/**
 * Generic table row type with selection support
 */
export interface TableRow {
  _selected?: boolean;
  [key: string]: unknown;
}

/**
 * Enhanced Column Definition
 */
export interface EnhancedTableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  resizable?: boolean;
  reorderable?: boolean;
  editable?: boolean;
  visible?: boolean;
  width?: string;
  minWidth?: number;
  type?: "text" | "number" | "date" | "boolean" | "custom";
  customTemplate?: unknown;
}

/**
 * Table Preferences (saved to localStorage)
 */
export interface TablePreferences {
  sortField?: string;
  sortOrder?: 1 | -1;
  visibleColumns?: string[];
  columnWidths?: Record<string, string>;
  columnOrder?: string[];
}

/**
 * Enhanced Data Table Component
 *
 * Features:
 * - Column resizing (drag column edge)
 * - Column reordering (drag column header)
 * - Saved preferences in localStorage
 * - Bulk actions (select all, export selected)
 * - Inline editing
 * - Mobile card view
 * - Full keyboard accessibility
 */
@Component({
  selector: "app-enhanced-data-table",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CheckboxModule,
    InputTextModule,
    MultiSelect,
    MenuModule,

    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <div class="enhanced-table-container" [class.mobile-view]="isMobileView()">
      <!-- Toolbar -->
      <div class="table-toolbar">
        <div class="toolbar-left">
          <!-- Bulk selection -->
          @if (selectable()) {
            <div class="checkbox-with-label">
              <p-checkbox
                [(ngModel)]="selectAll"
                [binary]="true"
                variant="filled"
                (onValueChange)="toggleSelectAll()"
              />
              <span class="checkbox-label"
                >{{ selectedRows().length }} selected</span
              >
            </div>
          }

          <!-- Column visibility -->
          <p-multiSelect
            [options]="columnOptions()"
            [(ngModel)]="visibleColumnFields"
            (onValueChange)="onColumnVisibilityChange()"
            placeholder="Show Columns"
            optionLabel="label"
            optionValue="value"
            [showHeader]="false"
            styleClass="column-selector"
          >
            <ng-template let-column pTemplate="item">
              <div class="column-option">
                <i class="pi pi-eye"></i>
                <span>{{ column.label }}</span>
              </div>
            </ng-template>
          </p-multiSelect>
        </div>

        <div class="toolbar-right">
          <!-- Bulk actions -->
          @if (selectedRows().length > 0) {
            <app-button
              variant="outlined"
              size="sm"
              iconLeft="pi-download"
              (clicked)="exportSelected()"
              >Export Selected</app-button
            >
            <app-button
              variant="outlined"
              size="sm"
              iconLeft="pi-trash"
              (clicked)="deleteSelected()"
              >Delete Selected</app-button
            >
          }

          <!-- View toggle -->
          @if (supportsMobileView()) {
            <app-button
              variant="outlined"
              size="sm"
              (clicked)="toggleView()"
            ></app-button>
          }

          <!-- Reset preferences -->
          <app-icon-button
            icon="pi-refresh"
            variant="outlined"
            size="sm"
            (clicked)="resetPreferences()"
            ariaLabel="refresh"
          />
        </div>
      </div>

      <!-- Desktop Table View -->
      @if (!isMobileView()) {
        <p-table
          [value]="data()"
          [columns]="visibleColumns()"
          [reorderableColumns]="reorderableColumns()"
          [resizableColumns]="resizableColumns()"
          columnResizeMode="expand"
          [scrollable]="true"
          scrollHeight="600px"
          [virtualScroll]="data().length > 100"
          [virtualScrollItemSize]="46"
          (onColReorder)="onColumnReorder($event)"
          (onColResize)="onColumnResize($event)"
          styleClass="enhanced-table"
        >
          <ng-template pTemplate="header" let-columns>
            <tr>
              @if (selectable()) {
                <th style="width: 48px">
                  <p-checkbox
                    [(ngModel)]="selectAll"
                    [binary]="true"
                    variant="filled"
                    (onValueChange)="toggleSelectAll()"
                  />
                </th>
              }
              @for (col of columns; track col.field) {
                <th
                  [attr.pReorderableColumn]="
                    col.reorderable !== false ? '' : null
                  "
                  [attr.pResizableColumn]="col.resizable !== false ? '' : null"
                  [pSortableColumn]="col.sortable !== false ? col.field : null"
                  [style.width]="getColumnWidth(col)"
                  [style.min-width.px]="col.minWidth || 100"
                >
                  <div class="column-header">
                    <span>{{ col.header }}</span>
                    @if (col.sortable !== false) {
                      <p-sortIcon [field]="col.field" />
                    }
                  </div>
                </th>
              }
              @if (hasActions()) {
                <th style="width: 100px">Actions</th>
              }
            </tr>
          </ng-template>

          <ng-template
            pTemplate="body"
            let-rowData
            let-rowIndex="rowIndex"
            let-columns="columns"
          >
            <tr [class.selected]="isRowSelected(rowData)">
              @if (selectable()) {
                <td>
                  <p-checkbox
                    [(ngModel)]="rowData._selected"
                    [binary]="true"
                    variant="filled"
                    (onValueChange)="onRowSelect(rowData)"
                  />
                </td>
              }
              @for (col of columns; track col.field) {
                <td [attr.data-label]="col.header">
                  @if (isEditing(rowData, col.field)) {
                    <input
                      type="text"
                      class="inline-edit-input"
                      [(ngModel)]="editingValue"
                      (blur)="saveEdit(rowData, col.field)"
                      (keyup.enter)="saveEdit(rowData, col.field)"
                      (keyup.escape)="cancelEdit()"
                      #editInput
                    />
                  } @else {
                    <span
                      class="cell-value"
                      [class.editable]="col.editable"
                      (dblclick)="startEdit(rowData, col.field, $event)"
                    >
                      {{ getCellValue(rowData, col.field) }}
                    </span>
                  }
                </td>
              }
              @if (hasActions()) {
                <td class="actions-cell">
                  <app-button
                    variant="text"
                    size="sm"
                    iconLeft="pi-pencil"
                    (clicked)="editRow(rowData)"
                    >Edit row</app-button
                  >
                  <app-button
                    variant="text"
                    size="sm"
                    iconLeft="pi-trash"
                    (clicked)="deleteRow(rowData)"
                    >Delete row</app-button
                  >
                </td>
              }
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage" let-columns>
            <tr>
              <td
                [attr.colspan]="
                  columns.length +
                  (selectable() ? 1 : 0) +
                  (hasActions() ? 1 : 0)
                "
              >
                <div class="empty-message">
                  <i class="pi pi-inbox"></i>
                  <p>No data available</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }

      <!-- Mobile Card View -->
      @if (isMobileView()) {
        <div class="mobile-cards">
          @for (row of data(); track $index) {
            <div class="mobile-card" [class.selected]="isRowSelected(row)">
              @if (selectable()) {
                <div class="card-select">
                  <p-checkbox
                    [(ngModel)]="row._selected"
                    [binary]="true"
                    variant="filled"
                    (onValueChange)="onRowSelect(row)"
                  />
                </div>
              }

              <div class="card-content">
                @for (col of visibleColumns(); track col.field) {
                  <div class="card-field">
                    <div class="field-label">{{ col.header }}</div>
                    <div class="field-value">
                      {{ getCellValue(row, col.field) }}
                    </div>
                  </div>
                }
              </div>

              @if (hasActions()) {
                <div class="card-actions">
                  <app-button
                    variant="outlined"
                    size="sm"
                    iconLeft="pi-pencil"
                    (clicked)="editRow(row)"
                    >Edit</app-button
                  >
                  <app-button
                    variant="outlined"
                    size="sm"
                    iconLeft="pi-trash"
                    (clicked)="deleteRow(row)"
                    >Delete</app-button
                  >
                </div>
              }
            </div>
          } @empty {
            <div class="empty-message">
              <i class="pi pi-inbox"></i>
              <p>No data available</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: "./enhanced-data-table.component.scss",
})
export class EnhancedDataTableComponent {
  // Inputs
  data = input<TableRow[]>([]);
  columns = input<EnhancedTableColumn[]>([]);
  selectable = input<boolean>(false);
  resizableColumns = input<boolean>(true);
  reorderableColumns = input<boolean>(true);
  savePreferences = input<boolean>(true);
  preferencesKey = input<string>("enhanced-table");
  mobileBreakpoint = input<number>(768);

  // Outputs
  onEdit = output<TableRow>();
  onDelete = output<TableRow>();
  onBulkDelete = output<TableRow[]>();
  onExport = output<TableRow[]>();

  // Angular 21: Use viewChild() signal instead of @ViewChild()
  editInput = viewChild<ElementRef<HTMLInputElement>>("editInput");

  // State
  selectAll = signal<boolean>(false);
  selectedRows = signal<TableRow[]>([]);
  visibleColumnFields = signal<string[]>([]);
  columnWidths = signal<Record<string, string>>({});
  columnOrderState = signal<string[]>([]);
  isMobileView = signal<boolean>(false);

  // Editing state
  editingRow = signal<TableRow | null>(null);
  editingField = signal<string | null>(null);
  editingValue = signal<unknown>(null);

  // Computed
  visibleColumns = computed(() => {
    const cols = this.columns();
    const order = this.columnOrderState();
    const visibleFields = this.visibleColumnFields();

    // Filter visible columns
    let visible = cols.filter((col) => visibleFields.includes(col.field));

    // Apply custom order if exists
    if (order.length > 0) {
      visible = visible.sort((a, b) => {
        const aIndex = order.indexOf(a.field);
        const bIndex = order.indexOf(b.field);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return visible;
  });

  columnOptions = computed(() => {
    return this.columns().map((col) => ({
      label: col.header,
      value: col.field,
    }));
  });

  private lastColumnsHash = "";

  constructor() {
    // Initialize visible columns when columns input changes
    effect(() => {
      const cols = this.columns();
      // Create a hash of column fields to detect actual changes
      const colsHash = cols.map((c) => c.field).join(",");

      // Only reinitialize when columns actually change
      if (cols.length > 0 && colsHash !== this.lastColumnsHash) {
        this.lastColumnsHash = colsHash;
        this.visibleColumnFields.set(
          cols.filter((c) => c.visible !== false).map((c) => c.field),
        );
      }
    });

    // Load preferences
    effect(() => {
      if (this.savePreferences()) {
        this.loadPreferences();
      }
    });

    // Check mobile view
    this.checkMobileView();
  }

  @HostListener("window:resize")
  onResize(): void {
    this.checkMobileView();
  }

  private checkMobileView(): void {
    this.isMobileView.set(window.innerWidth < this.mobileBreakpoint());
  }

  supportsMobileView(): boolean {
    return this.mobileBreakpoint() > 0;
  }

  toggleView(): void {
    this.isMobileView.update((v) => !v);
  }

  // Selection
  toggleSelectAll(): void {
    const data = this.data();
    if (this.selectAll()) {
      data.forEach((row) => (row._selected = true));
      this.selectedRows.set([...data]);
    } else {
      data.forEach((row) => (row._selected = false));
      this.selectedRows.set([]);
    }
  }

  onRowSelect(_row: TableRow): void {
    const selected = this.data().filter((r) => r._selected);
    this.selectedRows.set(selected);
    this.selectAll.set(selected.length === this.data().length);
  }

  isRowSelected(row: TableRow): boolean {
    return row._selected === true;
  }

  // Column management
  onColumnVisibilityChange(): void {
    this.savePreferencesToStorage();
  }

  onColumnReorder(event: TableColumnReorderEvent): void {
    const order = event.columns?.map((col) => col.field) ?? [];
    this.columnOrderState.set(order);
    this.savePreferencesToStorage();
  }

  onColumnResize(event: TableColResizeEvent): void {
    const widths = { ...this.columnWidths() };
    const element = event.element as HTMLElement;
    const field = element.dataset?.["field"];
    if (field) {
      widths[field] = element.style.width;
      this.columnWidths.set(widths);
      this.savePreferencesToStorage();
    }
  }

  getColumnWidth(col: EnhancedTableColumn): string {
    return this.columnWidths()[col.field] || col.width || "auto";
  }

  // Inline editing
  startEdit(row: TableRow, field: string, _event: Event): void {
    const col = this.columns().find((c) => c.field === field);
    if (!col?.editable) return;

    this.editingRow.set(row);
    this.editingField.set(field);
    this.editingValue.set(this.getCellValue(row, field));

    setTimeout(() => {
      const input = this.editInput();
      input?.nativeElement.focus();
      input?.nativeElement.select();
    }, 50);
  }

  saveEdit(row: TableRow, field: string): void {
    if (this.editingRow() === row && this.editingField() === field) {
      this.setCellValue(row, field, this.editingValue());
      this.cancelEdit();
    }
  }

  cancelEdit(): void {
    this.editingRow.set(null);
    this.editingField.set(null);
    this.editingValue.set(null);
  }

  isEditing(row: TableRow, field: string): boolean {
    return this.editingRow() === row && this.editingField() === field;
  }

  getCellValue(row: TableRow, field: string): unknown {
    return field
      .split(".")
      .reduce(
        (obj: Record<string, unknown> | undefined, key: string) =>
          obj?.[key] as Record<string, unknown> | undefined,
        row as Record<string, unknown>,
      );
  }

  setCellValue(row: TableRow, field: string, value: unknown): void {
    const keys = field.split(".");
    const lastKey = keys.pop();
    if (!lastKey) return;

    const target = keys.reduce(
      (obj: Record<string, unknown>, key: string) =>
        obj[key] as Record<string, unknown>,
      row as Record<string, unknown>,
    );
    target[lastKey] = value;
  }

  // Actions
  hasActions(): boolean {
    // Since outputs are always available, we check if handlers are subscribed
    // In Angular's output() API, there's no direct way to check subscribers
    // Instead, we'll return true if the table is meant to show actions
    return true;
  }

  editRow(row: TableRow): void {
    this.onEdit.emit(row);
  }

  deleteRow(row: TableRow): void {
    this.onDelete.emit(row);
  }

  deleteSelected(): void {
    this.onBulkDelete.emit(this.selectedRows());
  }

  exportSelected(): void {
    const selected = this.selectedRows();
    this.onExport.emit(selected.length > 0 ? selected : this.data());
  }

  // Preferences
  private loadPreferences(): void {
    const key = this.preferencesKey();
    const stored = localStorage.getItem(key);
    if (!stored) return;

    try {
      const prefs: TablePreferences = JSON.parse(stored);
      if (prefs.visibleColumns) {
        this.visibleColumnFields.set(prefs.visibleColumns);
      }
      if (prefs.columnWidths) {
        this.columnWidths.set(prefs.columnWidths);
      }
      if (prefs.columnOrder) {
        this.columnOrderState.set(prefs.columnOrder);
      }
    } catch (e) {
      console.error("Failed to load table preferences", e);
    }
  }

  private savePreferencesToStorage(): void {
    if (!this.savePreferences()) return;

    const prefs: TablePreferences = {
      visibleColumns: this.visibleColumnFields(),
      columnWidths: this.columnWidths(),
      columnOrder: this.columnOrderState(),
    };

    localStorage.setItem(this.preferencesKey(), JSON.stringify(prefs));
  }

  resetPreferences(): void {
    localStorage.removeItem(this.preferencesKey());

    // Reset to defaults
    this.visibleColumnFields.set(
      this.columns()
        .filter((c) => c.visible !== false)
        .map((c) => c.field),
    );
    this.columnWidths.set({});
    this.columnOrderState.set([]);
  }
}
