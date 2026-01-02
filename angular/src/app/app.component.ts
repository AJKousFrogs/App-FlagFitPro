import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SkipToContentComponent } from "./shared/components/skip-to-content/skip-to-content.component";
import { CookieConsentBannerComponent } from "./shared/components/cookie-consent-banner/cookie-consent-banner.component";
import { LoadingOverlayComponent } from "./shared/components/loading-overlay/loading-overlay.component";

@Component({
  selector: "app-root",
  standalone: true,
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
  styleUrl: './app.component.scss',
})
export class AppComponent {}
