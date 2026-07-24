import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  LucideAngularModule,
  ChevronRight,
  Plane,
  Bus,
  Car,
  TrainFront,
  MapPin,
  Trash2,
} from "lucide-angular";
import { TravelLogComponent } from "./travel-log.component";
import {
  EventTravelService,
  type EventTravelLeg,
} from "../core/services/event-travel.service";

function leg(over: Partial<EventTravelLeg>): EventTravelLeg {
  return {
    id: "leg-1",
    competitionEventId: null,
    teamId: null,
    mode: "plane",
    departAt: "2026-07-20T08:00:00.000Z",
    arriveAt: "2026-07-20T12:00:00.000Z",
    timezoneDeltaHours: null,
    adaptationDay: null,
    overnightStay: true,
    notes: "Adria Bowl",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...over,
  };
}

function mount(opts: {
  legs?: EventTravelLeg[];
  loading?: boolean;
  create?: ReturnType<typeof vi.fn>;
  remove?: ReturnType<typeof vi.fn>;
}) {
  const legsSignal = signal(opts.legs ?? []);
  const loadingSignal = signal(opts.loading ?? false);
  const create = opts.create ?? vi.fn(async () => leg({}));
  const remove = opts.remove ?? vi.fn(async () => undefined);

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      TravelLogComponent,
      LucideAngularModule.pick({
        ChevronRight,
        Plane,
        Bus,
        Car,
        TrainFront,
        MapPin,
        Trash2,
      }),
    ],
    providers: [
      provideRouter([]),
      {
        provide: EventTravelService,
        useValue: {
          legs: legsSignal,
          loading: loadingSignal,
          create,
          remove,
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(TravelLogComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, create, remove };
}

describe("TravelLogComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cannot save until both depart and arrive are set", () => {
    const { component } = mount({});
    expect(component.canSave()).toBe(false);
    component.departAt.set("2026-07-20T08:00");
    expect(component.canSave()).toBe(false);
    component.arriveAt.set("2026-07-20T12:00");
    expect(component.canSave()).toBe(true);
  });

  it("rejects an arrival before departure without calling create()", async () => {
    const { component, create } = mount({});
    component.departAt.set("2026-07-20T12:00");
    component.arriveAt.set("2026-07-20T08:00");
    await component.save();
    expect(create).not.toHaveBeenCalled();
    expect(component.formError()).toContain("Arrival must be on or after");
  });

  it("saves a valid leg and resets the form", async () => {
    const { component, create } = mount({});
    component.mode.set("bus");
    component.departAt.set("2026-07-20T08:00");
    component.arriveAt.set("2026-07-20T12:00");
    component.overnightStay.set(true);
    component.notes.set("  Copenhagen Bowl  ");

    await component.save();

    expect(create).toHaveBeenCalledWith({
      mode: "bus",
      departAt: "2026-07-20T08:00",
      arriveAt: "2026-07-20T12:00",
      overnightStay: true,
      notes: "Copenhagen Bowl",
    });
    expect(component.departAt()).toBe("");
    expect(component.arriveAt()).toBe("");
    expect(component.mode()).toBe("car");
    expect(component.formError()).toBeNull();
  });

  it("surfaces a create() failure as formError without clearing the form", async () => {
    const create = vi.fn(async () => {
      throw new Error("Could not add travel leg");
    });
    const { component } = mount({ create });
    component.departAt.set("2026-07-20T08:00");
    component.arriveAt.set("2026-07-20T12:00");

    await component.save();

    expect(component.formError()).toBe("Could not add travel leg");
    expect(component.departAt()).toBe("2026-07-20T08:00");
  });

  it("lists declared legs sorted most-recent-departure first", () => {
    const older = leg({ id: "a", departAt: "2026-07-01T08:00:00.000Z" });
    const newer = leg({ id: "b", departAt: "2026-07-20T08:00:00.000Z" });
    const { component } = mount({ legs: [older, newer] });
    expect(component.legs().map((l) => l.id)).toEqual(["b", "a"]);
  });

  it("calls remove() for a leg and clears removingId afterward", async () => {
    const { component, remove } = mount({ legs: [leg({ id: "x" })] });
    const p = component.remove("x");
    expect(component.removingId()).toBe("x");
    await p;
    expect(remove).toHaveBeenCalledWith("x");
    expect(component.removingId()).toBeNull();
  });

  it("computes rounded travel hours for a leg", () => {
    const { component } = mount({});
    const hours = component.hours(
      leg({
        departAt: "2026-07-20T08:00:00.000Z",
        arriveAt: "2026-07-20T11:30:00.000Z",
      }),
    );
    expect(hours).toBe(4); // rounds 3.5h up
  });
});
