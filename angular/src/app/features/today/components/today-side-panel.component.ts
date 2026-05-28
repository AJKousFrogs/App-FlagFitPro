import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

/**
 * A personal record entry for the side panel.
 */
export interface PersonalRecordItem {
  name: string;
  value: string;
  delta: string;
  date: string;
}

@Component({
  selector: "app-today-side-panel",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./today-side-panel.component.html",
  styleUrl: "./today-side-panel.component.scss",
})
export class TodaySidePanelComponent {
  // ── Load management card ──
  /** ACWR ratio value, e.g. 1.18. Null if no data yet. */
  readonly acwrRatio = input<number | null>(null);

  /** Risk zone label, e.g. "sweet-spot", "elevated-risk", "danger-zone". */
  readonly acwrRiskZone = input<string>("no-data");

  /** How many days of baseline data have been logged. */
  readonly acwrBaselineDays = input<number>(0);

  /** Maximum baseline days (denominator for progress chip). */
  readonly acwrMaxDays = input<number>(21);

  // ── Personal records card ──
  readonly personalRecords = input<PersonalRecordItem[]>([]);

  // ── Merlin AI card ──
  /** AI insight text. Null hides the card. */
  readonly merlinInsight = input<string | null>(null);

  // ── Outputs ──
  readonly applyMerlinSuggestion = output<void>();
  readonly dismissMerlinSuggestion = output<void>();
  readonly viewAllPRs = output<void>();

  get acwrFormatted(): string {
    const ratio = this.acwrRatio();
    return ratio !== null ? ratio.toFixed(2) : "--";
  }

  get acwrAdvice(): string {
    const zone = this.acwrRiskZone();
    switch (zone) {
      case "sweet-spot":
        return "Sweet spot. Keep load steady.";
      case "under-training":
        return "Under target. Consider increasing volume.";
      case "elevated-risk":
        return "Elevated. Monitor recovery closely.";
      case "danger-zone":
        return "High risk. Reduce load immediately.";
      default:
        return "Building baseline data.";
    }
  }

  get baselineChipLabel(): string {
    return `Day ${this.acwrBaselineDays()} / ${this.acwrMaxDays()}`;
  }

  get baselineChipClass(): string {
    const zone = this.acwrRiskZone();
    if (zone === "sweet-spot" || zone === "under-training") return "chip--success";
    if (zone === "elevated-risk") return "chip--warning";
    if (zone === "danger-zone") return "chip--danger";
    return "";
  }

  /** Returns a CSS class for the PR chip gradient. Index-based alternation. */
  prChipClass(index: number): string {
    return index % 2 === 0 ? "chip--hot" : "chip--ice";
  }
}
