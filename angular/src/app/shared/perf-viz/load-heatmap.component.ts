import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { rampIndex } from "./perf-viz.geometry";

export interface HeatCell {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Load in AU (0 or missing = rest / no session). */
  value: number;
}

/**
 * ff-load-heatmap — a Monday-first calendar heatmap of daily training load.
 * Single-hue sequential ramp, RELATIVE to the athlete's own max (the app makes
 * no absolute AU→risk claim). Rest days render as a dashed empty cell, not a
 * coloured zero. Raw AU is exposed per cell via title (native tooltip) + aria.
 */
@Component({
  selector: "app-ff-load-heatmap",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hm" role="img" [attr.aria-label]="aria()">
      <div class="wk"></div>
      @for (d of dows; track d) {
        <div class="dow">{{ d }}</div>
      }
      @for (row of grid(); track row.week) {
        <div class="wk">{{ row.label }}</div>
        @for (cell of row.cells; track cell.date) {
          @if (cell.value > 0) {
            <div
              class="cell"
              [class.today]="cell.today"
              [style.background]="ramp[cell.ramp]"
              [attr.title]="cell.value + ' AU · ' + cell.date"
              [attr.aria-label]="cell.value + ' AU on ' + cell.date"
            ></div>
          } @else {
            <div
              class="cell empty"
              [class.today]="cell.today"
              [attr.title]="'Rest · ' + cell.date"
            ></div>
          }
        }
      }
    </div>
    <div class="leg">
      <span>lighter</span>
      <span class="ramp">
        @for (c of ramp.slice(1); track c) {
          <i [style.background]="c"></i>
        }
      </span>
      <span>heavier</span>
      <span class="rest">▢ rest</span>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .hm {
        display: grid;
        grid-template-columns: auto repeat(7, 1fr);
        gap: 5px;
        align-items: center;
      }
      .dow {
        font-family: var(--font-mono);
        font-size: 9.5px;
        color: var(--text-faint);
        text-align: center;
        padding-bottom: 2px;
      }
      .wk {
        font-family: var(--font-mono);
        font-size: 9.5px;
        color: var(--text-faint);
        padding-right: 8px;
        text-align: right;
        white-space: nowrap;
      }
      .cell {
        aspect-ratio: 1;
        border-radius: 6px;
        background: var(--surface-2);
        position: relative;
        border: 1px solid transparent;
        transition:
          transform 0.12s var(--ease-out, ease),
          box-shadow 0.12s;
      }
      .cell:hover {
        transform: scale(1.14);
        box-shadow:
          0 0 0 2px var(--surface),
          0 0 0 3px var(--accent);
        z-index: 2;
      }
      .cell.today {
        box-shadow:
          0 0 0 2px var(--surface),
          0 0 0 3px var(--accent);
      }
      .cell.empty {
        background: transparent;
        border: 1px dashed var(--border-soft);
      }
      .leg {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--text-faint);
      }
      .ramp {
        display: flex;
        gap: 3px;
      }
      .ramp i {
        width: 15px;
        height: 9px;
        border-radius: 2px;
        display: block;
      }
      .rest {
        margin-left: auto;
      }
    `,
  ],
})
export class LoadHeatmapComponent {
  /** Chronological daily cells (oldest → newest). */
  readonly cells = input<readonly HeatCell[]>([]);
  /** Number of trailing weeks to show (default 4). */
  readonly weeks = input(4);

  readonly dows = ["M", "T", "W", "T", "F", "S", "S"];
  readonly ramp = [
    "var(--surface-2)",
    "#123524",
    "#12633f",
    "#0f9557",
    "#00c76e",
    "#00e07a",
  ];

  private readonly max = computed(() =>
    Math.max(0, ...this.cells().map((c) => c.value)),
  );

  readonly grid = computed(() => {
    const cells = this.cells();
    const n = this.weeks() * 7;
    const tail = cells.slice(-n);
    const todayISO = tail.length ? tail[tail.length - 1].date : "";
    const max = this.max();
    const rows: {
      week: number;
      label: string;
      cells: {
        date: string;
        value: number;
        ramp: number;
        today: boolean;
      }[];
    }[] = [];
    for (let w = 0; w < this.weeks(); w++) {
      const slice = tail.slice(w * 7, w * 7 + 7);
      if (slice.length === 0) continue;
      const ago = this.weeks() - 1 - w;
      rows.push({
        week: w,
        label: ago === 0 ? "this wk" : `${ago}w ago`,
        cells: slice.map((c) => ({
          date: c.date,
          value: c.value,
          ramp: rampIndex(c.value, max, this.ramp.length - 1),
          today: c.date === todayISO,
        })),
      });
    }
    return rows;
  });

  readonly aria = computed(() => {
    const c = this.cells();
    const active = c.filter((x) => x.value > 0).length;
    return `Load heatmap, ${this.weeks()} weeks, ${active} training days.`;
  });
}
