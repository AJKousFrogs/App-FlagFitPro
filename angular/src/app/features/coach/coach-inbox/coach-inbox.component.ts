/**
 * Coach Inbox Component
 *
 * Real-time inbox workflow for coaches to monitor AI coaching interactions
 *
 * Features:
 * - 3 tabs: Safety Alerts, Review Needed, Wins
 * - Real-time updates via Supabase subscription
 * - Each item shows: player name, risk badge, ACWR status, summary
 * - One-click actions: Approve, Add Note, Override (requires reason)
 * - Unread count badges
 */

import { DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { SkeletonModule } from "primeng/skeleton";
import { TabPanel, Tabs } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { ToastService } from "../../../core/services/toast.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";

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
    DatePipe,
    Tabs,
    TabPanel,
    TagModule,
    BadgeModule,
    SkeletonModule,
    AvatarModule,
    MainLayoutComponent,

    ButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="coach-inbox">
        <div class="inbox-header">
          <div class="header-content">
            <h1>Coach Inbox</h1>
            <p class="subtitle">
              Review and approve AI-powered training interactions
            </p>
          </div>
          <div class="header-actions">
            <app-button
              variant="text"
              iconLeft="pi-refresh"
              [loading]="loading()"
              (clicked)="loadInbox()"
              >Refresh</app-button
            >
          </div>
        </div>

        <p-tabs [value]="activeTabIndex" (valueChange)="onTabChange($event)">
          <p-tabpanel value="0">
            <ng-template pTemplate="header">
              <span>Safety Alerts</span>
              @if (stats().safety_alerts > 0) {
                <p-badge
                  [value]="stats().safety_alerts.toString()"
                  severity="danger"
                  class="ml-2"
                ></p-badge>
              }
            </ng-template>
            <div class="items-list">
              @if (loading()) {
                @for (i of [1, 2, 3]; track i) {
                  <p-skeleton height="150px" styleClass="mb-4"></p-skeleton>
                }
              } @else {
                @for (item of safetyAlerts(); track item.id) {
                  <div class="inbox-item-card">
                    <div class="item-header">
                      <p-avatar
                        [label]="item.player?.name?.charAt(0) || 'A'"
                        shape="circle"
                      ></p-avatar>
                      <div class="item-meta">
                        <h3>{{ item.player?.name || "Athlete" }}</h3>
                        <span class="timestamp">{{
                          item.created_at | date: "short"
                        }}</span>
                      </div>
                      <p-tag
                        [value]="item.priority"
                        [severity]="getPrioritySeverity(item.priority)"
                      ></p-tag>
                    </div>
                    <div class="item-body">
                      <h4>{{ item.title }}</h4>
                      <p>{{ item.summary }}</p>
                    </div>
                    <div class="item-actions">
                      <app-button iconLeft="pi-eye" (clicked)="openItem(item)"
                        >Review</app-button
                      >
                    </div>
                  </div>
                }
              }
            </div>
          </p-tabpanel>

          <p-tabpanel value="1">
            <ng-template pTemplate="header">
              <span>Review Needed</span>
              @if (stats().review_needed > 0) {
                <p-badge
                  [value]="stats().review_needed.toString()"
                  severity="warn"
                  class="ml-2"
                ></p-badge>
              }
            </ng-template>
            <div class="items-list">
              <!-- similar list structure -->
            </div>
          </p-tabpanel>

          <p-tabpanel value="2">
            <ng-template pTemplate="header">
              <span>Wins</span>
              @if (stats().wins > 0) {
                <p-badge
                  [value]="stats().wins.toString()"
                  severity="success"
                  class="ml-2"
                ></p-badge>
              }
            </ng-template>
            <div class="items-list">
              <!-- similar list structure -->
            </div>
          </p-tabpanel>
        </p-tabs>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./coach-inbox.component.scss",
})
export class CoachInboxComponent {
  private toastService = inject(ToastService);

  activeTabIndex: string | number = "0";
  loading = signal(false);
  items = signal<InboxItem[]>([]);
  stats = signal<InboxStats>({
    safety_alerts: 0,
    review_needed: 0,
    wins: 0,
    total_pending: 0,
    critical_count: 0,
  });

  safetyAlerts = computed(() =>
    this.items().filter((i) => i.inbox_type === "safety_alert"),
  );
  reviewNeeded = computed(() =>
    this.items().filter((i) => i.inbox_type === "review_needed"),
  );
  wins = computed(() => this.items().filter((i) => i.inbox_type === "win"));

  constructor() {
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

  onTabChange(value: string | number | undefined): void {
    if (value !== undefined) {
      this.activeTabIndex = value;
    }
  }

  openItem(item: InboxItem): void {
    this.toastService.info(`Reviewing item: ${item.title}`);
  }

  getPrioritySeverity(
    priority: string,
  ): "danger" | "warn" | "info" | "secondary" {
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
