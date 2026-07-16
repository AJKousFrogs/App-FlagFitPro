import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
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
  imports: [FormsModule, DecimalPipe, LucideAngularModule, SparklineComponent],
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

  // form fields
  readonly sessionDate = signal(todayIso());
  readonly deviceName = signal("");
  readonly durationMinutes = signal<number | null>(null);
  readonly totalDistanceM = signal<number | null>(null);
  readonly highSpeedDistanceM = signal<number | null>(null);
  readonly maxVelocityKmh = signal<number | null>(null);
  readonly playerLoad = signal<number | null>(null);
  readonly notes = signal("");

  /** Distance sparkline over the most recent sessions (oldest→newest). */
  readonly distanceSeries = computed(() =>
    this.history()
      .filter((m) => typeof m.totalDistanceM === "number")
      .slice(0, 14)
      .map((m) => m.totalDistanceM as number)
      .reverse(),
  );

  /** A log needs at least one real metric — never write an all-null row. */
  readonly canSave = computed(
    () =>
      !!this.sessionDate() &&
      [
        this.durationMinutes(),
        this.totalDistanceM(),
        this.highSpeedDistanceM(),
        this.maxVelocityKmh(),
        this.playerLoad(),
      ].some((v) => typeof v === "number" && v > 0),
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
    this.saving.set(true);
    this.saved.set(false);
    this.externalLoad
      .log({
        sessionDate: this.sessionDate(),
        source: "manual",
        deviceName: this.deviceName() || null,
        durationMinutes: this.durationMinutes(),
        totalDistanceM: this.totalDistanceM(),
        highSpeedDistanceM: this.highSpeedDistanceM(),
        maxVelocityKmh: this.maxVelocityKmh(),
        playerLoad: this.playerLoad(),
        notes: this.notes() || null,
      })
      .subscribe((row) => {
        this.saving.set(false);
        if (row) {
          this.saved.set(true);
          // reset the numeric fields; keep the date for a quick second entry
          this.durationMinutes.set(null);
          this.totalDistanceM.set(null);
          this.highSpeedDistanceM.set(null);
          this.maxVelocityKmh.set(null);
          this.playerLoad.set(null);
          this.notes.set("");
          this.refresh();
        }
      });
  }
}
