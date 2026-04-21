/**
 * Enhanced Chat Component
 *
 * Full-featured team communication with:
 * - Channel-based messaging (announcements, general, coaches-only, position groups)
 * - Role-based permissions (coaches can pin, mark important, create channels)
 * - @mentions with notifications
 * - Real-time updates
 * - Read receipts for announcements
 * - Message pinning and importance flags
 */

import { ScrollingModule } from "@angular/cdk/scrolling";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { AvatarComponent } from "../../shared/components/avatar/avatar.component";
import { BadgeComponent } from "../../shared/components/badge/badge.component";
import { Tooltip } from "primeng/tooltip";
import { FormInputComponent } from "../../shared/components/form-input/form-input.component";
import { TIMEOUTS } from "../../core/constants/app.constants";
import { TOAST } from "../../core/constants/toast-messages.constants";
import {
  Channel,
  ChannelMemberDetails,
  ChannelMembersResponse,
  ChannelService,
  ChannelType,
  ChatMessage,
} from "../../core/services/channel.service";
import { PresenceService } from "../../core/services/presence.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { DialogService } from "../../core/ui/dialog.service";
import { AlertComponent } from "../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { getTimeAgo } from "../../shared/utils/date.utils";
import { getInitials } from "../../shared/utils/format.utils";
import {
  ChatChannelCreateRequest,
  ChatCreateChannelDialogComponent,
} from "./components/chat-create-channel-dialog.component";
import { ChatMembersDialogComponent } from "./components/chat-members-dialog.component";
import { ChatPinnedMessagesDialogComponent } from "./components/chat-pinned-messages-dialog.component";

@Component({
  selector: "app-chat",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AvatarComponent,
    BadgeComponent,
    ScrollingModule,
    Tooltip,
    MainLayoutComponent,
    AlertComponent,
    ButtonComponent,
    IconButtonComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    StatusTagComponent,
    ChatCreateChannelDialogComponent,
    ChatMembersDialogComponent,
    ChatPinnedMessagesDialogComponent,
    FormInputComponent,
  ],
  templateUrl: "./chat.component.html",

  styleUrl: "./chat.component.scss",
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  scrollViewport = viewChild.required<ElementRef>("scrollViewport");
  // Template reference for messages list scrolling
  readonly messagesList = viewChild<ElementRef<HTMLElement>>("messagesList");

  // Services
  private toastService = inject(ToastService);
  private supabase = inject(SupabaseService);
  private channelService = inject(ChannelService);
  private presenceService = inject(PresenceService);
  private dialogService = inject(DialogService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // State from services
  readonly currentChannel = this.channelService.currentChannel;
  readonly channels = this.channelService.channels;
  readonly messages = this.channelService.messages;
  readonly isLoading = this.channelService.loading;
  readonly loadError = this.channelService.error;
  readonly pinnedMessages = this.channelService.pinnedMessages;
  readonly announcementChannels = this.channelService.announcementChannels;
  readonly teamChannels = this.channelService.teamChannels;
  readonly coachChannels = this.channelService.coachChannels;
  readonly dmChannels = this.channelService.dmChannels;
  readonly channelSections = computed(() => {
    const sections: {
      title: string;
      sectionIcon: string;
      itemIcon: string;
      channels: Channel[];
    }[] = [];

    if (this.isCoach() && this.coachChannels().length > 0) {
      sections.push({
        title: "Coaches Only",
        sectionIcon: "pi pi-lock",
        itemIcon: "pi pi-lock",
        channels: this.coachChannels(),
      });
    }

    if (this.dmChannels().length > 0) {
      sections.push({
        title: "Direct Messages",
        sectionIcon: "pi pi-comments",
        itemIcon: "pi pi-user",
        channels: this.dmChannels(),
      });
    }

    return sections;
  });

  // Local state
  newMessage = "";
  markAsImportant = false;
  showCreateChannelDialog = false;
  showPinnedMessages = false;
  showMembersDialog = false;

  // Mention state
  private readonly _showMentionSuggestions = signal(false);
  private readonly _mentionSuggestions = signal<
    { id: string; full_name: string }[]
  >([]);
  private readonly _dismissedImportantId = signal<string | null>(null);

  // Channel members state
  private readonly _channelMembersData = signal<ChannelMembersResponse | null>(
    null,
  );
  private readonly _loadingMembers = signal(false);
  memberSearchQuery = "";

  readonly showMentionSuggestions = computed(() =>
    this._showMentionSuggestions(),
  );
  readonly mentionSuggestions = computed(() => this._mentionSuggestions());
  readonly channelMembersData = computed(() => this._channelMembersData());
  readonly loadingMembers = computed(() => this._loadingMembers());

  // Filtered members based on search with live online status
  readonly filteredCoaches = computed(() => {
    const data = this._channelMembersData();
    if (!data) return [];
    const onlineIds = this.onlineUserIds();
    const query = this.memberSearchQuery.toLowerCase();

    let coaches = data.coaches.map((m) => ({
      ...m,
      is_online: onlineIds.has(m.user_id),
    }));

    if (query) {
      coaches = coaches.filter(
        (m) =>
          m.full_name.toLowerCase().includes(query) ||
          m.email?.toLowerCase().includes(query) ||
          m.position?.toLowerCase().includes(query),
      );
    }

    // Sort: online first, then alphabetically
    return coaches.sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return a.full_name.localeCompare(b.full_name);
    });
  });

  readonly filteredAthletes = computed(() => {
    const data = this._channelMembersData();
    if (!data) return [];
    const onlineIds = this.onlineUserIds();
    const query = this.memberSearchQuery.toLowerCase();

    let athletes = data.athletes.map((m) => ({
      ...m,
      is_online: onlineIds.has(m.user_id),
    }));

    if (query) {
      athletes = athletes.filter(
        (m) =>
          m.full_name.toLowerCase().includes(query) ||
          m.email?.toLowerCase().includes(query) ||
          m.position?.toLowerCase().includes(query) ||
          m.jersey_number?.toString().includes(query),
      );
    }

    // Sort: online first, then alphabetically
    return athletes.sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return a.full_name.localeCompare(b.full_name);
    });
  });

  // Online counts for display
  readonly onlineCoachCount = computed(
    () => this.filteredCoaches().filter((m) => m.is_online).length,
  );

  readonly onlineAthleteCount = computed(
    () => this.filteredAthletes().filter((m) => m.is_online).length,
  );

  // Current channel online count
  readonly currentChannelOnlineCount = computed(() => {
    const channel = this.currentChannel();
    if (!channel) return 0;
    return this.presenceService.getChannelOnlineCount(channel.id);
  });

  // Get online count for any channel (used in template)
  getChannelOnlineCount(channelId: string): number {
    return this.presenceService.getChannelOnlineCount(channelId);
  }

  // Current user - per audit: use currentUser() signal for reactivity
  readonly currentUserId = computed(() => this.supabase.userId());
  readonly isCoach = this.channelService.isCoach;

  // New features
  readonly showQuickReplies = signal(false);
  readonly quickReplyOptions = computed(() => {
    if (this.isCoach()) {
      return [
        "Let's discuss this at practice.",
        "Good effort today, team!",
        "Check the new practice schedule.",
        "Remember to log your readiness!",
      ];
    }
    return ["Copy that, Coach!", "I'll be there.", "Got it, thanks!", "On it!"];
  });

  // Presence state
  readonly teamOnlineUsers = this.presenceService.teamOnlineUsers;
  readonly teamOnlineCount = this.presenceService.teamOnlineCount;
  private readonly onlineUserIds = computed(() =>
    this.presenceService.getOnlineUserIds(),
  );

  // Channel type options
  channelTypeOptions = [
    { label: "Team General", value: "team_general" },
    { label: "Announcements (Coach Only)", value: "announcements" },
    { label: "Coaches Only", value: "coaches_only" },
    { label: "Position Group", value: "position_group" },
  ];

  positionOptions = [
    { label: "Quarterback", value: "QB" },
    { label: "Wide Receiver", value: "WR" },
    { label: "Running Back", value: "RB" },
    { label: "Defensive Back", value: "DB" },
    { label: "Linebacker", value: "LB" },
    { label: "Lineman", value: "OL" },
  ];

  // Realtime subscription cleanup
  private channelSubscription: (() => void) | null = null;
  private currentTeamId: string | null = null;

  // Computed for important message banner
  readonly currentImportantMessage = computed(() => {
    const important = this.channelService.importantMessages();
    const dismissed = this._dismissedImportantId();
    return important.find((m) => m.id !== dismissed) || null;
  });

  async ngOnInit(): Promise<void> {
    await this.loadChannels();
    this.observeRouteContext();

    // Start presence tracking for the team
    const teamId = await this.resolveCurrentTeamId();
    if (teamId) {
      await this.presenceService.startTeamPresence(teamId);
    }
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  async ngOnDestroy(): Promise<void> {
    if (this.channelSubscription) {
      this.channelSubscription();
    }

    // Stop presence tracking
    await this.presenceService.stopTracking();

    this.channelService.clearState();
  }

  // ============================================================================
  // CHANNEL OPERATIONS
  // ============================================================================

  async loadChannels(): Promise<void> {
    try {
      const channels = await this.channelService.loadChannels();

      // Auto-select first channel if none selected
      if (channels.length > 0 && !this.currentChannel()) {
        await this.selectChannel(channels[0]);
      }
    } catch (_error) {
      if (this.channels().length > 0) {
        this.toastService.error(TOAST.ERROR.CHANNEL_LOAD_FAILED);
      }
    }
  }

  private observeRouteContext(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryMap) => {
        void this.applyRouteContext(queryMap);
      });
  }

  private async applyRouteContext(queryMap: ParamMap): Promise<void> {
    const requestedChannelId = queryMap.get("channel");
    const source = queryMap.get("source");
    const group = queryMap.get("group");
    const draft = queryMap.get("draft");

    if (requestedChannelId) {
      const channel = this.channels().find((item) => item.id === requestedChannelId);
      if (channel) {
        await this.selectChannel(channel);
      }
    } else if (source) {
      const fallbackChannel =
        this.teamChannels()[0] ||
        this.announcementChannels()[0] ||
        this.coachChannels()[0] ||
        this.dmChannels()[0];
      if (fallbackChannel && fallbackChannel.id !== this.currentChannel()?.id) {
        await this.selectChannel(fallbackChannel);
      }
    }

    if (draft) {
      this.newMessage = draft;
    }

    if (source === "calendar" && group) {
      this.toastService.info(
        `Opened team chat for ${group} RSVP follow-up.`,
        "Chat Ready",
      );
    }
  }

  async selectChannel(channel: Channel): Promise<void> {
    // Cleanup previous subscription
    if (this.channelSubscription) {
      this.channelSubscription();
    }

    await this.channelService.selectChannel(channel);

    // Update presence to show current channel
    await this.presenceService.setCurrentChannel(channel.id);

    // Subscribe to real-time updates
    this.channelSubscription = this.channelService.subscribeToChannelMessages(
      channel.id,
      () => {
        this.scrollToBottom();
      },
    );

    this.scrollToBottom();
  }

  async createChannel(request: ChatChannelCreateRequest): Promise<void> {
    try {
      const teamId = await this.requireCurrentTeamId(TOAST.ERROR.NO_TEAM_SELECTED);
      if (!teamId) {
        return;
      }

      const channel = await this.channelService.createChannel({
        team_id: teamId,
        name: request.name.toLowerCase().replace(/\s+/g, "-"),
        description: request.description,
        channel_type: request.channelType,
        position_filter:
          request.channelType === "position_group"
            ? request.position
            : undefined,
      });

      this.toastService.success(
        TOAST.SUCCESS.CHANNEL_CREATED.replace("{name}", channel.name),
      );
      this.closeCreateChannelDialog();

      // Select the new channel
      await this.selectChannel(channel);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.CHANNEL_CREATE_FAILED);
    }
  }

  onMessageFieldInput(value: string): void {
    this.newMessage = value;
    this.updateMentionSuggestions(value);
  }

  onMemberSearchQueryChange(value: string): void {
    this.memberSearchQuery = value;
  }

  private readInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  // ============================================================================
  // MESSAGE OPERATIONS
  // ============================================================================

  async sendMessage(): Promise<void> {
    const channel = this.currentChannel();
    if (!this.newMessage.trim() || !channel) return;

    try {
      // Parse mentions from message
      const mentions = this.parseMentions(this.newMessage);

      await this.channelService.sendMessage({
        channel_id: channel.id,
        message: this.newMessage,
        is_important: this.markAsImportant,
        mentions: mentions,
      });

      this.newMessage = "";
      this.markAsImportant = false;
      this._showMentionSuggestions.set(false);

      setTimeout(() => this.scrollToBottom(), TIMEOUTS.UI_MICRO_DELAY);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.MESSAGE_SEND_FAILED);
    }
  }

  async togglePin(message: ChatMessage): Promise<void> {
    try {
      await this.channelService.togglePinMessage(message.id);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.PIN_UPDATE_FAILED);
    }
  }

  async toggleImportant(message: ChatMessage): Promise<void> {
    try {
      await this.channelService.toggleImportantMessage(message.id);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.IMPORTANCE_UPDATE_FAILED);
    }
  }

  async deleteMessage(message: ChatMessage): Promise<void> {
    const confirmed = await this.dialogService.confirm("Delete this message?");
    if (!confirmed) return;

    try {
      await this.channelService.deleteMessage(message.id);
      this.toastService.success(TOAST.SUCCESS.MESSAGE_DELETED);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.MESSAGE_DELETE_FAILED);
    }
  }

  async startEditing(message: ChatMessage): Promise<void> {
    const newContent = await this.dialogService.prompt(
      "Edit message:",
      message.message,
      "Edit Message",
    );
    const trimmedContent = newContent?.trim();
    if (!trimmedContent || trimmedContent === message.message) {
      return;
    }

    try {
      await this.channelService.editMessage(message.id, trimmedContent);
      this.toastService.success("Message updated");
    } catch (_error) {
      this.toastService.error("Failed to update message");
    }
  }

  dismissImportantBanner(): void {
    const important = this.currentImportantMessage();
    if (important) {
      this._dismissedImportantId.set(important.id);
    }
  }

  // ============================================================================
  // MENTION HANDLING
  // ============================================================================

  private updateMentionSuggestions(input: string): void {
    const lastWord = input.split(/\s/).pop() || "";

    if (lastWord.startsWith("@") && lastWord.length > 1) {
      const query = lastWord.slice(1).toLowerCase();
      this.searchMembers(query);
    } else {
      this._showMentionSuggestions.set(false);
    }
  }

  triggerMentionPicker(): void {
    this.newMessage += "@";
    this.searchMembers("");
  }

  async searchMembers(query: string): Promise<void> {
    try {
      const teamId = await this.resolveCurrentTeamId();
      if (!teamId) {
        this._showMentionSuggestions.set(false);
        return;
      }

      const members = await this.channelService.searchTeamMembers(
        teamId,
        query,
      );
      const suggestions = members.map((m) => ({
        id: m.user_id,
        full_name: m.full_name,
      }));

      this._mentionSuggestions.set(suggestions);
      this._showMentionSuggestions.set(suggestions.length > 0);
    } catch (_error) {
      // Fallback to empty suggestions on error
      this._showMentionSuggestions.set(false);
    }
  }

  insertMention(member: { id: string; full_name: string }): void {
    // Replace the @query with the full mention
    const parts = this.newMessage.split("@");
    parts.pop(); // Remove the partial query
    this.newMessage = parts.join("@") + `@${member.full_name} `;
    this._showMentionSuggestions.set(false);
  }

  private parseMentions(message: string): string[] {
    // Extract mentioned user IDs
    // In real implementation, would resolve names to IDs
    const matches = message.match(/@(\w+\s?\w*)/g) || [];
    return matches.map((m) => m.slice(1));
  }

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  canPostInChannel(): boolean {
    const channel = this.currentChannel();
    if (!channel) return false;

    if (
      channel.channel_type === "announcements" ||
      channel.channel_type === "coaches_only"
    ) {
      return this.isCoach();
    }

    return true;
  }

  canPinMessages(): boolean {
    return this.isCoach();
  }

  canMarkImportant(): boolean {
    return this.isCoach();
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  getChannelIcon(type: ChannelType | undefined): string {
    switch (type) {
      case "announcements":
        return "pi pi-megaphone";
      case "coaches_only":
        return "pi pi-lock";
      case "position_group":
        return "pi pi-users";
      case "game_day":
        return "pi pi-flag";
      case "direct_message":
        return "pi pi-user";
      default:
        return "pi pi-hashtag";
    }
  }

  getChannelDescription(channel: Channel): string {
    if (channel.description) return channel.description;

    switch (channel.channel_type) {
      case "announcements":
        return "Important team announcements";
      case "coaches_only":
        return "Private coaching discussion";
      case "position_group":
        return `${channel.position_filter} position group`;
      case "game_day":
        return "Game day communication";
      default:
        return "Team discussion";
    }
  }

  getInputPlaceholder(): string {
    const channel = this.currentChannel();
    if (!channel) return "Select a channel...";

    if (channel.channel_type === "announcements") {
      return "Post an announcement to your team...";
    }

    return `Message #${channel.name}`;
  }

  formatMessageContent(content: string): string {
    // Convert @mentions to styled spans
    return content.replace(/@(\w+\s?\w*)/g, '<span class="mention">@$1</span>');
  }

  formatTime = (timestamp: string): string => getTimeAgo(timestamp);

  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }

  getAvatarColorClass(name: string): string {
    const paletteSize = 6;
    const index = name.charCodeAt(0) % paletteSize;
    return `avatar-color-${index + 1}`;
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const messagesRef = this.messagesList();
      if (messagesRef) {
        messagesRef.nativeElement.scrollTop =
          messagesRef.nativeElement.scrollHeight;
      }
    }, 100);
  }

  openChannelSettings(): void {
    const channel = this.currentChannel();
    if (channel) {
      this.openMembersDialog();
      void this.loadChannelMembers();
    }
  }

  // ============================================================================
  // CHANNEL MEMBERS
  // ============================================================================

  async loadChannelMembers(): Promise<void> {
    const channel = this.currentChannel();
    if (!channel) return;

    this._loadingMembers.set(true);
    this.memberSearchQuery = "";

    try {
      const membersData = await this.channelService.getChannelMembers(
        channel.id,
      );
      this._channelMembersData.set(membersData);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.CHANNEL_MEMBERS_FAILED);
      this._channelMembersData.set(null);
    } finally {
      this._loadingMembers.set(false);
    }
  }

  onMembersDialogVisibleChange(visible: boolean): void {
    this.showMembersDialog = visible;
    if (visible) {
      void this.loadChannelMembers();
      return;
    }
    this.resetMembersDialogState();
  }

  async startDirectMessage(member: ChannelMemberDetails): Promise<void> {
    const currentUserId = this.currentUserId();
    if (!currentUserId || member.user_id === currentUserId) {
      return;
    }

    try {
      const teamId = await this.requireCurrentTeamId(TOAST.ERROR.NO_TEAM_FOUND);
      if (!teamId) {
        return;
      }

      // Create or get existing DM channel
      const dmChannel = await this.channelService.createDirectMessage(
        member.user_id,
        teamId,
      );

      this.closeMembersDialog();

      // Select the DM channel
      await this.selectChannel(dmChannel);

      this.toastService.success(
        TOAST.SUCCESS.CONVERSATION_STARTED.replace("{name}", member.full_name),
      );
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.CONVERSATION_START_FAILED);
    }
  }

  private async resolveCurrentTeamId(): Promise<string | null> {
    if (this.currentTeamId) {
      return this.currentTeamId;
    }

    const userId = this.currentUserId();
    if (!userId) return null;

    this.currentTeamId = await this.channelService.fetchCurrentTeamId();
    return this.currentTeamId;
  }

  private async requireCurrentTeamId(
    errorMessage: string,
  ): Promise<string | null> {
    const teamId = await this.resolveCurrentTeamId();
    if (!teamId) {
      this.toastService.error(errorMessage);
    }
    return teamId;
  }

  sendQuickReply(reply: string): void {
    this.newMessage = reply;
    this.sendMessage();
  }

  openCreateChannelDialog(): void {
    this.showCreateChannelDialog = true;
  }

  closeCreateChannelDialog(): void {
    this.showCreateChannelDialog = false;
  }

  openPinnedMessagesDialog(): void {
    this.showPinnedMessages = true;
  }

  openMembersDialog(): void {
    this.showMembersDialog = true;
  }

  closeMembersDialog(): void {
    this.showMembersDialog = false;
    this.resetMembersDialogState();
  }

  private resetMembersDialogState(): void {
    this.memberSearchQuery = "";
  }
}
