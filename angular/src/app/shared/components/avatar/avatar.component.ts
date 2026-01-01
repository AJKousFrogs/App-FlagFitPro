import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

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
        background: linear-gradient(
          135deg,
          var(--ds-primary-green) 0%,
          var(--ds-primary-green-dark, #067a3b) 100%
        );
        color: #ffffff;
        font-weight: 700;
        position: relative;
        overflow: hidden;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        border: 2px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 2px 8px rgba(8, 153, 73, 0.25);
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .avatar:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.35);
      }

      .avatar-sm {
        width: 2rem;
        height: 2rem;
        font-size: 0.7rem;
        letter-spacing: 0.5px;
      }

      .avatar-md {
        width: 2.75rem;
        height: 2.75rem;
        font-size: 0.875rem;
        letter-spacing: 0.75px;
      }

      .avatar-lg {
        width: 3.5rem;
        height: 3.5rem;
        font-size: 1.125rem;
        letter-spacing: 1px;
      }

      .avatar-xl {
        width: 5rem;
        height: 5rem;
        font-size: 1.5rem;
        letter-spacing: 1.5px;
      }

      .avatar-square {
        border-radius: var(--p-border-radius);
      }

      .avatar-initials {
        text-transform: uppercase;
        user-select: none;
        font-weight: 700;
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
