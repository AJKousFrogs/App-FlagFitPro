import { computed, inject, Injectable, signal } from "@angular/core";
import {
  AuthChangeEvent,
  createClient,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  Session,
  SupabaseClient,
  User,
  UserAttributes,
} from "@supabase/supabase-js";
import { environment } from "../../../environments/environment";
import { LoggerService, toLogContext } from "./logger.service";

export interface UserMetadata {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
  position?: string;
  teamId?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: "root",
})
export class SupabaseService {
  private logger = inject(LoggerService);
  private supabase: SupabaseClient;

  // UI State: Use signals instead of BehaviorSubject
  private readonly _currentUser = signal<User | null>(null);
  private readonly _session = signal<Session | null>(null);
  private readonly _isInitialized = signal<boolean>(false);

  // Public readonly signals for components
  readonly currentUser = this._currentUser.asReadonly();
  readonly session = this._session.asReadonly();
  readonly isInitialized = this._isInitialized.asReadonly();

  // Computed signals for derived state
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userId = computed(() => this._currentUser()?.id ?? null);

  constructor() {
    // Validate Supabase configuration
    if (!environment.supabase.url || !environment.supabase.anonKey) {
      this.logger.error("[SupabaseService] Missing Supabase configuration!");
      this.logger.error(
        "[SupabaseService] URL:",
        environment.supabase.url || "MISSING",
      );
      this.logger.error(
        "[SupabaseService] AnonKey:",
        environment.supabase.anonKey ? "SET" : "MISSING",
      );
      this.logger.error(
        "[SupabaseService] For local dev, ensure dev server injects window._env",
      );
      this.logger.error(
        "[SupabaseService] For production, use Angular file replacement to inject values",
      );
      throw new Error(
        "Supabase configuration is required. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
      );
    }

    if (this.isServiceRoleKey(environment.supabase.anonKey)) {
      this.logger.error(
        "[SupabaseService] Service role key detected in client configuration.",
      );
      throw new Error(
        "Supabase service role keys must not be used in the client.",
      );
    }

    if (this.isClearlyInvalidPublicKey(environment.supabase.anonKey)) {
      this.logger.error(
        "[SupabaseService] Invalid Supabase public key format in client configuration.",
      );
      throw new Error(
        "Supabase anon/publishable key is invalid. Check SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY.",
      );
    }

    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
    );

    // Initialize session and set up auth listener
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Get initial session
      const { data } = await this.supabase.auth.getSession();

      this.logger.debug("[SupabaseService] Initial session", {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
      });

      this._session.set(data.session);
      this._currentUser.set(data.session?.user ?? null);

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          this.logger.debug("Auth state changed:", toLogContext(event));
          this._session.set(session);
          this._currentUser.set(session?.user ?? null);

          // Handle specific auth events
          switch (event) {
            case "SIGNED_OUT":
              this.logger.info("[Supabase] User signed out", {
                userId: session?.user?.id,
                timestamp: new Date().toISOString(),
              });
              break;
            case "TOKEN_REFRESHED":
              this.logger.debug(
                "[Supabase] Session token refreshed automatically",
                {
                  userId: session?.user?.id,
                  expiresAt: session?.expires_at,
                  timestamp: new Date().toISOString(),
                },
              );
              break;
            case "USER_UPDATED":
              this.logger.debug("[Supabase] User profile updated", {
                userId: session?.user?.id,
              });
              break;
            case "PASSWORD_RECOVERY":
              this.logger.info("[Supabase] Password recovery initiated", {
                userId: session?.user?.id,
              });
              break;
            case "SIGNED_IN":
              this.logger.info("[Supabase] User signed in", {
                userId: session?.user?.id,
                email: session?.user?.email,
                timestamp: new Date().toISOString(),
              });
              break;
          }
        },
      );
    } catch (error) {
      this.logger.error("[Supabase] Auth initialization error", { error });
      throw error;
    } finally {
      // Mark as initialized even if there's no session
      this._isInitialized.set(true);
    }
  }

  /**
   * Wait for auth initialization to complete
   * Use this in guards to avoid race conditions
   */
  async waitForInit(): Promise<void> {
    if (this._isInitialized()) return;

    // Poll until initialized (max 5 seconds)
    const maxWait = 5000;
    const interval = 50;
    let waited = 0;

    while (!this._isInitialized() && waited < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      waited += interval;
    }
  }

  private isServiceRoleKey(key: string): boolean {
    try {
      if (typeof atob !== "function") return false;
      const payload = key.split(".")[1];
      if (!payload) return false;
      const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "=");
      const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
      const data = JSON.parse(decoded) as { role?: string };
      return data?.role === "service_role";
    } catch {
      return false;
    }
  }

  private isClearlyInvalidPublicKey(key: string): boolean {
    const normalized = key.trim();
    if (!normalized) return true;

    // Catch common placeholder values from template env files.
    if (/your_supabase|placeholder|changeme/i.test(normalized)) {
      return true;
    }

    // Modern publishable keys.
    if (normalized.startsWith("sb_publishable_")) {
      return false;
    }

    // Legacy JWT anon key format.
    return normalized.split(".").length !== 3;
  }

  /**
   * Get the Supabase client instance
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get the Supabase anon key for direct API calls
   */
  get supabaseKey(): string {
    return environment.supabase.anonKey;
  }

  /**
   * Get current user (synchronous access)
   */
  getCurrentUser(): User | null {
    return this._currentUser();
  }

  /**
   * Get current session (synchronous access)
   */
  getSession(): Session | null {
    return this._session();
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: UserMetadata) {
    return await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  }

  /**
   * Sign out
   */
  async signOut() {
    return await this.supabase.auth.signOut();
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    return await this.supabase.auth.resetPasswordForEmail(email);
  }

  /**
   * Update user metadata
   */
  async updateUser(attributes: UserAttributes) {
    return await this.supabase.auth.updateUser(attributes);
  }

  /**
   * Get auth token
   */
  async getToken(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  // ==========================================================
  // Phase 1: Realtime Subscriptions for Coach Inbox
  // ==========================================================

  /**
   * Subscribe to coach inbox items (real-time updates)
   * Returns a channel that can be used to unsubscribe
   *
   * @param coachId - Coach user ID to filter items
   * @param onInsert - Callback for new inbox items
   * @param onUpdate - Callback for updated inbox items
   * @returns RealtimeChannel for cleanup
   */
  subscribeToCoachInbox(
    coachId: string,
    onInsert?: (
      payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
    ) => void,
    onUpdate?: (
      payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
    ) => void,
  ): RealtimeChannel {
    const channelName = `coach-inbox:${coachId}`;

    let channel = this.supabase.channel(channelName);

    // Subscribe to INSERT events
    if (onInsert) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "coach_inbox_items",
          filter: `coach_id=eq.${coachId}`,
        },
        onInsert,
      );
    }

    // Subscribe to UPDATE events
    if (onUpdate) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "coach_inbox_items",
          filter: `coach_id=eq.${coachId}`,
        },
        onUpdate,
      );
    }

    channel.subscribe((status) => {
      this.logger.debug(
        `[SupabaseService] Coach inbox subscription status: ${status}`,
      );
    });

    return channel;
  }

  /**
   * Subscribe to athlete daily state changes (for coaches monitoring their team)
   *
   * @param teamPlayerIds - Array of player user IDs to monitor
   * @param onInsert - Callback for new daily state entries
   * @param onUpdate - Callback for updated daily state entries
   * @returns RealtimeChannel for cleanup
   */
  subscribeToAthleteDailyState(
    teamPlayerIds: string[],
    onInsert?: (
      payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
    ) => void,
    onUpdate?: (
      payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>,
    ) => void,
  ): RealtimeChannel {
    const channelName = `athlete-daily-state`;

    // Note: Supabase doesn't support IN filters for realtime, so we subscribe to all
    // and filter client-side. For performance, consider server-side filtering.
    let channel = this.supabase.channel(channelName);

    if (onInsert) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "daily_wellness_checkin",
        },
        (payload) => {
          // Client-side filter
          const userId = (payload.new as { user_id?: string })?.user_id;
          if (userId && teamPlayerIds.includes(userId)) {
            onInsert(payload);
          }
        },
      );
    }

    if (onUpdate) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "daily_wellness_checkin",
        },
        (payload) => {
          const userId = (payload.new as { user_id?: string })?.user_id;
          if (userId && teamPlayerIds.includes(userId)) {
            onUpdate(payload);
          }
        },
      );
    }

    channel.subscribe((status) => {
      this.logger.debug(
        `[SupabaseService] Daily wellness checkin subscription status: ${status}`,
      );
    });

    return channel;
  }

  /**
   * Unsubscribe from a realtime channel
   *
   * @param channel - The channel to unsubscribe from
   */
  unsubscribe(channel: RealtimeChannel): void {
    if (channel) {
      this.supabase.removeChannel(channel);
      this.logger.debug("[SupabaseService] Unsubscribed from realtime channel");
    }
  }
}
