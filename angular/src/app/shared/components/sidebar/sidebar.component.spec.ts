import { ComponentFixture, TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY, of } from "rxjs";
import { Router } from "@angular/router";
import { SidebarComponent } from "./sidebar.component";
import { AuthService } from "../../../core/services/auth.service";
import { ConfirmDialogService } from "../../../core/services/confirm-dialog.service";

describe("SidebarComponent", () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;

  const mockRouter = {
    events: EMPTY,
  } as unknown as Router;

  const mockAuthService = {
    getUser: vi.fn(() => ({
      name: "Test User",
      email: "test@example.com",
      role: "player",
    })),
    logout: vi.fn(() => of(void 0)),
  } as unknown as AuthService;

  const mockConfirmDialogService = {
    confirmLogout: vi.fn().mockResolvedValue(false),
  } as unknown as ConfirmDialogService;

  beforeEach(async () => {
    document.body.classList.remove("sidebar-open");
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialogService },
      ],
    })
      .overrideComponent(SidebarComponent, {
        set: { template: "" },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  it("removes the body scroll lock when the viewport leaves mobile", () => {
    fixture.componentRef.setInput("mobileViewport", true);
    fixture.detectChanges();

    component.toggleSidebar();
    fixture.detectChanges();

    expect(document.body.classList.contains("sidebar-open")).toBe(true);

    fixture.componentRef.setInput("mobileViewport", false);
    fixture.detectChanges();

    expect(document.body.classList.contains("sidebar-open")).toBe(false);
  });
});
