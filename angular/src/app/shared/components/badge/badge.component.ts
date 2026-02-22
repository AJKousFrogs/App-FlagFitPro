import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Badge Component - Angular 21
 *
 * A badge component for notifications, counts, and status indicators
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-badge",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClass()" [attr.aria-label]="ariaLabel() || undefined">
      @if (dot()) {
        <span class="badge-dot"></span>
      } @else {
        <ng-content></ng-content>
      }
    </span>
  `,
  styleUrl: "./badge.component.scss",
})
export class BadgeComponent {
  // Configuration
  variant = input<
    "primary" | "success" | "warning" | "danger" | "info" | "secondary"
  >("primary");
  size = input<"sm" | "md" | "lg">("md");
  dot = input<boolean>(false);
  overlay = input<boolean>(false);
  position = input<"top-right" | "top-left" | "bottom-right" | "bottom-left">(
    "top-right",
  );
  ariaLabel = input<string>();

  // Computed class
  badgeClass = computed(() => {
    const variantClass = `badge badge-${this.variant()}`;
    const sizeClass = this.size() !== "md" ? `badge-${this.size()}` : "";
    const overlayClass = this.overlay()
      ? `badge-overlay badge-overlay-${this.position()}`
      : "";
    return `${variantClass} ${sizeClass} ${overlayClass}`.trim();
  });
}
