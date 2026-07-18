/**
 * resource-last-good.ts — the four properties, pinned.
 *
 * These encode a semantic of Angular's `resource()` that is easy to get wrong
 * and invisible when you do: a FAILED RELOAD discards the previously-good
 * value. If a future Angular changes that, or someone "simplifies" this helper
 * back to `hasValue() ? value() : empty`, these fail.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach } from "vitest";
import { Injectable, resource, signal } from "@angular/core";
import { lastGoodByKey } from "./resource-last-good";

let mode: "ok" | "fail" = "ok";
let payload: string[] = ["A-data"];

@Injectable()
class Subject {
  readonly user = signal<string | null>("A");
  private readonly res = resource({
    params: () => this.user(),
    loader: async ({ params }) => {
      if (!params) return [];
      if (mode === "fail") throw new Error("boom");
      return payload;
    },
  });
  readonly data = lastGoodByKey(this.res, () => this.user(), [] as string[]);
  reload(): void {
    this.res.reload();
  }
}

const settle = () => new Promise((r) => setTimeout(r, 0));

function mount() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [Subject] });
  return TestBed.inject(Subject);
}

describe("lastGoodByKey", () => {
  beforeEach(() => {
    mode = "ok";
    payload = ["A-data"];
  });

  it("shows the loaded value", async () => {
    const s = mount();
    s.data();
    await settle();
    expect(s.data()).toEqual(["A-data"]);
  });

  it("KEEPS the previous value when a reload fails", async () => {
    const s = mount();
    s.data();
    await settle();
    mode = "fail";
    s.reload();
    await settle();
    // This is the whole point: a flaky refetch must not empty the data.
    expect(s.data()).toEqual(["A-data"]);
  });

  it("NEVER carries a value across a key change, even if the new load fails", async () => {
    const s = mount();
    s.data();
    await settle();
    expect(s.data()).toEqual(["A-data"]);

    mode = "fail";
    s.user.set("B");
    await settle();
    // Athlete B must not see athlete A's data. This is the phantom-injury leak.
    expect(s.data()).toEqual([]);
  });

  it("picks up the new key's value once it loads", async () => {
    const s = mount();
    s.data();
    await settle();
    payload = ["B-data"];
    s.user.set("B");
    await settle();
    expect(s.data()).toEqual(["B-data"]);
  });

  it("recovers after a failed reload succeeds again", async () => {
    const s = mount();
    s.data();
    await settle();
    mode = "fail";
    s.reload();
    await settle();
    expect(s.data()).toEqual(["A-data"]);

    mode = "ok";
    payload = ["A-fresh"];
    s.reload();
    await settle();
    expect(s.data()).toEqual(["A-fresh"]);
  });

  it("empties on sign-out (a null key that loads successfully)", async () => {
    const s = mount();
    s.data();
    await settle();
    s.user.set(null);
    await settle();
    expect(s.data()).toEqual([]);
  });

  it("shows emptyValue when the very first load fails (nothing good yet)", async () => {
    mode = "fail";
    const s = mount();
    s.data();
    await settle();
    expect(s.data()).toEqual([]);
  });
});
