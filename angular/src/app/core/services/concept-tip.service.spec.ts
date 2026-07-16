import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { describe, it, expect } from "vitest";
import { ConceptTipService } from "./concept-tip.service";
import { ApiService } from "./api.service";

const KB = [
  {
    id: "acwr_1",
    title: "Understanding ACWR",
    content:
      "The acute-to-chronic workload ratio compares recent training load to your rolling baseline. Keeping it roughly 0.8 to 1.3 balances fitness gains against injury risk. Sharp spikes raise risk.",
    category: "research",
    evidenceGrade: "A",
  },
  {
    id: "sleep_1",
    title: "Sleep is the primary recovery lever",
    content: "Aim for eight-plus hours. Sleep drives adaptation and readiness.",
    category: "sleep",
  },
];

function make(entries: unknown[]) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      ConceptTipService,
      { provide: ApiService, useValue: { get: () => of({ entries }) } },
    ],
  });
  return TestBed.inject(ConceptTipService);
}

describe("ConceptTipService", () => {
  it("resolves a concept to its best KB entry (title match wins)", () => {
    const t = make(KB).resolve("acwr");
    expect(t?.title).toBe("Understanding ACWR");
    expect(t?.entryId).toBe("acwr_1");
    expect(t?.evidenceGrade).toBe("A");
    expect(t?.excerpt.length).toBeLessThanOrEqual(221);
    expect(t?.excerpt).toContain("acute-to-chronic");
  });

  it("matches on body text when no title hits", () => {
    const kb = [
      {
        id: "x",
        title: "Recovery basics",
        content: "Your readiness score summarises how recovered you are today.",
        category: "general",
      },
    ];
    expect(make(kb).resolve("readiness")?.entryId).toBe("x");
  });

  it("returns null when no entry matches — never fabricates (Law #7)", () => {
    expect(make(KB).resolve("cycle-basics")).toBeNull();
  });

  it("returns null when the KB is empty (not yet loaded)", () => {
    expect(make([]).resolve("sleep")).toBeNull();
  });

  it("exposes a stable deep-link query + label per concept", () => {
    const svc = make(KB);
    expect(svc.queryFor("acwr")).toContain("acwr");
    expect(svc.labelFor("readiness")).toBe("Readiness");
  });
});
