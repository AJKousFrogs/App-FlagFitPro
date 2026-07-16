import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from "@angular/core";
import { WhyPanelComponent } from "../../shared/why-panel.component";
import {
  SCENARIOS,
  runScenario,
  type ScenarioKey,
} from "./engine-inspector.presets";

/**
 * Engine inspector (staff, pure client, zero backend). Feeds known synthetic
 * inputs to the SAME `planWeek` the app and server run, and renders the 7-day
 * plan with each day's fired guards (via the shared why-panel). It is living
 * documentation of guard precedence and a review harness for future engine PRs —
 * it changes nothing, it only shows what the engine already decides.
 */
@Component({
  selector: "app-engine-inspector",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WhyPanelComponent],
  template: `
    <main class="insp">
      <header class="insp-head">
        <div class="eyebrow">Staff · engine</div>
        <h1>Engine inspector</h1>
        <p class="sub">
          Runs the same <code>planWeek()</code> the athlete app and the server
          run, over a known scenario, so you can see exactly which guards fire
          and in what order. Nothing here is fabricated — it's the real engine
          on synthetic inputs.
        </p>
      </header>

      <div class="tabs" role="tablist">
        @for (s of scenarios; track s.key) {
          <button
            type="button"
            role="tab"
            class="tab"
            [class.active]="s.key === key()"
            [attr.aria-selected]="s.key === key()"
            (click)="key.set(s.key)"
          >
            {{ s.label }}
          </button>
        }
      </div>

      @if (run(); as r) {
        <section class="scenario">
          <p class="desc">{{ r.scenario.description }}</p>
          <div class="chips">
            @for (g of r.scenario.demonstrates; track g) {
              <span class="chip">{{ g }}</span>
            }
          </div>
          <div class="signals">
            <span
              >Day-0 readiness <b>{{ r.todayReadiness ?? "—" }}</b></span
            >
            <span
              >Day-0 ACWR <b>{{ r.todayAcwr ?? "—" }}</b></span
            >
          </div>
        </section>

        <div class="week">
          @for (day of r.week; track day.date; let i = $index) {
            <article class="day" [class.today]="i === 0">
              <div class="day-head">
                <span class="wd">{{ weekday(day.date) }}</span>
                @if (i === 0) {
                  <span class="now">today</span>
                }
                <span class="intent">{{ day.intentLabel }}</span>
              </div>
              <div class="stats">
                <span
                  >RPE <b>{{ day.targetRpe ?? "—" }}</b></span
                >
                <span>{{ day.targetMinutes }} min</span>
                @if (day.sprintReps) {
                  <span>{{ day.sprintReps }} sprints</span>
                }
                @if (day.strengthSets) {
                  <span>{{ day.strengthSets }} sets</span>
                }
              </div>
              <app-why-panel [rx]="day" [includeBase]="true" />
            </article>
          }
        </div>
      }
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .insp {
        max-width: 760px;
        margin: 0 auto;
        padding: 16px 16px 96px;
      }
      .insp-head .eyebrow {
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--accent);
      }
      .insp-head h1 {
        margin: 6px 0 4px;
        font-size: 24px;
        color: var(--text-strong);
      }
      .insp-head .sub {
        margin: 0 0 16px;
        max-width: 62ch;
        font-size: 13.5px;
        line-height: 1.5;
        color: var(--text-muted);
      }
      .insp-head code {
        font-family: var(--font-mono);
        font-size: 12.5px;
        color: var(--text-strong);
      }
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 14px;
      }
      .tab {
        padding: 8px 13px;
        border-radius: var(--r-pill);
        border: 1px solid var(--border-soft);
        background: var(--surface);
        color: var(--text-muted);
        font-family: var(--font-body);
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
      }
      .tab.active {
        background: var(--accent);
        color: #08090b;
        border-color: transparent;
      }
      .scenario {
        background: var(--surface);
        border: 1px solid var(--border-soft);
        border-radius: var(--r-md);
        padding: 13px 15px;
        margin-bottom: 16px;
      }
      .desc {
        margin: 0 0 10px;
        font-size: 13px;
        color: var(--text-muted);
        line-height: 1.5;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-bottom: 10px;
      }
      .chip {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-strong);
        background: var(--accent-soft);
        border-radius: var(--r-pill);
        padding: 3px 10px;
      }
      .signals {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: var(--text-faint);
      }
      .signals b {
        font-family: var(--font-mono);
        color: var(--text-strong);
      }
      .week {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .day {
        background: var(--surface);
        border: 1px solid var(--border-soft);
        border-radius: var(--r-md);
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .day.today {
        border-color: color-mix(in srgb, var(--accent) 45%, var(--border-soft));
      }
      .day-head {
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .day-head .wd {
        font-weight: 700;
        color: var(--text-strong);
        font-size: 14px;
      }
      .day-head .now {
        font-family: var(--font-mono);
        font-size: 9.5px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--accent);
      }
      .day-head .intent {
        margin-left: auto;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
      }
      .stats {
        display: flex;
        gap: 14px;
        font-size: 12px;
        color: var(--text-muted);
      }
      .stats b {
        font-family: var(--font-mono);
        color: var(--text-strong);
      }
    `,
  ],
})
export class EngineInspectorComponent {
  readonly scenarios = SCENARIOS;
  readonly key = signal<ScenarioKey>("heatwave");
  readonly run = computed(() => runScenario(this.key()));

  weekday(iso: string): string {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }
}
