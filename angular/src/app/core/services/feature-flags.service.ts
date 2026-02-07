import { Injectable, inject, signal } from "@angular/core";
import { PlatformService } from "./platform.service";
import { LoggerService } from "./logger.service";

const STORAGE_KEYS = {
  nextGenMetricsPreview: "flagfit_next_gen_metrics_preview",
} as const;

@Injectable({
  providedIn: "root",
})
export class FeatureFlagsService {
  private platform = inject(PlatformService);
  private logger = inject(LoggerService);

  private _nextGenMetricsPreview = signal(false);
  readonly nextGenMetricsPreview = this._nextGenMetricsPreview.asReadonly();

  constructor() {
    const stored = this.platform.getLocalStorage(
      STORAGE_KEYS.nextGenMetricsPreview,
    );
    if (stored !== null) {
      this._nextGenMetricsPreview.set(stored === "true");
    }

    const windowRef = this.platform.getWindow();
    if (windowRef) {
      const params = new URLSearchParams(windowRef.location.search);
      const override = params.get("nextGenMetricsPreview");
      if (override !== null) {
        const enabled =
          override === "1" || override.toLowerCase() === "true";
        this._nextGenMetricsPreview.set(enabled);
        this.logger.info(
          `[FeatureFlags] nextGenMetricsPreview overridden via query param: ${enabled}`,
        );
      }
    }
  }

  setNextGenMetricsPreview(enabled: boolean): void {
    this._nextGenMetricsPreview.set(enabled);
    const stored = this.platform.setLocalStorage(
      STORAGE_KEYS.nextGenMetricsPreview,
      String(enabled),
    );
    if (!stored) {
      this.logger.warn(
        "[FeatureFlags] Failed to persist nextGenMetricsPreview flag",
      );
    }
  }
}
