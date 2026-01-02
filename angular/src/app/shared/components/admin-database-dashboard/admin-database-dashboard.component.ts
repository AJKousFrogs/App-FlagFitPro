import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { Tabs } from "primeng/tabs";
import { AdminService } from "../../../core/services/admin.service";
import { MessageService } from "primeng/api";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-admin-database-dashboard",
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, Tabs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  template: `
    <div class="admin-dashboard">
      <!-- Database Health Monitor -->
      <p-card header="Database Health" class="health-card">
        <div class="health-metrics">
          @for (metric of healthMetrics(); track metric.name) {
            <div class="health-item">
              <div class="metric-header">
                <i [class]="metric.icon" [style.color]="metric.color"></i>
                <span>{{ metric.name }}</span>
              </div>
              <div class="metric-value">{{ metric.value }}</div>
              <p-tag
                [value]="metric.status"
                [severity]="metric.severity"
              ></p-tag>
            </div>
          }
        </div>
      </p-card>

      <!-- Data Sources Management -->
      <p-card header="Data Sources" class="sources-card">
        <p-tabs>
          <p-tabpanel header="USDA Foods" leftIcon="pi pi-apple">
            <div class="data-manager">
              <p>USDA Food Data Manager - Coming Soon</p>
              <p>
                This component will allow you to manage and sync USDA food
                database entries.
              </p>
            </div>
          </p-tabpanel>

          <p-tabpanel header="Recovery Protocols" leftIcon="pi pi-refresh">
            <div class="data-manager">
              <p>Recovery Protocols Data Manager - Coming Soon</p>
              <p>
                This component will allow you to manage recovery protocols and
                their evidence.
              </p>
            </div>
          </p-tabpanel>

          <p-tabpanel header="AI Coaches" leftIcon="pi pi-users">
            <div class="data-manager">
              <p>AI Coaches Data Manager - Coming Soon</p>
              <p>
                This component will allow you to manage AI coach personalities
                and configurations.
              </p>
            </div>
          </p-tabpanel>

          <p-tabpanel header="Research Data" leftIcon="pi pi-book">
            <div class="data-manager">
              <p>Research Data Manager - Coming Soon</p>
              <p>
                This component will allow you to manage research studies and
                citations.
              </p>
            </div>
          </p-tabpanel>
        </p-tabs>
      </p-card>

      <!-- Data Sync Controls -->
      <p-card header="Data Synchronization" class="sync-card">
        <div class="sync-controls">
          <p-button
            label="Sync USDA Data"
            icon="pi pi-refresh"
            [loading]="syncingUSDA()"
            (onClick)="syncUSDAData()"
          >
          </p-button>

          <p-button
            label="Update Research Studies"
            icon="pi pi-download"
            [loading]="syncingResearch()"
            (onClick)="syncResearchData()"
          >
          </p-button>

          <p-button
            label="Backup Database"
            icon="pi pi-save"
            severity="secondary"
            [loading]="creatingBackup()"
            (onClick)="createBackup()"
          >
          </p-button>
        </div>

        @if (lastSyncStatus().length > 0) {
          <div class="sync-status">
            <h4>Last Sync Status</h4>
            <div class="status-grid">
              @for (status of lastSyncStatus(); track status.source) {
                <div class="status-item">
                  <span class="status-name">{{ status.source }}</span>
                  <span class="status-time">{{
                    status.timestamp | date: "medium"
                  }}</span>
                  <p-tag
                    [value]="status.result"
                    [severity]="status.severity"
                  ></p-tag>
                </div>
              }
            </div>
          </div>
        }
      </p-card>
    </div>
  `,
  styleUrl: './admin-database-dashboard.component.scss',
})
export class AdminDatabaseDashboardComponent {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);

  healthMetrics = signal<any[]>([]);
  syncingUSDA = signal(false);
  syncingResearch = signal(false);
  creatingBackup = signal(false);

  constructor() {
    // Angular 21: Initialize in constructor instead of OnInit
    this.loadHealthMetrics();
    this.loadSyncStatus();
  }
  lastSyncStatus = signal<any[]>([]);

  async syncUSDAData() {
    this.syncingUSDA.set(true);
    try {
      const success = await firstValueFrom(this.adminService.syncUSDAData());
      if (success) {
        this.messageService.add({
          severity: "success",
          summary: "Success",
          detail: "USDA data synchronized successfully",
        });
      } else {
        throw new Error("Sync failed");
      }
    } catch (error) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to sync USDA data",
      });
    } finally {
      this.syncingUSDA.set(false);
      this.loadSyncStatus();
    }
  }

  async syncResearchData() {
    this.syncingResearch.set(true);
    try {
      const success = await firstValueFrom(
        this.adminService.syncResearchData(),
      );
      if (success) {
        this.messageService.add({
          severity: "success",
          summary: "Success",
          detail: "Research data synchronized successfully",
        });
      } else {
        throw new Error("Sync failed");
      }
    } catch (error) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to sync research data",
      });
    } finally {
      this.syncingResearch.set(false);
      this.loadSyncStatus();
    }
  }

  async createBackup() {
    this.creatingBackup.set(true);
    try {
      const backupInfo = await firstValueFrom(
        this.adminService.createDatabaseBackup(),
      );
      this.messageService.add({
        severity: "success",
        summary: "Success",
        detail: `Backup created: ${backupInfo.filename}`,
      });
    } catch (error) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to create backup",
      });
    } finally {
      this.creatingBackup.set(false);
    }
  }

  private async loadHealthMetrics() {
    const metrics = await firstValueFrom(this.adminService.getHealthMetrics());
    this.healthMetrics.set(metrics);
  }

  private async loadSyncStatus() {
    const statuses = await firstValueFrom(
      this.adminService.getLastSyncStatus(),
    );
    this.lastSyncStatus.set(statuses);
  }
}

// Placeholder components for data managers (to be implemented separately)
@Component({
  selector: "app-usda-data-manager",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="data-manager">
      <p>USDA Food Data Manager - Coming Soon</p>
      <p>
        This component will allow you to manage and sync USDA food database
        entries.
      </p>
    </div>
  `,
})
export class USDADataManagerComponent {}

@Component({
  selector: "app-recovery-data-manager",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="data-manager">
      <p>Recovery Protocols Data Manager - Coming Soon</p>
      <p>
        This component will allow you to manage recovery protocols and their
        evidence.
      </p>
    </div>
  `,
})
export class RecoveryDataManagerComponent {}

@Component({
  selector: "app-ai-coaches-manager",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="data-manager">
      <p>AI Coaches Data Manager - Coming Soon</p>
      <p>
        This component will allow you to manage AI coach personalities and
        configurations.
      </p>
    </div>
  `,
})
export class AICoachesManagerComponent {}

@Component({
  selector: "app-research-data-manager",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="data-manager">
      <p>Research Data Manager - Coming Soon</p>
      <p>
        This component will allow you to manage research studies and citations.
      </p>
    </div>
  `,
})
export class ResearchDataManagerComponent {}
