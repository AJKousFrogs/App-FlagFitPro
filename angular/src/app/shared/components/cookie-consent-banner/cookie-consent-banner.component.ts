import { CommonModule } from "@angular/common";
import { DOCUMENT } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  RendererFactory2,
  effect,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { CookieConsentService } from "../../../core/services/cookie-consent.service";
import { ButtonComponent } from "../button/button.component";

/**
 * Cookie Consent Banner Component
 *
 * GDPR-compliant cookie consent banner for FlagFit Pro.
 * Displays at the bottom of the screen until user makes a choice.
 *
 * Features:
 * - Accept all / Necessary only quick actions
 * - Expandable detailed preferences
 * - Links to privacy policy
 * - Remembers choice in localStorage
 * - Accessible (keyboard navigation, ARIA labels)
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */
@Component({
  selector: "app-cookie-consent-banner",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ButtonComponent],
  template: `
    @if (cookieService.showBanner()) {
      <div
        class="cookie-banner"
        role="dialog"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-description"
      >
        <div class="cookie-content">
          <!-- Header -->
          <div class="cookie-header">
            <div class="cookie-icon">🍪</div>
            <h2 id="cookie-title" class="cookie-title">Cookie Settings</h2>
          </div>

          <!-- Description -->
          <p id="cookie-description" class="cookie-description">
            We use cookies to make the app work properly and to understand how
            you use it. We're a volunteer sports club with zero budget — we
            don't sell your data or show ads.
            <a routerLink="/privacy-policy" class="cookie-link"
              >Read our Privacy Policy</a
            >
          </p>

          <!-- Detailed Preferences (expandable) -->
          @if (showDetails()) {
            <div class="cookie-details" @fadeIn>
              <div class="cookie-preference">
                <div class="preference-info">
                  <span class="preference-name">Necessary Cookies</span>
                  <span class="preference-description"
                    >Required for the app to function. Cannot be disabled.</span
                  >
                </div>
                <div class="preference-toggle always-on">
                  <span class="toggle-label">Always On</span>
                </div>
              </div>

              <div class="cookie-preference">
                <div class="preference-info">
                  <span class="preference-name">Functional Cookies</span>
                  <span class="preference-description"
                    >Remember your preferences and settings.</span
                  >
                </div>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    [checked]="functionalEnabled()"
                    (change)="toggleFunctional()"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="cookie-preference">
                <div class="preference-info">
                  <span class="preference-name">Analytics Cookies</span>
                  <span class="preference-description"
                    >Help us understand how you use the app (anonymous).</span
                  >
                </div>
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    [checked]="analyticsEnabled()"
                    (change)="toggleAnalytics()"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          }

          <!-- Actions -->
          <div class="cookie-actions">
            @if (!showDetails()) {
              <app-button
                variant="secondary"
                size="md"
                (clicked)="toggleDetails()"
                type="button"
              >
                Customize
              </app-button>
            } @else {
              <app-button
                variant="secondary"
                size="md"
                (clicked)="saveCustom()"
                type="button"
              >
                Save Preferences
              </app-button>
            }

            <app-button
              variant="outlined"
              size="md"
              (clicked)="acceptNecessary()"
              type="button"
            >
              Necessary Only
            </app-button>

            <app-button
              variant="primary"
              size="md"
              (clicked)="acceptAll()"
              type="button"
            >
              Accept All
            </app-button>
          </div>

          <!-- Club Info -->
          <p class="cookie-footer">
            <span class="club-name">Športno društvo Žabe</span> ·
            <a href="mailto:merlin@ljubljanafrogs.si" class="cookie-link"
              >merlin&#64;ljubljanafrogs.si</a
            >
          </p>
        </div>
      </div>
    }
  `,
  styleUrl: "./cookie-consent-banner.component.scss",
})
export class CookieConsentBannerComponent {
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(RendererFactory2).createRenderer(null, null);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cookieService = inject(CookieConsentService);

  // Local state for detailed preferences
  protected readonly showDetails = signal(false);
  protected readonly analyticsEnabled = signal(false);
  protected readonly functionalEnabled = signal(true);

  constructor() {
    effect(() => {
      const body = this.document?.body;
      if (!body) {
        return;
      }

      if (this.cookieService.showBanner()) {
        this.renderer.addClass(body, "cookie-banner-visible");
      } else {
        this.renderer.removeClass(body, "cookie-banner-visible");
      }
    });

    this.destroyRef.onDestroy(() => {
      const body = this.document?.body;
      if (body) {
        this.renderer.removeClass(body, "cookie-banner-visible");
      }
    });
  }

  toggleDetails(): void {
    this.showDetails.set(!this.showDetails());
  }

  toggleAnalytics(): void {
    this.analyticsEnabled.set(!this.analyticsEnabled());
  }

  toggleFunctional(): void {
    this.functionalEnabled.set(!this.functionalEnabled());
  }

  acceptAll(): void {
    this.cookieService.acceptAll();
  }

  acceptNecessary(): void {
    this.cookieService.acceptNecessaryOnly();
  }

  saveCustom(): void {
    this.cookieService.saveCustomPreferences(
      this.analyticsEnabled(),
      this.functionalEnabled(),
    );
  }
}
