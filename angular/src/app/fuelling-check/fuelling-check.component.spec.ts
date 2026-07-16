import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { describe, it, expect } from "vitest";
import {
  LucideAngularModule,
  HeartPulse,
  AlertTriangle,
  Info,
  Check,
  Apple,
} from "lucide-angular";
import { FuellingCheckComponent } from "./fuelling-check.component";
import { SupabaseService } from "../core/services/supabase.service";
import { FUELLING_QUESTIONS } from "./fuelling-check.logic";

function mount(metadata: Record<string, unknown> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      FuellingCheckComponent,
      LucideAngularModule.pick({
        HeartPulse,
        AlertTriangle,
        Info,
        Check,
        Apple,
      }),
    ],
    providers: [
      provideRouter([]),
      {
        provide: SupabaseService,
        useValue: { currentUser: () => ({ user_metadata: metadata }) },
      },
    ],
  });
  const fixture = TestBed.createComponent(FuellingCheckComponent);
  fixture.detectChanges();
  return fixture;
}

function answerAll(
  c: FuellingCheckComponent,
  value: boolean,
  overrides: Record<string, boolean> = {},
) {
  for (const q of FUELLING_QUESTIONS) c.answer(q.id, value);
  for (const [id, v] of Object.entries(overrides)) c.answer(id, v);
}

describe("FuellingCheckComponent", () => {
  it("renders every screening question", () => {
    const f = mount();
    expect(f.nativeElement.querySelectorAll(".q").length).toBe(
      FUELLING_QUESTIONS.length,
    );
  });

  it("gates the result until every question is answered", () => {
    const f = mount();
    const c = f.componentInstance;
    expect(c.allAnswered()).toBe(false);
    c.submit();
    expect(c.result()).toBeNull();
    answerAll(c, false);
    expect(c.allAnswered()).toBe(true);
    c.submit();
    f.detectChanges();
    expect(c.result()?.level).toBe("ok");
    expect(c.result()?.routeToHuman).toBe(false);
  });

  it("restriction → routes to a human, and shows the route callout", () => {
    const f = mount();
    const c = f.componentInstance;
    answerAll(c, false, { restrict: true });
    c.submit();
    f.detectChanges();
    expect(c.result()?.level).toBe("talk");
    expect(c.result()?.routeToHuman).toBe(true);
    const txt = f.nativeElement.textContent as string;
    expect(txt).toContain("nutrition or medical staff");
  });

  it("a youth (under 18) gets the fuelling-for-growth note", () => {
    const f = mount({ date_of_birth: "2009-06-01" }); // 17 on 2026-07-16
    const c = f.componentInstance;
    expect(c.isYouth()).toBe(true);
    answerAll(c, false, { restrict: true });
    c.submit();
    expect(c.result()?.body).toMatch(/growing|more fuel/i);
  });

  it("retake clears answers and returns to the questions", () => {
    const f = mount();
    const c = f.componentInstance;
    answerAll(c, false);
    c.submit();
    expect(c.result()).not.toBeNull();
    c.retake();
    expect(c.result()).toBeNull();
    expect(c.answeredCount()).toBe(0);
  });
});
