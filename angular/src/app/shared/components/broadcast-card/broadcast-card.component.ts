import {
  ChangeDetectionStrategy,
  Component,
  input,
} from "@angular/core";

/**
 * Broadcast Card Component — the dramatic "next game / next opponent" hero.
 *
 * Used by coach-facing surfaces where the lead question is "what's coming up?":
 *  - Coach Dashboard → next game
 *  - Practice Planner → next session
 *  - Scouting Reports → next opponent
 *  - Tournament Management → next event
 *
 * Visual language matches the hero metric pattern (dark-leaning gradient,
 * accent eyebrow, tabular KPIs) but optimized for context (opponent name +
 * date + meta) rather than a single headline number.
 *
 * @example
 * ```html
 * <app-broadcast-card
 *   eyebrow="Next game"
 *   title="Phoenix Flames · Away"
 *   subtitle="Sunday, May 18 · 3:00 PM · Stadium Park, Belgrade"
 *   [kpis]="[
 *     { label: 'RSVP', value: '18/22', tone: 'ok' },
 *     { label: 'Lineup set', value: 'Draft', tone: 'warn' },
 *     { label: 'Last meeting', value: 'W 28–14' },
 *     { label: 'Opp record', value: '4–1' }
 *   ]"
 * >
 *   <ng-container aside>
 *     <div class="countdown">
 *       <div class="countdown__num">2d</div>
 *       <div class="countdown__label">to kickoff</div>
 *     </div>
 *   </ng-container>
 * </app-broadcast-card>
 * ```
 */

export type BroadcastKpiTone = "ok" | "warn" | "danger" | "info" | "neutral";

export interface BroadcastKpi {
  /** Required: short label (uppercase) */
  label: string;
  /** Required: value string (kept short — 6 chars or fewer reads best) */
  value: string;
  /** Optional tone — default neutral */
  tone?: BroadcastKpiTone;
}

@Component({
  selector: "app-broadcast-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <section class="broadcast-card">
      <div class="broadcast-card__main">
        <div class="broadcast-card__eyebrow">
          <span class="broadcast-card__eyebrow-dot" aria-hidden="true"></span>
          {{ eyebrow() }}
        </div>

        <h2 class="broadcast-card__title">{{ title() }}</h2>

        @if (subtitle()) {
          <p class="broadcast-card__subtitle">{{ subtitle() }}</p>
        }

        @if (kpis().length > 0) {
          <div class="broadcast-card__kpis" role="list">
            @for (kpi of kpis(); track kpi.label) {
              <div class="broadcast-card__kpi" role="listitem">
                <div class="broadcast-card__kpi-label">{{ kpi.label }}</div>
                <div [class]="kpiValueClass(kpi)">{{ kpi.value }}</div>
              </div>
            }
          </div>
        }
      </div>

      <aside class="broadcast-card__aside">
        <ng-content select="[aside]"></ng-content>
      </aside>
    </section>
  `,
  styleUrl: "./broadcast-card.component.scss",
})
export class BroadcastCardComponent {
  /** Required: small uppercase label above the title */
  readonly eyebrow = input.required<string>();

  /** Required: the headline (e.g. "Phoenix Flames · Away") */
  readonly title = input.required<string>();

  /** Optional one-line context (date / time / venue) */
  readonly subtitle = input<string>("");

  /** Optional KPI strip below the subtitle. 0-6 entries recommended. */
  readonly kpis = input<BroadcastKpi[]>([]);

  kpiValueClass(kpi: BroadcastKpi): string {
    const tone = kpi.tone ?? "neutral";
    return `broadcast-card__kpi-value broadcast-card__kpi-value--${tone}`;
  }
}
