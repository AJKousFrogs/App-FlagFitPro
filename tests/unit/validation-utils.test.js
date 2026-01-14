import { describe, it, expect, vi } from "vitest";
import {
  getErrorMessage,
  resolveUserId,
  sendErrorResponse,
} from "../../routes/utils/validation.js";

describe("validation utils", () => {
  describe("getErrorMessage", () => {
    it("returns the error message for Error instances", () => {
      const error = new Error("Boom");
      expect(getErrorMessage(error, "Fallback")).toBe("Boom");
    });

    it("returns the string when provided a string", () => {
      expect(getErrorMessage("Direct message", "Fallback")).toBe(
        "Direct message",
      );
    });

    it("returns the message from objects with a message field", () => {
      const error = { message: "Object message" };
      expect(getErrorMessage(error, "Fallback")).toBe("Object message");
    });

    it("returns the fallback for nullish values", () => {
      expect(getErrorMessage(null, "Fallback")).toBe("Fallback");
      expect(getErrorMessage(undefined, "Fallback")).toBe("Fallback");
    });

    it("stringifies objects without a message field", () => {
      const error = { code: "ERR_CODE", status: 500 };
      expect(getErrorMessage(error, "Fallback")).toBe(
        JSON.stringify(error),
      );
    });
  });

  describe("sendErrorResponse", () => {
    it("sends standardized errors with details in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };

      sendErrorResponse(
        res,
        new Error("Database down"),
        "Failed to fetch data",
        "FETCH_ERROR",
        500,
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Failed to fetch data",
          code: "FETCH_ERROR",
          details: "Database down",
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("resolveUserId", () => {
    it("returns error details when userId is missing", () => {
      const result = resolveUserId({ query: {} });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe("MISSING_USER_ID");
    });

    it("returns error details when userId is invalid UUID", () => {
      const result = resolveUserId({ query: { userId: "not-a-uuid" } });
      expect(result.isValid).toBe(false);
      expect(result.code).toBe("INVALID_USER_ID");
    });

    it("uses demo user when allowed", () => {
      const result = resolveUserId(
        { query: { userId: "not-a-uuid" } },
        { allowDemoUser: true, demoUserId: "demo-id" },
      );
      expect(result.isValid).toBe(true);
      expect(result.userId).toBe("demo-id");
      expect(result.isDemo).toBe(true);
    });

    it("uses the first value when userId is an array", () => {
      const result = resolveUserId({
        query: {
          userId: [
            "11111111-1111-1111-1111-111111111111",
            "22222222-2222-2222-2222-222222222222",
          ],
        },
      });
      expect(result.isValid).toBe(true);
      expect(result.userId).toBe("11111111-1111-1111-1111-111111111111");
    });
  });
});
