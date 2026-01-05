import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

@Component({
  selector: "app-advanced-training",
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
    PageHeaderComponent
  ],
  template: `
    <app-main-layout>
      <div class="advanced-training-page">
        <app-page-header
          title="Advanced Training Tools"
          subtitle="Long-term planning, position-specific trackers, and AI scheduling"
          icon="pi-bolt"
        ></app-page-header>

        <p-tabs value="0">
          <p-tablist>
            <p-tab value="0"><i class="pi pi-calendar mr-2"></i> Planning</p-tab>
            <p-tab value="1"><i class="pi pi-bolt mr-2"></i> QB Hub</p-tab>
            <p-tab value="2"><i class="pi pi-history mr-2"></i> History & Logs</p-tab>
            <p-tab value="3"><i class="pi pi-shield mr-2"></i> Safety & Load</p-tab>
          </p-tablist>
          
          <p-tabpanels>
            <!-- Tab 0: Planning & Periodization -->
            <p-tabpanel value="0">
              <div class="tab-content-grid">
                <div class="tool-card" routerLink="/training/goal-planner">
                  <i class="pi pi-target"></i>
                  <h3>Goal Planner</h3>
                  <p>Define your LA28 objectives and track progress.</p>
                </div>
                <div class="tool-card" routerLink="/training/microcycle">
                  <i class="pi pi-sync"></i>
                  <h3>Microcycle Planner</h3>
                  <p>Detailed weekly training block management.</p>
                </div>
                <div class="tool-card" routerLink="/training/ai-scheduler">
                  <i class="pi pi-sparkles"></i>
                  <h3>AI Scheduler</h3>
                  <p>Auto-generate optimal training slots.</p>
                </div>
                <div class="tool-card" routerLink="/training/periodization">
                  <i class="pi pi-chart-line"></i>
                  <h3>Periodization</h3>
                  <p>Season-long load management view.</p>
                </div>
              </div>
            </p-tabpanel>

            <!-- Tab 1: QB Specific Tools -->
            <p-tabpanel value="1">
              <div class="tab-content-grid">
                <div class="tool-card" routerLink="/training/qb">
                  <i class="pi pi-send"></i>
                  <h3>Throwing Tracker</h3>
                  <p>Monitor volume and accuracy per distance.</p>
                </div>
                <div class="tool-card" routerLink="/training/qb">
                  <i class="pi pi-check-square"></i>
                  <h3>Skills Assessment</h3>
                  <p>Evaluate mechanical consistency and vision.</p>
                </div>
                <div class="tool-card" routerLink="/training/qb">
                  <i class="pi pi-calendar"></i>
                  <h3>QB Schedule</h3>
                  <p>Position-specific drills and sessions.</p>
                </div>
              </div>
            </p-tabpanel>

            <!-- Tab 2: Logs & History -->
            <p-tabpanel value="2">
              <div class="tab-content-grid">
                <div class="tool-card" routerLink="/training/log">
                  <i class="pi pi-book"></i>
                  <h3>Training Log</h3>
                  <p>Raw history of all completed sessions.</p>
                </div>
                <div class="tool-card" routerLink="/training/schedule">
                  <i class="pi pi-calendar"></i>
                  <h3>Full Calendar</h3>
                  <p>View past and future planned events.</p>
                </div>
                <div class="tool-card" routerLink="/training/import">
                  <i class="pi pi-upload"></i>
                  <h3>Import Data</h3>
                  <p>Upload sessions from external sources.</p>
                </div>
              </div>
            </p-tabpanel>

            <!-- Tab 3: Safety & Load -->
            <p-tabpanel value="3">
              <div class="tab-content-grid">
                <div class="tool-card" routerLink="/training/safety">
                  <i class="pi pi-shield"></i>
                  <h3>Safety Guidelines</h3>
                  <p>Injury prevention protocols and warm-ups.</p>
                </div>
                <div class="tool-card" routerLink="/training/load-analysis">
                  <i class="pi pi-chart-bar"></i>
                  <h3>Load Analysis</h3>
                  <p>Deep dive into acute/chronic imbalances.</p>
                </div>
                <div class="tool-card" routerLink="/game/nutrition">
                  <i class="pi pi-heart"></i>
                  <h3>Tournament Fueling</h3>
                  <p>Meal timing for multi-game match days.</p>
                </div>
                <div class="tool-card" routerLink="/travel/recovery">
                  <i class="pi pi-map"></i>
                  <h3>Travel Recovery</h3>
                  <p>Optimizing sleep and jet lag for away games.</p>
                </div>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .advanced-training-page {
      padding: var(--spacing-4);
    }

    .tab-content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: var(--spacing-4);
      padding: var(--spacing-6) 0;
    }

    .tool-card {
      background: var(--surface-primary);
      border: 1px solid var(--color-border-secondary);
      border-radius: var(--radius-lg);
      padding: var(--spacing-6);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .tool-card:hover {
      border-color: var(--ds-primary-green);
      transform: translateY(-4px);
      box-shadow: var(--shadow-2);
      background: var(--surface-secondary);
    }

    .tool-card i {
      font-size: var(--icon-2xl); /* 32px - feature icon */
      color: var(--ds-primary-green);
      margin-bottom: var(--spacing-4);
      transition: transform var(--transition-fast);
    }

    .tool-card:hover i {
      transform: scale(1.1);
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

    .mr-2 { margin-right: 0.5rem; }
  `]
})
export class AdvancedTrainingComponent {}
