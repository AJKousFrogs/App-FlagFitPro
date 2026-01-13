/**
 * Platform Service
 * =================
 * Safely handles browser-only APIs for SSR compatibility
 *
 * Usage:
 * ```typescript
 * private platform = inject(PlatformService);
 *
 * // Instead of: localStorage.setItem('key', 'value')
 * this.platform.setLocalStorage('key', 'value');
 *
 * // Instead of: window.scrollTo(0, 0)
 * if (this.platform.isBrowser) {
 *   window.scrollTo(0, 0);
 * }
 * ```
 */

import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import { LoggerService } from "./logger.service";

@Injectable({
  providedIn: "root",
})
export class PlatformService {
  private platformId = inject(PLATFORM_ID);
  private logger = inject(LoggerService);

  /**
   * Check if code is running in browser
   */
  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Check if code is running on server
   */
  get isServer(): boolean {
    return isPlatformServer(this.platformId);
  }

  /**
   * Safely get window object
   */
  getWindow(): Window | null {
    return this.isBrowser ? window : null;
  }

  /**
   * Safely get document object
   */
  getDocument(): Document | null {
    return this.isBrowser ? document : null;
  }

  /**
   * Safely get localStorage item
   */
  getLocalStorage(key: string): string | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      this.logger.warn(`Failed to read from localStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * Safely set localStorage item
   */
  setLocalStorage(key: string, value: string): boolean {
    if (!this.isBrowser) {
      return false;
    }
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      this.logger.warn(`Failed to write to localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Safely remove localStorage item
   */
  removeLocalStorage(key: string): boolean {
    if (!this.isBrowser) {
      return false;
    }
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      this.logger.warn(`Failed to remove from localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Safely clear all localStorage
   */
  clearLocalStorage(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      this.logger.warn("Failed to clear localStorage", error);
      return false;
    }
  }

  /**
   * Safely get sessionStorage item
   */
  getSessionStorage(key: string): string | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      this.logger.warn(`Failed to read from sessionStorage: ${key}`, error);
      return null;
    }
  }

  /**
   * Safely set sessionStorage item
   */
  setSessionStorage(key: string, value: string): boolean {
    if (!this.isBrowser) {
      return false;
    }
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      this.logger.warn(`Failed to write to sessionStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Safely remove sessionStorage item
   */
  removeSessionStorage(key: string): boolean {
    if (!this.isBrowser) {
      return false;
    }
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      this.logger.warn(`Failed to remove from sessionStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Safely execute code only in browser
   */
  runInBrowser(fn: () => void): void {
    if (this.isBrowser) {
      fn();
    }
  }

  /**
   * Safely execute code only on server
   */
  runOnServer(fn: () => void): void {
    if (this.isServer) {
      fn();
    }
  }

  /**
   * Get user agent safely
   */
  getUserAgent(): string {
    if (!this.isBrowser) {
      return "";
    }
    return navigator.userAgent;
  }

  /**
   * Check if user is on mobile device (browser only)
   */
  isMobileDevice(): boolean {
    if (!this.isBrowser) {
      return false; // Assume desktop for SSR
    }
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  }

  /**
   * Safely scroll to top
   */
  scrollToTop(behavior: ScrollBehavior = "smooth"): void {
    this.runInBrowser(() => {
      window.scrollTo({ top: 0, behavior });
    });
  }

  /**
   * Safely scroll to element
   */
  scrollToElement(
    elementId: string,
    behavior: ScrollBehavior = "smooth",
  ): void {
    this.runInBrowser(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior });
      }
    });
  }

  /**
   * Safely get viewport width
   */
  getViewportWidth(): number {
    if (!this.isBrowser) {
      return 1024; // Default for SSR
    }
    return window.innerWidth;
  }

  /**
   * Safely get viewport height
   */
  getViewportHeight(): number {
    if (!this.isBrowser) {
      return 768; // Default for SSR
    }
    return window.innerHeight;
  }

  /**
   * Safely copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    if (!this.isBrowser) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      this.logger.warn("Failed to copy to clipboard", error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        return success;
      } catch (fallbackError) {
        this.logger.warn("Fallback copy failed", fallbackError);
        return false;
      }
    }
  }

  /**
   * Safely open URL in new tab
   */
  openInNewTab(url: string): void {
    this.runInBrowser(() => {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  /**
   * Safely reload page
   */
  reloadPage(): void {
    this.runInBrowser(() => {
      window.location.reload();
    });
  }

  /**
   * Safely navigate to URL
   */
  navigateToUrl(url: string): void {
    this.runInBrowser(() => {
      window.location.href = url;
    });
  }
}
