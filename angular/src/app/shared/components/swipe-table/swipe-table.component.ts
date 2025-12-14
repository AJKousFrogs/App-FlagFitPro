import {
  Component,
  Input,
  HostListener,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-swipe-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TableModule, ButtonModule],
  template: `
    <div class="swipe-table-container" #tableContainer>
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
              <th>{{ col.header }}</th>
            }
            <th class="actions-header">Actions</th>
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
              swipingIndex === rowIndex ? 'translateX(-' + swipeDistance + 'px)' : 'translateX(0)'
            "
          >
            @for (col of columns(); track col.field) {
              <td>
                {{ getFieldValue(row, col.field) }}
              </td>
            }
            <td class="actions-cell">
              <!-- Swipe actions overlay -->
              <div
                class="swipe-actions"
                [class.visible]="swipingIndex === rowIndex && swipeDistance > 60"
              >
                <button
                  class="action-btn edit"
                  (click)="editRow(row)"
                  aria-label="Edit row"
                >
                  <i class="pi pi-pencil"></i>
                </button>
                <button
                  class="action-btn delete"
                  (click)="deleteRow(row)"
                  aria-label="Delete row"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="columns().length + 1" class="text-center">
              No data available
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [
    `
      .swipe-table-container {
        position: relative;
        overflow-x: hidden;
      }

      .swipe-enabled-table {
        width: 100%;
      }

      .swipe-row {
        position: relative;
        transition: transform 0.3s ease;
        touch-action: pan-y;
      }

      .swipe-row.swiping {
        transition: none;
      }

      .actions-header {
        width: 120px;
        text-align: center;
      }

      .actions-cell {
        position: relative;
        width: 120px;
        overflow: visible;
      }

      .swipe-actions {
        position: absolute;
        right: -120px;
        top: 0;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 16px;
        transition: right 0.3s ease;
        background: var(--p-surface-card);
        z-index: 10;
      }

      .swipe-actions.visible {
        right: 0;
      }

      .action-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: none;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .action-btn:hover {
        transform: scale(1.1);
      }

      .action-btn:active {
        transform: scale(0.95);
      }

      .action-btn.edit {
        background: var(--p-primary-color);
      }

      .action-btn.delete {
        background: #ef4444;
      }

      .action-btn i {
        font-size: 1rem;
      }

      @media (min-width: 768px) {
        .swipe-row {
          transition: none;
        }

        .swipe-actions {
          position: static;
          right: auto;
          display: flex;
        }

        .swipe-actions.visible {
          right: auto;
        }
      }
    `,
  ],
})
export class SwipeTableComponent {
  @Input() data = signal<any[]>([]);
  @Input() columns = signal<
    Array<{ field: string; header: string }>
  >([]);
  @Input() onEdit?: (row: any) => void;
  @Input() onDelete?: (row: any) => void;

  @ViewChild('tableContainer') tableContainer!: ElementRef;

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

  editRow(row: any) {
    if (this.onEdit) {
      this.onEdit(row);
    }
    this.resetSwipe();
  }

  deleteRow(row: any) {
    if (this.onDelete) {
      this.onDelete(row);
    }
    this.resetSwipe();
  }

  private resetSwipe() {
    this.swipingIndex = null;
    this.swipeDistance = 0;
  }

  getFieldValue(row: any, field: string): any {
    // Support nested fields like "user.name"
    return field.split('.').reduce((obj, key) => obj?.[key], row);
  }
}

