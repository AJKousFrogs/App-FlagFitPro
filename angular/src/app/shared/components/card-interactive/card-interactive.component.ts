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
  styleUrl: './card-interactive.component.scss',
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
