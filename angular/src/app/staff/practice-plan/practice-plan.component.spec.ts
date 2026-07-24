import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { signal as ngSignal } from "@angular/core";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  LucideAngularModule,
  ChevronRight,
  ClipboardList,
} from "lucide-angular";
import { PracticePlanComponent } from "./practice-plan.component";
import { ApiService } from "../../core/services/api.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";

function samplePlan(over: Record<string, unknown> = {}) {
  return {
    teamId: "team-1",
    date: "2026-07-25",
    planKey: "own",
    framing: "own",
    totalMinutes: 90,
    blocks: [
      {
        key: "team_warmup",
        title: "Warm-Up",
        role: "warmup",
        minutes: 16,
        highCns: false,
        waterBreakAfter: false,
        drills: [{ id: "d1", name: "Dynamic stretch circuit", description: null }],
      },
      {
        key: "team_install",
        title: "Team Install (capped 5v5)",
        role: "team",
        minutes: 11,
        highCns: true,
        waterBreakAfter: false,
        drills: [],
      },
    ],
    drillMinutes: 58,
    scrimmageMinutes: 11,
    highCnsMinutes: 47,
    notes: "Build phase — develop skills.",
    ...over,
  };
}

function mount(opts: {
  teamId?: string | null;
  postResult?: unknown;
  postError?: unknown;
}) {
  const post = vi.fn((_url: string, _body?: unknown) => {
    if (opts.postError) return throwError(() => opts.postError);
    return of({ success: true, data: opts.postResult ?? samplePlan() });
  });

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      PracticePlanComponent,
      LucideAngularModule.pick({ ChevronRight, ClipboardList }),
    ],
    providers: [
      provideRouter([]),
      { provide: ApiService, useValue: { post } },
      {
        provide: TeamMembershipService,
        useValue: {
          teamId: ngSignal(opts.teamId === undefined ? "team-1" : opts.teamId),
          teamName: ngSignal("Ljubljana Frogs"),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(PracticePlanComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, post };
}

describe("PracticePlanComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts teamId + framing + date, omitting unset optional fields", async () => {
    const { component, post } = mount({});
    await component.generate();

    expect(post).toHaveBeenCalledWith("/api/team-practice-plan", {
      teamId: "team-1",
      date: component.date(),
      framing: "own",
    });
  });

  it("includes minutes/daysOut/seasonPhase only when the coach sets them", async () => {
    const { component, post } = mount({});
    component.minutes.set(75);
    component.daysOut.set(3);
    component.seasonPhase.set("taper");

    await component.generate();

    const [, body] = post.mock.calls[0];
    expect(body).toMatchObject({
      minutes: 75,
      daysOut: 3,
      seasonPhase: "taper",
    });
  });

  it("refuses to generate without an active team", async () => {
    const { component, post } = mount({ teamId: null });
    await component.generate();
    expect(post).not.toHaveBeenCalled();
    expect(component.error()).toContain("No active team");
  });

  it("stores the returned plan on success", async () => {
    const plan = samplePlan({ totalMinutes: 60, framing: "sharp" });
    const { component } = mount({ postResult: plan });
    await component.generate();
    expect(component.plan()).toEqual(plan);
    expect(component.error()).toBeNull();
  });

  it("surfaces a request failure as an error and clears any previous plan", async () => {
    const { component } = mount({ postError: new Error("teapot") });
    await component.generate();
    expect(component.error()).toBe("teapot");
    expect(component.plan()).toBeNull();
  });

  it("maps block roles to athlete-facing labels", () => {
    const { component } = mount({});
    expect(component.roleLabel("team")).toBe("Team (5v5)");
    expect(component.roleLabel("warmup")).toBe("Warm-up");
    expect(component.roleLabel("mystery")).toBe("mystery");
  });
});
