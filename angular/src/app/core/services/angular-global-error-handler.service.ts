import {
  ErrorHandler,
  Injectable,
  Injector,
  inject,
} from "@angular/core";
import { environment } from "../../../environments/environment";
import { LoggerService } from "./logger.service";

@Injectable()
export class AngularGlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);
  private readonly logger = inject(LoggerService);

  handleError(error: unknown): void {
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
