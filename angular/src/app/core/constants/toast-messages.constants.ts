/**
 *Message Constants
 *
 * Centralized toast messages for consistent UX across the application.
 * Eliminates 400+ inconsistent toast message strings.
 *
 * @example
 * // Import from barrel (recommended)
 * import { TOAST } from '@core/constants';
 *
 * @example
 * // Success messages
 * this.toastService.success(TOAST.SUCCESS.SAVED);
 * this.toastService.success(TOAST.SUCCESS.PROFILE_UPDATED);
 * this.toastService.success(TOAST.SUCCESS.WORKOUT_COMPLETED);
 *
 * @example
 * // Error messages
 * this.toastService.error(TOAST.ERROR.NETWORK);
 * this.toastService.error(TOAST.ERROR.SAVE_FAILED);
 * this.toastService.error(TOAST.ERROR.UNAUTHORIZED);
 *
 * @example
 * // Warning messages
 * this.toastService.warn(TOAST.WARN.OFFLINE);
 * this.toastService.warn(TOAST.WARN.UNSAVED_CHANGES);
 *
 * @example
 * // Info messages
 * this.toastService.info(TOAST.INFO.LOADING);
 * this.toastService.info(TOAST.INFO.GENERATING_REPORT);
 */

/**
 * Success messages
 */
export const TOAST_SUCCESS = {
  // Generic
  SAVED: "Saved successfully",
  UPDATED: "Updated successfully",
  CREATED: "Successfully created",
  DELETED: "Successfully deleted",
  COPIED: "Copied to clipboard",

  // Settings & Profile
  SETTINGS_SAVED: "Settings saved successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  PASSWORD_CHANGED: "Password changed successfully",
  AVATAR_UPDATED: "Profile picture updated",
  PREFERENCES_SAVED: "Preferences saved",
  PREFERENCES_UPDATED: "Preferences updated successfully",
  PRIVACY_UPDATED: "Privacy settings updated",

  // Authentication
  LOGIN: "Welcome back!",
  LOGIN_SUCCESS: "Login successful!",
  WELCOME: "Welcome!",
  LOGOUT: "Logged out successfully",
  EMAIL_VERIFIED: "Email verified successfully",
  PASSWORD_RESET_SENT: "Password reset email sent",
  ACCOUNT_CREATED: "Account created successfully!",

  // Training
  SESSION_LOGGED: "Training session logged",
  SESSION_LOGGED_SUCCESS: "Training session logged successfully!",
  SESSION_CREATED: "Training session created",
  SESSION_CREATED_SUCCESS: "Training session created successfully!",
  SESSION_STARTED: "Session started!",
  SESSION_COMPLETED: "Session marked as complete!",
  SESSION_SAVED: "Session logged! Check your recovery plan 💪",
  WORKOUT_COMPLETED: "Workout completed!",
  WORKOUT_COMPLETED_EMOJI: "Workout completed! 💪",
  WORKOUT_SAVED: "Workout saved!",
  PROGRESS_SAVED: "Progress saved",
  TRAINING_DATA_REFRESHED: "Training data refreshed",
  TRAINING_COMPLETED: "Training completed successfully",
  PERFORMANCE_LOGGED: "Performance logged successfully",
  AI_SUGGESTIONS_GENERATED: "New AI suggestions generated!",
  SUGGESTION_APPLIED: "Suggestion applied to your schedule!",
  VIDEO_SUBMITTED: "Video submitted for review!",

  // Team & Roster
  MEMBER_ADDED: "Member added to team",
  MEMBER_REMOVED: "Member removed from team",
  INVITATION_SENT: "Invitation sent",
  INVITATION_CANCELLED: "Invitation cancelled",
  TEAM_CREATED: "Team created successfully",
  ROSTER_EXPORTED: "Roster exported successfully",
  DEPTH_CHART_INITIALIZED: "Depth charts initialized successfully",
  PLAYER_ASSIGNED: "Player assigned successfully",
  PLAYER_REMOVED: "Player removed from position",
  PLAYER_UPDATED: "Player updated!",
  PLAYER_ADDED: "Player added!",
  CHECKIN_SUCCESS: "Checked in successfully!",

  // Communication
  MESSAGE_SENT: "Message sent",
  MESSAGE_SENT_TO_TEAM: "Message sent to team",
  MESSAGE_DELETED: "Message deleted",
  NOTIFICATION_SENT: "Notification sent",
  NOTIFICATIONS_MARKED_READ: "Notifications marked as read",
  CONSENT_REQUEST_SENT: "Consent request sent",
  ACTIVITY_MARKED_READ: "Activity marked as read",
  CHANNEL_CREATED: "Channel created",
  CHANNEL_CREATED_WITH_NAME: "Channel #{name} created!",
  CONVERSATION_STARTED: "Started conversation with {name}",
  POST_PUBLISHED: "Your post has been published!",
  POST_SAVED: "Post saved locally. Will sync when online.",
  POST_LINK_COPIED: "Post link copied to clipboard!",
  POLL_ADDED: "Poll added to your post!",
  VOTE_RECORDED: "Vote recorded!",
  LOCATION_ADDED: "Location added!",
  PHOTO_READY: "Photo ready to upload with your post",
  VIDEO_READY: "Video ready to upload with your post",
  BOOKMARK_SAVED: "Post saved to bookmarks",
  BOOKMARK_REMOVED: "Bookmark removed",
  COMMENT_ADDED: "Comment added",
  ACCESS_REQUEST_SENT: "Access request sent to player",
  CHAT_START_FAILED: "Unable to start chat with coach. Please try again.",
  SHARE_FAILED: "Unable to share. Please try again.",
  FILTER_CLEARED: "Filter cleared",
  FILTER_CLEARED_ALL: "Filter cleared - showing all posts",
  SHOWING_POSTS_ABOUT: "Showing posts about #{topic}",
  ANNOUNCEMENT_SENT: "Important announcement sent!",
  ANNOUNCEMENT_POSTED: "Announcement posted",

  // Data & Export
  REPORT_DOWNLOADED: "Report downloaded successfully",
  REPORT_GENERATED: "Report generated successfully",
  REPORT_EXPORTED: "Report exported successfully",
  ACWR_REPORT_DOWNLOADED: "ACWR report downloaded successfully",
  PDF_REPORT_DOWNLOADED: "PDF report downloaded successfully",
  DATA_EXPORTED: "Data exported successfully",
  DATA_IMPORTED: "Data imported successfully",

  // Attendance
  CHECKED_IN: "Checked in successfully",
  CHECKIN_SAVED: "Check-in saved! 💪",
  QUICK_CHECKIN_SAVED: "Quick check-in saved! 💪",
  DAILY_CHECKIN_SAVED: "Daily check-in saved!",
  ATTENDANCE_SAVED: "Attendance saved",
  ATTENDANCE_SAVED_SUCCESS: "Attendance saved successfully",
  EVENT_CREATED_SUCCESS: "Event created successfully",
  GAME_DAY_READINESS_SUBMITTED: "Game day readiness submitted!",

  // Push Notifications
  PUSH_ENABLED: "Push notifications enabled",
  PUSH_DISABLED: "Push notifications disabled",

  // Account
  ACCOUNT_PAUSED: "Account paused successfully",
  ACCOUNT_RESUMED: "Account resumed successfully",
  ACCOUNT_DELETION_REQUESTED: "Account deletion requested successfully",

  // Wellness & Recovery
  RECOVERY_PROTOCOL_GENERATED: "Recovery protocol generated!",
  TRAVEL_PROTOCOL_GENERATED: "Car travel protocol generated!",
  WINDOW_COMPLETED: "Window completed! Keep it up! 💪",
  WELLNESS_CHECKIN_SAVED: "Wellness check-in saved successfully",

  // Feedback & Reviews
  FEEDBACK_SUBMITTED: "Feedback submitted!",
  SUGGESTION_DELETED: "Suggestion deleted",
  ASSIGNMENT_REMOVED: "Assignment removed",

  // Other
  SYNCED: "Data synced successfully",
  ARCHIVED: "Successfully archived",
  RESTORED: "Successfully restored",
  FILTERS_CLEARED: "Filters cleared",
  VIDEO_REMOVED: "Removed from saved videos",
  VIDEO_SAVED: "Saved to your collection!",
  OFFICIAL_ADDED: "Official added successfully",
  OFFICIAL_UPDATED: "Official updated successfully",
  OFFICIAL_SCHEDULED: "Official scheduled successfully",
  STATUS_UPDATED: "Status updated successfully",
  GAME_CREATED: "Game created successfully",
  GAME_SAVED_OFFLINE: "Game saved offline",
  PLAY_SAVED_OFFLINE: "Play saved offline",
} as const;

/**
 * Error messages
 */
export const TOAST_ERROR = {
  // Generic
  GENERIC: "Something went wrong. Please try again.",
  SAVE_FAILED: "Failed to save. Please try again.",
  UPDATE_FAILED: "Failed to update. Please try again.",
  DELETE_FAILED: "Failed to delete. Please try again.",
  CREATE_FAILED: "Failed to create. Please try again.",
  LOAD_FAILED: "Failed to load data. Please try again.",

  // Network
  NETWORK: "Network error. Please check your connection.",
  TIMEOUT: "Request timed out. Please try again.",
  SERVER: "Server error. Please try again later.",

  // Authentication
  LOGIN_FAILED: "Login failed. Please check your credentials.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  UNAUTHORIZED: "You don't have permission to perform this action.",
  NOT_AUTHENTICATED: "Please log in to continue.",

  // Validation
  REQUIRED_FIELDS: "Please fill in all required fields.",
  INVALID_INPUT: "Invalid input. Please check your data.",
  INVALID_EMAIL: "Please enter a valid email address.",
  WEAK_PASSWORD: "Password doesn't meet requirements.",
  INVALID_FILE_TYPE: "Please select a JPEG, PNG, or WebP image",
  FILE_TOO_LARGE_5MB: "Image must be smaller than 5MB",
  MISSING_REQUIRED_FIELDS: "Please fill in both Athlete ID and Dataset JSON",
  MISSING_FILE_AND_ID: "Please select a file and enter Athlete ID",
  MISSING_SUPPLEMENT_NAME: "Please enter a supplement name",
  MISSING_TRIP_DETAILS: "Please fill in trip name and duration",
  MISSING_EMAIL: "Please enter an email address",
  INCOMPLETE_METRICS: "Please complete all metrics before submitting",

  // Team
  TEAM_LOAD_FAILED: "Failed to load team data.",

  // Chat
  CHANNEL_LOAD_FAILED: "Failed to load channels.",
  CHANNEL_CREATE_FAILED: "Failed to create channel.",
  CHANNEL_MEMBERS_FAILED: "Failed to load channel members",
  MESSAGE_SEND_FAILED: "Failed to send message.",
  MESSAGE_DELETE_FAILED: "Failed to delete message",
  PIN_UPDATE_FAILED: "Failed to update pin.",
  IMPORTANCE_UPDATE_FAILED: "Failed to update importance",
  NO_TEAM_SELECTED: "No team selected",
  NO_TEAM_FOUND: "No team found",
  CONVERSATION_START_FAILED: "Failed to start conversation",

  // Export
  REPORT_FAILED: "Failed to generate report.",

  // Upload
  UPLOAD_FAILED: "Upload failed. Please try again.",
  AVATAR_UPLOAD_FAILED: "Failed to upload profile picture",
  FILE_TOO_LARGE: "File is too large.",
  VIDEO_TOO_LARGE_50MB: "Video must be less than 50MB",
  COPY_FAILED: "Failed to copy link",
  COPY_FAILED_GENERIC: "Failed to copy",
  NO_DATA_TO_EXPORT: "No data available to export",
  SHARE_FAILED: "Failed to share. Please try again.",
  CHAT_START_FAILED: "Failed to start chat. Please try again.",

  // Push Notifications
  PUSH_DENIED: "Notification permission was denied.",
  PUSH_FAILED: "Failed to enable push notifications.",

  // Training & Sessions
  SESSION_UPDATE_FAILED: "Failed to update session",
  SESSION_START_FAILED: "Failed to start session",
  SESSION_STARTED_LOGGED: "Training session started and logged!",
  SESSION_STARTED_UNSAVED: "Session started but may not have been saved",
  SESSION_TEMPLATE_SAVED: "Session template saved successfully!",
  SESSION_LOG_FAILED: "Failed to log session. Please try again.",
  SESSION_COMPLETE_FAILED: "Failed to mark workout as complete",
  SESSION_POSTPONE_FAILED: "Failed to postpone workout",
  SESSION_SAVE_FAILED: "Failed to save training session",
  TRAINING_COMPLETED: "Training completed: {type} ({duration} min)",
  WORKOUT_SAVED: "Workout saved!",
  WORKOUT_COMPLETED_EMOJI: "Workout completed! 💪",
  WORKOUT_SAVE_FAILED: "Failed to save workout",
  WORKOUT_COMPLETE_FAILED: "Failed to complete workout",
  LOGIN_TO_SAVE_WORKOUTS: "Please log in to save workouts",
  LOGIN_TO_COMPLETE_WORKOUTS: "Please log in to complete workouts",
  LOGIN_TO_START_SESSION: "Please log in to start a session",
  LOGIN_TO_SAVE_SESSION: "Please log in to save a session",
  PERFORMANCE_LOGGED: "Performance logged successfully!",
  LOGIN_TO_SAVE_PERFORMANCE: "Please log in to save performance",
  ENTER_PERFORMANCE_METRIC: "Please enter at least one performance metric",
  CHECKIN_SAVE_FAILED: "Failed to save check-in",
  READINESS_SUBMIT_FAILED: "Failed to submit readiness check",
  AI_SUGGESTIONS_FAILED: "Failed to generate new plan",
  SUGGESTION_APPLY_FAILED: "Failed to apply suggestion",
  VIDEO_SUBMIT_FAILED: "Failed to submit. Please try again.",
  VIDEO_DELETE_FAILED: "Failed to delete",
  VIDEO_APPROVE_FAILED: "Failed to approve suggestion",
  VIDEO_REJECT_FAILED: "Failed to reject suggestion",
  FEEDBACK_SUBMIT_FAILED: "Failed to submit feedback",
  BOOKMARK_UPDATE_FAILED: "Failed to update bookmark",
  COMMENT_ADD_FAILED: "Failed to add comment",
  DEPTH_CHART_LOAD_FAILED: "Failed to load depth charts",
  DEPTH_CHART_DETAILS_FAILED: "Failed to load depth chart details",
  DEPTH_CHART_INIT_FAILED: "Failed to initialize depth charts",
  PLAYER_ASSIGN_FAILED: "Failed to assign player",
  PLAYER_REMOVE_FAILED: "Failed to remove player",
  BACKUP_SLOT_ADD_FAILED: "Failed to add backup slot",
  CHECKIN_FAILED: "Failed to check in",

  // Officials & Scheduling
  OFFICIAL_LOAD_FAILED: "Failed to load officials",
  OFFICIAL_UPDATED: "Official updated",
  OFFICIAL_ADDED: "Official added",
  OFFICIAL_UPDATE_FAILED: "Failed to update official",
  OFFICIAL_ADD_FAILED: "Failed to add official",
  OFFICIAL_SCHEDULED: "Official scheduled successfully",
  OFFICIAL_SCHEDULE_FAILED: "Failed to schedule official",
  STATUS_UPDATED: "Status updated",
  STATUS_UPDATE_FAILED: "Failed to update status",
  ASSIGNMENT_REMOVED: "Assignment removed",
  ASSIGNMENT_REMOVE_FAILED: "Failed to remove assignment",

  // Reports & Analytics
  REPORT_GENERATING: "Generating report...",
  REPORT_EXPORTED: "Report exported successfully!",
  ACWR_REPORT_GENERATING: "Generating ACWR report...",
  ACWR_REPORT_DOWNLOADED: "ACWR report downloaded successfully",
  PDF_REPORT_GENERATING: "Generating PDF report...",
  PDF_REPORT_DOWNLOADED: "PDF report downloaded successfully",
  PDF_EXPORT_FAILED: "Failed to export PDF. Please try again.",
  LOGIN_TO_DOWNLOAD_REPORTS: "Please log in to download reports",
  DASHBOARD_NOT_FOUND: "Dashboard not found",
  ALLOW_POPUPS_FOR_PDF: "Please allow pop-ups to export PDF",

  // Wellness
  WELLNESS_CHECKIN_SAVED: "Wellness check-in saved! 💪",
  WELLNESS_CHECKIN_FAILED: "Failed to save wellness check-in",
  ENTER_SLEEP_HOURS: "Please enter your sleep hours",
  ALERT_DISMISSED: "Alert dismissed",

  // Game Tracker
  GAME_CREATED: "Game created successfully!",
  GAME_CREATE_FAILED: "Failed to create game. Please try again.",
  PLAY_SAVED_OFFLINE: "Play will be saved when connection is restored",
  GAME_SAVED_OFFLINE: "Game will be saved when connection is restored",

  // Notifications
  NOTIFICATIONS_MARKED_READ: "All notifications marked as read",
  NOTIFICATIONS_MARK_READ_FAILED: "Failed to mark notifications as read",
  NOTIFICATIONS_CLEARED: "Read notifications cleared",
  NOTIFICATIONS_CLEAR_FAILED: "Failed to clear notifications",
  NOTIFICATION_DISMISS_FAILED: "Failed to dismiss notification",
  ACTIVITY_MARKED_READ: "All activity marked as read",

  // AI Coach & Notes
  NOTE_SAVED: "Note saved successfully",
  NOTE_SAVE_FAILED: "Failed to save note",
  RECOMMENDATION_OVERRIDDEN: "Recommendation overridden",
  RECOMMENDATION_OVERRIDE_FAILED: "Failed to override recommendation",

  // Coach Dashboard
  OPENING_LOAD_ADJUSTMENT: "Opening load adjustment for player...",
  SENDING_DATA_REQUEST: "Sending data sharing request to athlete...",
  ENTER_SESSION_TITLE: "Please enter a session title",
  ENTER_MESSAGE: "Please enter a message",
  NO_OVERRIDES_FOUND: "No overrides found for this player",

  // Account & Privacy
  CONSENT_REQUEST_SENT: "Consent request sent to guardian",
  TYPE_DELETE_TO_CONFIRM: "Please type DELETE to confirm",
  NO_PENDING_DELETION: "No pending deletion to cancel",
  DELETION_CANNOT_CANCEL: "This deletion request cannot be cancelled",
  PREFERENCES_UPDATED: "Preferences updated",
  ACCOUNT_DELETION_REQUESTED:
    "Account deletion requested. Your data will be permanently deleted in 30 days. You can cancel this request by logging back in within 30 days.",
  DELETION_REQUEST_FAILED: "Failed to request deletion",
  EXPORT_FAILED: "Failed to export data",
  REGISTRATION_FAILED: "Registration failed",
  INVITATION_ACCEPT_FAILED: "Failed to accept invitation",
  INVITATION_DECLINE_FAILED: "Failed to decline invitation",
  PLAYER_SAVE_FAILED: "Failed to save player",
  PLAYERS_REMOVE_FAILED: "Failed to remove players",
  INVITATION_SEND_FAILED: "Failed to send invitation",
  INVITATION_RESEND_FAILED: "Failed to resend invitation",
  // Note: PLAYER_REMOVE_FAILED is defined above (line 289)

  // Settings & Security
  SETTINGS_SAVE_FAILED: "Failed to save settings. Please try again.",
  PASSWORD_CHANGE_FAILED: "Failed to change password. Please try again.",
  ACCOUNT_DELETE_FAILED: "Failed to delete account. Please try again.",
  TWO_FA_VERIFICATION_FAILED: "2FA verification failed. Please try again.",
  TWO_FA_DISABLE_FAILED: "Failed to disable 2FA. Please try again.",
  TEAM_REQUEST_FAILED: "Failed to submit team request. Please try again.",
  ACHIEVEMENTS_LOAD_FAILED: "Failed to load achievements.",

  // Other
  NOT_FOUND: "The requested resource was not found.",
  ANALYTICS_SHARE_FAILED: "Failed to share analytics.",
  MUST_BE_LOGGED_IN: "You must be logged in to create a team.",
  LOGIN_TO_SAVE: "Please log in to save your check-in",
  LOGIN_TO_SUBMIT: "Please log in to submit suggestions",
  LOGIN_TO_START: "Please log in to start a session",
  LOGIN_TO_SUBMIT_READINESS: "Please log in to submit readiness check",
  RETROACTIVE_LOGGING_WARNING:
    "This session requires coach approval due to retroactive logging.",
  START_SESSION_FIRST: "Start the session first before marking complete",
} as const;

/**
 * Warning messages
 */
export const TOAST_WARN = {
  // Validation
  REQUIRED_FIELDS: "Please fill in all required fields.",
  INCOMPLETE_FORM: "Please complete all required fields.",
  MISSING_SUPPLEMENT_NAME: "Please enter a supplement name",
  MISSING_EMAIL: "Please enter an email address",
  MISSING_FILE_AND_ID: "Please select a file and enter an Athlete ID",
  MISSING_REQUIRED_FIELDS: "Please fill in all required fields",
  MISSING_TRIP_DETAILS: "Please fill in trip name and duration",
  ENTER_SESSION_TITLE: "Please enter a session title",
  ENTER_MESSAGE: "Please enter a message",
  ENTER_SLEEP_HOURS: "Please enter sleep hours",
  ENTER_PERFORMANCE_METRIC: "Please enter a performance metric",
  RETROACTIVE_LOGGING_WARNING:
    "You are logging retroactively. Ensure accuracy.",
  START_SESSION_FIRST: "Start the session first",
  POST_SAVED: "Post saved locally. Will sync when online.",

  // State
  OFFLINE:
    "You're offline. Actions will be synced when connection is restored.",
  UNSAVED_CHANGES: "You have unsaved changes.",

  // Team
  NO_TEAM: "You need to join a team first.",
  NO_COACH: "No coach assigned to your team yet.",

  // Limits
  LIMIT_REACHED: "You've reached the limit.",
  NO_PLAYERS_TO_EXPORT: "No players to export",
  NO_DATA_TO_EXPORT: "No data to export",
  NO_DATA_TO_EXPORT_GENERIC: "No data available to export",

  // Other
  ALLOW_POPUPS: "Please allow pop-ups to complete this action.",
  INVITATION_DECLINED: "Invitation declined",
  SESSION_CANCELLED: "Training session creation cancelled",
  SUGGESTION_DISMISSED: "Suggestion dismissed",
} as const;

/**
 * Info messages
 */
export const TOAST_INFO = {
  // Processing
  GENERATING: "Generating...",
  PROCESSING: "Processing...",
  LOADING: "Loading...",

  // Specific actions
  GENERATING_REPORT: "Generating report...",
  GENERATING_PDF: "Generating PDF report...",
  REPORT_GENERATING: "Generating report...",
  ACWR_REPORT_GENERATING: "Generating ACWR report...",
  PDF_REPORT_GENERATING: "Generating PDF report...",

  // Email
  EMAIL_VERIFICATION_SENT:
    "Email update requires verification. Check your inbox.",
  ENTER_NEW_PASSWORD: "Please enter your new password",

  // Actions
  UPLOADING_MEDIA: "Uploading media...",
  SENDING_REMINDERS: "Sending check-in reminders to athletes...",
  SENDING_DATA_REQUEST: "Sending data request...",
  COMPLETE_CURRENT_STEP: "Please complete the current step first",
  TOURNAMENT_ENDED: "Tournament ended. Great job!",
  AUDIT_LOG_COMING_SOON: "Audit log feature coming soon",
  SHOWING_ALL_WORKOUTS: "Showing all workouts",
  NOTIFICATIONS_CLEARED: "Notifications cleared",
  OPENING_LOAD_ADJUSTMENT: "Opening load adjustment...",
  NO_OVERRIDES_FOUND: "No overrides found",
  SUGGESTION_DISMISSED: "Suggestion dismissed",
  SUGGESTION_DELETED: "Suggestion deleted",
  BOOKMARK_REMOVED: "Bookmark removed",
  FILTER_CLEARED: "Filter cleared",
  FILTERS_CLEARED: "Filters cleared",
  FILTER_CLEARED_ALL: "Filter cleared - showing all posts",
  INVITATION_DECLINED: "Invitation declined",
  SESSION_CANCELLED: "Session cancelled",
  ALERT_DISMISSED: "Alert dismissed",
  VIDEO_REMOVED: "Video removed from saved",
  GAME_SAVED_OFFLINE: "Game saved offline - will sync when online",
  PLAY_SAVED_OFFLINE: "Play saved offline - will sync when online",

  // Other
  WORKING: "Working on it...",
} as const;

/**
 * Combined toast messages export
 */
export const TOAST = {
  SUCCESS: TOAST_SUCCESS,
  ERROR: TOAST_ERROR,
  WARN: TOAST_WARN,
  INFO: TOAST_INFO,
} as const;

/**
 * Type-safe access to toast message categories
 */
export type ToastSuccessKey = keyof typeof TOAST_SUCCESS;
export type ToastErrorKey = keyof typeof TOAST_ERROR;
export type ToastWarnKey = keyof typeof TOAST_WARN;
export type ToastInfoKey = keyof typeof TOAST_INFO;
