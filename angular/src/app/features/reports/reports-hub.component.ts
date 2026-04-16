import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { TeamMembershipService } from "../../core/services/team-membership.service";

type ReportTypeFilter = "all" | "daily" | "coach" | "specialist" | "export";

interface ReportLink {
  title: string;
  description: string;
  route: string;
  icon: string;
  audience: string;
  cadence: string;
  output: string;
  type: Exclude<ReportTypeFilter, "all">;
  keywords: string[];
}

@Component({
  selector: "app-reports-hub",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardShellComponent,
  ],
  template: `
    <app-main-layout>
      <div class="reports-page ui-page-shell ui-page-shell--content-lg ui-page-stack">
        <app-page-header
          title="Reports"
          eyebrow="ANALYTICS"
          subtitle="A report catalog for daily athlete trends, coach review workflows, and specialist exports."
          icon="pi-chart-bar"
        >
          <app-button variant="outlined" iconLeft="pi-chart-line" routerLink="/performance/insights">
            Performance Insights
          </app-button>
        </app-page-header>

        <section class="summary-grid" aria-label="Reports overview">
          <app-card-shell title="Start Here" headerIcon="pi-compass">
            <p class="summary-copy">
              Use performance and workload reports for your daily review, then move into coach or specialist
              reporting as needed by role.
            </p>
            <div class="summary-meta">
              <span>{{ visibleReportCount() }} report surfaces available</span>
              <span>{{ reviewModeLabel() }}</span>
            </div>
          </app-card-shell>

          <app-card-shell title="Daily Review" headerIcon="pi-calendar">
            <p class="summary-copy">
              Best for athletes and coaches checking trends, workload, and recent movement before training.
            </p>
            <a class="summary-action" routerLink="/performance/insights">Open performance review</a>
          </app-card-shell>

          <app-card-shell title="Planning & Export" headerIcon="pi-send">
            <p class="summary-copy">
              Use team and specialist reports when you need planning context, exports, or staff-facing review.
            </p>
            <a class="summary-action" routerLink="/reports">Browse full catalog</a>
          </app-card-shell>
        </section>

        <section class="catalog-grid" aria-label="Report workflows">
          <app-card-shell title="Primary Workflow" headerIcon="pi-bolt">
            <div class="workflow-list">
              <div class="workflow-step">
                <span class="workflow-step__label">1. Review trends</span>
                <p>Start with performance or ACWR when you need a quick health and workload read.</p>
              </div>
              <div class="workflow-step">
                <span class="workflow-step__label">2. Move to team planning</span>
                <p>Coach reports are for opponent prep, team planning, and role-based coordination.</p>
              </div>
              <div class="workflow-step">
                <span class="workflow-step__label">3. Export specialist context</span>
                <p>Specialist reports support deeper staff workflows once team-level review is done.</p>
              </div>
            </div>
          </app-card-shell>

          <app-card-shell title="Report Availability" headerIcon="pi-objects-column">
            <div class="availability-list">
              <div class="availability-item">
                <span class="availability-item__label">Athlete reports</span>
                <strong>{{ coreReports.length }}</strong>
              </div>
              <div class="availability-item">
                <span class="availability-item__label">Coach reports</span>
                <strong>{{ showTeamReports() ? teamReports.length : 0 }}</strong>
              </div>
              <div class="availability-item">
                <span class="availability-item__label">Specialist reports</span>
                <strong>{{ showStaffReports() ? staffReports.length : 0 }}</strong>
              </div>
            </div>
          </app-card-shell>
        </section>

        <app-card-shell title="Find a Report" headerIcon="pi-search">
          <div class="report-finder">
            <div class="report-search">
              <i class="pi pi-search" aria-hidden="true"></i>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Search workload, scouting, psychology, exports..."
                aria-label="Search reports"
              />
            </div>

            <div class="report-filter-row" aria-label="Report type filters">
              @for (filter of reportTypeFilters; track filter.id) {
                <button
                  type="button"
                  class="report-filter-chip"
                  [class.report-filter-chip--active]="selectedReportType() === filter.id"
                  (click)="selectedReportType.set(filter.id)"
                >
                  {{ filter.label }}
                </button>
              }
            </div>

            <p class="summary-copy">
              {{ filteredReportCount() }} of {{ visibleReportCount() }} available report surfaces shown.
            </p>
          </div>
        </app-card-shell>

        @if (filteredCoreReports().length > 0) {
        <app-card-shell title="Daily Reports" headerIcon="pi-chart-line">
          <div class="reports-grid">
            @for (report of filteredCoreReports(); track report.route) {
              <a class="report-link" [routerLink]="report.route">
                <div class="report-link__header">
                  <i [class]="'pi ' + report.icon" aria-hidden="true"></i>
                  <span class="report-audience">{{ report.audience }}</span>
                </div>
                <h3>{{ report.title }}</h3>
                <p>{{ report.description }}</p>
                <div class="report-meta">
                  <span>{{ report.cadence }}</span>
                  <span>{{ report.output }}</span>
                </div>
              </a>
            }
          </div>
        </app-card-shell>
        }

        @if (showTeamReports() && filteredTeamReports().length > 0) {
          <app-card-shell title="Coach Reports" headerIcon="pi-flag">
            <div class="reports-grid">
              @for (report of filteredTeamReports(); track report.route) {
                <a class="report-link" [routerLink]="report.route">
                  <div class="report-link__header">
                    <i [class]="'pi ' + report.icon" aria-hidden="true"></i>
                    <span class="report-audience">{{ report.audience }}</span>
                  </div>
                  <h3>{{ report.title }}</h3>
                  <p>{{ report.description }}</p>
                  <div class="report-meta">
                    <span>{{ report.cadence }}</span>
                    <span>{{ report.output }}</span>
                  </div>
                </a>
              }
            </div>
          </app-card-shell>
        }

        @if (showStaffReports() && filteredStaffReports().length > 0) {
          <app-card-shell title="Specialist Reports" headerIcon="pi-heart-fill">
            <div class="reports-grid">
              @for (report of filteredStaffReports(); track report.route) {
                <a class="report-link" [routerLink]="report.route">
                <div class="report-link__header">
                  <i [class]="'pi ' + report.icon" aria-hidden="true"></i>
                  <span class="report-audience">{{ report.audience }}</span>
                </div>
                <h3>{{ report.title }}</h3>
                <p>{{ report.description }}</p>
                <div class="report-meta">
                  <span>{{ report.cadence }}</span>
                  <span>{{ report.output }}</span>
                </div>
              </a>
            }
          </div>
        </app-card-shell>
        } @else if (!showStaffReports()) {
          <app-card-shell title="Need team-level reports?" headerIcon="pi-lock">
            <p class="summary-copy">
              Team and staff reports appear here automatically when your role includes
              coach or specialist access.
            </p>
          </app-card-shell>
        }

        @if (filteredReportCount() === 0) {
          <app-card-shell title="No matching reports" headerIcon="pi-search">
            <p class="summary-copy">
              Try a broader search or switch the report type filter back to All reports.
            </p>
          </app-card-shell>
        }
      </div>
    </app-main-layout>
  `,
  styleUrl: "./reports-hub.component.scss",
})
export class ReportsHubComponent implements OnInit {
  private readonly teamMembershipService = inject(TeamMembershipService);
  readonly searchQuery = signal("");
  readonly selectedReportType = signal<ReportTypeFilter>("all");
  readonly reportTypeFilters: ReadonlyArray<{ id: ReportTypeFilter; label: string }> = [
    { id: "all", label: "All reports" },
    { id: "daily", label: "Daily review" },
    { id: "coach", label: "Coach" },
    { id: "specialist", label: "Specialist" },
    { id: "export", label: "Exports" },
  ];

  readonly coreReports: readonly ReportLink[] = [
    {
      title: "Performance Insights",
      description: "Review training, performance, and trend dashboards for the current athlete profile.",
      route: "/performance/insights",
      icon: "pi-chart-line",
      audience: "All users",
      cadence: "Daily review",
      output: "Trend dashboard",
      type: "daily",
      keywords: ["performance", "trend", "training", "daily", "athlete"],
    },
    {
      title: "ACWR Dashboard",
      description: "Inspect workload history, load ratios, and export-ready monitoring outputs.",
      route: "/acwr",
      icon: "pi-chart-bar",
      audience: "All users",
      cadence: "Weekly monitoring",
      output: "Load report",
      type: "export",
      keywords: ["acwr", "workload", "load", "injury", "export", "weekly"],
    },
  ];

  readonly teamReports: readonly ReportLink[] = [
    {
      title: "Scouting Reports",
      description: "Generate and review opponent scouting reports instead of hunting through planning tools.",
      route: "/coach/scouting",
      icon: "pi-eye",
      audience: "Coach",
      cadence: "Game prep",
      output: "Opponent report",
      type: "coach",
      keywords: ["scouting", "opponent", "game prep", "coach"],
    },
  ];

  readonly staffReports: readonly ReportLink[] = [
    {
      title: "Psychology Reports",
      description: "Open the psychology reporting workspace for specialist observations and generated reports.",
      route: "/staff/psychology",
      icon: "pi-file-edit",
      audience: "Staff",
      cadence: "Case review",
      output: "Specialist summary",
      type: "specialist",
      keywords: ["psychology", "staff", "specialist", "case", "wellbeing"],
    },
  ];

  readonly showTeamReports = computed(
    () => this.teamMembershipService.isCoach() || this.teamMembershipService.isAdmin(),
  );

  readonly showStaffReports = computed(
    () => this.teamMembershipService.canViewHealthData(),
  );

  readonly visibleReportCount = computed(
    () =>
      this.coreReports.length
      + (this.showTeamReports() ? this.teamReports.length : 0)
      + (this.showStaffReports() ? this.staffReports.length : 0),
  );

  readonly filteredCoreReports = computed(() => this.filterReports(this.coreReports));
  readonly filteredTeamReports = computed(() => this.filterReports(this.teamReports));
  readonly filteredStaffReports = computed(() => this.filterReports(this.staffReports));
  readonly filteredReportCount = computed(
    () =>
      this.filteredCoreReports().length
      + (this.showTeamReports() ? this.filteredTeamReports().length : 0)
      + (this.showStaffReports() ? this.filteredStaffReports().length : 0),
  );

  readonly reviewModeLabel = computed(() => {
    if (this.showStaffReports()) {
      return "Athlete, coach, and specialist views";
    }
    if (this.showTeamReports()) {
      return "Athlete and coach views";
    }
    return "Athlete-focused review";
  });

  async ngOnInit(): Promise<void> {
    await this.teamMembershipService.loadMembership();
  }

  private filterReports(reports: readonly ReportLink[]): ReportLink[] {
    const query = this.searchQuery().trim().toLowerCase();
    const type = this.selectedReportType();

    return reports.filter((report) => {
      if (type !== "all" && report.type !== type) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        report.title,
        report.description,
        report.audience,
        report.cadence,
        report.output,
        ...report.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }
}
