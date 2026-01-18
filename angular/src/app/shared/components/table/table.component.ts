import {
  Component,
  input,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

/**
 * Table Component - Angular 21
 *
 * A data table component with sorting support
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-table",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <table
        class="table"
        [class.table-striped]="striped()"
        [class.table-bordered]="bordered()"
      >
        <thead>
          <tr>
            @for (column of columns(); track column.key) {
              <th
                [class.sortable]="column.sortable"
                [class.sort-asc]="
                  sortColumn() === column.key && sortDirection() === 'asc'
                "
                [class.sort-desc]="
                  sortColumn() === column.key && sortDirection() === 'desc'
                "
                (click)="onSort(column)"
                [attr.aria-sort]="getAriaSort(column)"
              >
                {{ column.label }}
                @if (column.sortable) {
                  <span class="sort-icon">
                    @if (sortColumn() === column.key) {
                      @if (sortDirection() === "asc") {
                        <i class="pi pi-sort-up"></i>
                      } @else {
                        <i class="pi pi-sort-down"></i>
                      }
                    } @else {
                      <i class="pi pi-sort"></i>
                    }
                  </span>
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of sortedData(); track trackByIndex($index)) {
            <tr>
              @for (column of columns(); track column.key) {
                <td>{{ row[column.key] }}</td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="columns().length" class="empty-message">
                No data available
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .table-container {
        overflow-x: auto;
        border-radius: var(--p-border-radius);
        border: 1px solid var(--p-surface-border);
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        background: var(--surface-primary);
      }

      .table th {
        padding: 1rem;
        text-align: left;
        font-weight: var(--ds-font-weight-semibold);
        color: var(--p-text-color);
        background: var(--p-surface-50);
        border-bottom: 2px solid var(--p-surface-border);
        position: relative;
      }

      .table th.sortable {
        cursor: pointer;
        user-select: none;
        padding-right: 2rem;
      }

      .table th.sortable:hover {
        background: var(--p-surface-100);
      }

      .sort-icon {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--p-text-color-secondary);
      }

      .table th.sort-asc .sort-icon,
      .table th.sort-desc .sort-icon {
        color: var(--p-primary-color);
      }

      .table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--p-surface-border);
        color: var(--p-text-color);
      }

      .table tbody tr:hover {
        background: var(--p-surface-50);
      }

      .table-striped tbody tr:nth-child(even) {
        background: var(--p-surface-25);
      }

      .table-bordered th,
      .table-bordered td {
        border: 1px solid var(--p-surface-border);
      }

      .empty-message {
        text-align: center;
        padding: 2rem;
        color: var(--p-text-color-secondary);
        font-style: italic;
      }
    `,
  ],
})
export class TableComponent {
  // Angular 21: Use input() signals instead of @Input()
  columns = input<TableColumn[]>([]);
  data = input<Array<Record<string, unknown>>>([]);
  striped = input<boolean>(false);
  bordered = input<boolean>(false);

  // Sorting state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<"asc" | "desc">("asc");

  // Computed sorted data
  sortedData = computed(() => {
    const data = this.data();
    const sortCol = this.sortColumn();

    if (!sortCol) {
      return data;
    }

    const direction = this.sortDirection();
    return [...data].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (aVal < bVal) {
        return direction === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  });

  onSort(column: TableColumn): void {
    if (!column.sortable) {
      return;
    }

    if (this.sortColumn() === column.key) {
      this.sortDirection.update((current) =>
        current === "asc" ? "desc" : "asc",
      );
    } else {
      this.sortColumn.set(column.key);
      this.sortDirection.set("asc");
    }
  }

  getAriaSort(column: TableColumn): string | null {
    if (!column.sortable || this.sortColumn() !== column.key) {
      return null;
    }
    return this.sortDirection() === "asc" ? "ascending" : "descending";
  }

  trackByIndex(index: number): number {
    return index;
  }
}
