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
export { CardComponent } from "./card/card.component";

// ============================================================================
// FORM COMPONENTS
// ============================================================================
export { ControlRowComponent } from "./control-row/control-row.component";

// ============================================================================
// DATA DISPLAY COMPONENTS
// ============================================================================
export { BadgeComponent } from "./badge/badge.component";
export { SkeletonComponent } from "./skeleton/skeleton.component";
export {
  StatsGridComponent,
  type StatItem,
} from "./stats-grid/stats-grid.component";

// ============================================================================
// METRIC & PROGRESS COMPONENTS
// ============================================================================
export { CountdownTimerComponent } from "./countdown-timer/countdown-timer.component";

// ============================================================================
// STATUS & INDICATOR COMPONENTS
// ============================================================================
export {
  StatusTagComponent,
  type StatusTagSeverity,
} from "./status-tag/status-tag.component";

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

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================
export { ToastComponent } from "./toast/toast.component";

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
// KEYBOARD & ACCESSIBILITY COMPONENTS
// ============================================================================
export { KeyboardShortcutsModalComponent } from "./keyboard-shortcuts-modal/keyboard-shortcuts-modal.component";

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
