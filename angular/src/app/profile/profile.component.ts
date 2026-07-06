import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AvatarComponent } from "../shared/avatar.component";

import { SupabaseService } from "../core/services/supabase.service";
import { ApiService } from "../core/services/api.service";
import { IdentityService } from "../core/services/identity.service";

interface Injury {
  type?: string;
  severity?: string;
  status?: string;
  start_date?: string;
  description?: string;
}
interface Profile {
  heightCm?: number | null;
  weightKg?: number | null;
  birthDate?: string | null;
  position?: string | null;
  trainingFrequency?: number | null;
  typicalDuration?: number | null;
  avgIntensity?: string | number | null;
  injuries?: Injury[];
}

/**
 * Profile — identity + physicals + 30-day training + injuries. Ported 1:1 from
 * redesign/ground-zero/02-hifi/profile.html and wired to GET /api/user-profile
 * (physicals, trainingFrequency/typicalDuration/avgIntensity, injuries).
 * Identity name/jersey come from the signed-in user; honest empty states when a
 * field is absent. Server-canonical.
 */
@Component({
  selector: "app-profile",
  standalone: true,
  imports: [AvatarComponent, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile.component.html",
  styles: [
    `
      .sign-out-btn {
        width: 100%;
        text-align: left;
        cursor: pointer;
        color: var(--danger);
        background: none;
        border: none;
        font: inherit;
        padding: 0;
      }
      .sign-out-btn .inline {
        color: var(--danger);
      }
    `,
  ],
})
export class ProfileComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly api = inject(ApiService);
  private readonly identity = inject(IdentityService);
  private readonly router = inject(Router);

  private readonly profile = signal<Profile | null>(null);
  private readonly meta = computed(
    () =>
      (this.supabase.currentUser()?.user_metadata ?? {}) as Record<
        string,
        unknown
      >,
  );

  constructor() {
    this.api.get<Profile>("/api/user-profile").subscribe({
      next: (res) => this.profile.set(res?.data ?? null),
      error: () => this.profile.set(null),
    });
  }

  readonly name = this.identity.displayName;
  readonly jersey = this.identity.jersey;
  readonly teamName = this.identity.teamName;
  readonly position = computed(
    () => this.profile()?.position || this.identity.position(),
  );

  readonly heightCm = computed(() =>
    this.num(
      this.profile()?.heightCm ??
        this.meta()["height_cm"] ??
        this.meta()["height"],
    ),
  );
  readonly weightKg = computed(() =>
    this.num(
      this.profile()?.weightKg ??
        this.meta()["weight_kg"] ??
        this.meta()["weight"],
    ),
  );
  readonly age = computed(() => {
    const dob =
      this.profile()?.birthDate ??
      this.meta()["date_of_birth"] ??
      this.meta()["dob"];
    if (!dob) return null;
    const d = new Date(String(dob));
    if (Number.isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / (365.25 * 864e5));
  });

  readonly sessionsPerWk = computed(() =>
    this.num(this.profile()?.trainingFrequency),
  );
  readonly avgMin = computed(() => this.num(this.profile()?.typicalDuration));
  readonly avgRpe = computed(() => {
    const v = this.profile()?.avgIntensity;
    return v == null ? null : Number(v);
  });
  readonly injuries = computed(() => this.profile()?.injuries ?? []);

  injuryBand(status?: string): string {
    const s = (status ?? "").toLowerCase();
    if (/(active|acute|out)/.test(s)) return "danger";
    if (/(recover|rehab|return)/.test(s)) return "caution";
    return "neutral";
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.router.navigateByUrl("/login");
  }

  private num(v: unknown): number | null {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }
}
