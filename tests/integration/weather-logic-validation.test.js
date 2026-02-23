import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) =>
    options.handler(event, context, { userId: "athlete-1" }),
}));

function openMeteoResponse(overrides = {}) {
  return {
    current: {
      temperature_2m: 72,
      apparent_temperature: 72,
      relative_humidity_2m: 45,
      weather_code: 0,
      wind_speed_10m: 5,
      precipitation: 0,
      cloud_cover: 10,
      ...overrides,
    },
  };
}

describe("weather Open-Meteo logic regression coverage", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();
    global.fetch = vi.fn();
    const mod = await import("../../netlify/functions/weather.js");
    handler = mod.handler;
  });

  async function callWeather(queryStringParameters) {
    const response = await handler(
      {
        httpMethod: "GET",
        path: "/.netlify/functions/weather",
        queryStringParameters,
      },
      {},
    );
    return JSON.parse(response.body);
  }

  it("flags thunderstorm code 95 as dangerous", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => openMeteoResponse({ weather_code: 95 }),
    });

    const payload = await callWeather({ lat: "40.71", lon: "-74.00" });

    expect(payload.success).toBe(true);
    expect(payload.data.condition).toBe("Thunderstorm");
    expect(payload.data.suitable).toBe(false);
    expect(payload.data.suitability).toBe("poor");
  });

  it("flags heavy rain code 82 as poor suitability", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => openMeteoResponse({ weather_code: 82 }),
    });

    const payload = await callWeather({ lat: "34.05", lon: "-118.24" });

    expect(payload.success).toBe(true);
    expect(payload.data.condition).toBe("Heavy Rain");
    expect(payload.data.suitable).toBe(false);
    expect(payload.data.suitability).toBe("poor");
  });

  it("uses precipitation intensity as a hard-stop safety signal", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () =>
        openMeteoResponse({
          weather_code: 0,
          precipitation: 0.2,
          wind_speed_10m: 4,
          temperature_2m: 70,
          apparent_temperature: 70,
        }),
    });

    const payload = await callWeather({ lat: "41.88", lon: "-87.63" });

    expect(payload.success).toBe(true);
    expect(payload.data.suitable).toBe(false);
    expect(payload.data.suitability).toBe("poor");
  });

  it("returns excellent for ideal clear and calm conditions", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () =>
        openMeteoResponse({
          weather_code: 0,
          temperature_2m: 70,
          apparent_temperature: 70,
          wind_speed_10m: 4,
          precipitation: 0,
        }),
    });

    const payload = await callWeather({ lat: "29.76", lon: "-95.36" });

    expect(payload.success).toBe(true);
    expect(payload.data.condition).toBe("Clear");
    expect(payload.data.suitable).toBe(true);
    expect(payload.data.suitability).toBe("excellent");
  });

  it("returns conservative fallback when city geocoding yields no match", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const payload = await callWeather({ city: "NotARealCity1234" });

    expect(payload.success).toBe(true);
    expect(payload.data.suitable).toBe(false);
    expect(payload.data.suitability).toBe("poor");
    expect(payload.data.safetyWarning).toBe(true);
    expect(payload.data.description).toMatch(/location could not be resolved/i);
  });
});
