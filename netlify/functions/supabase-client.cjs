// Supabase client for Netlify Functions
// Handles database connections and operations

const { createClient } = require("@supabase/supabase-js");
const { AsyncLocalStorage } = require("node:async_hooks");

// Environment variables (set in Netlify UI)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service key for admin operations
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Anon key for regular operations

// Create Supabase client with service key for admin operations
// Only create if environment variables are available
let supabaseService;
let supabase;
const authContext = new AsyncLocalStorage();
const rlsClientCache = new Map();

try {
  if (supabaseUrl && supabaseServiceKey) {
    supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  if (supabaseUrl && supabaseAnonKey) {
    // Create Supabase client with anon key for regular operations
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.error("Failed to initialize Supabase clients:", error);
  // Clients will be undefined, checkEnvVars will catch this
}

/**
 * Create a per-request Supabase client that enforces RLS via JWT.
 *
 * @param {string|null} token - Supabase access token
 * @returns {object} Supabase client instance
 */
function getSupabaseClient(token = null) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase anon client is not initialized. Please check SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }

  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers,
    },
  });
}

function getAuthTokenFromContext() {
  return authContext.getStore()?.token || null;
}

function getSupabaseClientFromContext() {
  const token = getAuthTokenFromContext();
  const cacheKey = token || "anon";
  if (rlsClientCache.has(cacheKey)) {
    return rlsClientCache.get(cacheKey);
  }
  const client = getSupabaseClient(token);
  rlsClientCache.set(cacheKey, client);
  return client;
}

function runWithAuthContext(token, fn) {
  return authContext.run({ token }, fn);
}

function setAuthContextToken(token) {
  authContext.enterWith({ token });
}

const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabaseClientFromContext();
      if (prop === "auth") {
        return new Proxy(client.auth, {
          get(authTarget, authProp) {
            if (authProp === "getUser") {
              return async (token) => {
                if (token) {
                  setAuthContextToken(token);
                }
                return authTarget.getUser(token);
              };
            }
            return authTarget[authProp];
          },
        });
      }
      return client[prop];
    },
  },
);

// Database operations helper
const db = {
  // User operations
  users: {
    async findByEmail(email) {
      requireSupabaseAdmin("findByEmail");

      try {
        const { data, error } = await supabaseAdmin
          .from("users")
          .select(
            "id, email, full_name, profile_photo_url, email_verified, created_at, updated_at",
          )
          .eq("email", email)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows found
          throw enhanceSupabaseError(error, "findByEmail");
        }

        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "findByEmail");
      }
    },

    async create(userData) {
      requireSupabaseAdmin("create user");

      try {
        const { data, error } = await supabaseAdmin
          .from("users")
          .insert(userData)
          .select(
            "id, email, full_name, profile_photo_url, email_verified, created_at, updated_at",
          )
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "create user");
        }
        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "create user");
      }
    },

    async findById(id) {
      requireSupabaseAdmin("findById");

      try {
        const { data, error } = await supabaseAdmin
          .from("users")
          .select(
            "id, email, full_name, profile_photo_url, email_verified, created_at, updated_at",
          )
          .eq("id", id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw enhanceSupabaseError(error, "findById");
        }

        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "findById");
      }
    },

    async update(id, updates) {
      requireSupabaseAdmin("update user");

      try {
        const { data, error } = await supabaseAdmin
          .from("users")
          .update({ ...updates, updated_at: new Date() })
          .eq("id", id)
          .select(
            "id, email, full_name, profile_photo_url, email_verified, created_at, updated_at",
          )
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "update user");
        }
        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "update user");
      }
    },

    async setVerificationToken(userId, token) {
      requireSupabaseAdmin("setVerificationToken");

      try {
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const { data, error } = await supabaseAdmin
          .from("users")
          .update({
            verification_token: token,
            verification_token_expires_at: expiry.toISOString(),
            updated_at: new Date(),
          })
          .eq("id", userId)
          .select(
            "id, email, full_name, profile_photo_url, email_verified, created_at, updated_at",
          )
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "setVerificationToken");
        }
        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "setVerificationToken");
      }
    },

    async verifyEmail(token) {
      requireSupabaseAdmin("verifyEmail");

      try {
        // Find user by verification token
        const { data: user, error: findError } = await supabaseAdmin
          .from("users")
          .select(
            "id, email, full_name, profile_photo_url, email_verified, verification_token, verification_token_expires_at, created_at, updated_at",
          )
          .eq("verification_token", token)
          .single();

        if (findError || !user) {
          throw new Error("Invalid or expired verification token");
        }

        // Check if token is expired
        if (user.verification_token_expires_at) {
          const expiryDate = new Date(user.verification_token_expires_at);
          if (new Date() > expiryDate) {
            throw new Error("Verification token has expired");
          }
        }

        // Check if already verified
        if (user.email_verified) {
          return { alreadyVerified: true, user };
        }

        // Mark email as verified and clear token
        const { data, error } = await supabaseAdmin
          .from("users")
          .update({
            email_verified: true,
            verification_token: null,
            verification_token_expires_at: null,
            updated_at: new Date(),
          })
          .eq("id", user.id)
          .select(
            "id, email, full_name, profile_photo_url, email_verified, created_at, updated_at",
          )
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "verifyEmail");
        }
        return { alreadyVerified: false, user: data };
      } catch (error) {
        // Don't enhance user-friendly errors
        if (
          error.message === "Invalid or expired verification token" ||
          error.message === "Verification token has expired"
        ) {
          throw error;
        }
        throw enhanceSupabaseError(error, "verifyEmail");
      }
    },
  },

  // Training operations
  training: {
    async getUserStats(userId) {
      requireSupabaseAdmin("getUserStats");

      try {
        const { data, error } = await supabaseAdmin
          .from("training_sessions")
          .select(
            "id, user_id, session_date, session_type, duration_minutes, intensity_level, status, score, completed_at, created_at, updated_at",
          )
          .eq("user_id", userId)
          .order("completed_at", { ascending: false });

        if (error) {
          throw enhanceSupabaseError(error, "getUserStats");
        }
        return data || [];
      } catch (error) {
        throw enhanceSupabaseError(error, "getUserStats");
      }
    },

    async createSession(sessionData) {
      requireSupabaseAdmin("createSession");

      try {
        const { data, error } = await supabaseAdmin
          .from("training_sessions")
          .insert(sessionData)
          .select(
            "id, user_id, session_date, session_type, duration_minutes, intensity_level, status, score, completed_at, created_at, updated_at",
          )
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "createSession");
        }
        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "createSession");
      }
    },

    async getRecentSessions(userId, limit = 10) {
      requireSupabaseAdmin("getRecentSessions");

      try {
        const { data, error } = await supabaseAdmin
          .from("training_sessions")
          .select(
            "id, user_id, session_date, session_type, duration_minutes, intensity_level, status, score, completed_at, created_at, updated_at",
          )
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })
          .limit(limit);

        if (error) {
          throw enhanceSupabaseError(error, "getRecentSessions");
        }
        return data || [];
      } catch (error) {
        throw enhanceSupabaseError(error, "getRecentSessions");
      }
    },
  },

  // Team operations
  teams: {
    async getUserTeams(userId) {
      requireSupabaseAdmin("getUserTeams");

      try {
        const { data, error } = await supabaseAdmin
          .from("team_members")
          .select(
            `
            id,
            user_id,
            team_id,
            role,
            joined_at,
            teams:team_id (
              id,
              name,
              description,
              created_at
            )
          `,
          )
          .eq("user_id", userId);

        if (error) {
          throw enhanceSupabaseError(error, "getUserTeams");
        }
        return data || [];
      } catch (error) {
        throw enhanceSupabaseError(error, "getUserTeams");
      }
    },

    async getTeamMembers(teamId) {
      requireSupabaseAdmin("getTeamMembers");

      try {
        const { data, error } = await supabaseAdmin
          .from("team_members")
          .select(
            `
            id,
            user_id,
            team_id,
            role,
            joined_at,
            users:user_id (
              id,
              name,
              email,
              role,
              avatar_url
            )
          `,
          )
          .eq("team_id", teamId);

        if (error) {
          throw enhanceSupabaseError(error, "getTeamMembers");
        }
        return data || [];
      } catch (error) {
        throw enhanceSupabaseError(error, "getTeamMembers");
      }
    },
  },

  // Community operations
  community: {
    async getFeedPosts(limit = 20) {
      requireSupabaseAdmin("getFeedPosts");

      try {
        const { data, error } = await supabaseAdmin
          .from("posts")
          .select(
            `
            id,
            user_id,
            content,
            likes_count,
            comments_count,
            created_at,
            updated_at,
            users:user_id (
              id,
              name,
              avatar_url
            )
          `,
          )
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) {
          throw enhanceSupabaseError(error, "getFeedPosts");
        }
        return data || [];
      } catch (error) {
        throw enhanceSupabaseError(error, "getFeedPosts");
      }
    },

    async createPost(postData) {
      requireSupabaseAdmin("createPost");

      try {
        const { data, error } = await supabaseAdmin
          .from("posts")
          .insert(postData)
          .select(
            `
            id,
            user_id,
            content,
            likes_count,
            comments_count,
            created_at,
            updated_at,
            users:user_id (
              id,
              name,
              avatar_url
            )
          `,
          )
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "createPost");
        }
        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "createPost");
      }
    },
  },

  // Tournament operations
  tournaments: {
    async getList(status = "all", limit = 20) {
      requireSupabaseAdmin("getTournamentList");

      try {
        let query = supabaseAdmin
          .from("tournaments")
          .select(
            "id, name, description, start_date, end_date, status, location, created_at, updated_at",
          )
          .order("start_date", { ascending: true })
          .limit(limit);

        if (status !== "all") {
          query = query.eq("status", status);
        }

        const { data, error } = await query;

        if (error) {
          throw enhanceSupabaseError(error, "getTournamentList");
        }
        return data || [];
      } catch (error) {
        throw enhanceSupabaseError(error, "getTournamentList");
      }
    },

    async getDetails(tournamentId) {
      requireSupabaseAdmin("getTournamentDetails");

      try {
        const { data, error } = await supabaseAdmin
          .from("tournaments")
          .select(
            `
            id,
            name,
            description,
            start_date,
            end_date,
            status,
            location,
            created_at,
            updated_at,
            tournament_registrations (
              id,
              tournament_id,
              team_id,
              registered_at,
              teams:team_id (
                id,
                name
              )
            )
          `,
          )
          .eq("id", tournamentId)
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "getTournamentDetails");
        }
        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "getTournamentDetails");
      }
    },
  },

  // Games operations
  games: {
    async getRecentGames(teamId = null, limit = 10) {
      requireSupabaseAdmin("getRecentGames");

      try {
        let query = supabaseAdmin
          .from("games")
          .select(
            `
            id,
            home_team_id,
            away_team_id,
            game_date,
            home_score,
            away_score,
            status,
            location,
            created_at,
            updated_at,
            home_team:home_team_id (
              id,
              name
            ),
            away_team:away_team_id (
              id,
              name
            )
          `,
          )
          .order("game_date", { ascending: false })
          .limit(limit);

        if (teamId) {
          query = query.or(
            `home_team_id.eq.${teamId},away_team_id.eq.${teamId}`,
          );
        }

        const { data, error } = await query;

        if (error) {
          throw enhanceSupabaseError(error, "getRecentGames");
        }
        return data || [];
      } catch (error) {
        throw enhanceSupabaseError(error, "getRecentGames");
      }
    },
  },

  // Chat operations
  chat: {
    async getMessages(channel, limit = 50) {
      requireSupabaseAdmin("getMessages");

      try {
        const { data, error } = await supabaseAdmin
          .from("chat_messages")
          .select(
            `
            id,
            user_id,
            channel,
            message,
            created_at,
            updated_at,
            users:user_id (
              id,
              name,
              avatar_url
            )
          `,
          )
          .eq("channel", channel)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) {
          throw enhanceSupabaseError(error, "getMessages");
        }
        return data?.reverse() || []; // Reverse to show oldest first
      } catch (error) {
        throw enhanceSupabaseError(error, "getMessages");
      }
    },

    async createMessage(messageData) {
      requireSupabaseAdmin("createMessage");

      try {
        const { data, error } = await supabaseAdmin
          .from("chat_messages")
          .insert(messageData)
          .select(
            `
            id,
            user_id,
            channel,
            message,
            created_at,
            updated_at,
            users:user_id (
              id,
              name,
              avatar_url
            )
          `,
          )
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "createMessage");
        }
        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "createMessage");
      }
    },
  },

  // Notifications operations
  notifications: {
    async getUserNotifications(userId, options = {}) {
      requireSupabaseAdmin("getUserNotifications");

      const {
        limit = 20,
        page = 1,
        onlyUnread = false,
        lastOpenedAt = null,
      } = options;

      try {
        // Get muted types to filter out
        const mutedTypes = await this.getMutedTypes(userId);

        let query = supabaseAdmin
          .from("notifications")
          .select(
            "id, user_id, notification_type, message, is_read, created_at, updated_at",
          )
          .eq("user_id", userId);

        // Filter by read status if requested
        if (onlyUnread) {
          query = query.eq("is_read", false);
        }

        // Apply pagination
        const offset = (page - 1) * limit;
        query = query
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
          throw enhanceSupabaseError(error, "getUserNotifications");
        }

        // Filter out muted types in memory (more reliable than query filter)
        let filteredData = data || [];
        if (mutedTypes.length > 0) {
          filteredData = filteredData.filter(
            (notif) => !mutedTypes.includes(notif.notification_type),
          );
        }

        // Get last opened timestamp for "new since last open" indicator
        const lastOpened = lastOpenedAt || (await this.getLastOpenedAt(userId));

        // Transform database format to frontend format
        return filteredData.map((notif) => {
          const created = new Date(notif.created_at);
          const isNew = lastOpened ? created > new Date(lastOpened) : false;

          return {
            id: notif.id,
            type: notif.notification_type || "general",
            title: getNotificationTitle(notif.notification_type, notif.message),
            message: notif.message,
            time: getTimeAgo(notif.created_at),
            read: notif.is_read || false,
            new: isNew && !notif.is_read, // New since last open and unread
          };
        });
      } catch (error) {
        throw enhanceSupabaseError(error, "getUserNotifications");
      }
    },

    async markAsRead(userId, notificationId) {
      requireSupabaseAdmin("markAsRead");

      try {
        const { data, error } = await supabaseAdmin
          .from("notifications")
          .update({
            is_read: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", notificationId)
          .eq("user_id", userId)
          .select(
            "id, user_id, notification_type, message, is_read, created_at, updated_at",
          )
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "markAsRead");
        }
        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "markAsRead");
      }
    },

    async markManyAsRead(userId, notificationIds) {
      requireSupabaseAdmin("markManyAsRead");

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new Error("notificationIds must be a non-empty array");
      }

      try {
        const { data, error } = await supabaseAdmin
          .from("notifications")
          .update({
            is_read: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .in("id", notificationIds)
          .select(
            "id, user_id, notification_type, message, is_read, created_at, updated_at",
          );

        if (error) {
          throw enhanceSupabaseError(error, "markManyAsRead");
        }
        return data || [];
      } catch (error) {
        throw enhanceSupabaseError(error, "markManyAsRead");
      }
    },

    async markAllAsRead(userId) {
      requireSupabaseAdmin("markAllAsRead");

      try {
        const { data, error } = await supabaseAdmin
          .from("notifications")
          .update({
            is_read: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("is_read", false)
          .select(
            "id, user_id, notification_type, message, is_read, created_at, updated_at",
          );

        if (error) {
          throw enhanceSupabaseError(error, "markAllAsRead");
        }
        return data || [];
      } catch (error) {
        throw enhanceSupabaseError(error, "markAllAsRead");
      }
    },

    async getUnreadCount(userId) {
      requireSupabaseAdmin("getUnreadCount");

      try {
        // Get muted categories
        const mutedTypes = await this.getMutedTypes(userId);

        const query = supabaseAdmin
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_read", false);

        const { count: totalCount, error } = await query;

        if (error) {
          throw enhanceSupabaseError(error, "getUnreadCount");
        }

        // Filter out muted types - for accurate count, subtract muted unread count
        let count = totalCount || 0;
        if (mutedTypes.length > 0 && count > 0) {
          // Get count of muted unread notifications
          const mutedQuery = supabaseAdmin
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_read", false)
            .in("notification_type", mutedTypes);

          const { count: mutedCount } = await mutedQuery;
          count = Math.max(0, count - (mutedCount || 0));
        }

        return count;
      } catch (error) {
        throw enhanceSupabaseError(error, "getUnreadCount");
      }
    },

    async createNotification(userId, notificationData) {
      requireSupabaseAdmin("createNotification");

      const { type, message, priority = "medium" } = notificationData;

      // Validate notification type
      const validTypes = [
        "training",
        "achievement",
        "team",
        "wellness",
        "general",
        "game",
        "tournament",
        "injury_risk",
        "weather",
      ];
      if (!validTypes.includes(type)) {
        throw new Error(
          `Invalid notification type: ${type}. Must be one of: ${validTypes.join(", ")}`,
        );
      }

      try {
        const { data, error } = await supabaseAdmin
          .from("notifications")
          .insert({
            user_id: userId,
            notification_type: type,
            message,
            priority,
            is_read: false,
          })
          .select(
            "id, user_id, notification_type, message, is_read, created_at, updated_at",
          )
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "createNotification");
        }
        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "createNotification");
      }
    },

    async updateLastOpenedAt(userId) {
      requireSupabaseAdmin("updateLastOpenedAt");

      try {
        const { data, error } = await supabaseAdmin
          .from("users")
          .update({ notification_last_opened_at: new Date().toISOString() })
          .eq("id", userId)
          .select("id, notification_last_opened_at")
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "updateLastOpenedAt");
        }
        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "updateLastOpenedAt");
      }
    },

    async getLastOpenedAt(userId) {
      requireSupabaseAdmin("getLastOpenedAt");

      try {
        const { data, error } = await supabaseAdmin
          .from("users")
          .select("notification_last_opened_at")
          .eq("id", userId)
          .single();

        if (error) {
          throw enhanceSupabaseError(error, "getLastOpenedAt");
        }
        return data?.notification_last_opened_at || null;
      } catch (error) {
        throw enhanceSupabaseError(error, "getLastOpenedAt");
      }
    },

    async getMutedTypes(userId) {
      requireSupabaseAdmin("getMutedTypes");

      try {
        const { data, error } = await supabaseAdmin
          .from("user_notification_preferences")
          .select("notification_type")
          .eq("user_id", userId)
          .eq("muted", true);

        if (error) {
          throw enhanceSupabaseError(error, "getMutedTypes");
        }
        return (data || []).map((p) => p.notification_type);
      } catch (error) {
        // If table doesn't exist yet, return empty array
        if (error.code === "42P01") {
          return [];
        }
        throw enhanceSupabaseError(error, "getMutedTypes");
      }
    },

    async getUserPreferences(userId) {
      requireSupabaseAdmin("getUserPreferences");

      try {
        const { data, error } = await supabaseAdmin
          .from("user_notification_preferences")
          .select("notification_type, muted, push_enabled, in_app_enabled")
          .eq("user_id", userId);

        if (error) {
          throw enhanceSupabaseError(error, "getUserPreferences");
        }

        // Return as object keyed by type
        const preferences = {};
        (data || []).forEach((pref) => {
          preferences[pref.notification_type] = {
            muted: pref.muted,
            pushEnabled: pref.push_enabled,
            inAppEnabled: pref.in_app_enabled,
          };
        });

        return preferences;
      } catch (error) {
        // If table doesn't exist yet, return defaults
        if (error.code === "42P01") {
          return {};
        }
        throw enhanceSupabaseError(error, "getUserPreferences");
      }
    },

    async updateUserPreferences(userId, preferences) {
      requireSupabaseAdmin("updateUserPreferences");

      try {
        const updates = Object.entries(preferences).map(([type, prefs]) => ({
          user_id: userId,
          notification_type: type,
          muted: prefs.muted || false,
          push_enabled:
            prefs.pushEnabled !== undefined ? prefs.pushEnabled : true,
          in_app_enabled:
            prefs.inAppEnabled !== undefined ? prefs.inAppEnabled : true,
        }));

        // Use upsert to insert or update
        const { data, error } = await supabaseAdmin
          .from("user_notification_preferences")
          .upsert(updates, { onConflict: "user_id,notification_type" })
          .select();

        if (error) {
          throw enhanceSupabaseError(error, "updateUserPreferences");
        }
        return data;
      } catch (error) {
        throw enhanceSupabaseError(error, "updateUserPreferences");
      }
    },
  },

  // Sponsors operations
  sponsors: {
    async getActiveSponsors() {
      requireSupabaseAdmin("getActiveSponsors");

      try {
        const { data, error } = await supabaseAdmin
          .from("sponsors")
          .select(
            "id, name, logo_url, website_url, description, is_active, display_order, created_at, updated_at",
          )
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) {
          throw enhanceSupabaseError(error, "getActiveSponsors");
        }
        return data || [];
      } catch (error) {
        throw enhanceSupabaseError(error, "getActiveSponsors");
      }
    },
  },
};

// Helper function to enhance Supabase errors with context
function enhanceSupabaseError(error, context = "Database operation") {
  // Handle connection errors
  if (error.message?.includes("fetch failed") || error.name === "TypeError") {
    const enhancedError = new Error(
      `Failed to connect to Supabase during ${context}. Check SUPABASE_URL (${supabaseUrl ? "set" : "MISSING"}) and network connectivity.`,
    );
    enhancedError.originalError = error;
    enhancedError.code = "SUPABASE_CONNECTION_ERROR";
    return enhancedError;
  }

  // Handle specific Supabase error codes
  const errorCodeMap = {
    PGRST116: "No rows found",
    "42P01": "Table does not exist",
    23505: "Unique constraint violation",
    23503: "Foreign key constraint violation",
    42501: "Insufficient privileges",
    23514: "Check constraint violation",
    23502: "Not null constraint violation",
  };

  if (error.code && errorCodeMap[error.code]) {
    const enhancedError = new Error(
      `${context} failed: ${errorCodeMap[error.code]}${error.message ? ` - ${error.message}` : ""}`,
    );
    enhancedError.originalError = error;
    enhancedError.code = error.code;
    enhancedError.details = error.details;
    enhancedError.hint = error.hint;
    return enhancedError;
  }

  // Add context to generic errors
  if (error.message && !error.message.includes(context)) {
    error.context = context;
  }

  return error;
}

// Helper function to check supabaseAdmin and throw if not initialized
function requireSupabaseAdmin(context = "Database operation") {
  if (!supabaseAdmin) {
    throw new Error(
      `Supabase admin client is not initialized for ${context}. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.`,
    );
  }
}

// Helper functions for notifications
function getNotificationTitle(type, _message) {
  const titles = {
    training: "Training Session Reminder",
    achievement: "New Achievement Unlocked",
    team: "Team Update",
    game: "Game Update",
    general: "Notification",
  };
  return titles[type] || titles.general;
}

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }
  const weeks = Math.floor(diffDays / 7);
  return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
}

// Helper function to check if environment variables are configured
function checkEnvVars() {
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    const missing = [];
    if (!supabaseUrl) {
      missing.push("SUPABASE_URL");
    }
    if (!supabaseServiceKey) {
      missing.push("SUPABASE_SERVICE_KEY");
    }
    if (!supabaseAnonKey) {
      missing.push("SUPABASE_ANON_KEY");
    }

    console.error("Missing environment variables:", missing.join(", "));
    console.error("Current env vars:", {
      SUPABASE_URL: supabaseUrl
        ? `${supabaseUrl.substring(0, 20)}...`
        : "MISSING",
      SUPABASE_SERVICE_KEY: supabaseServiceKey ? "SET" : "MISSING",
      SUPABASE_ANON_KEY: supabaseAnonKey ? "SET" : "MISSING",
    });
    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(", ")}. Please set them in Netlify.`,
    );
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (_urlError) {
    console.error("Invalid SUPABASE_URL format:", supabaseUrl);
    throw new Error(
      `Invalid SUPABASE_URL format. Expected a valid URL, got: ${supabaseUrl?.substring(0, 50)}...`,
    );
  }

  // Also check if clients were initialized
  if (!supabaseAdmin || !supabase) {
    console.error("Supabase clients not initialized properly");
    console.error("Client status:", {
      supabaseAdmin: !!supabaseAdmin,
      supabase: !!supabase,
      supabaseUrl: supabaseUrl
        ? `${supabaseUrl.substring(0, 30)}...`
        : "MISSING",
    });
    throw new Error(
      "Supabase clients failed to initialize. Please check your environment variables.",
    );
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  supabaseService,
  getSupabaseClient,
  setAuthContextToken,
  runWithAuthContext,
  db,
  checkEnvVars,
};
