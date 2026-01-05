import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TooltipModule } from "primeng/tooltip";

/**
 * Tooltip Component - Angular 21
 *
 * A wrapper around PrimeNG Tooltip for consistent tooltip behavior
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-tooltip",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipModule],
  template: `
    <span
      [pTooltip]="text()"
      [tooltipPosition]="position()"
      [tooltipEvent]="event()"
      [tooltipStyleClass]="styleClass()"
      [tooltipDisabled]="disabled()"
      [showDelay]="showDelay()"
      [hideDelay]="hideDelay()"
      [escape]="escape()"
      [appendTo]="appendTo()"
    >
      <ng-content></ng-content>
    </span>
  `,
  styleUrl: "./tooltip.component.scss",
})
export class TooltipComponent {
  // Configuration
  text = input<string>("");
  position = input<"top" | "bottom" | "left" | "right">("top");
  event = input<"hover" | "focus" | "click">("hover");
  styleClass = input<string>();
  disabled = input<boolean>(false);
  showDelay = input<number>(0);
  hideDelay = input<number>(0);
  escape = input<boolean>(true);
  appendTo = input<string | HTMLElement>("body");
}
