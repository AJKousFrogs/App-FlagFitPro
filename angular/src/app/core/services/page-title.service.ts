/**
 * Page Title Service
 * 
 * WCAG 2.4.2 Page Titled (Level A)
 * 
 * Manages dynamic page titles for better screen reader navigation
 * and browser tab identification.
 * 
 * Usage:
 * constructor(private pageTitleService: PageTitleService) {}
 * 
 * ngOnInit() {
 *   this.pageTitleService.setTitle('Dashboard');
 * }
 */

import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';

export interface PageTitleConfig {
  title: string;
  suffix?: string;
  prefix?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PageTitleService {
  private title = inject(Title);
  private router = inject(Router);
  private defaultSuffix = 'FlagFit Pro';
  private separator = ' | ';

  constructor() {
    // Listen to route changes and update title
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.router.routerState.root)
      )
      .subscribe(() => {
        // Optionally auto-update from route data
        const routeTitle = this.getRouteTitle();
        if (routeTitle) {
          this.setTitle(routeTitle);
        }
      });
  }

  /**
   * Set the page title
   * @param title The page title
   * @param config Optional configuration for prefix/suffix
   */
  setTitle(title: string, config?: Partial<PageTitleConfig>): void {
    const prefix = config?.prefix ? `${config.prefix}${this.separator}` : '';
    const suffix = config?.suffix !== undefined 
      ? (config.suffix ? `${this.separator}${config.suffix}` : '')
      : `${this.separator}${this.defaultSuffix}`;

    const fullTitle = `${prefix}${title}${suffix}`;
    this.title.setTitle(fullTitle);

    // Announce title change to screen readers
    this.announcePageChange(title);
  }

  /**
   * Get the current page title
   */
  getTitle(): string {
    return this.title.getTitle();
  }

  /**
   * Set the default suffix for all titles
   */
  setDefaultSuffix(suffix: string): void {
    this.defaultSuffix = suffix;
  }

  /**
   * Get title from route data
   */
  private getRouteTitle(): string | null {
    let route = this.router.routerState.root;
    let title: string | null = null;

    while (route) {
      if (route.snapshot.data['title']) {
        title = route.snapshot.data['title'];
      }
      route = route.firstChild!;
    }

    return title;
  }

  /**
   * Announce page change to screen readers
   */
  private announcePageChange(title: string): void {
    // Create temporary live region for announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Navigated to ${title} page`;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

