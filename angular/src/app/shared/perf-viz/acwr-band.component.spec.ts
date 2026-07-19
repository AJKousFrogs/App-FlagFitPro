/**
 * acwr-band.component.ts render spec.
 *
 * This component replaced app-acwr-trend on Stats and /acwr (2026-07-19) — a
 * plain line → the same line read against its risk-zone bands, which is the
 * point of ACWR. It had geometry coverage (perf-viz.geometry.spec.ts) but no
 * RENDER test, and it now backs the app's most safety-critical visualization on
 * two screens, so this pins what it actually draws:
 *
 *  - the three advisory zones always render (safe / caution / danger),
 *  - the endpoint marker's zone class matches where the latest ratio sits
 *    (the one thing that must not lie — it's how an athlete reads their state),
 *  - < 2 points shows an honest empty message, never a fabricated trend,
 *  - the aria label conveys ratio + zone + safe band (audit-V1 a11y contract,
 *    which moved from the /acwr screen into this component in the swap).
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach } from "vitest";
import { Component, signal } from "@angular/core";
import { AcwrBandComponent } from "./acwr-band.component";

@Component({
  imports: [AcwrBandComponent],
  template: `<app-ff-acwr-band [series]="series()" />`,
})
class Host {
  readonly series = signal<number[]>([]);
}

function mount(series: number[]) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [Host] });
  const f = TestBed.createComponent(Host);
  f.componentInstance.series.set(series);
  f.detectChanges();
  return f;
}

const svg = (f: ReturnType<typeof mount>) =>
  f.nativeElement.querySelector("svg");

describe("AcwrBandComponent — renders the zones", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("draws all three advisory zones for a real series", () => {
    const f = mount([0.9, 1.0, 1.1, 1.2, 1.25]);
    const el = f.nativeElement;
    expect(el.querySelector(".b-safe")).toBeTruthy();
    expect(el.querySelector(".b-caut")).toBeTruthy();
    expect(el.querySelector(".b-dang")).toBeTruthy();
    expect(el.querySelector("path.ln")).toBeTruthy(); // the line itself
  });

  it("uses the adult default thresholds unless overridden", () => {
    // aria states the safe band, which is driven by sweetLow/sweetHigh inputs.
    const f = mount([1.0, 1.1, 1.2]);
    expect(svg(f).getAttribute("aria-label")).toContain("0.8 to 1.3");
  });
});

describe("AcwrBandComponent — the endpoint tells the truth about the zone", () => {
  beforeEach(() => TestBed.resetTestingModule());

  // The endpoint circle + value carry a zone class; an athlete reads their
  // current state from its colour, so it must match where the latest ratio is.
  function endpointZone(series: number[]): string {
    const f = mount(series);
    return svg(f).querySelector("circle.end")?.getAttribute("class") ?? "";
  }

  it("a sweet-spot latest ratio → safe endpoint", () => {
    expect(endpointZone([0.9, 1.0, 1.1])).toMatch(/safe|good/);
  });

  it("an elevated latest ratio (>1.3) → caution endpoint", () => {
    expect(endpointZone([1.0, 1.2, 1.4])).toContain("caut");
  });

  it("a danger latest ratio (>1.5) → danger endpoint", () => {
    expect(endpointZone([1.0, 1.3, 1.7])).toContain("dang");
  });

  it("labels the endpoint with the latest value", () => {
    const f = mount([0.9, 1.0, 1.18]);
    expect(svg(f).querySelector("text.val")?.textContent?.trim()).toContain(
      "1.18",
    );
  });
});

describe("AcwrBandComponent — honest empty state", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("shows a message, not a chart, for fewer than 2 points", () => {
    const f = mount([1.1]);
    expect(svg(f)).toBeNull();
    expect(f.nativeElement.textContent).toContain("Not enough");
  });

  it("shows the message for an empty series (never a fabricated line)", () => {
    const f = mount([]);
    expect(svg(f)).toBeNull();
  });
});
