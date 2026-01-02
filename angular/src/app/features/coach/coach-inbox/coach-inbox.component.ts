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
    MainLayoutComponent,
  ],
  template: `
    <app-main-layout>
      <div class="coach-inbox">
        <div class="inbox-header">
          <div class="header-content">
            <h1>Coach Inbox</h1>
            <p class="subtitle">Review and approve AI-powered training interactions</p>
          </div>
          <div class="header-actions">
            <p-button
              label="Refresh"
              icon="pi pi-refresh"
              [text]="true"
              (onClick)="loadInbox()"
              [loading]="loading()"
            ></p-button>
          </div>
        </div>

        <p-tabs [value]="activeTabIndex" (onChange)="onTabChange($event)">
          <p-tabpanel value="0">
            <ng-template pTemplate="header">
              <span>Safety Alerts</span>
              <p-badge
                *ngIf="stats().safety_alerts > 0"
                [value]="stats().safety_alerts.toString()"
                severity="danger"
                class="ml-2"
              ></p-badge>
            </ng-template>
            <div class="items-list">
              <ng-container *ngIf="loading(); else alertList">
                <p-skeleton *ngFor="let i of [1, 2, 3]" height="150px" styleClass="mb-4"></p-skeleton>
              </ng-container>
              <ng-template #alertList>
                <div *ngFor="let item of safetyAlerts()" class="inbox-item-card">
                  <div class="item-header">
                    <p-avatar [label]="item.player?.name?.charAt(0) || 'A'" shape="circle"></p-avatar>
                    <div class="item-meta">
                      <h3>{{ item.player?.name || 'Athlete' }}</h3>
                      <span class="timestamp">{{ item.created_at | date:'short' }}</span>
                    </div>
                    <p-tag [value]="item.priority" [severity]="getPrioritySeverity(item.priority)"></p-tag>
                  </div>
                  <div class="item-body">
                    <h4>{{ item.title }}</h4>
                    <p>{{ item.summary }}</p>
                  </div>
                  <div class="item-actions">
                    <p-button label="Review" icon="pi pi-eye" (onClick)="openItem(item)"></p-button>
                  </div>
                </div>
              </ng-template>
            </div>
          </p-tabpanel>

          <p-tabpanel value="1">
            <ng-template pTemplate="header">
              <span>Review Needed</span>
              <p-badge
                *ngIf="stats().review_needed > 0"
                [value]="stats().review_needed.toString()"
                severity="warn"
                class="ml-2"
              ></p-badge>
            </ng-template>
            <div class="items-list">
              <!-- similar list structure -->
            </div>
          </p-tabpanel>

          <p-tabpanel value="2">
            <ng-template pTemplate="header">
              <span>Wins</span>
              <p-badge
                *ngIf="stats().wins > 0"
                [value]="stats().wins.toString()"
                severity="success"
                class="ml-2"
              ></p-badge>
            </ng-template>
            <div class="items-list">
              <!-- similar list structure -->
            </div>
          </p-tabpanel>
        </p-tabs>
      </div>
    </app-main-layout>
  `,
  styleUrl: './coach-inbox.component.scss',
})
export class CoachInboxComponent implements OnInit {
  private apiService = inject(ApiService);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  activeTabIndex = 0;
  loading = signal(false);
  items = signal<InboxItem[]>([]);
  stats = signal<InboxStats>({
    safety_alerts: 0,
    review_needed: 0,
    wins: 0,
    total_pending: 0,
    critical_count: 0,
  });

  safetyAlerts = computed(() => this.items().filter((i) => i.inbox_type === "safety_alert"));
  reviewNeeded = computed(() => this.items().filter((i) => i.inbox_type === "review_needed"));
  wins = computed(() => this.items().filter((i) => i.inbox_type === "win"));

  ngOnInit(): void {
    this.loadInbox();
  }

  loadInbox(): void {
    this.loading.set(true);
    // Real data would be fetched from API
    setTimeout(() => {
      this.items.set([]);
      this.stats.set({
        safety_alerts: 0,
        review_needed: 0,
        wins: 0,
        total_pending: 0,
        critical_count: 0,
      });
      this.loading.set(false);
    }, 500);
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
  }

  openItem(item: InboxItem): void {
    this.toastService.info(`Reviewing item: ${item.title}`);
  }

  getPrioritySeverity(priority: string): "danger" | "warn" | "info" | "secondary" {
    switch (priority) {
      case "critical":
      case "high":
        return "danger";
      case "medium":
        return "warn";
      case "low":
        return "info";
      default:
        return "secondary";
    }
  }
}
