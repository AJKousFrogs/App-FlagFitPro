import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { describe, it, expect } from "vitest";
import { LucideAngularModule, Info, X, BookOpen } from "lucide-angular";
import { ConceptTipComponent } from "./concept-tip.component";
import {
  ConceptTipService,
  type ConceptTip,
} from "../core/services/concept-tip.service";

function mount(tip: ConceptTip | null) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      ConceptTipComponent,
      LucideAngularModule.pick({ Info, X, BookOpen }),
    ],
    providers: [
      provideRouter([]),
      {
        provide: ConceptTipService,
        useValue: {
          resolve: () => tip,
          labelFor: () => "Training load (ACWR)",
          queryFor: () => "acwr workload",
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(ConceptTipComponent);
  fixture.componentRef.setInput("concept", "acwr");
  fixture.detectChanges();
  return fixture;
}

const sampleTip: ConceptTip = {
  label: "Training load (ACWR)",
  title: "Understanding ACWR",
  excerpt:
    "The acute-to-chronic workload ratio compares recent load to baseline.",
  entryId: "acwr_1",
  evidenceGrade: "A",
  query: "acwr workload",
};

describe("ConceptTipComponent", () => {
  it("starts collapsed and opens on click", () => {
    const f = mount(sampleTip);
    expect(f.nativeElement.querySelector(".ct-pop")).toBeNull();
    f.nativeElement.querySelector(".ct-glyph").click();
    f.detectChanges();
    expect(f.nativeElement.querySelector(".ct-pop")).not.toBeNull();
  });

  it("shows the KB excerpt and evidence grade when a tip resolves", () => {
    const f = mount(sampleTip);
    f.nativeElement.querySelector(".ct-glyph").click();
    f.detectChanges();
    const txt = f.nativeElement.textContent as string;
    expect(txt).toContain("Understanding ACWR");
    expect(txt).toContain("acute-to-chronic");
    expect(txt).toContain("Evidence A");
    expect(txt).toContain("Read more in Knowledge");
  });

  it("shows only the deep-link when the KB has no entry (no invented text)", () => {
    const f = mount(null);
    f.nativeElement.querySelector(".ct-glyph").click();
    f.detectChanges();
    const txt = f.nativeElement.textContent as string;
    expect(txt).toContain("Open Knowledge");
    expect(txt).toContain("Read more in Knowledge");
    // falls back to the concept label as the heading
    expect(txt).toContain("Training load (ACWR)");
  });
});
