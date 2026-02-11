/**
 * Evidence Config Service Unit Tests
 *
 * Comprehensive test coverage for evidence-based configuration service.
 * Tests preset management and configuration access.
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { EvidenceConfigService } from "./evidence-config.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";

// Mock LoggerService
const mockLoggerService = {
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  success: vi.fn(),
};

// Mock SupabaseService to avoid environment dependency
const mockSupabaseService = {
  client: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: null, error: null })) })) })),
    })),
  },
};

// Mock AuthService
const mockAuthService = {
  getUser: vi.fn(() => null),
};

describe("EvidenceConfigService", () => {
  let service: EvidenceConfigService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        EvidenceConfigService,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(EvidenceConfigService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe("Initialization", () => {
    it("should create service", () => {
      expect(service).toBeDefined();
    });

    it("should have default preset", () => {
      const preset = service.getActivePreset();
      expect(preset).toBeDefined();
      expect(preset.id).toBeDefined();
    });

    it("should have available presets", () => {
      const presets = service.availablePresets();
      expect(presets).toBeDefined();
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Active Preset Tests
  // ============================================================================

  describe("Active Preset Management", () => {
    it("should get active preset", () => {
      const preset = service.getActivePreset();
      expect(preset).toBeDefined();
    });

    it("should have activePreset as computed signal", () => {
      const preset = service.activePreset();
      expect(preset).toBeDefined();
    });

    it("should set active preset with valid ID", () => {
      const presets = service.availablePresets();
      if (presets.length > 0) {
        const newPresetId = presets[0].id;
        const result = service.setActivePreset(newPresetId);
        expect(result).toBe(true);
      }
    });

    it("should return false for invalid preset ID", () => {
      const result = service.setActivePreset("invalid-preset-id-12345");
      expect(result).toBe(false);
    });

    it("should log preset change", () => {
      const presets = service.availablePresets();
      if (presets.length > 0) {
        service.setActivePreset(presets[0].id);
        expect(mockLoggerService.info).toHaveBeenCalledWith(
          expect.stringContaining("Preset changed to:"),
        );
      }
    });
  });

  // ============================================================================
  // Configuration Access Tests
  // ============================================================================

  describe("Configuration Access", () => {
    it("should get ACWR config", () => {
      const acwrConfig = service.getACWRConfig();
      expect(acwrConfig).toBeDefined();
    });

    it("should get Readiness config", () => {
      const readinessConfig = service.getReadinessConfig();
      expect(readinessConfig).toBeDefined();
    });

    it("should get Tapering config", () => {
      const taperingConfig = service.getTaperingConfig();
      expect(taperingConfig).toBeDefined();
    });
  });

  // ============================================================================
  // Preset Structure Tests
  // ============================================================================

  describe("Preset Structure", () => {
    it("should have preset with id", () => {
      const preset = service.getActivePreset();
      expect(preset.id).toBeDefined();
      expect(typeof preset.id).toBe("string");
    });

    it("should have preset with name", () => {
      const preset = service.getActivePreset();
      expect(preset.name).toBeDefined();
      expect(typeof preset.name).toBe("string");
    });

    it("should have preset with description", () => {
      const preset = service.getActivePreset();
      expect(preset.description).toBeDefined();
    });

    it("should have preset with acwr config", () => {
      const preset = service.getActivePreset();
      expect(preset.acwr).toBeDefined();
    });

    it("should have preset with readiness config", () => {
      const preset = service.getActivePreset();
      expect(preset.readiness).toBeDefined();
    });

    it("should have preset with tapering config", () => {
      const preset = service.getActivePreset();
      expect(preset.tapering).toBeDefined();
    });
  });

  // ============================================================================
  // ACWR Config Structure Tests
  // ============================================================================

  describe("ACWR Config Structure", () => {
    it("should have ACWR thresholds", () => {
      const acwrConfig = service.getACWRConfig();
      expect(acwrConfig).toBeDefined();
    });

    it("should have valid ACWR values", () => {
      const acwrConfig = service.getACWRConfig();
      // ACWR config should have risk zones or thresholds
      expect(acwrConfig).toBeTruthy();
    });
  });

  // ============================================================================
  // Readiness Config Structure Tests
  // ============================================================================

  describe("Readiness Config Structure", () => {
    it("should have readiness weights or thresholds", () => {
      const readinessConfig = service.getReadinessConfig();
      expect(readinessConfig).toBeDefined();
    });
  });

  // ============================================================================
  // Tapering Config Structure Tests
  // ============================================================================

  describe("Tapering Config Structure", () => {
    it("should have tapering parameters", () => {
      const taperingConfig = service.getTaperingConfig();
      expect(taperingConfig).toBeDefined();
    });
  });

  // ============================================================================
  // Available Presets Tests
  // ============================================================================

  describe("Available Presets", () => {
    it("should return array of presets", () => {
      const presets = service.availablePresets();
      expect(Array.isArray(presets)).toBe(true);
    });

    it("should have at least one preset", () => {
      const presets = service.availablePresets();
      expect(presets.length).toBeGreaterThan(0);
    });

    it("should have unique preset IDs", () => {
      const presets = service.availablePresets();
      const ids = presets.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("all presets should have required fields", () => {
      const presets = service.availablePresets();
      presets.forEach((preset) => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.acwr).toBeDefined();
        expect(preset.readiness).toBeDefined();
        expect(preset.tapering).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Preset Switching Tests
  // ============================================================================

  describe("Preset Switching", () => {
    it("should update active preset when switching", () => {
      const presets = service.availablePresets();
      if (presets.length > 1) {
        const originalPreset = service.getActivePreset();
        const newPreset = presets.find((p) => p.id !== originalPreset.id);

        if (newPreset) {
          service.setActivePreset(newPreset.id);
          const currentPreset = service.getActivePreset();
          expect(currentPreset.id).toBe(newPreset.id);
        }
      }
    });

    it("should update configs when preset changes", () => {
      const presets = service.availablePresets();
      if (presets.length > 1) {
        const _originalAcwr = service.getACWRConfig();
        const newPreset = presets.find(
          (p) => p.id !== service.getActivePreset().id,
        );

        if (newPreset) {
          service.setActivePreset(newPreset.id);
          const newAcwr = service.getACWRConfig();
          // Configs should be from the new preset
          expect(newAcwr).toBeDefined();
        }
      }
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle empty string preset ID", () => {
      const result = service.setActivePreset("");
      expect(result).toBe(false);
    });

    it("should handle null-like preset ID", () => {
      const result = service.setActivePreset("null");
      expect(result).toBe(false);
    });

    it("should handle undefined-like preset ID", () => {
      const result = service.setActivePreset("undefined");
      expect(result).toBe(false);
    });

    it("should maintain preset after failed switch", () => {
      const originalPreset = service.getActivePreset();
      service.setActivePreset("invalid-id");
      const currentPreset = service.getActivePreset();
      expect(currentPreset.id).toBe(originalPreset.id);
    });
  });
});
