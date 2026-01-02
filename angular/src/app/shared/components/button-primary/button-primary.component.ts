import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Button Primary Component - Angular 21
 *
 * A simplified primary button component
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-button-primary",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <button
      class="btn btn-primary"
      [disabled]="disabled()"
      (click)="onClick()"
      [attr.aria-label]="ariaLabel() || undefined"
    >
      @if (loading()) {
        <span class="spinner spinner-sm"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styleUrl: './button-primary.component.scss',
})
export class ButtonPrimaryComponent {
  // Angular 21: Use input() signals instead of @Input()
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  ariaLabel = input<string>("");

  // Angular 21: Use output() signal instead of @Output() EventEmitter
  clicked = output<void>();

  onClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
