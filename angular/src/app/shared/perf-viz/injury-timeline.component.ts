import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

export interface InjuryTimelineItem {
  region: string | null;
  grade: string | null;
  type: string | null;
  injuryDate: string | null;
  status: string | null;
  expectedReturn: string | null;
  rtpProgress: number | null;
}

type Tone = "good" | "caution" | "danger" | "neutral";

const DAY = 86_400_000;

/**
 * ff-injury-timeline — a Gantt-style history of injuries over a shared date
 * axis. Each injury is a bar from its date to the expected return (or today if
 * still open), coloured by recovery status (with a text status, never colour
 * alone) and carrying its RTP progress. A "today" marker anchors the reader.
 *
 * CLINICAL data — use only inside the monitoring report's clinical-lens block
 * (the server already gates `injuries` to physio/self). Items without a usable
 * injury date are dropped, never given a fabricated position.
 */
@Component({
  selector: "app-ff-injury-timeline",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rows().length) {
      <div class="tl" role="img" [attr.aria-label]="aria()">
        <div class="axis">
          <small class="mono">{{ startLabel() }}</small>
          <small class="mono today">today</small>
        </div>
        <div class="track-wrap">
          <div class="today-line" [style.left.%]="todayPct()"></div>
          @for (r of rows(); track r.key) {
            <div class="row">
              <div class="lbl">
                <b>{{ r.region || "Injury" }}</b>
                @if (r.grade) {
                  <span class="grade">{{ r.grade }}</span>
                }
              </div>
              <div class="lane">
                <div
                  class="bar tone-{{ r.tone }}"
                  [style.left.%]="r.left"
                  [style.width.%]="r.width"
                  [attr.title]="r.title"
                >
                  @if (r.rtpProgress !== null && r.tone !== 'good') {
                    <span class="rtp" [style.width.%]="r.rtpProgress"></span>
                  }
                </div>
              </div>
              <span class="status tone-{{ r.tone }}">{{ r.statusText }}</span>
            </div>
          }
        </div>
      </div>
    } @else {
      <p class="empty">No injury history on record for this window.</p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .axis {
        display: flex;
        justify-content: space-between;
        color: var(--text-faint);
        margin-bottom: 6px;
      }
      .axis small {
        font-size: 9.5px;
      }
      .axis .today {
        color: var(--accent);
      }
      .track-wrap {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .today-line {
        position: absolute;
        top: -2px;
        bottom: -2px;
        width: 1px;
        background: color-mix(in srgb, var(--accent) 55%, transparent);
        z-index: 1;
      }
      .row {
        display: grid;
        grid-template-columns: 120px 1fr auto;
        align-items: center;
        gap: 10px;
      }
      .lbl {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
      }
      .lbl b {
        font-size: 12.5px;
        color: var(--text);
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .grade {
        font-family: var(--font-mono);
        font-size: 9.5px;
        color: var(--text-faint);
      }
      .lane {
        position: relative;
        height: 12px;
        border-radius: var(--r-pill);
        background: var(--surface-2);
      }
      .bar {
        position: absolute;
        top: 0;
        bottom: 0;
        min-width: 6px;
        border-radius: var(--r-pill);
        background: color-mix(in srgb, var(--warn) 55%, var(--surface-2));
        overflow: hidden;
      }
      .bar.tone-danger {
        background: color-mix(in srgb, var(--danger) 55%, var(--surface-2));
      }
      .bar.tone-caution {
        background: color-mix(in srgb, var(--warn) 55%, var(--surface-2));
      }
      .bar.tone-good {
        background: color-mix(in srgb, var(--good) 50%, var(--surface-2));
      }
      .bar.tone-neutral {
        background: var(--text-faint);
      }
      .rtp {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background: color-mix(in srgb, var(--accent) 55%, transparent);
      }
      .status {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .status.tone-good {
        color: var(--good);
      }
      .status.tone-caution {
        color: var(--warn);
      }
      .status.tone-danger {
        color: var(--danger);
      }
      .status.tone-neutral {
        color: var(--text-faint);
      }
      .empty {
        margin: 0;
        color: var(--text-faint);
        font-size: 12.5px;
      }
    `,
  ],
})
export class InjuryTimelineComponent {
  readonly items = input<readonly InjuryTimelineItem[]>([]);

  private readonly parsed = computed(() =>
    this.items()
      .map((it) => {
        const start = it.injuryDate ? new Date(it.injuryDate).getTime() : NaN;
        if (!Number.isFinite(start)) return null;
        const ret = it.expectedReturn
          ? new Date(it.expectedReturn).getTime()
          : NaN;
        return { it, start, ret: Number.isFinite(ret) ? ret : null };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.start - b.start),
  );

  private readonly domain = computed(() => {
    const p = this.parsed();
    const now = Date.now();
    if (!p.length) return { min: now - 30 * DAY, max: now };
    const min = Math.min(...p.map((x) => x.start));
    const max = Math.max(now, ...p.map((x) => x.ret ?? x.start));
    const pad = (max - min || 30 * DAY) * 0.04;
    return { min: min - pad, max: max + pad };
  });

  private tone(status: string | null): Tone {
    const s = (status ?? "").toLowerCase();
    if (/(active|acute|injured|severe)/.test(s)) return "danger";
    if (/(recover|rehab|return|progress|limited)/.test(s)) return "caution";
    if (/(resolved|cleared|healthy|complete|full)/.test(s)) return "good";
    return "neutral";
  }

  readonly rows = computed(() => {
    const { min, max } = this.domain();
    const span = max - min || 1;
    const now = Date.now();
    const pct = (t: number) =>
      +Math.min(100, Math.max(0, ((t - min) / span) * 100)).toFixed(2);
    return this.parsed().map((x, i) => {
      const end = x.ret ?? now;
      const left = pct(x.start);
      const width = Math.max(1.5, pct(end) - left);
      const status = x.it.status ?? "unknown";
      const fmt = (t: number) =>
        new Date(t).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        });
      return {
        key: `${x.it.region ?? "inj"}-${x.start}-${i}`,
        region: x.it.region,
        grade: x.it.grade,
        left,
        width,
        tone: this.tone(status),
        statusText: status.replace(/_/g, " "),
        rtpProgress:
          typeof x.it.rtpProgress === "number"
            ? Math.min(100, Math.max(0, x.it.rtpProgress))
            : null,
        title: `${x.it.region ?? "Injury"}${x.it.type ? " · " + x.it.type : ""} — ${fmt(x.start)}${x.ret ? " → " + fmt(x.ret) : " (open)"}, ${status}`,
      };
    });
  });

  readonly startLabel = computed(() => {
    const p = this.parsed();
    if (!p.length) return "";
    return new Date(p[0].start).toLocaleDateString("en-GB", {
      month: "short",
      year: "2-digit",
    });
  });

  readonly todayPct = computed(() => {
    const { min, max } = this.domain();
    return +Math.min(
      100,
      Math.max(0, ((Date.now() - min) / (max - min || 1)) * 100),
    ).toFixed(2);
  });

  readonly aria = computed(() => {
    const n = this.rows().length;
    const open = this.parsed().filter((x) => !x.ret).length;
    return `Injury history timeline, ${n} injuries, ${open} still open.`;
  });
}
