import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import {
  NavigationEnd,
  NavigationError,
  Router,
  RouterOutlet,
} from "@angular/router";
import { filter } from "rxjs/operators";
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
export class AppComponent implements OnInit {
  private router = inject(Router);
  // Ensure platform classes (iOS/Safari/Android) are applied globally.
  private platformDetection = inject(PlatformDetectionService);

  ngOnInit(): void {
    // Track navigation events for analytics/debugging
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationEnd || event instanceof NavigationError,
        ),
      )
      .subscribe();
  }
}
