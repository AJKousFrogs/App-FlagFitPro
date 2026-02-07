import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { BodyCompositionService } from "./body-composition.service";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";

const mockSupabaseService = {
  client: {},
};

const mockAuthService = {
  getUser: () => null,
  currentUser: () => null,
};

const mockLoggerService = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  success: () => undefined,
};

describe("BodyCompositionService", () => {
  let service: BodyCompositionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BodyCompositionService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(BodyCompositionService);
  });

  it("calculates BMI and handles invalid inputs", () => {
    expect(service.calculateBMI(80, 180)).toBe(24.7);
    expect(service.calculateBMI(0, 180)).toBe(0);
    expect(service.calculateBMI(80, 0)).toBe(0);
  });

  it("classifies BMI categories", () => {
    expect(service.getBMICategory(18.4).category).toBe("Underweight");
    expect(service.getBMICategory(24).category).toBe("Normal");
    expect(service.getBMICategory(27.5).category).toBe("Overweight");
    expect(service.getBMICategory(31).category).toBe("Obese");
  });

  it("calculates lean body mass and guards invalid body fat", () => {
    expect(service.calculateLeanBodyMass(80, 20)).toBe(64.0);
    expect(service.calculateLeanBodyMass(80, -5)).toBe(80);
    expect(service.calculateLeanBodyMass(80, 120)).toBe(80);
  });
});
