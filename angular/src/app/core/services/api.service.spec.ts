/**
 * API Service Unit Tests
 *
 * Comprehensive test coverage for the HTTP API service.
 * Tests GET, POST, PUT, PATCH, DELETE operations and error handling.
 *
 * @version 1.0.0
 */

import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { ApiResponse } from "../models/common.models";
import { LoggerService } from "./logger.service";

// Mock LoggerService
const mockLoggerService = {
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  success: vi.fn(),
};

describe("ApiService", () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  // ============================================================================
  // GET Request Tests
  // ============================================================================

  describe("GET Requests", () => {
    it("should make GET request successfully", () => {
      const mockResponse: ApiResponse<{ id: number }> = {
        success: true,
        data: { id: 1 },
      };

      service.get<{ id: number }>("/test-endpoint").subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data?.id).toBe(1);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint"),
      );
      expect(req.request.method).toBe("GET");
      req.flush(mockResponse);
    });

    it("should include query parameters", () => {
      const mockResponse: ApiResponse = { success: true };

      service
        .get("/test-endpoint", { page: 1, limit: 10, search: "test" })
        .subscribe();

      const req = httpMock.expectOne((request) => {
        return (
          request.url.includes("/test-endpoint") &&
          request.params.get("page") === "1" &&
          request.params.get("limit") === "10" &&
          request.params.get("search") === "test"
        );
      });
      expect(req.request.method).toBe("GET");
      req.flush(mockResponse);
    });

    it("should filter out null and undefined params", () => {
      const mockResponse: ApiResponse = { success: true };

      service
        .get("/test-endpoint", {
          valid: "value",
          nullParam: null,
          undefinedParam: undefined,
        })
        .subscribe();

      const req = httpMock.expectOne((request) => {
        return (
          request.params.get("valid") === "value" &&
          !request.params.has("nullParam") &&
          !request.params.has("undefinedParam")
        );
      });
      req.flush(mockResponse);
    });

    it("should handle GET error response", () => {
      service.get("/test-endpoint").subscribe({
        error: (error) => {
          expect(error.message).toBeDefined();
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint"),
      );
      req.flush(
        { error: "Not found" },
        { status: 404, statusText: "Not Found" },
      );
    });
  });

  // ============================================================================
  // POST Request Tests
  // ============================================================================

  describe("POST Requests", () => {
    it("should make POST request with body", () => {
      const mockResponse: ApiResponse<{ id: number }> = {
        success: true,
        data: { id: 123 },
      };
      const requestBody = { name: "Test", value: 42 };

      service
        .post<{ id: number }>("/test-endpoint", requestBody)
        .subscribe((response) => {
          expect(response.success).toBe(true);
          expect(response.data?.id).toBe(123);
        });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint"),
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(requestBody);
      req.flush(mockResponse);
    });

    it("should make POST request without body", () => {
      const mockResponse: ApiResponse = { success: true };

      service.post("/test-endpoint").subscribe();

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint"),
      );
      expect(req.request.method).toBe("POST");
      // Body can be undefined or null when not provided
      expect(req.request.body === undefined || req.request.body === null).toBe(
        true,
      );
      req.flush(mockResponse);
    });

    it("should handle POST error response", () => {
      service.post("/test-endpoint", { data: "test" }).subscribe({
        error: (error) => {
          expect(error.message).toContain("Validation failed");
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint"),
      );
      req.flush(
        { error: "Validation failed" },
        { status: 400, statusText: "Bad Request" },
      );
    });
  });

  // ============================================================================
  // PUT Request Tests
  // ============================================================================

  describe("PUT Requests", () => {
    it("should make PUT request with body", () => {
      const mockResponse: ApiResponse = { success: true };
      const requestBody = { id: 1, name: "Updated" };

      service.put("/test-endpoint/1", requestBody).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint/1"),
      );
      expect(req.request.method).toBe("PUT");
      expect(req.request.body).toEqual(requestBody);
      req.flush(mockResponse);
    });

    it("should handle PUT error response", () => {
      service.put("/test-endpoint/1", {}).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint/1"),
      );
      req.flush({}, { status: 500, statusText: "Server Error" });
    });
  });

  // ============================================================================
  // PATCH Request Tests
  // ============================================================================

  describe("PATCH Requests", () => {
    it("should make PATCH request with partial body", () => {
      const mockResponse: ApiResponse = { success: true };
      const partialUpdate = { name: "Patched" };

      service.patch("/test-endpoint/1", partialUpdate).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint/1"),
      );
      expect(req.request.method).toBe("PATCH");
      expect(req.request.body).toEqual(partialUpdate);
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // DELETE Request Tests
  // ============================================================================

  describe("DELETE Requests", () => {
    it("should make DELETE request", () => {
      const mockResponse: ApiResponse = { success: true };

      service.delete("/test-endpoint/1").subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint/1"),
      );
      expect(req.request.method).toBe("DELETE");
      req.flush(mockResponse);
    });

    it("should handle DELETE error response", () => {
      service.delete("/test-endpoint/999").subscribe({
        error: (error) => {
          expect(error).toBeDefined();
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint/999"),
      );
      req.flush({}, { status: 404, statusText: "Not Found" });
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe("Error Handling", () => {
    it("should log errors to logger service", () => {
      service.get("/test-endpoint").subscribe({
        error: () => {
          expect(mockLoggerService.error).toHaveBeenCalled();
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint"),
      );
      req.flush(
        { error: "Server error" },
        { status: 500, statusText: "Internal Server Error" },
      );
    });

    it("should extract error message from response", () => {
      service.get("/test-endpoint").subscribe({
        error: (error) => {
          expect(error.message).toBeDefined();
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint"),
      );
      req.flush(
        { error: { error: "Custom error message" } },
        { status: 400, statusText: "Bad Request" },
      );
    });

    it("should handle network errors", () => {
      service.get("/test-endpoint").subscribe({
        error: (error) => {
          expect(error).toBeDefined();
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes("/test-endpoint"),
      );
      req.error(new ProgressEvent("error"));
    });
  });

  // ============================================================================
  // Endpoint Normalization Tests
  // ============================================================================

  describe("Endpoint Normalization", () => {
    it("should handle /api/ prefixed endpoints", () => {
      const mockResponse: ApiResponse = { success: true };

      service.get("/api/dashboard/overview").subscribe();

      const req = httpMock.expectOne((request) =>
        request.url.includes("/api/dashboard/overview"),
      );
      req.flush(mockResponse);
    });

    it("should handle non-prefixed endpoints", () => {
      const mockResponse: ApiResponse = { success: true };

      service.get("/auth-me").subscribe();

      const req = httpMock.expectOne((request) =>
        request.url.includes("/auth-me"),
      );
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // API Endpoints Configuration Tests
  // ============================================================================

  describe("API_ENDPOINTS Configuration", () => {
    it("should have auth endpoints", () => {
      expect(API_ENDPOINTS.auth.me).toBe("/auth-me");
    });

    it("should have dashboard endpoints", () => {
      expect(API_ENDPOINTS.dashboard.overview).toBe("/api/dashboard/overview");
      expect(API_ENDPOINTS.dashboard.health).toBe("/api/dashboard/health");
    });

    it("should have training endpoints", () => {
      expect(API_ENDPOINTS.training.stats).toBe("/api/training/stats");
      expect(API_ENDPOINTS.training.sessions).toBe("/api/training/sessions");
    });

    it("should have analytics endpoints", () => {
      expect(API_ENDPOINTS.analytics.performanceTrends).toBe(
        "/api/analytics/performance-trends",
      );
      expect(API_ENDPOINTS.analytics.summary).toBe("/api/analytics/summary");
    });

    it("should have dynamic endpoint functions", () => {
      expect(API_ENDPOINTS.community.getComments("123")).toBe(
        "/api/community/posts/123/comments",
      );
      expect(API_ENDPOINTS.tournaments.details("456")).toBe(
        "/api/tournaments/456",
      );
      expect(API_ENDPOINTS.games.stats("789")).toBe("/api/games/789/stats");
    });

    it("should have AI chat endpoints", () => {
      expect(API_ENDPOINTS.aiChat.send).toBe("/api/ai/chat");
      expect(API_ENDPOINTS.aiChat.session("session-123")).toBe(
        "/api/ai/chat/session/session-123",
      );
    });

    it("should have load management endpoints", () => {
      expect(API_ENDPOINTS.loadManagement.acwr).toBe(
        "/api/load-management/acwr",
      );
      expect(API_ENDPOINTS.loadManagement.injuryRisk).toBe(
        "/api/load-management/injury-risk",
      );
    });

    it("should have wellness endpoints", () => {
      expect(API_ENDPOINTS.wellness.checkin).toBe("/api/wellness-checkin");
      expect(API_ENDPOINTS.wellness.latest).toBe("/api/wellness/latest");
    });

    it("should have nutrition endpoints", () => {
      expect(API_ENDPOINTS.nutrition.searchFoods).toBe(
        "/api/nutrition/search-foods",
      );
      expect(API_ENDPOINTS.nutrition.goals).toBe("/api/nutrition/goals");
    });

    it("should have recovery endpoints", () => {
      expect(API_ENDPOINTS.recovery.metrics).toBe("/api/recovery/metrics");
      expect(API_ENDPOINTS.recovery.protocols).toBe("/api/recovery/protocols");
    });

    it("should have admin endpoints", () => {
      expect(API_ENDPOINTS.admin.healthMetrics).toBe(
        "/api/admin/health-metrics",
      );
      expect(API_ENDPOINTS.admin.syncUSDA).toBe("/api/admin/sync-usda");
    });
  });

  // ============================================================================
  // URL Detection Tests
  // ============================================================================

  describe("Base URL Detection", () => {
    // in Vitest without breaking other tests. The URL detection is tested
    // implicitly through integration tests.
    it.skip("should detect Netlify production URL", () => {
      // Cannot mock window.location in Vitest - tested via integration
    });

    it.skip("should detect localhost development", () => {
      // Cannot mock window.location in Vitest - tested via integration
    });
  });

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  describe("Type Safety", () => {
    interface TestData {
      id: number;
      name: string;
    }

    it("should return typed response for GET", () => {
      const mockResponse: ApiResponse<TestData> = {
        success: true,
        data: { id: 1, name: "Test" },
      };

      service.get<TestData>("/test").subscribe((response) => {
        if (response.data) {
          expect(response.data.id).toBe(1);
          expect(response.data.name).toBe("Test");
        }
      });

      const req = httpMock.expectOne((r) => r.url.includes("/test"));
      req.flush(mockResponse);
    });

    it("should return typed response for POST", () => {
      const mockResponse: ApiResponse<TestData> = {
        success: true,
        data: { id: 2, name: "Created" },
      };

      service.post<TestData>("/test", { name: "New" }).subscribe((response) => {
        if (response.data) {
          expect(response.data.id).toBe(2);
        }
      });

      const req = httpMock.expectOne((r) => r.url.includes("/test"));
      req.flush(mockResponse);
    });
  });
});
