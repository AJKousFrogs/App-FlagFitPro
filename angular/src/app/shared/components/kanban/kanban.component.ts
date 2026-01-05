import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

/**
 * Kanban Board Component - Angular 21
 *
 * A kanban board component with drag and drop functionality
 * Uses Angular 21 signals and CDK drag-drop
 */
@Component({
  selector: "app-kanban",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DragDropModule],
  template: `
    <div class="kanban-board">
      @for (column of columns(); track column.id) {
        <div class="kanban-column">
          <div class="kanban-column-header">
            <h3 class="kanban-column-title">{{ column.title }}</h3>
            <span class="kanban-column-count">{{ column.cards.length }}</span>
          </div>
          <div
            class="kanban-column-content"
            cdkDropList
            [id]="column.id"
            [cdkDropListData]="column.cards"
            (cdkDropListDropped)="onDrop($event)"
          >
            @for (card of column.cards; track card.id) {
              <div class="kanban-card" cdkDrag>
                <div class="kanban-card-header">
                  <h4 class="kanban-card-title">{{ card.title }}</h4>
                  <button
                    type="button"
                    class="kanban-card-menu"
                    (click)="onCardMenuClick(card)"
                    aria-label="Card options"
                  >
                    <i class="pi pi-ellipsis-v"></i>
                  </button>
                </div>
                @if (card.description) {
                  <p class="kanban-card-description">{{ card.description }}</p>
                }
                @if (card.labels && card.labels.length > 0) {
                  <div class="kanban-card-footer">
                    @for (label of card.labels; track label) {
                      <span class="kanban-card-label">{{ label }}</span>
                    }
                  </div>
                }
              </div>
            }
            @if (column.cards.length === 0) {
              <div class="kanban-empty">Drop cards here</div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: "./kanban.component.scss",
})
export class KanbanComponent {
  columns = input.required<KanbanColumn[]>();

  // Outputs
  cardMoved = output<{
    card: KanbanCard;
    fromColumn: string;
    toColumn: string;
  }>();
  cardMenuClick = output<KanbanCard>();

  onDrop(event: CdkDragDrop<KanbanCard[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const card = event.container.data[event.currentIndex];
      this.cardMoved.emit({
        card,
        fromColumn: event.previousContainer.id,
        toColumn: event.container.id,
      });
    }
  }

  onCardMenuClick(card: KanbanCard): void {
    this.cardMenuClick.emit(card);
  }
}
