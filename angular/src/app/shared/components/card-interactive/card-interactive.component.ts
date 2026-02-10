import {
  Component,
  input,
  output,
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
        border: var(--border-1) solid var(--p-surface-border);
        cursor: pointer;
        transition: all 0.2s ease;
        overflow: hidden;
      }

      .card:focus {
        outline: var(--border-2) solid var(--p-primary-color);
        outline-offset: var(--space-1);
      }

      .card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(calc(var(--border-2) * -1));
      }

      .card.selected {
        border-color: var(--color-brand-primary);
        box-shadow: var(--shadow-focus);
      }

      .card-body {
        padding: var(--space-6);
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
