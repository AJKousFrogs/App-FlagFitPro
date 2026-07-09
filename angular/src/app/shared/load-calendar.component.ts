import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import {
  buildLoadCalendar,
  LoadCell,
  LoadDay,
} from "./utils/load-calendar.util";

/**
 * Daily-load calendar heatmap (presentational). A Monday-first week grid where
 * each cell is shaded by that day's internal load (session-RPE AU) RELATIVE to
 * the window max — answers "when did load concentrate / when did the ACWR spike,"
 * not just "am I safe today." Deliberately relative (no absolute AU→risk claim);
 * the raw AU is on each cell's tooltip. Data comes from `/api/daily-load`
 * (canonical `computeSessionLoad`); this only renders it.
 */
@Component({
  selector: "app-load-calendar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .cal {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .cal-head,
      .cal-week {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
      }
      .cal-head span {
        font-size: var(--fs-xs);
        color: var(--text-faint);
        text-align: center;
      }
      .cell {
        aspect-ratio: 1;
        border-radius: 4px;
        background: var(--surface-2);
      }
      .cell.l1 {
        background: color-mix(in srgb, var(--accent) 25%, var(--surface-2));
      }
      .cell.l2 {
        background: color-mix(in srgb, var(--accent) 45%, var(--surface-2));
      }
      .cell.l3 {
        background: color-mix(in srgb, var(--accent) 68%, var(--surface-2));
      }
      .cell.l4 {
        background: var(--accent);
      }
      .cell.out {
        opacity: 0.28;
      }
      .legend {
        display: flex;
        align-items: center;
        gap: 6px;
        justify-content: flex-end;
        margin-top: var(--s-2);
        font-size: var(--fs-xs);
        color: var(--text-faint);
      }
      .legend .cell {
        width: 14px;
        height: 14px;
        aspect-ratio: auto;
      }
    `,
  ],
  template: `
    @if (cal().weeks.length) {
      <div class="cal" role="img" [attr.aria-label]="summary()">
        <div class="cal-head" aria-hidden="true">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span
          ><span>S</span><span>S</span>
        </div>
        @for (week of cal().weeks; track $index) {
          <div class="cal-week">
            @for (cell of week; track cell.date) {
              <div
                class="cell l{{ cell.level }}"
                [class.out]="!cell.inRange"
                [title]="cellTitle(cell)"
              ></div>
            }
          </div>
        }
      </div>
      <div class="legend">
        <span>less</span>
        <div class="cell"></div>
        <div class="cell l1"></div>
        <div class="cell l2"></div>
        <div class="cell l3"></div>
        <div class="cell l4"></div>
        <span>more load</span>
      </div>
    }
  `,
})
export class LoadCalendarComponent {
  readonly series = input<LoadDay[]>([]);
  readonly endDate = input.required<string>();
  readonly days = input<number>(35);
  readonly maxLoad = input<number>(0);

  readonly cal = computed(() =>
    buildLoadCalendar(
      this.series(),
      this.endDate(),
      this.days(),
      this.maxLoad(),
    ),
  );

  readonly summary = computed(() => {
    const c = this.cal();
    const peak = Math.round(c.maxLoad);
    return `Daily training load, last ${this.days()} days${
      peak > 0 ? `. Peak ${peak} AU.` : " — no load logged yet."
    }`;
  });

  cellTitle(c: LoadCell): string {
    return c.load > 0 ? `${c.date}: ${c.load} AU` : `${c.date}: rest`;
  }
}
