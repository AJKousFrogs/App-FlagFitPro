import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { ShellBodyStateService } from "./shell-body-state.service";

describe("ShellBodyStateService", () => {
  let service: ShellBodyStateService;

  beforeEach(() => {
    document.body.classList.remove("app-shell-active", "sidebar-open");

    TestBed.configureTestingModule({
      providers: [ShellBodyStateService],
    });

    service = TestBed.inject(ShellBodyStateService);
  });

  it("keeps shell body state active until all owners release it", () => {
    const releaseA = service.acquireShell();
    const releaseB = service.acquireShell();

    expect(document.body.classList.contains("app-shell-active")).toBe(true);

    releaseA();
    expect(document.body.classList.contains("app-shell-active")).toBe(true);

    releaseB();
    expect(document.body.classList.contains("app-shell-active")).toBe(false);
  });

  it("clears mobile sidebar locks deterministically", () => {
    const releaseSidebarLockA = service.acquireSidebarLock();
    const releaseSidebarLockB = service.acquireSidebarLock();

    expect(document.body.classList.contains("sidebar-open")).toBe(true);

    releaseSidebarLockA();
    expect(document.body.classList.contains("sidebar-open")).toBe(true);

    releaseSidebarLockB();
    expect(document.body.classList.contains("sidebar-open")).toBe(false);
  });
});
