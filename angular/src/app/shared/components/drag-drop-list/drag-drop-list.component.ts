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
  [key: string]: unknown;
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
    <div
      class="drag-drop-container"
      role="application"
      aria-label="Drag and drop interface"
    >
      <div class="list-section" role="region" [attr.aria-label]="listTitle()">
        <h3 class="list-title" [id]="'list-title-' + listId">
          {{ listTitle() }}
        </h3>
        <div
          cdkDropList
          [cdkDropListData]="items()"
          [cdkDropListDisabled]="disabled()"
          class="drop-list"
          (cdkDropListDropped)="onDrop($event)"
          role="listbox"
          [attr.aria-labelledby]="'list-title-' + listId"
          [attr.aria-describedby]="'list-instructions-' + listId"
        >
          <span [id]="'list-instructions-' + listId" class="sr-only">
            Use arrow keys to navigate items. Press Space or Enter to pick up an
            item, arrow keys to move it, and Space or Enter to drop it.
          </span>
          @for (item of items(); track item.id; let i = $index) {
            <div
              cdkDrag
              [cdkDragDisabled]="disabled()"
              class="drag-item"
              [class.dragging]="false"
              role="option"
              [attr.aria-selected]="false"
              [attr.aria-label]="
                item.title +
                (item.description ? ', ' + item.description : '') +
                '. Item ' +
                (i + 1) +
                ' of ' +
                items().length
              "
              tabindex="0"
              (keydown)="onKeyDown($event, i, 'source')"
            >
              <div class="drag-handle" cdkDragHandle aria-hidden="true">
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
        <div
          class="list-section"
          role="region"
          [attr.aria-label]="targetListTitle()"
        >
          <h3 class="list-title" [id]="'target-list-title-' + listId">
            {{ targetListTitle() }}
          </h3>
          <div
            cdkDropList
            [cdkDropListData]="targetItems()"
            [cdkDropListDisabled]="disabled()"
            class="drop-list target-list"
            (cdkDropListDropped)="onDrop($event)"
            role="listbox"
            [attr.aria-labelledby]="'target-list-title-' + listId"
          >
            @for (item of targetItems(); track item.id; let i = $index) {
              <div
                cdkDrag
                [cdkDragDisabled]="disabled()"
                class="drag-item"
                role="option"
                [attr.aria-selected]="false"
                [attr.aria-label]="
                  item.title +
                  (item.description ? ', ' + item.description : '') +
                  '. Item ' +
                  (i + 1) +
                  ' of ' +
                  targetItems().length
                "
                tabindex="0"
                (keydown)="onKeyDown($event, i, 'target')"
              >
                <div class="drag-handle" cdkDragHandle aria-hidden="true">
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
              <div class="empty-state" role="status" aria-live="polite">
                Drop items here
              </div>
            }
          </div>
        </div>
      }

      <!-- Live region for screen reader announcements -->
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {{ announcement() }}
      </div>
    </div>
  `,
  styleUrl: "./drag-drop-list.component.scss",
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

  // Unique ID for accessibility
  listId = Math.random().toString(36).substr(2, 9);

  // Announcement for screen readers
  announcement = signal<string>("");

  /**
   * Handle keyboard navigation for accessibility
   */
  onKeyDown(
    event: KeyboardEvent,
    index: number,
    list: "source" | "target",
  ): void {
    const items = list === "source" ? this.items() : this.targetItems();

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        if (index > 0) {
          this.focusItem(list, index - 1);
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        if (index < items.length - 1) {
          this.focusItem(list, index + 1);
        }
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        this.announcement.set(
          `${items[index].title} selected. Use arrow keys to move, then press Space or Enter to place.`,
        );
        break;
    }
  }

  private focusItem(list: "source" | "target", index: number): void {
    const selector =
      list === "source"
        ? ".drop-list:not(.target-list)"
        : ".drop-list.target-list";
    const listEl = document.querySelector(selector);
    if (listEl) {
      const items = listEl.querySelectorAll(".drag-item");
      if (items[index]) {
        (items[index] as HTMLElement).focus();
      }
    }
  }

  onDrop(event: CdkDragDrop<DragDropItem[]>): void {
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
