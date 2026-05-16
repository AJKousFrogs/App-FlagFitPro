import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import { RouterModule } from "@angular/router";

/**
 * Action Card Component — clickable tile for "what to do next" grids.
 *
 * Pattern from the player dashboard mockup: 2-4 cards in a row, one is the
 * primary action (gradient accent), others are ghost. Each card opens a route.
 *
 * Why a separate component (vs `<app-card-shell state="interactive">`):
 *  - Optimized for 1-glance scanning: icon + title + sub, that's it.
 *  - Renders as an `<a>` when `routerLink` set (proper semantics, middle-click,
 *    cmd-click all work) or `<button>` when only `(action)` is wired.
 *  - Built-in primary/ghost variants — no per-page CSS to express the
 *    "this one card is the hero action" pattern.
 *
 * @example Primary + secondaries
 * ```html
 * <div class="action-grid">
 *   <app-action-card
 *     variant="primary"
 *     icon="pi-play"
 *     title="Today's Practice"
 *     subtitle="45 min · Speed + route running"
 *     routerLink="/todays-practice"
 *   />
 *   <app-action-card
 *     icon="pi-heart"
 *     title="Wellness Check-in"
 *     subtitle="Done today · Updated 7:22 AM"
 *     routerLink="/wellness"
 *   />
 *   <app-action-card
 *     icon="pi-flag"
 *     title="Playbook Quiz"
 *     subtitle="3 plays to review"
 *     routerLink="/playbook"
 *   />
 * </div>
 * ```
 */

export type ActionCardVariant = "primary" | "ghost";

@Component({
  selector: "app-action-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    @if (routerLink()) {
      <a
        [routerLink]="routerLink()"
        [class]="rootClass()"
        [class.action-card--disabled]="disabled()"
        [attr.aria-disabled]="disabled() || null"
        [attr.tabindex]="disabled() ? -1 : 0"
        [attr.aria-label]="ariaLabel() || title()"
      >
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </a>
    } @else {
      <button
        type="button"
        [class]="rootClass()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel() || title()"
        (click)="onClick($event)"
      >
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </button>
    }

    <ng-template #content>
      @if (icon()) {
        <span class="action-card__icon" aria-hidden="true">
          <i [class]="'pi ' + icon()"></i>
        </span>
      }
      <span class="action-card__title">{{ title() }}</span>
      @if (subtitle()) {
        <span class="action-card__subtitle">{{ subtitle() }}</span>
      }
    </ng-template>
  `,
  styleUrl: "./action-card.component.scss",
})
export class ActionCardComponent {
  /** Required: card title */
  readonly title = input.required<string>();

  /** Optional supporting line (e.g. "45 min · Speed session") */
  readonly subtitle = input<string>("");

  /** Optional PrimeIcons class (e.g. "pi-play", "pi-heart") */
  readonly icon = input<string>("");

  /** "primary" = filled accent. "ghost" = outlined. */
  readonly variant = input<ActionCardVariant>("ghost");

  /** When set, card renders as an <a> with the given route */
  readonly routerLink = input<string | string[] | null>(null);

  /** Disable the card (no click, dimmed, no hover) */
  readonly disabled = input<boolean>(false);

  /** Optional aria-label override (defaults to title) */
  readonly ariaLabel = input<string>("");

  /** Click event when no routerLink is set */
  readonly action = output<MouseEvent>();

  readonly rootClass = computed(
    () => `action-card action-card--${this.variant()}`,
  );

  onClick(event: MouseEvent): void {
    if (!this.disabled()) {
      this.action.emit(event);
    }
  }
}
