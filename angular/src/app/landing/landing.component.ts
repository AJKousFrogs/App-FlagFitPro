import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { SupabaseService } from "../core/services/supabase.service";
import { LoggerService } from "../core/services/logger.service";
import { TeamMembershipService } from "../core/services/team-membership.service";
import { staffLaneFor } from "../core/guards/staff.guard";

/**
 * Landing — the marketing entry + sign-in. Ported 1:1 from
 * redesign/ground-zero/02-hifi/landing.html. "Start now" → onboarding; existing
 * users sign in via SupabaseService.signIn → /today. Top-level route (no app
 * shell). Also serves /login (the authGuard redirect target).
 */
@Component({
  selector: "app-landing",
  standalone: true,
  imports: [RouterLink, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./landing.component.html",
  styles: [
    `
      :host { display: block; max-width: 480px; margin: 0 auto; min-height: 100dvh; }
      .brand { font-family: var(--font-display); font-weight: 700; }
      .signin input { width: 100%; background: var(--surface-2); border: 1px solid var(--border-soft);
        border-radius: var(--r-sm); padding: 11px 12px; color: var(--text-strong); font-family: var(--font-body); margin-top: 8px; }
    `,
  ],
})
export class LandingComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly membership = inject(TeamMembershipService);

  readonly showSignIn = signal(false);
  readonly email = signal("");
  readonly password = signal("");
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async submitSignIn(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const { error } = await this.supabase.signIn(this.email().trim(), this.password());
      if (error) {
        this.error.set(error.message ?? "Sign-in failed");
      } else {
        // Staff land on the staff track; athletes on the athlete app.
        await this.membership.loadMembership(true).catch(() => null);
        const dest = staffLaneFor(this.membership.role()) ? "/staff" : "/today";
        await this.router.navigate([dest]);
      }
    } catch (e) {
      this.logger.error("signin_failed", e);
      this.error.set("Sign-in failed");
    } finally {
      this.busy.set(false);
    }
  }
}
