import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { SkeletonLoaderComponent } from "../../../shared/components/skeleton-loader/skeleton-loader.component";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TrainingSessionDetailDataService } from "../services/training-session-detail-data.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { getTemplateSessionDateFromWeekRange } from "../../../shared/utils/training-template.utils";

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

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

@Component({
  selector: "app-training-session-detail",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonComponent,
    CardShellComponent,
    MainLayoutComponent,
    PageErrorStateComponent,
    PageHeaderComponent,
    StatusTagComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: "./training-session-detail.component.html",
  styleUrl: "./training-session-detail.component.scss",
})
export class TrainingSessionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sessionDataService = inject(TrainingSessionDetailDataService);
  private supabase = inject(SupabaseService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  sessionDetails = signal<SessionDetails | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  private currentSessionId = signal<string | null>(null);

  getSubtitle(): string {
    const session = this.sessionDetails();
    if (!session) return "Loading session details...";
    if (session.isTemplate) return "Scheduled training session";
    return `Session ${this.getStatusLabel(session.status).toLowerCase()}`;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((paramMap) => {
        const sessionId = paramMap.get("id");
        this.currentSessionId.set(sessionId);

        if (!sessionId) {
          this.sessionDetails.set(null);
          this.error.set("No session ID provided");
          this.isLoading.set(false);
          return;
        }

        void this.loadSession(sessionId);
      });
  }

  async loadSession(sessionId = this.currentSessionId()): Promise<void> {
    if (!sessionId) {
      this.sessionDetails.set(null);
      this.error.set("No session ID provided");
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const user = this.supabase.currentUser();
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // First, try to load as an actual session
      const { session: actualSession, error: sessionError } =
        await this.sessionDataService.getActualSession(sessionId, user.id);

      if (!sessionError && actualSession) {
        const actual = actualSession as Record<string, unknown>;
        const actualId = isString(actual.id) ? actual.id : sessionId;
        const sessionType = isString(actual.session_type)
          ? actual.session_type
          : "Training";
        const sessionDate = new Date(
          actual.session_date as string | number | Date,
        );
        const duration = isNumber(actual.duration_minutes)
          ? actual.duration_minutes
          : 60;
        const status = this.mapDbStatusToUiStatus(
          isString(actual.status) ? actual.status : null,
        );
        const notes = isString(actual.notes) ? actual.notes : undefined;

        // It's an actual session
        this.sessionDetails.set({
          id: actualId,
          sessionType,
          title: sessionType || "Training Session",
          date: sessionDate,
          duration,
          status,
          isTemplate: false,
          notes,
        });
        this.isLoading.set(false);
        return;
      }

      // If not found as actual session, try as template
      const { template, error: templateError } =
        await this.sessionDataService.getTemplateSession(sessionId);

      if (templateError || !template) {
        throw new Error(templateError?.message || "Session not found");
      }

      // Calculate the actual date for this template
      const weeks = template.training_weeks;
      const weekData = Array.isArray(weeks) ? weeks[0] : weeks;
      const sessionDate = getTemplateSessionDateFromWeekRange({
        weekStart: weekData.start_date,
        weekEnd: weekData.end_date,
        dayOfWeek: isNumber(template.day_of_week) ? template.day_of_week : null,
      });

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
        id: isString(template.id) ? template.id : sessionId,
        sessionType: isString(template.session_type)
          ? template.session_type
          : "Training",
        title:
          (isString(template.session_name) && template.session_name) ||
          (isString(template.session_type) && template.session_type) ||
          "Training Session",
        date: sessionDate,
        duration: isNumber(template.duration_minutes)
          ? template.duration_minutes
          : 60,
        status: "scheduled" as const,
        isTemplate: true,
        isTeamPractice:
          isBoolean(
            (template as unknown as Record<string, unknown>).is_team_practice,
          )
            ? ((template as unknown as Record<string, unknown>)
                .is_team_practice as boolean)
            : false,
        isOutdoor:
          isBoolean(
            (template as unknown as Record<string, unknown>).is_outdoor,
          )
            ? ((template as unknown as Record<string, unknown>)
                .is_outdoor as boolean)
            : false,
        description: isString(template.description)
          ? template.description
          : undefined,
        equipment: equipment.length > 0 ? equipment : undefined,
        intensity: isString(template.intensity_level)
          ? template.intensity_level
          : undefined,
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

    const user = this.supabase.currentUser();
    if (!user?.id) {
      this.toastService.error(TOAST.ERROR.LOGIN_TO_START);
      return;
    }

    try {
      // Create a new training session from the template
      // Note: athlete_id is required by RLS policy, user_id is for backward compatibility
      const { id, error } =
        await this.sessionDataService.createSessionFromTemplate({
          userId: user.id,
          sessionDate: session.date.toISOString().split("T")[0],
          sessionType: session.sessionType,
          durationMinutes: session.duration,
        });

      if (error) {
        throw new Error(error.message);
      }

      this.toastService.success(TOAST.SUCCESS.SESSION_STARTED);

      // Navigate to the training log to complete the session
      this.navigateToTrainingLog({
        sessionId: id ?? session.id,
        type: session.sessionType,
        duration: session.duration,
      });
    } catch (error) {
      this.logger.error("Error starting session:", error);
      this.toastService.error(TOAST.ERROR.SESSION_START_FAILED);
    }
  }

  continueSession(): void {
    const session = this.sessionDetails();
    if (!session) return;

    this.navigateToTrainingLog(this.buildSessionLogQueryParams(session));
  }

  editSession(): void {
    const session = this.sessionDetails();
    if (!session) return;

    this.navigateToTrainingLog({
      ...this.buildSessionLogQueryParams(session),
      edit: "true",
    });
  }

  viewSessionLog(): void {
    const session = this.sessionDetails();
    if (!session) return;

    this.navigateToTrainingLog({
      sessionId: session.id,
      view: "true",
    });
  }

  createCustomSession(): void {
    const session = this.sessionDetails();
    const dateStr = session?.date.toISOString().split("T")[0];

    this.navigateToSmartForm({
      date: dateStr,
      ...(session && {
        type: session.sessionType,
        duration: session.duration,
      }),
    });
  }

  goBack(): void {
    this.router.navigate(["/training"]);
  }

  private buildSessionLogQueryParams(session: SessionDetails): {
    sessionId: string;
    type: string;
    duration: number;
  } {
    return {
      sessionId: session.id,
      type: session.sessionType,
      duration: session.duration,
    };
  }

  private navigateToTrainingLog(
    queryParams: Record<string, string | number | undefined>,
  ): void {
    this.router.navigate(["/training/log"], { queryParams });
  }

  private navigateToSmartForm(
    queryParams: Record<string, string | number | undefined>,
  ): void {
    this.router.navigate(["/training/smart-form"], { queryParams });
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
