/**
 * Coach/team announcement shown on the player dashboard status strip.
 * Backed by {@link TeamNotificationService.unreadAnnouncements}.
 */
export interface DashboardAnnouncementBanner {
  id?: string;
  message: string | null;
  coachName: string | null;
  postedAt: Date | null;
  priority: "info" | "important";
}
