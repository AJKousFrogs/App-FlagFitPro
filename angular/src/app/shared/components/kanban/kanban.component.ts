import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

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
  selector: 'app-kanban',
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
            (cdkDropListDropped)="onDrop($event)">
            @for (card of column.cards; track card.id) {
              <div class="kanban-card" cdkDrag>
                <div class="kanban-card-header">
                  <h4 class="kanban-card-title">{{ card.title }}</h4>
                  <button
                    type="button"
                    class="kanban-card-menu"
                    (click)="onCardMenuClick(card)"
                    aria-label="Card options">
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
  styles: [`
    :host {
      display: block;
    }

    .kanban-board {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      overflow-x: auto;
      min-height: 500px;
    }

    .kanban-column {
      flex: 1;
      min-width: 280px;
      background: var(--p-surface-50);
      border-radius: var(--p-border-radius);
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }

    .kanban-column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--p-surface-border);
    }

    .kanban-column-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--p-text-color);
    }

    .kanban-column-count {
      background: var(--p-surface-200);
      color: var(--p-text-color-secondary);
      padding: 0.25rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .kanban-column-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-height: 100px;
    }

    .kanban-card {
      background: var(--p-surface-0);
      border: 1px solid var(--p-surface-border);
      border-radius: var(--p-border-radius);
      padding: 1rem;
      cursor: move;
      transition: all 0.2s ease;
    }

    .kanban-card:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .kanban-card.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .kanban-column-content.cdk-drop-list-dragging .kanban-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .kanban-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .kanban-card-title {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--p-text-color);
      flex: 1;
    }

    .kanban-card-menu {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      color: var(--p-text-color-secondary);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .kanban-card:hover .kanban-card-menu {
      opacity: 1;
    }

    .kanban-card-description {
      margin: 0 0 0.75rem 0;
      font-size: 0.75rem;
      color: var(--p-text-color-secondary);
      line-height: 1.4;
    }

    .kanban-card-footer {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .kanban-card-label {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--p-primary-color);
      color: white;
    }

    .kanban-empty {
      padding: 2rem;
      text-align: center;
      color: var(--p-text-color-secondary);
      font-size: 0.875rem;
      border: 2px dashed var(--p-surface-border);
      border-radius: var(--p-border-radius);
    }
  `]
})
export class KanbanComponent {
  columns = input.required<KanbanColumn[]>();
  
  // Outputs
  cardMoved = output<{card: KanbanCard, fromColumn: string, toColumn: string}>();
  cardMenuClick = output<KanbanCard>();
  
  onDrop(event: CdkDragDrop<KanbanCard[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      const card = event.container.data[event.currentIndex];
      this.cardMoved.emit({
        card,
        fromColumn: event.previousContainer.id,
        toColumn: event.container.id
      });
    }
  }
  
  onCardMenuClick(card: KanbanCard): void {
    this.cardMenuClick.emit(card);
  }
}

