import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { describe, it, expect } from "vitest";
import {
  LucideAngularModule,
  Utensils,
  Calendar,
  User,
  Apple,
  Info,
} from "lucide-angular";
import { NutritionComponent } from "./nutrition.component";
import { PeriodizationService } from "../core/services/periodization.service";
import { ScheduleService } from "../core/services/schedule.service";
import type { DailyPrescription } from "../core/models/prescription.models";

function day(over: Partial<DailyPrescription>): DailyPrescription {
  return {
    date: "2026-07-16",
    phase: "in_season",
    intent: "strength",
    intentLabel: "Strength",
    targetRpe: 7,
    targetMinutes: 90,
    sprintReps: 0,
    strengthSets: 18,
    reasoning: "Base.",
    recoveryEmphasis: "medium",
    nutrition: null,
    ...over,
  } as DailyPrescription;
}

function mount(opts: {
  loading?: boolean;
  today?: DailyPrescription | null;
  week?: DailyPrescription[];
}) {
  const today = signal<DailyPrescription | null>(opts.today ?? null);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      NutritionComponent,
      LucideAngularModule.pick({ Utensils, Calendar, User, Apple, Info }),
    ],
    providers: [
      provideRouter([]),
      {
        provide: PeriodizationService,
        useValue: { today, weekAhead: () => opts.week ?? [] },
      },
      {
        provide: ScheduleService,
        useValue: { loading: signal(opts.loading ?? false) },
      },
    ],
  });
  const fixture = TestBed.createComponent(NutritionComponent);
  fixture.detectChanges();
  return fixture;
}

describe("NutritionComponent", () => {
  it("prompts to log a schedule when there is no prescription", () => {
    const txt = mount({ today: null }).nativeElement.textContent as string;
    expect(txt).toContain("Log your season");
    expect(txt).not.toContain("Carbs"); // no fabricated macro card
  });

  it("shows an add-weight state when the engine returns null nutrition (Law #7)", () => {
    const txt = mount({
      today: day({ nutrition: null }),
      week: [day({ nutrition: null })],
    }).nativeElement.textContent as string;
    expect(txt).toContain("Add your weight");
    // never a fake number
    expect(txt).not.toMatch(/\d+\s*g\b/);
  });

  it("renders the engine's macro targets when present, never recomputed", () => {
    const txt = mount({
      today: day({
        nutrition: {
          carbsG: 412,
          proteinG: 138,
          hydrationL: 3.2,
          rationale: "High-load strength day.",
        },
      }),
      week: [
        day({
          nutrition: {
            carbsG: 412,
            proteinG: 138,
            hydrationL: 3.2,
            rationale: "x",
          },
        }),
      ],
    }).nativeElement.textContent as string;
    expect(txt).toContain("412");
    expect(txt).toContain("138");
    expect(txt).toContain("High-load strength day.");
    expect(txt).toContain("How to hit it today");
  });

  it("scales the week bars off the engine carbs (relative %), never a guess", () => {
    const f = mount({
      today: day({
        nutrition: {
          carbsG: 400,
          proteinG: 130,
          hydrationL: 3,
          rationale: "x",
        },
      }),
      week: [
        day({
          date: "2026-07-16",
          nutrition: {
            carbsG: 400,
            proteinG: 130,
            hydrationL: 3,
            rationale: "x",
          },
        }),
        day({
          date: "2026-07-17",
          intent: "rest",
          nutrition: {
            carbsG: 200,
            proteinG: 130,
            hydrationL: 2,
            rationale: "y",
          },
        }),
      ],
    });
    const bars = f.componentInstance.weekFuel();
    expect(bars[0].carbsPct).toBe(100); // the max day
    expect(bars[1].carbsPct).toBe(50); // half the carbs → half the bar
    expect(bars[1].bucket).toBe("steady");
  });
});
