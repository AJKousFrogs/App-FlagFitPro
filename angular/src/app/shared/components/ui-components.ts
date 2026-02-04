/**
 * UI Components Index - Angular 21
 *
 * Central export file for all UI components
 * These components follow Angular 21 patterns with signals
 *
 * @version 2.0.0 - Added premium UX components
 */

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================
export { ButtonComponent } from "./button/button.component";

// ============================================================================
// CARD COMPONENTS
// ============================================================================
export { ActionCardComponent } from "./action-card/action-card.component";
export { CardComponent } from "./card/card.component";

// ============================================================================
// FORM COMPONENTS
// ============================================================================
export { InputComponent } from "./input/input.component";
// DEPRECATED & REMOVED: These components were unused and have been removed
// Use PrimeNG components directly:
// - SelectComponent → Use PrimeNG p-select (removed 2025-01-XX)
// - CheckboxComponent → Use PrimeNG p-checkbox (removed 2025-01-XX)
// - RadioComponent → Use PrimeNG p-radioButton (removed 2025-01-XX)
export { TextareaComponent } from "./textarea/textarea.component";
export { ControlRowComponent } from "./control-row/control-row.component";

// ============================================================================
// DATA DISPLAY COMPONENTS
// ============================================================================
// TableComponent removed - use PrimeNG p-table or p-datatable directly
export { AvatarComponent } from "./avatar/avatar.component";
export { BadgeComponent } from "./badge/badge.component";
export {
  QuickStatsBarComponent,
  type QuickStat,
} from "./quick-stats-bar/quick-stats-bar.component";
export { SkeletonComponent } from "./skeleton/skeleton.component";
export {
  StatsGridComponent,
  type StatItem,
} from "./stats-grid/stats-grid.component";
export {
  TrendCardComponent,
  type TrendData,
} from "./trend-card/trend-card.component";

// ============================================================================
// WELLNESS & HEALTH COMPONENTS (Single Source of Truth)
// ============================================================================
export {
  WellnessScoreDisplayComponent,
  type WellnessDisplayVariant,
  type WellnessMetric,
} from "./wellness-score-display/wellness-score-display.component";

// ============================================================================
// METRIC & PROGRESS COMPONENTS
// ============================================================================
export { CountdownTimerComponent } from "./countdown-timer/countdown-timer.component";
export {
  MetricRingComponent,
  type MetricRingThresholds,
} from "./metric-ring/metric-ring.component";

// ============================================================================
// STATUS & INDICATOR COMPONENTS
// ============================================================================
export {
  PulseIndicatorComponent,
  type PulseStatus,
} from "./pulse-indicator/pulse-indicator.component";
export {
  StatusTagComponent,
  type StatusTagSeverity,
} from "./status-tag/status-tag.component";
export {
  StatusTimelineComponent,
  type TimelineItem,
} from "./status-timeline/status-timeline.component";

// ============================================================================
// GAMIFICATION COMPONENTS
// ============================================================================
export {
  AchievementBadgeComponent,
  type BadgeRarity,
  type BadgeTier,
} from "./achievement-badge/achievement-badge.component";

// ============================================================================
// NAVIGATION & LAYOUT COMPONENTS
// ============================================================================
export { NavItemComponent } from "./nav-item.component";
export { SwipeableCardsComponent } from "./swipeable-cards/swipeable-cards.component";
export { TabsComponent, type TabItem } from "./tabs/tabs.component";

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================
export { AlertComponent } from "./alert/alert.component";
// ModalComponent removed - use PrimeNG p-dialog directly
export { ToastComponent } from "./toast/toast.component";
// SpinnerComponent removed - use PrimeNG p-progressSpinner directly

// ============================================================================
// DIALOG COMPONENTS
// ============================================================================
export { AppDialogComponent } from "./dialog/dialog.component";
export { DialogFooterComponent } from "./dialog-footer/dialog-footer.component";
export { DialogHeaderComponent } from "./dialog-header/dialog-header.component";

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

// ============================================================================
// UX FLOW COMPONENTS (New for improved athlete experience)
// ============================================================================
export { FeatureWalkthroughComponent } from "./feature-walkthrough/feature-walkthrough.component";
export { MorningBriefingComponent } from "./morning-briefing/morning-briefing.component";
export { PostTrainingRecoveryComponent } from "./post-training-recovery/post-training-recovery.component";
export { QuickWellnessCheckinComponent } from "./quick-wellness-checkin/quick-wellness-checkin.component";

// ============================================================================
// GAME DAY & TOURNAMENT COMPONENTS
// ============================================================================
export { GameDayCountdownComponent } from "./game-day-countdown/game-day-countdown.component";
export { TournamentModeWidgetComponent } from "./tournament-mode-widget/tournament-mode-widget.component";

// ============================================================================
// ANALYTICS & INSIGHTS COMPONENTS
// ============================================================================
export {
  ActionableInsightsComponent,
  type Insight,
} from "./actionable-insights/actionable-insights.component";

// ============================================================================
// COACH COMPONENTS
// ============================================================================
export { TeamWellnessOverviewComponent } from "./team-wellness-overview/team-wellness-overview.component";

// ============================================================================
// CONNECTIVITY COMPONENTS
// ============================================================================
export {
  OfflineBadgeComponent,
  type OfflineCapability,
} from "./offline-badge/offline-badge.component";

// ============================================================================
// KEYBOARD & ACCESSIBILITY COMPONENTS
// ============================================================================
export { KeyboardShortcutsModalComponent } from "./keyboard-shortcuts-modal/keyboard-shortcuts-modal.component";

// ============================================================================
// SUCCESS & FEEDBACK COMPONENTS
// ============================================================================
export {
  SuccessCheckmarkComponent,
  type SuccessSize,
  type SuccessVariant,
} from "./success-checkmark/success-checkmark.component";

// ============================================================================
// LOADING & SKELETON COMPONENTS
// ============================================================================
export { EmptyStateComponent } from "./empty-state/empty-state.component";
export { AppLoadingComponent } from "./loading/loading.component";
export {
  SkeletonLoaderComponent,
  SkeletonRepeatComponent,
  type SkeletonVariant,
} from "./skeleton-loader/skeleton-loader.component";
