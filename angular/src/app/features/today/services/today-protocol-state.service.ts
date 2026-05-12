import { DestroyRef, Injectable, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import {
  extractApiPayload,
  isSuccessfulApiResponse,
  mapDailyProtocolResponse,
} from "../../../core/utils/api-response-mapper";
import { type ProtocolApiResponse } from "../utils/protocol-api-mapper";
import { type ProtocolJson } from "../resolution/today-state.resolver";

/**
 * Component-scoped service that owns daily protocol API state.
 *
 * Provide in today.component.ts providers array so its lifetime
 * and DestroyRef are bound to the component instance.
 */
@Injectable()
export class TodayProtocolStateService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _protocolJson = signal<ProtocolJson | null>(null);
  private readonly _isGenerating = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _generationAttempted = signal(false);

  fullProtocolData: ProtocolApiResponse | null = null;

  readonly protocolJson = this._protocolJson.asReadonly();
  readonly isGenerating = this._isGenerating.asReadonly();
  readonly error = this._error.asReadonly();

  reset(): void {
    this._protocolJson.set(null);
    this._isGenerating.set(false);
    this._error.set(null);
    this._generationAttempted.set(false);
    this.fullProtocolData = null;
  }

  load(date: string, onLoaded?: (userId: string) => void, userId?: string | null): void {
    this.api
      .get<ProtocolJson>(`/api/daily-protocol?date=${date}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const payload = extractApiPayload<ProtocolJson>(response);
          if (payload) {
            this.fullProtocolData = payload as unknown as ProtocolApiResponse;
            this._protocolJson.set(this.mapResponse(payload));
            this._error.set(null);
            this._generationAttempted.set(false);
            if (userId && onLoaded) onLoaded(userId);
          } else if (!this._generationAttempted()) {
            this._generationAttempted.set(true);
            this.generate(date, onLoaded, userId);
          } else {
            this._error.set("We couldn't build today's plan right now. Try refreshing in a moment.");
            this._protocolJson.set(null);
            this.fullProtocolData = null;
          }
        },
        error: (err) => {
          this.logger.error("Failed to load today data", err);
          if (!this._generationAttempted()) {
            this._generationAttempted.set(true);
            this.generate(date, onLoaded, userId);
          } else {
            this._error.set("We couldn't load today's practice. Please try again.");
            this._protocolJson.set(null);
            this.fullProtocolData = null;
          }
        },
      });
  }

  private generate(date: string, onLoaded?: (userId: string) => void, userId?: string | null): void {
    this._isGenerating.set(true);
    this.api
      .post<ProtocolJson>("/api/daily-protocol/generate", { date })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this._isGenerating.set(false);
          if (isSuccessfulApiResponse(response)) {
            const payload = extractApiPayload<ProtocolJson>(response);
            if (payload) {
              this.fullProtocolData = payload as unknown as ProtocolApiResponse;
              this._protocolJson.set(this.mapResponse(payload));
              this._error.set(null);
              return;
            }
            // Generation succeeded but no inline payload — reload via GET
            this.load(date, onLoaded, userId);
          } else {
            this._error.set("We couldn't generate today's plan right now. Try again in a moment.");
            this._protocolJson.set(null);
            this.fullProtocolData = null;
          }
        },
        error: (err) => {
          this.logger.error("Failed to generate protocol", err);
          this._isGenerating.set(false);
          this._error.set("We couldn't generate today's plan right now. Try again in a moment.");
          this._protocolJson.set(null);
          this.fullProtocolData = null;
        },
      });
  }

  private mapResponse(data: unknown): ProtocolJson {
    return mapDailyProtocolResponse(data) as ProtocolJson;
  }
}
