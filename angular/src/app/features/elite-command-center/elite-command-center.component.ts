import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { MenuItem } from "primeng/api";
import { Breadcrumb } from "primeng/breadcrumb";
import { DataView } from "primeng/dataview";
import { Dock } from "primeng/dock";
import { Drawer } from "primeng/drawer";
import { InputText } from "primeng/inputtext";
import { MultiSelect } from "primeng/multiselect";
import { Paginator } from "primeng/paginator";
import { PickList } from "primeng/picklist";
import { ProgressBar } from "primeng/progressbar";
import { Step, StepList, Stepper } from "primeng/stepper";
import { TabPanel, Tabs } from "primeng/tabs";
import { Timeline } from "primeng/timeline";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Tooltip } from "primeng/tooltip";
import { UIChart } from "primeng/chart";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { ResponsiveGridSpanDirective } from "../../shared/directives/responsive-grid-span.directive";
import { TableComponent } from "../../shared/components/table/table.component";
import { MenubarComponent } from "../../shared/components/menubar/menubar.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { PlatformService } from "../../core/services/platform.service";
import { ELITE_INTERACTION_BEHAVIORS } from "./elite-interaction.behaviors";

interface KpiMetric {
  id: string;
  label: string;
  value: string;
  delta: number;
  status: "success" | "warn" | "danger" | "info";
  completion: number;
  sparkline: number[];
}

interface QueueItem {
  athlete: string;
  severity: "critical" | "warning" | "info";
  issue: string;
  eta: string;
  unit: string;
}

interface TimelineEvent {
  status: "success" | "warning" | "danger" | "info";
  title: string;
  detail: string;
  ts: string;
}

interface ProtocolStep {
  label: string;
  complete: boolean;
  locked?: boolean;
  note: string;
}

@Component({
  selector: "app-elite-command-center",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MainLayoutComponent,
    AlertComponent,
    ButtonComponent,
    IconButtonComponent,
    ResponsiveGridSpanDirective,
    MenubarComponent,
    Breadcrumb,
    Dock,
    CardShellComponent,
    StatusTagComponent,
    ProgressBar,
    UIChart,
    DataView,
    TableComponent,
    Timeline,
    Tooltip,
    Stepper,
    StepList,
    Step,
    ToggleSwitch,
    Tabs,
    TabPanel,
    MultiSelect,
    InputText,
    Paginator,
    Drawer,
    PickList,
  ],
  templateUrl: "./elite-command-center.component.html",
  styleUrl: "./elite-command-center.component.scss",
})
export class EliteCommandCenterComponent {
  private readonly platform = inject(PlatformService);

  readonly interactionBehaviorSpecs = ELITE_INTERACTION_BEHAVIORS;

  readonly theme = signal<"light" | "dark">("dark");
  readonly activeMode = signal<string>("dashboard");
  readonly selectedQueueItem = signal<QueueItem | null>(null);
  readonly drawerVisible = signal(false);

  readonly menuItems: MenuItem[] = [
    { label: "Dashboard", icon: "pi pi-home", command: () => this.activeMode.set("dashboard") },
    { label: "Athlete View", icon: "pi pi-user", command: () => this.activeMode.set("athlete") },
    { label: "Coach View", icon: "pi pi-users", command: () => this.activeMode.set("coach") },
    { label: "Analytics", icon: "pi pi-chart-line", command: () => this.activeMode.set("analytics") },
    { label: "Settings", icon: "pi pi-cog", command: () => this.activeMode.set("settings") },
  ];

  readonly breadcrumbItems: MenuItem[] = [
    { label: "Performance" },
    { label: "Elite Command Center" },
  ];

  readonly homeCrumb: MenuItem = { icon: "pi pi-home", routerLink: "/dashboard" };

  readonly dockItems: MenuItem[] = [
    { label: "Protocol", icon: "pi pi-list-check", command: () => this.activeMode.set("dashboard") },
    { label: "Queue", icon: "pi pi-bolt", command: () => this.activeMode.set("coach") },
    { label: "Insights", icon: "pi pi-chart-bar", command: () => this.activeMode.set("analytics") },
    { label: "Settings", icon: "pi pi-sliders-h", command: () => this.activeMode.set("settings") },
  ];

  readonly kpis = signal<KpiMetric[]>([
    {
      id: "readiness",
      label: "Team Readiness",
      value: "87",
      delta: 6.1,
      status: "success",
      completion: 87,
      sparkline: [72, 74, 79, 81, 83, 85, 87],
    },
    {
      id: "load",
      label: "Acute:Chronic Load",
      value: "1.21",
      delta: -0.08,
      status: "warn",
      completion: 63,
      sparkline: [1.05, 1.11, 1.19, 1.25, 1.3, 1.27, 1.21],
    },
    {
      id: "recovery",
      label: "Recovery Compliance",
      value: "92%",
      delta: 2.3,
      status: "success",
      completion: 92,
      sparkline: [80, 84, 86, 89, 90, 91, 92],
    },
    {
      id: "risk",
      label: "Critical Flags",
      value: "3",
      delta: -2,
      status: "danger",
      completion: 30,
      sparkline: [8, 7, 6, 6, 5, 4, 3],
    },
  ]);

  readonly queue = signal<QueueItem[]>([
    {
      athlete: "A. Johnson",
      severity: "critical",
      issue: "Hamstring readiness drop > 20%",
      eta: "14m",
      unit: "U18-A",
    },
    {
      athlete: "M. Reed",
      severity: "warning",
      issue: "Sleep debt trend approaching threshold",
      eta: "35m",
      unit: "U18-B",
    },
    {
      athlete: "S. Perez",
      severity: "info",
      issue: "Hydration compliance improved; review note",
      eta: "49m",
      unit: "U16-A",
    },
  ]);

  readonly timeline = signal<TimelineEvent[]>([
    {
      status: "info",
      title: "Warm-up block confirmed",
      detail: "Velocity circuit locked for 16:30 session",
      ts: "16:08",
    },
    {
      status: "warning",
      title: "Load guard triggered",
      detail: "Two athletes exceed programmed sprint density",
      ts: "15:54",
    },
    {
      status: "success",
      title: "Recovery protocol complete",
      detail: "89% completion in 20-minute post-session checklist",
      ts: "15:42",
    },
  ]);

  readonly protocolSteps = signal<ProtocolStep[]>([
    {
      label: "Pre-session readiness check",
      complete: true,
      note: "All starters validated",
    },
    {
      label: "High-intensity modulation",
      complete: false,
      note: "Needs final coach approval",
    },
    {
      label: "Post-session tissue recovery",
      complete: false,
      locked: true,
      note: "Unlocks after step 2",
    },
  ]);

  readonly rosterOptions = [
    { label: "U18-A", value: "U18-A" },
    { label: "U18-B", value: "U18-B" },
    { label: "U16-A", value: "U16-A" },
  ];

  readonly selectedRosters = signal<string[]>(["U18-A", "U18-B"]);
  readonly tableFilter = signal("");
  readonly tableFirst = signal(0);

  readonly assignmentSource = signal<string[]>([
    "Speed Program",
    "Recovery Protocol",
    "Hydration Follow-up",
    "Biomechanics Review",
  ]);
  readonly assignmentTarget = signal<string[]>(["Starter Unit", "Rehab Unit"]);

  readonly alertCollapsed = signal(false);

  readonly filteredQueue = computed(() => {
    const filter = this.tableFilter().trim().toLowerCase();
    const selected = new Set(this.selectedRosters());

    return this.queue().filter((row) => {
      const matchesFilter =
        !filter ||
        row.athlete.toLowerCase().includes(filter) ||
        row.issue.toLowerCase().includes(filter);
      const matchesRoster = selected.size === 0 || selected.has(row.unit);
      return matchesFilter && matchesRoster;
    });
  });

  toggleTheme(): void {
    const next = this.theme() === "dark" ? "light" : "dark";
    this.theme.set(next);

    if (this.platform.isBrowser) {
      document.documentElement.setAttribute("data-theme", next);
      document.body.classList.toggle("dark-theme", next === "dark");
    }
  }

  openDetails(row: QueueItem): void {
    this.selectedQueueItem.set(row);
    this.drawerVisible.set(true);
  }

  closeDrawer(): void {
    this.drawerVisible.set(false);
  }

  onTablePageChange(event: { first?: number }): void {
    this.tableFirst.set(event.first ?? 0);
  }

  onModeChange(value: string | number | undefined): void {
    if (typeof value === "string") {
      this.activeMode.set(value);
    }
  }

  getSeverityTag(severity: QueueItem["severity"]): "danger" | "warn" | "info" {
    if (severity === "critical") {
      return "danger";
    }

    if (severity === "warning") {
      return "warn";
    }

    return "info";
  }

  getDeltaIcon(delta: number): string {
    return delta >= 0 ? "pi pi-arrow-up-right" : "pi pi-arrow-down-right";
  }

  getSparkData(points: number[]): { labels: string[]; datasets: unknown[] } {
    return {
      labels: ["-6", "-5", "-4", "-3", "-2", "-1", "now"],
      datasets: [
        {
          data: points,
          borderColor: "var(--color-primary)",
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  }

  readonly sparkOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };
}
