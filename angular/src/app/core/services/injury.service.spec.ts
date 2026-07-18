/**
 * injury.service.ts — `resource()` migration.
 *
 * Safety-critical: `restrictions` feeds the engine's injury guard, which
 * down-regulates sprint/high-intensity work. Two things are pinned here.
 *
 * 1. The LOGOUT CLEAR. PeriodizationService used to reach in and call
 *    `injury.active.set([])` on sign-out, specifically so a second athlete on
 *    the same device could never be planned against the first one's injury.
 *    That external write is gone — the userId key does it — so the leak it
 *    guarded against has to be proven closed here instead.
 *
 * 2. The FAIL-OPEN on a failed load, which is pre-existing: no injury data ⇒
 *    no restrictions ⇒ the guard doesn't fire. Preserved deliberately;
 *    changing it is a safety call, not a refactor.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { signal } from "@angular/core";
import { of } from "rxjs";

import { InjuryService, ActiveInjury } from "./injury.service";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

const noopLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  success: () => {},
};

const settle = () => new Promise((r) => setTimeout(r, 0));

function injury(over: Partial<ActiveInjury> = {}): ActiveInjury {
  return {
    id: "inj-1",
    injuryType: "strain",
    region: "hamstring",
    severity: "moderate",
    status: "active",
    source: "self_report",
    restrictions: ["sprint"],
    startDate: null,
    expectedReturnDate: null,
    note: null,
    ...over,
  };
}

function setup(opts: { injuries?: ActiveInjury[]; get?: unknown } = {}) {
  const userId = signal<string | null>("user-1");
  const get = vi.fn(() =>
    of(
      opts.get ?? {
        success: true,
        data: { injuries: opts.injuries ?? [injury()] },
      },
    ),
  );
  const post = vi.fn(() => of({ success: true, data: injury() }));

  TestBed.configureTestingModule({
    providers: [
      InjuryService,
      { provide: ApiService, useValue: { get, post } },
      { provide: LoggerService, useValue: noopLogger },
      { provide: SupabaseService, useValue: { userId } },
    ],
  });

  return { service: TestBed.inject(InjuryService), get, post, userId };
}

describe("InjuryService — per-user isolation (replaces the manual logout clear)", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("loads the signed-in athlete's injuries without an explicit call", async () => {
    const { service, get } = setup();
    service.active();
    await settle();
    expect(get).toHaveBeenCalledTimes(1);
    expect(service.active()).toHaveLength(1);
    expect(service.restrictions()?.restrictsSprint).toBe(true);
  });

  it("EMPTIES on sign-out — no phantom injury survives the user change", async () => {
    const { service, userId } = setup();
    service.active();
    await settle();
    expect(service.active()).toHaveLength(1);

    userId.set(null);
    await settle();

    expect(service.active()).toEqual([]);
    // The engine must see "no guard", not the previous athlete's restriction.
    expect(service.restrictions()).toBeNull();
  });

  it("re-fetches for a DIFFERENT athlete rather than reusing the first one's", async () => {
    const { service, get, userId } = setup();
    service.active();
    await settle();
    expect(get).toHaveBeenCalledTimes(1);

    userId.set("user-2");
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
  });
});

describe("InjuryService — restrictions derivation feeds the engine guard", () => {
  beforeEach(() => TestBed.resetTestingModule());

  async function restrictionsFor(injuries: ActiveInjury[]) {
    const { service } = setup({ injuries });
    service.active();
    await settle();
    return service.restrictions();
  }

  it("a sprint-restricting injury flags restrictsSprint and names the region", async () => {
    const r = await restrictionsFor([
      injury({ region: "hamstring", restrictions: ["sprint"] }),
    ]);
    expect(r?.restrictsSprint).toBe(true);
    expect(r?.regions).toContain("hamstring");
  });

  it("a throwing-restricting injury flags restrictsThrowing", async () => {
    const r = await restrictionsFor([
      injury({ region: "shoulder", restrictions: ["throwing"] }),
    ]);
    expect(r?.restrictsThrowing).toBe(true);
  });

  it("an injury with no sprint/throwing restriction yields NO guard", async () => {
    // Documents the sharp edge the game-day surface advisory works around:
    // a still-playing niggle carries no formal restriction, so restrictions()
    // is null even though active() is not empty.
    const { service } = setup({
      injuries: [injury({ region: "achilles", restrictions: [] })],
    });
    service.active();
    await settle();
    expect(service.active()).toHaveLength(1);
    expect(service.restrictions()).toBeNull();
  });

  it("takes the worst severity across flagged injuries", async () => {
    const r = await restrictionsFor([
      injury({ id: "a", severity: "minor", restrictions: ["sprint"] }),
      injury({ id: "b", severity: "severe", restrictions: ["sprint"] }),
    ]);
    expect(r?.severity).toBe("severe");
  });
});

describe("InjuryService — failed load stays FAIL-OPEN (pre-existing)", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("degrades to no-guard instead of throwing into the engine", async () => {
    const { service } = setup({ get: { success: false, error: "offline" } });
    service.active();
    await settle();
    expect(() => service.active()).not.toThrow();
    expect(() => service.restrictions()).not.toThrow();
    expect(service.active()).toEqual([]);
    expect(service.restrictions()).toBeNull();
  });
});

describe("InjuryService — report()", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("resolves only AFTER the fresh list is in (safety-path ordering)", async () => {
    const { service, get, post } = setup({ injuries: [] });
    service.active();
    await settle();
    expect(service.active()).toHaveLength(0);

    // The refetch now returns the newly-reported injury.
    get.mockReturnValue(
      of({ success: true, data: { injuries: [injury()] } }) as never,
    );
    await service.report("hamstring", "moderate");

    // No extra settle: report() must not resolve before the state is updated.
    expect(post).toHaveBeenCalledTimes(1);
    expect(service.active()).toHaveLength(1);
    expect(service.restrictions()?.restrictsSprint).toBe(true);
  });

  it("throws when the POST fails, and leaves state alone", async () => {
    const { service, post } = setup({ injuries: [] });
    service.active();
    await settle();
    post.mockReturnValue(of({ success: false, error: "nope" }) as never);
    await expect(service.report("calf", "minor")).rejects.toThrow("nope");
    expect(service.active()).toEqual([]);
  });
});
