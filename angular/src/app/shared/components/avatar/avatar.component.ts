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
  styleUrl: "./avatar.component.scss",
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
