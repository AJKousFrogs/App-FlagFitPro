import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";

/**
 * Day Picker Strip — Phase 1 mobile-first primitive.
 *
 * Horizontal sticky day picker matching the MLS Matches screen
 * ("Sunday, Mar 30"): a scrollable row of compact day cells (weekday
 * letter + day number) with active state and optional "today" indicator.
 *
 * Use this for any date-driven feature (Training schedule, Game schedule,
 * Wellness log review). Hides the native scrollbar for a clean look;
 * scroll-snaps each cell into place.
 *
 * Mobile-first: cells size from --space-12 (48px wide). On desktop the
 * caller can constrain the strip width and the rest is overflow scroll.
 *
 * Usage:
 *   <app-day-picker-strip
 *     [selected]="selectedDate()"
 *     [start]="weekStart()"
 *     [days]="14"
 *     (selectedChange)="onPick($event)"
 *   />
 */
@Component({
  selector: "app-day-picker-strip",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="day-picker-strip" role="group" [attr.aria-label]="ariaLabel() || 'Pick a date'">
      <div class="day-picker-strip__track" #track>
        @for (day of days(); track day.iso) {
          <button
            type="button"
            class="day-picker-strip__day"
            [class.day-picker-strip__day--active]="day.isSelected"
            [class.day-picker-strip__day--today]="day.isToday"
            [attr.aria-pressed]="day.isSelected"
            [attr.aria-label]="day.fullLabel"
            (click)="onPick(day.iso)"
          >
            <span class="day-picker-strip__weekday">{{ day.weekday }}</span>
            <span class="day-picker-strip__date">{{ day.dayNumber }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styleUrl: "./day-picker-strip.component.scss",
})
export class DayPickerStripComponent {
  /** ISO date (YYYY-MM-DD) of the currently selected day. */
  readonly selected = input.required<string>();
  /** ISO date of the first day in the strip. Defaults to 7 days before `selected`. */
  readonly start = input<string>("");
  /** Number of days to render. Defaults to 14. */
  readonly length = input<number, number>(14, { transform: (v) => Math.max(1, v) });
  readonly ariaLabel = input<string>("");

  readonly selectedChange = output<string>();

  private readonly track = viewChild<ElementRef<HTMLDivElement>>("track");
  private readonly todayIso = signal(this.toIso(new Date()));

  /** Computed list of day cells (rendered as the template iterable). */
  readonly days = computed(() => this.buildDays());

  constructor() {
    // Auto-scroll to keep the selected day in view when it changes.
    effect(() => {
      this.selected();
      queueMicrotask(() => this.scrollSelectedIntoView());
    });
  }

  onPick(iso: string): void {
    if (iso === this.selected()) return;
    this.selectedChange.emit(iso);
  }

  private buildDays() {
    const startIso = this.start() || this.shiftIso(this.selected(), -7);
    const startDate = this.parseIso(startIso);
    const total = this.length();
    const selectedIso = this.selected();
    const todayIso = this.todayIso();
    const out: {
      iso: string;
      weekday: string;
      dayNumber: number;
      fullLabel: string;
      isSelected: boolean;
      isToday: boolean;
    }[] = [];

    for (let i = 0; i < total; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const iso = this.toIso(d);
      out.push({
        iso,
        weekday: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3),
        dayNumber: d.getDate(),
        fullLabel: d.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        isSelected: iso === selectedIso,
        isToday: iso === todayIso,
      });
    }
    return out;
  }

  private scrollSelectedIntoView(): void {
    const track = this.track()?.nativeElement;
    if (!track) return;
    const target = track.querySelector<HTMLElement>(`[aria-pressed="true"]`);
    target?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }

  private toIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  private parseIso(iso: string): Date {
    const [y, m, d] = iso.split("-").map((s) => parseInt(s, 10));
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }

  private shiftIso(iso: string, deltaDays: number): string {
    const date = this.parseIso(iso);
    date.setDate(date.getDate() + deltaDays);
    return this.toIso(date);
  }
}
