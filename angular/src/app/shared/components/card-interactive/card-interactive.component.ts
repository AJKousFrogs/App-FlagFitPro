import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Card Interactive Component - Angular 21
 *
 * An interactive card component with selection state
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-card-interactive",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="card card-interactive"
      [class.selected]="selected()"
      (click)="onClick()"
      [attr.role]="'button'"
      [attr.aria-selected]="selected()"
      [attr.tabindex]="0"
      (keydown.enter)="onClick()"
      (keydown.space)="onClick()"
    >
      <div class="card-body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .card {
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
        border: 1px solid var(--p-surface-border);
        cursor: pointer;
        transition: all 0.2s ease;
        overflow: hidden;
      }

      .card:focus {
        outline: 2px solid var(--p-primary-color);
        outline-offset: 2px;
      }

      .card:hover {
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
        transform: translateY(-2px);
      }

      .card.selected {
        border-color: var(--color-brand-primary);
        box-shadow: var(--shadow-focus, 0 0 0 3px rgba(76, 175, 80, 0.1));
      }

      .card-body {
        padding: 1.5rem;
      }
    `,
  ],
})
export class CardInteractiveComponent {
  // Angular 21: Use input() signals instead of @Input()
  selected = input<boolean>(false);

  // Angular 21: Use output() signal instead of @Output() EventEmitter
  cardClick = output<void>();

  onClick(): void {
    this.cardClick.emit();
  }
}
