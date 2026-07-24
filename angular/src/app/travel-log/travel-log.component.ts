import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";
import { LucideAngularModule } from "lucide-angular";

import {
  EventTravelService,
  type TravelMode,
} from "../core/services/event-travel.service";

const MODES: { value: TravelMode; label: string }[] = [
  { value: "car", label: "Car" },
  { value: "bus", label: "Bus" },
  { value: "plane", label: "Plane" },
  { value: "train", label: "Train" },
  { value: "other", label: "Other" },
];

/**
 * Travel log (athlete self-service) — closes the "declared via API only, no
 * in-app entry form" gap (docs/SOURCE_OF_TRUTH.md §4a/§4b, 2026-07-24/25).
 * `EventTravelService.create()`/`remove()` already did all the work; this is
 * the missing UI. A declared leg feeds the wellness travel-hours suggestion
 * and the V2.4 heat/cold acclimatization + arrival-day load-cap guards — see
 * the service's own doc comment.
 */
@Component({
  selector: "app-travel-log",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, LucideAngularModule],
  templateUrl: "./travel-log.component.html",
  styleUrl: "./travel-log.component.scss",
})
export class TravelLogComponent {
  private readonly travel = inject(EventTravelService);

  readonly modes = MODES;
  readonly legs = computed(() =>
    [...this.travel.legs()].sort(
      (a, b) => new Date(b.departAt).getTime() - new Date(a.departAt).getTime(),
    ),
  );
  readonly loading = this.travel.loading;

  readonly mode = signal<TravelMode>("car");
  readonly departAt = signal("");
  readonly arriveAt = signal("");
  readonly overnightStay = signal(false);
  readonly notes = signal("");

  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly removingId = signal<string | null>(null);

  readonly canSave = computed(
    () => !!this.departAt() && !!this.arriveAt() && !this.saving(),
  );

  async save(): Promise<void> {
    if (!this.canSave()) return;
    if (new Date(this.arriveAt()) < new Date(this.departAt())) {
      this.formError.set("Arrival must be on or after departure.");
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    try {
      await this.travel.create({
        mode: this.mode(),
        departAt: this.departAt(),
        arriveAt: this.arriveAt(),
        overnightStay: this.overnightStay(),
        notes: this.notes().trim() || null,
      });
      this.mode.set("car");
      this.departAt.set("");
      this.arriveAt.set("");
      this.overnightStay.set(false);
      this.notes.set("");
    } catch (err) {
      this.formError.set(
        err instanceof Error ? err.message : "Could not add travel leg",
      );
    } finally {
      this.saving.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    this.removingId.set(id);
    try {
      await this.travel.remove(id);
    } catch {
      // Service already surfaces this via travel.error(); nothing else to do.
    } finally {
      this.removingId.set(null);
    }
  }

  hours(leg: { departAt: string; arriveAt: string }): number {
    return Math.round(
      (new Date(leg.arriveAt).getTime() - new Date(leg.departAt).getTime()) /
        3_600_000,
    );
  }

  modeLabel(mode: TravelMode): string {
    return MODES.find((m) => m.value === mode)?.label ?? mode;
  }

  modeIcon(mode: TravelMode): string {
    switch (mode) {
      case "plane":
        return "plane";
      case "bus":
        return "bus";
      case "train":
        return "train-front";
      case "car":
        return "car";
      default:
        return "map-pin";
    }
  }
}
