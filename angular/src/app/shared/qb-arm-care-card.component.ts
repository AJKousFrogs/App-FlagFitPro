import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

import { PeriodizationService } from "../core/services/periodization.service";
import { QbThrowingService } from "../core/services/qb-throwing.service";
import { QbSessionType } from "../core/models/qb-throwing.models";

/**
 * QB arm-care / throw-count logger (V2.2). Self-gating — renders nothing
 * unless `PeriodizationService.position()` is "qb", so any screen can drop
 * `<app-qb-arm-care-card>` in without its own position check.
 *
 * Wires the previously-orphaned `/api/qb-throwing` lane (built, zero
 * frontend callers per the SOURCE_OF_TRUTH ledger) — this is the data the
 * engine's `QB_THROW_ADAPTATION` dosing policy has always assumed exists.
 * See docs/v2/V2.2-breadth-calibration.md.
 */
@Component({
  selector: "app-qb-arm-care-card",
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isQb()) {
      <div class="section-h"><h2>QB arm care</h2></div>
      <div class="card">
        @if (progression(); as p) {
          <div class="lrow">
            <span>This week</span>
            <b
              >{{ p.currentWeekAvg }} / {{ p.targetThrows }} throws ·
              {{ p.progressionPhase }}</b
            >
          </div>
          <small class="muted">{{ p.recommendation }}</small>
        }

        @if (!logging()) {
          <button
            class="btn secondary block sm"
            style="margin-top:var(--s-2)"
            type="button"
            (click)="logging.set(true)"
          >
            <lucide-icon name="pencil" /> Log a throwing session
          </button>
        } @else {
          <div
            style="margin-top:var(--s-3);display:flex;flex-direction:column;gap:var(--s-2)"
          >
            <label for="qb-session-type"><small>Session type</small></label>
            <select
              id="qb-session-type"
              class="input"
              [value]="sessionType()"
              (change)="sessionType.set($any($event.target).value)"
            >
              <option value="practice">Practice</option>
              <option value="game">Game</option>
              <option value="individual">Individual</option>
              <option value="bullpen">Bullpen</option>
            </select>

            <label for="qb-total-throws"><small>Total throws</small></label>
            <input
              id="qb-total-throws"
              class="input"
              type="number"
              min="1"
              max="1000"
              [value]="totalThrows()"
              (input)="totalThrows.set(+$any($event.target).value)"
            />

            <div><small>Throws by distance (optional)</small></div>
            <div
              style="display:flex;gap:var(--s-2)"
              role="group"
              aria-label="Throws by distance"
            >
              <input
                class="input"
                type="number"
                min="0"
                max="1000"
                placeholder="Short"
                aria-label="Short throws"
                [value]="shortThrows() || ''"
                (input)="shortThrows.set(+$any($event.target).value || 0)"
              />
              <input
                class="input"
                type="number"
                min="0"
                max="1000"
                placeholder="Medium"
                aria-label="Medium throws"
                [value]="mediumThrows() || ''"
                (input)="mediumThrows.set(+$any($event.target).value || 0)"
              />
              <input
                class="input"
                type="number"
                min="0"
                max="1000"
                placeholder="Long"
                aria-label="Long throws"
                [value]="longThrows() || ''"
                (input)="longThrows.set(+$any($event.target).value || 0)"
              />
            </div>
            @if (splitSum() > 0 && splitSum() !== totalThrows()) {
              <small class="muted"
                >Breakdown sums to {{ splitSum() }} · total is
                {{ totalThrows() }}</small
              >
            }

            <label for="qb-arm-before"
              ><small>Arm feeling before (1–10)</small></label
            >
            <input
              id="qb-arm-before"
              class="rng"
              type="range"
              min="1"
              max="10"
              [value]="armFeelingBefore()"
              (input)="armFeelingBefore.set(+$any($event.target).value)"
            />
            <span class="val">{{ armFeelingBefore() }}</span>

            <label for="qb-arm-feeling"
              ><small>Arm feeling after (1–10)</small></label
            >
            <input
              id="qb-arm-feeling"
              class="rng"
              type="range"
              min="1"
              max="10"
              [value]="armFeelingAfter()"
              (input)="armFeelingAfter.set(+$any($event.target).value)"
            />
            <span class="val">{{ armFeelingAfter() }}</span>

            <div class="lrow">
              <span id="qb-warmup">Warm-up done before</span>
              <button
                class="sw"
                role="switch"
                type="button"
                [attr.aria-checked]="warmupDone()"
                aria-labelledby="qb-warmup"
                (click)="warmupDone.set(!warmupDone())"
              ></button>
            </div>
            <div class="lrow">
              <span id="qb-armcare">Arm care done after</span>
              <button
                class="sw"
                role="switch"
                type="button"
                [attr.aria-checked]="armCareDone()"
                aria-labelledby="qb-armcare"
                (click)="armCareDone.set(!armCareDone())"
              ></button>
            </div>
            <div class="lrow">
              <span id="qb-ice">Iced after</span>
              <button
                class="sw"
                role="switch"
                type="button"
                [attr.aria-checked]="iceApplied()"
                aria-labelledby="qb-ice"
                (click)="iceApplied.set(!iceApplied())"
              ></button>
            </div>

            @if (error(); as e) {
              <p class="note" style="color:var(--danger)">{{ e }}</p>
            }

            <div class="inline">
              <button
                class="btn sm"
                type="button"
                [disabled]="saving()"
                (click)="submit()"
              >
                {{ saving() ? "Saving…" : "Save" }}
              </button>
              <button
                class="btn secondary sm"
                type="button"
                (click)="logging.set(false)"
              >
                Cancel
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class QbArmCareCardComponent {
  private readonly periodization = inject(PeriodizationService);
  private readonly qbThrowing = inject(QbThrowingService);

  readonly isQb = computed(() => this.periodization.position() === "qb");
  readonly progression = computed(
    () => this.qbThrowing.data()?.progression ?? null,
  );
  readonly saving = this.qbThrowing.saving;
  readonly error = this.qbThrowing.error;

  readonly logging = signal(false);
  readonly sessionType = signal<QbSessionType>("practice");
  readonly totalThrows = signal(50);
  readonly armFeelingBefore = signal(5);
  readonly armFeelingAfter = signal(5);
  // Optional distance breakdown — the engine's QB_THROW_ADAPTATION cares about
  // long-ball volume (high-stress), so a short/medium/long split is richer than
  // a bare total. Left at 0 = "didn't break it down" (omitted on submit).
  readonly shortThrows = signal(0);
  readonly mediumThrows = signal(0);
  readonly longThrows = signal(0);
  readonly splitSum = computed(
    () => this.shortThrows() + this.mediumThrows() + this.longThrows(),
  );
  // Arm-care compliance — the load model uses these to soften/flag next-day
  // volume (a session without warm-up + arm-care carries more risk).
  readonly warmupDone = signal(false);
  readonly armCareDone = signal(false);
  readonly iceApplied = signal(false);

  private loaded = false;

  constructor() {
    // Lazy-load once `position` resolves to "qb" — the signal starts null
    // until the profile/schedule data loads, so a one-shot constructor check
    // would miss it; the effect re-fires when position changes.
    effect(() => {
      if (this.isQb() && !this.loaded) {
        this.loaded = true;
        void this.qbThrowing.load();
      }
    });
  }

  async submit(): Promise<void> {
    const hasSplit = this.splitSum() > 0;
    try {
      await this.qbThrowing.logSession({
        sessionType: this.sessionType(),
        totalThrows: this.totalThrows(),
        armFeelingBefore: this.armFeelingBefore(),
        armFeelingAfter: this.armFeelingAfter(),
        preThrowingWarmupDone: this.warmupDone(),
        postThrowingArmCareDone: this.armCareDone(),
        iceApplied: this.iceApplied(),
        // Only send the split when the athlete actually filled it in — a 0/0/0
        // breakdown would contradict a non-zero total and store false zeros.
        ...(hasSplit
          ? {
              shortThrows: this.shortThrows(),
              mediumThrows: this.mediumThrows(),
              longThrows: this.longThrows(),
            }
          : {}),
      });
      this.logging.set(false);
      this.resetForm();
    } catch {
      // error signal already surfaced via QbThrowingService.error
    }
  }

  // Reset the per-session fields after a successful log so compliance flags
  // (warm-up / arm-care / ice) and the distance split never carry silently into
  // the next session — that would corrupt the arm-care compliance signal.
  private resetForm(): void {
    this.shortThrows.set(0);
    this.mediumThrows.set(0);
    this.longThrows.set(0);
    this.armFeelingBefore.set(5);
    this.armFeelingAfter.set(5);
    this.warmupDone.set(false);
    this.armCareDone.set(false);
    this.iceApplied.set(false);
  }
}
