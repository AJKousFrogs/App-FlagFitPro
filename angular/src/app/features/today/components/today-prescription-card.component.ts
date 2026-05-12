import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";

import {
  DailyPrescription,
  PrescriptionIntent,
} from "../../../core/models/prescription.models";

interface IntentVisual {
  icon: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
}

const INTENT_VISUALS: Record<PrescriptionIntent, IntentVisual> = {
  rest:          { icon: "pi-moon",         tone: "neutral" },
  recovery:      { icon: "pi-heart",        tone: "info" },
  mobility:      { icon: "pi-sync",         tone: "info" },
  technical:     { icon: "pi-compass",      tone: "info" },
  sprint:        { icon: "pi-bolt",         tone: "warning" },
  strength:      { icon: "pi-shield",       tone: "warning" },
  mixed:         { icon: "pi-th-large",     tone: "success" },
  "taper-prime": { icon: "pi-chart-line",   tone: "warning" },
  competition:   { icon: "pi-flag-fill",    tone: "danger" },
};

@Component({
  selector: "app-today-prescription-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (prescription(); as p) {
      <article
        class="rx-card"
        [attr.data-intent]="p.intent"
        [attr.data-tone]="visual().tone"
        aria-labelledby="rx-title"
      >
        <header class="rx-card__header">
          <div class="rx-card__intent-badge">
            <i class="pi" [class]="visual().icon" aria-hidden="true"></i>
            <span class="rx-card__intent-label">{{ p.intentLabel }}</span>
          </div>
          <div class="rx-card__meta">
            @if (p.targetRpe !== null) {
              <span class="rx-card__rpe">
                RPE <strong>{{ p.targetRpe }}</strong>/10
              </span>
            }
            @if (p.targetMinutes > 0) {
              <span class="rx-card__minutes">
                <strong>{{ p.targetMinutes }}</strong> min
              </span>
            }
          </div>
        </header>

        <h2 id="rx-title" class="rx-card__title">{{ headline() }}</h2>
        <p class="rx-card__reasoning">{{ p.reasoning }}</p>

        @if (volumeLine(); as line) {
          <div class="rx-card__volume">
            <i class="pi pi-list" aria-hidden="true"></i>
            <span>{{ line }}</span>
          </div>
        }

        <div class="rx-card__nutrition" aria-label="Today's nutrition targets">
          <div class="rx-stat">
            <span class="rx-stat__num">{{ p.nutrition.carbsG }}</span>
            <span class="rx-stat__unit">g carbs</span>
          </div>
          <div class="rx-stat">
            <span class="rx-stat__num">{{ p.nutrition.proteinG }}</span>
            <span class="rx-stat__unit">g protein</span>
          </div>
          <div class="rx-stat">
            <span class="rx-stat__num">{{ p.nutrition.hydrationL }}</span>
            <span class="rx-stat__unit">L water</span>
          </div>
        </div>

        <p class="rx-card__nutrition-rationale">{{ p.nutrition.rationale }}</p>
      </article>
    }
  `,
  styleUrl: "./today-prescription-card.component.scss",
})
export class TodayPrescriptionCardComponent {
  readonly prescription = input.required<DailyPrescription | null>();

  readonly visual = computed<IntentVisual>(() => {
    const p = this.prescription();
    if (!p) {
      return INTENT_VISUALS.rest;
    }
    return INTENT_VISUALS[p.intent];
  });

  readonly headline = computed<string>(() => {
    const p = this.prescription();
    if (!p) {
      return "";
    }
    if (p.intent === "rest") {
      return "Rest today.";
    }
    if (p.intent === "competition") {
      return "It's game day.";
    }
    if (p.intent === "taper-prime") {
      const hours = p.hoursUntilNextEvent ?? 0;
      if (hours <= 12) {
        return `Game in ${Math.max(1, Math.round(hours))} hours.`;
      }
      return "Game tomorrow.";
    }
    if (p.intent === "recovery") {
      return "Recover today.";
    }
    return p.intentLabel + ".";
  });

  readonly volumeLine = computed<string | null>(() => {
    const p = this.prescription();
    if (!p) {
      return null;
    }
    const parts: string[] = [];
    if (p.sprintReps > 0) {
      parts.push(`${p.sprintReps} sprint reps`);
    }
    if (p.strengthSets > 0) {
      parts.push(`${p.strengthSets} working sets`);
    }
    if (parts.length === 0) {
      return null;
    }
    return parts.join(" • ");
  });
}
