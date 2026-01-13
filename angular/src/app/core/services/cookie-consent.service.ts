import { Injectable, signal, computed, isDevMode, inject } from "@angular/core";
import { LoggerService } from "./logger.service";

/**
 * Cookie Consent Service
 *
 * Manages user cookie preferences in compliance with GDPR.
 * Stores consent in localStorage and provides reactive signals
 * for components to check consent status.
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

export interface CookiePreferences {
  necessary: boolean; // Always true, required for app to function
  analytics: boolean; // Anonymous usage analytics
  functional: boolean; // Preferences and settings
  consentDate: string | null;
  consentVersion: string;
}

const CONSENT_STORAGE_KEY = "flagfit_cookie_consent";
const CONSENT_VERSION = "1.0";

@Injectable({
  providedIn: "root",
})
export class CookieConsentService {
  private readonly logger = inject(LoggerService);

  private readonly defaultPreferences: CookiePreferences = {
    necessary: true,
    analytics: false,
    functional: true,
    consentDate: null,
    consentVersion: CONSENT_VERSION,
  };

  // Reactive signals for consent state
  private _preferences = signal<CookiePreferences>(this.loadPreferences());
  private _showBanner = signal<boolean>(!this.hasValidConsent());

  // Public readonly signals
  readonly preferences = this._preferences.asReadonly();
  readonly showBanner = this._showBanner.asReadonly();

  // Computed signals for individual consent checks
  readonly hasConsented = computed(
    () => this._preferences().consentDate !== null,
  );
  readonly analyticsEnabled = computed(() => this._preferences().analytics);
  readonly functionalEnabled = computed(() => this._preferences().functional);

  constructor() {
    // Check if consent version has changed
    const stored = this.loadPreferences();
    if (stored.consentDate && stored.consentVersion !== CONSENT_VERSION) {
      // Consent version changed, need to re-consent
      this._showBanner.set(true);
    }
  }

  /**
   * Accept all cookies
   */
  acceptAll(): void {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      functional: true,
      consentDate: new Date().toISOString(),
      consentVersion: CONSENT_VERSION,
    };
    this.savePreferences(preferences);
    this._preferences.set(preferences);
    this._showBanner.set(false);
  }

  /**
   * Accept only necessary cookies (reject optional)
   */
  acceptNecessaryOnly(): void {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      functional: true, // Functional is needed for preferences to work
      consentDate: new Date().toISOString(),
      consentVersion: CONSENT_VERSION,
    };
    this.savePreferences(preferences);
    this._preferences.set(preferences);
    this._showBanner.set(false);
  }

  /**
   * Save custom preferences
   */
  saveCustomPreferences(analytics: boolean, functional: boolean): void {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics,
      functional,
      consentDate: new Date().toISOString(),
      consentVersion: CONSENT_VERSION,
    };
    this.savePreferences(preferences);
    this._preferences.set(preferences);
    this._showBanner.set(false);
  }

  /**
   * Withdraw consent and show banner again
   */
  withdrawConsent(): void {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    this._preferences.set(this.defaultPreferences);
    this._showBanner.set(true);
  }

  /**
   * Open the consent banner (for settings page)
   */
  openConsentBanner(): void {
    this._showBanner.set(true);
  }

  /**
   * Development helper: Force show banner (clears localStorage consent)
   * Only works in dev mode
   */
  forceShowBanner(): void {
    if (isDevMode()) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      this._preferences.set(this.defaultPreferences);
      this._showBanner.set(true);
      this.logger?.debug("[Cookie Service] Banner forced to show (dev mode)");
    }
  }

  /**
   * Check if we have valid consent
   */
  private hasValidConsent(): boolean {
    const prefs = this.loadPreferences();
    return (
      prefs.consentDate !== null && prefs.consentVersion === CONSENT_VERSION
    );
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): CookiePreferences {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Invalid JSON, return defaults
    }
    return this.defaultPreferences;
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(preferences: CookiePreferences): void {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // localStorage not available (e.g., private browsing)
      this.logger.warn("Could not save cookie preferences to localStorage");
    }
  }
}
