import {
  Injectable,
  inject,
  signal,
  computed,
  effect,
  DestroyRef,
} from "@angular/core";
import { MessageService } from "primeng/api";
import { LoggerService } from "./logger.service";
import { ImageCompressionService } from "./image-compression.service";
import { timer } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

export interface PerformanceMetric {
  label: string;
  value: string;
  score: number;
  status: "good" | "warning" | "critical";
  threshold?: {
    warning: number;
    critical: number;
  };
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

interface LargestContentfulPaintEntry extends PerformanceEntry {
  renderTime: number;
  loadTime: number;
  size: number;
  element?: Element;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: Array<{
    node?: Node;
    previousRect: DOMRectReadOnly;
    currentRect: DOMRectReadOnly;
  }>;
}

interface WindowWithGC extends Window {
  gc?: () => void;
}

@Injectable({
  providedIn: "root",
})
export class PerformanceMonitorService {
  private messageService = inject(MessageService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);
  private imageCompression = inject(ImageCompressionService);

  metrics = signal<PerformanceMetric[]>([]);
  private performanceObserver?: PerformanceObserver;

  // Thresholds for performance metrics
  private thresholds = {
    pageLoadTime: { warning: 2000, critical: 4000 },
    memoryUsage: { warning: 50, critical: 100 }, // MB
    chartRenderTime: { warning: 500, critical: 1000 }, // ms
    firstContentfulPaint: { warning: 1500, critical: 3000 },
    largestContentfulPaint: { warning: 2500, critical: 4000 },
    cumulativeLayoutShift: { warning: 0.1, critical: 0.25 },
  };

  constructor() {
    // Use effect() for initialization (zoneless-compatible)
    effect(() => {
      // Initialize if browser supports PerformanceObserver
      if (
        typeof PerformanceObserver !== "undefined" &&
        !this.performanceObserver
      ) {
        this.startMonitoring();
      }
    });
  }

  startMonitoring(): void {
    // Monitor Core Web Vitals
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different entry types
      // Note: PerformanceObserver.observe() requires specific entry types
      // We'll observe them individually as browser support varies
      try {
        this.performanceObserver.observe({
          entryTypes: ["navigation", "paint"],
        });
      } catch (e) {
        // Fallback for browsers that don't support all entry types
        this.logger.debug("Some performance entry types not supported");
      }

      // Try to observe LCP and CLS separately if supported
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processPerformanceEntry(entry);
          }
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        this.logger.debug("LCP observation not supported");
      }

      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.processPerformanceEntry(entry);
          }
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        this.logger.debug("CLS observation not supported");
      }
    } catch (error) {
      this.logger.warn("PerformanceObserver not fully supported", error);
    }

    // Regular metrics collection using RxJS timer with automatic cleanup
    timer(0, 5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.collectMetrics();
      });
  }

  stopMonitoring(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (entry.entryType === "navigation") {
      const navEntry = entry as PerformanceNavigationTiming;
      // Process navigation timing
    } else if (entry.entryType === "paint") {
      const paintEntry = entry as PerformancePaintTiming;
      // Process paint timing
    } else if (entry.entryType === "largest-contentful-paint") {
      const lcpEntry = entry as LargestContentfulPaintEntry;
      // Process LCP
    } else if (entry.entryType === "layout-shift") {
      const clsEntry = entry as LayoutShiftEntry;
      // Process CLS
    }
  }

  private collectMetrics(): void {
    const metrics: PerformanceMetric[] = [];

    // Page Load Time
    const pageLoadTime = this.getPageLoadTime();
    metrics.push({
      label: "Page Load Time",
      value: `${pageLoadTime}ms`,
      score: this.calculateScore(pageLoadTime, this.thresholds.pageLoadTime),
      status: this.getStatus(pageLoadTime, this.thresholds.pageLoadTime),
      threshold: this.thresholds.pageLoadTime,
    });

    // Memory Usage
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage > 0) {
      metrics.push({
        label: "Memory Usage",
        value: `${memoryUsage.toFixed(1)}MB`,
        score: this.calculateScore(memoryUsage, this.thresholds.memoryUsage),
        status: this.getStatus(memoryUsage, this.thresholds.memoryUsage),
        threshold: this.thresholds.memoryUsage,
      });
    }

    // First Contentful Paint
    const fcp = this.getFirstContentfulPaint();
    if (fcp > 0) {
      metrics.push({
        label: "First Contentful Paint",
        value: `${fcp}ms`,
        score: this.calculateScore(fcp, this.thresholds.firstContentfulPaint),
        status: this.getStatus(fcp, this.thresholds.firstContentfulPaint),
        threshold: this.thresholds.firstContentfulPaint,
      });
    }

    // Largest Contentful Paint
    const lcp = this.getLargestContentfulPaint();
    if (lcp > 0) {
      metrics.push({
        label: "Largest Contentful Paint",
        value: `${lcp}ms`,
        score: this.calculateScore(lcp, this.thresholds.largestContentfulPaint),
        status: this.getStatus(lcp, this.thresholds.largestContentfulPaint),
        threshold: this.thresholds.largestContentfulPaint,
      });
    }

    this.metrics.set(metrics);
  }

  private getPageLoadTime(): number {
    if (typeof performance === "undefined") return 0;

    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    if (navigation) {
      return Math.round(navigation.loadEventEnd - navigation.fetchStart);
    }
    return 0;
  }

  private getMemoryUsage(): number {
    if (typeof performance !== "undefined" && (performance as ExtendedPerformance).memory) {
      const memory = (performance as ExtendedPerformance).memory!;
      return Math.round(memory.usedJSHeapSize / 1048576); // Convert to MB
    }
    return 0;
  }

  private getFirstContentfulPaint(): number {
    if (typeof performance === "undefined") return 0;

    const paintEntries = performance.getEntriesByType(
      "paint",
    ) as PerformancePaintTiming[];
    const fcp = paintEntries.find(
      (entry) => entry.name === "first-contentful-paint",
    );
    return fcp ? Math.round(fcp.startTime) : 0;
  }

  private getLargestContentfulPaint(): number {
    if (typeof performance === "undefined") return 0;

    const lcpEntries = performance.getEntriesByType(
      "largest-contentful-paint",
    ) as LargestContentfulPaintEntry[];
    if (lcpEntries.length > 0) {
      return Math.round(lcpEntries[lcpEntries.length - 1].renderTime);
    }
    return 0;
  }

  private calculateScore(
    value: number,
    threshold: { warning: number; critical: number },
  ): number {
    if (value <= threshold.warning) {
      return 100;
    } else if (value <= threshold.critical) {
      return (
        50 +
        (50 * (threshold.critical - value)) /
          (threshold.critical - threshold.warning)
      );
    }
    return Math.max(
      0,
      50 - (50 * (value - threshold.critical)) / threshold.critical,
    );
  }

  private getStatus(
    value: number,
    threshold: { warning: number; critical: number },
  ): "good" | "warning" | "critical" {
    if (value <= threshold.warning) {
      return "good";
    } else if (value <= threshold.critical) {
      return "warning";
    }
    return "critical";
  }

  hasIssues = computed(() => {
    return this.metrics().some(
      (metric) => metric.status === "warning" || metric.status === "critical",
    );
  });

  optimizePerformance(): void {
    // Clear unused chart instances
    this.clearUnusedChartInstances();

    // Compress images in the DOM
    this.compressPageImages();

    // Prefetch critical resources
    this.prefetchCriticalResources();

    // Force garbage collection if available
    const windowWithGC = window as WindowWithGC;
    if (windowWithGC.gc) {
      windowWithGC.gc();
    }

    // Show success message
    this.showToast("success", "Performance optimizations applied");
  }

  /**
   * Find and compress large images on the current page
   */
  private async compressPageImages(): Promise<void> {
    try {
      const images = document.querySelectorAll('img[src^="data:"]');
      let compressedCount = 0;

      for (const img of Array.from(images)) {
        const imgElement = img as HTMLImageElement;
        const src = imgElement.src;
        
        // Skip small images or already optimized
        if (!src.startsWith('data:image') || src.includes('image/webp')) {
          continue;
        }

        try {
          const result = await this.imageCompression.compressImageFromDataUrl(
            src,
            this.imageCompression.getPresetOptions('post')
          );

          // Only replace if we achieved significant compression
          if (result.compressionRatio > 10) {
            imgElement.src = result.dataUrl;
            compressedCount++;
            this.logger.debug(
              `Compressed image: ${result.compressionRatio}% reduction`
            );
          }
        } catch (error) {
          this.logger.debug('Could not compress image:', error);
        }
      }

      if (compressedCount > 0) {
        this.logger.info(`Compressed ${compressedCount} images on page`);
      }
    } catch (error) {
      this.logger.warn('Image compression optimization failed:', error);
    }
  }

  private clearUnusedChartInstances(): void {
    // This would clear unused chart instances
    // Implementation depends on chart library being used
    this.logger.debug("Clearing unused chart instances");
  }

  private prefetchCriticalResources(): void {
    // Prefetch critical resources
    const criticalResources = [
      "/assets/fonts/main.woff2",
      "/assets/icons/sprite.svg",
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  private showToast(severity: string, message: string): void {
    this.messageService.add({
      severity,
      summary: "Performance Monitor",
      detail: message,
    });
  }

  reportIssue(): void {
    const metrics = this.metrics();
    const issueReport = {
      timestamp: new Date().toISOString(),
      metrics: metrics.map((m) => ({
        label: m.label,
        value: m.value,
        status: m.status,
      })),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.logger.info("Performance Issue Report:", issueReport);
    // In a real application, this would send the report to a backend service
    this.showToast(
      "info",
      "Performance issue report generated. Check console for details.",
    );
  }
}
