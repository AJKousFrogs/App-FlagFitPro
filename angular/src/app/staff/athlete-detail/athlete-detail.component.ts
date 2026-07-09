import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../../core/services/api.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { LoggerService } from "../../core/services/logger.service";
import { staffLaneFor } from "../../core/guards/staff.guard";
import {
  ExternalLoadService,
  ExternalLoadMetric,
} from "../../core/services/external-load.service";
import {
  BloodworkService,
  BloodworkPanel,
} from "../../core/services/bloodwork.service";

type Lane = "coach" | "physio" | "nutrition" | "psych";

interface Injury {
  id?: string;
  injury_type?: string;
  injury_location?: string;
  injury_grade?: string;
  recovery_status?: string;
  current_phase?: string;
  rtp_progress?: number;
  injury_date?: string;
  expected_return_date?: string | null;
}
interface BodyTrend {
  date?: string;
  weight?: number;
  bodyFat?: number;
  leanMass?: number;
}
interface MentalLog {
  log_date?: string;
  mental_readiness_score?: number;
}
interface WellnessPt {
  date?: string;
  mood?: number;
  stress_level?: number;
  sleep_quality?: number;
}

const TITLE: Record<Lane, string> = {
  coach: "Load & readiness",
  physio: "Injuries & return-to-play",
  nutrition: "Body composition",
  psych: "Mental wellness",
};
const CONSENT: Record<Lane, "performance" | "health"> = {
  coach: "performance",
  physio: "health",
  nutrition: "health",
  psych: "health",
};
const RTP_PHASES = ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Cleared"];

/**
 * Athlete detail (staff) — role-aware READ + WRITE. Reads the per-athlete staff
 * endpoint (privacy-first "Not shared" when gated/empty); the clinical roles can
 * also act: physio updates RTP / logs an injury, nutritionist generates a report,
 * psychologist logs an assessment. Coach metrics arrive via the team feed (state).
 */
@Component({
  selector: "app-athlete-detail",
  imports: [LucideAngularModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./athlete-detail.component.html",
})
export class AthleteDetailComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly membership = inject(TeamMembershipService);
  private readonly logger = inject(LoggerService);
  private readonly externalLoadService = inject(ExternalLoadService);
  private readonly bloodworkService = inject(BloodworkService);

  readonly id = this.route.snapshot.paramMap.get("id") ?? "";
  private readonly nav = (inject(Router).getCurrentNavigation()?.extras.state ??
    history.state ??
    {}) as Record<string, unknown>;
  readonly name = (this.nav["name"] as string) || "Athlete";
  readonly jersey = (this.nav["jersey"] as number | null) ?? null;
  readonly position = (this.nav["position"] as string) || "";

  readonly lane = computed<Lane>(
    () => (staffLaneFor(this.membership.role()) ?? "coach") as Lane,
  );
  readonly title = computed(() => TITLE[this.lane()]);
  readonly consent = computed(() => CONSENT[this.lane()]);
  readonly rtpPhases = RTP_PHASES;

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
  readonly externalLoad = signal<ExternalLoadMetric[]>([]);
  readonly bloodwork = signal<BloodworkPanel[]>([]);

  constructor() {
    const lane = this.lane();
    if (lane === "coach" || !this.id) {
      this.loaded.set(true);
      return;
    }
    this.fetch();
  }

  private fetch(): void {
    const lane = this.lane();
    const url =
      lane === "physio"
        ? `/api/staff-physiotherapist/athletes/${this.id}`
        : lane === "nutrition"
          ? `/api/staff-nutritionist/athletes/${this.id}/trends`
          : `/api/staff-psychology/athletes/${this.id}`;
    this.api.get<Record<string, unknown>>(url).subscribe({
      next: (res) => {
        const d = (res?.data ?? {}) as Record<string, unknown>;
        if (lane === "physio") {
          this.injuries.set((d["activeInjuries"] as Injury[]) ?? []);
          const proto =
            (d["rehabProtocol"] as { phase_number?: number }[] | null) ?? null;
          this.rtpPhase.set(
            proto?.[0]?.phase_number != null
              ? `Phase ${proto[0].phase_number}`
              : null,
          );
          // Monitoring feature: external-load + bloodwork are separate,
          // RLS-gated endpoints (empty unless the athlete has data + the
          // caller is permitted). Failures resolve to [] inside the services.
          this.externalLoadService
            .list(this.id)
            .subscribe((rows) => this.externalLoad.set(rows));
          this.bloodworkService
            .list(this.id)
            .subscribe((panels) => this.bloodwork.set(panels));
        } else if (lane === "nutrition") {
          this.body.set((d["trends"] as BodyTrend[]) ?? []);
        } else {
          this.mental.set((d["mentalLogs"] as MentalLog[]) ?? []);
          this.wellness.set((d["wellness"] as WellnessPt[]) ?? []);
        }
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  readonly hasData = computed(() => {
    switch (this.lane()) {
      case "coach":
        return this.coachShared;
      case "physio":
        return this.injuries().length > 0;
      case "nutrition":
        return this.body().length > 0;
      case "psych":
        return this.mental().length > 0 || this.wellness().length > 0;
    }
  });

  readonly latestBody = computed(() => this.body().at(-1) ?? null);
  readonly latestWellness = computed(() => this.wellness().at(-1) ?? null);
  readonly latestMental = computed(
    () => this.mental().at(-1)?.mental_readiness_score ?? null,
  );

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
    const cls = v < 55 ? "danger" : v <= 75 ? "caution" : "good";
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
    this.name
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
  );

  // ---- WRITE: physio RTP update ----
  readonly editingRtp = signal<string | null>(null);
  readonly rtpProgress = signal(50);
  readonly rtpNewPhase = signal("Phase 1");
  readonly rtpNotes = signal("");
  readonly busy = signal(false);
  readonly toast = signal<string | null>(null);
  readonly toastError = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  openRtp(inj: Injury): void {
    this.editingRtp.set(inj.id ?? null);
    this.rtpProgress.set(inj.rtp_progress ?? 50);
    this.rtpNewPhase.set(inj.current_phase ?? "Phase 1");
    this.rtpNotes.set("");
  }
  saveRtp(): void {
    const injuryId = this.editingRtp();
    if (!injuryId || this.busy()) return;
    this.busy.set(true);
    this.api
      .put(`/api/staff-physiotherapist/rtp/${injuryId}`, {
        progress: this.rtpProgress(),
        phase: this.rtpNewPhase(),
        notes: this.rtpNotes() || undefined,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.editingRtp.set(null);
          this.flash("RTP updated");
          this.fetch();
        },
        error: (e) => {
          this.busy.set(false);
          this.logger.error("rtp_update_failed", e);
          this.flash("Couldn't update RTP", true);
        },
      });
  }

  // ---- WRITE: physio log injury ----
  readonly addingInjury = signal(false);
  readonly injType = signal("");
  readonly injLocation = signal("");
  readonly injGrade = signal("Grade 1");
  readonly grades = ["Grade 1", "Grade 2", "Grade 3"];
  logInjury(): void {
    if (this.busy() || !this.injType().trim() || !this.injLocation().trim())
      return;
    this.busy.set(true);
    this.api
      .post("/api/staff-physiotherapist/injuries", {
        userId: this.id,
        type: this.injType().trim(),
        location: this.injLocation().trim(),
        grade: this.injGrade(),
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.addingInjury.set(false);
          this.injType.set("");
          this.injLocation.set("");
          this.flash("Injury logged");
          this.fetch();
        },
        error: (e) => {
          this.busy.set(false);
          this.logger.error("log_injury_failed", e);
          this.flash("Couldn't log injury", true);
        },
      });
  }

  // ---- WRITE: nutritionist generate report ----
  generateReport(type: "weekly" | "monthly"): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.api
      .post(`/api/staff-nutritionist/reports/${this.id}`, { type })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.flash(`${type} report generated`);
        },
        error: (e) => {
          this.busy.set(false);
          this.logger.error("nutrition_report_failed", e);
          this.flash("Couldn't generate report", true);
        },
      });
  }

  // ---- WRITE: psychologist log assessment ----
  readonly addingAssessment = signal(false);
  readonly asmtType = signal("");
  readonly asmtScore = signal(5);
  readonly asmtNote = signal("");
  readonly asmtReview = signal(false);
  logAssessment(): void {
    if (this.busy() || !this.asmtType().trim()) return;
    this.busy.set(true);
    this.api
      .post("/api/staff-psychology/assessments", {
        athleteId: this.id,
        type: this.asmtType().trim(),
        score: this.asmtScore(),
        interpretation: this.asmtNote() || undefined,
        requiresReview: this.asmtReview(),
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.addingAssessment.set(false);
          this.asmtType.set("");
          this.asmtNote.set("");
          this.flash("Assessment logged");
        },
        error: (e) => {
          this.busy.set(false);
          this.logger.error("assessment_failed", e);
          this.flash("Couldn't log assessment", true);
        },
      });
  }

  private flash(msg: string, isError = false): void {
    this.toast.set(msg);
    this.toastError.set(isError);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 4000);
  }

  cancelRtp(): void {
    this.editingRtp.set(null);
  }
  cancelInjury(): void {
    this.addingInjury.set(false);
    this.injType.set("");
    this.injLocation.set("");
  }
  cancelAssessment(): void {
    this.addingAssessment.set(false);
    this.asmtType.set("");
    this.asmtNote.set("");
  }
}
