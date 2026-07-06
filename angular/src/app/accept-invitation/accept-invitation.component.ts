import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";

/**
 * Accept-invitation — entry point for a team invite link. Rebuilt in the current
 * design system. Without a token the page shows the invalid-link state.
 */
@Component({
  selector: "app-accept-invitation",
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        max-width: 480px;
        margin: 0 auto;
        min-height: 100dvh;
      }
    `,
  ],
  template: `
    <main class="screen" style="padding-top:var(--s-5)">
      <h1>Team invitation</h1>
      @if (!token()) {
        <p class="note" style="color:var(--danger)">
          Invalid invitation link. It may have expired or already been used.
        </p>
        <a
          routerLink="/login"
          class="btn primary block"
          style="margin-top:var(--s-3)"
          >Go to sign in</a
        >
      } @else {
        <p class="muted">Accepting your invitation…</p>
        <a
          routerLink="/onboarding"
          class="btn primary block"
          style="margin-top:var(--s-3)"
          >Continue</a
        >
      }
    </main>
  `,
})
export class AcceptInvitationComponent {
  private readonly route = inject(ActivatedRoute);
  readonly token = signal<string | null>(
    this.route.snapshot.queryParamMap.get("token"),
  );
}
