import { Injectable, computed, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { TeamMembershipService } from "./team-membership.service";

/**
 * Identity — the single source for the signed-in athlete's display identity
 * (name, initials, avatar, jersey, position, team). Name/avatar from the auth
 * user; jersey/position/team from the team membership. Used by the topbar avatar
 * and the identity banners so the app is correct for ANY user — not a hardcoded
 * persona.
 */
@Injectable({ providedIn: "root" })
export class IdentityService {
  private readonly supabase = inject(SupabaseService);
  private readonly membership = inject(TeamMembershipService);

  constructor() {
    this.membership.loadMembership().catch(() => null);
  }

  private readonly meta = computed(
    () => (this.supabase.currentUser()?.user_metadata ?? {}) as Record<string, unknown>,
  );

  readonly displayName = computed(
    () => ((this.meta()["full_name"] ?? this.meta()["name"] ?? "") as string).trim() || "Athlete",
  );
  readonly firstName = computed(() => this.displayName().split(/\s+/)[0]);
  readonly initials = computed(() =>
    this.displayName().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
  );
  readonly avatarUrl = computed(
    () => (this.meta()["avatar_url"] ?? this.meta()["avatarUrl"] ?? null) as string | null,
  );
  readonly jersey = computed(
    () => this.membership.jerseyNumber() ?? (this.meta()["jersey_number"] as number | undefined) ?? null,
  );
  readonly position = computed(
    () => this.membership.position() ?? ((this.meta()["position"] as string | undefined) ?? ""),
  );
  readonly teamName = this.membership.teamName;
}
