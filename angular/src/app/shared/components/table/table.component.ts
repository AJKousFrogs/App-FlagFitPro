import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  output,
  TemplateRef,
  ViewEncapsulation,
} from "@angular/core";
import { TableModule, TablePageEvent, TableRowSelectEvent, TableRowUnSelectEvent } from "primeng/table";

@Component({
  selector: "app-table",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: "app-table-host" },
  imports: [CommonModule, TableModule],
  template: `
    <div class="app-table-container">
      <p-table
        [value]="data()"
        [columns]="columns()"
        [loading]="loading()"
        [paginator]="paginator()"
        [rows]="rows()"
        [(first)]="firstValue"
        (onPage)="page.emit($event)"
        [rowsPerPageOptions]="rowsPerPageOptions()"
        [showCurrentPageReport]="showCurrentPageReport()"
        [currentPageReportTemplate]="currentPageReportTemplate()"
        [rowHover]="rowHover()"
        [dataKey]="dataKey()"
        [selectionMode]="selectionMode()"
        [(selection)]="selectionValue"
        (selectionChange)="selectionChange.emit($event)"
        (onRowSelect)="rowSelect.emit($event)"
        (onRowUnselect)="rowUnselect.emit($event)"
        [sortMode]="sortMode()"
        [responsiveLayout]="responsiveLayout()"
        [attr.aria-label]="ariaLabel()"
        [scrollable]="scrollable()"
        [styleClass]="tableClasses()"
        [tableStyle]="tableStyle()"
      >
        <!-- Header Template -->
        <ng-template pTemplate="header" let-columns>
          @if (headerTemplate()) {
            <ng-container
              *ngTemplateOutlet="headerTemplate()!; context: { $implicit: columns }"
            ></ng-container>
          } @else {
            <tr>
              @for (col of columns; track col.field) {
                <th [pSortableColumn]="col.field">
                  {{ col.header }}
                  <p-sortIcon [field]="col.field"></p-sortIcon>
                </th>
              }
            </tr>
          }
        </ng-template>

        <!-- Body Template -->
        <ng-template pTemplate="body" let-rowData let-columns="columns">
          @if (bodyTemplate()) {
            <ng-container
              *ngTemplateOutlet="
                bodyTemplate()!;
                context: { $implicit: rowData, columns: columns }
              "
            ></ng-container>
          } @else {
            <tr [pSelectableRow]="rowData">
              @for (col of columns; track col.field) {
                <td>
                  {{ rowData[col.field] }}
                </td>
              }
            </tr>
          }
        </ng-template>

        <!-- Loading Body Template -->
        <ng-template pTemplate="loadingbody">
          <tr *ngFor="let _ of [].constructor(rows())">
            <td [attr.colspan]="columns().length" style="padding: 0; border: none;">
              <div class="skeleton-table__row">
                @for (col of columns(); track col.field) {
                  <div class="skeleton-table__cell"></div>
                }
              </div>
            </td>
          </tr>
        </ng-template>

        <!-- Empty Message Template -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="columns().length" class="text-center p-4">
              {{ emptyMessage() }}
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [
    `
      .app-table-host {
        display: block;
        width: 100%;
      }
      .app-table-container {
        @apply w-full overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-700;
        -webkit-overflow-scrolling: touch;
      }
      .app-table-host .p-datatable-header {
        @apply bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700;
      }
      .app-table-host .app-table-surface-standard {
        --p-datatable-header-cell-padding: var(--space-4) var(--space-5);
        --p-datatable-body-cell-padding: var(--space-4) var(--space-5);
        --p-datatable-row-background: var(--surface-primary);
        --p-datatable-row-hover-background: var(--surface-secondary);
        --p-paginator-padding: var(--space-4) var(--space-5);
        --p-paginator-background: var(--surface-secondary);
        --p-paginator-border-color: transparent;
        --p-paginator-item-border-radius: var(--radius-md);
        --p-paginator-item-hover-background: var(--surface-tertiary);
      }
      .app-table-host th,
      .app-table-host td {
        white-space: nowrap;
      }
    `,
  ],
})
export class TableComponent<T = unknown> {
  // Inputs
  data = input.required<T[]>();
  columns = input<{ field: string; header: string }[]>([]);
  loading = input(false);
  paginator = input(false);
  rows = input(10);
  first = input(0);
  rowsPerPageOptions = input([10, 25, 50]);
  showCurrentPageReport = input(false);
  currentPageReportTemplate = input(
    "Showing {first} to {last} of {totalRecords} entries",
  );
  rowHover = input(true);
  dataKey = input<string | undefined>(undefined);
  selectionMode = input<"single" | "multiple" | null>(null);
  selection = input<T | T[] | null>(null);
  emptyMessage = input("No records found");
  styleClass = input("");
  density = input<"md" | "sm">("md");
  surface = input<"default" | "standard">("default");
  stripedRows = input(true);
  gridlines = input(true);
  sortMode = input<"single" | "multiple">("single");
  responsiveLayout = input<"scroll" | "stack">("scroll");
  ariaLabel = input("");
  scrollable = input(false);
  minTableWidth = input("50rem");

  // Template Inputs
  bodyTemplate = contentChild<TemplateRef<{ $implicit: T; columns: unknown[] }>>("body");
  headerTemplate = contentChild<TemplateRef<{ $implicit: unknown[] }>>("header");

  // Outputs
  selectionChange = output<T | T[]>();
  rowSelect = output<TableRowSelectEvent<T>>();
  rowUnselect = output<TableRowUnSelectEvent<T>>();
  page = output<TablePageEvent>();

  // Internal State for Two-Way Binding shim
  protected _selection: T | T[] | null = null;
  protected readonly tableClasses = computed(() =>
    [
      this.gridlines() ? "p-datatable-gridlines" : "",
      this.stripedRows() ? "p-datatable-striped" : "",
      this.density() === "sm" ? "p-datatable-sm" : "",
      this.surface() === "standard" ? "app-table-surface-standard" : "",
      this.styleClass(),
    ]
      .filter(Boolean)
      .join(" "),
  );
  protected readonly tableStyle = computed(() => ({
    "min-width": this.minTableWidth(),
  }));

  get selectionValue() {
    return this.selection() ?? this._selection;
  }

  set selectionValue(val: T | T[] | null) {
    this._selection = val;
    if (val !== null) {
      this.selectionChange.emit(val);
    }
  }

  protected _first = 0;
  get firstValue() {
    return this.first() || this._first;
  }
  set firstValue(val: number) {
    this._first = val;
  }
}
