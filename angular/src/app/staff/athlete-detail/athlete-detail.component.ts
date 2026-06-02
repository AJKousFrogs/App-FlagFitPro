import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { JsonPipe, LowerCasePipe } from "@angular/common";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../../core/services/api.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { staffLaneFor } from "../../core/guards/staff.guard";

type Lane = "coach" | "physio" | "nutrition" | "psych";

interface LaneSpec {
  title: string;
  consent: "performance" | "health";
  url: (id: string) => string;
}

const LANE: Record<Lane, LaneSpec> = {
  coach: { title: "Load & readiness", consent: "performance", url: (id) => `/api/coach?playerId=${id}` },
  physio: { title: "Injuries & return-to-play", consent: "health", url: (id) => `/api/staff-physiotherapist?athleteId=${id}` },
  nutrition: { title: "Nutrition plan", consent: "health", url: (id) => `/api/staff-nutritionist?athleteId=${id}` },
  psych: { title: "Mental wellness", consent: "health", url: (id) => `/api/staff-psychology?athleteId=${id}` },
};

/**
 * Athlete detail (staff) — role-aware. Shows the section relevant to the viewer's
 * lane (coach=performance, physio/nutrition/psych=health), fetched from the staff
 * endpoint. Privacy-first: the server gates every read by consent, so when nothing
 * comes back we show the explicit "hasn't shared / nothing logged" state — never a
 * fabricated value.
 */
@Component({
  selector: "app-athlete-detail",
  standalone: true,
  imports: [JsonPipe, LowerCasePipe, LucideAngularModule],
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
  readonly spec = computed(() => LANE[this.lane()]);

  /** null = loading; [] / {} empty → consent/empty state; truthy → shared data. */
  readonly data = signal<unknown>(null);
  readonly loaded = signal(false);

  constructor() {
    if (this.id) {
      this.api.get(this.spec().url(this.id)).subscribe({
        next: (res) => {
          this.data.set(res?.data ?? null);
          this.loaded.set(true);
        },
        error: () => {
          this.data.set(null);
          this.loaded.set(true);
        },
      });
    } else {
      this.loaded.set(true);
    }
  }

  readonly hasData = computed(() => {
    const d = this.data();
    if (d == null) return false;
    if (Array.isArray(d)) return d.length > 0;
    if (typeof d === "object") return Object.keys(d as object).length > 0;
    return Boolean(d);
  });

  readonly initials = computed(() =>
    this.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
  );
}
