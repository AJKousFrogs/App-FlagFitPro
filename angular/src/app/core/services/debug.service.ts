/**
 * Debug Service
 *
 * Centralized debugging utilities for Angular signals, effects, and API calls.
 * Provides tools for:
 * - Signal tracking and logging
 * - Effect monitoring
 * - API call tracing
 * - Component lifecycle debugging
 * - Performance monitoring
 */

import { Injectable, effect, Signal, inject } from "@angular/core";
import { LoggerService } from "./logger.service";
import { environment } from "../../../environments/environment";

export interface DebugConfig {
  enableSignalLogging: boolean;
  enableEffectLogging: boolean;
  enableApiLogging: boolean;
  enablePerformanceLogging: boolean;
  logStackTraces: boolean;
}

export interface SignalLogEntry {
  signalName: string;
  value: any;
  timestamp: number;
  componentName?: string;
}

export interface EffectLogEntry {
  effectName: string;
  timestamp: number;
  duration?: number;
  componentName?: string;
}

export interface ApiLogEntry {
  url: string;
  method: string;
  status?: number;
  duration?: number;
  timestamp: number;
  error?: any;
}

@Injectable({
  providedIn: "root",
})
export class DebugService {
  private readonly logger = inject(LoggerService);

  private config: DebugConfig = {
    enableSignalLogging: !environment.production,
    enableEffectLogging: !environment.production,
    enableApiLogging: !environment.production,
    enablePerformanceLogging: !environment.production,
    logStackTraces: false,
  };

  private signalLogs: SignalLogEntry[] = [];
  private effectLogs: EffectLogEntry[] = [];
  private apiLogs: ApiLogEntry[] = [];

  // Maximum log entries to keep in memory
  private readonly MAX_LOG_ENTRIES = 100;

  constructor() {
    if (!environment.production) {
      this.initializeDebugMode();
    }
  }

  /**
   * Initialize debug mode - expose debug utilities to window object
   */
  private initializeDebugMode(): void {
    if (typeof window !== "undefined") {
      (window as any).angularDebug = {
        getSignalLogs: () => this.getSignalLogs(),
        getEffectLogs: () => this.getEffectLogs(),
        getApiLogs: () => this.getApiLogs(),
        clearLogs: () => this.clearAllLogs(),
        setConfig: (config: Partial<DebugConfig>) => this.updateConfig(config),
        getConfig: () => this.config,
      };

      console.log(
        "%c🔧 Angular Debug Mode Enabled",
        "color: #00ff00; font-weight: bold; font-size: 14px;",
      );
      console.log(
        "%cAccess debug utilities via window.angularDebug",
        "color: #00aaff; font-size: 12px;",
      );
      console.log("Available commands:");
      console.log("  - window.angularDebug.getSignalLogs()");
      console.log("  - window.angularDebug.getEffectLogs()");
      console.log("  - window.angularDebug.getApiLogs()");
      console.log("  - window.angularDebug.clearLogs()");
      console.log("  - window.angularDebug.setConfig({ ... })");
    }
  }

  /**
   * Track a signal and log its changes
   */
  trackSignal<T>(
    signal: Signal<T>,
    signalName: string,
    componentName?: string,
  ): void {
    if (!this.config.enableSignalLogging) return;

    effect(() => {
      const value = signal();
      const entry: SignalLogEntry = {
        signalName,
        value,
        timestamp: Date.now(),
        componentName,
      };

      this.addSignalLog(entry);

      const componentPrefix = componentName ? `[${componentName}]` : "";
      console.log(
        `%c📊 Signal Update ${componentPrefix} ${signalName}`,
        "color: #ff9800; font-weight: bold;",
        value,
      );

      if (this.config.logStackTraces) {
        console.trace("Signal update stack trace");
      }
    });
  }

  /**
   * Log an effect execution
   */
  logEffect(
    effectName: string,
    componentName?: string,
    callback?: () => void,
  ): void {
    if (!this.config.enableEffectLogging) return;

    const startTime = performance.now();

    effect(() => {
      if (callback) callback();

      const duration = performance.now() - startTime;
      const entry: EffectLogEntry = {
        effectName,
        timestamp: Date.now(),
        duration,
        componentName,
      };

      this.addEffectLog(entry);

      const componentPrefix = componentName ? `[${componentName}]` : "";
      console.log(
        `%c⚡ Effect Executed ${componentPrefix} ${effectName}`,
        "color: #9c27b0; font-weight: bold;",
        `(${duration.toFixed(2)}ms)`,
      );

      if (this.config.logStackTraces) {
        console.trace("Effect execution stack trace");
      }
    });
  }

  /**
   * Log an API call
   */
  logApiCall(
    url: string,
    method: string,
    status?: number,
    duration?: number,
    error?: any,
  ): void {
    if (!this.config.enableApiLogging) return;

    const entry: ApiLogEntry = {
      url,
      method,
      status,
      duration,
      timestamp: Date.now(),
      error,
    };

    this.addApiLog(entry);

    const statusColor =
      status && status >= 200 && status < 300 ? "#4caf50" : "#f44336";
    const statusText = status ? `[${status}]` : error ? "[ERROR]" : "[PENDING]";

    console.log(
      `%c🌐 API Call ${method} ${statusText}`,
      `color: ${statusColor}; font-weight: bold;`,
      {
        url,
        duration: duration ? `${duration.toFixed(2)}ms` : "N/A",
        error,
      },
    );

    if (error && this.config.logStackTraces) {
      console.trace("API error stack trace");
    }
  }

  /**
   * Log component lifecycle event
   */
  logLifecycle(componentName: string, event: string, data?: any): void {
    if (!this.config.enableSignalLogging) return;

    console.log(
      `%c🔄 Lifecycle [${componentName}] ${event}`,
      "color: #2196f3; font-weight: bold;",
      data || "",
    );
  }

  /**
   * Log performance measurement
   */
  logPerformance(label: string, duration: number, threshold?: number): void {
    if (!this.config.enablePerformanceLogging) return;

    const isWarning = threshold && duration > threshold;
    const color = isWarning ? "#ff9800" : "#4caf50";
    const prefix = isWarning ? "⚠️" : "⏱️";

    console.log(
      `%c${prefix} Performance: ${label}`,
      `color: ${color}; font-weight: bold;`,
      `${duration.toFixed(2)}ms`,
    );

    if (isWarning) {
      console.warn(`Performance threshold exceeded for: ${label}`);
    }
  }

  /**
   * Create a performance measurement wrapper
   */
  measurePerformance<T>(label: string, fn: () => T, threshold?: number): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.logPerformance(label, duration, threshold);

    return result;
  }

  /**
   * Create an async performance measurement wrapper
   */
  async measurePerformanceAsync<T>(
    label: string,
    fn: () => Promise<T>,
    threshold?: number,
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.logPerformance(label, duration, threshold);

    return result;
  }

  /**
   * Update debug configuration
   */
  updateConfig(config: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...config };
    console.log("Debug config updated:", this.config);
  }

  /**
   * Get all signal logs
   */
  getSignalLogs(): SignalLogEntry[] {
    return [...this.signalLogs];
  }

  /**
   * Get all effect logs
   */
  getEffectLogs(): EffectLogEntry[] {
    return [...this.effectLogs];
  }

  /**
   * Get all API logs
   */
  getApiLogs(): ApiLogEntry[] {
    return [...this.apiLogs];
  }

  /**
   * Clear all logs
   */
  clearAllLogs(): void {
    this.signalLogs = [];
    this.effectLogs = [];
    this.apiLogs = [];
    console.log("All debug logs cleared");
  }

  /**
   * Add signal log entry
   */
  private addSignalLog(entry: SignalLogEntry): void {
    this.signalLogs.push(entry);
    if (this.signalLogs.length > this.MAX_LOG_ENTRIES) {
      this.signalLogs.shift();
    }
  }

  /**
   * Add effect log entry
   */
  private addEffectLog(entry: EffectLogEntry): void {
    this.effectLogs.push(entry);
    if (this.effectLogs.length > this.MAX_LOG_ENTRIES) {
      this.effectLogs.shift();
    }
  }

  /**
   * Add API log entry
   */
  private addApiLog(entry: ApiLogEntry): void {
    this.apiLogs.push(entry);
    if (this.apiLogs.length > this.MAX_LOG_ENTRIES) {
      this.apiLogs.shift();
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(
      {
        signals: this.signalLogs,
        effects: this.effectLogs,
        api: this.apiLogs,
        timestamp: Date.now(),
      },
      null,
      2,
    );
  }

  /**
   * Download logs as a file
   */
  downloadLogs(): void {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    const logs = this.exportLogs();
    const blob = new Blob([logs], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `angular-debug-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Debug logs downloaded");
  }
}
