import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../../core/services/api.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { staffLaneFor } from "../../core/guards/staff.guard";

type Lane = "coach" | "physio" | "nutrition" | "psych";

interface Injury {
  injury_type?: string; injury_location?: string; injury_grade?: string;
  recovery_status?: string; current_phase?: string; rtp_progress?: number;
  injury_date?: string; expected_return_date?: string | null;
}
interface BodyTrend { date?: string; weight?: number; bodyFat?: number; leanMass?: number; }
interface MentalLog { log_date?: string; mental_readiness_score?: number; }
interface WellnessPt { date?: string; mood?: number; stress_level?: number; sleep_quality?: number; }

const TITLE: Record<Lane, string> = {
  coach: "Load & readiness", physio: "Injuries & return-to-play",
  nutrition: "Body composition", psych: "Mental wellness",
};
const CONSENT: Record<Lane, "performance" | "health"> = {
  coach: "performance", physio: "health", nutrition: "health", psych: "health",
};

/**
 * Athlete detail (staff) — role-aware, wired to the real per-athlete staff endpoints.
 * Privacy-first: a 403 / empty payload renders the explicit "Not shared" state,
 * never a fabricated value. Coach metrics come from the team feed (passed via state)
 * since coach-core has no per-athlete route.
 */
@Component({
  selector: "app-athlete-detail",
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./athlete-detail.component.html",
})
export class AthleteDetailComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly membership = inject(TeamMembershipService);

  readonly id = this.route.snapshot.paramMap.get("id") ?? "";
  private readonly nav = (inject(Router).getCurrentNavigation()?.extras.state ?? history.state ?? {}) as Record<string, unknown>;
  readonly name = (this.nav["name"] as string) || "Athlete";
  readonly jersey = (this.nav["jersey"] as number | null) ?? null;
  readonly position = (this.nav["position"] as string) || "";

  readonly lane = computed<Lane>(() => (staffLaneFor(this.membership.role()) ?? "coach") as Lane);
  readonly title = computed(() => TITLE[this.lane()]);
  readonly consent = computed(() => CONSENT[this.lane()]);

  // coach (from team feed via state)
  readonly coachShared = (this.nav["shared"] as boolean) ?? false;
  readonly acwr = (this.nav["acwr"] as number | null) ?? null;
  readonly readiness = (this.nav["readiness"] as number | null) ?? null;

  // clinical lanes (fetched)
  readonly loaded = signal(false);
  readonly injuries = signal<Injury[]>([]);
  readonly rtpPhase = signal<string | null>(null);
  readonly body = signal<BodyTrend[]>([]);
  readonly mental = signal<MentalLog[]>([]);
  readonly wellness = signal<WellnessPt[]>([]);

  constructor() {
    const lane = this.lane();
    if (lane === "coach" || !this.id) {
      this.loaded.set(true);
      return;
    }
    const url =
      lane === "physio" ? `/api/staff-physiotherapist/athletes/${this.id}` :
      lane === "nutrition" ? `/api/staff-nutritionist/athletes/${this.id}/trends` :
      `/api/staff-psychology/athletes/${this.id}`;
    this.api.get<Record<string, unknown>>(url).subscribe({
      next: (res) => {
        const d = (res?.data ?? {}) as Record<string, unknown>;
        if (lane === "physio") {
          this.injuries.set((d["activeInjuries"] as Injury[]) ?? []);
          const proto = (d["rehabProtocol"] as { phase_number?: number }[] | null) ?? null;
          this.rtpPhase.set(proto?.[0]?.phase_number != null ? `Phase ${proto[0].phase_number}` : null);
        } else if (lane === "nutrition") {
          this.body.set((d["trends"] as BodyTrend[]) ?? []);
        } else {
          this.mental.set((d["mentalLogs"] as MentalLog[]) ?? []);
          this.wellness.set((d["wellness"] as WellnessPt[]) ?? []);
        }
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true), // 403 / no consent → empty → "not shared"
    });
  }

  readonly hasData = computed(() => {
    switch (this.lane()) {
      case "coach": return this.coachShared;
      case "physio": return this.injuries().length > 0;
      case "nutrition": return this.body().length > 0;
      case "psych": return this.mental().length > 0 || this.wellness().length > 0;
    }
  });

  readonly latestBody = computed(() => this.body().at(-1) ?? null);
  readonly latestWellness = computed(() => this.wellness().at(-1) ?? null);
  readonly latestMental = computed(() => this.mental().at(-1)?.mental_readiness_score ?? null);

  readonly acwrBand = computed(() => {
    const r = this.acwr;
    if (r == null) return null;
    const v = r.toFixed(2);
    if (r > 1.5) return { label: `${v} · danger`, cls: "danger" };
    if (r > 1.3) return { label: `${v} · elevated`, cls: "caution" };
    if (r < 0.8) return { label: `${v} · under`, cls: "caution" };
    return { label: `${v} · sweet spot`, cls: "good" };
  });
  readonly readyBand = computed(() => {
    const s = this.readiness;
    if (s == null) return null;
    const v = Math.round(s);
    const cls = v < 55 ? "danger" : v <= 75 ? "info" : "good";
    const word = v < 55 ? "deload" : v <= 75 ? "maintain" : "push";
    return { label: `${v} · ${word}`, cls };
  });
  injuryBand(status?: string): string {
    const s = (status ?? "").toLowerCase();
    if (/(active|acute)/.test(s)) return "danger";
    if (/(recover|rehab|return)/.test(s)) return "caution";
    return "neutral";
  }
  readonly initials = computed(() =>
    this.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
  );
}
