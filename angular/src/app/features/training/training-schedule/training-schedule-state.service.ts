import { Injectable, inject, signal } from "@angular/core";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { TrainingScheduleDataService } from "../services/training-schedule-data.service";
import { mapProgramTemplatesToUserPracticeDays } from "../../../shared/utils/training-template.utils";
import { getDateKey } from "../../../shared/utils/date.utils";
import type {
  CalendarDateMarker,
  MonthlyStats,
  ScheduleCalendarSession,
} from "./training-schedule.types";

function mapDbStatusToUiStatus(
  dbStatus: string | null | undefined,
): "scheduled" | "completed" | "missed" | "in_progress" | "replaced" {
  switch (dbStatus) {
    case "completed": return "completed";
    case "cancelled": return "missed";
    case "in_progress": return "in_progress";
    default: return "scheduled";
  }
}

function getMonthRange(selectedDate: Date): { startDate: string; endDate: string } {
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  return { startDate: getDateKey(startOfMonth), endDate: getDateKey(endOfMonth) };
}

/**
 * Component-scoped service that owns training schedule data state.
 * Provide in training-schedule.component providers array.
 */
@Injectable()
export class TrainingScheduleStateService {
  private readonly dataService = inject(TrainingScheduleDataService);
  private readonly logger = inject(LoggerService);

  private readonly _sessions = signal<ScheduleCalendarSession[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _hasError = signal(false);
  private readonly _errorMessage = signal("Failed to load training sessions. Please try again.");
  private readonly _userPracticeDays = signal<string[]>([]);
  private readonly _scheduleTrimmedWeeksCount = signal(0);
  private readonly _dateMarkers = signal<CalendarDateMarker[]>([]);
  private readonly _monthlyStats = signal<MonthlyStats>({
    totalSessions: 0,
    completedSessions: 0,
    missedSessions: 0,
    totalDuration: 0,
    completionRate: 0,
  });

  readonly sessions = this._sessions.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly hasError = this._hasError.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly userPracticeDays = this._userPracticeDays.asReadonly();
  readonly scheduleTrimmedWeeksCount = this._scheduleTrimmedWeeksCount.asReadonly();
  readonly dateMarkers = this._dateMarkers.asReadonly();
  readonly monthlyStats = this._monthlyStats.asReadonly();

  updateSessionStatus(sessionId: string, status: ScheduleCalendarSession["status"]): void {
    this._sessions.update((sessions) =>
      sessions.map((s) => (s.id === sessionId ? { ...s, status } : s)),
    );
  }

  replaceTemplateWithActual(templateId: string, actualId: string): void {
    this._sessions.update((sessions) =>
      sessions.map((s) =>
        s.id === templateId
          ? { ...s, id: actualId, status: "in_progress" as const, isTemplate: false }
          : s,
      ),
    );
  }

  async loadAll(selectedDate: Date, userId: string): Promise<void> {
    await Promise.all([
      this.loadSessions(selectedDate, userId),
      this.loadDateMarkers(selectedDate, userId),
      this.loadMonthlyStats(selectedDate, userId),
    ]);
  }

  private async loadSessions(selectedDate: Date, userId: string): Promise<void> {
    this._isLoading.set(true);
    this._hasError.set(false);
    this._userPracticeDays.set([]);
    this._scheduleTrimmedWeeksCount.set(0);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = selectedDate >= today ? new Date(selectedDate) : new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 14);

      const [
        { sessions: actualSessions, error: sessionsError },
        { templates: scheduledTemplates, error: templatesError },
        { practiceDays, error: prefsError },
      ] = await Promise.all([
        this.dataService.fetchActualSessions({
          userId,
          startDate: getDateKey(startDate),
          endDate: getDateKey(endDate),
        }),
        this.dataService.fetchScheduledTemplates({
          userId,
          startDate: getDateKey(startDate),
          endDate: getDateKey(endDate),
        }),
        this.dataService.fetchPracticeDays(userId),
      ]);

      if (prefsError) {
        this.logger.debug("Could not load practice days for schedule mapping", {
          message: prefsError.message,
        });
      }

      this._userPracticeDays.set(practiceDays);

      if (sessionsError) {
        throw new Error(sessionsError.message);
      }

      const mappedActualSessions: ScheduleCalendarSession[] = (actualSessions || []).map((session) => ({
        id: session.id,
        date: new Date(session.session_date),
        type: session.session_type || "Training",
        duration: session.duration_minutes || 60,
        status: mapDbStatusToUiStatus(session.status),
        isTemplate: false,
      }));

      let mappedScheduledSessions: ScheduleCalendarSession[] = [];
      if (!templatesError && scheduledTemplates) {
        const withWeekData = scheduledTemplates.filter((template) => {
          const weeks = template.training_weeks;
          return Array.isArray(weeks)
            ? weeks.length > 0
            : !!(weeks && typeof weeks === "object" && "start_date" in weeks);
        });

        const mapped = mapProgramTemplatesToUserPracticeDays(withWeekData, practiceDays);
        this._scheduleTrimmedWeeksCount.set(mapped.weeksWhereSessionsWereTrimmed);

        mappedScheduledSessions = mapped.placed.map(({ template, sessionDate }) => {
          const actualDates = new Set(mappedActualSessions.map((s) => getDateKey(s.date)));
          const rec = template as unknown as Record<string, unknown>;
          return {
            id: template.id,
            date: sessionDate,
            type: template.session_name || template.session_type || "Training",
            duration: template.duration_minutes || 60,
            status: actualDates.has(getDateKey(sessionDate)) ? "replaced" : ("scheduled" as const),
            isTemplate: true,
            isTeamPractice: (rec.is_team_practice as boolean) || false,
            isOutdoor: (rec.is_outdoor as boolean) || false,
            weatherSensitive: (rec.weather_sensitive as boolean) || false,
          };
        });
      } else if (templatesError) {
        this.logger.error("Error loading templates", templatesError);
      }

      const allSessions: ScheduleCalendarSession[] = [
        ...mappedScheduledSessions,
        ...mappedActualSessions,
      ].sort((a, b) => {
        if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
        return a.isTemplate !== b.isTemplate ? (a.isTemplate ? 1 : -1) : 0;
      });

      this._sessions.set(allSessions);
    } catch (error) {
      this.logger.error("Error loading sessions:", error);
      this._hasError.set(true);
      if (error instanceof Error) {
        if (error.message.includes("network") || error.message.includes("fetch")) {
          this._errorMessage.set("Unable to connect to the server. Please check your internet connection.");
        } else if (error.message.includes("permission") || error.message.includes("denied")) {
          this._errorMessage.set("You don't have permission to view these sessions.");
        } else {
          this._errorMessage.set("Failed to load training sessions. Please try again.");
        }
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  private async loadDateMarkers(selectedDate: Date, userId: string): Promise<void> {
    try {
      const { startDate, endDate } = getMonthRange(selectedDate);
      const { sessions, error } = await this.dataService.fetchDateMarkers({ userId, startDate, endDate });
      if (error) {
        this.logger.warn("Failed to load date markers:", toLogContext(error));
        return;
      }
      this._dateMarkers.set(
        (sessions || []).map((s) => ({
          date: new Date(s.session_date),
          status: mapDbStatusToUiStatus(s.status),
          sessionType: s.session_type || "Training",
          tooltip: `${s.session_type || "Training"} - ${mapDbStatusToUiStatus(s.status)}`,
        })),
      );
    } catch (error) {
      this.logger.error("Error loading date markers:", error);
    }
  }

  private async loadMonthlyStats(selectedDate: Date, userId: string): Promise<void> {
    try {
      const { startDate, endDate } = getMonthRange(selectedDate);
      const { sessions, error } = await this.dataService.fetchMonthlyStats({ userId, startDate, endDate });
      if (error) {
        this.logger.warn("Failed to load monthly stats:", toLogContext(error));
        return;
      }
      const total = sessions?.length || 0;
      const completed = sessions?.filter((s) => s.status === "completed").length || 0;
      const missed = sessions?.filter((s) => s.status === "cancelled").length || 0;
      const totalDuration = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
      this._monthlyStats.set({
        totalSessions: total,
        completedSessions: completed,
        missedSessions: missed,
        totalDuration,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    } catch (error) {
      this.logger.error("Error loading monthly stats:", error);
    }
  }
}
