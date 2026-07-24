import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../../core/services/api.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";

type Framing = "own" | "sharp" | "recovery";
type SeasonPhase =
  | "accumulation"
  | "transition"
  | "taper"
  | "competition"
  | "off_season";

const DEFAULT_MINUTES: Record<Framing, number> = {
  own: 90,
  sharp: 60,
  recovery: 30,
};

interface PlanDrill {
  id: string;
  name: string;
  description: string | null;
}

interface PlanBlock {
  key: string;
  title: string;
  role: string;
  minutes: number;
  highCns: boolean;
  waterBreakAfter: boolean;
  drills: PlanDrill[];
}

interface PracticePlanResponse {
  teamId: string;
  date: string;
  planKey: string;
  framing: Framing;
  totalMinutes: number;
  blocks: PlanBlock[];
  drillMinutes: number;
  scrimmageMinutes: number;
  highCnsMinutes: number;
  notes: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Team practice plan (coach-facing) — closes the "team-practice-plan.js has no
 * Angular caller" gap (docs/SOURCE_OF_TRUTH.md §4a/§4b, 2026-07-24/25).
 *
 * This is a thin caller over an endpoint that already does all the real work:
 * `buildPracticePlan`/`fetchPlanDrills` (netlify/functions/utils/team-practice-plan.js)
 * decide the block shapes and pull drills — this component never re-derives any
 * of that (CLAUDE.md §4). `framing`/`daysOut`/`seasonPhase` are the coach's own
 * read of where the team is in its season; the endpoint's docstring is explicit
 * that deriving those automatically is the periodization INTENT engine's job,
 * which has no team-level (as opposed to per-athlete) implementation today — so
 * this form asks the coach directly rather than guessing.
 */
@Component({
  selector: "app-practice-plan",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: "./practice-plan.component.html",
  styleUrl: "./practice-plan.component.scss",
})
export class PracticePlanComponent {
  private readonly api = inject(ApiService);
  private readonly membership = inject(TeamMembershipService);

  readonly teamName = this.membership.teamName;

  readonly date = signal(todayIso());
  readonly framing = signal<Framing>("own");
  readonly minutes = signal<number | null>(null);
  readonly daysOut = signal<number | null>(null);
  readonly seasonPhase = signal<SeasonPhase | "">("");

  readonly generating = signal(false);
  readonly error = signal<string | null>(null);
  readonly plan = signal<PracticePlanResponse | null>(null);

  readonly minutesPlaceholder = computed(
    () => `${DEFAULT_MINUTES[this.framing()]} (default)`,
  );

  async generate(): Promise<void> {
    const teamId = this.membership.teamId();
    if (!teamId) {
      this.error.set("No active team on your account.");
      return;
    }
    this.generating.set(true);
    this.error.set(null);
    try {
      const body: Record<string, unknown> = {
        teamId,
        date: this.date() || undefined,
        framing: this.framing(),
      };
      if (this.minutes() != null) body["minutes"] = this.minutes();
      if (this.daysOut() != null) body["daysOut"] = this.daysOut();
      if (this.seasonPhase()) body["seasonPhase"] = this.seasonPhase();

      const res = await firstValueFrom(
        this.api.post<PracticePlanResponse>("/api/team-practice-plan", body),
      );
      const data = extractApiPayload<PracticePlanResponse>(res);
      if (!data) {
        throw new Error("Could not build a practice plan");
      }
      this.plan.set(data);
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : "Could not build a practice plan",
      );
      this.plan.set(null);
    } finally {
      this.generating.set(false);
    }
  }

  roleLabel(role: string): string {
    switch (role) {
      case "warmup":
        return "Warm-up";
      case "indy":
        return "Individual/position";
      case "integration":
        return "Integration (7-on-7)";
      case "team":
        return "Team (5v5)";
      case "specialty":
        return "Specialty group";
      case "cooldown":
        return "Cool-down";
      default:
        return role;
    }
  }
}
