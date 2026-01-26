import {
  Component,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy,
  signal,
  input,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Table, TableModule } from "primeng/table";

@Component({
  selector: "app-swipe-table",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Table, TableModule],
  template: `
    <div
      class="swipe-table-container"
      #tableContainer
      role="region"
      [attr.aria-label]="tableLabel()"
      [attr.aria-describedby]="'table-instructions-' + tableId"
    >
      <!-- Screen reader instructions -->
      <span [id]="'table-instructions-' + tableId" class="sr-only">
        On mobile devices, swipe left on a row to reveal edit and delete
        actions. On desktop, use the action buttons in the Actions column.
      </span>

      <p-table
        [value]="data()"
        [scrollable]="true"
        scrollHeight="400px"
        class="swipe-enabled-table"
        [columns]="columns()"
      >
        <ng-template pTemplate="header">
          <tr>
            @for (col of columns(); track col.field) {
              <th scope="col" [attr.aria-sort]="null">{{ col.header }}</th>
            }
            <th scope="col" class="actions-header">Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-row let-rowIndex="rowIndex">
          <tr
            class="swipe-row"
            [class.swiping]="swipingIndex === rowIndex"
            (touchstart)="onTouchStart($event, rowIndex)"
            (touchmove)="onTouchMove($event, rowIndex)"
            (touchend)="onTouchEnd($event, rowIndex)"
            [style.transform]="
              swipingIndex === rowIndex
                ? 'translateX(-' + swipeDistance + 'px)'
                : 'translateX(0)'
            "
            [attr.aria-rowindex]="rowIndex + 1"
          >
            @for (col of columns(); track col.field) {
              <td [attr.data-label]="col.header">
                {{ getFieldValue(row, col.field) }}
              </td>
            }
            <td class="actions-cell" data-label="Actions">
              <!-- Swipe actions overlay -->
              <div
                class="swipe-actions"
                [class.visible]="
                  swipingIndex === rowIndex && swipeDistance > 60
                "
                role="group"
                aria-label="Row actions"
              >
                <button
                  class="action-btn edit"
                  (click)="editRow(row)"
                  [attr.aria-label]="'Edit row ' + (rowIndex + 1)"
                  type="button"
                >
                  <i class="pi pi-pencil" aria-hidden="true"></i>
                </button>
                <button
                  class="action-btn delete"
                  (click)="deleteRow(row)"
                  [attr.aria-label]="'Delete row ' + (rowIndex + 1)"
                  type="button"
                >
                  <i class="pi pi-trash" aria-hidden="true"></i>
                </button>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td
              [attr.colspan]="columns().length + 1"
              class="text-center"
              role="status"
            >
              No data available
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Live region for screen reader announcements -->
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {{ announcement() }}
      </div>
    </div>
  `,
  styleUrl: "./swipe-table.component.scss",
})
export class SwipeTableComponent<T = Record<string, unknown>> {
  // Angular 21: Use input() signal instead of @Input() with signal assignment
  data = input<T[]>([]);
  columns = input<Array<{ field: string; header: string }>>([]);
  onEdit = input<(row: T) => void>();
  onDelete = input<(row: T) => void>();
  tableLabel = input<string>("Data table");

  // Angular 21: Use viewChild() signal instead of @ViewChild()
  tableContainer = viewChild.required<ElementRef>("tableContainer");

  // Unique ID for accessibility
  tableId = Math.random().toString(36).substr(2, 9);

  // Announcement for screen readers
  announcement = signal<string>("");

  swipingIndex: number | null = null;
  swipeDistance = 0;
  touchStartX = 0;
  private readonly SWIPE_THRESHOLD = 60;
  private readonly MAX_SWIPE_DISTANCE = 120;

  onTouchStart(event: TouchEvent, index: number) {
    // Only enable swipe on mobile devices
    if (window.innerWidth >= 768) {
      return;
    }

    this.touchStartX = event.touches[0].clientX;
    this.swipingIndex = index;
    this.swipeDistance = 0;
  }

  onTouchMove(event: TouchEvent, index: number) {
    if (this.swipingIndex !== index || window.innerWidth >= 768) {
      return;
    }

    const currentX = event.touches[0].clientX;
    const deltaX = this.touchStartX - currentX;

    // Only allow swiping left (positive deltaX)
    if (deltaX > 0) {
      this.swipeDistance = Math.min(deltaX, this.MAX_SWIPE_DISTANCE);
    } else {
      this.swipeDistance = 0;
    }
  }

  onTouchEnd(event: TouchEvent, index: number) {
    if (this.swipingIndex !== index || window.innerWidth >= 768) {
      return;
    }

    if (this.swipeDistance > this.SWIPE_THRESHOLD) {
      // Show actions - distance is already set
    } else {
      // Reset position
      this.swipeDistance = 0;
      this.swipingIndex = null;
    }
  }

  editRow(row: T) {
    const editFn = this.onEdit();
    if (editFn) {
      editFn(row);
      this.announcement.set("Edit action triggered");
    }
    this.resetSwipe();
  }

  deleteRow(row: T) {
    const deleteFn = this.onDelete();
    if (deleteFn) {
      deleteFn(row);
      this.announcement.set("Delete action triggered");
    }
    this.resetSwipe();
  }

  private resetSwipe() {
    this.swipingIndex = null;
    this.swipeDistance = 0;
  }

  getFieldValue(row: T, field: string): unknown {
    // Support nested fields like "user.name"
    return field.split(".").reduce((obj: unknown, key: string) => {
      if (obj && typeof obj === "object" && key in obj) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, row);
  }
}
