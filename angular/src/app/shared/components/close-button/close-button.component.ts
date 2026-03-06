import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { Tooltip } from "primeng/tooltip";

export type CloseButtonSize = "sm" | "md" | "lg";
export type CloseButtonTone = "default" | "inverse" | "danger";

@Component({
  selector: "app-close-button",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tooltip],
  template: `
    <button
      type="button"
      [class]="buttonClasses()"
      [attr.aria-label]="ariaLabel()"
      [attr.data-testid]="testId() || undefined"
      [pTooltip]="tooltip()"
      [tooltipPosition]="tooltipPosition()"
      (click)="clicked.emit($event)"
    >
      <i class="pi pi-times" aria-hidden="true"></i>
    </button>
  `,
})
export class CloseButtonComponent {
  ariaLabel = input("Close");
  size = input<CloseButtonSize>("md");
  tone = input<CloseButtonTone>("default");
  tooltip = input("");
  tooltipPosition = input<"top" | "bottom" | "left" | "right">("top");
  styleClass = input("");
  testId = input("");

  clicked = output<MouseEvent>();

  readonly buttonClasses = computed(() =>
    [
      "app-close-button",
      `app-close-button--${this.size()}`,
      `app-close-button--${this.tone()}`,
      this.styleClass(),
    ]
      .filter(Boolean)
      .join(" "),
  );
}
