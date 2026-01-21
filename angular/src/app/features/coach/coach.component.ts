import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { Card } from "primeng/card";
import { Table, TableModule } from "primeng/table";
import { Tag } from "primeng/tag";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import {
  getMappedStatusSeverity,
  teamMemberStatusSeverityMap
} from "../../shared/utils/status.utils";
import { Dialog } from "primeng/dialog";
import { PrimeTemplate } from "primeng/api";
import { InputText } from "primeng/inputtext";
import { Tooltip } from "primeng/tooltip";
import { Textarea } from "primeng/textarea";
import { DatePicker } from "primeng/datepicker";
import { Select } from "primeng/select";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";
import { ApiService } from "../../core/services/api.service";
import { ToastService } from "../../core/services/toast.service";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { SupabaseService } from "../../core/services/supabase.service";
import { CONSENT_BLOCKED_MESSAGES } from "../../shared/utils/privacy-ux-copy";
import { LazyChartComponent } from "../../shared/components/lazy-chart/lazy-chart.component";

/**
 * Interface for consent information returned from API
 */
interface ConsentInfo {
  blockedPlayerIds: string[];
  partialDataNotice?: string;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
  performance: number;
  attendance: number;
  status: string;
  isConsentBlocked?: boolean;
}

@Component({
  selector: "app-coach",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterModule,
    Card,
    ButtonComponent,
    IconButtonComponent,

    LazyChartComponent,
    Table,
    TableModule,
    Tag,
    StatusTagComponent,
    Dialog,
    PrimeTemplate,
    InputText,
    Tooltip,
    Textarea,
    DatePicker,
    Select,
    MainLayoutComponent,
    PageHeaderComponent,
    StatsGridComponent,
  ],
  template: `
    <app-main-layout>
      <div class="coach-page">
        <app-page-header
          title="Coach Dashboard"
          subtitle="Manage your team, track performance, and create training sessions"
          icon="pi-users"
        >
          <app-button iconLeft="pi-plus" (clicked)="openCreateSession()"
            >Create Session</app-button
          >
        </app-page-header>

        <!-- Coach Stats -->
        <app-stats-grid [stats]="stats()"></app-stats-grid>

        <!-- Partial Data Notice (when some players have blocked consent) -->
        @if (hasBlockedPlayers()) {
          <div class="partial-data-notice">
            <div class="notice-icon">
              <i class="pi pi-info-circle"></i>
            </div>
            <div class="notice-content">
              <h4>{{ partialDataMessage.title }}</h4>
              <p>{{ partialDataMessage.reason }}</p>
              <a [routerLink]="partialDataMessage.helpLink" class="notice-link">
                <i class="pi pi-external-link"></i>
                {{ partialDataMessage.actionLabel }}
              </a>
            </div>
          </div>
        }

        <!-- Team Performance Chart - Lazy loaded for performance -->
        @defer (on viewport) {
          <p-card class="chart-card">
            <ng-template pTemplate="header">
              <h3>Team Performance Overview</h3>
            </ng-template>
            @if (teamChartData()) {
              <app-lazy-chart
                type="line"
                [data]="teamChartData()"
                [options]="chartOptions"
              ></app-lazy-chart>
            }
          </p-card>
        } @placeholder {
          <p-card class="chart-card">
            <div class="chart-loading">Loading chart...</div>
          </p-card>
        }

        <!-- Team Members Table -->
        <p-card class="table-card">
          <ng-template pTemplate="header">
            <h3>Team Members</h3>
          </ng-template>
          <p-table
            [value]="teamMembers()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [scrollable]="teamMembers().length > 20"
            [scrollHeight]="teamMembers().length > 20 ? '600px' : undefined"
            [virtualScroll]="teamMembers().length > 50"
            [virtualScrollItemSize]="46"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Performance</th>
                <th>Attendance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-member>
              <tr
                [attr.data-member-id]="member.id"
                [class.consent-blocked-row]="member.isConsentBlocked"
              >
                <td>
                  <div class="member-name-cell">
                    {{ member.name }}
                    @if (member.isConsentBlocked) {
                      <span class="blocked-indicator">
                        <i class="pi pi-lock"></i>
                      </span>
                    }
                  </div>
                </td>
                <td>{{ member.position }}</td>
                <td>
                  @if (member.isConsentBlocked) {
                    <span class="blocked-data">—</span>
                  } @else {
                    <app-status-tag
                      [value]="member.performance + '%'"
                      [severity]="getPerformanceSeverity(member.performance)"
                      size="sm"
                    />
                  }
                </td>
                <td>
                  @if (member.isConsentBlocked) {
                    <span class="blocked-data">—</span>
                  } @else {
                    {{ member.attendance }}%
                  }
                </td>
                <td>
                  @if (member.isConsentBlocked) {
                    <app-status-tag value="Private" severity="secondary" size="sm" />
                  } @else {
                    <app-status-tag
                      [value]="member.status"
                      [severity]="getStatusSeverity(member.status)"
                      size="sm"
                    />
                  }
                </td>
                <td>
                  @if (member.isConsentBlocked) {
                    <app-icon-button
                      icon="pi-envelope"
                      ariaLabel="Request data sharing"
                      tooltip="Ask athlete to enable sharing"
                      (clicked)="requestDataSharing(member)"
                    />
                  } @else {
                    <app-icon-button
                      icon="pi-eye"
                      ariaLabel="View details"
                      (clicked)="viewMemberDetails(member)"
                    />
                    <app-icon-button
                      icon="pi-pencil"
                      ariaLabel="Edit"
                      (clicked)="editMember(member)"
                    />
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </div>

      <!-- Create Session Dialog -->
      <p-dialog
        header="Create Training Session"
        [(visible)]="showCreateSessionDialog"
        [modal]="true"
        [style]="{ width: '550px' }"
        [closable]="true"
      >
        <div class="session-form">
          <div class="p-field mb-4">
            <label for="sessionTitle" class="p-label">Session Title</label>
            <input
              id="sessionTitle"
              type="text"
              pInputText
              [(ngModel)]="newSession.title"
              placeholder="e.g., Speed & Agility Training"
              class="w-full"
            />
          </div>
          <div class="p-field mb-4">
            <label for="sessionType" class="p-label">Session Type</label>
            <p-select
              id="sessionType"
              [(ngModel)]="newSession.type"
              [options]="sessionTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select session type"
              styleClass="w-full"
            ></p-select>
          </div>
          <div class="p-field mb-4">
            <label for="sessionDate" class="p-label">Date & Time</label>
            <p-datepicker
              id="sessionDate"
              [(ngModel)]="newSession.date"
              [showTime]="true"
              [showIcon]="true"
              dateFormat="mm/dd/yy"
              styleClass="w-full"
            ></p-datepicker>
          </div>
          <div class="p-field mb-4">
            <label for="sessionDuration" class="p-label"
              >Duration (minutes)</label
            >
            <input
              id="sessionDuration"
              type="number"
              pInputText
              [(ngModel)]="newSession.duration"
              placeholder="e.g., 90"
              class="w-full"
            />
          </div>
          <div class="p-field mb-4">
            <label for="sessionLocation" class="p-label">Location</label>
            <input
              id="sessionLocation"
              type="text"
              pInputText
              [(ngModel)]="newSession.location"
              placeholder="e.g., Main Field"
              class="w-full"
            />
          </div>
          <div class="p-field mb-4">
            <label for="sessionNotes" class="p-label">Notes (optional)</label>
            <textarea
              id="sessionNotes"
              pInputTextarea
              [(ngModel)]="newSession.notes"
              placeholder="Any additional notes for the session..."
              rows="3"
              class="w-full"
            ></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <app-button variant="text" (clicked)="showCreateSessionDialog = false"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-check"
            [loading]="isCreatingSession()"
            [disabled]="!isSessionValid()"
            (clicked)="createSession()"
            >Create Session</app-button
          >
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./coach.component.scss",
})
export class CoachComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  stats = signal<
    {
      label: string;
      value: number | string;
      icon: string;
      iconType?: "primary" | "error" | "warning" | "info";
      trend?: string;
    }[]
  >([]);
  teamChartData = signal<{
    labels: string[];
    datasets: { label: string; data: number[] }[];
  } | null>(null);
  teamMembers = signal<TeamMember[]>([]);

  // Consent blocked players tracking
  consentInfo = signal<ConsentInfo>({ blockedPlayerIds: [] });

  // Get partial data message from centralized privacy copy
  partialDataMessage = CONSENT_BLOCKED_MESSAGES.coachTeamPartialBlock;

  // Dialog state
  showCreateSessionDialog = false;
  isCreatingSession = signal(false);
  newSession = {
    title: "",
    type: "",
    date: new Date(),
    duration: 60,
    location: "",
    notes: "",
  };

  sessionTypes = [
    { label: "Practice", value: "practice" },
    { label: "Scrimmage", value: "scrimmage" },
    { label: "Conditioning", value: "conditioning" },
    { label: "Film Review", value: "film_review" },
    { label: "Strength Training", value: "strength" },
    { label: "Recovery", value: "recovery" },
  ];

  chartOptions = DEFAULT_CHART_OPTIONS;

  ngOnInit(): void {
    this.loadCoachData();
  }

  loadCoachData(): void {
    // Load stats from real sources (placeholder for now but clean)
    this.stats.set([
      {
        label: "Team Members",
        value: "0",
        icon: "pi-users",
        iconType: "primary",
      },
      {
        label: "Avg Performance",
        value: "0%",
        icon: "pi-chart-line",
        iconType: "primary",
      },
      {
        label: "Active Sessions",
        value: "0",
        icon: "pi-calendar",
        iconType: "warning",
      },
      {
        label: "Upcoming Games",
        value: "0",
        icon: "pi-trophy",
        iconType: "error",
      },
    ]);

    // Load team chart
    this.teamChartData.set(null);

    // Load team members
    this.teamMembers.set([]);
  }

  openCreateSession(): void {
    // Reset form and open dialog
    this.newSession = {
      title: "",
      type: "",
      date: new Date(),
      duration: 60,
      location: "",
      notes: "",
    };
    this.showCreateSessionDialog = true;
  }

  isSessionValid(): boolean {
    return !!(
      this.newSession.title &&
      this.newSession.type &&
      this.newSession.date
    );
  }

  async createSession(): Promise<void> {
    if (!this.isSessionValid()) {
      this.toastService.warn(TOAST.WARN.REQUIRED_FIELDS);
      return;
    }

    this.isCreatingSession.set(true);

    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) {
        this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
        return;
      }

      // Save to Supabase
      const { error } = await this.supabaseService.client
        .from("training_sessions")
        .insert({
          coach_id: user.id,
          title: this.newSession.title,
          session_type: this.newSession.type,
          scheduled_at: this.newSession.date.toISOString(),
          duration_minutes: this.newSession.duration,
          location: this.newSession.location,
          notes: this.newSession.notes,
          status: "scheduled",
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(error.message);
      }

      this.toastService.success(TOAST.SUCCESS.SESSION_CREATED_SUCCESS);
      this.showCreateSessionDialog = false;

      // Update stats
      const currentStats = this.stats();
      const sessionsStat = currentStats.find(
        (s) => s.label === "Active Sessions",
      );
      if (sessionsStat) {
        const currentValue =
          typeof sessionsStat.value === "string"
            ? parseInt(sessionsStat.value, 10)
            : sessionsStat.value;
        sessionsStat.value = String((currentValue || 0) + 1);
        this.stats.set([...currentStats]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create session";
      this.toastService.error(message);
    } finally {
      this.isCreatingSession.set(false);
    }
  }

  viewMemberDetails(member: TeamMember): void {
    // Navigate to member profile or show details modal
    this.toastService.info(`Viewing ${member.name}'s profile`);
    this.router.navigate(["/roster"], { queryParams: { member: member.id } });
  }

  editMember(member: TeamMember): void {
    // Navigate to edit member page
    this.toastService.info(`Editing ${member.name}`);
    this.router.navigate(["/roster"], {
      queryParams: { member: member.id, edit: true },
    });
  }

  /**
   * Check if any players have blocked consent
   */
  hasBlockedPlayers(): boolean {
    return this.teamMembers().some((m) => m.isConsentBlocked);
  }

  /**
   * Request data sharing from a player with blocked consent
   */
  requestDataSharing(member: TeamMember): void {
    this.toastService.info(`Sending data sharing request to ${member.name}...`);
    this.router.navigate(["/settings/privacy"], {
      queryParams: { player: member.id, action: "request" },
    });
  }

  getPerformanceSeverity(
    performance: number,
  ): "success" | "info" | "warning" | "danger" {
    if (performance >= 90) return "success";
    if (performance >= 80) return "info";
    if (performance >= 70) return "warning";
    return "danger";
  }

  getStatusSeverity(status: string): "success" | "info" | "warning" | "danger" {
    return getMappedStatusSeverity(status, teamMemberStatusSeverityMap, "info");
  }

  trackByMemberId(index: number, member: TeamMember): string {
    return member.id;
  }
}
