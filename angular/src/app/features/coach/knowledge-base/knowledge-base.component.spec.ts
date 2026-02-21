import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { of } from "rxjs";
import { KnowledgeBaseComponent } from "./knowledge-base.component";
import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthService } from "../../../core/services/auth.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";
import { ConfirmDialogService } from "../../../core/services/confirm-dialog.service";
import { ConfirmationService } from "primeng/api";
import { provideRouter } from "@angular/router";

const mockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
};

const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

const mockToastService = {
  success: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};

const mockAuthService = {
  getUser: vi.fn(() => ({
    id: "user-1",
    role: "player",
    user_metadata: { role: "player" },
  })),
};

const mockTeamMembershipService = {
  loadMembership: vi.fn(async () => null),
  role: vi.fn(() => null),
};

const mockConfirmDialogService = {
  confirm: vi.fn(async () => false),
};

describe("KnowledgeBaseComponent", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    mockApiService.get.mockImplementation((endpoint: string) => {
      if (endpoint.includes("/api/knowledge-governance/my")) {
        return of({ success: true, data: { entries: [] } });
      }
      if (endpoint.includes("/api/knowledge-governance/audit/")) {
        return of({ success: true, data: { events: [] } });
      }
      return of({ success: true, data: { resources: [], categories: [] } });
    });
    mockApiService.post.mockReturnValue(
      of({ success: true, data: { entry: { id: "kb-new" } } }),
    );
    mockApiService.patch.mockReturnValue(
      of({ success: true, data: { entry: { id: "kb-1" } } }),
    );

    await TestBed.configureTestingModule({
      imports: [KnowledgeBaseComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: mockApiService },
        { provide: LoggerService, useValue: mockLogger },
        { provide: ToastService, useValue: mockToastService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: TeamMembershipService, useValue: mockTeamMembershipService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialogService },
        { provide: ConfirmationService, useValue: { confirm: vi.fn() } },
      ],
    }).compileComponents();
  });

  it("submits new knowledge through governance endpoint", async () => {
    const fixture = TestBed.createComponent(KnowledgeBaseComponent);
    const component = fixture.componentInstance;

    component.resourceForm.title = "Creatine protocol";
    component.resourceForm.category = "nutrition";
    component.resourceForm.content =
      "Take 3-5g daily with hydration. Safety warning for existing kidney conditions.";

    await component.saveResource();

    expect(mockApiService.post).toHaveBeenCalledWith(
      "/api/knowledge-governance",
      expect.objectContaining({
        entry_type: "nutrition",
      }),
    );
    expect(mockToastService.success).toHaveBeenCalled();
  });

  it("prevents non-nutritionist users from review actions", async () => {
    const fixture = TestBed.createComponent(KnowledgeBaseComponent);
    const component = fixture.componentInstance;

    await component.reviewPendingEntry("kb-1", "approve");

    expect(mockApiService.patch).not.toHaveBeenCalled();
    expect(mockToastService.warn).toHaveBeenCalled();
  });

  it("loads my submissions from governance endpoint", async () => {
    mockApiService.get.mockImplementation((endpoint: string) => {
      if (endpoint.includes("/api/knowledge-governance/my")) {
        return of({
          success: true,
          data: {
            entries: [
              {
                id: "kb-1",
                entry_type: "nutrition",
                topic: "hydration",
                question: "Hydration basics",
                summary: "Hydration summary",
                evidence_strength: "moderate",
                consensus_level: "moderate",
                merlin_approval_status: "pending",
              },
            ],
          },
        });
      }
      if (endpoint.includes("/api/knowledge-governance/audit/")) {
        return of({
          success: true,
          data: {
            events: [
              {
                id: 1,
                action: "approve",
                reviewed_by_role: "nutritionist",
                notes: "Looks good",
                quality_gate_override: false,
                created_at: new Date().toISOString(),
              },
            ],
          },
        });
      }
      return of({ success: true, data: { resources: [], categories: [] } });
    });

    const fixture = TestBed.createComponent(KnowledgeBaseComponent);
    const component = fixture.componentInstance;

    await component.loadMySubmissions();

    expect(component.mySubmissions().length).toBe(1);
    expect(component.mySubmissions()[0].id).toBe("kb-1");
  });

  it("loads audit timeline for a submission", async () => {
    const fixture = TestBed.createComponent(KnowledgeBaseComponent);
    const component = fixture.componentInstance;

    await component.toggleAuditTimeline("kb-1");

    expect(mockApiService.get).toHaveBeenCalledWith(
      "/api/knowledge-governance/audit/kb-1",
    );
    expect(component.auditTimelineByEntry()["kb-1"]?.length).toBe(0);
  });
});
