import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { describe, it, expect, beforeEach } from "vitest";
import { ActivatedRoute } from "@angular/router";
import {
  LucideAngularModule,
  Activity,
  ShieldAlert,
  Ban,
  ClipboardList,
  LineChart,
  TestTube,
  CircleAlert,
  AlertTriangle,
  Check,
  Circle,
} from "lucide-angular";
import { MonitoringReportComponent } from "./monitoring-report.component";
import {
  MonitoringReportService,
  MonitoringReport,
} from "../core/services/monitoring-report.service";

function baseReport(
  role: MonitoringReport["meta"]["requesterRole"],
): MonitoringReport {
  return {
    meta: {
      athleteId: "a1",
      requesterRole: role,
      generatedAt: "now",
      disclaimer: "monitoring, not prediction",
    },
    identity: { name: "Mock A", sex: "male", position: "Rusher" },
    physioBlock: null,
    daily: {
      latest: null,
      series: [],
      hooperIndex: 14,
      flags: { hooper: "watch" },
      promptRequired: false,
    },
    weekly: {
      acwr: null,
      monotony: null,
      strain: null,
      plPerMin: null,
      promptRequired: true,
    },
    bloodwork: null,
    wearable: null,
    thresholds: {},
  };
}

function mount(report: MonitoringReport | null) {
  TestBed.configureTestingModule({
    imports: [
      MonitoringReportComponent,
      LucideAngularModule.pick({
        Activity,
        ShieldAlert,
        Ban,
        ClipboardList,
        LineChart,
        TestTube,
        CircleAlert,
        AlertTriangle,
        Check,
        Circle,
      }),
    ],
    providers: [
      { provide: MonitoringReportService, useValue: { get: () => of(report) } },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => null } } },
      },
    ],
  });
  const fixture = TestBed.createComponent(MonitoringReportComponent);
  fixture.detectChanges();
  return fixture;
}

describe("MonitoringReportComponent", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("physio payload renders RAW bloodwork marker values", () => {
    const r = baseReport("physio");
    r.bloodwork = {
      mode: "raw",
      collectedDate: "2026-07-05",
      daysSinceDraw: 2,
      markers: [{ name: "ck", value: 1200, unit: "U/L", flag: "high" }],
      promptRequired: false,
    };
    const html = mount(r).nativeElement.textContent as string;
    expect(html).toContain("1200"); // raw value visible to physio
    expect(html).toContain("ck");
  });

  it("head_coach payload renders bloodwork as a signal chip, NEVER raw values", () => {
    const r = baseReport("head_coach");
    r.bloodwork = {
      mode: "signal",
      status: "flagged",
      categories: ["bloodwork"],
      promptRequired: false,
    };
    const html = mount(r).nativeElement.textContent as string;
    expect(html).toContain("flagged");
    expect(html).not.toContain("1200"); // no raw marker value leaks
    expect(html).not.toContain("U/L");
  });

  it("sc_coach payload hides the bloodwork section entirely (bloodwork null)", () => {
    const r = baseReport("sc_coach");
    r.bloodwork = null;
    const html = mount(r).nativeElement.textContent as string;
    expect(html).not.toContain("Bloodwork");
  });

  it("null report shows a not-available message, never fabricated data", () => {
    const html = mount(null).nativeElement.textContent as string;
    expect(html).toContain("isn't available");
  });

  it("flag helpers pair colour with a shape+tone (never colour-only)", () => {
    const c = mount(baseReport("physio")).componentInstance;
    expect(c.flagTone("high")).toBe("bad");
    expect(c.flagShape("high")).toBe("circle-alert");
    expect(c.flagTone("safe")).toBe("good");
    expect(c.flagShape("ok")).toBe("check");
    expect(c.lens()).toBe("clinical");
  });
});
