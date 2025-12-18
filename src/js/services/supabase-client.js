/**
 * Supabase Client for Frontend
 * Handles real-time subscriptions and database operations from the browser
 */

// Import Supabase from CDN for browser compatibility
const { createClient } = window.supabase || {};
import { logger } from '../../logger.js';

// Get Supabase configuration from environment or window globals
const getSupabaseConfig = () => {
  // Check if running in browser
  if (typeof window === 'undefined') {
    logger.error('[Supabase] Not running in browser environment');
    return { url: null, anonKey: null };
  }

  // Try to get from window._env (set by supabase-config.js or build process)
  if (window._env?.SUPABASE_URL && window._env?.SUPABASE_ANON_KEY) {
    return {
      url: window._env.SUPABASE_URL,
      anonKey: window._env.SUPABASE_ANON_KEY
    };
  }

  // Try to get from import.meta.env (Vite) - only if available
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
      return {
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
      };
    }
  } catch (e) {
    // import.meta not available in this context, continue to next check
  }

  // For local development, check localStorage for testing
  const isDevelopment = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

  if (isDevelopment) {
    const localUrl = localStorage.getItem('SUPABASE_URL');
    const localKey = localStorage.getItem('SUPABASE_ANON_KEY');

    if (localUrl && localKey) {
      logger.debug('[Supabase] Using credentials from localStorage (development only)');
      return { url: localUrl, anonKey: localKey };
    }

    // In development, show helpful error message
    logger.error('[Supabase] Missing configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    logger.error('[Supabase] Or add them to localStorage for local testing');
    return { url: null, anonKey: null };
  }

  // Production: Fail securely - no fallback to hardcoded values
  logger.error('[Supabase] CRITICAL: Missing Supabase configuration in production');
  logger.error('[Supabase] Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  return { url: null, anonKey: null };
};

// Initialize Supabase client
let supabaseClient = null;
let isInitialized = false;

export const initializeSupabase = () => {
  if (isInitialized && supabaseClient) {
    logger.debug('[Supabase] Already initialized');
    return supabaseClient;
  }

  const config = getSupabaseConfig();

  if (!config.url || !config.anonKey) {
    logger.error('[Supabase] Missing configuration. URL or Anon Key not found.');
    return null;
  }

  try {
    supabaseClient = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'flagfit-auth',
        storage: window.localStorage
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    isInitialized = true;
    logger.success('[Supabase] Client initialized successfully');
    return supabaseClient;
  } catch (error) {
    logger.error('[Supabase] Failed to initialize client:', error);
    return null;
  }
};

// Get the Supabase client instance (initialize if not already done)
export const getSupabase = () => {
  if (!supabaseClient) {
    return initializeSupabase();
  }
  return supabaseClient;
};

/**
 * Real-time Subscription Manager
 * Handles all real-time database subscriptions
 */
class RealtimeManager {
  constructor() {
    this.subscriptions = new Map();
    this.channels = new Map();
  }

  /**
   * Subscribe to real-time changes on a table
   * @param {string} table - Table name to subscribe to
   * @param {object} options - Subscription options
   * @param {function} callback - Callback function for changes
   * @returns {object} Subscription object with unsubscribe method
   */
  subscribe(table, options = {}, callback) {
    const client = getSupabase();
    if (!client) {
      logger.error('[Realtime] Cannot subscribe - Supabase client not initialized');
      return null;
    }

    const {
      event = '*', // INSERT, UPDATE, DELETE, or *
      filter = null, // e.g., 'user_id=eq.123'
      schema = 'public'
    } = options;

    const channelName = `${schema}:${table}:${event}:${filter || 'all'}`;

    // Check if channel already exists
    if (this.channels.has(channelName)) {
      logger.debug(`[Realtime] Reusing existing channel: ${channelName}`);
      const channel = this.channels.get(channelName);
      return {
        unsubscribe: () => this.unsubscribe(channelName)
      };
    }

    try {
      // Create a new channel
      const channel = client.channel(channelName);

      // Build subscription query
      const subscription = channel.on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          filter
        },
        (payload) => {
          logger.debug(`[Realtime] Change detected in ${table}:`, payload);
          callback(payload);
        }
      );

      // Subscribe to the channel
      subscription.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.success(`[Realtime] Subscribed to ${table} (${event})`);
        } else if (status === 'CHANNEL_ERROR') {
          logger.error(`[Realtime] Channel error for ${table}`);
        } else if (status === 'TIMED_OUT') {
          logger.warn(`[Realtime] Subscription timed out for ${table}`);
        } else if (status === 'CLOSED') {
          logger.debug(`[Realtime] Channel closed for ${table}`);
        }
      });

      // Store the channel
      this.channels.set(channelName, channel);
      this.subscriptions.set(channelName, { table, event, callback });

      return {
        unsubscribe: () => this.unsubscribe(channelName)
      };
    } catch (error) {
      logger.error(`[Realtime] Failed to subscribe to ${table}:`, error);
      return null;
    }
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channelName - Channel name to unsubscribe from
   */
  async unsubscribe(channelName) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      logger.warn(`[Realtime] Channel not found: ${channelName}`);
      return;
    }

    try {
      await channel.unsubscribe();
      this.channels.delete(channelName);
      this.subscriptions.delete(channelName);
      logger.debug(`[Realtime] Unsubscribed from ${channelName}`);
    } catch (error) {
      logger.error(`[Realtime] Failed to unsubscribe from ${channelName}:`, error);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll() {
    logger.debug('[Realtime] Unsubscribing from all channels...');
    const promises = Array.from(this.channels.keys()).map(channelName =>
      this.unsubscribe(channelName)
    );
    await Promise.all(promises);
    logger.success('[Realtime] Unsubscribed from all channels');
  }

  /**
   * Get active subscriptions count
   */
  getActiveCount() {
    return this.subscriptions.size;
  }

  /**
   * List all active subscriptions
   */
  listActive() {
    return Array.from(this.subscriptions.entries()).map(([channel, info]) => ({
      channel,
      ...info
    }));
  }
}

// Create singleton instance
export const realtimeManager = new RealtimeManager();

/**
 * Helper functions for common database operations
 */
export const supabaseHelpers = {
  /**
   * Subscribe to chat messages in real-time
   * @param {string} channel - Channel name
   * @param {function} callback - Callback for new messages
   */
  subscribeToChatMessages(channel, callback) {
    return realtimeManager.subscribe(
      'chat_messages',
      {
        event: 'INSERT',
        filter: `channel=eq.${channel}`
      },
      (payload) => callback(payload.new)
    );
  },

  /**
   * Subscribe to user notifications in real-time
   * @param {string} userId - User ID
   * @param {function} callback - Callback for new notifications
   */
  subscribeToNotifications(userId, callback) {
    return realtimeManager.subscribe(
      'notifications',
      {
        event: 'INSERT',
        filter: `user_id=eq.${userId}`
      },
      (payload) => callback(payload.new)
    );
  },

  /**
   * Subscribe to team updates in real-time
   * @param {string} teamId - Team ID
   * @param {function} callback - Callback for team changes
   */
  subscribeToTeamUpdates(teamId, callback) {
    return realtimeManager.subscribe(
      'teams',
      {
        event: '*',
        filter: `id=eq.${teamId}`
      },
      (payload) => callback(payload)
    );
  },

  /**
   * Subscribe to game updates in real-time
   * @param {string} gameId - Game ID (optional, subscribes to all if not provided)
   * @param {function} callback - Callback for game changes
   */
  subscribeToGameUpdates(gameId, callback) {
    const options = {
      event: '*'
    };
    if (gameId) {
      options.filter = `id=eq.${gameId}`;
    }
    return realtimeManager.subscribe('games', options, (payload) => callback(payload));
  },

  /**
   * Subscribe to community posts in real-time
   * @param {function} callback - Callback for new posts
   */
  subscribeToCommunityPosts(callback) {
    return realtimeManager.subscribe(
      'posts',
      {
        event: 'INSERT'
      },
      (payload) => callback(payload.new)
    );
  },

  /**
   * Subscribe to training sessions updates
   * @param {string} userId - User ID
   * @param {function} callback - Callback for training session changes
   */
  subscribeToTrainingSessions(userId, callback) {
    return realtimeManager.subscribe(
      'training_sessions',
      {
        event: '*',
        filter: `user_id=eq.${userId}`
      },
      (payload) => callback(payload)
    );
  },

  /**
   * Subscribe to tournament updates
   * @param {string} tournamentId - Tournament ID (optional)
   * @param {function} callback - Callback for tournament changes
   */
  subscribeToTournaments(tournamentId, callback) {
    const options = {
      event: '*'
    };
    if (tournamentId) {
      options.filter = `id=eq.${tournamentId}`;
    }
    return realtimeManager.subscribe('tournaments', options, (payload) => callback(payload));
  }
};

// Auto-initialize on import (safe - will return null if config missing)
// This allows the module to load even if env vars aren't ready yet
// Client will be initialized when getSupabase() is called
try {
  initializeSupabase();
} catch (error) {
  // Silently fail - initialization will happen when needed
  logger.debug('[Supabase] Auto-initialization deferred:', error.message);
}

// Export everything
export { supabaseClient };
export default {
  getSupabase,
  initializeSupabase,
  realtimeManager,
  supabaseHelpers
};
