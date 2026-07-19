/**
 * body-check.component.ts — extracted from today.component.ts (2026-07-19).
 *
 * today.component had NO unit spec at all, so this cluster's behaviour was
 * never pinned despite carrying a documented trust bug's fix. The extraction
 * was a verified byte-for-byte move (class body diffed line-for-line against
 * the original), and these tests are the safety net that was missing.
 *
 * The contract that matters is SOT Law #7: "Logged" must NEVER be shown unless
 * the writes actually landed in athlete_injuries. This card previously claimed
 * the report was saved and visible to staff while persisting nothing at all.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { of } from "rxjs";

import { BodyCheckComponent } from "./body-check.component";
import {
  InjuryService,
  InjurySeverity,
} from "../../core/services/injury.service";
import { ReadinessService } from "../../core/services/readiness.service";
import { LoggerService } from "../../core/services/logger.service";

const noopLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  success: () => {},
};

type ReportFn = (
  region: string,
  severity: InjurySeverity,
  note?: string,
) => Promise<void>;

function mount(opts: { report?: ReportFn } = {}) {
  const report = vi.fn<ReportFn>(opts.report ?? (() => Promise.resolve()));
  const calculateToday = vi.fn(() => of({}));

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [BodyCheckComponent],
    providers: [
      { provide: InjuryService, useValue: { report } },
      { provide: ReadinessService, useValue: { calculateToday } },
      { provide: LoggerService, useValue: noopLogger },
    ],
  });
  const fixture = TestBed.createComponent(BodyCheckComponent);
  fixture.detectChanges();
  return { fixture, c: fixture.componentInstance, report, calculateToday };
}

describe("BodyCheck — selection", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("starts with nothing flagged and no message", () => {
    const { c } = mount();
    expect(c.hasFlags()).toBe(false);
    expect(c.bodyMsg()).toBeNull();
    expect(c.canLogBody()).toBe(false);
  });

  it("toggles a part on and off", () => {
    const { c } = mount();
    c.togglePart("Hamstring");
    expect(c.isPartOn("Hamstring")).toBe(true);
    expect(c.hasFlags()).toBe(true);
    c.togglePart("Hamstring");
    expect(c.isPartOn("Hamstring")).toBe(false);
    expect(c.hasFlags()).toBe(false);
  });

  it("clears severity when the last part is deselected", () => {
    const { c } = mount();
    c.togglePart("Calf");
    c.setSeverity("sharp");
    expect(c.isSev("sharp")).toBe(true);
    c.togglePart("Calf");
    expect(c.isSev("sharp")).toBe(false);
  });

  it("'None — all clear' wipes the selection and says so", () => {
    const { c } = mount();
    c.togglePart("Knee");
    c.setSeverity("mild");
    c.clearBody();
    expect(c.hasFlags()).toBe(false);
    expect(c.isNoneOn()).toBe(true);
    expect(c.bodyMsg()?.text).toContain("All clear");
  });

  it("groups parts, and every part carries a region for the API", () => {
    const { c } = mount();
    for (const g of c.bodyGroups) {
      const parts = c.partsFor(g);
      expect(parts.length).toBeGreaterThan(0);
      for (const p of parts) {
        expect(p.group).toBe(g);
        expect(p.region.trim()).not.toBe("");
      }
    }
  });
});

describe("BodyCheck — can't log until it's answerable", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("needs BOTH a part and a severity", () => {
    const { c } = mount();
    expect(c.canLogBody()).toBe(false);
    c.togglePart("Achilles");
    expect(c.canLogBody()).toBe(false); // part but no severity
    c.setSeverity("mild");
    expect(c.canLogBody()).toBe(true);
  });

  it("prompts for severity once a part is picked", () => {
    const { c } = mount();
    c.togglePart("Achilles");
    expect(c.bodyMsg()?.text).toContain("pick severity");
  });

  it("says it's ready once severity is set", () => {
    const { c } = mount();
    c.togglePart("Achilles");
    c.setSeverity("moderate");
    expect(c.bodyMsg()?.text).toContain("Ready");
  });

  it("logBody is a no-op when nothing is selected", async () => {
    const { c, report } = mount();
    await c.logBody();
    expect(report).not.toHaveBeenCalled();
    expect(c.bodyLogState()).toBe("idle");
  });
});

describe("BodyCheck — Law #7: 'Logged' only after the write lands", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("reports EVERY flagged region, with the mapped severity", async () => {
    const { c, report } = mount();
    c.togglePart("Hamstring");
    c.togglePart("Calf");
    c.setSeverity("sharp");
    await c.logBody();

    expect(report).toHaveBeenCalledTimes(2);
    // sharp maps to the API's "severe"
    expect(report.mock.calls.map((x) => x[1])).toEqual(["severe", "severe"]);
    expect(report.mock.calls.map((x) => x[0]).sort()).toEqual([
      "calf",
      "hamstring",
    ]);
  });

  it.each([
    ["mild", "minor"],
    ["moderate", "moderate"],
    ["sharp", "severe"],
  ])("maps %s → %s", async (ui, api) => {
    const { c, report } = mount();
    c.togglePart("Knee");
    c.setSeverity(ui);
    await c.logBody();
    expect(report.mock.calls[0][1]).toBe(api);
  });

  it("shows 'Logged' and recalculates readiness on success", async () => {
    const { c, calculateToday } = mount();
    c.togglePart("Groin / adductor");
    c.setSeverity("mild");
    await c.logBody();

    expect(c.bodyLogState()).toBe("saved");
    expect(c.bodyMsg()?.text).toContain("Logged:");
    expect(c.bodyMsg()?.text).toContain("Groin / adductor");
    // the plan has to react to the new restriction
    expect(calculateToday).toHaveBeenCalledTimes(1);
  });

  it("does NOT claim 'Logged' when the write fails — the trust bug", async () => {
    const { c, calculateToday } = mount({
      report: () => Promise.reject(new Error("offline")),
    });
    c.togglePart("Shoulder");
    c.setSeverity("moderate");
    await c.logBody();

    expect(c.bodyLogState()).toBe("error");
    expect(c.bodyMsg()?.text).toContain("Couldn't log that");
    expect(c.bodyMsg()?.text).not.toContain("Logged:");
    // nothing was persisted, so nothing should be recalculated either
    expect(calculateToday).not.toHaveBeenCalled();
  });

  it("keeps the athlete's selection after a failure so they can retry", async () => {
    const { c } = mount({
      report: () => Promise.reject(new Error("offline")),
    });
    c.togglePart("Ankle");
    c.setSeverity("mild");
    await c.logBody();
    expect(c.isPartOn("Ankle")).toBe(true);
  });

  it("clears the selection after a SUCCESSFUL log", async () => {
    const { c } = mount();
    c.togglePart("Ankle");
    c.setSeverity("mild");
    await c.logBody();
    expect(c.isPartOn("Ankle")).toBe(false);
    expect(c.hasFlags()).toBe(false);
  });

  it("severity drives the message's tone and guidance", async () => {
    for (const [sev, expected, cls] of [
      ["mild", "auto-clears in 2 days", ""],
      ["moderate", "easy session only", "is-warn"],
      ["sharp", "recovery only", "is-danger"],
    ] as const) {
      const { c } = mount();
      c.togglePart("Knee");
      c.setSeverity(sev);
      await c.logBody();
      expect(c.bodyMsg()?.text).toContain(expected);
      expect(c.bodyMsg()?.cls).toBe(cls);
    }
  });
});

describe("BodyCheck — renders", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("renders the card with its groups and the all-clear chip", () => {
    const { fixture } = mount();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain("Body check");
    expect(text).toContain("None — all clear");
    expect(text).toContain("Lower body");
    expect(text).toContain("Hamstring");
  });

  it("reveals the severity row only once something is flagged", () => {
    const { fixture, c } = mount();
    expect(fixture.nativeElement.textContent).not.toContain("Worst one");
    c.togglePart("Calf");
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Worst one");
  });
});
