import { Injectable, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import {
  QbThrowingData,
  QbThrowingSessionInput,
} from "../models/qb-throwing.models";

/**
 * QB Throwing Service — thin client for the previously-orphaned
 * `/api/qb-throwing` lane (V2.2). Wires the throw-count logger the engine's
 * `QB_THROW_ADAPTATION` dosing policy has always assumed exists.
 */
@Injectable({ providedIn: "root" })
export class QbThrowingService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  private readonly _data = signal<QbThrowingData | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  async load(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.get<QbThrowingData>("/api/qb-throwing"),
      );
      if (res.success && res.data) {
        this._data.set(res.data);
      } else {
        this._error.set(res.error ?? "Could not load throwing data");
      }
    } catch (err) {
      this._error.set("Could not load throwing data");
      this.logger.error("qb_throwing_load_failed", err);
    } finally {
      this._loading.set(false);
    }
  }

  async logSession(input: QbThrowingSessionInput): Promise<void> {
    this._saving.set(true);
    this._error.set(null);
    try {
      const res = await firstValueFrom(
        this.api.post("/api/qb-throwing", input),
      );
      if (!res.success) {
        throw new Error(res.error ?? "Could not log throwing session");
      }
      await this.load();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not log throwing session";
      this._error.set(message);
      this.logger.error("qb_throwing_log_failed", err);
      throw err;
    } finally {
      this._saving.set(false);
    }
  }
}
