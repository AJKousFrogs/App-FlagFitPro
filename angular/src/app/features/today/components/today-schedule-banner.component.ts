import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

import {
  CompetitionEvent,
  CompetitionPhase,
  EventDensity,
} from "../../../core/models/schedule.models";

interface PhaseDescriptor {
  icon: string;
  label: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
}

const PHASE_DESCRIPTORS: Record<CompetitionPhase, PhaseDescriptor> = {
  competition: { icon: "pi-flag-fill", label: "Competition day", tone: "danger" },
  taper:       { icon: "pi-chart-line", label: "Taper week",       tone: "warning" },
  recovery:    { icon: "pi-heart",      label: "Recovery",          tone: "info" },
  accumulation:{ icon: "pi-bolt",       label: "Build phase",       tone: "success" },
  transition:  { icon: "pi-pause",      label: "Off-season",        tone: "neutral" },
};

const DENSITY_THRESHOLD_GAMES_14D = 10;

@Component({
  selector: "app-today-schedule-banner",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <section
      class="schedule-banner"
      [attr.data-tone]="descriptor().tone"
      role="status"
      aria-live="polite"
    >
      <div class="schedule-banner__phase">
        <i class="pi" [class]="descriptor().icon" aria-hidden="true"></i>
        <span class="schedule-banner__phase-label">{{ descriptor().label }}</span>
      </div>

      @if (nextEventLine(); as line) {
        <div class="schedule-banner__primary">
          <strong>{{ line }}</strong>
        </div>
      } @else {
        <div class="schedule-banner__primary schedule-banner__primary--muted">
          No events scheduled.
        </div>
      }

      @if (densityWarning(); as warning) {
        <div class="schedule-banner__density">
          <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
          <span>{{ warning }}</span>
        </div>
      }
    </section>
  `,
  styleUrl: "./today-schedule-banner.component.scss",
})
export class TodayScheduleBannerComponent {
  readonly phase = input.required<CompetitionPhase>();
  readonly nextEvent = input<CompetitionEvent | null>(null);
  readonly density14d = input<EventDensity | null>(null);

  readonly descriptor = computed<PhaseDescriptor>(
    () => PHASE_DESCRIPTORS[this.phase()],
  );

  readonly nextEventLine = computed<string | null>(() => {
    const ev = this.nextEvent();
    if (!ev) {
      return null;
    }
    const when = formatRelativeWhen(new Date(ev.startsAt));
    const games =
      ev.expectedGameCount > 1
        ? ` • ${ev.expectedGameCount} games`
        : "";
    const competition = ev.competitionShortName ?? ev.competitionName;
    return `${competition} — ${when}${games}`;
  });

  readonly densityWarning = computed<string | null>(() => {
    const d = this.density14d();
    if (!d) {
      return null;
    }
    if (d.totalGames >= DENSITY_THRESHOLD_GAMES_14D) {
      return `${d.totalGames} games in next 14 days — load reduced`;
    }
    if (d.hasPeakImportance) {
      return `Peak event ahead — taper window active`;
    }
    return null;
  });
}

function formatRelativeWhen(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffHours = diffMs / 3_600_000;
  const diffDays = diffMs / 86_400_000;

  if (diffMs < 0) {
    return "now";
  }
  if (diffHours < 1) {
    return "in under an hour";
  }
  if (diffHours < 12) {
    const h = Math.round(diffHours);
    return `in ${h} hour${h === 1 ? "" : "s"}`;
  }
  if (diffDays < 1) {
    return "today";
  }
  if (diffDays < 2) {
    return "tomorrow";
  }
  if (diffDays < 7) {
    const d = Math.ceil(diffDays);
    return `in ${d} days`;
  }
  // Beyond a week — show actual date
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return formatter.format(date);
}
