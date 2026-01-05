/**
 * Core Web Vitals Monitoring Service
 *
 * Tracks and reports Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint) - Loading performance
 * - FID (First Input Delay) - Interactivity
 * - CLS (Cumulative Layout Shift) - Visual stability
 *
 * Also tracks:
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - Navigation timing
 */

import { Injectable, inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { LoggerService } from "./logger.service";

export interface WebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint (target: < 2.5s)
  fid?: number; // First Input Delay (target: < 100ms)
  cls?: number; // Cumulative Layout Shift (target: < 0.1)
  fcp?: number; // First Contentful Paint (target: < 1.8s)
  ttfb?: number; // Time to First Byte (target: < 600ms)
  navigationTiming?: PerformanceNavigationTiming;
}

@Injectable({
  providedIn: "root",
})
export class CoreWebVitalsService {
  private logger = inject(LoggerService);
  private document = inject(DOCUMENT);
  private metrics: WebVitalsMetrics = {};

  constructor() {
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      this.observeLCP();
      this.observeFID();
      this.observeCLS();
      this.observeFCP();
      this.observeTTFB();
    }
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   * Target: < 2.5s (Good), 2.5-4s (Needs Improvement), > 4s (Poor)
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
        };

        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
        this.logger.info(
          `[Web Vitals] LCP: ${this.metrics.lcp.toFixed(2)}ms`,
          this.getStatus(this.metrics.lcp, 2500, 4000),
        );
      });

      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch (_error) {
      this.logger.warn("[Web Vitals] LCP observation not supported");
    }
  }

  /**
   * Observe First Input Delay (FID)
   * Target: < 100ms (Good), 100-300ms (Needs Improvement), > 300ms (Poor)
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & {
            processingStart?: number;
            startTime?: number;
          };
          this.metrics.fid = fidEntry.processingStart
            ? fidEntry.processingStart - entry.startTime
            : 0;

          this.logger.info(
            `[Web Vitals] FID: ${this.metrics.fid.toFixed(2)}ms`,
            this.getStatus(this.metrics.fid, 100, 300),
          );
        });
      });

      observer.observe({ type: "first-input", buffered: true });
    } catch (_error) {
      this.logger.warn("[Web Vitals] FID observation not supported");
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   * Target: < 0.1 (Good), 0.1-0.25 (Needs Improvement), > 0.25 (Poor)
   */
  private observeCLS(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as PerformanceEntry & {
            value?: number;
          };
          if (
            !(entry as PerformanceEntry & { hadRecentInput?: boolean })
              .hadRecentInput
          ) {
            clsValue += layoutShiftEntry.value || 0;
          }
        });

        this.metrics.cls = clsValue;
        this.logger.info(
          `[Web Vitals] CLS: ${this.metrics.cls.toFixed(3)}`,
          this.getStatus(this.metrics.cls * 1000, 100, 250),
        );
      });

      observer.observe({ type: "layout-shift", buffered: true });
    } catch (_error) {
      this.logger.warn("[Web Vitals] CLS observation not supported");
    }
  }

  /**
   * Observe First Contentful Paint (FCP)
   * Target: < 1.8s (Good), 1.8-3s (Needs Improvement), > 3s (Poor)
   */
  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.fcp = entry.startTime;
          this.logger.info(
            `[Web Vitals] FCP: ${this.metrics.fcp.toFixed(2)}ms`,
            this.getStatus(this.metrics.fcp, 1800, 3000),
          );
        });
      });

      observer.observe({ type: "paint", buffered: true });
    } catch (_error) {
      this.logger.warn("[Web Vitals] FCP observation not supported");
    }
  }

  /**
   * Observe Time to First Byte (TTFB)
   * Target: < 600ms (Good), 600-1500ms (Needs Improvement), > 1500ms (Poor)
   */
  private observeTTFB(): void {
    try {
      const navigationEntry = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      if (navigationEntry) {
        this.metrics.ttfb =
          navigationEntry.responseStart - navigationEntry.requestStart;
        this.metrics.navigationTiming = navigationEntry;

        this.logger.info(
          `[Web Vitals] TTFB: ${this.metrics.ttfb.toFixed(2)}ms`,
          this.getStatus(this.metrics.ttfb, 600, 1500),
        );
      }
    } catch (_error) {
      this.logger.warn("[Web Vitals] TTFB observation not supported");
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): WebVitalsMetrics {
    return { ...this.metrics };
  }

  /**
   * Get status for a metric
   */
  private getStatus(
    value: number,
    good: number,
    needsImprovement: number,
  ): string {
    if (value <= good) return "✅ Good";
    if (value <= needsImprovement) return "⚠️ Needs Improvement";
    return "❌ Poor";
  }

  /**
   * Log all metrics summary
   */
  logSummary(): void {
    const metrics = this.getMetrics();
    this.logger.info("=== Core Web Vitals Summary ===");
    this.logger.info(
      `LCP: ${metrics.lcp ? metrics.lcp.toFixed(2) + "ms" : "N/A"} ${this.getStatus(metrics.lcp || 0, 2500, 4000)}`,
    );
    this.logger.info(
      `FID: ${metrics.fid ? metrics.fid.toFixed(2) + "ms" : "N/A"} ${this.getStatus(metrics.fid || 0, 100, 300)}`,
    );
    this.logger.info(
      `CLS: ${metrics.cls ? metrics.cls.toFixed(3) : "N/A"} ${this.getStatus((metrics.cls || 0) * 1000, 100, 250)}`,
    );
    this.logger.info(
      `FCP: ${metrics.fcp ? metrics.fcp.toFixed(2) + "ms" : "N/A"} ${this.getStatus(metrics.fcp || 0, 1800, 3000)}`,
    );
    this.logger.info(
      `TTFB: ${metrics.ttfb ? metrics.ttfb.toFixed(2) + "ms" : "N/A"} ${this.getStatus(metrics.ttfb || 0, 600, 1500)}`,
    );
  }
}
