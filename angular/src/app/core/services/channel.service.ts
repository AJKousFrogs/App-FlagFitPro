/**
 * Channel Service
 *
 * Manages team communication channels with role-based permissions.
 * Handles channel creation, membership, and message operations.
 *
 * Channel Types:
 * - announcements: Coach-only posting, all team can view
 * - team_general: All team members can post
 * - coaches_only: Only coaches can view and post
 * - position_group: Position-specific channels
 * - game_day: Auto-created per game
 * - direct_message: 1:1 or group DMs
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { RealtimeService, RealtimeCallback } from "./realtime.service";

// ============================================================================
// TYPES
// ============================================================================

export type ChannelType =
  | "announcements"
  | "team_general"
  | "coaches_only"
  | "position_group"
  | "game_day"
  | "direct_message";

export interface Channel {
  id: string;
  team_id: string | null;
  name: string;
  description: string | null;
  channel_type: ChannelType;
  position_filter: string | null;
  game_id: string | null;
  is_group_dm: boolean;
  is_archived: boolean;
  is_default: boolean;
  allow_threads: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  unread_count?: number;
  last_message?: ChatMessage;
  member_count?: number;
  online_count?: number;
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  can_post: boolean;
  is_admin: boolean;
  is_muted: boolean;
  last_read_at: string | null;
  joined_at: string;
  // Joined fields
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  team_id: string | null;
  channel_id: string | null;
  message: string;
  message_type: string;
  is_read: boolean;
  read_at: string | null;
  is_pinned: boolean;
  pinned_by: string | null;
  pinned_at: string | null;
  is_important: boolean;
  mentions: string[];
  attachments: Attachment[];
  thread_id: string | null;
  reply_count: number;
  created_at: string;
  // Joined fields
  author?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
  };
  read_by?: string[];
}

export interface Attachment {
  type: "image" | "video" | "file" | "link";
  url: string;
  name?: string;
  size?: number;
  thumbnail_url?: string;
}

export interface CreateChannelRequest {
  team_id: string;
  name: string;
  description?: string;
  channel_type: ChannelType;
  position_filter?: string;
  game_id?: string;
  member_ids?: string[]; // For DMs
}

export interface SendMessageRequest {
  channel_id: string;
  message: string;
  message_type?: string;
  is_important?: boolean;
  mentions?: string[];
  attachments?: Attachment[];
  thread_id?: string;
  team_id?: string;
}

export interface AnnouncementReadStatus {
  message_id: string;
  total_members: number;
  read_count: number;
  read_by: {
    user_id: string;
    full_name: string;
    read_at: string;
    acknowledged: boolean;
  }[];
  unread_members: {
    user_id: string;
    full_name: string;
  }[];
}

export interface ChannelMemberDetails {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: "coach" | "assistant_coach" | "player" | "member";
  position: string | null;
  jersey_number: number | null;
  is_explicit_member: boolean;
  can_post: boolean;
  joined_at: string;
  // Client-side additions
  is_online?: boolean;
  initials?: string;
}

export interface ChannelMembersResponse {
  members: ChannelMemberDetails[];
  coaches: ChannelMemberDetails[];
  athletes: ChannelMemberDetails[];
  total_count: number;
  online_count: number;
  visibility_description: string;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class ChannelService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private realtimeService = inject(RealtimeService);

  // State
  private readonly _channels = signal<Channel[]>([]);
  private readonly _currentChannel = signal<Channel | null>(null);
  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public computed signals
  readonly channels = computed(() => this._channels());
  readonly currentChannel = computed(() => this._currentChannel());
  readonly messages = computed(() => this._messages());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  // Filtered channel lists
  readonly announcementChannels = computed(() =>
    this._channels().filter((c) => c.channel_type === "announcements"),
  );

  readonly teamChannels = computed(() =>
    this._channels().filter(
      (c) =>
        c.channel_type === "team_general" ||
        c.channel_type === "position_group",
    ),
  );

  readonly coachChannels = computed(() =>
    this._channels().filter((c) => c.channel_type === "coaches_only"),
  );

  readonly dmChannels = computed(() =>
    this._channels().filter((c) => c.channel_type === "direct_message"),
  );

  readonly pinnedMessages = computed(() =>
    this._messages().filter((m) => m.is_pinned),
  );

  readonly importantMessages = computed(() =>
    this._messages().filter((m) => m.is_important),
  );

  // User role check
  readonly isCoach = computed(() => {
    const user = this.authService.getUser();
    const metadata = (user as { user_metadata?: { role?: string } } | null)
      ?.user_metadata;
    return metadata?.role === "coach" || metadata?.role === "assistant_coach";
  });

  // ============================================================================
  // CHANNEL OPERATIONS
  // ============================================================================

  /**
   * Load all channels for the current user's team(s)
   */
  async loadChannels(teamId?: string): Promise<Channel[]> {
    this._loading.set(true);
    this._error.set(null);

    try {
      let query = this.supabase.client
        .from("channels")
        .select(
          `
          *,
          last_message:chat_messages(
            id, message, created_at, sender_id
          )
        `,
        )
        .eq("is_archived", false)
        .order("created_at", { ascending: true });

      if (teamId) {
        query = query.eq("team_id", teamId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const channels = (data || []).map((c) => ({
        ...c,
        last_message: Array.isArray(c.last_message)
          ? c.last_message[0]
          : c.last_message,
      })) as Channel[];

      this._channels.set(channels);
      this.logger.debug(`Loaded ${channels.length} channels`);

      return channels;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load channels";
      this._error.set(message);
      this.logger.error("Error loading channels:", error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new channel (coaches only for team channels)
   */
  async createChannel(request: CreateChannelRequest): Promise<Channel> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) throw new Error("Not authenticated");

      // Validate permissions for non-DM channels
      if (request.channel_type !== "direct_message") {
        const isCoach = await this.checkIsCoach(request.team_id);
        if (!isCoach) {
          throw new Error("Only coaches can create team channels");
        }
      }

      const { data, error } = await this.supabase.client
        .from("channels")
        .insert({
          team_id: request.team_id,
          name: request.name,
          description: request.description,
          channel_type: request.channel_type,
          position_filter: request.position_filter,
          game_id: request.game_id,
          is_group_dm:
            request.channel_type === "direct_message" &&
            (request.member_ids?.length || 0) > 1,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      const channel = data as Channel;

      // Add members for DMs
      if (
        request.channel_type === "direct_message" &&
        request.member_ids?.length
      ) {
        const memberInserts = [
          { channel_id: channel.id, user_id: userId, is_admin: true },
          ...request.member_ids
            .filter((id) => id !== userId)
            .map((id) => ({
              channel_id: channel.id,
              user_id: id,
              is_admin: false,
            })),
        ];

        await this.supabase.client
          .from("channel_members")
          .insert(memberInserts);
      }

      // Update local state
      this._channels.update((channels) => [...channels, channel]);

      this.logger.success(`Created channel: ${channel.name}`);
      return channel;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create channel";
      this._error.set(message);
      this.logger.error("Error creating channel:", error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Archive a channel (soft delete)
   */
  async archiveChannel(channelId: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from("channels")
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq("id", channelId);

      if (error) throw error;

      this._channels.update((channels) =>
        channels.filter((c) => c.id !== channelId),
      );

      this.logger.success("Channel archived");
    } catch (error) {
      this.logger.error("Error archiving channel:", error);
      throw error;
    }
  }

  /**
   * Update channel settings
   */
  async updateChannel(
    channelId: string,
    updates: Partial<Pick<Channel, "name" | "description" | "allow_threads">>,
  ): Promise<Channel> {
    try {
      const { data, error } = await this.supabase.client
        .from("channels")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", channelId)
        .select()
        .single();

      if (error) throw error;

      const channel = data as Channel;
      this._channels.update((channels) =>
        channels.map((c) => (c.id === channelId ? channel : c)),
      );

      return channel;
    } catch (error) {
      this.logger.error("Error updating channel:", error);
      throw error;
    }
  }

  // ============================================================================
  // MESSAGE OPERATIONS
  // ============================================================================

  /**
   * Load messages for a channel
   */
  async loadMessages(
    channelId: string,
    options: { limit?: number; before?: string } = {},
  ): Promise<ChatMessage[]> {
    this._loading.set(true);

    try {
      let query = this.supabase.client
        .from("chat_messages")
        .select("*")
        .eq("channel_id", channelId)
        .is("thread_id", null) // Only top-level messages
        .order("created_at", { ascending: true })
        .limit(options.limit || 50);

      if (options.before) {
        query = query.lt("created_at", options.before);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user details separately for authors
      const senderIds = [
        ...new Set((data || []).map((m) => m.sender_id).filter(Boolean)),
      ];
      let usersMap = new Map<
        string,
        { id: string; email: string; full_name: string; avatar_url: string }
      >();

      if (senderIds.length > 0) {
        const { data: usersData } = await this.supabase.client
          .from("users")
          .select("id, email, full_name, avatar_url")
          .in("id", senderIds);

        if (usersData) {
          usersMap = new Map(usersData.map((u) => [u.id, u]));
        }
      }

      const messages = (data || []).map((m) => {
        const author = usersMap.get(m.sender_id);
        return {
          ...m,
          author: author
            ? {
                id: author.id,
                email: author.email,
                full_name: author.full_name || author.email,
                avatar_url: author.avatar_url,
              }
            : undefined,
        };
      }) as ChatMessage[];

      this._messages.set(messages);
      return messages;
    } catch (error) {
      this.logger.error("Error loading messages:", error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) throw new Error("Not authenticated");

      // Parse mentions from message text (@username)
      const _mentionMatches = request.message.match(/@(\w+)/g) || [];
      const mentions = request.mentions || [];

      // Add parsed mentions (would need to resolve usernames to IDs in real implementation)
      // For now, just use provided mentions

      const { data, error } = await this.supabase.client
        .from("chat_messages")
        .insert({
          sender_id: userId,
          channel_id: request.channel_id,
          team_id: request.team_id || null,
          message: request.message,
          message_type: request.message_type || "text",
          is_important: request.is_important || false,
          mentions: mentions,
          attachments: request.attachments || [],
          thread_id: request.thread_id,
        })
        .select("*")
        .single();

      if (error) throw error;

      // Fetch author details
      const { data: authorData } = await this.supabase.client
        .from("users")
        .select("id, email, full_name, avatar_url")
        .eq("id", userId)
        .single();

      const message = {
        ...data,
        author: authorData
          ? {
              id: authorData.id,
              email: authorData.email,
              full_name: authorData.full_name || authorData.email,
              avatar_url: authorData.avatar_url,
            }
          : undefined,
      } as ChatMessage;

      // Update local state
      this._messages.update((messages) => [...messages, message]);

      // Update thread reply count if this is a reply
      if (request.thread_id) {
        await this.supabase.client.rpc("increment_reply_count", {
          message_id: request.thread_id,
        });
      }

      return message;
    } catch (error) {
      this.logger.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Pin/unpin a message (coaches only)
   */
  async togglePinMessage(messageId: string): Promise<void> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) throw new Error("Not authenticated");

      const message = this._messages().find((m) => m.id === messageId);
      if (!message) throw new Error("Message not found");

      const isPinned = !message.is_pinned;

      const { error } = await this.supabase.client
        .from("chat_messages")
        .update({
          is_pinned: isPinned,
          pinned_by: isPinned ? userId : null,
          pinned_at: isPinned ? new Date().toISOString() : null,
        })
        .eq("id", messageId);

      if (error) throw error;

      // Update local state
      this._messages.update((messages) =>
        messages.map((m) =>
          m.id === messageId
            ? {
                ...m,
                is_pinned: isPinned,
                pinned_by: isPinned ? userId : null,
                pinned_at: isPinned ? new Date().toISOString() : null,
              }
            : m,
        ),
      );

      this.logger.success(isPinned ? "Message pinned" : "Message unpinned");
    } catch (error) {
      this.logger.error("Error toggling pin:", error);
      throw error;
    }
  }

  /**
   * Mark a message as important (coaches only)
   */
  async toggleImportantMessage(messageId: string): Promise<void> {
    try {
      const message = this._messages().find((m) => m.id === messageId);
      if (!message) throw new Error("Message not found");

      const isImportant = !message.is_important;

      const { error } = await this.supabase.client
        .from("chat_messages")
        .update({ is_important: isImportant })
        .eq("id", messageId);

      if (error) throw error;

      this._messages.update((messages) =>
        messages.map((m) =>
          m.id === messageId ? { ...m, is_important: isImportant } : m,
        ),
      );

      this.logger.success(
        isImportant ? "Message marked as important" : "Message unmarked",
      );
    } catch (error) {
      this.logger.error("Error toggling importance:", error);
      throw error;
    }
  }

  /**
   * Edit a message (own messages only)
   */
  async editMessage(messageId: string, newContent: string): Promise<void> {
    try {
      const userId = this.authService.getUser()?.id;
      const message = this._messages().find((m) => m.id === messageId);

      if (!message) throw new Error("Message not found");
      if (message.sender_id !== userId)
        throw new Error("Can only edit own messages");

      const { error } = await this.supabase.client
        .from("chat_messages")
        .update({
          message: newContent,
        })
        .eq("id", messageId);

      if (error) throw error;

      this._messages.update((messages) =>
        messages.map((m) =>
          m.id === messageId ? { ...m, message: newContent } : m,
        ),
      );
    } catch (error) {
      this.logger.error("Error editing message:", error);
      throw error;
    }
  }

  /**
   * Delete a message (own messages or coaches)
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from("chat_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      this._messages.update((messages) =>
        messages.filter((m) => m.id !== messageId),
      );
    } catch (error) {
      this.logger.error("Error deleting message:", error);
      throw error;
    }
  }

  // ============================================================================
  // READ RECEIPTS & ANNOUNCEMENTS
  // ============================================================================

  /**
   * Mark a message as read
   */
  async markMessageRead(messageId: string): Promise<void> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) return;

      await this.supabase.client.from("message_read_receipts").upsert(
        {
          message_id: messageId,
          user_id: userId,
          read_at: new Date().toISOString(),
        },
        { onConflict: "message_id,user_id" },
      );
    } catch (error) {
      this.logger.warn("Error marking message read:", error);
    }
  }

  /**
   * Acknowledge an announcement
   */
  async acknowledgeAnnouncement(messageId: string): Promise<void> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) return;

      await this.supabase.client.from("announcement_reads").upsert(
        {
          message_id: messageId,
          user_id: userId,
          read_at: new Date().toISOString(),
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        },
        { onConflict: "message_id,user_id" },
      );

      this.logger.success("Announcement acknowledged");
    } catch (error) {
      this.logger.error("Error acknowledging announcement:", error);
      throw error;
    }
  }

  /**
   * Get read status for an announcement (coaches only)
   */
  async getAnnouncementReadStatus(
    messageId: string,
  ): Promise<AnnouncementReadStatus> {
    try {
      // Get the message and its channel
      const { data: message } = await this.supabase.client
        .from("chat_messages")
        .select("channel_id")
        .eq("id", messageId)
        .single();

      if (!message) throw new Error("Message not found");

      // Get channel's team
      const { data: channel } = await this.supabase.client
        .from("channels")
        .select("team_id")
        .eq("id", message.channel_id)
        .single();

      if (!channel) throw new Error("Channel not found");

      // Get all team members - using type assertion due to Supabase's auth.users join limitation
      interface TeamMemberWithUser {
        user_id: string;
        users: {
          id: string;
          email: string;
          raw_user_meta_data: Record<string, unknown>;
        } | null;
      }
      const { data: members } = (await this.supabase.client
        .from("team_members")
        .select(
          `
          user_id,
          users:auth.users(id, email, raw_user_meta_data)
        `,
        )
        .eq("team_id", channel.team_id)
        .eq("status", "active")) as {
        data: TeamMemberWithUser[] | null;
        error: unknown;
      };

      // Get read receipts
      const { data: reads } = await this.supabase.client
        .from("announcement_reads")
        .select("user_id, read_at, acknowledged")
        .eq("message_id", messageId);

      const readUserIds = new Set((reads || []).map((r) => r.user_id));

      const readBy = (reads || []).map((r) => {
        const member = (members || []).find((m) => m.user_id === r.user_id);
        return {
          user_id: r.user_id,
          full_name:
            (member?.users?.raw_user_meta_data?.["full_name"] as string) ||
            member?.users?.email ||
            "Unknown",
          read_at: r.read_at,
          acknowledged: r.acknowledged,
        };
      });

      const unreadMembers = (members || [])
        .filter((m) => !readUserIds.has(m.user_id))
        .map((m) => ({
          user_id: m.user_id,
          full_name:
            (m.users?.raw_user_meta_data?.["full_name"] as string) ||
            m.users?.email ||
            "Unknown",
        }));

      return {
        message_id: messageId,
        total_members: (members || []).length,
        read_count: readBy.length,
        read_by: readBy,
        unread_members: unreadMembers,
      };
    } catch (error) {
      this.logger.error("Error getting announcement read status:", error);
      throw error;
    }
  }

  // ============================================================================
  // CHANNEL SELECTION
  // ============================================================================

  /**
   * Select a channel and load its messages
   */
  async selectChannel(channel: Channel): Promise<void> {
    this._currentChannel.set(channel);
    await this.loadMessages(channel.id);

    // Mark channel as read
    await this.updateLastRead(channel.id);
  }

  /**
   * Update last read timestamp for a channel
   */
  private async updateLastRead(channelId: string): Promise<void> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) return;

      await this.supabase.client.from("channel_members").upsert(
        {
          channel_id: channelId,
          user_id: userId,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: "channel_id,user_id" },
      );
    } catch (error) {
      this.logger.warn("Error updating last read:", error);
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to channel messages in real-time
   */
  subscribeToChannelMessages(
    channelId: string,
    callback: RealtimeCallback,
  ): () => void {
    return this.realtimeService.subscribe(
      "chat_messages",
      `channel_id=eq.${channelId}`,
      {
        onInsert: (event) => {
          // Add new message to state
          const newMessage = event.new as unknown as ChatMessage;
          this._messages.update((messages) => [...messages, newMessage]);
          callback(event);
        },
        onUpdate: (event) => {
          // Update message in state
          const updatedMessage = event.new as unknown as ChatMessage;
          this._messages.update((messages) =>
            messages.map((m) =>
              m.id === updatedMessage.id ? updatedMessage : m,
            ),
          );
          callback(event);
        },
        onDelete: (event) => {
          // Remove message from state
          const deletedMessage = event.old as unknown as ChatMessage;
          this._messages.update((messages) =>
            messages.filter((m) => m.id !== deletedMessage.id),
          );
          callback(event);
        },
      },
    );
  }

  /**
   * Subscribe to all channels for a team
   */
  subscribeToTeamChannels(
    teamId: string,
    callback: RealtimeCallback,
  ): () => void {
    return this.realtimeService.subscribe("channels", `team_id=eq.${teamId}`, {
      onInsert: (event) => {
        const newChannel = event.new as unknown as Channel;
        this._channels.update((channels) => [...channels, newChannel]);
        callback(event);
      },
      onUpdate: (event) => {
        const updatedChannel = event.new as unknown as Channel;
        this._channels.update((channels) =>
          channels.map((c) =>
            c.id === updatedChannel.id ? updatedChannel : c,
          ),
        );
        callback(event);
      },
      onDelete: (event) => {
        const deletedChannel = event.old as unknown as Channel;
        this._channels.update((channels) =>
          channels.filter((c) => c.id !== deletedChannel.id),
        );
        callback(event);
      },
    });
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Check if current user is a coach for the given team
   */
  private async checkIsCoach(teamId: string): Promise<boolean> {
    const userId = this.authService.getUser()?.id;
    if (!userId) return false;

    const { data } = await this.supabase.client
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single();

    return data?.role === "coach" || data?.role === "assistant_coach";
  }

  /**
   * Get channel permissions for current user
   */
  async getChannelPermissions(
    channelId: string,
  ): Promise<{ canPost: boolean; canPin: boolean; canDelete: boolean }> {
    const channel = this._channels().find((c) => c.id === channelId);
    if (!channel) {
      return { canPost: false, canPin: false, canDelete: false };
    }

    const isCoach = this.isCoach();

    switch (channel.channel_type) {
      case "announcements":
        return { canPost: isCoach, canPin: isCoach, canDelete: isCoach };
      case "coaches_only":
        return { canPost: isCoach, canPin: isCoach, canDelete: isCoach };
      case "team_general":
      case "game_day":
      case "position_group":
        return { canPost: true, canPin: isCoach, canDelete: isCoach };
      case "direct_message":
        return { canPost: true, canPin: false, canDelete: false };
      default:
        return { canPost: false, canPin: false, canDelete: false };
    }
  }

  /**
   * Get unread count for a channel
   */
  async getUnreadCount(channelId: string): Promise<number> {
    try {
      const userId = this.authService.getUser()?.id;
      if (!userId) return 0;

      // Get last read timestamp
      const { data: membership } = await this.supabase.client
        .from("channel_members")
        .select("last_read_at")
        .eq("channel_id", channelId)
        .eq("user_id", userId)
        .single();

      const lastReadAt = membership?.last_read_at || "1970-01-01T00:00:00Z";

      // Count messages after last read
      const { count } = await this.supabase.client
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", channelId)
        .gt("created_at", lastReadAt);

      return count || 0;
    } catch (_error) {
      return 0;
    }
  }

  /**
   * Search messages in a channel
   */
  async searchMessages(
    channelId: string,
    query: string,
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await this.supabase.client
        .from("chat_messages")
        .select("*")
        .eq("channel_id", channelId)
        .ilike("message", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as ChatMessage[];
    } catch (error) {
      this.logger.error("Error searching messages:", error);
      return [];
    }
  }

  /**
   * Create a direct message channel with another user
   */
  async createDirectMessage(
    otherUserId: string,
    teamId: string,
  ): Promise<Channel> {
    const userId = this.authService.getUser()?.id;
    if (!userId) throw new Error("Not authenticated");

    // Check if DM already exists
    const { data: existing } = await this.supabase.client
      .from("channel_members")
      .select("channel_id")
      .eq("user_id", userId);

    if (existing) {
      for (const membership of existing) {
        const { data: otherMember } = await this.supabase.client
          .from("channel_members")
          .select("channel_id")
          .eq("channel_id", membership.channel_id)
          .eq("user_id", otherUserId)
          .single();

        if (otherMember) {
          // DM already exists
          const { data: channel } = await this.supabase.client
            .from("channels")
            .select("*")
            .eq("id", membership.channel_id)
            .eq("channel_type", "direct_message")
            .single();

          if (channel) {
            return channel as Channel;
          }
        }
      }
    }

    // Create new DM
    return this.createChannel({
      team_id: teamId,
      name: `dm-${userId}-${otherUserId}`,
      channel_type: "direct_message",
      member_ids: [otherUserId],
    });
  }

  /**
   * Clear current state (for logout)
   */
  clearState(): void {
    this._channels.set([]);
    this._currentChannel.set(null);
    this._messages.set([]);
    this._error.set(null);
  }

  // ============================================================================
  // CHANNEL MEMBERS
  // ============================================================================

  /**
   * Get all members who can see a channel with their details
   * Uses the database function get_channel_members() for rule-based membership
   */
  async getChannelMembers(channelId: string): Promise<ChannelMembersResponse> {
    try {
      const channel = this._channels().find((c) => c.id === channelId);

      // Call the database function
      const { data, error } = await this.supabase.client.rpc(
        "get_channel_members",
        { p_channel_id: channelId },
      );

      if (error) {
        this.logger.error("Error fetching channel members:", error);
        throw error;
      }

      const members = ((data as ChannelMemberDetails[]) || []).map((m) => ({
        ...m,
        full_name: m.full_name || m.email?.split("@")[0] || "Unknown",
        initials: this.getInitials(m.full_name || m.email || "U"),
        is_online: false, // Will be populated by presence system
      }));

      // Separate coaches and athletes
      const coaches = members.filter((m) =>
        ["coach", "assistant_coach"].includes(m.role),
      );
      const athletes = members.filter(
        (m) => !["coach", "assistant_coach"].includes(m.role),
      );

      // Generate visibility description based on channel type
      const visibilityDescription = this.getVisibilityDescription(
        channel?.channel_type,
      );

      return {
        members,
        coaches,
        athletes,
        total_count: members.length,
        online_count: 0, // Will be populated by presence system
        visibility_description: visibilityDescription,
      };
    } catch (error) {
      this.logger.error("Error in getChannelMembers:", error);
      throw error;
    }
  }

  /**
   * Get visibility description for a channel type
   */
  private getVisibilityDescription(
    channelType: ChannelType | undefined,
  ): string {
    switch (channelType) {
      case "announcements":
        return "Visible to all team members • Only coaches can post";
      case "team_general":
        return "Visible to all team members";
      case "coaches_only":
        return "Visible to coaches only";
      case "position_group":
        return "Visible to coaches and players in this position group";
      case "game_day":
        return "Visible to all team members";
      case "direct_message":
        return "Private conversation";
      default:
        return "Team channel";
    }
  }

  /**
   * Get initials from a name
   */
  private getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Search team members for @mentions
   * Note: Uses separate query since Supabase client doesn't support auth.users join
   */
  async searchTeamMembers(
    teamId: string,
    query: string,
  ): Promise<ChannelMemberDetails[]> {
    try {
      // First get team members
      const { data: teamMembersData, error: teamError } =
        await this.supabase.client
          .from("team_members")
          .select("user_id, role, position, jersey_number, joined_at")
          .eq("team_id", teamId)
          .eq("status", "active");

      if (teamError) throw teamError;

      if (!teamMembersData || teamMembersData.length === 0) {
        return [];
      }

      // Get user details from users table (public profile data)
      const userIds = teamMembersData.map((m) => m.user_id);
      const { data: usersData, error: usersError } = await this.supabase.client
        .from("users")
        .select("id, email, full_name, avatar_url")
        .in("id", userIds);

      if (usersError) {
        this.logger.warn("Error fetching user details:", usersError);
      }

      // Create a map for quick user lookup
      const usersMap = new Map((usersData || []).map((u) => [u.id, u]));

      // Combine and filter
      const members = teamMembersData
        .map((m) => {
          const user = usersMap.get(m.user_id);
          const fullName =
            user?.full_name || user?.email?.split("@")[0] || "Unknown";
          return {
            user_id: m.user_id,
            email: user?.email || "",
            full_name: fullName,
            avatar_url: user?.avatar_url || null,
            role: m.role as ChannelMemberDetails["role"],
            position: m.position,
            jersey_number: m.jersey_number,
            is_explicit_member: false,
            can_post: true,
            joined_at: m.joined_at,
            initials: this.getInitials(fullName),
          };
        })
        .filter(
          (m) =>
            m.full_name.toLowerCase().includes(query.toLowerCase()) ||
            m.email.toLowerCase().includes(query.toLowerCase()),
        );

      return members;
    } catch (error) {
      this.logger.error("Error searching team members:", error);
      return [];
    }
  }
}
