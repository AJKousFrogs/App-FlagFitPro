import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

/**
 * Hero Metric Component — the WHOOP/Strava-style headline number.
 *
 * Use this at the top of any data-driven page where one number tells the story:
 * - Player Dashboard → today's readiness
 * - ACWR Dashboard → current ACWR ratio
 * - Performance Tracking → headline metric (best 40, etc.)
 * - Profile → headline stat
 *
 * Replaces ad-hoc welcome cards and "stats overview" duplication where the same
 * number ends up rendered in three places at three different sizes.
 *
 * Empty state is built in: pass `value=null` (or omit) and the component renders
 * a friendly "Check in to unlock" prompt instead of a dashed-out "--".
 *
 * @example Full state (data available)
 * ```html
 * <app-hero-metric
 *   eyebrow="Today's readiness"
 *   [value]="78"
 *   unit="%"
 *   [badge]="{ text: 'Ready', tone: 'success' }"
 *   context="Sleep was solid, soreness low. Push hard today."
 * >
 *   <ng-container actions>
 *     <app-button variant="primary" iconLeft="pi-play" routerLink="/todays-practice">
 *       Start Training
 *     </app-button>
 *     <app-button variant="text" iconLeft="pi-comments" routerLink="/chat">
 *       Ask Merlin
 *     </app-button>
 *   </ng-container>
 * </app-hero-metric>
 * ```
 *
 * @example Empty state (no data yet)
 * ```html
 * <app-hero-metric
 *   eyebrow="Today's readiness"
 *   [value]="null"
 *   emptyTitle="Check in to unlock readiness"
 *   emptyContext="A 2-minute wellness check-in turns into a personalized score."
 * >
 *   <ng-container actions>
 *     <app-button variant="primary" iconLeft="pi-heart" (clicked)="goToWellness()">
 *       Start check-in
 *     </app-button>
 *   </ng-container>
 * </app-hero-metric>
 * ```
 */

export type HeroMetricBadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export interface HeroMetricBadge {
  text: string;
  tone: HeroMetricBadgeTone;
}

@Component({
  selector: "app-hero-metric",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <section class="hero-metric" [class.hero-metric--empty]="isEmpty()">
      <div class="hero-metric__eyebrow">{{ eyebrow() }}</div>

      @if (isEmpty()) {
        <!-- Empty state: friendly prompt, never dashed-out "--" -->
        <h2 class="hero-metric__empty-title">
          {{ emptyTitle() || "No data yet" }}
        </h2>
        @if (emptyContext()) {
          <p class="hero-metric__context">{{ emptyContext() }}</p>
        }
      } @else {
        <!-- Data state: big number + badge + context -->
        <div class="hero-metric__row">
          <span class="hero-metric__number">{{ value() }}</span>
          @if (unit()) {
            <span class="hero-metric__unit">{{ unit() }}</span>
          }
          @if (badge(); as b) {
            <span [class]="badgeClass()">{{ b.text }}</span>
          }
        </div>
        @if (context()) {
          <p class="hero-metric__context">{{ context() }}</p>
        }
      }

      <div class="hero-metric__actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </section>
  `,
  styleUrl: "./hero-metric.component.scss",
})
export class HeroMetricComponent {
  /** Small uppercase label above the number (e.g. "TODAY'S READINESS") */
  readonly eyebrow = input.required<string>();

  /** The hero number itself. Pass null/undefined to show empty state. */
  readonly value = input<number | string | null>(null);

  /** Optional unit shown next to the number (e.g. "%", "bpm", "ratio") */
  readonly unit = input<string>("");

  /** Status badge — color-coded, ALL-CAPS, follows the number */
  readonly badge = input<HeroMetricBadge | null>(null);

  /** One-line plain-English context shown beneath the number */
  readonly context = input<string>("");

  /** Title shown when value is null (empty state) */
  readonly emptyTitle = input<string>("");

  /** Context shown when value is null (empty state) */
  readonly emptyContext = input<string>("");

  readonly isEmpty = computed(() => {
    const v = this.value();
    return v === null || v === undefined || v === "";
  });

  readonly badgeClass = computed(() => {
    const b = this.badge();
    if (!b) return "";
    return `hero-metric__badge hero-metric__badge--${b.tone}`;
  });
}
