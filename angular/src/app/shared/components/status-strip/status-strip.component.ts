import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";

/**
 * Status Strip Component — color-coded KPI row for squad / team health.
 *
 * Use at the top of dashboards or analytics pages to give a coach (or athlete)
 * a 5-second triage view: green/amber/red dots tell them where to focus.
 *
 * Each tile fades the surface to its tone — red tone for active injuries,
 * amber for workload spikes, green for healthy team. Optional click handler
 * makes a tile a navigation shortcut to the detail surface.
 *
 * @example
 * ```html
 * <app-status-strip
 *   [tiles]="[
 *     { label: 'Team Readiness', value: '82', unit: '%', caption: 'Avg across squad', tone: 'ok' },
 *     { label: 'Workload spikes', value: 2, caption: 'ACWR > 1.5', tone: 'warn' },
 *     { label: 'Active injuries', value: 1, caption: 'Marko T. · stage 4 RTP', tone: 'danger' },
 *     { label: 'Practice attend.', value: '94', unit: '%', caption: 'Last 7 sessions', tone: 'neutral' }
 *   ]"
 *   (tileClick)="navigateToDetail($event)"
 * />
 * ```
 */

export type StatusTileTone = "ok" | "warn" | "danger" | "info" | "neutral";

export interface StatusStripTile {
  /** Required: short tile label, displayed uppercase */
  label: string;
  /** Required: the headline value (number or pre-formatted string like "Day 12") */
  value: string | number;
  /** Optional: small unit suffix shown next to the value (e.g. "%", "bpm") */
  unit?: string;
  /** Optional: one-line caption beneath the value */
  caption?: string;
  /** Required: tone drives surface tint + value color */
  tone: StatusTileTone;
  /** Optional: opaque id passed back via (tileClick) for routing */
  id?: string;
}

@Component({
  selector: "app-status-strip",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div
      class="status-strip"
      [style.--status-strip-cols]="tiles().length"
      role="list"
    >
      @for (tile of tiles(); track tile.label) {
        <div
          [class]="'status-strip__tile status-strip__tile--' + tile.tone"
          [class.status-strip__tile--clickable]="tile.id"
          role="listitem"
          [attr.tabindex]="tile.id ? 0 : null"
          (click)="onTileClick(tile)"
          (keydown.enter)="onTileClick(tile)"
          (keydown.space)="onTileClick(tile)"
        >
          <div class="status-strip__label">{{ tile.label }}</div>
          <div class="status-strip__value-row">
            <span [class]="valueClass(tile.tone)">{{ tile.value }}</span>
            @if (tile.unit) {
              <span class="status-strip__unit">{{ tile.unit }}</span>
            }
          </div>
          @if (tile.caption) {
            <div class="status-strip__caption">{{ tile.caption }}</div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: "./status-strip.component.scss",
})
export class StatusStripComponent {
  /** Array of tile configs. 2-6 tiles recommended; the grid scales. */
  readonly tiles = input.required<StatusStripTile[]>();

  /** Emits when a tile with an `id` is clicked */
  readonly tileClick = output<string>();

  onTileClick(tile: StatusStripTile): void {
    if (tile.id) {
      this.tileClick.emit(tile.id);
    }
  }

  valueClass(tone: StatusTileTone): string {
    return `status-strip__value status-strip__value--${tone}`;
  }
}
