import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/**
 * KPI Strip — Phase 1 mobile-first primitive.
 *
 * Big-number stat row matching the Active Club ("32 KM / 612 MINUTES /
 * 486 M EL GAIN / 16 MEDALS") and Equinox ("3 Active Days") reference.
 * Each cell stacks a display number above a small uppercase label;
 * optional delta indicator below (e.g. "+12% vs last week").
 *
 * Mobile-first: items wrap to 2 per row at narrow phones, 4 per row at
 * tablet+. Sizes from --kpi-* tokens.
 *
 * Usage:
 *   <app-kpi-strip
 *     [items]="[
 *       { value: '32', label: 'KM' },
 *       { value: '612', label: 'MINUTES' },
 *       { value: '486', label: 'M EL GAIN' },
 *       { value: '16', label: 'MEDALS' }
 *     ]"
 *   />
 */
export interface KpiItem {
  /** Big display number (formatted as a string so callers control thousands separators, units, etc.). */
  value: string;
  /** Short uppercase label rendered below the number. */
  label: string;
  /** Optional delta indicator, e.g. "+12% vs last week" or "-3 days". */
  delta?: string;
  /** Optional delta direction; affects color. Defaults to "neutral". */
  deltaTrend?: "up" | "down" | "neutral";
}

@Component({
  selector: "app-kpi-strip",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <dl class="kpi-strip" [attr.aria-label]="ariaLabel() || 'Key metrics'">
      @for (item of items(); track item.label) {
        <div class="kpi-strip__cell">
          <dt class="kpi-strip__label">{{ item.label }}</dt>
          <dd class="kpi-strip__value">{{ item.value }}</dd>
          @if (item.delta) {
            <p
              class="kpi-strip__delta"
              [class.kpi-strip__delta--up]="(item.deltaTrend ?? 'neutral') === 'up'"
              [class.kpi-strip__delta--down]="(item.deltaTrend ?? 'neutral') === 'down'"
            >
              {{ item.delta }}
            </p>
          }
        </div>
      }
    </dl>
  `,
  styleUrl: "./kpi-strip.component.scss",
})
export class KpiStripComponent {
  readonly items = input.required<readonly KpiItem[]>();
  readonly ariaLabel = input<string>("");
}
