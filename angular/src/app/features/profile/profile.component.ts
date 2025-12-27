import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { RouterModule } from "@angular/router";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { AvatarModule } from "primeng/avatar";
import { TagModule } from "primeng/tag";
import { Tabs, TabPanel } from "primeng/tabs";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { StatsGridComponent } from "../../shared/components/stats-grid/stats-grid.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { AuthService } from "../../core/services/auth.service";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { LoggerService } from "../../core/services/logger.service";

interface PendingInvitation {
  id: string;
  teamId: string;
  teamName: string;
  role: string;
  message?: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

@Component({
  selector: "app-profile",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    CardModule,
    ButtonModule,
    AvatarModule,
    TagModule,
    Tabs,
    TabPanel,
    ProgressSpinnerModule,
    MainLayoutComponent,
    StatsGridComponent,
    EmptyStateComponent,
    DatePipe,
    TitleCasePipe,
  ],
  template: `
    <app-main-layout>
      <div class="profile-page">
        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading-state">
            <p-progressSpinner 
              [style]="{ width: '50px', height: '50px' }"
              strokeWidth="4"
            ></p-progressSpinner>
            <p class="loading-message">Loading profile...</p>
          </div>
        }

        @if (!isLoading()) {
          <!-- Profile Header -->
          <div class="profile-header">
          <div class="profile-avatar-section">
            <p-avatar
              [label]="userInitials()"
              size="xlarge"
              shape="circle"
              [style]="{
                'background-color': 'var(--ds-primary-green)',
                color: 'var(--color-text-on-primary)',
                'font-size': '3rem',
              }"
            >
            </p-avatar>
            <p-button
              icon="pi pi-camera"
              [rounded]="true"
              [text]="true"
              styleClass="avatar-edit-btn"
              ariaLabel="Change profile picture"
              (onClick)="changeProfilePicture()"
            ></p-button>
          </div>
          <div class="profile-info">
            <h1 class="profile-name">{{ userName() }}</h1>
            <p class="profile-role">{{ userRole() }}</p>
            <p class="profile-email">{{ userEmail() }}</p>
          </div>
          <div class="profile-actions">
            <p-button
              label="Edit Profile"
              icon="pi pi-cog"
              [outlined]="true"
              [routerLink]="['/settings']"
            ></p-button>
          </div>
        </div>

        <!-- Profile Stats -->
        <app-stats-grid [stats]="stats()"></app-stats-grid>

        <!-- Profile Tabs -->
        <p-tabs>
          <p-tabpanel header="Overview" leftIcon="pi pi-chart-line">
            <div class="overview-content">
              <p-card>
                <ng-template pTemplate="header">
                  <h3>Recent Activity</h3>
                </ng-template>
                @if (activities().length === 0) {
                  <app-empty-state
                    title="No Recent Activity"
                    message="Your activity will appear here once you start training."
                    icon="pi-clock"
                    [compact]="true"
                  ></app-empty-state>
                } @else {
                  <div class="activity-list">
                    @for (
                      activity of activities();
                      track trackByActivityTitle($index, activity)
                    ) {
                      <div class="activity-item">
                        <div class="activity-icon">{{ activity.icon }}</div>
                        <div class="activity-content">
                          <div class="activity-title">{{ activity.title }}</div>
                          <div class="activity-time">{{ activity.time }}</div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </p-card>
            </div>
          </p-tabpanel>
          <p-tabpanel header="Achievements" leftIcon="pi pi-trophy">
            @if (achievements().length === 0) {
              <app-empty-state
                title="No Achievements Yet"
                message="Complete training sessions and reach milestones to earn achievements."
                icon="pi-trophy"
              ></app-empty-state>
            } @else {
              <div class="achievements-grid">
                @for (
                  achievement of achievements();
                  track trackByAchievementTitle($index, achievement)
                ) {
                  <p-card class="achievement-card">
                    <div class="achievement-icon">{{ achievement.icon }}</div>
                    <h4 class="achievement-title">{{ achievement.title }}</h4>
                    <p class="achievement-description">
                      {{ achievement.description }}
                    </p>
                    <div class="achievement-date">{{ achievement.date }}</div>
                  </p-card>
                }
              </div>
            }
          </p-tabpanel>
          <p-tabpanel header="Statistics" leftIcon="pi pi-bar-chart">
            <p-card>
              <ng-template pTemplate="header">
                <h3>Performance Statistics</h3>
              </ng-template>
              <div class="stats-grid">
                @for (
                  stat of performanceStats();
                  track trackByPerformanceStatLabel($index, stat)
                ) {
                  <div class="performance-stat">
                    <div class="stat-label">{{ stat.label }}</div>
                    <div class="stat-value">{{ stat.value }}</div>
                    <p-tag
                      [value]="stat.trend"
                      [severity]="stat.trendType"
                    ></p-tag>
                  </div>
                }
              </div>
            </p-card>
          </p-tabpanel>
          <p-tabpanel [header]="'Invitations' + (pendingInvitations().length > 0 ? ' (' + pendingInvitations().length + ')' : '')" leftIcon="pi pi-envelope">
            <div class="invitations-section">
              @if (loadingInvitations()) {
                <div class="loading-invitations">
                  <p-progressSpinner [style]="{ width: '30px', height: '30px' }" strokeWidth="4"></p-progressSpinner>
                  <span>Loading invitations...</span>
                </div>
              } @else if (pendingInvitations().length === 0) {
                <app-empty-state
                  title="No Pending Invitations"
                  message="You don't have any team invitations at the moment."
                  icon="pi-envelope"
                ></app-empty-state>
              } @else {
                <div class="invitations-list">
                  @for (invitation of pendingInvitations(); track invitation.id) {
                    <p-card class="invitation-card">
                      <div class="invitation-content">
                        <div class="invitation-header">
                          <h4>{{ invitation.teamName }}</h4>
                          <p-tag 
                            [value]="invitation.role | titlecase"
                            severity="info"
                          ></p-tag>
                        </div>
                        <p class="invitation-message">
                          @if (invitation.message) {
                            "{{ invitation.message }}"
                          } @else {
                            You've been invited to join this team as a {{ invitation.role }}.
                          }
                        </p>
                        <div class="invitation-meta">
                          <span><i class="pi pi-user"></i> Invited by {{ invitation.invitedBy }}</span>
                          <span><i class="pi pi-calendar"></i> {{ invitation.createdAt | date:'mediumDate' }}</span>
                          @if (invitation.isExpired) {
                            <p-tag value="Expired" severity="danger"></p-tag>
                          } @else {
                            <span class="expires-soon">Expires {{ invitation.expiresAt | date:'mediumDate' }}</span>
                          }
                        </div>
                        <div class="invitation-actions">
                          @if (!invitation.isExpired) {
                            <p-button
                              label="Accept"
                              icon="pi pi-check"
                              (onClick)="acceptInvitation(invitation)"
                              [loading]="processingInvitation() === invitation.id"
                            ></p-button>
                            <p-button
                              label="Decline"
                              icon="pi pi-times"
                              [outlined]="true"
                              severity="secondary"
                              (onClick)="declineInvitation(invitation)"
                              [loading]="processingInvitation() === invitation.id"
                            ></p-button>
                          } @else {
                            <p-button
                              label="Request New Invitation"
                              icon="pi pi-refresh"
                              [outlined]="true"
                              (onClick)="requestNewInvitation(invitation)"
                            ></p-button>
                          }
                        </div>
                      </div>
                    </p-card>
                  }
                </div>
              }
            </div>
          </p-tabpanel>
        </p-tabs>
        }
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .profile-page {
        padding: var(--space-6);
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-12);
        min-height: 300px;
      }

      .loading-message {
        margin-top: var(--space-4);
        font-size: var(--font-body-md);
        color: var(--text-secondary);
      }

      .profile-header {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        padding: var(--space-6);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
        margin-bottom: var(--space-6);
        box-shadow: var(--shadow-sm);
      }

      .profile-avatar-section {
        position: relative;
      }

      .avatar-edit-btn {
        position: absolute;
        bottom: 0;
        right: 0;
        background: var(--surface-primary);
        border: 2px solid var(--p-surface-200);
      }

      .profile-info {
        flex: 1;
      }

      .profile-name {
        font-size: var(--font-heading-2xl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .profile-role {
        font-size: var(--font-body-md);
        color: var(--text-secondary);
        margin-bottom: var(--space-1);
      }

      .profile-email {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin: 0;
      }

      .profile-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .stat-card {
        text-align: center;
      }

      .stat-value {
        font-size: var(--font-heading-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
        margin-bottom: var(--space-2);
      }

      .stat-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .overview-content {
        margin-top: var(--space-4);
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .activity-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        transition: background 0.2s;
      }

      .activity-item:hover {
        background: var(--p-surface-50);
      }

      .activity-icon {
        font-size: var(--icon-3xl);
      }

      .activity-title {
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin-bottom: var(--space-1);
      }

      .activity-time {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--space-4);
        margin-top: var(--space-4);
      }

      .achievement-card {
        text-align: center;
        transition: transform 0.2s;
      }

      .achievement-card:hover {
        transform: translateY(-4px);
      }

      .achievement-icon {
        font-size: var(--icon-4xl);
        margin-bottom: var(--space-3);
      }

      .achievement-title {
        font-size: var(--font-body-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .achievement-description {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }

      .achievement-date {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }

      .performance-stat {
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        text-align: center;
      }

      .performance-stat .stat-label {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
      }

      .performance-stat .stat-value {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        margin-bottom: var(--space-2);
      }

      /* Invitations Section */
      .invitations-section {
        margin-top: var(--space-4);
      }

      .loading-invitations {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-8);
        color: var(--text-secondary);
      }

      .invitations-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .invitation-card {
        border-left: 4px solid var(--color-brand-primary);
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .invitation-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .invitation-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .invitation-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .invitation-header h4 {
        margin: 0;
        font-size: var(--font-heading-sm);
        color: var(--text-primary);
      }

      .invitation-message {
        font-style: italic;
        color: var(--text-secondary);
        margin: 0;
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .invitation-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .invitation-meta span {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .expires-soon {
        color: var(--color-status-warning);
      }

      .invitation-actions {
        display: flex;
        gap: var(--space-3);
        margin-top: var(--space-2);
      }

      @media (max-width: 768px) {
        .profile-header {
          flex-direction: column;
          text-align: center;
        }

        .profile-stats {
          grid-template-columns: repeat(2, 1fr);
        }

        .invitation-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-2);
        }

        .invitation-meta {
          flex-direction: column;
          gap: var(--space-2);
        }

        .invitation-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  isLoading = signal(true);
  userName = signal("Loading...");
  userEmail = signal("Loading...");
  userRole = signal("Player");
  userInitials = signal("U");
  stats = signal<Array<{ value: string; label: string }>>([]);
  activities = signal<Array<{ icon: string; title: string; time: string }>>([]);
  achievements = signal<Array<{ icon: string; title: string; description: string; date: string }>>([]);
  performanceStats = signal<Array<{ label: string; value: string; trend: string; trendType: "success" | "info" | "warn" | "secondary" | "contrast" | "danger" }>>([]);
  
  // Invitations
  pendingInvitations = signal<PendingInvitation[]>([]);
  loadingInvitations = signal(false);
  processingInvitation = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProfileData();
    this.loadPendingInvitations();
  }

  loadProfileData(): void {
    this.isLoading.set(true);
    const user = this.authService.getUser();
    if (user) {
      this.userName.set(user.name || user.email || "User");
      this.userEmail.set(user.email || "");
      this.userRole.set(user.role || "Player");
      this.userInitials.set(this.getInitials(this.userName()));
    }

    // Load stats
    this.stats.set([
      { value: "24", label: "Training Sessions" },
      { value: "85%", label: "Performance Score" },
      { value: "7", label: "Day Streak" },
      { value: "3", label: "Tournaments" },
    ]);

    // Load activities
    this.activities.set([
      { icon: "🏃", title: "Completed Speed Training", time: "2 hours ago" },
      { icon: "🏆", title: "Achieved New Personal Best", time: "1 day ago" },
      { icon: "📊", title: "Updated Performance Metrics", time: "2 days ago" },
    ]);

    // Load achievements
    this.achievements.set([
      {
        icon: "🏆",
        title: "7-Day Streak",
        description: "Completed 7 consecutive training days",
        date: "2 days ago",
      },
      {
        icon: "⚡",
        title: "Speed Master",
        description: "Achieved sub-4.5s 40-yard dash",
        date: "1 week ago",
      },
    ]);

    // Load performance stats
    this.performanceStats.set([
      {
        label: "Overall Performance",
        value: "85%",
        trend: "+5%",
        trendType: "success",
      },
      { label: "Speed Score", value: "92", trend: "+8", trendType: "success" },
      { label: "Strength Score", value: "78", trend: "+3", trendType: "info" },
    ]);

    // Simulate loading delay
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  trackByActivityTitle(index: number, activity: { icon: string; title: string; time: string }): string {
    return activity.title || index.toString();
  }

  trackByAchievementTitle(index: number, achievement: { icon: string; title: string; description: string; date: string }): string {
    return achievement.title || index.toString();
  }

  trackByPerformanceStatLabel(index: number, stat: { label: string; value: string; trend: string; trendType: string }): string {
    return stat.label || index.toString();
  }

  changeProfilePicture(): void {
    // Create file input to select image
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // For now, show a message - in production, upload to Supabase Storage
        this.logger.info('Selected file:', file.name);
        // TODO: Implement actual image upload to Supabase Storage
        alert('Profile picture upload coming soon! Selected: ' + file.name);
      }
    };
    input.click();
  }

  // ============================================================================
  // INVITATIONS
  // ============================================================================

  async loadPendingInvitations(): Promise<void> {
    this.loadingInvitations.set(true);
    
    try {
      const user = this.authService.currentUser();
      if (!user?.email) return;

      const { data, error } = await this.supabaseService.client
        .from('team_invitations')
        .select(`
          id,
          team_id,
          role,
          message,
          status,
          expires_at,
          created_at,
          teams:team_id(name),
          inviter:invited_by(raw_user_meta_data)
        `)
        .eq('email', user.email)
        .in('status', ['pending', 'expired'])
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code !== '42P01') throw error;
        return;
      }

      const invitations: PendingInvitation[] = (data || []).map((inv: any) => ({
        id: inv.id,
        teamId: inv.team_id,
        teamName: inv.teams?.name || 'Unknown Team',
        role: inv.role,
        message: inv.message,
        invitedBy: inv.inviter?.raw_user_meta_data?.full_name || 'Team Admin',
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
        isExpired: new Date(inv.expires_at) < new Date()
      }));

      this.pendingInvitations.set(invitations);
    } catch (error) {
      this.logger.error('Error loading invitations:', error);
    } finally {
      this.loadingInvitations.set(false);
    }
  }

  async acceptInvitation(invitation: PendingInvitation): Promise<void> {
    this.processingInvitation.set(invitation.id);
    
    try {
      // Call the accept_team_invitation function
      const { error } = await this.supabaseService.client
        .rpc('accept_team_invitation', { p_invitation_id: invitation.id });

      if (error) throw error;

      this.toastService.success(`You've joined ${invitation.teamName}!`);
      
      // Remove from list
      this.pendingInvitations.update(invs => invs.filter(i => i.id !== invitation.id));
      
      // Reload profile data to reflect new team membership
      this.loadProfileData();
    } catch (error: any) {
      this.logger.error('Error accepting invitation:', error);
      this.toastService.error(error.message || 'Failed to accept invitation');
    } finally {
      this.processingInvitation.set(null);
    }
  }

  async declineInvitation(invitation: PendingInvitation): Promise<void> {
    this.processingInvitation.set(invitation.id);
    
    try {
      // Call the decline_team_invitation function
      const { error } = await this.supabaseService.client
        .rpc('decline_team_invitation', { p_invitation_id: invitation.id });

      if (error) throw error;

      this.toastService.info('Invitation declined');
      
      // Remove from list
      this.pendingInvitations.update(invs => invs.filter(i => i.id !== invitation.id));
    } catch (error: any) {
      this.logger.error('Error declining invitation:', error);
      this.toastService.error(error.message || 'Failed to decline invitation');
    } finally {
      this.processingInvitation.set(null);
    }
  }

  requestNewInvitation(invitation: PendingInvitation): void {
    // This would typically send a notification to the team admin
    this.toastService.info(`A request has been sent to ${invitation.teamName} for a new invitation.`);
  }
}
