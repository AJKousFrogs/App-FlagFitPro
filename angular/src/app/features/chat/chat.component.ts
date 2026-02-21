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
import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Avatar } from "primeng/avatar";
import { Badge } from "primeng/badge";

import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";

import { Select } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { Tooltip } from "primeng/tooltip";
import { TIMEOUTS } from "../../core/constants/app.constants";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { AuthService } from "../../core/services/auth.service";
import {
  Channel,
  ChannelMemberDetails,
  ChannelMembersResponse,
  ChannelService,
  ChannelType,
  ChatMessage,
} from "../../core/services/channel.service";
import { PresenceService } from "../../core/services/presence.service";
import { TeamNotificationService } from "../../core/services/team-notification.service";
import { ToastService } from "../../core/services/toast.service";
import { DialogService } from "../../core/ui/dialog.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { getTimeAgo } from "../../shared/utils/date.utils";
import { getInitials } from "../../shared/utils/format.utils";

@Component({
  selector: "app-chat",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    InputText,
    Avatar,
    Badge,
    ScrollingModule,
    Dialog,
    
    Select,
    Textarea,
    Tooltip,
    MainLayoutComponent,
    ButtonComponent,
    IconButtonComponent,
    StatusTagComponent,
  ],
  templateUrl: "./chat.component.html",

  styleUrl: "./chat.component.scss",
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  // Angular 21: Use viewChild() signal instead of @ViewChild()
  scrollViewport = viewChild.required<ElementRef>("scrollViewport");
  // Template reference for messages list scrolling
  readonly messagesList = viewChild<ElementRef<HTMLElement>>("messagesList");

  // Services
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private channelService = inject(ChannelService);
  private presenceService = inject(PresenceService);
  private notificationService = inject(TeamNotificationService);
  private dialogService = inject(DialogService);

  // State from services
  readonly currentChannel = this.channelService.currentChannel;
  readonly messages = this.channelService.messages;
  readonly pinnedMessages = this.channelService.pinnedMessages;
  readonly announcementChannels = this.channelService.announcementChannels;
  readonly teamChannels = this.channelService.teamChannels;
  readonly coachChannels = this.channelService.coachChannels;
  readonly dmChannels = this.channelService.dmChannels;

  // Local state
  newMessage = "";
  markAsImportant = false;
  showCreateChannelDialog = false;
  showPinnedMessages = false;
  showMembersDialog = false;

  // Create channel form
  newChannelName = "";
  newChannelDescription = "";
  newChannelType: ChannelType = "team_general";
  newChannelPosition = "";

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
  readonly currentUserId = computed(() => this.authService.currentUser()?.id);
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

  // Computed for important message banner
  readonly currentImportantMessage = computed(() => {
    const important = this.channelService.importantMessages();
    const dismissed = this._dismissedImportantId();
    return important.find((m) => m.id !== dismissed) || null;
  });

  async ngOnInit(): Promise<void> {
    await this.loadChannels();

    // Start presence tracking for the team
    const teamId = await this.getCurrentTeamId();
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
      this.toastService.error(TOAST.ERROR.CHANNEL_LOAD_FAILED);
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

  async createChannel(): Promise<void> {
    if (!this.newChannelName.trim()) return;

    try {
      // Get team ID (would come from current context in real app)
      const teamId = await this.getCurrentTeamId();
      if (!teamId) {
        this.toastService.error(TOAST.ERROR.NO_TEAM_SELECTED);
        return;
      }

      const channel = await this.channelService.createChannel({
        team_id: teamId,
        name: this.newChannelName.toLowerCase().replace(/\s+/g, "-"),
        description: this.newChannelDescription,
        channel_type: this.newChannelType,
        position_filter:
          this.newChannelType === "position_group"
            ? this.newChannelPosition
            : undefined,
      });

      this.toastService.success(
        TOAST.SUCCESS.CHANNEL_CREATED.replace("{name}", channel.name),
      );
      this.showCreateChannelDialog = false;
      this.resetChannelForm();

      // Select the new channel
      await this.selectChannel(channel);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.CHANNEL_CREATE_FAILED);
    }
  }

  private resetChannelForm(): void {
    this.newChannelName = "";
    this.newChannelDescription = "";
    this.newChannelType = "team_general";
    this.newChannelPosition = "";
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
    // Would implement inline editing UI
    const newContent = await this.dialogService.prompt(
      "Edit message:",
      message.message,
      "Edit Message",
    );
    if (newContent && newContent !== message.message) {
      this.channelService.editMessage(message.id, newContent);
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

  onMessageInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
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
      const teamId = await this.getCurrentTeamId();
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
      this.toastService.info(`Channel settings for #${channel.name}`);
      // Would open settings dialog
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

  async startDirectMessage(member: ChannelMemberDetails): Promise<void> {
    const currentUserId = this.authService.getUser()?.id;
    if (!currentUserId || member.user_id === currentUserId) {
      return;
    }

    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) {
        this.toastService.error(TOAST.ERROR.NO_TEAM_FOUND);
        return;
      }

      // Create or get existing DM channel
      const dmChannel = await this.channelService.createDirectMessage(
        member.user_id,
        teamId,
      );

      // Close the members dialog
      this.showMembersDialog = false;

      // Select the DM channel
      await this.selectChannel(dmChannel);

      this.toastService.success(
        TOAST.SUCCESS.CONVERSATION_STARTED.replace("{name}", member.full_name),
      );
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.CONVERSATION_START_FAILED);
    }
  }

  private async getCurrentTeamId(): Promise<string | null> {
    // Would get from current context/route
    // For now, get first team user belongs to
    const userId = this.authService.getUser()?.id;
    if (!userId) return null;

    return await this.channelService.fetchCurrentTeamId();
  }

  sendQuickReply(reply: string): void {
    this.newMessage = reply;
    this.sendMessage();
  }
}
