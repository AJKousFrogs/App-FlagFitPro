/**
 * Platform Detection Service
 * 
 * Detects iOS, Android, and other platforms for platform-specific styling and behavior.
 * Automatically adds platform classes to components via host bindings.
 */

import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isSafari: boolean;
  isChrome: boolean;
  osVersion: string | null;
  browserVersion: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class PlatformDetectionService {
  private platformId = inject(PLATFORM_ID);
  private platformInfo: PlatformInfo | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.detectPlatform();
      this.addPlatformClasses();
    }
  }

  /**
   * Detect platform details from user agent
   */
  private detectPlatform(): void {
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    this.platformInfo = {
      isIOS: this.detectIOS(ua, platform),
      isAndroid: ua.includes('android'),
      isMobile: /mobile|android|iphone|ipod/i.test(ua),
      isTablet: /ipad|android(?!.*mobile)/i.test(ua),
      isSafari: /safari/i.test(ua) && !/chrome/i.test(ua),
      isChrome: /chrome/i.test(ua) && !/edge/i.test(ua),
      osVersion: this.extractOSVersion(ua),
      browserVersion: this.extractBrowserVersion(ua),
    };

    console.log('🔍 [PlatformDetection] Platform detected:', this.platformInfo);
  }

  /**
   * Detect iOS devices (iPhone, iPad, iPod)
   */
  private detectIOS(ua: string, platform: string): boolean {
    // Standard iOS detection
    const isIOSUA = /iphone|ipad|ipod/.test(ua);
    
    // iPad on iOS 13+ detection (reports as Mac)
    const isIPadOS = 
      platform.includes('mac') && 
      navigator.maxTouchPoints > 1;

    return isIOSUA || isIPadOS;
  }

  /**
   * Extract iOS/Android version from user agent
   */
  private extractOSVersion(ua: string): string | null {
    // iOS version (e.g., "OS 17_2_1")
    const iosMatch = ua.match(/os (\d+)[._](\d+)(?:[._](\d+))?/i);
    if (iosMatch) {
      return `iOS ${iosMatch[1]}.${iosMatch[2]}${iosMatch[3] ? '.' + iosMatch[3] : ''}`;
    }

    // Android version
    const androidMatch = ua.match(/android (\d+\.?\d*)/i);
    if (androidMatch) {
      return `Android ${androidMatch[1]}`;
    }

    return null;
  }

  /**
   * Extract browser version from user agent
   */
  private extractBrowserVersion(ua: string): string | null {
    // Safari version
    const safariMatch = ua.match(/version\/(\d+\.?\d*)/i);
    if (safariMatch && this.platformInfo?.isSafari) {
      return `Safari ${safariMatch[1]}`;
    }

    // Chrome version
    const chromeMatch = ua.match(/chrome\/(\d+\.?\d*)/i);
    if (chromeMatch && this.platformInfo?.isChrome) {
      return `Chrome ${chromeMatch[1]}`;
    }

    return null;
  }

  /**
   * Add platform classes to document body
   */
  private addPlatformClasses(): void {
    if (!this.platformInfo) return;

    const classes: string[] = [];

    if (this.platformInfo.isIOS) {
      classes.push('platform-ios');
      console.log('📱 [PlatformDetection] iOS detected, adding .platform-ios class');
    }

    if (this.platformInfo.isAndroid) {
      classes.push('platform-android');
      console.log('🤖 [PlatformDetection] Android detected, adding .platform-android class');
    }

    if (this.platformInfo.isMobile) {
      classes.push('platform-mobile');
    }

    if (this.platformInfo.isTablet) {
      classes.push('platform-tablet');
    }

    if (this.platformInfo.isSafari) {
      classes.push('browser-safari');
      console.log('🧭 [PlatformDetection] Safari detected, adding .browser-safari class');
    }

    if (this.platformInfo.isChrome) {
      classes.push('browser-chrome');
    }

    // Add classes to body
    document.body.classList.add(...classes);

    // Log for debugging
    console.log('🎨 [PlatformDetection] Platform classes added:', classes);
  }

  /**
   * Get platform info
   */
  getPlatformInfo(): PlatformInfo {
    return this.platformInfo || {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isTablet: false,
      isSafari: false,
      isChrome: false,
      osVersion: null,
      browserVersion: null,
    };
  }

  /**
   * Check if current platform is iOS
   */
  isIOS(): boolean {
    return this.platformInfo?.isIOS || false;
  }

  /**
   * Check if current platform is Android
   */
  isAndroid(): boolean {
    return this.platformInfo?.isAndroid || false;
  }

  /**
   * Check if current device is mobile
   */
  isMobile(): boolean {
    return this.platformInfo?.isMobile || false;
  }

  /**
   * Check if current device is tablet
   */
  isTablet(): boolean {
    return this.platformInfo?.isTablet || false;
  }

  /**
   * Check if current browser is Safari
   */
  isSafari(): boolean {
    return this.platformInfo?.isSafari || false;
  }

  /**
   * Check if current browser is Chrome
   */
  isChrome(): boolean {
    return this.platformInfo?.isChrome || false;
  }

  /**
   * Get CSS class names for host binding
   */
  getPlatformClasses(): { [key: string]: boolean } {
    if (!this.platformInfo) return {};

    return {
      'platform-ios': this.platformInfo.isIOS,
      'platform-android': this.platformInfo.isAndroid,
      'platform-mobile': this.platformInfo.isMobile,
      'platform-tablet': this.platformInfo.isTablet,
      'browser-safari': this.platformInfo.isSafari,
      'browser-chrome': this.platformInfo.isChrome,
    };
  }
}
