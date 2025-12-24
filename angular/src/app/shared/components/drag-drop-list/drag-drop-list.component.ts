import {
  Component,
  signal,
  input,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  DragDropModule,
} from "@angular/cdk/drag-drop";
import { CardModule } from "primeng/card";

export interface DragDropItem {
  id: string;
  title: string;
  description?: string;
  [key: string]: any;
}

/**
 * Angular 21 Drag and Drop List Component
 * Uses CDK drag-drop module for reorderable lists
 */
@Component({
  selector: "app-drag-drop-list",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DragDropModule, CardModule],
  template: `
    <div class="drag-drop-container">
      <div class="list-section">
        <h3 class="list-title">{{ listTitle() }}</h3>
        <div
          cdkDropList
          [cdkDropListData]="items()"
          [cdkDropListDisabled]="disabled()"
          class="drop-list"
          (cdkDropListDropped)="onDrop($event)"
        >
          @for (item of items(); track item.id) {
            <div
              cdkDrag
              [cdkDragDisabled]="disabled()"
              class="drag-item"
              [class.dragging]="false"
            >
              <div class="drag-handle" cdkDragHandle>
                <i class="pi pi-bars"></i>
              </div>
              <div class="item-content">
                <div class="item-title">{{ item.title }}</div>
                @if (item.description) {
                  <div class="item-description">{{ item.description }}</div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      @if (showTargetList()) {
        <div class="list-section">
          <h3 class="list-title">{{ targetListTitle() }}</h3>
          <div
            cdkDropList
            [cdkDropListData]="targetItems()"
            [cdkDropListDisabled]="disabled()"
            class="drop-list target-list"
            (cdkDropListDropped)="onDrop($event)"
          >
            @for (item of targetItems(); track item.id) {
              <div cdkDrag [cdkDragDisabled]="disabled()" class="drag-item">
                <div class="drag-handle" cdkDragHandle>
                  <i class="pi pi-bars"></i>
                </div>
                <div class="item-content">
                  <div class="item-title">{{ item.title }}</div>
                  @if (item.description) {
                    <div class="item-description">{{ item.description }}</div>
                  }
                </div>
              </div>
            }
            @if (targetItems().length === 0) {
              <div class="empty-state">Drop items here</div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .drag-drop-container {
        display: flex;
        gap: 1.5rem;
        padding: 1rem;
      }

      .list-section {
        flex: 1;
        min-width: 300px;
      }

      .list-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--p-text-color);
      }

      .drop-list {
        min-height: 200px;
        border: 2px dashed var(--p-border-color);
        border-radius: var(--p-border-radius);
        padding: 0.75rem;
        background: var(--p-surface-ground);
        transition: border-color 0.2s ease;
      }

      .drop-list.cdk-drop-list-dragging {
        border-color: var(--p-primary-color);
        background: var(--p-primary-50);
      }

      .target-list {
        background: var(--p-surface-50);
      }

      .drag-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background: var(--p-surface-card);
        border: 1px solid var(--p-border-color);
        border-radius: var(--p-border-radius);
        cursor: move;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .drag-item:hover {
        box-shadow: var(--p-shadow-md);
      }

      .drag-item.cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .drag-item.cdk-drag-disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .drag-handle {
        color: var(--p-text-color-secondary);
        cursor: grab;
        display: flex;
        align-items: center;
        padding: 0.25rem;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .item-content {
        flex: 1;
      }

      .item-title {
        font-weight: 600;
        color: var(--p-text-color);
        margin-bottom: 0.25rem;
      }

      .item-description {
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--p-text-color-secondary);
        font-style: italic;
      }

      @media (max-width: 768px) {
        .drag-drop-container {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class DragDropListComponent {
  // Angular 21: Use input() signal instead of @Input() with signal assignment
  items = input.required<DragDropItem[]>();
  targetItems = input<DragDropItem[]>([]);
  listTitle = input<string>("Items");
  targetListTitle = input<string>("Selected Items");
  showTargetList = input<boolean>(false);
  disabled = input<boolean>(false);
  allowTransfer = input<boolean>(true);

  onDrop(event: CdkDragDrop<DragDropItem[]>): void {
    // Note: CDK drag-drop modifies arrays in place
    // For signal-based inputs, you would typically emit events to parent
    // For now, this works because CDK uses the array reference directly
    if (event.previousContainer === event.container) {
      // Reorder within the same list
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else if (this.allowTransfer()) {
      // Transfer between lists
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }
}
