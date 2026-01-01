/**
 * Coach Inbox Component
 *
 * Phase 1: Real-time inbox workflow for coaches to monitor AI coaching interactions
 *
 * Features:
 * - 3 tabs: Safety Alerts, Review Needed, Wins
 * - Real-time updates via Supabase subscription
 * - Each item shows: player name, risk badge, ACWR status, summary
 * - One-click actions: Approve, Add Note, Override (requires reason)
 * - Unread count badges
 */

import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Tabs, TabPanel } from "primeng/tabs";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { DialogModule } from "primeng/dialog";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { BadgeModule } from "primeng/badge";
import { SkeletonModule } from "primeng/skeleton";
import { AvatarModule } from "primeng/avatar";
import { DividerModule } from "primeng/divider";
import { InputTextModule } from "primeng/inputtext";
import { Select } from "primeng/select";
import { ApiService } from "../../../core/services/api.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { LoggerService } from "../../../core/services/logger.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { RealtimeChannel } from "@supabase/supabase-js";

interface InboxItem {
  id: string;
  coach_id: string;
  team_id: string;
  player_id: string;
  inbox_type: "safety_alert" | "review_needed" | "win";
  priority: "low" | "medium" | "high" | "critical";
  source_type: string;
  source_id: string;
  title: string;
  summary: string;
  risk_level: string;
  acwr_value: number | null;
  acwr_zone: string | null;
  intent_type: string;
  athlete_context: {
    injuries?: { type: string; severity: number }[];
    daily_pain?: number;
    age_group?: string;
    acwr?: number;
    position?: string;
  };
  status: string;
  coach_action: string | null;
  coach_notes: string | null;
  override_reason: string | null;
  override_alternative: string | null;
  viewed_at: string | null;
  actioned_at: string | null;
  created_at: string;
  is_new: boolean;
  player?: {
    id: string;
    name: string;
    position: string | null;
  };
}

interface InboxStats {
  safety_alerts: number;
  review_needed: number;
  wins: number;
  total_pending: number;
  critical_count: number;
}

@Component({
  selector: "app-coach-inbox",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Tabs,
    TabPanel,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    TextareaModule,
    TooltipModule,
    BadgeModule,
    SkeletonModule,
    AvatarModule,
    DividerModule,
    InputTextModule,
    Select,
    MainLayoutComponent,
  ],
  template: `
    <app-main-layout>
      <div class="coach-inbox">
        <!-- Header -->
        <div class="inbox-header">
          <div class="header-content">
            <h1>
              <i class="pi pi-inbox"></i>
              Coach Inbox
            </h1>
            <p class="header-subtitle">
              Monitor AI coaching interactions and take action
            </p>
          </div>
          <div class="header-actions">
            <p-button
              icon="pi pi-refresh"
              [text]="true"
              [rounded]="true"
              pTooltip="Refresh"
              (onClick)="loadData()"
              [loading]="loading()"
            ></p-button>
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="stats-row">
          <div
            class="stat-card critical"
            [class.has-items]="stats().critical_count > 0"
          >
            <i class="pi pi-exclamation-triangle"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats().critical_count }}</span>
              <span class="stat-label">Critical</span>
            </div>
          </div>
          <div
            class="stat-card alerts"
            [class.has-items]="stats().safety_alerts > 0"
          >
            <i class="pi pi-shield"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats().safety_alerts }}</span>
              <span class="stat-label">Safety Alerts</span>
            </div>
          </div>
          <div
            class="stat-card review"
            [class.has-items]="stats().review_needed > 0"
          >
            <i class="pi pi-eye"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats().review_needed }}</span>
              <span class="stat-label">Review Needed</span>
            </div>
          </div>
          <div class="stat-card wins">
            <i class="pi pi-star"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats().wins }}</span>
              <span class="stat-label">Wins</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <p-tabs [activeIndex]="activeTabIndex" (onChange)="onTabChange($event)">
          <!-- Safety Alerts Tab -->
          <p-tabpanel>
            <ng-template pTemplate="header">
              <div class="tab-header">
                <i class="pi pi-shield"></i>
                <span>Safety Alerts</span>
                @if (stats().safety_alerts > 0) {
                  <p-badge
                    [value]="stats().safety_alerts.toString()"
                    severity="danger"
                  ></p-badge>
                }
              </div>
            </ng-template>

            @if (loading()) {
              <div class="loading-state">
                @for (i of [1, 2, 3]; track i) {
                  <p-skeleton height="100px" styleClass="mb-3"></p-skeleton>
                }
              </div>
            } @else if (safetyAlerts().length === 0) {
              <div class="empty-state">
                <i class="pi pi-check-circle"></i>
                <h3>All Clear</h3>
                <p>No safety alerts at this time</p>
              </div>
            } @else {
              <div class="items-list">
                @for (item of safetyAlerts(); track item.id) {
                  <div
                    class="inbox-item"
                    [class.unread]="item.is_new"
                    [class.critical]="item.priority === 'critical'"
                  >
                    <div class="item-avatar">
                      <p-avatar
                        [label]="getInitials(item.player?.name)"
                        [style]="{
                          'background-color': getAvatarColor(item.priority),
                        }"
                        shape="circle"
                      ></p-avatar>
                    </div>

                    <div class="item-content">
                      <div class="item-header">
                        <span class="player-name">{{
                          item.player?.name || "Unknown Player"
                        }}</span>
                        <div class="item-badges">
                          <p-tag
                            [value]="item.priority | titlecase"
                            [severity]="getPrioritySeverity(item.priority)"
                            [rounded]="true"
                          ></p-tag>
                          @if (item.acwr_zone) {
                            <p-tag
                              [value]="'ACWR: ' + (item.acwr_value || '?')"
                              [severity]="getAcwrSeverity(item.acwr_zone)"
                              [rounded]="true"
                            ></p-tag>
                          }
                        </div>
                      </div>

                      <p class="item-title">{{ item.title }}</p>
                      <p class="item-summary">{{ item.summary }}</p>

                      <div class="item-context">
                        @if (item.athlete_context?.daily_pain) {
                          <span class="context-badge pain">
                            <i class="pi pi-exclamation-circle"></i>
                            Pain: {{ item.athlete_context.daily_pain }}/10
                          </span>
                        }
                        @if (item.athlete_context?.age_group === "youth") {
                          <span class="context-badge youth">
                            <i class="pi pi-user"></i>
                            Youth Athlete
                          </span>
                        }
                        @if (item.athlete_context?.injuries?.length) {
                          <span class="context-badge injury">
                            <i class="pi pi-heart"></i>
                            {{ item.athlete_context.injuries.length }} injury(s)
                          </span>
                        }
                      </div>

                      <div class="item-meta">
                        <span class="item-time">
                          <i class="pi pi-clock"></i>
                          {{ formatTime(item.created_at) }}
                        </span>
                        @if (item.status !== "pending") {
                          <span class="item-status" [class]="item.status">
                            {{ item.status | titlecase }}
                          </span>
                        }
                      </div>
                    </div>

                    <div class="item-actions">
                      <p-button
                        icon="pi pi-check"
                        [rounded]="true"
                        [text]="true"
                        severity="success"
                        pTooltip="Approve"
                        (onClick)="approveItem(item)"
                        [disabled]="item.status !== 'pending'"
                      ></p-button>
                      <p-button
                        icon="pi pi-comment"
                        [rounded]="true"
                        [text]="true"
                        severity="info"
                        pTooltip="Add Note"
                        (onClick)="openNoteDialog(item)"
                      ></p-button>
                      <p-button
                        icon="pi pi-times"
                        [rounded]="true"
                        [text]="true"
                        severity="danger"
                        pTooltip="Override"
                        (onClick)="openOverrideDialog(item)"
                        [disabled]="item.status !== 'pending'"
                      ></p-button>
                      <p-button
                        icon="pi pi-bookmark"
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        pTooltip="Save as Team Standard"
                        (onClick)="openTemplateDialog(item)"
                      ></p-button>
                    </div>
                  </div>
                }
              </div>
            }
          </p-tabpanel>

          <!-- Review Needed Tab -->
          <p-tabpanel>
            <ng-template pTemplate="header">
              <div class="tab-header">
                <i class="pi pi-eye"></i>
                <span>Review Needed</span>
                @if (stats().review_needed > 0) {
                  <p-badge
                    [value]="stats().review_needed.toString()"
                    severity="warn"
                  ></p-badge>
                }
              </div>
            </ng-template>

            @if (loading()) {
              <div class="loading-state">
                @for (i of [1, 2, 3]; track i) {
                  <p-skeleton height="100px" styleClass="mb-3"></p-skeleton>
                }
              </div>
            } @else if (reviewNeeded().length === 0) {
              <div class="empty-state">
                <i class="pi pi-inbox"></i>
                <h3>No Reviews Pending</h3>
                <p>All caught up!</p>
              </div>
            } @else {
              <div class="items-list">
                @for (item of reviewNeeded(); track item.id) {
                  <div class="inbox-item" [class.unread]="item.is_new">
                    <div class="item-avatar">
                      <p-avatar
                        [label]="getInitials(item.player?.name)"
                        shape="circle"
                      ></p-avatar>
                    </div>

                    <div class="item-content">
                      <div class="item-header">
                        <span class="player-name">{{
                          item.player?.name || "Unknown Player"
                        }}</span>
                        <p-tag
                          [value]="item.intent_type || 'Query'"
                          severity="info"
                          [rounded]="true"
                        ></p-tag>
                      </div>

                      <p class="item-title">{{ item.title }}</p>
                      <p class="item-summary">{{ item.summary }}</p>

                      <div class="item-meta">
                        <span class="item-time">
                          <i class="pi pi-clock"></i>
                          {{ formatTime(item.created_at) }}
                        </span>
                      </div>
                    </div>

                    <div class="item-actions">
                      <p-button
                        icon="pi pi-check"
                        [rounded]="true"
                        [text]="true"
                        severity="success"
                        pTooltip="Approve"
                        (onClick)="approveItem(item)"
                        [disabled]="item.status !== 'pending'"
                      ></p-button>
                      <p-button
                        icon="pi pi-comment"
                        [rounded]="true"
                        [text]="true"
                        severity="info"
                        pTooltip="Add Note"
                        (onClick)="openNoteDialog(item)"
                      ></p-button>
                      <p-button
                        icon="pi pi-bookmark"
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        pTooltip="Save as Team Standard"
                        (onClick)="openTemplateDialog(item)"
                      ></p-button>
                    </div>
                  </div>
                }
              </div>
            }
          </p-tabpanel>

          <!-- Wins Tab -->
          <p-tabpanel>
            <ng-template pTemplate="header">
              <div class="tab-header">
                <i class="pi pi-star"></i>
                <span>Wins</span>
                @if (stats().wins > 0) {
                  <p-badge
                    [value]="stats().wins.toString()"
                    severity="success"
                  ></p-badge>
                }
              </div>
            </ng-template>

            @if (loading()) {
              <div class="loading-state">
                @for (i of [1, 2, 3]; track i) {
                  <p-skeleton height="80px" styleClass="mb-3"></p-skeleton>
                }
              </div>
            } @else if (wins().length === 0) {
              <div class="empty-state">
                <i class="pi pi-star"></i>
                <h3>No Wins Yet</h3>
                <p>Athlete achievements will appear here</p>
              </div>
            } @else {
              <div class="items-list">
                @for (item of wins(); track item.id) {
                  <div class="inbox-item win-item">
                    <div class="item-avatar">
                      <p-avatar
                        [label]="getInitials(item.player?.name)"
                        [style]="{ 'background-color': '#089949' }"
                        shape="circle"
                      ></p-avatar>
                    </div>

                    <div class="item-content">
                      <div class="item-header">
                        <span class="player-name">{{
                          item.player?.name || "Unknown Player"
                        }}</span>
                        <p-tag
                          value="Win"
                          severity="success"
                          [rounded]="true"
                        ></p-tag>
                      </div>

                      <p class="item-title">{{ item.title }}</p>
                      <p class="item-summary">{{ item.summary }}</p>

                      <div class="item-meta">
                        <span class="item-time">
                          <i class="pi pi-clock"></i>
                          {{ formatTime(item.created_at) }}
                        </span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </p-tabpanel>
        </p-tabs>

        <!-- Note Dialog -->
        <p-dialog
          header="Add Coach Note"
          [(visible)]="noteDialogVisible"
          [modal]="true"
          [style]="{ width: '450px' }"
          [closable]="true"
        >
          <div class="dialog-content">
            <p class="dialog-context">
              Adding note for:
              <strong>{{ selectedItem()?.player?.name || "Player" }}</strong>
            </p>
            <textarea
              pInputTextarea
              [(ngModel)]="coachNote"
              placeholder="Enter your note (visible to athlete)..."
              [rows]="4"
              class="w-full"
            ></textarea>
          </div>
          <ng-template pTemplate="footer">
            <p-button
              label="Cancel"
              [text]="true"
              (onClick)="noteDialogVisible = false"
            ></p-button>
            <p-button
              label="Save Note"
              icon="pi pi-check"
              (onClick)="saveNote()"
              [disabled]="!coachNote.trim()"
              [loading]="saving()"
            ></p-button>
          </ng-template>
        </p-dialog>

        <!-- Override Dialog -->
        <p-dialog
          header="Override AI Recommendation"
          [(visible)]="overrideDialogVisible"
          [modal]="true"
          [style]="{ width: '500px' }"
          [closable]="true"
        >
          <div class="dialog-content">
            <div class="override-warning">
              <i class="pi pi-exclamation-triangle"></i>
              <p>
                You are overriding an AI recommendation. The athlete will be
                notified that their coach has reviewed and modified this
                guidance.
              </p>
            </div>

            <p-divider></p-divider>

            <p class="dialog-context">
              Original recommendation:
              <strong>{{ selectedItem()?.title }}</strong>
            </p>

            <div class="form-field">
              <label>Override Reason <span class="required">*</span></label>
              <textarea
                pInputTextarea
                [(ngModel)]="overrideReason"
                placeholder="Explain why you're overriding this recommendation..."
                [rows]="3"
                class="w-full"
              ></textarea>
            </div>

            <div class="form-field">
              <label>Alternative Guidance (Optional)</label>
              <textarea
                pInputTextarea
                [(ngModel)]="overrideAlternative"
                placeholder="Provide alternative guidance for the athlete..."
                [rows]="3"
                class="w-full"
              ></textarea>
            </div>
          </div>
          <ng-template pTemplate="footer">
            <p-button
              label="Cancel"
              [text]="true"
              (onClick)="overrideDialogVisible = false"
            ></p-button>
            <p-button
              label="Submit Override"
              icon="pi pi-times"
              severity="danger"
              (onClick)="submitOverride()"
              [disabled]="!overrideReason.trim()"
              [loading]="saving()"
            ></p-button>
          </ng-template>
        </p-dialog>

        <!-- Save as Template Dialog (Phase 2) -->
        <p-dialog
          header="Save as Team Standard"
          [(visible)]="templateDialogVisible"
          [modal]="true"
          [style]="{ width: '550px' }"
          [closable]="true"
        >
          <div class="dialog-content">
            <div class="template-info">
              <i class="pi pi-bookmark"></i>
              <p>
                Create a reusable template from this interaction. You can assign
                it to athletes or set it as a team default.
              </p>
            </div>

            <p-divider></p-divider>

            <div class="form-field">
              <label>Template Name <span class="required">*</span></label>
              <input
                pInputText
                [(ngModel)]="templateName"
                placeholder="e.g., Team Recovery Protocol"
                class="w-full"
              />
            </div>

            <div class="form-field">
              <label>Description</label>
              <textarea
                pInputTextarea
                [(ngModel)]="templateDescription"
                placeholder="What is this template for?"
                [rows]="2"
                class="w-full"
              ></textarea>
            </div>

            <div class="form-field">
              <label>Category</label>
              <p-select
                [(ngModel)]="templateCategory"
                [options]="templateCategories"
                optionLabel="label"
                optionValue="value"
                placeholder="Select category"
                styleClass="w-full"
              ></p-select>
            </div>

            <div class="form-field">
              <label>Template Type</label>
              <p-select
                [(ngModel)]="templateType"
                [options]="templateTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select type"
                styleClass="w-full"
              ></p-select>
            </div>

            <div class="form-row">
              <div class="form-check">
                <p-checkbox
                  [(ngModel)]="templateAppliesYouth"
                  [binary]="true"
                  inputId="youth"
                ></p-checkbox>
                <label for="youth">Applies to youth athletes</label>
              </div>
              <div class="form-check">
                <p-checkbox
                  [(ngModel)]="templateAppliesAdults"
                  [binary]="true"
                  inputId="adults"
                ></p-checkbox>
                <label for="adults">Applies to adults</label>
              </div>
            </div>

            <div class="form-check">
              <p-checkbox
                [(ngModel)]="templateIsDefault"
                [binary]="true"
                inputId="default"
              ></p-checkbox>
              <label for="default"
                >Set as team default (auto-apply for similar situations)</label
              >
            </div>
          </div>
          <ng-template pTemplate="footer">
            <p-button
              label="Cancel"
              [text]="true"
              (onClick)="templateDialogVisible = false"
            ></p-button>
            <p-button
              label="Save Template"
              icon="pi pi-bookmark"
              (onClick)="saveAsTemplate()"
              [disabled]="!templateName.trim()"
              [loading]="saving()"
            ></p-button>
          </ng-template>
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .coach-inbox {
        max-width: 1000px;
        margin: 0 auto;
        padding: var(--space-4);
      }

      .inbox-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: var(--space-6);
      }

      .header-content h1 {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin: 0 0 var(--space-1) 0;
        font-size: var(--text-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .header-content h1 i {
        color: var(--ds-primary-green, #089949);
      }

      .header-subtitle {
        margin: 0;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4);
        background: var(--surface-card);
        border-radius: var(--radius-lg);
        border: 1px solid var(--surface-border);
      }

      .stat-card i {
        font-size: var(--text-xl);
        color: var(--color-text-secondary);
      }

      .stat-card.has-items.critical {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.05);
      }

      .stat-card.has-items.critical i {
        color: #ef4444;
      }

      .stat-card.has-items.alerts {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.05);
      }

      .stat-card.has-items.alerts i {
        color: #f59e0b;
      }

      .stat-card.has-items.review {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.05);
      }

      .stat-card.has-items.review i {
        color: #3b82f6;
      }

      .stat-card.wins i {
        color: #089949;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: var(--text-xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .stat-label {
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
      }

      .tab-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .items-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .inbox-item {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-4);
        background: var(--surface-card);
        border-radius: var(--radius-lg);
        border: 1px solid var(--surface-border);
        transition: all 0.2s;
      }

      .inbox-item:hover {
        border-color: var(--ds-primary-green);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .inbox-item.unread {
        border-left: 3px solid var(--ds-primary-green);
        background: rgba(8, 153, 73, 0.02);
      }

      .inbox-item.critical {
        border-left: 3px solid #ef4444;
        background: rgba(239, 68, 68, 0.02);
      }

      .inbox-item.win-item {
        border-left: 3px solid #089949;
        background: rgba(8, 153, 73, 0.02);
      }

      .item-avatar {
        flex-shrink: 0;
      }

      .item-content {
        flex: 1;
        min-width: 0;
      }

      .item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        margin-bottom: var(--space-1);
        flex-wrap: wrap;
      }

      .player-name {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .item-badges {
        display: flex;
        gap: var(--space-2);
      }

      .item-title {
        font-size: var(--text-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
        margin: 0 0 var(--space-1) 0;
      }

      .item-summary {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-2) 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .item-context {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
      }

      .context-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: var(--radius-full);
        font-size: var(--text-xs);
      }

      .context-badge.pain {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }

      .context-badge.youth {
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
      }

      .context-badge.injury {
        background: rgba(245, 158, 11, 0.1);
        color: #d97706;
      }

      .item-meta {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .item-time {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }

      .item-status {
        font-size: var(--text-xs);
        font-weight: var(--font-weight-medium);
        padding: 2px 8px;
        border-radius: var(--radius-full);
      }

      .item-status.approved {
        background: rgba(8, 153, 73, 0.1);
        color: #089949;
      }

      .item-status.overridden {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }

      .item-status.noted {
        background: rgba(59, 130, 246, 0.1);
        color: #2563eb;
      }

      .item-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .empty-state {
        text-align: center;
        padding: var(--space-12) var(--space-4);
      }

      .empty-state i {
        font-size: 3rem;
        color: var(--surface-300);
        margin-bottom: var(--space-4);
      }

      .empty-state h3 {
        margin: 0 0 var(--space-2) 0;
        color: var(--color-text-primary);
      }

      .empty-state p {
        margin: 0;
        color: var(--color-text-secondary);
      }

      .loading-state {
        padding: var(--space-4) 0;
      }

      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .dialog-context {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        margin: 0;
      }

      .override-warning {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-3);
        background: rgba(245, 158, 11, 0.1);
        border-radius: var(--radius-lg);
        color: #b45309;
      }

      .override-warning i {
        font-size: var(--text-xl);
        color: #f59e0b;
        flex-shrink: 0;
      }

      .override-warning p {
        margin: 0;
        font-size: var(--text-sm);
        line-height: 1.5;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .form-field label {
        font-size: var(--text-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
      }

      .form-field label .required {
        color: #ef4444;
      }

      /* Phase 2: Template dialog styles */
      .template-info {
        display: flex;
        gap: var(--space-3);
        padding: var(--space-3);
        background: rgba(8, 153, 73, 0.05);
        border-radius: var(--radius-lg);
        margin-bottom: var(--space-3);
      }

      .template-info i {
        color: var(--ds-primary-green, #089949);
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      .template-info p {
        margin: 0;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .form-row {
        display: flex;
        gap: var(--space-4);
        flex-wrap: wrap;
        margin-bottom: var(--space-3);
      }

      .form-check {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .form-check label {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .w-full {
        width: 100%;
      }

      @media (max-width: 768px) {
        .coach-inbox {
          padding: var(--space-3);
        }

        .inbox-header {
          flex-direction: column;
          gap: var(--space-3);
        }

        .stats-row {
          grid-template-columns: repeat(2, 1fr);
        }

        .inbox-item {
          flex-direction: column;
        }

        .item-actions {
          flex-direction: row;
          justify-content: flex-end;
        }
      }
    `,
  ],
})
export class CoachInboxComponent implements OnInit {
  private apiService = inject(ApiService);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  // State
  loading = signal(true);
  saving = signal(false);
  allItems = signal<InboxItem[]>([]);
  stats = signal<InboxStats>({
    safety_alerts: 0,
    review_needed: 0,
    wins: 0,
    total_pending: 0,
    critical_count: 0,
  });

  // Computed filtered lists
  safetyAlerts = computed(() =>
    this.allItems().filter((i) => i.inbox_type === "safety_alert"),
  );
  reviewNeeded = computed(() =>
    this.allItems().filter((i) => i.inbox_type === "review_needed"),
  );
  wins = computed(() => this.allItems().filter((i) => i.inbox_type === "win"));

  // Dialog state
  activeTabIndex = 0;
  noteDialogVisible = false;
  overrideDialogVisible = false;
  templateDialogVisible = false;
  selectedItem = signal<InboxItem | null>(null);
  coachNote = "";
  overrideReason = "";
  overrideAlternative = "";

  // Phase 2: Template dialog state
  templateName = "";
  templateDescription = "";
  templateCategory = "recovery";
  templateType = "micro_session";
  templateAppliesYouth = true;
  templateAppliesAdults = true;
  templateIsDefault = false;

  templateCategories = [
    { label: "Recovery", value: "recovery" },
    { label: "Warm-up", value: "warm_up" },
    { label: "Technique", value: "technique" },
    { label: "Injury Prevention", value: "injury_prevention" },
    { label: "Mental Training", value: "mental" },
  ];

  templateTypes = [
    { label: "Micro-Session (workout)", value: "micro_session" },
    { label: "Response Override", value: "response_override" },
    { label: "Checklist", value: "checklist" },
  ];

  // Realtime subscription
  private realtimeChannel: RealtimeChannel | null = null;

  ngOnInit(): void {
    this.loadData();
    this.setupRealtimeSubscription();
  }

  /**
   * Load inbox data from API
   */
  async loadData(): Promise<void> {
    this.loading.set(true);

    try {
      // Load stats and items in parallel
      const [statsResponse, itemsResponse] = await Promise.all([
        this.apiService.get<InboxStats>("/api/coach-inbox/stats").toPromise(),
        this.apiService
          .get<{ items: InboxItem[] }>("/api/coach-inbox")
          .toPromise(),
      ]);

      if (statsResponse?.success && statsResponse.data) {
        this.stats.set(statsResponse.data);
      }

      if (itemsResponse?.success && itemsResponse.data?.items) {
        this.allItems.set(itemsResponse.data.items);
      }
    } catch (error) {
      this.logger.error("Error loading coach inbox:", error);
      this.toastService.error("Failed to load inbox");
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Set up realtime subscription for new inbox items
   */
  setupRealtimeSubscription(): void {
    const user = this.authService.getUser();
    if (!user?.id) return;

    this.realtimeChannel = this.supabaseService.client
      .channel("coach-inbox-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "coach_inbox_items",
          filter: `coach_id=eq.${user.id}`,
        },
        (payload) => {
          this.handleNewItem(payload.new as InboxItem);
        },
      )
      .subscribe();

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.realtimeChannel) {
        this.supabaseService.client.removeChannel(this.realtimeChannel);
      }
    });
  }

  /**
   * Handle new realtime item
   */
  handleNewItem(newItem: InboxItem): void {
    // Add to list
    this.allItems.update((items) => [newItem, ...items]);

    // Update stats
    this.stats.update((s) => ({
      ...s,
      total_pending: s.total_pending + 1,
      [newItem.inbox_type === "safety_alert"
        ? "safety_alerts"
        : newItem.inbox_type === "review_needed"
          ? "review_needed"
          : "wins"]:
        s[
          newItem.inbox_type === "safety_alert"
            ? "safety_alerts"
            : newItem.inbox_type === "review_needed"
              ? "review_needed"
              : "wins"
        ] + 1,
      critical_count:
        newItem.priority === "critical"
          ? s.critical_count + 1
          : s.critical_count,
    }));

    // Show notification
    if (newItem.inbox_type === "safety_alert") {
      this.toastService.warn(`Safety Alert: ${newItem.title}`);
    } else {
      this.toastService.info(`New inbox item: ${newItem.title}`);
    }
  }

  /**
   * Handle tab change
   */
  onTabChange(event: { index: number }): void {
    this.activeTabIndex = event.index;
  }

  /**
   * Approve an inbox item
   */
  async approveItem(item: InboxItem): Promise<void> {
    try {
      const response = await this.apiService
        .patch<InboxItem>(`/api/coach-inbox/${item.id}`, {
          action: "approve",
          status: "approved",
        })
        .toPromise();

      if (response?.success) {
        this.updateLocalItem(item.id, {
          status: "approved",
          coach_action: "approve",
          is_new: false,
        });
        this.toastService.success("Item approved");
      }
    } catch (error) {
      this.logger.error("Error approving item:", error);
      this.toastService.error("Failed to approve item");
    }
  }

  /**
   * Open note dialog
   */
  openNoteDialog(item: InboxItem): void {
    this.selectedItem.set(item);
    this.coachNote = item.coach_notes || "";
    this.noteDialogVisible = true;
  }

  /**
   * Save coach note
   */
  async saveNote(): Promise<void> {
    const item = this.selectedItem();
    if (!item || !this.coachNote.trim()) return;

    this.saving.set(true);

    try {
      const response = await this.apiService
        .patch<InboxItem>(`/api/coach-inbox/${item.id}`, {
          action: "add_note",
          status: "noted",
          notes: this.coachNote,
        })
        .toPromise();

      if (response?.success) {
        this.updateLocalItem(item.id, {
          status: "noted",
          coach_action: "add_note",
          coach_notes: this.coachNote,
          is_new: false,
        });
        this.toastService.success("Note saved");
        this.noteDialogVisible = false;
      }
    } catch (error) {
      this.logger.error("Error saving note:", error);
      this.toastService.error("Failed to save note");
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Open override dialog
   */
  openOverrideDialog(item: InboxItem): void {
    this.selectedItem.set(item);
    this.overrideReason = "";
    this.overrideAlternative = "";
    this.overrideDialogVisible = true;
  }

  /**
   * Submit override
   */
  async submitOverride(): Promise<void> {
    const item = this.selectedItem();
    if (!item || !this.overrideReason.trim()) return;

    this.saving.set(true);

    try {
      const response = await this.apiService
        .patch<InboxItem>(`/api/coach-inbox/${item.id}`, {
          action: "override",
          status: "overridden",
          override_reason: this.overrideReason,
          override_alternative: this.overrideAlternative || null,
        })
        .toPromise();

      if (response?.success) {
        this.updateLocalItem(item.id, {
          status: "overridden",
          coach_action: "override",
          override_reason: this.overrideReason,
          override_alternative: this.overrideAlternative,
          is_new: false,
        });
        this.toastService.success("Override submitted");
        this.overrideDialogVisible = false;
      }
    } catch (error) {
      this.logger.error("Error submitting override:", error);
      this.toastService.error("Failed to submit override");
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Phase 2: Open template dialog
   */
  openTemplateDialog(item: InboxItem): void {
    this.selectedItem.set(item);
    this.templateName = `Team Standard: ${item.title}`;
    this.templateDescription = "";
    this.templateCategory = "recovery";
    this.templateType = "micro_session";
    this.templateAppliesYouth = true;
    this.templateAppliesAdults = true;
    this.templateIsDefault = false;
    this.templateDialogVisible = true;
  }

  /**
   * Phase 2: Save as team template
   */
  async saveAsTemplate(): Promise<void> {
    const item = this.selectedItem();
    if (!item || !this.templateName.trim()) return;

    this.saving.set(true);

    try {
      const response = await this.apiService
        .post<{ id: string }>("/api/team-templates/from-inbox", {
          inbox_item_id: item.id,
          name: this.templateName,
          description: this.templateDescription,
          category: this.templateCategory,
          template_type: this.templateType,
          applies_to_youth: this.templateAppliesYouth,
          applies_to_adults: this.templateAppliesAdults,
          is_default: this.templateIsDefault,
        })
        .toPromise();

      if (response?.success) {
        this.updateLocalItem(item.id, {
          status: "saved_template",
          coach_action: "save_template",
          is_new: false,
        });
        this.toastService.success("Template saved successfully!");
        this.templateDialogVisible = false;
      }
    } catch (error) {
      this.logger.error("Error saving template:", error);
      this.toastService.error("Failed to save template");
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Update local item state
   */
  private updateLocalItem(itemId: string, updates: Partial<InboxItem>): void {
    this.allItems.update((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    );

    // Update stats if status changed from pending
    if (updates.status && updates.status !== "pending") {
      this.stats.update((s) => ({
        ...s,
        total_pending: Math.max(0, s.total_pending - 1),
      }));
    }
  }

  // Helper methods
  getInitials(name: string | undefined): string {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarColor(priority: string): string {
    switch (priority) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f59e0b";
      case "medium":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  }

  getPrioritySeverity(
    priority: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (priority) {
      case "critical":
        return "danger";
      case "high":
        return "warn";
      case "medium":
        return "info";
      default:
        return "secondary";
    }
  }

  getAcwrSeverity(
    zone: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" {
    switch (zone) {
      case "optimal":
        return "success";
      case "detraining":
        return "info";
      case "caution":
        return "warn";
      case "danger":
      case "critical":
        return "danger";
      default:
        return "secondary";
    }
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}
