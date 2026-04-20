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
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { firstValueFrom } from "rxjs";
import { AvatarComponent } from "../../../shared/components/avatar/avatar.component";
import { BadgeComponent } from "../../../shared/components/badge/badge.component";
import { TabPanel, Tabs } from "primeng/tabs";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import {
  CoachInboxListResponseDTO,
  InboxItemDTO,
  InboxStatsSchema,
  CoachInboxListResponseSchema,
} from "../../../core/schemas/api-response.schema";
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
type InboxPriorityFilter = "all" | "critical" | "high" | "medium" | "low" | "unread";

interface CoachInboxEntryContext {
  title: string;
  message: string;
}

@Component({
  selector: "app-coach-inbox",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
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
  templateUrl: "./coach-inbox.component.html",
  styleUrl: "./coach-inbox.component.scss",
})
export class CoachInboxComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiService = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
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
  searchQuery = signal("");
  priorityFilter = signal<InboxPriorityFilter>("all");
  selectedItem = signal<InboxItem | null>(null);
  items = signal<InboxItem[]>([]);
  entryContext = signal<CoachInboxEntryContext | null>(null);
  merlinSessionId = signal<string | null>(null);
  merlinReturnDraft = signal(
    "I reviewed Coach Inbox. Help me decide the next coaching action.",
  );
  readonly priorityFilterOptions: Array<{
    value: InboxPriorityFilter;
    label: string;
  }> = [
    { value: "all", label: "All" },
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "unread", label: "Unread" },
  ];
  stats = signal<InboxStats>({
    safety_alerts: 0,
    review_needed: 0,
    wins: 0,
    total_pending: 0,
    critical_count: 0,
  });

  filteredItems = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const priority = this.priorityFilter();

    return this.items().filter((item) => {
      if (priority === "unread" && !item.is_new) {
        return false;
      }

      if (
        priority !== "all" &&
        priority !== "unread" &&
        item.priority !== priority
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        item.player?.name,
        item.player?.position,
        item.title,
        item.summary,
        item.source_type,
        item.intent_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  });
  safetyAlerts = computed(() =>
    this.filteredItems().filter((item) => item.inbox_type === "safety_alert"),
  );
  reviewNeeded = computed(() =>
    this.filteredItems().filter((item) => item.inbox_type === "review_needed"),
  );
  wins = computed(() =>
    this.filteredItems().filter((item) => item.inbox_type === "win"),
  );
  activeFilterSummary = computed(() => {
    const filteredCount = this.filteredItems().length;
    const totalCount = this.items().length;
    const priorityLabel =
      this.priorityFilterOptions.find(
        (option) => option.value === this.priorityFilter(),
      )?.label ?? "All";

    if (!this.searchQuery().trim() && this.priorityFilter() === "all") {
      return `${totalCount} inbox items available`;
    }

    return `${filteredCount} of ${totalCount} items shown · ${priorityLabel} filter`;
  });

  private inboxChannel: RealtimeChannel | null = null;

  constructor() {
    this.observeRouteContext();
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

    const items$ = this.apiService.get<CoachInboxListResponseDTO>(
      API_ENDPOINTS.coach.inbox,
      { limit: 100 },
      { schema: CoachInboxListResponseSchema, throwOnValidationError: false },
    );
    const stats$ = this.apiService.get<InboxStats>(
      API_ENDPOINTS.coach.inboxStats,
      undefined,
      { schema: InboxStatsSchema, throwOnValidationError: false },
    );

    Promise.all([firstValueFrom(items$), firstValueFrom(stats$)])
      .then(([itemsResponse, statsResponse]) => {
        this.items.set(
          (itemsResponse.data?.items ?? []).map((item) =>
            this.normalizeInboxItem(item),
          ),
        );
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

  setPriorityFilter(priority: InboxPriorityFilter): void {
    this.priorityFilter.set(priority);
  }

  private observeRouteContext(): void {
    this.route.queryParamMap.subscribe((queryParams) => {
      const source = queryParams.get("source");
      const focus = queryParams.get("focus");
      if (source === "merlin") {
        this.merlinSessionId.set(queryParams.get("session"));
        this.merlinReturnDraft.set(this.buildMerlinReturnDraft(focus));
        this.consumeMerlinRouteParams(["source", "focus", "session"]);
        if (focus === "review-needed") {
          this.activeTabIndex = "1";
          this.entryContext.set({
            title: "Merlin sent you here for coach review",
            message:
              "Review the athlete context, confirm the recommendation, and decide whether to approve, note, or override it.",
          });
          return;
        }

        this.entryContext.set({
          title: "Merlin sent you here for coach follow-through",
          message:
            "Use Coach Inbox to review athlete issues, add context, and resolve items that need manual coach action.",
        });
      }
    });
  }

  private buildMerlinReturnDraft(focus: string | null): string {
    if (focus === "review-needed") {
      return "I reviewed Coach Inbox. Help me think through the recommendation and the best coaching decision.";
    }

    return "I reviewed Coach Inbox. Help me decide the next coaching action.";
  }

  private consumeMerlinRouteParams(paramNames: string[]): void {
    const consumedParams = Object.fromEntries(
      paramNames.map((paramName) => [paramName, null]),
    );

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: consumedParams,
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  dismissEntryContext(): void {
    this.entryContext.set(null);
  }

  async approveItem(item: InboxItem): Promise<void> {
    this.dismissEntryContext();
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
    this.dismissEntryContext();
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
    this.dismissEntryContext();
    this.selectedItem.set(item);
    this.actionDialogMode.set("note");
    this.actionDialogText.set(item.coach_notes ?? "");
    this.showActionDialog.set(true);
  }

  openOverrideDialog(item: InboxItem): void {
    this.dismissEntryContext();
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

  private normalizeInboxItem(item: InboxItemDTO): InboxItem {
    return {
      ...item,
      coach_id: "",
      team_id: "",
      athlete_context: {},
    };
  }
}
