import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import { Textarea } from "primeng/textarea";
import { DatePicker } from "primeng/datepicker";
import { Select } from "primeng/select";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { ConsentBlockedMessageComponent } from "../../shared/components/consent-blocked-message/consent-blocked-message.component";
import { DEFAULT_CHART_OPTIONS } from "../../shared/config/chart.config";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { ToastService } from "../../core/services/toast.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { CONSENT_BLOCKED_MESSAGES } from "../../shared/utils/privacy-ux-copy";

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
    CardModule,
    ButtonModule,
    ChartModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    TooltipModule,
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
          <p-button
            label="Create Session"
            icon="pi pi-plus"
            (onClick)="openCreateSession()"
          ></p-button>
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
              <p-chart
                type="line"
                [data]="teamChartData()"
                [options]="chartOptions"
              ></p-chart>
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
              <tr [attr.data-member-id]="member.id" [class.consent-blocked-row]="member.isConsentBlocked">
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
                    <p-tag
                      [value]="member.performance + '%'"
                      [severity]="getPerformanceSeverity(member.performance)"
                    >
                    </p-tag>
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
                    <p-tag value="Private" severity="secondary"></p-tag>
                  } @else {
                    <p-tag
                      [value]="member.status"
                      [severity]="getStatusSeverity(member.status)"
                    >
                    </p-tag>
                  }
                </td>
                <td>
                  @if (member.isConsentBlocked) {
                    <p-button
                      icon="pi pi-envelope"
                      [text]="true"
                      [rounded]="true"
                      ariaLabel="Request data sharing"
                      pTooltip="Ask athlete to enable sharing"
                      (onClick)="requestDataSharing(member)"
                    ></p-button>
                  } @else {
                    <p-button
                      icon="pi pi-eye"
                      [text]="true"
                      [rounded]="true"
                      ariaLabel="View details"
                      (onClick)="viewMemberDetails(member)"
                    ></p-button>
                    <p-button
                      icon="pi pi-pencil"
                      [text]="true"
                      [rounded]="true"
                      ariaLabel="Edit"
                      (onClick)="editMember(member)"
                    ></p-button>
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
            <label for="sessionDuration" class="p-label">Duration (minutes)</label>
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
          <p-button
            label="Cancel"
            [text]="true"
            (onClick)="showCreateSessionDialog = false"
          ></p-button>
          <p-button
            label="Create Session"
            icon="pi pi-check"
            [loading]="isCreatingSession()"
            [disabled]="!isSessionValid()"
            (onClick)="createSession()"
          ></p-button>
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styles: [
    `
      .coach-page {
        padding: var(--space-6);
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .stat-card {
        text-align: center;
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto var(--space-4);
        font-size: 1.5rem;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .chart-card,
      .table-card {
        margin-bottom: var(--space-6);
      }

      .chart-loading {
        padding: var(--space-8);
        text-align: center;
        color: var(--text-secondary);
      }

      /* Consent blocked styles */
      .consent-blocked-row {
        background: var(--surface-100) !important;
        opacity: 0.85;
      }

      .member-name-cell {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .blocked-indicator {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        background: var(--surface-400);
        border-radius: 50%;
      }

      .blocked-indicator i {
        font-size: 10px;
        color: white;
      }

      .blocked-data {
        color: var(--text-secondary);
        font-style: italic;
      }

      /* Partial Data Notice */
      .partial-data-notice {
        display: flex;
        align-items: flex-start;
        gap: var(--space-4);
        padding: var(--space-4);
        background: var(--p-blue-50);
        border: 1px solid var(--p-blue-200);
        border-radius: var(--p-border-radius);
        margin-bottom: var(--space-6);
      }

      .notice-icon {
        width: 40px;
        height: 40px;
        background: var(--p-blue-100);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .notice-icon i {
        font-size: 1.25rem;
        color: var(--p-blue-600);
      }

      .notice-content {
        flex: 1;
      }

      .notice-content h4 {
        margin: 0 0 var(--space-1);
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
      }

      .notice-content p {
        margin: 0 0 var(--space-2);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .notice-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        color: var(--p-blue-600);
        text-decoration: none;
      }

      .notice-link:hover {
        text-decoration: underline;
      }

      .notice-link i {
        font-size: 0.75rem;
      }

      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-4);
        }
      }
    `,
  ],
})
export class CoachComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  stats = signal<any[]>([]);
  teamChartData = signal<any>(null);
  teamMembers = signal<TeamMember[]>([]);
  
  // Consent blocked players tracking
  consentInfo = signal<ConsentInfo>({ blockedPlayerIds: [] });
  
  // Get partial data message from centralized privacy copy
  partialDataMessage = CONSENT_BLOCKED_MESSAGES.coachTeamPartialBlock;

  // Dialog state
  showCreateSessionDialog = false;
  isCreatingSession = signal(false);
  newSession = {
    title: '',
    type: '',
    date: new Date(),
    duration: 60,
    location: '',
    notes: '',
  };

  sessionTypes = [
    { label: 'Practice', value: 'practice' },
    { label: 'Scrimmage', value: 'scrimmage' },
    { label: 'Conditioning', value: 'conditioning' },
    { label: 'Film Review', value: 'film_review' },
    { label: 'Strength Training', value: 'strength' },
    { label: 'Recovery', value: 'recovery' },
  ];

  chartOptions = DEFAULT_CHART_OPTIONS;

  ngOnInit(): void {
    this.loadCoachData();
  }

  loadCoachData(): void {
    // Load stats
    this.stats.set([
      {
        label: "Team Members",
        value: "20",
        icon: "pi-users",
        color: "var(--ds-primary-green)",
      },
      {
        label: "Avg Performance",
        value: "85%",
        icon: "pi-chart-line",
        color: "#10c96b",
      },
      {
        label: "Active Sessions",
        value: "5",
        icon: "pi-calendar",
        color: "#f1c40f",
      },
      {
        label: "Upcoming Games",
        value: "3",
        icon: "pi-trophy",
        color: "#e74c3c",
      },
    ]);

    // Load team chart
    this.teamChartData.set({
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [
        {
          label: "Team Average",
          data: [82, 84, 85, 87],
          borderColor: "var(--ds-primary-green)",
          backgroundColor: "var(--ds-primary-green-subtle)",
        },
      ],
    });

    // Load team members
    this.teamMembers.set([
      {
        id: "1",
        name: "Alex Johnson",
        position: "QB",
        performance: 92,
        attendance: 95,
        status: "Active",
      },
      {
        id: "2",
        name: "Sarah Williams",
        position: "WR",
        performance: 88,
        attendance: 90,
        status: "Active",
      },
      {
        id: "3",
        name: "Mike Davis",
        position: "DB",
        performance: 85,
        attendance: 88,
        status: "Active",
      },
    ]);
  }

  openCreateSession(): void {
    // Reset form and open dialog
    this.newSession = {
      title: '',
      type: '',
      date: new Date(),
      duration: 60,
      location: '',
      notes: '',
    };
    this.showCreateSessionDialog = true;
  }

  isSessionValid(): boolean {
    return !!(this.newSession.title && this.newSession.type && this.newSession.date);
  }

  async createSession(): Promise<void> {
    if (!this.isSessionValid()) {
      this.toastService.warn('Please fill in all required fields');
      return;
    }

    this.isCreatingSession.set(true);

    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) {
        this.toastService.error('Please log in to create a session');
        return;
      }

      // Save to Supabase
      const { error } = await this.supabaseService.client
        .from('training_sessions')
        .insert({
          coach_id: user.id,
          title: this.newSession.title,
          session_type: this.newSession.type,
          scheduled_at: this.newSession.date.toISOString(),
          duration_minutes: this.newSession.duration,
          location: this.newSession.location,
          notes: this.newSession.notes,
          status: 'scheduled',
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(error.message);
      }

      this.toastService.success('Training session created successfully!');
      this.showCreateSessionDialog = false;

      // Update stats
      const currentStats = this.stats();
      const sessionsStat = currentStats.find(s => s.label === 'Active Sessions');
      if (sessionsStat) {
        sessionsStat.value = String(parseInt(sessionsStat.value) + 1);
        this.stats.set([...currentStats]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create session';
      this.toastService.error(message);
    } finally {
      this.isCreatingSession.set(false);
    }
  }

  viewMemberDetails(member: TeamMember): void {
    // Navigate to member profile or show details modal
    this.toastService.info(`Viewing ${member.name}'s profile`);
    this.router.navigate(['/roster'], { queryParams: { member: member.id } });
  }

  editMember(member: TeamMember): void {
    // Navigate to edit member page
    this.toastService.info(`Editing ${member.name}`);
    this.router.navigate(['/roster'], { queryParams: { member: member.id, edit: true } });
  }

  /**
   * Check if any players have blocked consent
   */
  hasBlockedPlayers(): boolean {
    return this.teamMembers().some(m => m.isConsentBlocked);
  }

  /**
   * Request data sharing from a player with blocked consent
   */
  requestDataSharing(member: TeamMember): void {
    this.toastService.info(`Sending data sharing request to ${member.name}...`);
    this.router.navigate(['/help/privacy-sharing'], { 
      queryParams: { player: member.id, action: 'request' } 
    });
  }

  getPerformanceSeverity(
    performance: number,
  ): "success" | "info" | "warn" | "danger" {
    if (performance >= 90) return "success";
    if (performance >= 80) return "info";
    if (performance >= 70) return "warn";
    return "danger";
  }

  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" {
    const severities: Record<string, "success" | "info" | "warn" | "danger"> = {
      Active: "success",
      Injured: "warn",
      Inactive: "danger",
    };
    return severities[status] || "info";
  }

  trackByMemberId(index: number, member: TeamMember): string {
    return member.id;
  }
}
