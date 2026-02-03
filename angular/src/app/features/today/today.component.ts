/**
 * Today's Practice Component
 *
 * The primary daily training hub for athletes. Displays:
 * - Personalized greeting based on time of day
 * - Key metrics (ACWR, Readiness)
 * - Weekly progress overview
 * - Phase-aware content (check-in → protocol → wrap-up)
 * - Daily schedule timeline
 *
 * Design System: PrimeNG 21+ with Aura preset
 * @see docs/PRIMENG_DESIGN_SYSTEM_RULES.md
 *
 * @author FlagFit Pro Team
 * @version 2.0.0 - Angular 21 Signals Architecture
 */

import {
  animate,
  keyframes,
  style,
  transition,
  trigger,
} from "@angular/animations";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { MessageService, PrimeTemplate } from "primeng/api";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";

import { ProgressBar } from "primeng/progressbar";
import { Skeleton } from "primeng/skeleton";


import { from } from "rxjs";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../shared/components/ui-components";

// Layout & Components
import { AcwrBaselineComponent } from "../../shared/components/acwr-baseline/acwr-baseline.component";
import { AppBannerComponent } from "../../shared/components/app-banner/app-banner.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import {
  ProtocolJson,
  TodayViewModel,
  resolveTodayState,
} from "../../today/resolution/today-state.resolver";
import { ProtocolBlockComponent } from "../training/daily-protocol/components/protocol-block.component";
import { WeekDay } from "../training/daily-protocol/components/week-progress-strip.component";
import {
  BlockType,
  DailyProtocol,
  ExerciseCategory,
  PrescribedExercise,
  ProtocolBlock,
} from "../training/daily-protocol/daily-protocol.models";

// Services
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { DataSourceService } from "../../core/services/data-source.service";
import { DirectSupabaseApiService } from "../../core/services/direct-supabase-api.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";
import { ScreenReaderAnnouncerService } from "../../core/services/screen-reader-announcer.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";

// Environment
import { environment } from "../../../environments/environment";

// Utils
import { mapDailyProtocolResponse } from "../../core/utils/api-response-mapper";

// Constants
import { TIMEOUTS, TRAINING } from "../../core/constants/app.constants";
import {
  WELLNESS,
  computeQuickReadiness,
} from "../../core/constants/wellness.constants";

// Types
type DayPhase = "morning" | "midday" | "evening";
type ActiveFocus = "checkin" | "protocol" | "wrapup";
type TagSeverity =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "contrast";

// Quick Check-in Types
interface QuickMood {
  value: number;
  emoji: string;
  label: string;
}

interface QuickEnergyLevel {
  value: number;
  label: string;
}

interface QuickFormData {
  overallFeeling: number | null;
  energyLevel: number | null;
  hasSoreness: boolean | null;
  sleepHours: number | null;
  sorenessLevel: number | null;
  stressLevel: number | null;
  sorenessAreas: string[];
}

@Component({
  selector: "app-today",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    Card,
    Dialog,
    PrimeTemplate,
    ProgressBar,
    Skeleton,

    MainLayoutComponent,
    ProtocolBlockComponent,
    ButtonComponent,
    EmptyStateComponent,
    AppBannerComponent,
    AcwrBaselineComponent,
  ],
  providers: [MessageService],
  animations: [
    trigger("fadeSlideIn", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(-12px)" }),
        animate(
          "300ms ease-out",
          style({ opacity: 1, transform: "translateY(0)" }),
        ),
      ]),
    ]),
    trigger("celebrationFade", [
      transition(":enter", [
        style({ opacity: 0 }),
        animate("300ms ease-out", style({ opacity: 1 })),
      ]),
      transition(":leave", [animate("200ms ease-in", style({ opacity: 0 }))]),
    ]),
    trigger("celebrationBounce", [
      transition(":enter", [
        animate(
          "600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          keyframes([
            style({
              opacity: 0,
              transform: "scale(0.3) translateY(50px)",
              offset: 0,
            }),
            style({
              opacity: 1,
              transform: "scale(1.1) translateY(-10px)",
              offset: 0.6,
            }),
            style({
              opacity: 1,
              transform: "scale(1) translateY(0)",
              offset: 1,
            }),
          ]),
        ),
      ]),
    ]),
  ],
  templateUrl: "./today.component.html",
  styles: [
    `
      /* ==========================================================================
       TODAY'S PRACTICE - Design System Compliant Styles
       Uses tokens from: scss/tokens/design-system-tokens.scss
       ========================================================================== */

      /* --------------------------------------------------------------------------
       LAYOUT CONTAINER
       -------------------------------------------------------------------------- */
      .today-page {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        padding: var(--space-6);
        max-width: var(--content-max-width-xl);
        margin: 0 auto;
        width: 100%;
      }

      /* --------------------------------------------------------------------------
       ONBOARDING BANNER (First-time users)
       PrimeNG card styling handled globally in _brand-overrides.scss
       -------------------------------------------------------------------------- */
      .onboarding-banner {
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .onboarding-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-6);
        color: var(--color-text-on-primary);
      }

      .onboarding-info {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .onboarding-avatar {
        width: var(--space-12);
        height: var(--space-12);
        min-width: var(--space-12);
        background: rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--ds-font-size-md);
      }

      .onboarding-text h2 {
        margin: 0;
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-semibold);
      }

      .onboarding-text p {
        margin: var(--space-1) 0 0;
        font-size: var(--ds-font-size-sm);
        opacity: 0.9;
      }

      /* --------------------------------------------------------------------------
       WELCOME CARD
       PrimeNG card styling handled globally in _brand-overrides.scss
       -------------------------------------------------------------------------- */
      .welcome-row {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .user-avatar {
        width: var(--space-12);
        height: var(--space-12);
        min-width: var(--space-12);
        background: var(--surface-tertiary);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-secondary);
        font-size: var(--ds-font-size-md);
        border: var(--border-2) solid var(--color-border-secondary);
      }

      .welcome-text {
        flex: 1;
        min-width: 0;
      }

      .welcome-greeting {
        font-size: var(--ds-font-size-3xl); /* H1: Page greeting - 28px */
        font-weight: var(--ds-font-weight-semibold); /* H1: Semibold (600) */
        margin: 0;
        color: var(--color-text-primary);
        line-height: var(--ds-line-height-tight);
      }

      .welcome-name {
        font-size: var(--ds-font-size-2xl);
        font-weight: var(--ds-font-weight-bold);
        margin: var(--space-1) 0 0;
        color: var(--color-text-primary);
        line-height: var(--ds-line-height-h1);
      }

      .welcome-hint {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
        margin: var(--space-1) 0 0;
      }

      /* --------------------------------------------------------------------------
       STATS GRID
       PrimeNG card styling handled globally in _brand-overrides.scss
       -------------------------------------------------------------------------- */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-3);
      }

      .stat-row {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .stat-icon {
        width: var(--space-10);
        height: var(--space-10);
        min-width: var(--space-10);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--ds-font-size-md); /* 16px - standard icon */
      }

      .stat-icon.acwr {
        background: var(--color-status-info-light);
        color: var(--color-status-info);
      }

      .stat-icon.readiness {
        background: var(--color-status-error-light);
        color: var(--color-status-error);
      }

      .stat-info {
        flex: 1;
        min-width: 0;
      }

      .stat-value-row {
        display: flex;
        align-items: baseline;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      .stat-block__value {
        font-size: var(--ds-font-size-2xl); /* Metric: KPI numbers - 24px */
        font-weight: var(--ds-font-weight-bold); /* Metric: Bold (700) */
        line-height: var(--ds-line-height-tight); /* Metric: 1.2 */
        color: var(--color-text-primary);
      }

      .stat-status-label {
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-secondary);
        font-weight: var(--ds-font-weight-medium);
      }

      .stat-chevron {
        color: var(--color-text-muted);
        opacity: 0.6;
        font-size: var(--ds-font-size-sm); /* 14px - small icon */
      }

      .stat-block__value.optimal,
      .stat-block__value.high {
        color: var(--color-brand-primary);
      }
      .stat-block__value.moderate {
        color: var(--color-status-warning);
      }
      .stat-block__value.risk,
      .stat-block__value.low {
        color: var(--color-status-error);
      }

      .stat-block__label {
        font-size: var(--ds-font-size-xs); /* Caption: Helper text - 13px */
        font-weight: var(--ds-font-weight-regular); /* Caption: Regular (400) */
        color: var(--color-text-muted);
        text-transform: var(--ds-text-transform-uppercase);
        letter-spacing: var(--ds-letter-spacing-caption);
      }

      /* --------------------------------------------------------------------------
       WEEK PROGRESS CARD
       PrimeNG card styling handled globally in _brand-overrides.scss
       -------------------------------------------------------------------------- */

      /* --------------------------------------------------------------------------
       CONTENT CARDS (Check-in, Protocol, Wrap-up)
       PrimeNG card styling handled globally in _brand-overrides.scss
       -------------------------------------------------------------------------- */
      .content-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4) var(--space-2);
        margin-bottom: var(--space-3);
        border-bottom: var(--border-1) solid var(--color-border-secondary);
      }

      .card-header-icon {
        font-size: var(--ds-font-size-md);
        color: var(--color-brand-primary);
      }

      .card-header-title {
        flex: 1;
        font-size: var(--ds-font-size-xl);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
        line-height: var(--ds-line-height-tight);
        margin: 0;
      }

      .card-description {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-4);
        line-height: var(--ds-line-height-body);
      }

      /* --------------------------------------------------------------------------
       MERLIN INSIGHT CARD
       PrimeNG card styling handled globally in _brand-overrides.scss
       -------------------------------------------------------------------------- */
      .insight-content {
        display: flex;
        gap: var(--space-4);
        color: var(--color-text-on-primary);
      }

      .insight-avatar {
        width: 2.75rem;
        height: 2.75rem;
        min-width: 2.75rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--ds-font-size-md);
      }

      .insight-text {
        flex: 1;
      }

      .insight-title {
        margin: 0 0 var(--space-2);
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-semibold);
      }

      .insight-message {
        margin: 0 0 var(--space-3);
        font-size: var(--ds-font-size-sm);
        line-height: var(--ds-line-height-1-6);
        opacity: 0.9;
      }

      /* --------------------------------------------------------------------------
       PROTOCOL SECTION
       -------------------------------------------------------------------------- */
      .protocol-progress-wrapper {
        background: var(--surface-tertiary);
        padding: var(--space-3);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-4);
      }

      /* Protocol progress bar styling handled globally in _brand-overrides.scss */

      .protocol-meta {
        display: flex;
        justify-content: space-between;
        margin-top: var(--space-2);
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-secondary);
      }

      .protocol-blocks {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .card-footer {
        margin-top: var(--space-4);
        padding-top: var(--space-3);
        border-top: var(--border-1) solid var(--color-border-secondary);
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        justify-content: center;
      }

      /* --------------------------------------------------------------------------
       WRAP-UP ACTION CARDS
       PrimeNG card styling handled globally in _brand-overrides.scss
       -------------------------------------------------------------------------- */
      .action-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .action-row {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .action-icon {
        width: var(--space-10);
        height: var(--space-10);
        min-width: var(--space-10);
        background: var(--ds-primary-green-ultra-subtle);
        color: var(--color-brand-primary);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--ds-font-size-md); /* 16px - standard icon */
      }

      .action-text {
        flex: 1;
      }

      .action-text h4 {
        margin: 0;
        font-size: var(--ds-font-size-sm);
        font-weight: var(--ds-font-weight-medium);
        color: var(--color-text-primary);
      }

      .action-text p {
        margin: var(--space-1) 0 0;
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-secondary);
      }

      .action-chevron {
        color: var(--color-text-muted);
        opacity: 0.5;
      }

      /* --------------------------------------------------------------------------
       EMPTY STATE
       -------------------------------------------------------------------------- */
      .empty-state {
        text-align: center;
        padding: var(--space-8) var(--space-4);
        background: var(--surface-tertiary);
        border: var(--border-2) dashed var(--color-border-secondary);
        border-radius: var(--radius-lg);
      }

      .empty-state i {
        font-size: var(--ds-font-size-3rem); /* 48px - hero/empty state icon */
        color: var(--color-text-muted);
        opacity: 0.5;
        margin-bottom: var(--space-3);
      }

      .empty-state h3 {
        margin: 0 0 var(--space-2);
        font-size: var(--ds-font-size-md);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
      }

      .empty-state p {
        margin: 0 0 var(--space-4);
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      /* --------------------------------------------------------------------------
       SKELETON LOADING
       -------------------------------------------------------------------------- */
      .skeleton-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
        margin-top: var(--space-4);
      }

      /* --------------------------------------------------------------------------
       RESPONSIVE ADJUSTMENTS
       -------------------------------------------------------------------------- */
      @media (max-width: 640px) {
        .today-page {
          padding: var(--space-3);
          gap: var(--space-4);
        }

        .welcome-row {
          flex-direction: column;
          text-align: center;
        }

        .user-avatar {
          margin: 0 auto;
        }

        .welcome-cta {
          margin-top: var(--space-2);
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .onboarding-content {
          flex-direction: column;
          text-align: center;
        }

        .onboarding-info {
          flex-direction: column;
        }

        .insight-content {
          flex-direction: column;
          text-align: center;
        }

        .insight-avatar {
          margin: 0 auto;
        }
      }

      /* --------------------------------------------------------------------------
       QUICK CHECK-IN BUTTONS
       -------------------------------------------------------------------------- */
      .checkin-buttons {
        display: flex;
        gap: var(--space-2);
      }

      /* --------------------------------------------------------------------------
       QUICK CHECK-IN DIALOG
       -------------------------------------------------------------------------- */
      .quick-checkin-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
      }

      .quick-intro {
        text-align: center;
        color: var(--color-text-secondary);
        font-size: var(--ds-font-size-sm);
        margin: 0;
      }

      .quick-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .quick-label {
        font-size: var(--ds-font-size-sm);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
      }

      .mood-selector {
        display: flex;
        justify-content: space-between;
        gap: var(--space-2);
      }

      .mood-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-3) var(--space-2);
        background: var(--surface-secondary);
        border: var(--border-2) solid var(--color-border-secondary);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--hover-transition-fast);
      }

      .mood-btn:hover {
        border-color: var(--color-brand-primary);
        background: var(--hover-bg-secondary);
      }

      .mood-btn.selected {
        border-color: var(--color-brand-primary);
        background: var(--ds-primary-green-ultra-subtle);
      }

      .mood-emoji {
        font-size: var(--ds-font-size-2xl);
      }

      .mood-text {
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-secondary);
      }

      .mood-btn.selected .mood-text {
        color: var(--color-brand-primary);
        font-weight: var(--ds-font-weight-medium);
      }

      .energy-selector {
        display: flex;
        gap: var(--space-2);
      }

      .energy-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-2);
        background: var(--surface-secondary);
        border: var(--border-2) solid var(--color-border-secondary);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--hover-transition-fast);
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-secondary);
      }

      .energy-btn i {
        font-size: var(--ds-font-size-md);
        color: var(--color-status-warning);
      }

      .energy-icon--1 {
        opacity: 0.4;
      }

      .energy-icon--2 {
        opacity: 0.6;
      }

      .energy-icon--3 {
        opacity: 0.9;
      }

      .energy-icon--4,
      .energy-icon--5 {
        opacity: 1;
      }

      .energy-btn:hover {
        border-color: var(--color-brand-primary);
      }

      .energy-btn.selected {
        border-color: var(--color-brand-primary);
        background: var(--ds-primary-green-ultra-subtle);
        color: var(--color-brand-primary);
      }

      .soreness-selector {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
      }

      .soreness-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--surface-secondary);
        border: var(--border-2) solid var(--color-border-secondary);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--hover-transition-fast);
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      .soreness-btn i {
        font-size: var(--ds-font-size-md);
      }

      .soreness-btn:hover {
        border-color: var(--color-brand-primary);
      }

      .soreness-btn.selected {
        border-color: var(--color-brand-primary);
        background: var(--ds-primary-green-ultra-subtle);
        color: var(--color-brand-primary);
      }

      .soreness-btn.soreness-yes.selected {
        border-color: var(--color-status-warning);
        background: var(--color-status-warning-light);
        color: var(--color-status-warning);
      }

      .quick-preview {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3);
        background: var(--surface-tertiary);
        border-radius: var(--radius-md);
      }

      .quick-preview .preview-label {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      .quick-preview .preview-score {
        font-size: var(--ds-font-size-xl);
        font-weight: var(--ds-font-weight-bold);
      }

      .quick-preview .preview-score.high {
        color: var(--color-brand-primary);
      }
      .quick-preview .preview-score.moderate {
        color: var(--color-status-warning);
      }
      .quick-preview .preview-score.low {
        color: var(--color-status-error);
      }

      /* --------------------------------------------------------------------------
       QUICK CHECK-IN MODAL - Styles moved to global exceptions file
       See: angular/src/assets/styles/overrides/_exceptions.scss (DS-EXC-036b)
       -------------------------------------------------------------------------- */

      /* --------------------------------------------------------------------------
       CELEBRATION OVERLAY
       -------------------------------------------------------------------------- */
      .celebration-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(4px);
        padding: var(--space-4);
      }

      .celebration-content {
        position: relative;
        background: var(--surface-primary);
        border-radius: var(--radius-xl);
        padding: var(--space-8) var(--space-6);
        text-align: center;
        max-width: 400px;
        width: 100%;
        box-shadow: var(--shadow-xl);
      }

      .celebration-confetti {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: none;
      }

      .confetti-piece {
        position: absolute;
        width: var(--space-2);
        height: var(--space-2);
        background: var(--color-brand-primary);
        border-radius: 50%;
        animation: confetti-fall 2s ease-out forwards;
        animation-delay: var(--delay);
        transform: translateX(var(--x));
        opacity: 0;
      }

      .confetti-piece--1 {
        --delay: 0.1s;
        --x: -150px;
      }

      .confetti-piece--2 {
        --delay: 0.2s;
        --x: -120px;
      }

      .confetti-piece--3 {
        --delay: 0.3s;
        --x: -90px;
      }

      .confetti-piece--4 {
        --delay: 0.4s;
        --x: -60px;
      }

      .confetti-piece--5 {
        --delay: 0.5s;
        --x: -30px;
      }

      .confetti-piece--6 {
        --delay: 0.6s;
        --x: 0px;
      }

      .confetti-piece--7 {
        --delay: 0.7s;
        --x: 30px;
      }

      .confetti-piece--8 {
        --delay: 0.8s;
        --x: 60px;
      }

      .confetti-piece--9 {
        --delay: 0.9s;
        --x: 90px;
      }

      .confetti-piece--10 {
        --delay: 1s;
        --x: 120px;
      }

      .confetti-piece--11 {
        --delay: 1.1s;
        --x: 150px;
      }

      .confetti-piece--12 {
        --delay: 1.2s;
        --x: 180px;
      }

      .confetti-piece:nth-child(2n) {
        background: var(--color-status-warning);
        width: var(--space-2);
        height: var(--space-2);
      }

      .confetti-piece:nth-child(3n) {
        background: var(--color-status-info);
        width: var(--space-3);
        height: var(--space-3);
      }

      .confetti-piece:nth-child(4n) {
        background: var(--color-status-error);
        border-radius: 0;
        transform: translateX(var(--x)) rotate(45deg);
      }

      @keyframes confetti-fall {
        0% {
          opacity: 1;
          transform: translateX(var(--x)) translateY(calc(-1 * var(--space-5)))
            rotate(0deg);
        }
        100% {
          opacity: 0;
          transform: translateX(calc(var(--x) * 1.5)) translateY(150px)
            rotate(720deg);
        }
      }

      .celebration-icon {
        font-size: var(--ds-font-size-4rem);
        margin-bottom: var(--space-3);
        animation: icon-bounce 0.6s ease-out;
      }

      @keyframes icon-bounce {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.2);
        }
      }

      .celebration-title {
        margin: 0 0 var(--space-2);
        font-size: var(--ds-font-size-2xl);
        font-weight: var(--ds-font-weight-bold);
        color: var(--color-text-primary);
      }

      .celebration-message {
        margin: 0 0 var(--space-5);
        font-size: var(--ds-font-size-md);
        color: var(--color-text-secondary);
        line-height: var(--ds-line-height-body);
      }

      .celebration-stats {
        display: flex;
        justify-content: center;
        gap: var(--space-6);
        margin-bottom: var(--space-5);
        padding: var(--space-4);
        background: var(--surface-tertiary);
        border-radius: var(--radius-lg);
      }

      .celebration-stats .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-1);
      }

      .celebration-stats .stat-number {
        font-size: var(--ds-font-size-xl);
        font-weight: var(--ds-font-weight-bold);
        color: var(--color-brand-primary);
      }

      .celebration-stats .stat-block__label {
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-secondary);
        text-transform: var(--ds-text-transform-uppercase);
        letter-spacing: var(--ds-letter-spacing-wide);
      }

      /* --------------------------------------------------------------------------
       EMPTY STATE ACTIONS
       -------------------------------------------------------------------------- */
      .empty-state-actions {
        display: flex;
        gap: var(--space-3);
        justify-content: center;
        flex-wrap: wrap;
      }

      /* --------------------------------------------------------------------------
       COACH ATTRIBUTION & ALERT GATE
       -------------------------------------------------------------------------- */
      .coach-attribution {
        margin-bottom: var(--space-4);
      }

      .attribution-card {
        background: var(--surface-tertiary);
        border-left: var(--space-1) solid var(--ds-primary-green);
      }

      .attribution-content {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      .attribution-content i {
        color: var(--ds-primary-green);
      }

      .attribution-time {
        margin-left: auto;
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-muted);
      }

      .coach-alert-gate {
        margin-bottom: var(--space-4);
      }

      .alert-gate-card {
        background: var(--color-status-warning-light);
        border: var(--border-2) solid var(--color-status-warning);
      }

      .alert-gate-content {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .alert-gate-icon {
        font-size: var(--ds-font-size-2xl);
        color: var(--color-status-warning);
        flex-shrink: 0;
      }

      .alert-gate-text {
        flex: 1;
      }

      .alert-gate-text h3 {
        margin: 0 0 var(--space-1);
        font-size: var(--ds-font-size-xl);
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
      }

      .alert-gate-text p {
        margin: 0;
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      .banners-section {
        margin: 0;
      }

      .acwr-section {
        margin: 0;
      }

      .welcome-stats {
        margin-top: var(--space-2);
        display: flex;
        gap: var(--space-4);
        flex-wrap: wrap;
      }

      .stat-item {
        display: flex;
        align-items: baseline;
        gap: var(--space-2);
        font-size: var(--ds-font-size-sm);
      }

      .stat-item .stat-block__label {
        color: var(--color-text-secondary);
      }

      .stat-item .stat-block__value {
        font-weight: var(--ds-font-weight-semibold);
        color: var(--color-text-primary);
      }

      .stat-item .stat-block__value.logged {
        color: var(--ds-primary-green);
      }

      .stat-check-icon {
        margin-left: var(--space-1);
      }

      /* --------------------------------------------------------------------------
       TOMORROW'S TRAINING PREVIEW
       -------------------------------------------------------------------------- */
      .tomorrow-loading {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .tomorrow-preview {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .tomorrow-rationale {
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
        line-height: var(--ds-line-height-1-6);
        margin: 0;
        padding: var(--space-3);
        background: var(--surface-tertiary);
        border-radius: var(--radius-md);
        border-left: var(--space-1) solid var(--color-brand-primary);
      }

      .tomorrow-blocks {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .tomorrow-block-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        background: var(--surface-secondary);
        border-radius: var(--radius-md);
        border: var(--border-1) solid var(--color-border-secondary);
      }

      .tomorrow-block-item i {
        color: var(--color-brand-primary);
        font-size: var(--ds-font-size-md);
      }

      .tomorrow-block-item span:nth-child(2) {
        flex: 1;
        font-size: var(--ds-font-size-sm);
        font-weight: var(--ds-font-weight-medium);
        color: var(--color-text-primary);
      }

      .tomorrow-block-item .block-count {
        font-size: var(--ds-font-size-xs);
        color: var(--color-text-secondary);
      }

      .tomorrow-actions {
        display: flex;
        justify-content: center;
        padding-top: var(--space-2);
      }

      .tomorrow-empty {
        text-align: center;
        padding: var(--space-4);
      }

      .tomorrow-empty p {
        margin: 0 0 var(--space-3);
        font-size: var(--ds-font-size-sm);
        color: var(--color-text-secondary);
      }

      /* --------------------------------------------------------------------------
       NO EXERCISES MESSAGE - When protocol exists but exercises not loaded
       -------------------------------------------------------------------------- */
      .no-exercises-message {
        text-align: center;
        padding: var(--space-6);
        background: var(--color-surface-secondary);
        border-radius: var(--radius-lg);
        margin: var(--space-4) 0;
      }

      .no-exercises-message p {
        margin: 0 0 var(--space-4);
        font-size: var(--ds-font-size-md);
        color: var(--color-text-secondary);
      }

      /* --------------------------------------------------------------------------
       ACCESSIBILITY - Reduced Motion
       PrimeNG card transitions handled globally in _brand-overrides.scss
       -------------------------------------------------------------------------- */
      @media (prefers-reduced-motion: reduce) {
        .confetti-piece {
          animation: none;
          opacity: 0;
        }

        .celebration-icon {
          animation: none;
        }
      }
    `,
  ],
})
export class TodayComponent {
  // Dependency Injection (Angular 21 pattern)
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly headerService = inject(HeaderService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);
  private readonly dataSourceService = inject(DataSourceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(ApiService);
  private readonly directApi = inject(DirectSupabaseApiService);
  private readonly screenReaderAnnouncer = inject(ScreenReaderAnnouncerService);

  // Angular 21: viewChild signals for DOM element references
  private readonly wellnessSection = viewChild<ElementRef>("wellnessSection");
  private readonly protocolBlocks = viewChild<ElementRef>("protocolBlocks");

  // Environment flag for API routing
  private readonly useDirectSupabase = environment.useDirectSupabase;

  // Guard to prevent duplicate initial loads
  private _initialLoadDone = false;

  // Guard to prevent multiple protocol generation attempts (race condition fix)
  private readonly _generationAttempted = signal(false);

  // Computed userId from auth service - uses signal for reactivity
  // Per audit: use currentUser() signal, not getUser() method
  private readonly userId = computed(() => this.authService.currentUser()?.id);

  // ============================================================================
  // STATE SIGNALS
  // ============================================================================
  readonly protocol = signal<Partial<DailyProtocol> | null>(null);
  readonly protocolJson = signal<ProtocolJson | null>(null); // Raw JSON from API
  readonly todayViewModel = signal<TodayViewModel | null>(null); // Resolved state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private fullProtocolData: any = null; // Store full API response with blocks for UI rendering
  readonly showRecoveryDialog = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentTime = signal(new Date());

  // Quick Check-in State
  readonly showQuickCheckin = signal(false);
  readonly isSavingQuickCheckin = signal(false);
  readonly quickFormData = signal<QuickFormData>({
    overallFeeling: null,
    energyLevel: null,
    hasSoreness: null,
    sleepHours: null,
    sorenessLevel: null,
    stressLevel: null,
    sorenessAreas: [],
  });

  // Celebration State
  readonly showCelebration = signal(false);
  private celebrationShownForSession = false;

  // Protocol Generation State
  readonly isGeneratingProtocol = signal(false);
  readonly isGeneratingTomorrow = signal(false);
  readonly isLoadingTomorrow = signal(false);
  readonly tomorrowProtocol = signal<Partial<DailyProtocol> | null>(null);

  // Quick Check-in Options
  readonly quickMoods: QuickMood[] = [
    { value: 1, emoji: "😫", label: "Rough" },
    { value: 2, emoji: "😐", label: "Okay" },
    { value: 3, emoji: "🙂", label: "Good" },
    { value: 4, emoji: "😊", label: "Great" },
    { value: 5, emoji: "🤩", label: "Amazing" },
  ];

  readonly quickEnergyLevels: QuickEnergyLevel[] = [
    { value: 1, label: "Low" },
    { value: 2, label: "Moderate" },
    { value: 3, label: "Normal" },
    { value: 4, label: "High" },
    { value: 5, label: "Peak" },
  ];

  // ============================================================================
  // DERIVED STATE FROM SERVICES
  // ============================================================================
  readonly userName = this.trainingService.userName;
  readonly acwrValue = this.trainingService.acwrRatio;
  readonly acwrRiskZone = this.trainingService.acwrRiskZone;
  readonly readinessScore = this.trainingService.readinessScore;
  readonly readinessLevel = this.trainingService.readinessLevel;
  readonly aiInsight = this.trainingService.aiInsight;
  readonly isLoading = this.trainingService.isRefreshing;
  readonly hasCheckedInToday = this.trainingService.hasCheckedInToday;
  readonly currentDate = signal(new Date().toISOString().split("T")[0]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  readonly isFirstTimeUser = computed(() =>
    this.dataSourceService.isFirstTimeUser(),
  );

  readonly dayPhase = computed<DayPhase>(() => {
    const hour = this.currentTime().getHours();
    if (hour < 11) return "morning";
    if (hour < 17) return "midday";
    return "evening";
  });

  readonly greetingPrefix = computed(() => {
    const greetings: Record<DayPhase, string> = {
      morning: "Good Morning,",
      midday: "Time to Train,",
      evening: "Good Evening,",
    };
    return greetings[this.dayPhase()];
  });

  readonly dayPhaseMessage = computed(() => {
    if (!this.hasCheckedInToday())
      return "Let's start with your readiness check.";
    if (this.dayPhase() === "evening") return "Time to review and recover.";
    return "Follow your personalized protocol below.";
  });

  readonly activeFocus = computed<ActiveFocus>(() => {
    if (!this.hasCheckedInToday()) return "checkin";
    if (this.dayPhase() === "evening") return "wrapup";
    return "protocol";
  });

  readonly weekDays = computed<WeekDay[]>(() => {
    const schedule = this.trainingService.weeklySchedule();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return dayNames.map((dayName, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const isToday = dateStr === new Date().toISOString().split("T")[0];

      const daySchedule = schedule.find(
        (s) =>
          s.date && new Date(s.date).toISOString().split("T")[0] === dateStr,
      );

      let status: WeekDay["status"] = "empty";
      if (daySchedule) {
        status = daySchedule.sessions.length > 0 ? "planned" : "rest";
      }

      return {
        date: dateStr,
        dayName,
        dayNumber: date.getDate(),
        status,
        isToday,
      };
    });
  });

  readonly weekStats = computed(() => {
    const stats = this.trainingService.trainingStats();
    const streak =
      stats.find((s) => s.label === "Current Streak")?.value || "0";
    const compliance = stats.find((s) => s.label === "This Week")?.value || "0";
    const weeklyLoad = this.trainingService.weeklyProgression().currentWeek;

    return {
      completedDays: parseInt(compliance, 10),
      totalTrainingDays: 7,
      weeklyLoadAu: weeklyLoad,
      targetLoadAu: TRAINING.TARGET_LOAD_AU,
      currentStreak: parseInt(streak, 10),
    };
  });

  // ============================================================================
  // COMPUTED STATUS HELPERS
  // ============================================================================
  readonly acwrStatusLabel = computed(
    () => this.acwrRiskZone()?.label || "Unknown",
  );

  readonly acwrSeverity = computed<TagSeverity>(() => {
    const level = this.acwrRiskZone()?.level;
    const severityMap: Record<string, TagSeverity> = {
      "sweet-spot": "success",
      "under-training": "warning",
      "elevated-risk": "warning",
      "danger-zone": "danger",
      "no-data": "secondary",
    };
    return severityMap[level ?? ""] ?? "secondary";
  });

  readonly acwrClass = computed(() => {
    const level = this.acwrRiskZone()?.level;
    const classMap: Record<string, string> = {
      "sweet-spot": "optimal",
      "under-training": "moderate",
      "elevated-risk": "moderate",
      "danger-zone": "risk",
    };
    return classMap[level ?? ""] ?? "";
  });

  readonly readinessStatusLabel = computed(() => {
    const level = this.readinessLevel();
    if (level === null) return "Unknown";

    const labelMap: Record<string, string> = {
      high: "Great",
      moderate: "Good",
      low: "Low",
    };
    return labelMap[level] ?? "Unknown";
  });

  readonly readinessSeverity = computed<TagSeverity>(() => {
    const level = this.readinessLevel();
    if (level === null) return "secondary";

    const severityMap: Record<string, TagSeverity> = {
      high: "success",
      moderate: "warning",
      low: "danger",
    };
    return severityMap[level] ?? "secondary";
  });

  // Computed signals for template use
  readonly hasAlertBanner = computed(() => {
    const banners = this.todayViewModel()?.banners ?? [];
    return banners.some(
      (b) => b.type === "alert" && b.text.includes("Acknowledgment required"),
    );
  });

  readonly alertBannerText = computed(() => {
    const banners = this.todayViewModel()?.banners ?? [];
    return banners.find((b) => b.type === "alert")?.text ?? "";
  });

  readonly tomorrowDate = computed(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });

  readonly tomorrowDateLabel = computed(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  });

  // ============================================================================
  // COMPUTED - Quick Check-in
  // ============================================================================
  readonly quickReadinessScore = computed(() => {
    const data = this.quickFormData();
    if (
      data.overallFeeling === null ||
      data.energyLevel === null ||
      data.hasSoreness === null
    ) {
      return 0;
    }

    // Use centralized readiness calculation from wellness constants
    return computeQuickReadiness(
      data.overallFeeling,
      data.energyLevel,
      data.hasSoreness,
    );
  });

  readonly isQuickFormValid = computed(() => {
    const data = this.quickFormData();
    return (
      data.overallFeeling !== null &&
      data.energyLevel !== null &&
      data.hasSoreness !== null
    );
  });

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================
  constructor() {
    this.headerService.setDashboardHeader();

    // CRITICAL: Wait for auth to be ready before loading protected data
    // This prevents 401 errors from firing API calls before token exists
    effect(() => {
      const id = this.userId();
      if (!id) return; // Auth not ready yet

      if (this._initialLoadDone) return; // Already loaded
      this._initialLoadDone = true;

      this.logger.info(
        "[TodayComponent] Auth ready, loading data for user:",
        id,
      );
      this.loadTodayData();
      this.loadTomorrowProtocol();
    });

    // Update time every minute
    const interval = setInterval(
      () => this.currentTime.set(new Date()),
      TIMEOUTS.TIME_UPDATE_INTERVAL,
    );
    this.destroyRef.onDestroy(() => clearInterval(interval));

    // Watch for protocol completion to trigger celebration
    effect(() => {
      const p = this.protocol();
      if (
        p?.overallProgress === 100 &&
        !this.celebrationShownForSession &&
        this.hasCheckedInToday()
      ) {
        this.celebrationShownForSession = true;
        this.showCelebration.set(true);
      }
    });
  }

  // ============================================================================
  // DATA LOADING (Contract-Compliant)
  // ============================================================================
  /**
   * Load TODAY data per contract:
   * 1. Call GET /api/daily-protocol?date=today
   * 2. If not found, call POST /api/daily-protocol/generate once, then GET again
   * 3. Resolve state using deterministic resolver
   * 4. Do NOT generate multiple times
   * 5. Do NOT fabricate fallback UI if generation fails
   *
   * When useDirectSupabase is true (local dev without Netlify):
   * - Uses DirectSupabaseApiService to call database directly
   * - No need for Netlify Dev server running
   */
  private loadTodayData(): void {
    const today = new Date().toISOString().split("T")[0];

    // Use direct Supabase API in local development mode
    if (this.useDirectSupabase) {
      this.logger.info(
        "[TodayComponent] Using direct Supabase API for protocol data",
      );
      this.loadTodayDataDirect(today);
      return;
    }

    // Step 1: Try GET first (via Netlify Functions)
    this.api
      .get<{ success: boolean; data?: ProtocolJson }>(
        `/api/daily-protocol?date=${today}`,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            // Store full protocol data for UI rendering (includes blocks with exercises)
            this.fullProtocolData = response.data;

            // Protocol found, resolve state
            // Map API response (camelCase) to resolver format (snake_case)
            const protocolData = this.mapApiProtocolResponse(response.data);
            this.protocolJson.set(protocolData);
            this.resolveAndUpdateViewModel(protocolData);
            this.error.set(null);
            // Reset generation flag on successful load
            this._generationAttempted.set(false);
          } else if (!this._generationAttempted()) {
            // Protocol not found, generate once (using component-level signal)
            this._generationAttempted.set(true);
            this.generateAndLoadProtocol(today);
          } else {
            // Generation already attempted, show error
            this.error.set(
              "Unable to generate your training plan. Please contact support.",
            );
            this.protocolJson.set(null);
            this.fullProtocolData = null;
            this.todayViewModel.set(
              resolveTodayState(null, this.currentTime()),
            );
          }
        },
        error: (err) => {
          this.logger.error("Failed to load today data", err);
          if (!this._generationAttempted()) {
            this._generationAttempted.set(true);
            this.generateAndLoadProtocol(today);
          } else {
            this.error.set(
              "Failed to load your training data. Please try again.",
            );
            this.protocolJson.set(null);
            this.fullProtocolData = null;
            this.todayViewModel.set(
              resolveTodayState(null, this.currentTime()),
            );
          }
        },
      });
  }

  /**
   * Load today data using direct Supabase API (for local development)
   */
  private loadTodayDataDirect(date: string): void {
    this.directApi
      .getDailyProtocol(date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            // Store full protocol data for UI rendering (includes blocks with exercises)
            this.fullProtocolData = response.data;

            // Protocol found, resolve state
            // Map direct API response to ProtocolJson format
            const protocolData = this.mapDirectResponseToProtocolJson(
              response.data,
            );
            this.protocolJson.set(protocolData);
            this.resolveAndUpdateViewModel(protocolData);
            this.error.set(null);
            // Reset generation flag on successful load
            this._generationAttempted.set(false);
          } else if (!this._generationAttempted()) {
            // Protocol not found, generate once (using component-level signal)
            this._generationAttempted.set(true);
            this.generateAndLoadProtocolDirect(date);
          } else {
            this.error.set(
              "Unable to generate your training plan. Please contact support.",
            );
            this.protocolJson.set(null);
            this.fullProtocolData = null;
            this.todayViewModel.set(
              resolveTodayState(null, this.currentTime()),
            );
          }
        },
        error: (err) => {
          this.logger.error("Failed to load today data (direct)", err);
          if (!this._generationAttempted()) {
            this._generationAttempted.set(true);
            this.generateAndLoadProtocolDirect(date);
          } else {
            this.error.set(
              "Failed to load your training data. Please try again.",
            );
            this.protocolJson.set(null);
            this.fullProtocolData = null;
            this.todayViewModel.set(
              resolveTodayState(null, this.currentTime()),
            );
          }
        },
      });
  }

  /**
   * Generate protocol using direct Supabase API
   */
  private generateAndLoadProtocolDirect(date: string): void {
    this.isGeneratingProtocol.set(true);

    this.directApi
      .generateDailyProtocol(date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isGeneratingProtocol.set(false);
          if (response?.success && response.data) {
            // Store full protocol data for UI rendering
            this.fullProtocolData = response.data;

            // Generation succeeded
            const protocolData = this.mapDirectResponseToProtocolJson(
              response.data,
            );
            this.protocolJson.set(protocolData);
            this.resolveAndUpdateViewModel(protocolData);
            this.error.set(null);
          } else {
            this.error.set(
              "Unable to generate your training plan. Please contact support.",
            );
            this.protocolJson.set(null);
            this.fullProtocolData = null;
            this.todayViewModel.set(
              resolveTodayState(null, this.currentTime()),
            );
          }
        },
        error: (err) => {
          this.logger.error("Failed to generate protocol (direct)", err);
          this.isGeneratingProtocol.set(false);
          this.error.set(
            "Failed to generate your training plan. Please contact support.",
          );
          this.protocolJson.set(null);
          this.fullProtocolData = null;
          this.todayViewModel.set(resolveTodayState(null, this.currentTime()));
        },
      });
  }

  /**
   * Map DirectSupabaseApiService response to ProtocolJson format
   * Includes confidence_metadata for proper resolver state detection
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapDirectResponseToProtocolJson(data: any): ProtocolJson {
    return {
      id: data.id,
      protocol_date: data.date,
      readiness_score: data.readinessScore,
      acwr_value: data.acwrValue ?? null,
      confidence_metadata: data.confidenceMetadata,
      blocks:
        data.blocks?.map((block: { type: string; title?: string }) => ({
          type: block.type,
          title: block.title || block.type,
        })) || [],
    };
  }

  /**
   * Map API response (camelCase) to ProtocolJson format (snake_case)
   * Handles field name mismatches between backend and frontend
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapApiProtocolResponse(data: any): ProtocolJson {
    return mapDailyProtocolResponse(data) as ProtocolJson;
  }

  /**
   * Generate protocol and then reload
   */
  private generateAndLoadProtocol(date: string): void {
    this.isGeneratingProtocol.set(true);

    this.api
      .post<{ success: boolean; data?: ProtocolJson }>(
        "/api/daily-protocol/generate",
        { date },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isGeneratingProtocol.set(false);
          if (response?.success) {
            // Generation succeeded, reload via GET
            this.loadTodayData();
          } else {
            // Generation failed, show explicit error
            this.error.set(
              "Unable to generate your training plan. Please contact support.",
            );
            this.protocolJson.set(null);
            this.fullProtocolData = null;
            this.todayViewModel.set(
              resolveTodayState(null, this.currentTime()),
            );
          }
        },
        error: (err) => {
          this.logger.error("Failed to generate protocol", err);
          this.isGeneratingProtocol.set(false);
          this.error.set(
            "Failed to generate your training plan. Please contact support.",
          );
          this.protocolJson.set(null);
          this.fullProtocolData = null;
          this.todayViewModel.set(resolveTodayState(null, this.currentTime()));
        },
      });
  }

  /**
   * Resolve protocol JSON to TodayViewModel and update signals
   */
  private resolveAndUpdateViewModel(protocolJson: ProtocolJson): void {
    const viewModel = resolveTodayState(protocolJson, this.currentTime());
    this.todayViewModel.set(viewModel);

    // Also update protocol signal for backward compatibility
    // We need to keep the full blocks data for UI rendering
    if (this.fullProtocolData) {
      this.protocol.set(this.mapToDailyProtocol(this.fullProtocolData));
    } else if (protocolJson.blocks) {
      // Fallback: create minimal structure
      this.protocol.set({
        id: protocolJson.id,
        protocolDate: protocolJson.protocol_date,
        readinessScore: protocolJson.readiness_score ?? undefined,
        acwrValue: protocolJson.acwr_value ?? undefined,
      } as Partial<DailyProtocol>);
    }
  }

  /**
   * Map API response to DailyProtocol structure with full block data
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToDailyProtocol(data: any): Partial<DailyProtocol> {
    // Create empty block helper
    const createEmptyBlock = (
      type: string,
      title: string,
      icon: string,
    ): ProtocolBlock => ({
      type: type as BlockType,
      title,
      icon,
      status: "pending" as const,
      exercises: [],
      completedCount: 0,
      totalCount: 0,
      progressPercent: 0,
    });

    // Map API response block properties to ProtocolBlock format
    // The API returns blocks as named properties (morningMobility, foamRoll, etc.)
    // Each contains { type, title, icon, status, exercises[], completedCount, totalCount, ... }
    const getBlock = (
      blockKey: string, // camelCase key in API response
      blockType: string, // snake_case block type
      title: string,
      icon: string,
    ): ProtocolBlock => {
      // Get the block directly from the API response by its property name
      const apiBlock = data[blockKey];

      if (!apiBlock || !apiBlock.exercises || apiBlock.exercises.length === 0) {
        return createEmptyBlock(blockType, title, icon);
      }

      // Map exercises to PrescribedExercise format
      // API returns exercises in the format from transformExercise()
      type ApiExercise = {
        id?: string;
        exerciseId?: string;
        exercise?: {
          id?: string;
          name?: string;
          slug?: string;
          category?: ExerciseCategory;
          videoUrl?: string;
          videoId?: string;
          howText?: string;
          defaultSets?: number;
          difficultyLevel?: "beginner" | "intermediate" | "advanced";
          loadContributionAu?: number;
          isHighIntensity?: boolean;
        };
        name?: string;
        slug?: string;
        category?: ExerciseCategory;
        videoUrl?: string;
        videoId?: string;
        howText?: string;
        aiNote?: string;
        prescribedSets?: number;
        prescribedReps?: number;
        prescribedHoldSeconds?: number;
        prescribedDurationSeconds?: number;
        sequenceOrder?: number;
        status?: string;
        loadContributionAu?: number;
        isHighIntensity?: boolean;
      };
      const exercises: PrescribedExercise[] = apiBlock.exercises.map(
        (ex: ApiExercise, index: number) => ({
          id: ex.id || `${blockType}-${index}`,
          exerciseId: ex.exerciseId || ex.id || `${blockType}-${index}`,
          // Nested exercise object with video data for UI rendering
          exercise: ex.exercise || {
            id: ex.id || `${blockType}-${index}`,
            name: ex.name || "Exercise",
            slug:
              ex.slug ||
              ex.name?.toLowerCase().replace(/\s+/g, "-") ||
              "exercise",
            category: (ex.category || blockType) as ExerciseCategory,
            videoUrl: ex.videoUrl,
            videoId: ex.videoId,
            howText: ex.howText || ex.aiNote || "",
            defaultSets: ex.prescribedSets || 1,
            difficultyLevel: "intermediate" as const,
            loadContributionAu: ex.loadContributionAu || 0,
            isHighIntensity: ex.isHighIntensity || false,
          },
          blockType: blockType as BlockType,
          sequenceOrder: ex.sequenceOrder || index + 1,
          prescribedSets: ex.prescribedSets || 1,
          prescribedReps: ex.prescribedReps,
          prescribedHoldSeconds: ex.prescribedHoldSeconds,
          prescribedDurationSeconds: ex.prescribedDurationSeconds,
          aiNote: ex.aiNote,
          status:
            ex.status === "complete"
              ? ("complete" as const)
              : ("pending" as const),
          loadContributionAu: ex.loadContributionAu || 0,
        }),
      );

      const completedCount = exercises.filter(
        (e) => e.status === "complete",
      ).length;
      const totalCount = exercises.length;

      return {
        type: blockType as BlockType,
        title: apiBlock.title || title,
        icon: apiBlock.icon || icon,
        status:
          completedCount === totalCount && totalCount > 0
            ? ("complete" as const)
            : completedCount > 0
              ? ("in_progress" as const)
              : ("pending" as const),
        exercises,
        completedCount,
        totalCount,
        progressPercent:
          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        estimatedDurationMinutes: apiBlock.estimatedDurationMinutes,
      };
    };

    // Map blocks using camelCase API keys to snake_case block types
    const morningMobility = getBlock(
      "morningMobility", // API key (camelCase)
      "morning_mobility", // block type (snake_case)
      "Morning Mobility",
      "pi-sun",
    );
    const foamRoll = getBlock(
      "foamRoll",
      "foam_roll",
      "Foam Rolling",
      "pi-circle",
    );
    const warmUp = getBlock("warmUp", "warm_up", "Warm-Up (25 min)", "pi-bolt");

    // Evidence-based training blocks (1.5h gym structure)
    const isometrics = getBlock(
      "isometrics",
      "isometrics",
      "Isometrics (15 min)",
      "pi-pause-circle",
    );
    const plyometrics = getBlock(
      "plyometrics",
      "plyometrics",
      "Plyometrics (15 min)",
      "pi-arrow-up",
    );
    const strength = getBlock(
      "strength",
      "strength",
      "Strength (15 min)",
      "pi-heart",
    );
    const conditioning = getBlock(
      "conditioning",
      "conditioning",
      "Conditioning (15 min)",
      "pi-directions-run",
    );
    const skillDrills = getBlock(
      "skillDrills",
      "skill_drills",
      "Skill Drills (15 min)",
      "pi-bolt",
    );

    const mainSession = getBlock(
      "mainSession",
      "main_session",
      "Main Session",
      "pi-play",
    );
    const coolDown = getBlock(
      "coolDown",
      "cool_down",
      "Cool-Down (15 min)",
      "pi-stop",
    );
    const eveningRecovery = getBlock(
      "eveningRecovery",
      "evening_recovery",
      "Evening Recovery",
      "pi-moon",
    );

    const allBlocks = [
      morningMobility,
      foamRoll,
      warmUp,
      isometrics,
      plyometrics,
      strength,
      conditioning,
      skillDrills,
      mainSession,
      coolDown,
      eveningRecovery,
    ];
    const totalExercises = allBlocks.reduce((sum, b) => sum + b.totalCount, 0);
    const completedExercises = allBlocks.reduce(
      (sum, b) => sum + b.completedCount,
      0,
    );

    return {
      id: data.id,
      protocolDate: data.date,
      readinessScore: data.readinessScore ?? undefined,
      acwrValue: data.acwrValue ?? undefined,
      trainingFocus: data.trainingFocus,
      morningMobility,
      foamRoll,
      warmUp,
      isometrics,
      plyometrics,
      strength,
      conditioning,
      skillDrills,
      mainSession,
      coolDown,
      eveningRecovery,
      overallProgress:
        totalExercises > 0
          ? Math.round((completedExercises / totalExercises) * 100)
          : 0,
      completedExercises,
      totalExercises,
    };
  }

  refreshProtocol(): void {
    this.loadTodayData();
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  onWellnessComplete(result: { readinessScore: number }): void {
    this.messageService.add({
      severity: "success",
      summary: "Wellness Logged",
      detail: `Readiness: ${result.readinessScore}%. Let's optimize your session.`,
    });
    // Refresh protocol data after check-in
    this.refreshProtocol();
  }

  openRecoveryDialog(): void {
    this.showRecoveryDialog.set(true);
  }

  closeRecoveryDialog(): void {
    this.showRecoveryDialog.set(false);
  }

  onRecoverySaved(): void {
    this.showRecoveryDialog.set(false);
    this.loadTodayData();
  }

  scrollToWellness(): void {
    const section = this.wellnessSection();
    section?.nativeElement?.scrollIntoView({ behavior: "smooth" });
  }

  // ============================================================================
  // QUICK CHECK-IN METHODS
  // ============================================================================
  openQuickCheckin(): void {
    this.quickFormData.set({
      overallFeeling: null,
      energyLevel: null,
      hasSoreness: null,
      sleepHours: null,
      sorenessLevel: null,
      stressLevel: null,
      sorenessAreas: [],
    });
    this.showQuickCheckin.set(true);
  }

  setQuickField<K extends keyof QuickFormData>(
    field: K,
    value: QuickFormData[K],
  ): void {
    this.quickFormData.set({
      ...this.quickFormData(),
      [field]: value,
    });
  }

  getQuickReadinessClass(): string {
    const score = this.quickReadinessScore();
    if (score >= WELLNESS.READINESS_THRESHOLD_HIGH) return "high";
    if (score >= WELLNESS.READINESS_MODERATE) return "moderate";
    return "low";
  }

  submitQuickCheckin(): void {
    if (!this.isQuickFormValid()) {
      this.logger.warn("Quick checkin form is invalid");
      return;
    }

    this.logger.info("Starting quick checkin submission...");
    this.isSavingQuickCheckin.set(true);

    const data = this.quickFormData();
    const targetDate = new Date().toISOString().split("T")[0];
    const readiness = this.quickReadinessScore();

    this.logger.info("Quick checkin data:", {
      data,
      targetDate,
      readiness,
    });

    // Map quick form to full wellness data
    // IMPORTANT: Do NOT use hardcoded defaults for wellness metrics
    // Missing data should be null to ensure accurate calculations and
    // proper data quality indicators in ACWR/readiness scoring
    const wellnessData = {
      date: targetDate,
      sleepQuality: data.overallFeeling ?? null, // No default - require explicit input
      sleepHours: data.sleepHours ?? null, // No hardcoded default - affects calculations
      energyLevel: data.energyLevel ?? null, // No default - require explicit input
      muscleSoreness:
        data.hasSoreness !== undefined
          ? data.hasSoreness
            ? (data.sorenessLevel ?? null)
            : null
          : null,
      stressLevel: data.stressLevel ?? null, // No default - require explicit input
      sorenessAreas: data.sorenessAreas ?? [],
      readinessScore: readiness, // Calculated from actual inputs, not defaults
    };

    // Use direct Supabase submission when in direct mode to ensure data is saved
    // to the same database that protocol loading uses
    const submission$ = this.useDirectSupabase
      ? this.directApi.submitWellnessCheckin(wellnessData)
      : from(this.trainingService.submitWellness(wellnessData));

    submission$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: unknown) => {
        this.logger.info("Quick checkin response:", response);
        const typedResponse = response as { success?: boolean };

        if (typedResponse?.success) {
          this.showQuickCheckin.set(false);
          this.messageService.add({
            severity: "success",
            summary: "Quick Check-in Complete",
            detail: `Readiness: ${readiness}%. Ready to train!`,
          });
          // Announce to screen readers
          this.screenReaderAnnouncer.announceSuccess(
            `Quick check-in saved. Your readiness is ${readiness} percent.`,
          );
          this.refreshProtocol();
        } else {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to save check-in. Please try again.",
          });
          // Announce error to screen readers
          this.screenReaderAnnouncer.announceAssertive(
            "Error: Failed to save check-in. Please try again.",
          );
        }
        this.isSavingQuickCheckin.set(false);
      },
      error: (err: unknown) => {
        this.logger.error("Failed to save quick checkin", err);
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to save check-in. Please try again.",
        });
        this.isSavingQuickCheckin.set(false);
      },
    });
  }

  // ============================================================================
  // CELEBRATION METHODS
  // ============================================================================
  dismissCelebration(): void {
    this.showCelebration.set(false);
  }

  // ============================================================================
  // PROTOCOL GENERATION
  // ============================================================================
  generateProtocol(): void {
    this.isGeneratingProtocol.set(true);
    // Announce loading state to screen readers
    this.screenReaderAnnouncer.announceLoading("training protocol");
    this.handleProtocolRequest(
      this.trainingService.generateDailyProtocol(),
      this.protocol,
      this.isGeneratingProtocol,
      {
        success: "Protocol Generated",
        detail: "Your personalized training plan is ready!",
      },
    );
  }

  generateTomorrowProtocol(): void {
    this.isGeneratingTomorrow.set(true);
    this.handleProtocolRequest(
      this.trainingService.generateDailyProtocol(this.tomorrowDate()),
      this.tomorrowProtocol,
      this.isGeneratingTomorrow,
      {
        success: "Tomorrow's Protocol Ready",
        detail: "Your training plan for tomorrow has been generated!",
      },
    );
  }

  loadTomorrowProtocol(): void {
    this.isLoadingTomorrow.set(true);
    this.handleProtocolRequest(
      this.trainingService.getProtocolForDate(this.tomorrowDate()),
      this.tomorrowProtocol,
      this.isLoadingTomorrow,
    );
  }

  private handleProtocolRequest(
    request: ReturnType<typeof this.trainingService.generateDailyProtocol>,
    targetSignal: typeof this.protocol,
    loadingSignal: typeof this.isGeneratingProtocol,
    toast?: { success: string; detail: string },
  ): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (response: any) => {
        if (response?.success && response.data) {
          targetSignal.set(response.data as Partial<DailyProtocol>);
          if (toast) {
            this.messageService.add({
              severity: "success",
              summary: toast.success,
              detail: toast.detail,
            });
            // Announce success to screen readers
            this.screenReaderAnnouncer.announceSuccess(toast.detail);
          }
        }
        loadingSignal.set(false);
      },
      error: (err) => {
        if (toast) {
          this.logger.error("Protocol request failed", err);
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Request failed. Please try again.",
          });
          // Announce error to screen readers
          this.screenReaderAnnouncer.announceAssertive(
            "Error: Request failed. Please try again.",
          );
        }
        loadingSignal.set(false);
      },
    });
  }

  viewTomorrowProtocol(): void {
    // Navigate to training schedule with tomorrow's date highlighted
    this.router.navigate(["/training"], {
      queryParams: { date: this.tomorrowDate() },
    });
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================
  navigateToAcwr(): void {
    this.router.navigate(["/acwr"]);
  }

  navigateToWellness(): void {
    this.router.navigate(["/wellness"]);
  }

  // ============================================================================
  // CTA HANDLERS (Contract-Compliant)
  // ============================================================================
  /**
   * Handle CTA actions from TodayViewModel banners and CTAs
   * Maps action IDs to component methods
   */
  handleCta(actionId: string): void {
    switch (actionId) {
      case "open_checkin":
      case "start_checkin":
      case "update_checkin":
        // Open the Quick Check-in dialog (not scroll to wellness section)
        this.showQuickCheckin.set(true);
        break;

      case "start_training":
      case "start_training_anyway":
      case "continue_anyway":
        // Scroll to first block or start first block
        this.scrollToFirstBlock();
        break;

      case "view_practice_details":
        // TODO: Navigate to practice details or show modal
        this.messageService.add({
          severity: "info",
          summary: "Practice Details",
          detail: "Practice details view coming soon",
        });
        break;

      case "view_film_room_details":
        // TODO: Navigate to film room details
        this.messageService.add({
          severity: "info",
          summary: "Film Room",
          detail: "Film room details view coming soon",
        });
        break;

      case "view_rehab":
      case "view_rehab_details":
        // TODO: Navigate to rehab details
        this.messageService.add({
          severity: "info",
          summary: "Rehab Protocol",
          detail: "Rehab details view coming soon",
        });
        break;

      case "contact_coach":
        // TODO: Open coach contact/messaging
        this.messageService.add({
          severity: "info",
          summary: "Contact Coach",
          detail: "Coach messaging coming soon",
        });
        break;

      case "contact_physio":
        // TODO: Open physio contact
        this.messageService.add({
          severity: "info",
          summary: "Contact Physio",
          detail: "Physio contact coming soon",
        });
        break;

      case "view_taper":
      case "view_taper_plan":
        // TODO: Navigate to taper plan
        this.messageService.add({
          severity: "info",
          summary: "Taper Plan",
          detail: "Taper plan view coming soon",
        });
        break;

      case "log_session":
        this.router.navigate(["/training/log"], {
          queryParams: { date: this.todayDate() },
        });
        break;
      case "log_workout":
        this.router.navigate(["/training/log"], {
          queryParams: { date: this.todayDate() },
        });
        break;

      case "read_coach_alert":
        // Show coach alert modal/dialog
        this.showCoachAlertDialog();
        break;

      case "acknowledge_coach_alert":
        this.acknowledgeCoachAlert();
        break;

      case "view_coach_note":
        // Show coach note modal
        this.showCoachNoteDialog();
        break;

      default:
        this.logger.warn(`Unknown CTA action: ${actionId}`);
        this.messageService.add({
          severity: "warning",
          summary: "Action Not Available",
          detail: "This action is not yet implemented",
        });
    }
  }

  private scrollToFirstBlock(): void {
    const blocksContainer = this.protocolBlocks();
    if (blocksContainer?.nativeElement) {
      // Query within the component's scoped element for the first block
      const firstBlock =
        blocksContainer.nativeElement.querySelector("[data-block-type]");
      if (firstBlock) {
        firstBlock.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  private todayDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  private showCoachAlertDialog(): void {
    const vm = this.todayViewModel();
    const protocol = this.protocolJson();

    if (!vm || !protocol) {
      return;
    }

    // Show coach alert message in a dialog or toast
    const alertMessage =
      protocol.coach_alert_message || "Coach has updated your plan.";
    const coachName = protocol.modified_by_coach_name || "Your coach";

    this.messageService.add({
      severity: "info",
      summary: `Coach Alert from ${coachName}`,
      detail: alertMessage,
      life: 10000, // Show for 10 seconds
    });

    // If there's a coach note, show that too
    if (protocol.coach_note?.content) {
      const noteContent = protocol.coach_note.content;
      setTimeout(() => {
        this.messageService.add({
          severity: "info",
          summary: `Coach Note from ${coachName}`,
          detail: noteContent,
          life: 10000,
        });
      }, 500);
    }
  }

  private acknowledgeCoachAlert(): void {
    const vm = this.todayViewModel();
    const protocol = this.protocolJson();

    if (!vm || !protocol || !protocol.id) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Unable to acknowledge alert. Please refresh the page.",
      });
      return;
    }

    const alertId = protocol.id;
    const sessionDate =
      protocol.protocol_date || new Date().toISOString().split("T")[0];

    // Call backend endpoint to acknowledge coach alert
    this.api
      .post<{
        success: boolean;
        data?: unknown;
        error?: string;
        code?: string;
      }>(`/api/coach-alerts/${alertId}/acknowledge`, { sessionDate })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response?.success) {
            this.messageService.add({
              severity: "success",
              summary: "Alert Acknowledged",
              detail: "You can now proceed with training",
            });
            // Refresh protocol to update state
            this.loadTodayData();
          } else {
            this.messageService.add({
              severity: "error",
              summary: "Error",
              detail: response?.error || "Failed to acknowledge alert",
            });
          }
        },
        error: (err) => {
          this.logger.error("Failed to acknowledge coach alert", err);
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to acknowledge alert. Please try again.",
          });
        },
      });
  }

  private showCoachNoteDialog(): void {
    // TODO: Show coach note in dialog
    this.messageService.add({
      severity: "info",
      summary: "Coach Note",
      detail: "Coach note view coming soon",
    });
  }

  // ============================================================================
  // COMPUTED HELPERS FOR TEMPLATE
  // ============================================================================
  readonly todayDateLabel = computed(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  });

  readonly readinessDisplay = computed(() => {
    const vm = this.todayViewModel();
    const protocol = this.protocolJson();

    if (!vm || !protocol) {
      return { value: "—", logged: false };
    }

    const score = protocol.readiness_score;
    if (score === null || score === undefined) {
      return { value: "—", logged: false };
    }

    // Check if logged today (from confidence metadata)
    const logged = protocol.confidence_metadata?.readiness?.daysStale === 0;

    return {
      value: `${score}`,
      logged,
    };
  });

  // ============================================================================
  // TEMPLATE HELPERS
  // ============================================================================
  /**
   * Get block by type from DailyProtocol
   * Returns null if block doesn't exist or has no exercises
   */
  getBlockByType(
    protocol: Partial<DailyProtocol>,
    blockType: string,
  ): ProtocolBlock | null {
    if (!protocol) return null;

    // Map database block types to DailyProtocol property names
    // Evidence-based 1.5h training structure with new blocks
    const blockMap: Record<string, keyof DailyProtocol> = {
      morning_mobility: "morningMobility",
      foam_roll: "foamRoll",
      warm_up: "warmUp",
      isometrics: "isometrics",
      plyometrics: "plyometrics",
      strength: "strength",
      conditioning: "conditioning",
      skill_drills: "skillDrills",
      main_session: "mainSession",
      cool_down: "coolDown",
      recovery: "eveningRecovery",
      evening_recovery: "eveningRecovery",
    };

    const prop = blockMap[blockType];
    if (!prop) return null;

    const block = protocol[prop] as ProtocolBlock | undefined;

    // Return null if block doesn't exist or has no exercises
    // Main Session should always have exercises (except recovery days)
    // This prevents rendering empty block cards
    if (!block || !block.exercises || block.exercises.length === 0) {
      return null;
    }

    return block;
  }

  /**
   * Format coach modification timestamp
   */
  formatCoachTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 24) {
        const hours = Math.floor(diffHours);
        if (hours === 0) {
          const minutes = Math.floor(diffMs / (1000 * 60));
          return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
        }
        return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
      }

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  }
}
