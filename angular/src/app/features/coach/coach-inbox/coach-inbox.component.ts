/**
 * Coach Inbox Component
 *
 * Real-time inbox workflow for coaches to monitor Merlin AI coaching interactions.
 */

import { DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { firstValueFrom } from "rxjs";
import { AvatarComponent } from "../../../shared/components/avatar/avatar.component";
import { BadgeComponent } from "../../../shared/components/badge/badge.component";
import { TabPanel, Tabs } from "primeng/tabs";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";

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

interface CoachInboxListResponse {
  items: InboxItem[];
  total: number;
}

type InboxActionMode = "note" | "override";

@Component({
  selector: "app-coach-inbox",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    Tabs,
    TabPanel,
    StatusTagComponent,
    BadgeComponent,
    AvatarComponent,
    MainLayoutComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    ButtonComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  template: `
    <app-main-layout>
      <div class="coach-inbox">
        <div class="inbox-header">
          <div class="header-content">
            <h1>Coach Inbox</h1>
            <p class="subtitle">
              Review and act on team alerts, requests, and wins.
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

        @if (loading()) {
          <app-loading message="Loading coach inbox..." />
        } @else if (pageError()) {
          <app-page-error-state
            title="Could not load coach inbox"
            [message]="pageError() ?? 'Please try again.'"
            actionLabel="Retry"
            (action)="loadInbox()"
          />
        } @else {
          <p-tabs [value]="activeTabIndex" (valueChange)="onTabChange($event)">
            <p-tabpanel value="0">
              <ng-template #header>
                <span>Safety Alerts</span>
                @if (stats().safety_alerts > 0) {
                  <app-badge variant="danger" class="ml-2">{{ stats().safety_alerts }}</app-badge>
                }
              </ng-template>
              <div class="items-list">
                @if (safetyAlerts().length === 0) {
                  <div class="empty-state">
                    <h3>No safety alerts</h3>
                    <p>Critical athlete issues will appear here.</p>
                  </div>
                } @else {
                  @for (item of safetyAlerts(); track item.id) {
                    <article class="inbox-item-card" [class.is-new]="item.is_new">
                      <div class="item-header">
                        <app-avatar
                          [label]="item.player?.name?.charAt(0) || 'A'"
                          shape="circle"
                        />
                        <div class="item-meta">
                          <div class="item-title-row">
                            <h3>{{ item.player?.name || "Athlete" }}</h3>
                            @if (item.is_new) {
                              <app-badge variant="info">New</app-badge>
                            }
                          </div>
                          <span class="timestamp">{{
                            item.created_at | date: "short"
                          }}</span>
                        </div>
                        <app-status-tag
                          [value]="item.priority"
                          [severity]="getPrioritySeverity(item.priority)"
                          size="sm"
                        />
                      </div>
                      <div class="item-body">
                        <h4>{{ item.title }}</h4>
                        <p>{{ item.summary }}</p>
                      </div>
                      <div class="item-actions">
                        <app-button
                          variant="secondary"
                          iconLeft="pi-eye"
                          [loading]="itemLoadingId() === item.id"
                          (clicked)="openItem(item)"
                          >Review</app-button
                        >
                        <app-button
                          variant="text"
                          iconLeft="pi-file-edit"
                          [disabled]="actionLoadingId() === item.id"
                          (clicked)="openNoteDialog(item)"
                          >Add Note</app-button
                        >
                        <app-button
                          variant="danger"
                          iconLeft="pi-shield"
                          [disabled]="actionLoadingId() === item.id"
                          (clicked)="openOverrideDialog(item)"
                          >Override</app-button
                        >
                      </div>
                    </article>
                  }
                }
              </div>
            </p-tabpanel>

            <p-tabpanel value="1">
              <ng-template #header>
                <span>Review Needed</span>
                @if (stats().review_needed > 0) {
                  <app-badge variant="warning" class="ml-2">{{ stats().review_needed }}</app-badge>
                }
              </ng-template>
              <div class="items-list">
                @if (reviewNeeded().length === 0) {
                  <div class="empty-state">
                    <h3>No items waiting on review</h3>
                    <p>Program requests and approvals will appear here.</p>
                  </div>
                } @else {
                  @for (item of reviewNeeded(); track item.id) {
                    <article class="inbox-item-card" [class.is-new]="item.is_new">
                      <div class="item-header">
                        <app-avatar
                          [label]="item.player?.name?.charAt(0) || 'A'"
                          shape="circle"
                        />
                        <div class="item-meta">
                          <div class="item-title-row">
                            <h3>{{ item.player?.name || "Athlete" }}</h3>
                            @if (item.is_new) {
                              <app-badge variant="info">New</app-badge>
                            }
                          </div>
                          <span class="timestamp">{{
                            item.created_at | date: "short"
                          }}</span>
                        </div>
                        <app-status-tag
                          [value]="item.priority"
                          [severity]="getPrioritySeverity(item.priority)"
                          size="sm"
                        />
                      </div>
                      <div class="item-body">
                        <h4>{{ item.title }}</h4>
                        <p>{{ item.summary }}</p>
                      </div>
                      <div class="item-actions">
                        <app-button
                          iconLeft="pi-check"
                          [loading]="actionLoadingId() === item.id"
                          (clicked)="approveItem(item)"
                          >Approve</app-button
                        >
                        <app-button
                          variant="text"
                          iconLeft="pi-file-edit"
                          [disabled]="actionLoadingId() === item.id"
                          (clicked)="openNoteDialog(item)"
                          >Add Note</app-button
                        >
                        <app-button
                          variant="secondary"
                          iconLeft="pi-eye"
                          [loading]="itemLoadingId() === item.id"
                          (clicked)="openItem(item)"
                          >Review</app-button
                        >
                      </div>
                    </article>
                  }
                }
              </div>
            </p-tabpanel>

            <p-tabpanel value="2">
              <ng-template #header>
                <span>Wins</span>
                @if (stats().wins > 0) {
                  <app-badge variant="success" class="ml-2 status-tag status-tag--success">{{ stats().wins }}</app-badge>
                }
              </ng-template>
              <div class="items-list">
                @if (wins().length === 0) {
                  <div class="empty-state">
                    <h3>No recent wins</h3>
                    <p>Positive streaks and completed actions will appear here.</p>
                  </div>
                } @else {
                  @for (item of wins(); track item.id) {
                    <article class="inbox-item-card" [class.is-new]="item.is_new">
                      <div class="item-header">
                        <app-avatar
                          [label]="item.player?.name?.charAt(0) || 'A'"
                          shape="circle"
                        />
                        <div class="item-meta">
                          <div class="item-title-row">
                            <h3>{{ item.player?.name || "Athlete" }}</h3>
                            @if (item.is_new) {
                              <app-badge variant="info">New</app-badge>
                            }
                          </div>
                          <span class="timestamp">{{
                            item.created_at | date: "short"
                          }}</span>
                        </div>
                        <app-status-tag
                          [value]="item.priority"
                          [severity]="getPrioritySeverity(item.priority)"
                          size="sm"
                        />
                      </div>
                      <div class="item-body">
                        <h4>{{ item.title }}</h4>
                        <p>{{ item.summary }}</p>
                      </div>
                      <div class="item-actions">
                        <app-button
                          variant="text"
                          iconLeft="pi-file-edit"
                          [disabled]="actionLoadingId() === item.id"
                          (clicked)="openNoteDialog(item)"
                          >Add Note</app-button
                        >
                        <app-button
                          variant="secondary"
                          iconLeft="pi-eye"
                          [loading]="itemLoadingId() === item.id"
                          (clicked)="openItem(item)"
                          >Open</app-button
                        >
                      </div>
                    </article>
                  }
                }
              </div>
            </p-tabpanel>
          </p-tabs>
        }
      </div>

      <app-dialog
        [visible]="showActionDialog()"
        (visibleChange)="showActionDialog.set($event)"
        [closable]="false"
        [draggable]="false"
        [resizable]="false"
        [dismissableMask]="true"
        [styleClass]="'coach-inbox-dialog'"
      >
        <app-dialog-header
          [icon]="actionDialogMode() === 'override' ? 'shield' : 'file-edit'"
          [title]="actionDialogMode() === 'override' ? 'Override Recommendation' : 'Add Coach Note'"
          [subtitle]="selectedItem() ? selectedItem()!.title : ''"
          [danger]="actionDialogMode() === 'override'"
          (close)="closeActionDialog()"
        ></app-dialog-header>

        <div class="dialog-copy">
          @if (selectedItem()) {
            <p>
              <strong>{{ selectedItem()!.player?.name || "Athlete" }}</strong>
              <span>{{ selectedItem()!.summary }}</span>
            </p>
          }
        </div>

        <label class="dialog-label" for="coachInboxActionText">
          {{
            actionDialogMode() === "override"
              ? "Reason for override"
              : "Coach note"
          }}
        </label>
        <textarea
          id="coachInboxActionText"
          class="dialog-textarea"
          [value]="actionDialogText()"
          (input)="onActionDialogTextChange($event)"
          [attr.placeholder]="
            actionDialogMode() === 'override'
              ? 'Explain why you are overriding this recommendation...'
              : 'Add context or follow-up guidance for this inbox item...'
          "
          rows="5"
        ></textarea>

        <app-dialog-footer
          cancelLabel="Cancel"
          [primaryLabel]="actionDialogMode() === 'override' ? 'Save Override' : 'Save Note'"
          [primaryIcon]="actionDialogMode() === 'override' ? 'shield' : 'check'"
          [primaryVariant]="actionDialogMode() === 'override' ? 'danger' : 'primary'"
          [loading]="dialogSubmitting()"
          [disabled]="!actionDialogText().trim()"
          (cancel)="closeActionDialog()"
          (primary)="submitActionDialog()"
        ></app-dialog-footer>
      </app-dialog>
    </app-main-layout>
  `,
  styleUrl: "./coach-inbox.component.scss",
})
export class CoachInboxComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiService = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);
  private readonly toastService = inject(ToastService);

  activeTabIndex: string | number = "0";
  loading = signal(false);
  itemLoadingId = signal<string | null>(null);
  actionLoadingId = signal<string | null>(null);
  pageError = signal<string | null>(null);
  showActionDialog = signal(false);
  actionDialogMode = signal<InboxActionMode>("note");
  actionDialogText = signal("");
  dialogSubmitting = signal(false);
  selectedItem = signal<InboxItem | null>(null);
  items = signal<InboxItem[]>([]);
  stats = signal<InboxStats>({
    safety_alerts: 0,
    review_needed: 0,
    wins: 0,
    total_pending: 0,
    critical_count: 0,
  });

  safetyAlerts = computed(() =>
    this.items().filter((item) => item.inbox_type === "safety_alert"),
  );
  reviewNeeded = computed(() =>
    this.items().filter((item) => item.inbox_type === "review_needed"),
  );
  wins = computed(() => this.items().filter((item) => item.inbox_type === "win"));

  private inboxChannel: RealtimeChannel | null = null;

  constructor() {
    this.loadInbox();
    this.subscribeToRealtime();
    this.destroyRef.onDestroy(() => {
      if (this.inboxChannel) {
        this.supabaseService.client.removeChannel(this.inboxChannel);
        this.inboxChannel = null;
      }
    });
  }

  loadInbox(showLoading = true): void {
    if (showLoading) {
      this.loading.set(true);
    }
    this.pageError.set(null);

    const items$ = this.apiService.get<CoachInboxListResponse>(
      API_ENDPOINTS.coach.inbox,
      { limit: 100 },
    );
    const stats$ = this.apiService.get<InboxStats>(API_ENDPOINTS.coach.inboxStats);

    Promise.all([firstValueFrom(items$), firstValueFrom(stats$)])
      .then(([itemsResponse, statsResponse]) => {
        this.items.set(itemsResponse.data?.items ?? []);
        this.stats.set(
          statsResponse.data ?? {
            safety_alerts: 0,
            review_needed: 0,
            wins: 0,
            total_pending: 0,
            critical_count: 0,
          },
        );
      })
      .catch((error: unknown) => {
        this.logger.error("coach_inbox_load_failed", error);
        this.pageError.set("Coach inbox could not be loaded right now.");
      })
      .finally(() => {
        this.loading.set(false);
      });
  }

  onTabChange(value: string | number | undefined): void {
    if (value !== undefined) {
      this.activeTabIndex = value;
    }
  }

  async approveItem(item: InboxItem): Promise<void> {
    this.actionLoadingId.set(item.id);

    try {
      await firstValueFrom(
        this.apiService.patch(API_ENDPOINTS.coach.inboxDetail(item.id), {
          action: "approve",
          status: "approved",
        }),
      );
      this.patchLocalItem(item.id, {
        coach_action: "approve",
        status: "approved",
        is_new: false,
        viewed_at: item.viewed_at ?? new Date().toISOString(),
        actioned_at: new Date().toISOString(),
      });
      this.toastService.success("Inbox item approved.");
    } catch (error) {
      this.logger.error("coach_inbox_approve_failed", error, {
        itemId: item.id,
      });
      this.toastService.error("Unable to approve inbox item. Please try again.");
    } finally {
      this.actionLoadingId.set(null);
    }
  }

  async openItem(item: InboxItem): Promise<void> {
    this.itemLoadingId.set(item.id);

    try {
      if (item.is_new || !item.viewed_at) {
        await firstValueFrom(
          this.apiService.post(API_ENDPOINTS.coach.inboxMarkViewed(item.id), {}),
        );
        this.patchLocalItem(item.id, {
          is_new: false,
          viewed_at: new Date().toISOString(),
          status: item.status === "pending" ? "viewed" : item.status,
        });
      }

      const destination = this.resolveItemDestination(item);
      if (!destination) {
        this.toastService.info(item.summary || item.title, item.title);
        return;
      }

      await this.router.navigate(destination.commands, {
        queryParams: destination.queryParams,
      });
    } catch (error) {
      this.logger.error("coach_inbox_open_failed", error, {
        itemId: item.id,
      });
      this.toastService.error("Unable to open inbox item. Please try again.");
    } finally {
      this.itemLoadingId.set(null);
    }
  }

  getPrioritySeverity(
    priority: string,
  ): "danger" | "warning" | "info" | "secondary" {
    switch (priority) {
      case "critical":
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "secondary";
    }
  }

  openNoteDialog(item: InboxItem): void {
    this.selectedItem.set(item);
    this.actionDialogMode.set("note");
    this.actionDialogText.set(item.coach_notes ?? "");
    this.showActionDialog.set(true);
  }

  openOverrideDialog(item: InboxItem): void {
    this.selectedItem.set(item);
    this.actionDialogMode.set("override");
    this.actionDialogText.set(item.override_reason ?? "");
    this.showActionDialog.set(true);
  }

  closeActionDialog(): void {
    if (this.dialogSubmitting()) {
      return;
    }
    this.showActionDialog.set(false);
    this.selectedItem.set(null);
    this.actionDialogText.set("");
    this.actionDialogMode.set("note");
  }

  onActionDialogTextChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement | null)?.value ?? "";
    this.actionDialogText.set(value);
  }

  async submitActionDialog(): Promise<void> {
    const item = this.selectedItem();
    const text = this.actionDialogText().trim();
    if (!item || !text) {
      return;
    }

    this.dialogSubmitting.set(true);

    try {
      const mode = this.actionDialogMode();
      const payload =
        mode === "override"
          ? {
              action: "override",
              status: "overridden",
              override_reason: text,
            }
          : {
              action: "add_note",
              status: "noted",
              notes: text,
            };

      await firstValueFrom(
        this.apiService.patch(API_ENDPOINTS.coach.inboxDetail(item.id), payload),
      );

      this.patchLocalItem(item.id, {
        coach_action: payload.action,
        status: payload.status,
        coach_notes: mode === "note" ? text : item.coach_notes,
        override_reason: mode === "override" ? text : item.override_reason,
        is_new: false,
        viewed_at: item.viewed_at ?? new Date().toISOString(),
        actioned_at: new Date().toISOString(),
      });

      this.toastService.success(
        mode === "override" ? "Override saved." : "Coach note saved.",
      );
      this.closeActionDialog();
    } catch (error) {
      this.logger.error("coach_inbox_update_failed", error, {
        itemId: item.id,
        mode: this.actionDialogMode(),
      });
      this.toastService.error("Unable to save inbox action. Please try again.");
    } finally {
      this.dialogSubmitting.set(false);
    }
  }

  private patchLocalItem(itemId: string, updates: Partial<InboxItem>): void {
    this.items.update((items) => {
      const nextItems = items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      );
      this.stats.set(this.computeStats(nextItems));
      return nextItems;
    });
  }

  private resolveItemDestination(
    item: InboxItem,
  ):
    | {
        commands: string[];
        queryParams?: Record<string, string>;
      }
    | null {
    if (item.source_type === "team_template") {
      return {
        commands: ["/coach/program-builder"],
        queryParams: { source: "inbox", item: item.id },
      };
    }

    if (
      item.risk_level === "injury" ||
      item.intent_type === "return_to_play" ||
      item.source_type === "return_to_play"
    ) {
      return {
        commands: ["/coach/injuries"],
        queryParams: {
          player: item.player_id,
          source: "inbox",
          item: item.id,
        },
      };
    }

    if (item.player_id) {
      return {
        commands: ["/coach/development"],
        queryParams: {
          player: item.player_id,
          source: "inbox",
          item: item.id,
        },
      };
    }

    if (item.source_type === "ai_message") {
      return {
        commands: ["/team-chat"],
        queryParams: {
          source: "inbox",
          item: item.id,
        },
      };
    }

    return null;
  }

  private subscribeToRealtime(): void {
    const coachId = this.supabaseService.userId();
    if (!coachId) {
      return;
    }

    this.inboxChannel = this.supabaseService.subscribeToCoachInbox(
      coachId,
      () => this.loadInbox(false),
      () => this.loadInbox(false),
    );
  }

  private computeStats(items: InboxItem[]): InboxStats {
    return {
      safety_alerts: items.filter(
        (item) => item.inbox_type === "safety_alert" && item.status === "pending",
      ).length,
      review_needed: items.filter(
        (item) => item.inbox_type === "review_needed" && item.status === "pending",
      ).length,
      wins: items.filter((item) => item.inbox_type === "win").length,
      total_pending: items.filter((item) => item.status === "pending").length,
      critical_count: items.filter(
        (item) => item.priority === "critical" && item.status === "pending",
      ).length,
    };
  }
}
