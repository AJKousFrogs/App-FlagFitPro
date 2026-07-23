import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach } from "vitest";
import { FreezeSignalService } from "./freeze-signal.service";

describe("FreezeSignalService", () => {
  let service: FreezeSignalService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    service = TestBed.inject(FreezeSignalService);
  });

  it("starts unlocked with no flashes", () => {
    expect(service.locked()).toBe(false);
    expect(service.flashTrigger()).toBe(0);
  });

  it("setLocked toggles the ambient locked state without flashing", () => {
    service.setLocked(true);
    expect(service.locked()).toBe(true);
    expect(service.flashTrigger()).toBe(0);
    service.setLocked(false);
    expect(service.locked()).toBe(false);
  });

  it("flash() locks and increments the trigger every time, even while already locked", () => {
    service.flash();
    expect(service.locked()).toBe(true);
    expect(service.flashTrigger()).toBe(1);
    service.flash();
    expect(service.flashTrigger()).toBe(2);
  });
});
