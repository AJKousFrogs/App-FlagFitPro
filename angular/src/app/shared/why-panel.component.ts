import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import type { DailyPrescription } from "../core/models/prescription.models";

interface WhyEntry {
  icon: string;
  title: string;
  text: string;
  tone: "info" | "caution" | "danger" | "accent";
}

/**
 * app-why-panel — "Why this day looks like this". Surfaces the guard decisions
 * the engine already computed onto the DailyPrescription (weather, injury/physio,
 * CNS spacing, arrival cap, tournament recovery, position emphasis, time-shift,
 * second session) as plain human sentences. Answer-first (Law #4): collapsed by
 * default under the hero, expanded on demand. Renders NOTHING that isn't a real
 * fired guard — no fabricated explanations.
 */
@Component({
  selector: "app-why-panel",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    @if (entries().length) {
      <div class="wp">
        <button
          class="wp-toggle"
          type="button"
          [attr.aria-expanded]="open()"
          (click)="open.set(!open())"
        >
          <lucide-icon name="info" [size]="15" />
          Why this day looks like this
          <span class="count">{{ entries().length }}</span>
          <lucide-icon
            [name]="open() ? 'chevron-up' : 'chevron-down'"
            [size]="16"
            class="chev"
          />
        </button>
        @if (open()) {
          <ul class="wp-list">
            @for (e of entries(); track e.title) {
              <li class="wp-item tone-{{ e.tone }}">
                <lucide-icon [name]="e.icon" [size]="15" class="wp-ic" />
                <div>
                  <b>{{ e.title }}</b>
                  <span>{{ e.text }}</span>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .wp {
        border: 1px solid var(--border-soft);
        border-radius: var(--r-md);
        background: var(--surface);
      }
      .wp-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 11px 14px;
        background: none;
        border: none;
        color: var(--text-muted);
        font-family: var(--font-body);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        text-align: left;
      }
      .wp-toggle .count {
        font-family: var(--font-mono);
        font-size: 11px;
        background: var(--surface-2);
        color: var(--text-faint);
        border-radius: var(--r-pill);
        padding: 1px 7px;
      }
      .wp-toggle .chev {
        margin-left: auto;
        color: var(--text-faint);
      }
      .wp-toggle:hover {
        color: var(--text-strong);
      }
      .wp-toggle:focus-visible {
        outline: none;
        box-shadow: var(
          --focus,
          0 0 0 3px color-mix(in srgb, var(--accent) 45%, transparent)
        );
      }
      .wp-list {
        list-style: none;
        margin: 0;
        padding: 0 14px 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .wp-item {
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }
      .wp-item .wp-ic {
        flex: none;
        margin-top: 2px;
        color: var(--info);
      }
      .wp-item.tone-caution .wp-ic {
        color: var(--warn);
      }
      .wp-item.tone-danger .wp-ic {
        color: var(--danger);
      }
      .wp-item.tone-accent .wp-ic {
        color: var(--accent);
      }
      .wp-item b {
        display: block;
        font-size: 13px;
        color: var(--text-strong);
        font-weight: 600;
      }
      .wp-item span {
        font-size: 12.5px;
        color: var(--text-muted);
        line-height: 1.45;
      }
    `,
  ],
})
export class WhyPanelComponent {
  readonly rx = input<DailyPrescription | null>(null);
  /** Include the base plan sentence as the first entry. Set false where the
   * host already shows the reasoning inline (Today), to avoid duplication. */
  readonly includeBase = input(true);

  private readonly open_ = signal(false);
  readonly open = this.open_;

  readonly entries = computed<WhyEntry[]>(() => {
    const p = this.rx();
    if (!p) return [];
    const out: WhyEntry[] = [];

    // Base plan sentence first — the answer.
    if (this.includeBase() && p.reasoning) {
      out.push({
        icon: "target",
        title: "Today's plan",
        text: p.reasoning,
        tone: "accent",
      });
    }
    // Injury / physio — highest training precedence.
    if (p.injuryAdjustment) {
      const a = p.injuryAdjustment;
      out.push({
        icon: "shield-alert",
        title: "Injury / tightness",
        text: `Reported ${a.regions.join(", ") || "soft tissue"} (${a.severity}) — ${a.summary}. Injury precedence over training.`,
        tone: "danger",
      });
    }
    // Weather guard.
    if (p.weatherAdjustment?.applied && p.weatherAdjustment.reason) {
      out.push({
        icon: "cloud-sun",
        title: "Weather",
        text: p.weatherAdjustment.reason,
        tone: p.weatherAdjustment.action === "stop" ? "danger" : "caution",
      });
    }
    // CNS spacing.
    if (p.cnsRecoveryAdjustment) {
      const c = p.cnsRecoveryAdjustment;
      out.push({
        icon: "activity",
        title: "Nervous-system recovery",
        text: `A hard sprint/plyo session ${Math.round(c.hoursSinceLastHighCns)}h ago — within the ${c.windowHours}h window, so today drops from ${c.originalIntent} to keep the CNS fresh.`,
        tone: "caution",
      });
    }
    // Post-tournament recovery.
    if (p.tournamentRecoveryAdjustment) {
      const t = p.tournamentRecoveryAdjustment;
      out.push({
        icon: "battery-low",
        title: "Post-tournament recovery",
        text: `Day ${t.dayAfterTournament} after ${t.tournamentName ?? "your tournament"} (${t.gamesPlayed} games) — neuromuscular repair still active, so recovery is forced.`,
        tone: "caution",
      });
    }
    // Time-shift advisory.
    if (p.timeShift?.message) {
      out.push({
        icon: "clock",
        title: "Train in the cooler hour",
        text: p.timeShift.message,
        tone: "info",
      });
    }
    // Second session.
    if (p.secondSession) {
      out.push({
        icon: "repeat",
        title: "Evening session",
        text: p.secondSession.reasoning,
        tone: "accent",
      });
    }
    // Position emphasis (accessory, never changes load).
    if (p.positionEmphasis?.note) {
      out.push({
        icon: "user",
        title: `Position focus · ${p.positionEmphasis.label}`,
        text: p.positionEmphasis.note,
        tone: "info",
      });
    }
    return out;
  });
}
