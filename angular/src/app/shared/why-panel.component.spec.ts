import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach } from "vitest";
import {
  LucideAngularModule,
  Info,
  ChevronDown,
  ChevronUp,
  Target,
  ShieldAlert,
  CloudSun,
  Activity,
  BatteryLow,
  Clock,
  Repeat,
  User,
} from "lucide-angular";
import { WhyPanelComponent } from "./why-panel.component";
import type { DailyPrescription } from "../core/models/prescription.models";

function mount(rx: Partial<DailyPrescription> | null, includeBase = true) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      WhyPanelComponent,
      LucideAngularModule.pick({
        Info,
        ChevronDown,
        ChevronUp,
        Target,
        ShieldAlert,
        CloudSun,
        Activity,
        BatteryLow,
        Clock,
        Repeat,
        User,
      }),
    ],
  });
  const fixture = TestBed.createComponent(WhyPanelComponent);
  fixture.componentRef.setInput("rx", rx);
  fixture.componentRef.setInput("includeBase", includeBase);
  fixture.detectChanges();
  return fixture;
}

describe("WhyPanelComponent", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("renders nothing when there is no prescription", () => {
    const f = mount(null);
    expect(f.componentInstance.entries().length).toBe(0);
    expect(f.nativeElement.textContent.trim()).toBe("");
  });

  it("renders nothing when no guards fired and base is excluded", () => {
    const f = mount({ reasoning: "Strength focus." }, false);
    expect(f.componentInstance.entries().length).toBe(0);
  });

  it("includes the base plan sentence only when includeBase is true", () => {
    expect(
      mount({ reasoning: "Strength focus." }, true)
        .componentInstance.entries()
        .some((e) => e.title === "Today's plan"),
    ).toBe(true);
    expect(
      mount({ reasoning: "Strength focus." }, false)
        .componentInstance.entries()
        .some((e) => e.title === "Today's plan"),
    ).toBe(false);
  });

  it("surfaces one entry per fired guard, never a fabricated one", () => {
    const f = mount(
      {
        reasoning: "Base.",
        injuryAdjustment: {
          regions: ["hamstring"],
          severity: "moderate",
          summary: "load reduced",
        },
        weatherAdjustment: {
          applied: true,
          action: "scale",
          originalIntent: "strength",
          adjustedIntent: "technical",
          heatLoadFactor: 1.2,
          reason: "Hot — volume trimmed.",
        },
        cnsRecoveryAdjustment: {
          hoursSinceLastHighCns: 18,
          windowHours: 48,
          originalIntent: "sprint",
        },
        timeShift: {
          fromHour: 14,
          toHour: 20,
          fromWbgt: 32,
          toWbgt: 27,
          message: "Train at 20:00.",
        },
        secondSession: {
          intent: "technical",
          intentLabel: "Technical",
          targetRpe: 5,
          targetMinutes: 45,
          reasoning: "Evening skills block.",
        },
        positionEmphasis: {
          position: "qb",
          label: "Quarterback",
          focus: ["shoulder"],
          note: "Protect the throwing shoulder.",
        },
      },
      false,
    );
    const titles = f.componentInstance.entries().map((e) => e.title);
    // Injury precedes weather; base excluded.
    expect(titles).toEqual([
      "Injury / tightness",
      "Weather",
      "Nervous-system recovery",
      "Train in the cooler hour",
      "Evening session",
      "Position focus · Quarterback",
    ]);
  });

  it("does not surface a weather entry when the guard did not apply", () => {
    const f = mount(
      {
        weatherAdjustment: {
          applied: false,
          action: "none",
          originalIntent: "strength",
          adjustedIntent: "strength",
          heatLoadFactor: 1,
          reason: "",
        },
      },
      false,
    );
    expect(
      f.componentInstance.entries().some((e) => e.title === "Weather"),
    ).toBe(false);
  });
});
