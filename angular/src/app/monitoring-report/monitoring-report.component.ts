import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from "@angular/core";
import { KeyValuePipe } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import {
  SparklineComponent,
  MarkerRangeComponent,
  InjuryTimelineComponent,
} from "../shared/perf-viz";
import {
  MonitoringReportService,
  MonitoringReport,
} from "../core/services/monitoring-report.service";

// Plain-language translations for a general athlete audience.
const GLOSSARY: Record<string, string> = {
  acwr: "Workload balance — recent load vs. your normal",
  hooper: "Daily wellness score (sleep, stress, energy, soreness)",
  srpe: "Session effort — how hard × how long",
  monotony: "How same-y your week was",
  strain: "Total weekly strain",
  recovery: "Overnight recovery signal from your device",
};

/**
 * ONE role-lens monitoring report. Every section GATES on what the payload
 * contains (the server already shaped it by role), and the charts consume the
 * payload ONLY — no threshold logic lives here.
 */
@Component({
  selector: "app-monitoring-report",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideAngularModule,
    KeyValuePipe,
    SparklineComponent,
    MarkerRangeComponent,
    InjuryTimelineComponent,
  ],
  templateUrl: "./monitoring-report.component.html",
  styleUrl: "./monitoring-report.component.scss",
})
export class MonitoringReportComponent {
  private readonly svc = inject(MonitoringReportService);
  private readonly route = inject(ActivatedRoute);

  readonly report = signal<MonitoringReport | null>(null);
  readonly loading = signal(true);
  readonly glossary = GLOSSARY;

  constructor() {
    const id = this.route.snapshot.paramMap.get("id") ?? undefined;
    this.svc.get(id).subscribe((r) => {
      this.report.set(r);
      this.loading.set(false);
    });
  }

  // Role lens = the default section emphasis (head_coach: readiness; sc_coach:
  // load; physio: clinical). Purely presentational; the payload is the gate.
  lens(): "clinical" | "load" | "readiness" | "self" {
    const role = this.report()?.meta.requesterRole;
    if (role === "physio") return "clinical";
    if (role === "sc_coach") return "load";
    if (role === "head_coach") return "readiness";
    return "self";
  }

  // Colour is NEVER the only signal — every flag also has a shape token + label.
  flagTone(flag: string | null | undefined): "good" | "watch" | "bad" | "none" {
    if (!flag) return "none";
    if (
      ["ok", "normal", "safe", "cleared", "sufficient", "green"].includes(flag)
    )
      return "good";
    if (["watch", "caution", "insufficient", "amber"].includes(flag))
      return "watch";
    if (
      ["high", "low", "elevated", "flagged", "deficient", "red"].includes(flag)
    )
      return "bad";
    return "none";
  }
  flagShape(flag: string | null | undefined): string {
    const tone = this.flagTone(flag);
    return tone === "good"
      ? "check"
      : tone === "watch"
        ? "alert-triangle"
        : tone === "bad"
          ? "circle-alert"
          : "circle";
  }

  // ACWR position on a 0.5–2.0 scale for the shaded-band gauge (payload value).
  acwrPct(value: number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    const clamped = Math.max(0.5, Math.min(2.0, value));
    return ((clamped - 0.5) / 1.5) * 100;
  }
  bandLeftPct(low: number | undefined): number {
    return low === undefined ? 20 : ((low - 0.5) / 1.5) * 100;
  }
  bandWidthPct(low: number | undefined, high: number | undefined): number {
    if (low === undefined || high === undefined) return 33;
    return ((high - low) / 1.5) * 100;
  }

  /** Daily Hooper-index series (chronological) for the premium sparkline. */
  hooperSeries(): number[] {
    return (this.report()?.daily.series ?? [])
      .map((p) => p.hooperIndex)
      .filter((v): v is number => v !== null && v !== undefined);
  }

  restrictionsText(): string {
    return (this.report()?.physioBlock?.restrictions ?? []).join(", ");
  }
}
