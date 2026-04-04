import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from "@angular/core";
import { Avatar } from "primeng/avatar";

@Component({
  selector: "app-avatar",
  standalone: true,
  imports: [Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <p-avatar
      [label]="label()"
      [image]="image()"
      [shape]="shape()"
      [size]="size()"
      [styleClass]="avatarClass()"
      [attr.aria-label]="ariaLabel()"
      class="app-avatar-host"
    >
      <ng-content></ng-content>
    </p-avatar>
  `,
  styles: [`
    .app-avatar-host {
      display: inline-block;
    }

    .app-avatar-host .p-avatar {
      &.avatar-merlin {
        background: linear-gradient(135deg, var(--ds-primary-green), var(--primitive-success-600));
        color: white;
      }

      &.avatar-performance-injured {
        border: 2px solid var(--color-status-error);
      }

      &.avatar-performance-high-risk {
        border: 2px solid var(--color-status-warning);
      }
    }
  `]
})
export class AvatarComponent {
  label = input<string>();
  image = input<string>();
  shape = input<"circle" | "square">("circle");
  size = input<"normal" | "large" | "xlarge">("normal");
  styleClass = input<string>("");
  ariaLabel = input<string>("");
  variant = input<"standard" | "merlin" | "injured" | "high-risk">("standard");

  avatarClass() {
    const classes = [this.styleClass()];

    if (this.variant() === "merlin") classes.push("avatar-merlin");
    if (this.variant() === "injured") classes.push("avatar-performance-injured");
    if (this.variant() === "high-risk") classes.push("avatar-performance-high-risk");

    return classes.filter(Boolean).join(" ");
  }
}
