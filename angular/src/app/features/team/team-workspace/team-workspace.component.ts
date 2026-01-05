import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

@Component({
  selector: "app-team-workspace",
  standalone: true,
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
      <div class="team-workspace-page">
        <app-page-header
          title="Team Management"
          subtitle="Roster, attendance, and administrative tools"
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
                <div class="tool-card" routerLink="/depth-chart">
                  <i class="pi pi-list"></i>
                  <h3>Depth Chart</h3>
                  <p>Set starters and secondary positions.</p>
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
                <div class="tool-card" routerLink="/equipment">
                  <i class="pi pi-box"></i>
                  <h3>Equipment Hub</h3>
                  <p>Inventory and gear assignments.</p>
                </div>
                <div class="tool-card" routerLink="/tournaments">
                  <i class="pi pi-trophy"></i>
                  <h3>Tournaments</h3>
                  <p>Manage multi-game event logistics.</p>
                </div>
                <div class="tool-card" routerLink="/officials">
                  <i class="pi pi-flag"></i>
                  <h3>Officials</h3>
                  <p>Manage referee assignments and contacts.</p>
                </div>
              </div>
            </p-tabpanel>

            <!-- Tab 2: Settings -->
            <p-tabpanel value="2">
              <div class="tab-content-grid">
                <div class="tool-card" routerLink="/team/create">
                  <i class="pi pi-plus"></i>
                  <h3>Create New Team</h3>
                  <p>Start a new squad or seasonal program.</p>
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
  styles: [
    `
      .team-workspace-page {
        padding: var(--spacing-4);
      }

      .tab-content-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--spacing-4);
        padding: var(--spacing-6) 0;
      }

      .tool-card {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: var(--radius-lg);
        padding: var(--spacing-6);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .tool-card:hover {
        border-color: var(--ds-primary-green);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .tool-card i {
        font-size: var(--icon-2xl); /* 32px - feature icon */
        color: var(--ds-primary-green);
        margin-bottom: var(--spacing-4);
      }

      .tool-card h3 {
        font-size: var(--font-size-h2); /* H2: Card titles - 18px */
        margin: 0 0 var(--spacing-2) 0;
        font-weight: var(--font-weight-semibold); /* H2: Semibold (600) */
      }

      .tool-card p {
        font-size: var(--font-size-sm);
        color: var(--text-color-secondary);
        margin: 0;
      }

      .mr-2 {
        margin-right: 0.5rem;
      }
    `,
  ],
})
export class TeamWorkspaceComponent {}
