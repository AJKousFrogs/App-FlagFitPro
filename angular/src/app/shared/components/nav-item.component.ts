import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { Badge } from "primeng/badge";
import { Ripple } from "primeng/ripple";

export type NavItemVariant = "sidebar" | "bottom" | "menu";

@Component({
  selector: "app-nav-item",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, Badge, Ripple],
  template: `
    @if (route()) {
      <a
        [routerLink]="route()"
        routerLinkActive="active"
        #rla="routerLinkActive"
        [routerLinkActiveOptions]="{ exact: exact() }"
        class="nav-item"
        [class.nav-item--sidebar]="variant() === 'sidebar'"
        [class.nav-item--bottom]="variant() === 'bottom'"
        [class.nav-item--menu]="variant() === 'menu'"
        [ngClass]="itemClass()"
        [attr.aria-label]="ariaLabel() || label()"
        [attr.aria-current]="rla.isActive ? 'page' : null"
        [attr.id]="itemId() || null"
        [attr.data-testid]="testId() || null"
        [attr.title]="label()"
        (click)="onClick($event)"
        pRipple
      >
        <span class="nav-item-icon">
          <i [class]="'pi ' + icon()" aria-hidden="true"></i>
          @if (badge() !== null && badge() !== undefined) {
            <p-badge
              [value]="badge()!.toString()"
              [severity]="normalizedBadgeSeverity()"
              class="nav-badge"
            ></p-badge>
          }
        </span>
        <span class="nav-item-label">{{ label() }}</span>
      </a>
    } @else {
      <button
        type="button"
        class="nav-item"
        [class.nav-item--sidebar]="variant() === 'sidebar'"
        [class.nav-item--bottom]="variant() === 'bottom'"
        [class.nav-item--menu]="variant() === 'menu'"
        [ngClass]="itemClass()"
        [attr.aria-label]="ariaLabel() || label()"
        [attr.aria-disabled]="disabled() || null"
        [attr.id]="itemId() || null"
        [attr.data-testid]="testId() || null"
        [attr.title]="label()"
        [disabled]="disabled()"
        (click)="onClick($event)"
        pRipple
      >
        <span class="nav-item-icon">
          <i [class]="'pi ' + icon()" aria-hidden="true"></i>
          @if (badge() !== null && badge() !== undefined) {
            <p-badge
              [value]="badge()!.toString()"
              [severity]="normalizedBadgeSeverity()"
              class="nav-badge"
            ></p-badge>
          }
        </span>
        <span class="nav-item-label">{{ label() }}</span>
      </button>
    }
  `,
  styleUrl: "./nav-item.component.scss",
})
export class NavItemComponent {
  label = input.required<string>();
  icon = input.required<string>();
  route = input<string | string[] | null>(null);
  ariaLabel = input<string>("");
  badge = input<number | string | null>(null);
  badgeSeverity = input<
    | "success"
    | "info"
    | "warning"
    | "warning"
    | "danger"
    | "secondary"
    | "contrast"
  >("danger");
  exact = input(false);
  variant = input<NavItemVariant>("sidebar");
  itemClass = input<string | string[] | Record<string, boolean> | null>(null);
  itemId = input<string | null>(null);
  testId = input<string | null>(null);
  disabled = input(false);

  clicked = output<void>();

  onClick(event: Event): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clicked.emit();
  }

  normalizedBadgeSeverity():
    | "success"
    | "info"
    | "warn"
    | "danger"
    | "secondary"
    | "contrast" {
    const severity = this.badgeSeverity();
    // Map "warning" to "warn" for PrimeNG Badge compatibility
    return severity === "warning" ? "warn" : severity;
  }
}
