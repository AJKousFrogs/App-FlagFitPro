import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerService } from "../../../core/services/logger.service";
import { PlatformService } from "../../../core/services/platform.service";
import { ToastService } from "../../../core/services/toast.service";
import { SettingsDataExportService } from "./settings-data-export.service";
import { SettingsDataService } from "./settings-data.service";

describe("SettingsDataExportService", () => {
  let service: SettingsDataExportService;
  let capturedDownload:
    | {
        format: "json" | "csv";
        data: Record<string, unknown>;
      }
    | undefined;

  const mockSettingsDataService = {
    getCurrentUser: vi.fn(),
    fetchUserSettings: vi.fn(),
    fetchExportProfile: vi.fn(),
    fetchExportTraining: vi.fn(),
    fetchExportWellness: vi.fn(),
    fetchExportAchievements: vi.fn(),
  };

  const mockPlatform = {
    isBrowser: true,
    getLocalStorage: vi.fn(),
    getDocument: vi.fn(),
  };

  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    capturedDownload = undefined;

    mockSettingsDataService.getCurrentUser.mockReturnValue({
      id: "user-1",
      email: "player@example.com",
    });
    mockSettingsDataService.fetchUserSettings.mockResolvedValue({
      settings: null,
      error: null,
    });
    mockPlatform.getLocalStorage.mockReturnValue(null);

    TestBed.configureTestingModule({
      providers: [
        SettingsDataExportService,
        { provide: SettingsDataService, useValue: mockSettingsDataService },
        { provide: PlatformService, useValue: mockPlatform },
        { provide: LoggerService, useValue: mockLogger },
        { provide: ToastService, useValue: mockToast },
      ],
    });

    service = TestBed.inject(SettingsDataExportService);
    vi.spyOn(service as never, "downloadExportFile" as never).mockImplementation(
      (input: {
        format: "json" | "csv";
        data: Record<string, unknown>;
      }) => {
        capturedDownload = input;
      },
    );
  });

  it("exports settings from Supabase before checking the local cache", async () => {
    mockSettingsDataService.fetchUserSettings.mockResolvedValue({
      settings: {
        user_id: "user-1",
        theme: "dark",
        language: "en",
      },
      error: null,
    });
    mockPlatform.getLocalStorage.mockReturnValue(
      JSON.stringify({
        user_id: "user-1",
        theme: "light",
      }),
    );

    const result = await service.exportUserData({
      format: "json",
      options: {
        profile: false,
        training: false,
        wellness: false,
        achievements: false,
        settings: true,
      },
    });

    expect(result).toBe(true);
    expect(capturedDownload?.data["settings"]).toEqual({
      user_id: "user-1",
      theme: "dark",
      language: "en",
    });
    expect(mockPlatform.getLocalStorage).not.toHaveBeenCalled();
  });

  it("falls back to the cached settings snapshot when Supabase settings fail", async () => {
    mockSettingsDataService.fetchUserSettings.mockResolvedValue({
      settings: null,
      error: { message: "network down" },
    });
    mockPlatform.getLocalStorage.mockReturnValue(
      JSON.stringify({
        user_id: "user-1",
        theme: "dark",
        language: "sl",
      }),
    );

    const result = await service.exportUserData({
      format: "json",
      options: {
        profile: false,
        training: false,
        wellness: false,
        achievements: false,
        settings: true,
      },
    });

    expect(result).toBe(true);
    expect(capturedDownload?.data["settings"]).toEqual({
      user_id: "user-1",
      theme: "dark",
      language: "sl",
    });
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
