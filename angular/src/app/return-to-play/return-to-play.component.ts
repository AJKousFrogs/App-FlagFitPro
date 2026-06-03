import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";

interface RtpProtocol {
  id: string;
  injuryType: string;
  injuryLocation: string;
  severity: string;
  startDate: string;
  targetReturnDate: string;
  currentStage: number;
  daysInRecovery: number;
  daysInCurrentStage: number;
  progressPercentage: number;
  criteriaCompleted: boolean[];
  medicalNotes: string;
}
interface Checkin {
  id: string;
  date: string;
  painLevel: number;
  confidenceLevel: number;
  notes: string;
}

/** The seven-stage graded return-to-sport continuum (athlete-friendly labels). */
const STAGES = [
  "Rest & protect",
  "Pain-free movement",
  "Light aerobic",
  "Strength & loading",
  "Sport-specific drills",
  "Non-contact training",
  "Full return",
];

/**
 * Return to play (athlete) — the read side of the physio's rehab work, plus
 * self-report check-ins. GET /api/return-to-play returns the athlete's active
 * protocol (stage of 7, progress, days, target date, physio notes) + check-ins;
 * the athlete logs how they feel via POST /api/return-to-play/checkin
 * (pain + confidence + note). Advancing a stage is a clinical decision made by
 * the physio, so it is deliberately NOT exposed here — this screen reports and
 * self-monitors, it doesn't self-clear. Honest empty state when no protocol.
 */
@Component({
  selector: "app-return-to-play",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./return-to-play.component.html",
  styles: [
    `
      .bar { height: 8px; border-radius: var(--r-pill); background: var(--surface-2); overflow: hidden; }
      .bar > i { display: block; height: 100%; background: var(--accent); border-radius: var(--r-pill); }
      .steps { display: flex; flex-direction: column; gap: 0; }
      .step { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-2) 0; }
      .step .pip { width: 22px; height: 22px; border-radius: var(--r-pill); flex: 0 0 auto;
        display: grid; place-items: center; font-size: var(--fs-xs); font-weight: var(--fw-bold);
        background: var(--surface-2); color: var(--text-faint); border: 1px solid var(--border-soft); }
      .step.done .pip { background: var(--good-soft); color: var(--good); border-color: transparent; }
      .step.now .pip { background: var(--accent); color: var(--on-accent); border-color: transparent; }
      .step .lbl { font-size: var(--fs-sm); color: var(--text-muted); }
      .step.now .lbl { color: var(--text-strong); font-weight: var(--fw-bold); }
      .ci-note { width: 100%; background: var(--surface-2); border: 1px solid var(--border-soft);
        border-radius: var(--r-sm); padding: var(--s-3) var(--s-3); color: var(--text-strong); font-family: var(--font-body); }
    `,
  ],
})
export class ReturnToPlayComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  readonly loaded = signal(false);
  readonly protocol = signal<RtpProtocol | null>(null);
  readonly checkins = signal<Checkin[]>([]);

  readonly stages = STAGES;
  readonly totalStages = STAGES.length;

  // check-in form
  readonly pain = signal(2);
  readonly confidence = signal(7);
  readonly note = signal("");
  readonly busy = signal(false);
  readonly toast = signal<string | null>(null);

  constructor() {
    this.fetch();
  }

  private fetch(): void {
    this.api.get<{ activeProtocol: RtpProtocol | null; checkins: Checkin[] }>("/api/return-to-play").subscribe({
      next: (res) => {
        const d = extractApiPayload<{ activeProtocol: RtpProtocol | null; checkins: Checkin[] }>(res) ?? {
          activeProtocol: null,
          checkins: [],
        };
        this.protocol.set(d.activeProtocol ?? null);
        this.checkins.set(Array.isArray(d.checkins) ? d.checkins : []);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  stageName(stage: number): string {
    return STAGES[stage - 1] ?? `Stage ${stage}`;
  }
  readonly severityBand = computed(() => {
    const s = (this.protocol()?.severity ?? "").toLowerCase();
    if (/sever|high|grade ?3/.test(s)) return { label: s || "severe", cls: "danger" };
    if (/moder|medium|grade ?2/.test(s)) return { label: s || "moderate", cls: "caution" };
    return { label: s || "mild", cls: "info" };
  });

  submitCheckin(): void {
    if (this.busy() || !this.protocol()) return;
    this.busy.set(true);
    this.api
      .post("/api/return-to-play/checkin", {
        painLevel: this.pain(),
        confidenceLevel: this.confidence(),
        notes: this.note().trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.note.set("");
          this.toast.set("Check-in logged");
          this.fetch();
        },
        error: (e) => {
          this.busy.set(false);
          this.logger.error("rtp_checkin_failed", e);
          this.toast.set("Couldn't log check-in — try again.");
        },
      });
  }
}
