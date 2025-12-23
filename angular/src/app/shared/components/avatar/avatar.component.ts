import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

/**
 * Avatar Component - Angular 21
 *
 * An avatar component for displaying user images or initials
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-avatar",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      [class]="avatarClass()"
      [style.background-image]="image() ? 'url(' + image() + ')' : null"
      [attr.aria-label]="ariaLabel() || name() || 'Avatar'"
    >
      @if (!image() && name()) {
        <span class="avatar-initials">{{ initials() }}</span>
      }
      @if (!image() && !name() && icon()) {
        <i [class]="icon()"></i>
      }
      @if (badge()) {
        <span class="avatar-badge" [class]="'badge-' + badgeVariant()"></span>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: var(--p-surface-200);
        color: var(--p-text-color);
        font-weight: 600;
        position: relative;
        overflow: hidden;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      }

      .avatar-sm {
        width: 2rem;
        height: 2rem;
        font-size: 0.75rem;
      }

      .avatar-md {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 0.875rem;
      }

      .avatar-lg {
        width: 3.5rem;
        height: 3.5rem;
        font-size: 1.125rem;
      }

      .avatar-xl {
        width: 4.5rem;
        height: 4.5rem;
        font-size: 1.5rem;
      }

      .avatar-square {
        border-radius: var(--p-border-radius);
      }

      .avatar-initials {
        text-transform: uppercase;
        user-select: none;
      }

      .avatar-badge {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 50%;
        border: 2px solid var(--p-surface-0);
      }

      .badge-online {
        background-color: var(--p-success-color, #4caf50);
      }

      .badge-away {
        background-color: var(--p-warning-color, #ff9800);
      }

      .badge-offline {
        background-color: var(--p-surface-400);
      }

      .badge-busy {
        background-color: var(--p-error-color);
      }

      i {
        font-size: inherit;
      }
    `,
  ],
})
export class AvatarComponent {
  // Configuration
  image = input<string>();
  name = input<string>();
  icon = input<string>("pi pi-user");
  size = input<"sm" | "md" | "lg" | "xl">("md");
  shape = input<"circle" | "square">("circle");
  badge = input<boolean>(false);
  badgeVariant = input<"online" | "away" | "offline" | "busy">("online");
  ariaLabel = input<string>();

  // Computed values
  initials = computed(() => {
    if (!this.name()) return "";
    const names = this.name()!.split(" ");
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return names[0][0];
  });

  avatarClass = computed(() => {
    const sizeClass = `avatar avatar-${this.size()}`;
    const shapeClass = this.shape() === "square" ? "avatar-square" : "";
    return `${sizeClass} ${shapeClass}`.trim();
  });
}
