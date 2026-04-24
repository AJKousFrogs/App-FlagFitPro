import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeRouteService } from "../../../core/services/home-route.service";
import { PlatformService } from "../../../core/services/platform.service";
import { ToastService } from "../../../core/services/toast.service";
import {
  TeamInvitationDataService,
  type InvitationRecord,
} from "../services/team-invitation-data.service";
import { AcceptInvitationComponent } from "./accept-invitation.component";

describe("AcceptInvitationComponent", () => {
  let fixture: ComponentFixture<AcceptInvitationComponent>;
  let component: AcceptInvitationComponent;

  const mockTeamInvitationDataService = {
    getInvitationByToken: vi.fn(),
    getCurrentUser: vi.fn(),
    getInviter: vi.fn(),
    acceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
  } as unknown as TeamInvitationDataService;

  const mockToastService = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  } as unknown as ToastService;

  const mockRouter = {
    navigate: vi.fn(),
    navigateByUrl: vi.fn(),
  } as unknown as Router;

  const mockHomeRouteService = {
    getHomeRoute: vi.fn(() => "/todays-practice"),
  } as unknown as HomeRouteService;

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {} as Record<string, string>,
    },
  };

  const mockPlatformService = {
    getWindow: vi.fn(() => window),
  } as unknown as PlatformService;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useRealTimers();
    window.history.replaceState({}, "", "/accept-invitation");

    mockActivatedRoute.snapshot.queryParams = {};
    mockTeamInvitationDataService.getInvitationByToken = vi.fn();
    mockTeamInvitationDataService.getCurrentUser = vi.fn().mockReturnValue(null);
    mockTeamInvitationDataService.getInviter = vi.fn().mockResolvedValue({
      inviter: null,
      error: null,
    });

    await TestBed.configureTestingModule({
      imports: [AcceptInvitationComponent],
      providers: [
        {
          provide: TeamInvitationDataService,
          useValue: mockTeamInvitationDataService,
        },
        { provide: ToastService, useValue: mockToastService },
        { provide: HomeRouteService, useValue: mockHomeRouteService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: PlatformService, useValue: mockPlatformService },
      ],
    })
      .overrideComponent(AcceptInvitationComponent, {
        set: { template: "" },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AcceptInvitationComponent);
    component = fixture.componentInstance;
  });

  async function initializeComponent(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function createInvitationRecord(
    overrides: Partial<InvitationRecord> = {},
  ): InvitationRecord {
    return {
      id: "inv-1",
      team_id: "team-1",
      email: "player@example.com",
      role: "coach",
      position: "QB",
      jersey_number: 12,
      status: "pending",
      expires_at: "2099-03-25T00:00:00.000Z",
      invited_by: null,
      teams: { name: "Flag Frogs" },
      ...overrides,
    };
  }

  async function loadInvitation(
    options: {
      currentUser?: { id: string; email?: string | null };
      invitationOverrides?: Partial<InvitationRecord>;
    } = {},
  ): Promise<void> {
    window.history.replaceState({}, "", "/accept-invitation?token=invite-123");
    mockActivatedRoute.snapshot.queryParams = { token: "invite-123" };
    mockTeamInvitationDataService.getCurrentUser = vi
      .fn()
      .mockReturnValue(options.currentUser ?? null);
    mockTeamInvitationDataService.getInvitationByToken = vi.fn().mockResolvedValue({
      invitation: createInvitationRecord(options.invitationOverrides),
      error: null,
    });

    await initializeComponent();
  }

  it("preserves the invitation URL for auth redirects when login is required", async () => {
    window.history.replaceState(
      {},
      "",
      "/accept-invitation?token=invite-123",
    );
    mockActivatedRoute.snapshot.queryParams = { token: "invite-123" };
    mockTeamInvitationDataService.getInvitationByToken = vi.fn().mockResolvedValue({
      invitation: {
        id: "inv-1",
        team_id: "team-1",
        email: "player@example.com",
        role: "player",
        position: "QB",
        jersey_number: 12,
        status: "pending",
        expires_at: "2099-03-25T00:00:00.000Z",
        invited_by: null,
        teams: { name: "Flag Frogs" },
      },
      error: null,
    });

    await initializeComponent();

    expect(component.needsLogin()).toBe(true);
    expect(component.currentUrl()).toBe("/accept-invitation?token=invite-123");
    expect(component.authRedirectQueryParams()).toEqual({
      returnUrl: "/accept-invitation?token=invite-123",
    });
  });

  it("shows an invalid-link error when no invitation token is present", async () => {
    await initializeComponent();

    expect(component.invitationError()).toContain("Invalid invitation link");
    expect(component.isLoading()).toBe(false);
    expect(mockTeamInvitationDataService.getInvitationByToken).not.toHaveBeenCalled();
  });

  it("accepts a matching invitation and redirects to the roster", async () => {
    vi.useFakeTimers();
    mockTeamInvitationDataService.acceptInvitation = vi
      .fn()
      .mockResolvedValue({ error: null });

    await loadInvitation({
      currentUser: { id: "user-1", email: "player@example.com" },
    });

    await component.acceptInvitation();

    expect(mockTeamInvitationDataService.acceptInvitation).toHaveBeenCalledWith(
      "inv-1",
    );
    expect(component.isAccepted()).toBe(true);
    expect(mockToastService.success).toHaveBeenCalledWith(
      "You've joined Flag Frogs!",
      "Invitation Accepted",
    );

    vi.runAllTimers();

    expect(mockRouter.navigate).toHaveBeenCalledWith(["/roster"]);
  });

  it("blocks acceptance when the signed-in user email does not match the invitation", async () => {
    mockTeamInvitationDataService.acceptInvitation = vi.fn();

    await loadInvitation({
      currentUser: { id: "user-1", email: "different@example.com" },
    });

    await component.acceptInvitation();

    expect(mockTeamInvitationDataService.acceptInvitation).not.toHaveBeenCalled();
    expect(component.isAccepted()).toBe(false);
    expect(mockToastService.warn).toHaveBeenCalledWith(
      "This invitation was sent to player@example.com. Sign out and sign in with that email to accept it.",
      "Wrong Account",
    );
  });

  it("shows the server error message when invitation acceptance is rejected", async () => {
    mockTeamInvitationDataService.acceptInvitation = vi
      .fn()
      .mockResolvedValue({ error: { message: "Invalid or expired invitation" } });

    await loadInvitation({
      currentUser: { id: "user-1", email: "player@example.com" },
    });

    await component.acceptInvitation();

    expect(component.isAccepted()).toBe(false);
    expect(mockToastService.error).toHaveBeenCalledWith(
      "Invalid or expired invitation",
    );
    expect(component.isProcessing()).toBe(false);
  });

  it("declines the invitation and redirects home", async () => {
    vi.useFakeTimers();
    mockTeamInvitationDataService.declineInvitation = vi
      .fn()
      .mockResolvedValue({ error: null });

    await loadInvitation({
      currentUser: { id: "user-1", email: "player@example.com" },
    });

    await component.declineInvitation();

    expect(mockTeamInvitationDataService.declineInvitation).toHaveBeenCalledWith(
      "inv-1",
    );
    expect(component.isDeclined()).toBe(true);
    expect(mockToastService.info).toHaveBeenCalledWith(
      "You have declined the team invitation.",
      "Invitation Declined",
    );

    vi.runAllTimers();

    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith("/todays-practice");
  });
});
