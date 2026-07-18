import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { DecimalPipe } from "@angular/common";
import { LucideAngularModule } from "lucide-angular";
import { SparklineComponent } from "../shared/perf-viz";
import {
  ExternalLoadService,
  type ExternalLoadMetric,
} from "../core/services/external-load.service";
import {
  WearableService,
  type DeviceStatus,
} from "../core/services/wearable.service";
import {
  deviceSessionSchema,
  emptyDeviceSession,
} from "../core/forms/device-session.schema";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Device data (athlete self-service). Wires the real `/api/external-load` lane —
 * an athlete reads objective session metrics off their watch/GPS and logs them,
 * feeding the objective-load side of ACWR. It also shows the supported-device
 * catalogue (`/api/wearables/status`) HONESTLY: automated OAuth sync isn't live
 * yet (it needs provider credentials — a separate integration), so there is no
 * fake "Connect" button; manual entry is the current path. Nothing is fabricated
 * (Law #7): empty history shows an empty state, not zeros.
 */
@Component({
  selector: "app-device-data",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, DecimalPipe, LucideAngularModule, SparklineComponent],
  templateUrl: "./device-data.component.html",
  styleUrl: "./device-data.component.scss",
})
export class DeviceDataComponent {
  private readonly externalLoad = inject(ExternalLoadService);
  private readonly wearables = inject(WearableService);

  readonly history = signal<ExternalLoadMetric[]>([]);
  readonly devices = signal<DeviceStatus[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);

  /**
   * Signal Forms (2026-07-18). The model is the source of truth; `f` is the
   * field tree the template binds to via `[formField]`. Validation — including
   * the "never write an all-null row" rule that used to be the `canSave`
   * computed below — is declared in `core/forms/device-session.schema.ts`.
   */
  readonly model = signal(emptyDeviceSession(todayIso()));
  readonly f = form(this.model, deviceSessionSchema);

  /** Distance sparkline over the most recent sessions (oldest→newest). */
  readonly distanceSeries = computed(() =>
    this.history()
      .filter((m) => typeof m.totalDistanceM === "number")
      .slice(0, 14)
      .map((m) => m.totalDistanceM as number)
      .reverse(),
  );

  /**
   * Now derived from the schema rather than restating the rule. Kept under the
   * same name because it's the button's disabled-binding and the spec's entry
   * point — the rule moved, the contract didn't.
   */
  readonly canSave = computed(() => this.f().valid());

  /**
   * First validation message to show under the form, if any.
   *
   * `errorSummary()` NOT `errors()`: the latter is field-local, so a
   * field-level rule (the `min(…, 0)` non-negative bound) never appears on the
   * root and the form would sit invalid with nothing explaining why.
   */
  readonly formError = computed<string | null>(
    () => this.f().errorSummary()[0]?.message ?? null,
  );

  constructor() {
    this.refresh();
    this.wearables.status().subscribe((d) => this.devices.set(d));
  }

  private refresh(): void {
    this.loading.set(true);
    this.externalLoad.list().subscribe((rows) => {
      this.history.set(rows);
      this.loading.set(false);
    });
  }

  save(): void {
    if (!this.canSave() || this.saving()) return;
    const v = this.model();
    this.saving.set(true);
    this.saved.set(false);
    this.externalLoad
      .log({
        sessionDate: v.sessionDate,
        source: "manual",
        deviceName: v.deviceName || null,
        durationMinutes: v.durationMinutes,
        totalDistanceM: v.totalDistanceM,
        highSpeedDistanceM: v.highSpeedDistanceM,
        maxVelocityKmh: v.maxVelocityKmh,
        playerLoad: v.playerLoad,
        notes: v.notes || null,
      })
      .subscribe((row) => {
        this.saving.set(false);
        if (row) {
          this.saved.set(true);
          // Reset the metrics but keep the date + device for a quick second
          // entry — one signal set now, instead of six.
          this.model.set({
            ...emptyDeviceSession(v.sessionDate),
            deviceName: v.deviceName,
          });
          this.refresh();
        }
      });
  }
}
