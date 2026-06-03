import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { IdentityService } from "../core/services/identity.service";

/**
 * The signed-in user's avatar — their uploaded photo if any, else their initials.
 * Renders INSIDE the existing `.avatar` / `.avatar.lg` containers (which provide
 * the circle, size, and typography). Per-user — never a hardcoded persona photo.
 */
@Component({
  selector: "app-avatar",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (url(); as u) {
      <img [src]="u" alt="" />
    } @else {
      {{ initials() }}
    }`,
})
export class AvatarComponent {
  private readonly identity = inject(IdentityService);
  readonly url = this.identity.avatarUrl;
  readonly initials = this.identity.initials;
}
