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

import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

// Layout & Components
import { MainLayoutComponent } from '../../shared/components/layout/main-layout.component';
import { PostTrainingRecoveryComponent } from '../../shared/components/post-training-recovery/post-training-recovery.component';
import { TodaysScheduleComponent } from '../../shared/components/todays-schedule/todays-schedule.component';
import { ProtocolBlockComponent } from '../training/daily-protocol/components/protocol-block.component';
import {
    WeekDay,
    WeekProgressStripComponent,
} from '../training/daily-protocol/components/week-progress-strip.component';
import { WellnessCheckinComponent } from '../training/daily-protocol/components/wellness-checkin.component';
import { DailyProtocol } from '../training/daily-protocol/daily-protocol.models';

// Services
import { DataSourceService } from '../../core/services/data-source.service';
import { HeaderService } from '../../core/services/header.service';
import { LoggerService } from '../../core/services/logger.service';
import { UnifiedTrainingService } from '../../core/services/unified-training.service';

// Types
type DayPhase = 'morning' | 'midday' | 'evening';
type ActiveFocus = 'checkin' | 'protocol' | 'wrapup';
type TagSeverity = 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast';

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
}

@Component({
  selector: 'app-today',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    CardModule,
    DialogModule,
    MessageModule,
    ProgressBarModule,
    SkeletonModule,
    TagModule,
    ToastModule,
    TooltipModule,
    MainLayoutComponent,
    WellnessCheckinComponent,
    ProtocolBlockComponent,
    PostTrainingRecoveryComponent,
    WeekProgressStripComponent,
    ButtonComponent,
    TodaysScheduleComponent,
  ],
  providers: [MessageService],
  animations: [
    trigger('fadeSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-12px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('celebrationFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
    trigger('celebrationBounce', [
      transition(':enter', [
        animate('600ms cubic-bezier(0.34, 1.56, 0.64, 1)', keyframes([
          style({ opacity: 0, transform: 'scale(0.3) translateY(50px)', offset: 0 }),
          style({ opacity: 1, transform: 'scale(1.1) translateY(-10px)', offset: 0.6 }),
          style({ opacity: 1, transform: 'scale(1) translateY(0)', offset: 1 }),
        ])),
      ]),
    ]),
  ],
  templateUrl: './today.component.html',
  styles: [`
    /* ==========================================================================
       TODAY'S PRACTICE - Design System Compliant Styles
       Uses tokens from: assets/styles/design-system-tokens.scss
       ========================================================================== */

    /* --------------------------------------------------------------------------
       LAYOUT CONTAINER
       -------------------------------------------------------------------------- */
    .today-page {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      padding: var(--space-5) var(--space-4);
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    /* --------------------------------------------------------------------------
       ONBOARDING BANNER (First-time users)
       -------------------------------------------------------------------------- */
    .onboarding-banner {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    :host ::ng-deep .onboarding-card {
      background: var(--color-brand-primary) !important;
      border: none;
      border-radius: var(--radius-lg);
    }

    :host ::ng-deep .onboarding-card .p-card-body {
      padding: var(--space-5);
    }

    :host ::ng-deep .onboarding-card .p-card-content {
      padding: 0;
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
      width: 3rem;
      height: 3rem;
      min-width: 3rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-heading-sm);
    }

    .onboarding-text h2 {
      margin: 0;
      font-size: var(--font-heading-sm);
      font-weight: var(--font-weight-semibold);
    }

    .onboarding-text p {
      margin: var(--space-1) 0 0;
      font-size: var(--font-body-sm);
      opacity: 0.9;
    }

    /* --------------------------------------------------------------------------
       WELCOME CARD
       -------------------------------------------------------------------------- */
    :host ::ng-deep .welcome-card {
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border-secondary);
    }

    :host ::ng-deep .welcome-card .p-card-body {
      padding: var(--space-4);
    }

    :host ::ng-deep .welcome-card .p-card-content {
      padding: 0;
    }

    .welcome-row {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .user-avatar {
      width: 3rem;
      height: 3rem;
      min-width: 3rem;
      background: var(--surface-tertiary);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
      font-size: var(--font-heading-sm);
      border: 2px solid var(--color-border-secondary);
    }

    .welcome-text {
      flex: 1;
      min-width: 0;
    }

    .welcome-greeting {
      font-size: var(--font-size-h1); /* H1: Page greeting - 28px */
      font-weight: var(--font-weight-semibold); /* H1: Semibold (600) - reduced from 700 */
      margin: 0;
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
    }

    .welcome-name {
      font-size: var(--font-heading-lg);
      font-weight: var(--font-weight-bold);
      margin: var(--space-1) 0 0;
      color: var(--color-text-primary);
      line-height: 1.2;
    }

    .welcome-hint {
      font-size: var(--font-body-sm);
      color: var(--color-text-secondary);
      margin: var(--space-1) 0 0;
    }

    /* --------------------------------------------------------------------------
       STATS GRID
       -------------------------------------------------------------------------- */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
    }

    :host ::ng-deep .stat-card {
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border-secondary);
      cursor: pointer;
      transition: transform var(--hover-transition-fast), box-shadow var(--hover-transition-fast);
    }

    :host ::ng-deep .stat-card:hover {
      transform: var(--transform-hover-lift-subtle);
      box-shadow: var(--hover-shadow-sm);
    }

    :host ::ng-deep .stat-card .p-card-body {
      padding: var(--space-3);
    }

    :host ::ng-deep .stat-card .p-card-content {
      padding: 0;
    }

    .stat-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .stat-icon {
      width: 2.5rem;
      height: 2.5rem;
      min-width: 2.5rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--icon-md); /* 16px - standard icon */
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

    .stat-value {
      font-size: var(--font-size-metric-md); /* Metric: KPI numbers - 24px */
      font-weight: var(--font-weight-bold); /* Metric: Bold (700) */
      line-height: var(--line-height-tight); /* Metric: 1.2 */
      color: var(--color-text-primary);
    }

    .stat-status-label {
      font-size: var(--font-body-xs);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
    }

    .stat-chevron {
      color: var(--color-text-muted);
      opacity: 0.6;
      font-size: var(--icon-sm); /* 14px - small icon */
    }

    .stat-value.optimal,
    .stat-value.high { color: var(--color-brand-primary); }
    .stat-value.moderate { color: var(--color-status-warning); }
    .stat-value.risk,
    .stat-value.low { color: var(--color-status-error); }

    .stat-label {
      font-size: var(--font-size-caption); /* Caption: Helper text - 13px */
      font-weight: var(--font-weight-regular); /* Caption: Regular (400) */
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-caption); /* 0.04em for labels like READINESS, ACWR */
    }

    /* --------------------------------------------------------------------------
       WEEK PROGRESS CARD
       -------------------------------------------------------------------------- */
    :host ::ng-deep .week-card {
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border-secondary);
    }

    :host ::ng-deep .week-card .p-card-body {
      padding: var(--space-3) var(--space-4);
    }

    :host ::ng-deep .week-card .p-card-content {
      padding: 0;
    }

    /* --------------------------------------------------------------------------
       CONTENT CARDS (Check-in, Protocol, Wrap-up)
       -------------------------------------------------------------------------- */
    .content-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    :host ::ng-deep .content-card {
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border-secondary);
    }

    :host ::ng-deep .highlight-card {
      border-left: 4px solid var(--color-brand-primary);
      border-left-width: 4px;
    }

    :host ::ng-deep .content-card .p-card-body {
      padding: var(--space-4);
    }

    :host ::ng-deep .content-card .p-card-content {
      padding: 0;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding-bottom: var(--space-3);
      margin-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-border-secondary);
    }

    .card-header-icon {
      font-size: var(--icon-md); /* 16px - standard icon */
      color: var(--color-brand-primary);
    }

    .card-header-title {
      flex: 1;
      font-size: var(--font-size-h2); /* H2: Card titles - 18px */
      font-weight: var(--font-weight-semibold); /* H2: Semibold (600) */
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
      margin-bottom: var(--space-3); /* 12px consistent margin */
    }

    .card-description {
      font-size: var(--font-body-sm);
      color: var(--color-text-secondary);
      margin: 0 0 var(--space-4);
      line-height: 1.5;
    }

    /* --------------------------------------------------------------------------
       MERLIN INSIGHT CARD
       -------------------------------------------------------------------------- */
    :host ::ng-deep .insight-card {
      background: var(--color-brand-primary) !important;
      border: none;
      border-radius: var(--radius-lg);
    }

    :host ::ng-deep .insight-card .p-card-body {
      padding: var(--space-4);
    }

    :host ::ng-deep .insight-card .p-card-content {
      padding: 0;
    }

    :host ::ng-deep .insight-card .p-button-outlined {
      color: var(--color-text-on-primary);
      border-color: rgba(255, 255, 255, 0.5);
    }

    :host ::ng-deep .insight-card .p-button-outlined:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: white;
    }

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
      font-size: var(--font-heading-xs);
    }

    .insight-text {
      flex: 1;
    }

    .insight-title {
      margin: 0 0 var(--space-2);
      font-size: var(--font-body-md);
      font-weight: var(--font-weight-semibold);
    }

    .insight-message {
      margin: 0 0 var(--space-3);
      font-size: var(--font-body-sm);
      line-height: 1.6;
      opacity: 0.95;
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

    :host ::ng-deep .protocol-bar {
      height: 6px;
    }

    :host ::ng-deep .protocol-bar .p-progressbar-value {
      background: var(--color-brand-primary);
    }

    .protocol-meta {
      display: flex;
      justify-content: space-between;
      margin-top: var(--space-2);
      font-size: var(--font-body-xs);
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
      border-top: 1px solid var(--color-border-secondary);
      text-align: center;
    }

    /* --------------------------------------------------------------------------
       WRAP-UP ACTION CARDS
       -------------------------------------------------------------------------- */
    .action-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    :host ::ng-deep .action-card {
      cursor: pointer;
      border: 1px solid var(--color-border-secondary);
      border-radius: var(--radius-lg);
      box-shadow: none;
      transition: border-color var(--hover-transition-fast), background var(--hover-transition-fast);
    }

    :host ::ng-deep .action-card:hover {
      border-color: var(--color-brand-primary);
      background: var(--hover-bg-secondary);
    }

    :host ::ng-deep .action-card .p-card-body {
      padding: var(--space-3);
    }

    :host ::ng-deep .action-card .p-card-content {
      padding: 0;
    }

    .action-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .action-icon {
      width: 2.5rem;
      height: 2.5rem;
      min-width: 2.5rem;
      background: var(--ds-primary-green-ultra-subtle);
      color: var(--color-brand-primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--icon-md); /* 16px - standard icon */
    }

    .action-text {
      flex: 1;
    }

    .action-text h4 {
      margin: 0;
      font-size: var(--font-body-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .action-text p {
      margin: var(--space-1) 0 0;
      font-size: var(--font-body-xs);
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
      border: 2px dashed var(--color-border-secondary);
      border-radius: var(--radius-lg);
    }

    .empty-state i {
      font-size: var(--icon-3xl); /* 48px - hero/empty state icon */
      color: var(--color-text-muted);
      opacity: 0.5;
      margin-bottom: var(--space-3);
    }

    .empty-state h3 {
      margin: 0 0 var(--space-2);
      font-size: var(--font-body-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }

    .empty-state p {
      margin: 0 0 var(--space-4);
      font-size: var(--font-body-sm);
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
      font-size: var(--font-body-sm);
      margin: 0;
    }

    .quick-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .quick-label {
      font-size: var(--font-body-sm);
      font-weight: var(--font-weight-semibold);
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
      border: 2px solid var(--color-border-secondary);
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
      font-size: 1.5rem;
    }

    .mood-text {
      font-size: var(--font-body-xs);
      color: var(--color-text-secondary);
    }

    .mood-btn.selected .mood-text {
      color: var(--color-brand-primary);
      font-weight: var(--font-weight-medium);
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
      border: 2px solid var(--color-border-secondary);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--hover-transition-fast);
      font-size: var(--font-body-xs);
      color: var(--color-text-secondary);
    }

    .energy-btn i {
      font-size: var(--icon-md);
      color: var(--color-status-warning);
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
      border: 2px solid var(--color-border-secondary);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--hover-transition-fast);
      font-size: var(--font-body-sm);
      color: var(--color-text-secondary);
    }

    .soreness-btn i {
      font-size: var(--icon-md);
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
      font-size: var(--font-body-sm);
      color: var(--color-text-secondary);
    }

    .quick-preview .preview-score {
      font-size: var(--font-heading-md);
      font-weight: var(--font-weight-bold);
    }

    .quick-preview .preview-score.high { color: var(--color-brand-primary); }
    .quick-preview .preview-score.moderate { color: var(--color-status-warning); }
    .quick-preview .preview-score.low { color: var(--color-status-error); }

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
      width: 10px;
      height: 10px;
      background: var(--color-brand-primary);
      border-radius: 50%;
      animation: confetti-fall 2s ease-out forwards;
      animation-delay: var(--delay);
      transform: translateX(var(--x));
      opacity: 0;
    }

    .confetti-piece:nth-child(2n) {
      background: var(--color-status-warning);
      width: 8px;
      height: 8px;
    }

    .confetti-piece:nth-child(3n) {
      background: var(--color-status-info);
      width: 12px;
      height: 12px;
    }

    .confetti-piece:nth-child(4n) {
      background: var(--color-status-error);
      border-radius: 0;
      transform: translateX(var(--x)) rotate(45deg);
    }

    @keyframes confetti-fall {
      0% {
        opacity: 1;
        transform: translateX(var(--x)) translateY(-20px) rotate(0deg);
      }
      100% {
        opacity: 0;
        transform: translateX(calc(var(--x) * 1.5)) translateY(150px) rotate(720deg);
      }
    }

    .celebration-icon {
      font-size: 4rem;
      margin-bottom: var(--space-3);
      animation: icon-bounce 0.6s ease-out;
    }

    @keyframes icon-bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    .celebration-title {
      margin: 0 0 var(--space-2);
      font-size: var(--font-heading-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .celebration-message {
      margin: 0 0 var(--space-5);
      font-size: var(--font-body-md);
      color: var(--color-text-secondary);
      line-height: 1.5;
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
      font-size: var(--font-heading-md);
      font-weight: var(--font-weight-bold);
      color: var(--color-brand-primary);
    }

    .celebration-stats .stat-label {
      font-size: var(--font-body-xs);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
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
      font-size: var(--font-body-sm);
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin: 0;
      padding: var(--space-3);
      background: var(--surface-tertiary);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--color-brand-primary);
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
      border: 1px solid var(--color-border-secondary);
    }

    .tomorrow-block-item i {
      color: var(--color-brand-primary);
      font-size: var(--icon-md);
    }

    .tomorrow-block-item span:nth-child(2) {
      flex: 1;
      font-size: var(--font-body-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .tomorrow-block-item .block-count {
      font-size: var(--font-body-xs);
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
      font-size: var(--font-body-sm);
      color: var(--color-text-secondary);
    }

    /* --------------------------------------------------------------------------
       ACCESSIBILITY - Reduced Motion
       -------------------------------------------------------------------------- */
    @media (prefers-reduced-motion: reduce) {
      :host ::ng-deep .stat-card,
      :host ::ng-deep .action-card {
        transition: none;
      }
      
      .confetti-piece {
        animation: none;
        opacity: 0;
      }
      
      .celebration-icon {
        animation: none;
      }
    }
  `],
})
export class TodayComponent {
  // Dependency Injection (Angular 21 pattern)
  private readonly router = inject(Router);
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly headerService = inject(HeaderService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);
  private readonly dataSourceService = inject(DataSourceService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // STATE SIGNALS
  // ============================================================================
  readonly protocol = signal<Partial<DailyProtocol> | null>(null);
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
    { value: 1, emoji: '😫', label: 'Rough' },
    { value: 2, emoji: '😐', label: 'Okay' },
    { value: 3, emoji: '🙂', label: 'Good' },
    { value: 4, emoji: '😊', label: 'Great' },
    { value: 5, emoji: '🤩', label: 'Amazing' },
  ];
  
  readonly quickEnergyLevels: QuickEnergyLevel[] = [
    { value: 1, label: 'Low' },
    { value: 2, label: 'Moderate' },
    { value: 3, label: 'Normal' },
    { value: 4, label: 'High' },
    { value: 5, label: 'Peak' },
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
  readonly currentDate = signal(new Date().toISOString().split('T')[0]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  readonly isFirstTimeUser = computed(() => this.dataSourceService.isFirstTimeUser());

  readonly dayPhase = computed<DayPhase>(() => {
    const hour = this.currentTime().getHours();
    if (hour < 11) return 'morning';
    if (hour < 17) return 'midday';
    return 'evening';
  });

  readonly greetingPrefix = computed(() => {
    const greetings: Record<DayPhase, string> = {
      morning: 'Good Morning,',
      midday: 'Time to Train,',
      evening: 'Good Evening,',
    };
    return greetings[this.dayPhase()];
  });

  readonly dayPhaseMessage = computed(() => {
    if (!this.hasCheckedInToday()) return "Let's start with your readiness check.";
    if (this.dayPhase() === 'evening') return 'Time to review and recover.';
    return 'Follow your personalized protocol below.';
  });

  readonly activeFocus = computed<ActiveFocus>(() => {
    if (!this.hasCheckedInToday()) return 'checkin';
    if (this.dayPhase() === 'evening') return 'wrapup';
    return 'protocol';
  });

  readonly weekDays = computed<WeekDay[]>(() => {
    const schedule = this.trainingService.weeklySchedule();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return dayNames.map((dayName, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      const daySchedule = schedule.find(
        (s) => s.date && new Date(s.date).toISOString().split('T')[0] === dateStr
      );

      let status: WeekDay['status'] = 'empty';
      if (daySchedule) {
        status = daySchedule.sessions.length > 0 ? 'planned' : 'rest';
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
    const streak = stats.find((s) => s.label === 'Current Streak')?.value || '0';
    const compliance = stats.find((s) => s.label === 'This Week')?.value || '0';

    return {
      completedDays: parseInt(compliance, 10),
      totalTrainingDays: 7,
      weeklyLoadAu: 0,
      targetLoadAu: 2000,
      currentStreak: parseInt(streak, 10),
    };
  });

  // ============================================================================
  // COMPUTED STATUS HELPERS
  // ============================================================================
  readonly acwrStatusLabel = computed(() => this.acwrRiskZone()?.label || 'Unknown');

  readonly acwrSeverity = computed<TagSeverity>(() => {
    const level = this.acwrRiskZone()?.level;
    const severityMap: Record<string, TagSeverity> = {
      'sweet-spot': 'success',
      'under-training': 'warn',
      'elevated-risk': 'warn',
      'danger-zone': 'danger',
      'no-data': 'secondary',
    };
    return severityMap[level ?? ''] ?? 'secondary';
  });

  readonly acwrClass = computed(() => {
    const level = this.acwrRiskZone()?.level;
    const classMap: Record<string, string> = {
      'sweet-spot': 'optimal',
      'under-training': 'moderate',
      'elevated-risk': 'moderate',
      'danger-zone': 'risk',
    };
    return classMap[level ?? ''] ?? '';
  });

  readonly readinessStatusLabel = computed(() => {
    const labelMap: Record<string, string> = {
      high: 'Great',
      moderate: 'Good',
      low: 'Low',
    };
    return labelMap[this.readinessLevel()] ?? 'Unknown';
  });

  readonly readinessSeverity = computed<TagSeverity>(() => {
    const severityMap: Record<string, TagSeverity> = {
      high: 'success',
      moderate: 'warn',
      low: 'danger',
    };
    return severityMap[this.readinessLevel()] ?? 'secondary';
  });

  readonly tomorrowDate = computed(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  readonly tomorrowDateLabel = computed(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  });

  // ============================================================================
  // COMPUTED - Quick Check-in
  // ============================================================================
  readonly quickReadinessScore = computed(() => {
    const data = this.quickFormData();
    if (data.overallFeeling === null || data.energyLevel === null || data.hasSoreness === null) {
      return 0;
    }
    
    // Calculate score based on quick inputs
    const feelingScore = (data.overallFeeling / 5) * 100;
    const energyScore = (data.energyLevel / 5) * 100;
    const sorenessScore = data.hasSoreness ? 60 : 100; // Penalty for soreness
    
    // Weighted average
    const score = Math.round(feelingScore * 0.4 + energyScore * 0.35 + sorenessScore * 0.25);
    return score;
  });
  
  readonly isQuickFormValid = computed(() => {
    const data = this.quickFormData();
    return data.overallFeeling !== null && 
           data.energyLevel !== null && 
           data.hasSoreness !== null;
  });

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================
  constructor() {
    this.headerService.setDashboardHeader();
    this.loadTodayData();
    this.loadTomorrowProtocol();

    // Update time every minute
    const interval = setInterval(() => this.currentTime.set(new Date()), 60000);
    this.destroyRef.onDestroy(() => clearInterval(interval));
    
    // Watch for protocol completion to trigger celebration
    effect(() => {
      const p = this.protocol();
      if (p?.overallProgress === 100 && !this.celebrationShownForSession && this.hasCheckedInToday()) {
        this.celebrationShownForSession = true;
        this.showCelebration.set(true);
      }
    });
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================
  private loadTodayData(): void {
    this.trainingService
      .getTodayOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.protocol.set((data?.protocol?.data as Partial<DailyProtocol>) ?? null);
          this.error.set(null);
        },
        error: (err) => {
          this.logger.error('Failed to load today data', err);
          this.error.set('Failed to load your training data. Please try again.');
        },
      });
  }

  refreshProtocol(): void {
    this.loadTodayData();
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  onWellnessComplete(result: { readinessScore: number }): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Wellness Logged',
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
    document.getElementById('wellness-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  // ============================================================================
  // QUICK CHECK-IN METHODS
  // ============================================================================
  openQuickCheckin(): void {
    this.quickFormData.set({
      overallFeeling: null,
      energyLevel: null,
      hasSoreness: null,
    });
    this.showQuickCheckin.set(true);
  }
  
  setQuickField<K extends keyof QuickFormData>(field: K, value: QuickFormData[K]): void {
    this.quickFormData.set({
      ...this.quickFormData(),
      [field]: value,
    });
  }
  
  getQuickReadinessClass(): string {
    const score = this.quickReadinessScore();
    if (score >= 70) return 'high';
    if (score >= 50) return 'moderate';
    return 'low';
  }
  
  async submitQuickCheckin(): Promise<void> {
    if (!this.isQuickFormValid()) return;
    
    this.isSavingQuickCheckin.set(true);
    
    try {
      const data = this.quickFormData();
      const targetDate = new Date().toISOString().split('T')[0];
      const readiness = this.quickReadinessScore();
      
      // Map quick form to full wellness data
      const wellnessData = {
        date: targetDate,
        sleepQuality: data.overallFeeling ?? 3,
        sleepHours: 7, // Default
        energyLevel: data.energyLevel ?? 3,
        muscleSoreness: data.hasSoreness ? 2 : 4,
        stressLevel: data.overallFeeling ?? 3,
        sorenessAreas: [] as string[],
        readinessScore: readiness,
      };
      
      const response: any = await this.trainingService.submitWellness(wellnessData);
      
      if (response?.success) {
        this.showQuickCheckin.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Quick Check-in Complete',
          detail: `Readiness: ${readiness}%. Ready to train!`,
        });
        this.refreshProtocol();
      }
    } catch (err) {
      this.logger.error('Failed to save quick checkin', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save check-in. Please try again.',
      });
    } finally {
      this.isSavingQuickCheckin.set(false);
    }
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
    
    this.trainingService.generateDailyProtocol()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response?.success && response.data) {
            this.protocol.set(response.data as Partial<DailyProtocol>);
            this.messageService.add({
              severity: 'success',
              summary: 'Protocol Generated',
              detail: 'Your personalized training plan is ready!',
            });
          }
          this.isGeneratingProtocol.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to generate protocol', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to generate protocol. Please try again.',
          });
          this.isGeneratingProtocol.set(false);
        },
      });
  }

  generateTomorrowProtocol(): void {
    this.isGeneratingTomorrow.set(true);
    
    this.trainingService.generateDailyProtocol(this.tomorrowDate())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response?.success && response.data) {
            this.tomorrowProtocol.set(response.data as Partial<DailyProtocol>);
            this.messageService.add({
              severity: 'success',
              summary: 'Tomorrow\'s Protocol Ready',
              detail: 'Your training plan for tomorrow has been generated!',
            });
          }
          this.isGeneratingTomorrow.set(false);
        },
        error: (err) => {
          this.logger.error('Failed to generate tomorrow protocol', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to generate tomorrow\'s protocol.',
          });
          this.isGeneratingTomorrow.set(false);
        },
      });
  }

  loadTomorrowProtocol(): void {
    this.isLoadingTomorrow.set(true);
    
    this.trainingService.getProtocolForDate(this.tomorrowDate())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response?.success && response.data) {
            this.tomorrowProtocol.set(response.data as Partial<DailyProtocol>);
          }
          this.isLoadingTomorrow.set(false);
        },
        error: () => {
          this.isLoadingTomorrow.set(false);
        },
      });
  }

  viewTomorrowProtocol(): void {
    // Navigate to training schedule with tomorrow's date highlighted
    this.router.navigate(['/training'], { 
      queryParams: { date: this.tomorrowDate() } 
    });
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================
  navigateToAcwr(): void {
    this.router.navigate(['/acwr']);
  }

  navigateToWellness(): void {
    this.router.navigate(['/wellness']);
  }
}
