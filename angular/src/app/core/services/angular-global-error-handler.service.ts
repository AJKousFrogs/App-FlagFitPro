import {
  ErrorHandler,
  Injectable,
  Injector,
  inject,
} from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { LoggerService } from "./logger.service";
import { isExpectedApiClientError } from "../../shared/utils/error.utils";

@Injectable()
export class AngularGlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);
  private readonly logger = inject(LoggerService);

  private isExpectedHttpAuthError(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) return false;
    if (![400, 401, 403, 404].includes(error.status)) return false;
    return (error.url ?? "").includes("/api/");
  }

  handleError(error: unknown): void {
    if (error === null || error === undefined) {
      return;
    }

    // Avoid noisy "unhandled" telemetry for expected auth/client HTTP failures.
    if (
      this.isExpectedHttpAuthError(error) ||
      isExpectedApiClientError(error)
    ) {
      if (!environment.production) {
        this.logger.debug("[GlobalErrorHandler] Ignored expected HTTP error", {
          status:
            error instanceof HttpErrorResponse
              ? error.status
              : (error as { status?: unknown }).status,
          url:
            error instanceof HttpErrorResponse
              ? error.url
              : (error as { url?: unknown }).url,
        });
      }
      return;
    }

    if (!environment.production) {
      this.logger.error("Unhandled error:", error);
    }

    // Lazy-load error tracking to keep startup bundle lean.
    void this.captureWithTracking(error);
  }

  private async captureWithTracking(error: unknown): Promise<void> {
    try {
      const { ErrorTrackingService } = await import("./error-tracking.service");
      const tracking = this.injector.get(ErrorTrackingService);
      tracking.captureError(error, {
        component: "AngularGlobalErrorHandler",
        action: "unhandled-error",
      });
    } catch (trackingError) {
      if (!environment.production) {
        this.logger.warn("Failed to forward unhandled error to tracking", {
          trackingError,
        });
      }
    }
  }
}
