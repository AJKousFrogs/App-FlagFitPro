export interface ScheduleCalendarSession {
  id: string;
  date: Date;
  type: string;
  duration: number;
  status: "scheduled" | "completed" | "missed" | "in_progress" | "replaced";
  isTemplate: boolean;
  isTeamPractice?: boolean;
  isOutdoor?: boolean;
  weatherSensitive?: boolean;
}

export interface CalendarDateMarker {
  date: Date;
  status: "scheduled" | "completed" | "missed" | "in_progress" | "replaced";
  sessionType: string;
  tooltip: string;
}

export interface MonthlyStats {
  totalSessions: number;
  completedSessions: number;
  missedSessions: number;
  totalDuration: number;
  completionRate: number;
}

export interface TrainingEntryContext {
  title: string;
  message: string;
}
