import { describe, expect, it } from "vitest";
import {
  extractApiArray,
  extractApiPayload,
  extractApiRecord,
  isApiResponse,
  isSuccessfulApiResponse,
  readNumericField,
} from "./api-response-mapper";

describe("api-response-mapper helpers", () => {
  it("detects the wrapped api response shape", () => {
    expect(
      isApiResponse<{ value: number }>({
        success: true,
        data: { value: 1 },
      }),
    ).toBe(true);
    expect(isApiResponse({ value: 1 })).toBe(false);
  });

  it("detects successful wrapped responses", () => {
    expect(
      isSuccessfulApiResponse({
        success: true,
        data: { ok: true },
      }),
    ).toBe(true);
    expect(
      isSuccessfulApiResponse({
        success: false,
        message: "nope",
      }),
    ).toBe(false);
  });

  it("extracts payloads from wrapped and direct responses", () => {
    expect(
      extractApiPayload<{ value: number }>({
        success: true,
        data: { value: 7 },
      }),
    ).toEqual({ value: 7 });
    expect(extractApiPayload<{ value: number }>({ value: 9 })).toEqual({
      value: 9,
    });
    expect(
      extractApiPayload<{ value: number }>({
        success: false,
        message: "failed",
      }),
    ).toBeNull();
  });

  it("extracts arrays and records safely", () => {
    expect(
      extractApiArray<number>({
        success: true,
        data: [1, 2, 3],
      }),
    ).toEqual([1, 2, 3]);
    expect(extractApiArray<number>([4, 5])).toEqual([4, 5]);
    expect(
      extractApiRecord({
        success: true,
        data: { unreadCount: 4 },
      }),
    ).toEqual({ unreadCount: 4 });
    expect(extractApiRecord({ unreadCount: 6 })).toEqual({ unreadCount: 6 });
    expect(extractApiRecord(undefined)).toBeNull();
  });

  it("reads the first numeric field from a payload record", () => {
    expect(readNumericField({ count: 3 }, "unreadCount", "count")).toBe(3);
    expect(
      readNumericField({ unreadCount: "4", count: 2 }, "unreadCount", "count"),
    ).toBe(2);
    expect(readNumericField(null, "count")).toBeNull();
  });
});
