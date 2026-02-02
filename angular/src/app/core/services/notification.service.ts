import { Injectable, inject } from "@angular/core";
import { LoggerService } from "@core/services/logger.service";
import {
  ToastMethodOptions,
  ToastOptions,
  ToastService,
} from "@core/services/toast.service";

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);

  success(
    detail: string,
    summaryOrOptions?: string | ToastMethodOptions,
    life?: number,
  ): void {
    this.toastService.success(detail, summaryOrOptions, life);
    this.log("info", detail, summaryOrOptions, "Success");
  }

  info(
    detail: string,
    summaryOrOptions?: string | ToastMethodOptions,
    life?: number,
  ): void {
    this.toastService.info(detail, summaryOrOptions, life);
    this.log("info", detail, summaryOrOptions, "Info");
  }

  warn(
    detail: string,
    summaryOrOptions?: string | ToastMethodOptions,
    life?: number,
  ): void {
    this.toastService.warn(detail, summaryOrOptions, life);
    this.log("warn", detail, summaryOrOptions, "Warning");
  }

  error(
    detail: string,
    summaryOrOptions?: string | ToastMethodOptions,
    life?: number,
  ): void {
    this.toastService.error(detail, summaryOrOptions, life);
    this.log("error", detail, summaryOrOptions, "Error");
  }

  notify(options: ToastOptions): void {
    this.toastService.show(options);
    const summary = options.summary || options.severity?.toUpperCase();
    this.logger.info(`Notification: ${summary ?? "Custom"}`, {
      detail: options.detail,
      severity: options.severity,
    });
  }

  private log(
    level: "info" | "warn" | "error",
    detail: string,
    summaryOrOptions?: string | ToastMethodOptions,
    defaultSummary?: string,
  ): void {
    const summary = this.resolveSummary(summaryOrOptions, defaultSummary);
    const context = summary ? { summary } : undefined;
    const data = { detail };
    if (level === "info") {
      this.logger.info(detail, context, data);
    } else if (level === "warn") {
      this.logger.warn(detail, context, data);
    } else {
      this.logger.error(detail, undefined, context, data as unknown);
    }
  }

  private resolveSummary(
    summaryOrOptions?: string | ToastMethodOptions,
    fallback?: string,
  ): string | undefined {
    if (typeof summaryOrOptions === "string") {
      return summaryOrOptions;
    }
    if (summaryOrOptions && typeof summaryOrOptions === "object") {
      return summaryOrOptions.summary || fallback;
    }
    return fallback;
  }
}
