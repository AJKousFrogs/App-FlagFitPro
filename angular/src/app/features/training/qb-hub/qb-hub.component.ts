import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "primeng/tabs";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { QbThrowingTrackerComponent } from "../qb-throwing-tracker/qb-throwing-tracker.component";
import { QbAssessmentToolsComponent } from "../qb-assessment-tools/qb-assessment-tools.component";
import { QbTrainingScheduleComponent } from "../qb-training-schedule/qb-training-schedule.component";

@Component({
  selector: "app-qb-hub",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    Tabs,
    TabPanel,
    TabPanels,
    TabList,
    Tab,
    MainLayoutComponent,
    PageHeaderComponent,
    QbThrowingTrackerComponent,
    QbAssessmentToolsComponent,
    QbTrainingScheduleComponent
  ],
  template: `
    <app-main-layout>
      <div class="qb-hub-page">
        <app-page-header
          title="QB Performance Hub"
          subtitle="Unified position-specific tracking, assessments, and periodization"
          icon="pi-bolt"
        ></app-page-header>

        <p-tabs value="0">
          <p-tablist>
            <p-tab value="0"><i class="pi pi-bullseye mr-2"></i> Throwing Tracker</p-tab>
            <p-tab value="1"><i class="pi pi-clipboard mr-2"></i> Assessments</p-tab>
            <p-tab value="2"><i class="pi pi-calendar mr-2"></i> QB Schedule</p-tab>
          </p-tablist>
          
          <p-tabpanels>
            <p-tabpanel value="0">
              <div class="hub-tab-content">
                <app-qb-throwing-tracker></app-qb-throwing-tracker>
              </div>
            </p-tabpanel>

            <p-tabpanel value="1">
              <div class="hub-tab-content">
                <app-qb-assessment-tools></app-qb-assessment-tools>
              </div>
            </p-tabpanel>

            <p-tabpanel value="2">
              <div class="hub-tab-content">
                <app-qb-training-schedule></app-qb-training-schedule>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .qb-hub-page {
      padding: var(--spacing-4);
    }
    .hub-tab-content {
      padding: var(--spacing-6) 0;
    }
    .mr-2 { margin-right: 0.5rem; }
    
    /* Remove redundant headers from child components when inside the hub */
    :host ::ng-deep app-page-header {
      display: none;
    }
    :host > app-main-layout > .qb-hub-page > app-page-header {
      display: block;
    }
  `]
})
export class QbHubComponent {}
