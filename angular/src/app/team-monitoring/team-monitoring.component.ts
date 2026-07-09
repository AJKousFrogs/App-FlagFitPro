import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";
import { ApiService } from "../core/services/api.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";

interface Flags {
  wellness: string;
  load: string;
  action: string;
}
interface Row {
  athleteId: string;
  name: string;
  jersey: number | null;
  position?: string;
  consentPending: boolean;
  safetyOverride?: boolean;
  wellness?: {
    sleep: number | null;
    energy: number | null;
    stress: number | null;
    soreness: number | null;
    mood: number | null;
    readiness: number | null;
    date: string | null;
  };
  load?: {
    rpe: number | null;
    durationMin: number | null;
    srpe: number | null;
  };
  acwr?: number | null;
  flags?: Flags;
}
interface Mean {
  sleep: number | null;
  energy: number | null;
  stress: number | null;
  soreness: number | null;
  mood: number | null;
  readiness: number | null;
  rpe: number | null;
  durationMin: number | null;
  srpe: number | null;
  acwr: number | null;
}
interface Payload {
  rows: Row[];
  mean: Mean | null;
  role: string | null;
  teamId: string | null;
  visibleCount?: number;
}

/**
 * Squad monitoring — the coach/physio daily overview: one row per athlete with
 * pre-session wellness, internal load (sRPE), ACWR and readiness flags + an
 * action. Renders ONLY what /api/team-monitoring returns; the endpoint enforces
 * the staff-role gate and the per-athlete consent gate, so a 403 (non-staff) or
 * a consent-pending row is the server's decision, not this component's. Flags
 * carry a text token AND a tone — never colour alone.
 */
@Component({
  selector: "app-team-monitoring",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule, AvatarComponent],
  templateUrl: "./team-monitoring.component.html",
  styleUrl: "./team-monitoring.component.scss",
})
export class TeamMonitoringComponent {
  private readonly api = inject(ApiService);

  readonly loaded = signal(false);
  readonly forbidden = signal(false);
  readonly payload = signal<Payload | null>(null);

  readonly rows = computed(() => this.payload()?.rows ?? []);
  readonly mean = computed(() => this.payload()?.mean ?? null);
  readonly visibleCount = computed(() => this.payload()?.visibleCount ?? 0);
  readonly hasTeam = computed(() => !!this.payload()?.teamId);

  constructor() {
    this.api.get<Payload>("/api/team-monitoring").subscribe({
      next: (res) => {
        this.payload.set(extractApiPayload<Payload>(res) ?? null);
        this.loaded.set(true);
      },
      error: (err: unknown) => {
        // 403 → staff-only; anything else → generic empty.
        const status =
          typeof err === "object" && err !== null && "status" in err
            ? (err as { status?: number }).status
            : undefined;
        this.forbidden.set(status === 403);
        this.loaded.set(true);
      },
    });
  }

  /** Flag tone (colour is always paired with the text token). */
  flagTone(flag: string | undefined): "good" | "watch" | "bad" | "none" {
    if (flag === "OK") return "good";
    if (flag === "WATCH") return "watch";
    if (flag === "HIGH" || flag === "LOW") return "bad";
    return "none";
  }

  num(v: number | null | undefined): string {
    return v === null || v === undefined ? "—" : `${v}`;
  }
}
