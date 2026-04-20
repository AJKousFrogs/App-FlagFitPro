import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { map, startWith } from "rxjs";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { TeamWorkspaceVmService } from "../services/team-workspace-vm.service";

@Component({
  selector: "app-team-workspace",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TeamWorkspaceVmService],
  imports: [
    RouterModule,
    Tabs,
    TabPanel,
    TabPanels,
    TabList,
    Tab,
    ButtonComponent,
    CardShellComponent,
    EmptyStateComponent,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  templateUrl: "./team-workspace.component.html",
  styleUrl: "./team-workspace.component.scss",
})
export class TeamWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly vm = inject(TeamWorkspaceVmService);

  async ngOnInit(): Promise<void> {
    await this.vm.load();
  }

  private normalizeTab(value: string | number | null | undefined): "0" | "1" | "2" {
    return value === 1 || value === "1"
      ? "1"
      : value === 2 || value === "2"
        ? "2"
        : "0";
  }

  private readonly tabQueryParam = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => this.normalizeTab(params.get("tab"))),
      startWith(this.normalizeTab(this.route.snapshot.queryParamMap.get("tab"))),
    ),
    { initialValue: this.normalizeTab(this.route.snapshot.queryParamMap.get("tab")) },
  );

  readonly activeTab = computed(() => this.tabQueryParam());

  onTabChange(value: string | number | null | undefined): void {
    const nextTab = this.normalizeTab(value);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tab: nextTab === "0" ? null : nextTab,
      },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  async refresh(): Promise<void> {
    await this.vm.load();
  }

  getRoleLabel(role: string): string {
    return role
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return "TBD";

    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  }

  formatEventMeta(event: { start_time: string; location?: string; event_type?: string }): string {
    const date = new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(event.start_time));
    const type = event.event_type
      ? this.getRoleLabel(event.event_type)
      : "Team event";
    return [date, type, event.location].filter(Boolean).join(" • ");
  }
}
