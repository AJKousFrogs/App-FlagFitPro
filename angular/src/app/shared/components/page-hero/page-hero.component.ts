import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * Page Hero — Phase 1 mobile-first primitive.
 *
 * Gradient-surface hero matching the MLS / Equinox / Active Club reference
 * pattern: tinted gradient that fades to ground, eyebrow + display title +
 * optional subtitle, and named slots for KPIs (under the title) and actions
 * (top-right on tablet+, below KPIs on mobile).
 *
 * Use this for landing surfaces (Today, Player Dashboard, Coach Dashboard,
 * Insights, Recover). For interior pages, keep using <app-page-header>.
 *
 * Variant selects the gradient tint via tokens added in Phase 1:
 *   - "athlete" → --gradient-hero-athlete (accent green fade)
 *   - "coach"   → --gradient-hero-coach   (info blue fade)
 *   - "neutral" → --gradient-hero-neutral (surface fade, no brand color)
 *
 * Slot usage:
 *   <app-page-hero eyebrow="MAY 14" title="Hi, Alex" subtitle="Ready to train?">
 *     <app-kpi-strip slot="kpis" [items]="kpis()" />
 *     <app-button slot="actions" iconLeft="pi-play">Start practice</app-button>
 *   </app-page-hero>
 */
export type PageHeroVariant = "athlete" | "coach" | "neutral";

@Component({
  selector: "app-page-hero",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <section
      class="page-hero"
      [class.page-hero--athlete]="variant() === 'athlete'"
      [class.page-hero--coach]="variant() === 'coach'"
      [class.page-hero--neutral]="variant() === 'neutral'"
      [attr.aria-label]="ariaLabel() || title()"
    >
      <div class="page-hero__content">
        @if (eyebrow()) {
          <p class="page-hero__eyebrow">{{ eyebrow() }}</p>
        }
        <h1 class="page-hero__title">
          @if (icon()) {
            <i class="pi" [class]="icon()" aria-hidden="true"></i>
          }
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="page-hero__subtitle">{{ subtitle() }}</p>
        }
        <div class="page-hero__kpis">
          <ng-content select="[slot=kpis]"></ng-content>
        </div>
      </div>
      <div class="page-hero__actions">
        <ng-content select="[slot=actions]"></ng-content>
      </div>
    </section>
  `,
  styleUrl: "./page-hero.component.scss",
})
export class PageHeroComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>("");
  readonly subtitle = input<string>("");
  readonly icon = input<string>("");
  readonly variant = input<PageHeroVariant>("athlete");
  readonly ariaLabel = input<string>("");
}
