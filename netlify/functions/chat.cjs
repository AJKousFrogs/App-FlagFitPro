/**
 * Chat API Function
 *
 * Handles channel and message operations for the team chat system.
 *
 * Endpoints:
 * - GET /api/chat/channels - Get user's channels
 * - POST /api/chat/channels - Create a new channel
 * - GET /api/chat/channels/:id/messages - Get channel messages
 * - POST /api/chat/channels/:id/messages - Send a message
 * - PATCH /api/chat/messages/:id - Update message (pin, important, edit)
 * - DELETE /api/chat/messages/:id - Delete a message
 * - POST /api/chat/channels/:id/read - Mark channel as read
 */

const { supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");
const { validate } = require("./validation.cjs");

// Use shared Supabase admin client
function getSupabase() {
  return supabaseAdmin;
}

// ============================================================================
// CHANNEL OPERATIONS
// ============================================================================

/**
 * Get channels for user
 */
async function getChannels(userId) {
  const supabase = getSupabase();

  // Get user's team memberships
  const { data: memberships, error: memberError } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", userId)
    .eq("status", "active");

  if (memberError) {
    throw memberError;
  }

  const teamIds = memberships?.map((m) => m.team_id) || [];
  const isCoach = memberships?.some((m) =>
    ["coach", "assistant_coach"].includes(m.role),
  );

  if (teamIds.length === 0) {
    return [];
  }

  // Build query based on user role
  let query = supabase
    .from("channels")
    .select(
      `
      *,
      last_message:chat_messages(
        id, message, created_at, user_id
      )
    `,
    )
    .in("team_id", teamIds)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  // Filter coaches-only channels if not a coach
  if (!isCoach) {
    query = query.neq("channel_type", "coaches_only");
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Get unread counts for each channel
  const channelsWithUnread = await Promise.all(
    (data || []).map(async (channel) => {
      const unreadCount = await getUnreadCount(userId, channel.id);
      return {
        ...channel,
        last_message: Array.isArray(channel.last_message)
          ? channel.last_message[0]
          : channel.last_message,
        unread_count: unreadCount,
      };
    }),
  );

  return channelsWithUnread;
}

/**
 * Create a new channel
 */
async function createChannel(userId, channelData) {
  const supabase = getSupabase();

  // SECURITY: Validate channel data
  const validation = validate(channelData, "createChannel");
  if (!validation.valid) {
    const error = new Error(`Validation failed: ${validation.errors.join(", ")}`);
    error.isValidation = true;
    error.errors = validation.errors;
    throw error;
  }

  // Verify user is a coach for this team (for non-DM channels)
  if (channelData.channel_type !== "direct_message") {
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", userId)
      .eq("team_id", channelData.team_id)
      .single();

    if (
      !membership ||
      !["coach", "assistant_coach"].includes(membership.role)
    ) {
      throw new Error("Only coaches can create team channels");
    }
  }

  const { data, error } = await supabase
    .from("channels")
    .insert({
      team_id: channelData.team_id,
      name: channelData.name,
      description: channelData.description,
      channel_type: channelData.channel_type,
      position_filter: channelData.position_filter,
      game_id: channelData.game_id,
      is_group_dm:
        channelData.channel_type === "direct_message" &&
        (channelData.member_ids?.length || 0) > 1,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Add members for DMs
  if (
    channelData.channel_type === "direct_message" &&
    channelData.member_ids?.length
  ) {
    const memberInserts = [
      { channel_id: data.id, user_id: userId, is_admin: true },
      ...channelData.member_ids
        .filter((id) => id !== userId)
        .map((id) => ({
          channel_id: data.id,
          user_id: id,
          is_admin: false,
        })),
    ];

    await supabase.from("channel_members").insert(memberInserts);
  }

  return data;
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

/**
 * Get messages for a channel
 */
async function getMessages(userId, channelId, options = {}) {
  const supabase = getSupabase();

  // Verify user has access to channel
  const hasAccess = await verifyChannelAccess(userId, channelId);
  if (!hasAccess) {
    throw new Error("Access denied to this channel");
  }

  let query = supabase
    .from("chat_messages")
    .select(
      `
      *,
      author:users!chat_messages_user_id_fkey(
        id, email, raw_user_meta_data
      )
    `,
    )
    .eq("channel_id", channelId)
    .is("thread_id", null)
    .order("created_at", { ascending: true })
    .limit(options.limit || 50);

  if (options.before) {
    query = query.lt("created_at", options.before);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Format author data
  return (data || []).map((m) => ({
    ...m,
    author: m.author
      ? {
          id: m.author.id,
          email: m.author.email,
          full_name: m.author.raw_user_meta_data?.full_name || m.author.email,
          avatar_url: m.author.raw_user_meta_data?.avatar_url,
        }
      : null,
  }));
}

/**
 * Send a message to a channel
 */
async function sendMessage(userId, channelId, messageData) {
  const supabase = getSupabase();

  // SECURITY: Validate message data
  const validation = validate(messageData, "chatMessage");
  if (!validation.valid) {
    const error = new Error(`Validation failed: ${validation.errors.join(", ")}`);
    error.isValidation = true;
    error.errors = validation.errors;
    throw error;
  }

  // Verify user can post to this channel
  const canPost = await verifyCanPost(userId, channelId);
  if (!canPost) {
    throw new Error("You cannot post to this channel");
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      user_id: userId,
      channel_id: channelId,
      channel: `channel-${channelId}`,
      message: messageData.message,
      message_type: messageData.message_type || "text",
      is_important: messageData.is_important || false,
      mentions: messageData.mentions || [],
      attachments: messageData.attachments || [],
      reply_to: messageData.reply_to,
      thread_id: messageData.thread_id,
    })
    .select(
      `
      *,
      author:users!chat_messages_user_id_fkey(
        id, email, raw_user_meta_data
      )
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    author: data.author
      ? {
          id: data.author.id,
          email: data.author.email,
          full_name:
            data.author.raw_user_meta_data?.full_name || data.author.email,
          avatar_url: data.author.raw_user_meta_data?.avatar_url,
        }
      : null,
  };
}

/**
 * Update a message (pin, importance, edit)
 */
async function updateMessage(userId, messageId, updates) {
  const supabase = getSupabase();

  // Get message to check permissions
  const { data: message } = await supabase
    .from("chat_messages")
    .select("user_id, channel_id")
    .eq("id", messageId)
    .single();

  if (!message) {
    throw new Error("Message not found");
  }

  // Check if user can update this message
  const isOwner = message.user_id === userId;
  const isCoach = await verifyIsCoach(userId, message.channel_id);

  // Only owner can edit content
  if (updates.message && !isOwner) {
    throw new Error("Can only edit your own messages");
  }

  // Only coaches can pin/mark important
  if (
    (updates.is_pinned !== undefined || updates.is_important !== undefined) &&
    !isCoach
  ) {
    throw new Error("Only coaches can pin or mark messages as important");
  }

  const updateData = {};

  if (updates.message !== undefined) {
    updateData.message = updates.message;
    updateData.is_edited = true;
  }

  if (updates.is_pinned !== undefined) {
    updateData.is_pinned = updates.is_pinned;
    updateData.pinned_by = updates.is_pinned ? userId : null;
    updateData.pinned_at = updates.is_pinned ? new Date().toISOString() : null;
  }

  if (updates.is_important !== undefined) {
    updateData.is_important = updates.is_important;
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("chat_messages")
    .update(updateData)
    .eq("id", messageId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete a message
 */
async function deleteMessage(userId, messageId) {
  const supabase = getSupabase();

  // Get message to check permissions
  const { data: message } = await supabase
    .from("chat_messages")
    .select("user_id, channel_id")
    .eq("id", messageId)
    .single();

  if (!message) {
    throw new Error("Message not found");
  }

  // Check if user can delete
  const isOwner = message.user_id === userId;
  const isCoach = await verifyIsCoach(userId, message.channel_id);

  if (!isOwner && !isCoach) {
    throw new Error("Cannot delete this message");
  }

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    throw error;
  }

  return { success: true };
}

/**
 * Mark channel as read
 */
async function markChannelRead(userId, channelId) {
  const supabase = getSupabase();

  const { error } = await supabase.from("channel_members").upsert(
    {
      channel_id: channelId,
      user_id: userId,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "channel_id,user_id" },
  );

  if (error) {
    throw error;
  }

  return { success: true };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function verifyChannelAccess(userId, channelId) {
  const supabase = getSupabase();

  // Get channel info
  const { data: channel } = await supabase
    .from("channels")
    .select("team_id, channel_type")
    .eq("id", channelId)
    .single();

  if (!channel) {
    return false;
  }

  // For DMs, check channel_members
  if (channel.channel_type === "direct_message") {
    const { data: member } = await supabase
      .from("channel_members")
      .select("id")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .single();

    return !!member;
  }

  // For team channels, check team membership
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", channel.team_id)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!teamMember) {
    return false;
  }

  // Coaches-only channels
  if (channel.channel_type === "coaches_only") {
    return ["coach", "assistant_coach"].includes(teamMember.role);
  }

  return true;
}

async function verifyCanPost(userId, channelId) {
  const supabase = getSupabase();

  const { data: channel } = await supabase
    .from("channels")
    .select("team_id, channel_type")
    .eq("id", channelId)
    .single();

  if (!channel) {
    return false;
  }

  // For announcements and coaches-only, must be coach
  if (["announcements", "coaches_only"].includes(channel.channel_type)) {
    return await verifyIsCoach(userId, channelId);
  }

  // For DMs, check membership
  if (channel.channel_type === "direct_message") {
    const { data: member } = await supabase
      .from("channel_members")
      .select("can_post")
      .eq("channel_id", channelId)
      .eq("user_id", userId)
      .single();

    return member?.can_post !== false;
  }

  // For other channels, just need team membership
  return await verifyChannelAccess(userId, channelId);
}

async function verifyIsCoach(userId, channelId) {
  const supabase = getSupabase();

  const { data: channel } = await supabase
    .from("channels")
    .select("team_id")
    .eq("id", channelId)
    .single();

  if (!channel) {
    return false;
  }

  const { data: member } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", channel.team_id)
    .eq("user_id", userId)
    .single();

  return member && ["coach", "assistant_coach"].includes(member.role);
}

async function getUnreadCount(userId, channelId) {
  const supabase = getSupabase();

  // Get last read timestamp
  const { data: membership } = await supabase
    .from("channel_members")
    .select("last_read_at")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .single();

  const lastReadAt = membership?.last_read_at || "1970-01-01T00:00:00Z";

  // Count messages after last read
  const { count } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("channel_id", channelId)
    .gt("created_at", lastReadAt);

  return count || 0;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "chat",
    allowedMethods: ["GET", "POST", "PATCH", "DELETE"],
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      const path = event.path
        .replace(/^\/\.netlify\/functions\/chat\/?/, "")
        .replace(/^\/api\/chat\/?/, "");
      const method = event.httpMethod;

      let body = {};
      if (event.body) {
        try {
          body = JSON.parse(event.body);
        } catch {
          return createErrorResponse(
            "Invalid JSON",
            400,
            "invalid_json",
            requestId,
          );
        }
      }

      try {
        // GET /channels - List user's channels
        if (method === "GET" && (path === "" || path === "channels")) {
          const channels = await getChannels(userId);
          return createSuccessResponse(channels);
        }

        // POST /channels - Create channel
        if (method === "POST" && path === "channels") {
          const channel = await createChannel(userId, body);
          return createSuccessResponse(channel, 201);
        }

        // GET /channels/:id/messages - Get messages
        const messagesMatch = path.match(/^channels\/([^/]+)\/messages$/);
        if (method === "GET" && messagesMatch) {
          const channelId = messagesMatch[1];
          const options = event.queryStringParameters || {};
          const messages = await getMessages(userId, channelId, options);
          return createSuccessResponse(messages);
        }

        // POST /channels/:id/messages - Send message
        if (method === "POST" && messagesMatch) {
          const channelId = messagesMatch[1];
          const message = await sendMessage(userId, channelId, body);
          return createSuccessResponse(message, 201);
        }

        // POST /channels/:id/read - Mark as read
        const readMatch = path.match(/^channels\/([^/]+)\/read$/);
        if (method === "POST" && readMatch) {
          const channelId = readMatch[1];
          const result = await markChannelRead(userId, channelId);
          return createSuccessResponse(result);
        }

        // PATCH /messages/:id - Update message
        const updateMatch = path.match(/^messages\/([^/]+)$/);
        if (method === "PATCH" && updateMatch) {
          const messageId = updateMatch[1];
          const message = await updateMessage(userId, messageId, body);
          return createSuccessResponse(message);
        }

        // DELETE /messages/:id - Delete message
        if (method === "DELETE" && updateMatch) {
          const messageId = updateMatch[1];
          const result = await deleteMessage(userId, messageId);
          return createSuccessResponse(result);
        }

        return createErrorResponse("Not found", 404, "not_found");
      } catch (error) {
        console.error("Chat API error:", error);

        // SECURITY: Handle validation errors with proper 422 status
        if (error.isValidation) {
          return createErrorResponse(
            error.message || "Validation failed",
            422,
            "validation_error",
            requestId,
          );
        }

        return createErrorResponse(
          error.message || "Internal error",
          error.message?.includes("denied") || error.message?.includes("cannot")
            ? 403
            : 500,
          "chat_error",
          requestId,
        );
      }
    },
  });
};
