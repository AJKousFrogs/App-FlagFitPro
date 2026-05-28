import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

/**
 * Root shell — minimal during the static-first front-end rebuild.
 *
 * The previous UI layer (shell, nav, screens) was removed. Screen routes are
 * restored incrementally in Phase E as components are rebuilt from the approved
 * static design. The business engine (services, schedule spine, Supabase data
 * flows) is intact and available to the rebuilt screens.
 */
@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="rebuild-shell">
      <section class="rebuild-shell__card">
        <span class="rebuild-shell__badge">FlagFit Pro</span>
        <h1>Front end rebuild in progress</h1>
        <p>
          The UI is being rebuilt from the ground up. The engine — data,
          services, schedule spine — is intact.
        </p>
      </section>
      <router-outlet />
    </main>
  `,
  styles: [
    `
      .rebuild-shell {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: #08090b;
        color: #f5f6f7;
        font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
      }
      .rebuild-shell__card {
        max-width: 32rem;
        text-align: center;
      }
      .rebuild-shell__badge {
        display: inline-block;
        font-family: "Space Grotesk", system-ui, sans-serif;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: #00e07a;
        margin-bottom: 16px;
      }
      h1 {
        font-family: "Space Grotesk", system-ui, sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 12px;
      }
      p {
        color: #b8bcc4;
        line-height: 1.5;
        margin: 0;
      }
    `,
  ],
})
export class AppComponent {}
