import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { SupabaseService } from "../core/services/supabase.service";

/**
 * Profile — identity + physicals + 30-day training + injuries. Ported 1:1 from
 * redesign/ground-zero/02-hifi/profile.html. Identity/physicals read the signed-in
 * user; the data sections show honest empty states until their feeds are wired.
 */
@Component({
  selector: "app-profile",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./profile.component.html",
})
export class ProfileComponent {
  private readonly supabase = inject(SupabaseService);

  private readonly meta = computed(
    () => (this.supabase.currentUser()?.user_metadata ?? {}) as Record<string, unknown>,
  );

  readonly name = computed(() => ((this.meta()["full_name"] ?? this.meta()["name"] ?? "Athlete") as string).trim() || "Athlete");
  readonly jersey = computed(() => this.meta()["jersey_number"] ?? null);
  readonly position = computed(() => (this.meta()["position"] ?? "") as string);
  readonly heightCm = computed(() => this.num(this.meta()["height_cm"] ?? this.meta()["height"]));
  readonly weightKg = computed(() => this.num(this.meta()["weight_kg"] ?? this.meta()["weight"]));
  readonly age = computed(() => {
    const dob = this.meta()["date_of_birth"] ?? this.meta()["dob"];
    if (!dob) return null;
    const d = new Date(String(dob));
    if (Number.isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / (365.25 * 864e5));
  });

  private num(v: unknown): number | null {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }
}
