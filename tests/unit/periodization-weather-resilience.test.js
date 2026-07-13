import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * 2026-07-13 — live production 500 on /api/periodization-prescription. Root
 * cause: getWeatherData returns null on any provider/geocoding failure (Open-
 * Meteo / Nominatim timeout), but resolveWeather did `data.temp` on that null →
 * TypeError → the assembly Promise.all rejected → the whole prescription 500'd.
 * Weather is a NON-CRITICAL guard — a provider hiccup must degrade to "no
 * weather", never take down the athlete's plan. Locked here.
 */

// Mock the weather module the endpoint imports: a resolvable city, but the
// provider yields null (the exact failure that crashed production).
vi.mock("../../netlify/functions/weather.js", () => ({
  resolveTeamHomeCity: vi.fn(async () => "Ljubljana"),
  getWeatherData: vi.fn(async () => null),
}));

const { __test__ } = await import(
  "../../netlify/functions/periodization-prescription.js"
);
const weatherModule = await import("../../netlify/functions/weather.js");
const { resolveWeather } = __test__;

describe("resolveWeather — a null/failed weather provider never 500s the plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    weatherModule.resolveTeamHomeCity.mockResolvedValue("Ljubljana");
  });

  it("returns null (not a throw) when getWeatherData yields null", async () => {
    weatherModule.getWeatherData.mockResolvedValue(null);
    await expect(resolveWeather("user-1")).resolves.toBeNull();
  });

  it("returns null when the provider throws outright", async () => {
    weatherModule.getWeatherData.mockRejectedValue(new Error("Open-Meteo 503"));
    await expect(resolveWeather("user-1")).resolves.toBeNull();
  });

  it("returns null when geocoding (home-city lookup) throws", async () => {
    weatherModule.resolveTeamHomeCity.mockRejectedValue(new Error("Nominatim timeout"));
    await expect(resolveWeather("user-1")).resolves.toBeNull();
  });

  it("still maps real weather through when the provider succeeds", async () => {
    weatherModule.getWeatherData.mockResolvedValue({
      temp: 27,
      apparentC: 29,
      condition: "clear",
      weatherCode: 0,
      precipMm: 0,
      windKmh: 6,
    });
    await expect(resolveWeather("user-1")).resolves.toMatchObject({
      tempC: 27,
      apparentC: 29,
      condition: "clear",
    });
  });
});
