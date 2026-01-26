import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { Skeleton } from "primeng/skeleton";
import { AuthService } from "../../../core/services/auth.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";

interface SessionDetails {
  id: string;
  sessionType: string;
  title: string;
  date: Date;
  duration: number;
  status: "scheduled" | "completed" | "missed" | "in_progress";
  isTemplate: boolean;
  isTeamPractice?: boolean;
  isOutdoor?: boolean;
  description?: string;
  equipment?: string[];
  intensity?: string;
  notes?: string;
}

@Component({
  selector: "app-training-session-detail",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonComponent,
    CardShellComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    StatusTagComponent,
    Skeleton,
  ],
  template: `
    <app-main-layout>
      <div class="session-detail-page">
        <app-page-header
          [title]="sessionDetails()?.title || 'Training Session'"
          [subtitle]="getSubtitle()"
          icon="pi-calendar"
        >
          <app-button
            variant="outlined"
            iconLeft="pi-arrow-left"
            (clicked)="goBack()"
            >Back</app-button
          >
        </app-page-header>

        @if (isLoading()) {
          <div class="loading-state">
            @for (i of [1, 2, 3]; track i) {
              <app-card-shell>
                <p-skeleton width="100%" height="2rem"></p-skeleton>
                <p-skeleton width="80%" height="1rem"></p-skeleton>
                <p-skeleton width="60%" height="1rem"></p-skeleton>
              </app-card-shell>
            }
          </div>
        } @else if (error()) {
          <app-card-shell>
            <div class="error-state">
              <i class="pi pi-exclamation-triangle error-icon"></i>
              <h3>Unable to load session</h3>
              <p>{{ error() }}</p>
              <app-button iconLeft="pi-refresh" (clicked)="loadSession()"
                >Try Again</app-button
              >
            </div>
          </app-card-shell>
        } @else if (sessionDetails()) {
          @let session = sessionDetails()!;

          <!-- Session Overview -->
          <app-card-shell title="Session Overview" headerIcon="pi-info-circle">
            <div class="session-overview">
              <div class="overview-grid">
                <div class="overview-item">
                  <span class="overview-label">Date & Time</span>
                  <span class="overview-value">{{
                    session.date | date: "EEEE, MMMM d, y 'at' h:mm a"
                  }}</span>
                </div>
                <div class="overview-item">
                  <span class="overview-label">Duration</span>
                  <span class="overview-value"
                    >{{ session.duration }} minutes</span
                  >
                </div>
                <div class="overview-item">
                  <span class="overview-label">Status</span>
                  <app-status-tag
                    [value]="getStatusLabel(session.status)"
                    [severity]="getStatusSeverity(session.status)"
                  ></app-status-tag>
                </div>
                @if (session.intensity) {
                  <div class="overview-item">
                    <span class="overview-label">Intensity</span>
                    <span class="overview-value">{{ session.intensity }}</span>
                  </div>
                }
              </div>

              @if (session.isTeamPractice) {
                <div class="session-badge team-badge">
                  <i class="pi pi-users"></i>
                  <span>Team Practice</span>
                </div>
              }
              @if (session.isOutdoor) {
                <div class="session-badge outdoor-badge">
                  <i class="pi pi-sun"></i>
                  <span>Outdoor Session</span>
                </div>
              }
            </div>
          </app-card-shell>

          <!-- Session Description -->
          @if (session.description) {
            <app-card-shell title="Description" headerIcon="pi-file">
              <p class="session-description">{{ session.description }}</p>
            </app-card-shell>
          }

          <!-- Equipment Needed -->
          @if (session.equipment && session.equipment.length > 0) {
            <app-card-shell title="Equipment Needed" headerIcon="pi-box">
              <div class="equipment-list">
                @for (item of session.equipment; track item) {
                  <span class="equipment-item">{{ item }}</span>
                }
              </div>
            </app-card-shell>
          }

          <!-- Notes -->
          @if (session.notes) {
            <app-card-shell title="Notes" headerIcon="pi-pencil">
              <p class="session-notes">{{ session.notes }}</p>
            </app-card-shell>
          }

          <!-- Action Buttons -->
          <div class="action-buttons">
            @if (session.isTemplate && session.status === "scheduled") {
              <app-button
                variant="primary"
                iconLeft="pi-play"
                (clicked)="startSession()"
                >Start This Training Session</app-button
              >
              <app-button
                variant="outlined"
                iconLeft="pi-edit"
                (clicked)="createCustomSession()"
                >Create Custom Session Instead</app-button
              >
            } @else if (!session.isTemplate) {
              @if (
                session.status === "scheduled" ||
                session.status === "in_progress"
              ) {
                <app-button
                  variant="primary"
                  iconLeft="pi-play"
                  (clicked)="continueSession()"
                  >Continue Session</app-button
                >
                <app-button
                  variant="outlined"
                  iconLeft="pi-edit"
                  (clicked)="editSession()"
                  >Edit Session</app-button
                >
              } @else if (session.status === "completed") {
                <app-button
                  variant="outlined"
                  iconLeft="pi-eye"
                  (clicked)="viewSessionLog()"
                  >View Session Log</app-button
                >
              }
              <app-button
                variant="outlined"
                iconLeft="pi-plus"
                (clicked)="createCustomSession()"
                >Create New Session</app-button
              >
            }
          </div>
        }
      </div>
    </app-main-layout>
  `,
  styleUrl: "./training-session-detail.component.scss",
})
export class TrainingSessionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  sessionDetails = signal<SessionDetails | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  getSubtitle(): string {
    const session = this.sessionDetails();
    if (!session) return "Loading session details...";
    if (session.isTemplate) return "Scheduled training session";
    return `Session ${this.getStatusLabel(session.status).toLowerCase()}`;
  }

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get("id");
    if (!sessionId) {
      this.error.set("No session ID provided");
      this.isLoading.set(false);
      return;
    }
    this.loadSession();
  }

  async loadSession(): Promise<void> {
    const sessionId = this.route.snapshot.paramMap.get("id");
    if (!sessionId) {
      this.error.set("No session ID provided");
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // First, try to load as an actual session
      const { data: actualSession, error: sessionError } =
        await this.supabaseService.client
          .from("training_sessions")
          .select("*")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .single();

      if (!sessionError && actualSession) {
        // It's an actual session
        this.sessionDetails.set({
          id: actualSession.id,
          sessionType: actualSession.session_type || "Training",
          title: actualSession.session_type || "Training Session",
          date: new Date(actualSession.session_date),
          duration: actualSession.duration_minutes || 60,
          status: this.mapDbStatusToUiStatus(actualSession.status),
          isTemplate: false,
          notes: actualSession.notes || undefined,
        });
        this.isLoading.set(false);
        return;
      }

      // If not found as actual session, try as template
      const { data: template, error: templateError } =
        await this.supabaseService.client
          .from("training_session_templates")
          .select(
            `
            *,
            training_weeks!inner (
              id,
              week_number,
              start_date,
              end_date
            )
          `,
          )
          .eq("id", sessionId)
          .single();

      if (templateError || !template) {
        throw new Error(templateError?.message || "Session not found");
      }

      // Calculate the actual date for this template
      const weeks = template.training_weeks;
      const weekData = Array.isArray(weeks) ? weeks[0] : weeks;
      const dateStr = weekData.start_date.split("T")[0];
      const [year, month, day] = dateStr.split("-").map(Number);
      const weekStart = new Date(year, month - 1, day, 0, 0, 0, 0);
      const sessionDate = new Date(weekStart);
      sessionDate.setDate(weekStart.getDate() + (template.day_of_week || 0));

      // Parse equipment if it's stored as JSON or array
      let equipment: string[] = [];
      if (template.equipment_needed) {
        if (Array.isArray(template.equipment_needed)) {
          equipment = template.equipment_needed;
        } else if (typeof template.equipment_needed === "string") {
          try {
            equipment = JSON.parse(template.equipment_needed);
          } catch {
            equipment = [template.equipment_needed];
          }
        }
      }

      this.sessionDetails.set({
        id: template.id,
        sessionType: template.session_type || "Training",
        title:
          template.session_name || template.session_type || "Training Session",
        date: sessionDate,
        duration: template.duration_minutes || 60,
        status: "scheduled" as const,
        isTemplate: true,
        isTeamPractice:
          ((template as Record<string, unknown>).is_team_practice as boolean) ||
          false,
        isOutdoor:
          ((template as Record<string, unknown>).is_outdoor as boolean) ||
          false,
        description: template.description || undefined,
        equipment: equipment.length > 0 ? equipment : undefined,
        intensity: template.intensity_level || undefined,
      });

      this.isLoading.set(false);
    } catch (error) {
      this.logger.error("Error loading session:", error);
      this.error.set(
        error instanceof Error
          ? error.message
          : "Failed to load session details",
      );
      this.isLoading.set(false);
    }
  }

  async startSession(): Promise<void> {
    const session = this.sessionDetails();
    if (!session || !session.isTemplate) return;

    const user = this.authService.getUser();
    if (!user?.id) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_START);
      return;
    }

    try {
      // Create a new training session from the template
      // Note: athlete_id is required by RLS policy, user_id is for backward compatibility
      const { data, error } = await this.supabaseService.client
        .from("training_sessions")
        .insert({
          athlete_id: user.id,
          user_id: user.id,
          session_date: session.date.toISOString().split("T")[0],
          session_type: session.sessionType,
          duration_minutes: session.duration,
          status: "in_progress",
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      this.toastService.success(TOAST.SUCCESS.SESSION_STARTED);

      // Navigate to the training log to complete the session
      this.router.navigate(["/training/log"], {
        queryParams: {
          sessionId: data.id,
          type: session.sessionType,
          duration: session.duration,
        },
      });
    } catch (error) {
      this.logger.error("Error starting session:", error);
      this.toastService.error(TOAST.ERROR.SESSION_START_FAILED);
    }
  }

  continueSession(): void {
    const session = this.sessionDetails();
    if (!session) return;

    // Navigate to training log to continue/complete the session
    this.router.navigate(["/training/log"], {
      queryParams: {
        sessionId: session.id,
        type: session.sessionType,
        duration: session.duration,
      },
    });
  }

  editSession(): void {
    const session = this.sessionDetails();
    if (!session) return;

    // Navigate to training log to edit the session
    this.router.navigate(["/training/log"], {
      queryParams: {
        sessionId: session.id,
        type: session.sessionType,
        duration: session.duration,
        edit: "true",
      },
    });
  }

  viewSessionLog(): void {
    const session = this.sessionDetails();
    if (!session) return;

    // Navigate to training log to view completed session
    this.router.navigate(["/training/log"], {
      queryParams: {
        sessionId: session.id,
        view: "true",
      },
    });
  }

  createCustomSession(): void {
    const session = this.sessionDetails();
    const dateStr = session?.date.toISOString().split("T")[0];

    // Navigate to create form with optional pre-filled data
    this.router.navigate(["/training/smart-form"], {
      queryParams: {
        date: dateStr,
        ...(session && {
          type: session.sessionType,
          duration: session.duration,
        }),
      },
    });
  }

  goBack(): void {
    this.router.navigate(["/training"]);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case "completed":
        return "Completed";
      case "missed":
        return "Missed";
      case "in_progress":
        return "In Progress";
      default:
        return "Scheduled";
    }
  }

  getStatusSeverity(
    status: string,
  ): "success" | "info" | "warning" | "secondary" | "contrast" | "danger" {
    switch (status) {
      case "completed":
        return "success";
      case "missed":
        return "danger";
      case "in_progress":
        return "warning";
      default:
        return "info";
    }
  }

  private mapDbStatusToUiStatus(
    dbStatus: string | null | undefined,
  ): "scheduled" | "completed" | "missed" | "in_progress" {
    switch (dbStatus) {
      case "completed":
        return "completed";
      case "cancelled":
        return "missed";
      case "in_progress":
        return "in_progress";
      case "planned":
      case "scheduled":
      default:
        return "scheduled";
    }
  }
}
