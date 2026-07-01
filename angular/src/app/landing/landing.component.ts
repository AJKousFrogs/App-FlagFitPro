import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
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
  imports: [FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./landing.component.html",
  styles: [
    `
      :host { display: block; max-width: 480px; margin: 0 auto; min-height: 100dvh; }
      .brand { font-family: var(--font-display); font-weight: var(--fw-bold); }
      /* Hero wordmark — a deliberate one-off larger than the --fs-display token (32px). */
      .ovr-title { font-size: 52px; letter-spacing: -0.02em; }
      .signin input { width: 100%; background: var(--surface-2); border: 1px solid var(--border-soft);
        border-radius: var(--r-sm); padding: var(--s-3) var(--s-3); color: var(--text-strong); font-family: var(--font-body); margin-top: var(--s-2); }
    `,
  ],
})
export class LandingComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly membership = inject(TeamMembershipService);
  private readonly route = inject(ActivatedRoute);

  readonly showSignIn = signal(false);
  readonly showSignUp = signal(false);
  readonly email = signal("");
  readonly password = signal("");
  // sign-up only
  readonly fullName = signal("");
  readonly confirmPassword = signal("");
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    // /login is the sign-in surface (vs /landing's marketing CTA); the authGuard
    // also redirects unauthenticated users here with ?returnUrl=… . Reveal the
    // sign-in form immediately in both cases.
    const onLoginRoute = this.route.snapshot.routeConfig?.path === "login";
    if (onLoginRoute || this.route.snapshot.queryParamMap.has("returnUrl")) {
      this.showSignIn.set(true);
    }
  }

  showSignUpForm(): void {
    this.showSignUp.set(true);
    this.showSignIn.set(false);
    this.error.set(null);
  }

  async submitSignUp(): Promise<void> {
    if (this.busy()) return;
    const name = this.fullName().trim();
    const email = this.email().trim();
    const pwd = this.password();
    const pwd2 = this.confirmPassword();
    if (!name) { this.error.set("Please enter your name."); return; }
    if (!email) { this.error.set("Please enter your email."); return; }
    if (pwd.length < 8) { this.error.set("Password must be at least 8 characters."); return; }
    if (pwd !== pwd2) { this.error.set("Passwords don't match."); return; }

    this.busy.set(true);
    this.error.set(null);
    try {
      const { data, error } = await this.supabase.signUp(email, pwd, { fullName: name });
      if (error) {
        this.error.set(error.message ?? "Sign-up failed");
        return;
      }
      if (data?.session) {
        // Auto-confirmed → go straight to onboarding
        await this.router.navigateByUrl("/onboarding");
      } else {
        // Email verification required — pass email via query param so the verify page
        // can show the address and offer a resend without needing an active session.
        await this.router.navigateByUrl(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (e) {
      this.logger.error("signup_failed", e);
      this.error.set("Sign-up failed — try again.");
    } finally {
      this.busy.set(false);
    }
  }

  async submitSignIn(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const { error } = await this.supabase.signIn(this.email().trim(), this.password());
      if (error) {
        this.error.set(error.message ?? "Sign-in failed");
      } else {
        // Staff land on the staff track; athletes on the athlete app — unless the
        // authGuard bounced them here from a deep link (returnUrl), in which case
        // honour it so the original destination is restored after login.
        await this.membership.loadMembership(true).catch(() => null);
        const roleDest = staffLaneFor(this.membership.role()) ? "/staff" : "/today";
        const returnUrl = this.route.snapshot.queryParamMap.get("returnUrl");
        const dest = returnUrl && returnUrl.startsWith("/") ? returnUrl : roleDest;
        await this.router.navigateByUrl(dest);
      }
    } catch (e) {
      this.logger.error("signin_failed", e);
      this.error.set("Sign-in failed");
    } finally {
      this.busy.set(false);
    }
  }
}
