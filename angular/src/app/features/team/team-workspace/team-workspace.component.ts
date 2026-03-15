import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

@Component({
  selector: "app-team-workspace",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    Tabs,
    TabPanel,
    TabPanels,
    TabList,
    Tab,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="team-workspace-page ui-page-shell ui-page-shell--wide ui-page-stack">
        <app-page-header
          title="Team Workspace"
          subtitle="Roster, operations, and shared team settings"
          icon="pi-users"
        ></app-page-header>

        <p-tabs value="0">
          <p-tablist>
            <p-tab value="0"
              ><i class="pi pi-users mr-2"></i> Roster & Squad</p-tab
            >
            <p-tab value="1"
              ><i class="pi pi-calendar mr-2"></i> Ops & Logistics</p-tab
            >
            <p-tab value="2"
              ><i class="pi pi-cog mr-2"></i> Team Settings</p-tab
            >
          </p-tablist>

          <p-tabpanels>
            <!-- Tab 0: Roster & Depth -->
            <p-tabpanel value="0">
              <div class="tab-content-grid">
                <div class="tool-card" routerLink="/roster">
                  <i class="pi pi-users"></i>
                  <h3>Roster Manager</h3>
                  <p>View and manage all active athletes.</p>
                </div>
                <div class="tool-card" routerLink="/roster" fragment="squad-planning">
                  <i class="pi pi-list"></i>
                  <h3>Squad Planning</h3>
                  <p>Review starters and role coverage from the roster workspace.</p>
                </div>
                <div class="tool-card" routerLink="/attendance">
                  <i class="pi pi-check-square"></i>
                  <h3>Attendance</h3>
                  <p>Track practice and game participation.</p>
                </div>
              </div>
            </p-tabpanel>

            <!-- Tab 1: Ops & Logistics -->
            <p-tabpanel value="1">
              <div class="tab-content-grid">
                <div class="tool-card" routerLink="/coach/practice">
                  <i class="pi pi-calendar-plus"></i>
                  <h3>Practice Planner</h3>
                  <p>Plan sessions, drills, attendance, and equipment needs.</p>
                </div>
                <div class="tool-card" routerLink="/tournaments">
                  <i class="pi pi-trophy"></i>
                  <h3>Tournaments</h3>
                  <p>Manage multi-game event logistics.</p>
                </div>
                <div class="tool-card" routerLink="/coach/team">
                  <i class="pi pi-flag"></i>
                  <h3>Game Day Setup</h3>
                  <p>Manage operational details and team administration.</p>
                </div>
              </div>
            </p-tabpanel>

            <!-- Tab 2: Settings -->
            <p-tabpanel value="2">
              <div class="tab-content-grid">
                <div class="tool-card" routerLink="/coach/team">
                  <i class="pi pi-cog"></i>
                  <h3>Team Settings</h3>
                  <p>Update team profile and preferences.</p>
                </div>
                <div class="tool-card" routerLink="/coach/planning">
                  <i class="pi pi-plus"></i>
                  <h3>Season Planning</h3>
                  <p>Set up calendars, programs, and the next training cycle.</p>
                </div>
                <div class="tool-card" routerLink="/settings">
                  <i class="pi pi-cog"></i>
                  <h3>Platform Settings</h3>
                  <p>Adjust notification and sharing defaults.</p>
                </div>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./team-workspace.component.scss",
})
export class TeamWorkspaceComponent {}
