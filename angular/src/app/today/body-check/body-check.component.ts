import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";

import {
  InjuryService,
  InjurySeverity,
} from "../../core/services/injury.service";
import { ReadinessService } from "../../core/services/readiness.service";
import { LoggerService } from "../../core/services/logger.service";

interface BcPart {
  label: string;
  group: "Lower body" | "Trunk" | "Upper body";
  /** Canonical region sent to /api/athlete-injuries — must hit the server's
   *  region sets (athlete-injuries.js) so the right restrictions derive. */
  region: string;
}
const BODY_PARTS: BcPart[] = [
  ...(
    [
      ["Hamstring", "hamstring"],
      ["Quadriceps", "quadriceps"],
      ["Groin / adductor", "groin"],
      ["Hip flexor", "hip flexor"],
      ["Glute", "glute"],
      ["Knee", "knee"],
      ["Calf", "calf"],
      ["Soleus", "soleus"],
      ["Achilles", "achilles"],
      ["Ankle", "ankle"],
      ["Shin", "shin"],
      ["Foot / plantar", "plantar"],
    ] as const
  ).map(([label, region]) => ({
    label,
    region,
    group: "Lower body" as const,
  })),
  ...(
    [
      ["Lower back", "lower back"],
      ["Upper back / neck", "neck"],
      ["Core / abs", "core"],
    ] as const
  ).map(([label, region]) => ({ label, region, group: "Trunk" as const })),
  ...(
    [
      ["Shoulder", "shoulder"],
      ["Elbow", "elbow"],
      ["Wrist / hand", "wrist"],
      ["Fingers", "finger"],
      ["Other", "other"],
    ] as const
  ).map(([label, region]) => ({
    label,
    region,
    group: "Upper body" as const,
  })),
];

/** Body-check severity → athlete_injuries severity (drives restriction depth
 *  and the self-report auto-expiry: minor 2d / moderate 4d / severe 7d). */
const BC_SEVERITY: Record<string, InjurySeverity> = {
  mild: "minor",
  moderate: "moderate",
  sharp: "severe",
};

/**
 * Body check — the 10-second "any niggles?" card on Today.
 *
 * Extracted verbatim from today.component.ts (2026-07-19), which had grown to
 * 772 lines across 14 sections. Logic is byte-for-byte the same; only the
 * dependencies moved (InjuryService / ReadinessService / LoggerService are now
 * injected here instead of by Today, which no longer needs InjuryService at
 * all).
 *
 * SOT Law #7 lives in this state machine: "Logged" is shown ONLY after the
 * writes actually landed in `athlete_injuries`. This card previously asserted
 * the report was saved and surfaced to staff while persisting nothing at all —
 * that trust bug is what `bodyLogState` closes, so any change here needs to
 * keep the saving → saved transition strictly after the awaited writes.
 */
@Component({
  selector: "app-body-check",
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./body-check.component.html",
  styleUrl: "./body-check.component.scss",
})
export class BodyCheckComponent {
  private readonly injurySvc = inject(InjuryService);
  private readonly readinessSvc = inject(ReadinessService);
  private readonly logger = inject(LoggerService);

  readonly bodyGroups = ["Lower body", "Trunk", "Upper body"] as const;
  partsFor(group: string): BcPart[] {
    return BODY_PARTS.filter((p) => p.group === group);
  }
  private readonly selectedParts = signal<Set<string>>(new Set());
  private readonly severity = signal<string | null>(null);
  private readonly noneClear = signal(false);

  isPartOn = (label: string): boolean => this.selectedParts().has(label);
  isSev = (sev: string): boolean => this.severity() === sev;
  isNoneOn = (): boolean => this.noneClear();
  readonly hasFlags = computed(() => this.selectedParts().size > 0);

  togglePart(label: string): void {
    this.selectedParts.update((s) => {
      const next = new Set(s);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
    this.noneClear.set(false);
    this.bodyLogState.set("idle");
    if (this.selectedParts().size === 0) this.severity.set(null);
  }
  setSeverity(sev: string): void {
    this.severity.set(sev);
    this.bodyLogState.set("idle");
  }
  clearBody(): void {
    this.selectedParts.set(new Set());
    this.severity.set(null);
    this.noneClear.set(true);
    this.bodyLogState.set("idle");
  }

  // Body-check submit state. "Logged" is only ever shown after the writes
  // actually landed in athlete_injuries (SOT Law 7 — no fabricated UI claims;
  // this card previously asserted the report was saved and surfaced to staff
  // while persisting nothing at all — the trust bug this state machine closes).
  readonly bodyLogState = signal<"idle" | "saving" | "saved" | "error">("idle");
  private readonly loggedSummary = signal<{ list: string; sev: string }>({
    list: "",
    sev: "mild",
  });

  readonly canLogBody = computed(
    () =>
      this.hasFlags() &&
      this.severity() !== null &&
      this.bodyLogState() !== "saving",
  );

  /** Persist every flagged region as a self-reported tightness (the same
   *  athlete_injuries path as the Wellness reporter), then refresh readiness —
   *  the plan reacts through InjuryService's restrictions signal. */
  async logBody(): Promise<void> {
    const parts = BODY_PARTS.filter((p) => this.selectedParts().has(p.label));
    const sev = this.severity();
    if (parts.length === 0 || !sev || this.bodyLogState() === "saving") return;
    const severity = BC_SEVERITY[sev] ?? "minor";
    this.bodyLogState.set("saving");
    try {
      for (const p of parts) {
        await this.injurySvc.report(p.region, severity);
      }
      this.readinessSvc.calculateToday().subscribe({ error: () => undefined });
      this.loggedSummary.set({
        list: parts.map((p) => p.label).join(", "),
        sev,
      });
      this.selectedParts.set(new Set());
      this.severity.set(null);
      this.bodyLogState.set("saved");
    } catch (err) {
      this.logger.error("body_check_log_failed", err);
      this.bodyLogState.set("error");
    }
  }

  readonly bodyMsg = computed<{ text: string; cls: string } | null>(() => {
    const state = this.bodyLogState();
    if (state === "saving") return { text: "Logging…", cls: "" };
    if (state === "error")
      return { text: "Couldn't log that — try again.", cls: "is-danger" };
    if (state === "saved") {
      const { list, sev } = this.loggedSummary();
      if (sev === "mild")
        return {
          text: `Logged: ${list} · mild — sprint/high-intensity work comes off that area; auto-clears in 2 days.`,
          cls: "",
        };
      if (sev === "moderate")
        return {
          text: `Logged: ${list} · moderate — easy session only while it settles (~4 days); visible to your coaching staff.`,
          cls: "is-warn",
        };
      return {
        text: `Logged: ${list} · sharp — recovery only, don't train through this; visible to your coaching staff. If it persists, see your physio.`,
        cls: "is-danger",
      };
    }
    if (this.noneClear()) {
      return { text: "All clear — nothing flagged today.", cls: "" };
    }
    const on = [...this.selectedParts()];
    if (on.length === 0) return null;
    const list = on.join(", ");
    if (!this.severity())
      return {
        text: `Selected: ${list} — pick severity, then log it.`,
        cls: "",
      };
    return {
      text: `Ready: ${list} — tap “Log it” and today's plan works around it.`,
      cls: "",
    };
  });
}
