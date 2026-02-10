import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { CookieConsentBannerComponent } from "./shared/components/cookie-consent-banner/cookie-consent-banner.component";
import { LoadingOverlayComponent } from "./shared/components/loading-overlay/loading-overlay.component";
import { SkipToContentComponent } from "./shared/components/skip-to-content/skip-to-content.component";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ToastComponent } from "./shared/components/toast/toast.component";
import { PlatformDetectionService } from "./core/services/platform-detection.service";

@Component({
  selector: "app-root",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    SkipToContentComponent,
    CookieConsentBannerComponent,
    LoadingOverlayComponent,
    ConfirmDialog,
    ToastComponent,
  ],
  template: `
    <app-skip-to-content />
    <main id="main-content" tabindex="-1">
      <router-outlet></router-outlet>
    </main>
    <app-cookie-consent-banner />
    <app-loading-overlay />
    <p-confirmDialog></p-confirmDialog>
    <!-- UX AUDIT FIX: Global toast component - prevents duplicate toasts across components -->
    <app-toast position="top-right" [preventDuplicates]="true"></app-toast>
  `,
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  // Side-effect: triggers constructor to add platform classes (iOS, Android, Safari, Chrome) to document.body
  private readonly _platformDetection = inject(PlatformDetectionService);
}
