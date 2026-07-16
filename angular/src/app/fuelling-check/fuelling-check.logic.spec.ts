import { describe, it, expect } from "vitest";
import {
  FUELLING_QUESTIONS,
  deriveFuellingResult,
  FORBIDDEN_OUTPUT,
  type FuellingResult,
} from "./fuelling-check.logic";

const NONE: Record<string, boolean> = {};

function all(ids: string[]): Record<string, boolean> {
  return Object.fromEntries(ids.map((id) => [id, true]));
}

describe("fuelling-check anti-harm logic", () => {
  it("no answers → ‘ok’, does not route to a human", () => {
    const r = deriveFuellingResult(NONE, false);
    expect(r.level).toBe("ok");
    expect(r.routeToHuman).toBe(false);
  });

  it("deliberate restriction → ‘talk’ and routes to a human (reframes, never endorses)", () => {
    const r = deriveFuellingResult({ restrict: true }, false);
    expect(r.level).toBe("talk");
    expect(r.routeToHuman).toBe(true);
    expect(r.body).toMatch(/under-fuelled|RED-S/i);
  });

  it("any single high flag → ‘talk’ + route to human", () => {
    for (const id of ["unintended_loss", "bone"]) {
      const r = deriveFuellingResult({ [id]: true }, false);
      expect(r.level).toBe("talk");
      expect(r.routeToHuman).toBe(true);
    }
  });

  it("two general flags (no high) → ‘watch’ + route to human", () => {
    const r = deriveFuellingResult({ under_eat: true, recovery: true }, false);
    expect(r.level).toBe("watch");
    expect(r.routeToHuman).toBe(true);
  });

  it("one general flag only → still ‘ok’", () => {
    expect(deriveFuellingResult({ illness: true }, false).level).toBe("ok");
  });

  it("echoes what was flagged (educational, not a verdict)", () => {
    const r = deriveFuellingResult({ bone: true, illness: true }, false);
    expect(r.flagged.length).toBe(2);
  });

  it("youth gets a fuelling-FOR-GROWTH note (more fuel, never less)", () => {
    const r = deriveFuellingResult({ restrict: true }, true);
    expect(r.body).toMatch(/growing|more fuel/i);
  });

  // The load-bearing safety test: NO branch may ever suggest eating less.
  it("NEVER outputs a deficit / weight-loss / eat-less message — every branch", () => {
    const ids = FUELLING_QUESTIONS.map((q) => q.id);
    const combos: Record<string, boolean>[] = [
      NONE,
      { restrict: true },
      { unintended_loss: true },
      { bone: true },
      { under_eat: true, recovery: true },
      { illness: true },
      all(ids), // everything flagged
    ];
    for (const youth of [false, true]) {
      for (const c of combos) {
        const r: FuellingResult = deriveFuellingResult(c, youth);
        // The invariant is about the tool's ADVICE (headline + body). `flagged`
        // echoes the screening questions themselves, which legitimately name the
        // risky behaviours being screened for (e.g. "eating less to lose weight").
        const advice = `${r.headline} ${r.body}`;
        expect(FORBIDDEN_OUTPUT.test(advice), advice).toBe(false);
      }
    }
  });

  it("every high flag routes to a human (no silent clinical result)", () => {
    for (const q of FUELLING_QUESTIONS.filter((x) => x.weight === "high")) {
      expect(deriveFuellingResult({ [q.id]: true }, false).routeToHuman).toBe(
        true,
      );
    }
  });
});
