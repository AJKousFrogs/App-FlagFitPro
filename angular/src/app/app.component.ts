import { ChangeDetectionStrategy, Component, OnInit, inject } from "@angular/core";
import { NavigationEnd, NavigationError, Router, RouterOutlet } from "@angular/router";
import { filter } from "rxjs/operators";
import { CookieConsentBannerComponent } from "./shared/components/cookie-consent-banner/cookie-consent-banner.component";
import { LoadingOverlayComponent } from "./shared/components/loading-overlay/loading-overlay.component";
import { SkipToContentComponent } from "./shared/components/skip-to-content/skip-to-content.component";

@Component({
  selector: "app-root",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    SkipToContentComponent,
    CookieConsentBannerComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <app-skip-to-content />
    <main id="main-content" tabindex="-1">
      <router-outlet></router-outlet>
    </main>
    <app-cookie-consent-banner />
    <app-loading-overlay />
  `,
  styleUrl: "./app.component.scss",
})
export class AppComponent implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    // Track navigation events for analytics/debugging
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd || event instanceof NavigationError)
    ).subscribe();
  }
}
