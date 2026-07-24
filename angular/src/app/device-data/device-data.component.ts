import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { DecimalPipe } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
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

const MAX_APPLE_HEALTH_XML_BYTES = 5 * 1024 * 1024;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Device data (athlete self-service). Wires the real `/api/external-load` lane —
 * an athlete reads objective session metrics off their watch/GPS and logs them,
 * feeding the objective-load side of ACWR. It also drives the wearable
 * OAuth-connect flow (`/api/wearables/connect/:provider` → vendor authorize
 * URL → this app navigates itself, since the request is Bearer-authenticated
 * and can't be a plain `<a href>`), per-source ingestion consent
 * (`wearable_consent`), and a manual Apple Health `export.xml` upload (Apple
 * has no server-to-server API). Nothing is fabricated (Law #7): empty history
 * shows an empty state, not zeros; a device with no vendor credentials
 * configured yet honestly reports "not connected" rather than faking success.
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
  private readonly route = inject(ActivatedRoute);

  readonly history = signal<ExternalLoadMetric[]>([]);
  readonly devices = signal<DeviceStatus[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);

  /** Set when the OAuth callback redirected back here with `?connected=<provider>`. */
  readonly justConnected = signal<string | null>(null);
  readonly connectingProvider = signal<string | null>(null);
  readonly connectError = signal<string | null>(null);
  readonly consentBusyProvider = signal<string | null>(null);

  readonly appleHealthBusy = signal(false);
  readonly appleHealthMsg = signal<string | null>(null);

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
    this.refreshDevices();
    this.justConnected.set(
      this.route.snapshot.queryParamMap.get("connected"),
    );
  }

  private refresh(): void {
    this.loading.set(true);
    this.externalLoad.list().subscribe((rows) => {
      this.history.set(rows);
      this.loading.set(false);
    });
  }

  private refreshDevices(): void {
    this.wearables.status().subscribe((d) => this.devices.set(d));
  }

  async connectDevice(providerKey: string): Promise<void> {
    if (this.connectingProvider()) return;
    this.connectingProvider.set(providerKey);
    this.connectError.set(null);
    const url = await this.wearables.connect(providerKey);
    if (url) {
      window.location.href = url;
      return;
    }
    this.connectError.set(
      "Couldn't start the connection — try again in a moment.",
    );
    this.connectingProvider.set(null);
  }

  async toggleConsent(device: DeviceStatus): Promise<void> {
    if (this.consentBusyProvider()) return;
    const nextState = device.consentState === "granted" ? "revoked" : "granted";
    this.consentBusyProvider.set(device.id);
    const ok = await this.wearables.setConsent(device.id, nextState);
    this.consentBusyProvider.set(null);
    if (ok) {
      this.refreshDevices();
    }
  }

  async onAppleHealthFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    if (file.size > MAX_APPLE_HEALTH_XML_BYTES) {
      this.appleHealthMsg.set(
        `That export is too large (${Math.round(file.size / 1024 / 1024)}MB) — export a shorter date range from the Health app.`,
      );
      return;
    }

    this.appleHealthBusy.set(true);
    this.appleHealthMsg.set(null);
    const xml = await file.text();
    const result = await this.wearables.uploadAppleHealthXml(xml);
    this.appleHealthBusy.set(false);

    if (result.ok) {
      const { recordCount, skippedCount, truncated } = result.data;
      this.appleHealthMsg.set(
        `Imported ${recordCount - skippedCount} of ${recordCount} readings.` +
          (truncated ? " (export truncated to the size limit)" : ""),
      );
      this.refreshDevices();
    } else {
      this.appleHealthMsg.set(result.error);
    }
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
