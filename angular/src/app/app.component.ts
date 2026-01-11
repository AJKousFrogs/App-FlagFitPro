import { ChangeDetectionStrategy, Component, OnInit, inject } from "@angular/core";
import { RouterOutlet, Router, NavigationEnd, NavigationError } from "@angular/router";
import { filter } from "rxjs/operators";
import { SkipToContentComponent } from "./shared/components/skip-to-content/skip-to-content.component";
import { CookieConsentBannerComponent } from "./shared/components/cookie-consent-banner/cookie-consent-banner.component";
import { LoadingOverlayComponent } from "./shared/components/loading-overlay/loading-overlay.component";

// #region agent log
const _dbgLog=(l:string,m:string,d:object)=>{const e={location:l,message:m,data:d,timestamp:Date.now()};console.log('[DBG]',JSON.stringify(e));try{const logs=JSON.parse(sessionStorage.getItem('_dbg_logs')||'[]');logs.push(e);sessionStorage.setItem('_dbg_logs',JSON.stringify(logs.slice(-100)))}catch{}};
// #endregion

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

  constructor() {
    // #region agent log
    _dbgLog('app.component.ts:constructor','AppComponent constructor called',{timestamp:new Date().toISOString()});
    // #endregion
  }

  ngOnInit(): void {
    // #region agent log
    _dbgLog('app.component.ts:ngOnInit','AppComponent initialized',{currentUrl:this.router.url});
    // #endregion

    // Track navigation events
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd || event instanceof NavigationError)
    ).subscribe(event => {
      if (event instanceof NavigationEnd) {
        // #region agent log
        _dbgLog('app.component.ts:navigation','Navigation completed',{url:event.urlAfterRedirects});
        // #endregion
      } else if (event instanceof NavigationError) {
        // #region agent log
        _dbgLog('app.component.ts:navigation-error','Navigation error',{url:event.url,errorMessage:event.error?.message,errorStack:event.error?.stack});
        // #endregion
      }
    });
  }
}
