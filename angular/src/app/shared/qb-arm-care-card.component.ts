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
  readonly armFeelingAfter = signal(5);

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
    try {
      await this.qbThrowing.logSession({
        sessionType: this.sessionType(),
        totalThrows: this.totalThrows(),
        armFeelingAfter: this.armFeelingAfter(),
      });
      this.logging.set(false);
    } catch {
      // error signal already surfaced via QbThrowingService.error
    }
  }
}
