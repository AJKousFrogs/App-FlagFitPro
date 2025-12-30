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
export { ButtonPrimaryComponent } from "./button-primary/button-primary.component";

// ============================================================================
// CARD COMPONENTS
// ============================================================================
export { CardComponent } from "./card/card.component";
export { CardInteractiveComponent } from "./card-interactive/card-interactive.component";
export { ActionCardComponent } from "./action-card/action-card.component";

// ============================================================================
// FORM COMPONENTS
// ============================================================================
export { InputComponent } from "./input/input.component";
export { SelectComponent, type SelectOption } from "./select/select.component";
export { CheckboxComponent } from "./checkbox/checkbox.component";
export { RadioComponent } from "./radio/radio.component";
export { TextareaComponent } from "./textarea/textarea.component";

// ============================================================================
// DATA DISPLAY COMPONENTS
// ============================================================================
export { TableComponent, type TableColumn } from "./table/table.component";
export { BadgeComponent } from "./badge/badge.component";
export { AvatarComponent } from "./avatar/avatar.component";
export { SkeletonComponent } from "./skeleton/skeleton.component";
export { TrendCardComponent, type TrendData } from "./trend-card/trend-card.component";
export { StatsGridComponent, type StatItem } from "./stats-grid/stats-grid.component";
export { QuickStatsBarComponent, type QuickStat } from "./quick-stats-bar/quick-stats-bar.component";

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
export { MetricRingComponent, type MetricRingThresholds } from "./metric-ring/metric-ring.component";
export { CountdownTimerComponent } from "./countdown-timer/countdown-timer.component";

// ============================================================================
// STATUS & INDICATOR COMPONENTS
// ============================================================================
export { PulseIndicatorComponent, type PulseStatus } from "./pulse-indicator/pulse-indicator.component";
export { StatusTimelineComponent, type TimelineItem } from "./status-timeline/status-timeline.component";

// ============================================================================
// GAMIFICATION COMPONENTS
// ============================================================================
export { AchievementBadgeComponent, type BadgeTier, type BadgeRarity } from "./achievement-badge/achievement-badge.component";

// ============================================================================
// NAVIGATION & LAYOUT COMPONENTS
// ============================================================================
export { TabsComponent, type TabItem } from "./tabs/tabs.component";
export { SwipeableCardsComponent } from "./swipeable-cards/swipeable-cards.component";

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================
export { AlertComponent } from "./alert/alert.component";
export { ModalComponent } from "./modal/modal.component";
export { ToastComponent } from "./toast/toast.component";
export { SpinnerComponent } from "./spinner/spinner.component";

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================
export { TooltipComponent } from "./tooltip/tooltip.component";

// ============================================================================
// UX FLOW COMPONENTS (New for improved athlete experience)
// ============================================================================
export { MorningBriefingComponent } from "./morning-briefing/morning-briefing.component";
export { PostTrainingRecoveryComponent } from "./post-training-recovery/post-training-recovery.component";
export { FeatureWalkthroughComponent } from "./feature-walkthrough/feature-walkthrough.component";
export { QuickWellnessCheckinComponent } from "./quick-wellness-checkin/quick-wellness-checkin.component";

// ============================================================================
// GAME DAY & TOURNAMENT COMPONENTS
// ============================================================================
export { GameDayCountdownComponent } from "./game-day-countdown/game-day-countdown.component";
export { TournamentModeWidgetComponent } from "./tournament-mode-widget/tournament-mode-widget.component";

// ============================================================================
// ANALYTICS & INSIGHTS COMPONENTS
// ============================================================================
export { ActionableInsightsComponent, type Insight } from "./actionable-insights/actionable-insights.component";

// ============================================================================
// COACH COMPONENTS
// ============================================================================
export { TeamWellnessOverviewComponent } from "./team-wellness-overview/team-wellness-overview.component";

// ============================================================================
// CONNECTIVITY COMPONENTS
// ============================================================================
export { OfflineBadgeComponent, type OfflineCapability } from "./offline-badge/offline-badge.component";

// ============================================================================
// KEYBOARD & ACCESSIBILITY COMPONENTS
// ============================================================================
export { KeyboardShortcutsModalComponent } from "./keyboard-shortcuts-modal/keyboard-shortcuts-modal.component";

// ============================================================================
// SUCCESS & FEEDBACK COMPONENTS
// ============================================================================
export { SuccessCheckmarkComponent, type SuccessSize, type SuccessVariant } from "./success-checkmark/success-checkmark.component";

// ============================================================================
// LOADING & SKELETON COMPONENTS
// ============================================================================
export { SkeletonLoaderComponent, SkeletonRepeatComponent, type SkeletonVariant } from "./skeleton-loader/skeleton-loader.component";
export { EmptyStateComponent } from "./empty-state/empty-state.component";
