import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { SupabaseService } from "../core/services/supabase.service";
import { ageYearsFromUserMetadata } from "../core/utils/age-years.util";
import {
  FUELLING_QUESTIONS,
  deriveFuellingResult,
} from "./fuelling-check.logic";

/**
 * Fuelling check — a private, educational low-energy-availability / RED-S
 * self-screen. NOTHING is stored (no special-category data at rest); answers live
 * only in component state and vanish on reload. The safety behaviour is in
 * `fuelling-check.logic.ts` (tested): never suggests a deficit, routes every real
 * flag to a human, growth-frames youth. This screen just presents it.
 */
@Component({
  selector: "app-fuelling-check",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <main class="fc">
      <header class="fc-head">
        <div class="eyebrow">
          <lucide-icon name="heart-pulse" [size]="15" /> Fuelling check
        </div>
        <h1>Are you fuelling enough?</h1>
        <p class="sub">
          A quick, private self-check for under-fuelling (RED-S). It stays on
          your device — nothing is saved or shared. It can’t diagnose anything;
          if it flags something, it’ll point you to a person who can help.
        </p>
      </header>

      @if (!result()) {
        <section class="card">
          <div class="card-body">
            <ul class="q-list">
              @for (q of questions; track q.id; let i = $index) {
                <li class="q">
                  <span class="q-text">{{ q.text }}</span>
                  <div class="yn" role="group" [attr.aria-label]="q.text">
                    <button
                      type="button"
                      class="yn-btn"
                      [class.on]="answers()[q.id] === true"
                      (click)="answer(q.id, true)"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      class="yn-btn"
                      [class.on]="answers()[q.id] === false"
                      (click)="answer(q.id, false)"
                    >
                      No
                    </button>
                  </div>
                </li>
              }
            </ul>
            <div class="fc-actions">
              <button
                class="btn btn--primary"
                type="button"
                [disabled]="!allAnswered()"
                (click)="submit()"
              >
                See my result
              </button>
              @if (!allAnswered()) {
                <span class="hint"
                  >{{ answeredCount() }} / {{ questions.length }} answered</span
                >
              }
            </div>
          </div>
        </section>
      } @else {
        <section class="card result tone-{{ result()!.level }}">
          <div class="card-body">
            <div class="res-head">
              <lucide-icon [name]="resultIcon()" [size]="20" />
              <h2>{{ result()!.headline }}</h2>
            </div>
            <p class="res-body">{{ result()!.body }}</p>

            @if (result()!.flagged.length) {
              <div class="flagged">
                <span class="fl-lbl">You told us:</span>
                <ul>
                  @for (f of result()!.flagged; track f) {
                    <li>{{ f }}</li>
                  }
                </ul>
              </div>
            }

            @if (result()!.routeToHuman) {
              <div class="route">
                <lucide-icon name="alert-triangle" [size]="16" />
                <span>
                  Please bring this up with the team’s nutrition or medical
                  staff — this screen isn’t a diagnosis, but they can check it
                  properly and help you fuel for performance.
                </span>
              </div>
            }

            <div class="fc-actions">
              <a class="btn btn--primary" routerLink="/nutrition">
                <lucide-icon name="apple" [size]="15" /> See your fuel plan
              </a>
              <button class="btn btn--ghost" type="button" (click)="retake()">
                Retake
              </button>
            </div>
          </div>
        </section>
      }
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .fc {
        max-width: 640px;
        margin: 0 auto;
        padding: 16px 16px 96px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .fc-head .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--accent);
      }
      .fc-head h1 {
        margin: 6px 0 4px;
        font-size: 26px;
        line-height: 1.1;
        color: var(--text-strong);
        text-wrap: balance;
      }
      .fc-head .sub {
        margin: 0;
        max-width: 56ch;
        font-size: 13.5px;
        line-height: 1.5;
        color: var(--text-muted);
      }
      .card {
        background: var(--surface);
        border: 1px solid var(--border-soft);
        border-radius: var(--r-lg);
      }
      .card-body {
        padding: 14px 16px 16px;
      }
      .q-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
      .q {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-soft);
      }
      .q:last-child {
        border-bottom: none;
      }
      .q-text {
        flex: 1;
        font-size: 13.5px;
        line-height: 1.45;
        color: var(--text-strong);
      }
      .yn {
        display: flex;
        gap: 6px;
        flex: none;
      }
      .yn-btn {
        min-width: 46px;
        padding: 7px 12px;
        border-radius: var(--r-pill);
        border: 1px solid var(--border-soft);
        background: var(--surface-2);
        color: var(--text-muted);
        font-family: var(--font-body);
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
      }
      .yn-btn.on {
        background: var(--accent);
        color: #08090b;
        border-color: transparent;
      }
      .fc-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 16px;
        flex-wrap: wrap;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px 18px;
        border-radius: var(--r-pill);
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        border: 1px solid transparent;
      }
      .btn--primary {
        background: var(--accent);
        color: #08090b;
      }
      .btn--primary:disabled {
        opacity: 0.5;
        cursor: default;
      }
      .btn--ghost {
        background: transparent;
        border-color: var(--border-soft);
        color: var(--text-strong);
      }
      .hint {
        font-size: 12px;
        color: var(--text-faint);
      }
      .res-head {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .res-head h2 {
        margin: 0;
        font-size: 18px;
        color: var(--text-strong);
      }
      .result.tone-talk .res-head lucide-icon {
        color: var(--danger);
      }
      .result.tone-watch .res-head lucide-icon {
        color: var(--warn);
      }
      .result.tone-ok .res-head lucide-icon {
        color: var(--good);
      }
      .res-body {
        margin: 12px 0 0;
        font-size: 14px;
        line-height: 1.55;
        color: var(--text-muted);
      }
      .flagged {
        margin-top: 14px;
        padding: 12px;
        background: var(--surface-2);
        border-radius: var(--r-md);
      }
      .fl-lbl {
        font-size: 11px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--text-faint);
      }
      .flagged ul {
        margin: 6px 0 0;
        padding-left: 18px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .flagged li {
        font-size: 12.5px;
        color: var(--text-muted);
        line-height: 1.4;
      }
      .route {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        margin-top: 14px;
        padding: 12px 13px;
        border-radius: var(--r-md);
        background: color-mix(in srgb, var(--warn) 12%, var(--surface));
        border: 1px solid color-mix(in srgb, var(--warn) 30%, transparent);
      }
      .route lucide-icon {
        color: var(--warn);
        flex: none;
        margin-top: 1px;
      }
      .route span {
        font-size: 13px;
        line-height: 1.5;
        color: var(--text-strong);
      }
    `,
  ],
})
export class FuellingCheckComponent {
  private readonly supabase = inject(SupabaseService);

  readonly questions = FUELLING_QUESTIONS;
  readonly answers = signal<Record<string, boolean>>({});
  private readonly submitted = signal(false);

  readonly isYouth = computed(() => {
    const a = ageYearsFromUserMetadata(
      this.supabase.currentUser()?.user_metadata,
    );
    return a != null && a < 18;
  });

  readonly answeredCount = computed(() => Object.keys(this.answers()).length);
  readonly allAnswered = computed(
    () => this.answeredCount() === this.questions.length,
  );

  readonly result = computed(() =>
    this.submitted()
      ? deriveFuellingResult(this.answers(), this.isYouth())
      : null,
  );

  readonly resultIcon = computed(() => {
    switch (this.result()?.level) {
      case "talk":
        return "alert-triangle";
      case "watch":
        return "info";
      default:
        return "check";
    }
  });

  answer(id: string, value: boolean): void {
    this.answers.update((a) => ({ ...a, [id]: value }));
  }

  submit(): void {
    if (this.allAnswered()) this.submitted.set(true);
  }

  retake(): void {
    this.answers.set({});
    this.submitted.set(false);
  }
}
