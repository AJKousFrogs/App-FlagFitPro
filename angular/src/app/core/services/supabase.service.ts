import { computed, inject, Injectable, signal } from "@angular/core";
import type {
  AuthChangeEvent,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  Session,
  SupabaseClient,
  User,
  UserAttributes,
} from "@supabase/supabase-js";
import { environment } from "../../../environments/environment";
import { LoggerService, toLogContext } from "./logger.service";
import { CorrelationContextService } from "./correlation-context.service";

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
  private readonly correlation = inject(CorrelationContextService);
  /** Populated after `import("@supabase/supabase-js")` resolves. */
  private supabase: SupabaseClient | null = null;
  private readonly bootstrapPromise: Promise<void>;

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
      this.logger.error("supabase_config_missing", undefined, {
        urlConfigured: !!environment.supabase.url,
        anonKeyConfigured: !!environment.supabase.anonKey,
      });
      throw new Error(
        "Supabase configuration is required. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
      );
    }

    if (this.isServiceRoleKey(environment.supabase.anonKey)) {
      this.logger.error("supabase_service_role_key_in_client");
      throw new Error(
        "Supabase service role keys must not be used in the client.",
      );
    }

    if (this.isClearlyInvalidPublicKey(environment.supabase.anonKey)) {
      this.logger.error("supabase_invalid_anon_key_format");
      throw new Error(
        "Supabase anon/publishable key is invalid. Check SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY.",
      );
    }

    // Load `@supabase/supabase-js` in a separate async chunk so it is not part of the
    // initial bundle (saves ~170KB+ gzipped transfer vs eager static import).
    this.bootstrapPromise = this.bootstrapClient().catch((error: unknown) => {
      this.logger.error("supabase_bootstrap_failed", error);
      if (!this._isInitialized()) {
        this._isInitialized.set(true);
      }
    });
  }

  /**
   * Dynamic import + client creation + auth listener. Keeps the heavy Supabase SDK
   * out of the main synchronous graph.
   */
  private async bootstrapClient(): Promise<void> {
    const { createClient } = await import("@supabase/supabase-js");
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: true,
        },
        global: {
          fetch: (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const traceId =
              this.correlation.traceId() ?? this.correlation.getOrCreateForRequest();
            const headers = new Headers(init?.headers ?? undefined);
            headers.set("x-trace-id", traceId);
            return fetch(input, { ...init, headers });
          },
        },
      },
    );
    await this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const client = this.supabase;
      if (!client) {
        throw new Error("[SupabaseService] Client missing during initializeAuth");
      }
      // Get initial session
      const { data } = await client.auth.getSession();

      this.logger.debug("supabase_initial_session", {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
      });

      this._session.set(data.session);
      this._currentUser.set(data.session?.user ?? null);

      // Listen for auth changes
      client.auth.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          this.logger.debug("supabase_auth_state_changed", toLogContext(event));
          this._session.set(session);
          this._currentUser.set(session?.user ?? null);

          // Handle specific auth events
          switch (event) {
            case "SIGNED_OUT":
              this.logger.info("supabase_signed_out", {
                userId: session?.user?.id,
                timestamp: new Date().toISOString(),
              });
              break;
            case "TOKEN_REFRESHED":
              this.logger.debug("supabase_token_refreshed", {
                userId: session?.user?.id,
                expiresAt: session?.expires_at,
                timestamp: new Date().toISOString(),
              });
              break;
            case "USER_UPDATED":
              this.logger.debug("supabase_user_updated", {
                userId: session?.user?.id,
              });
              break;
            case "PASSWORD_RECOVERY":
              this.logger.info("supabase_password_recovery", {
                userId: session?.user?.id,
              });
              break;
            case "SIGNED_IN":
              this.logger.info("supabase_signed_in", {
                userId: session?.user?.id,
                email: session?.user?.email,
                timestamp: new Date().toISOString(),
              });
              break;
          }
        },
      );
    } catch (error) {
      this.logger.error("supabase_auth_init_failed", error);
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
    try {
      await this.bootstrapPromise;
    } catch {
      // bootstrapPromise rejection is handled in constructor .catch
    }
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
    if (!this.supabase) {
      throw new Error(
        "[SupabaseService] Client not ready. Call await waitForInit() before using .client.",
      );
    }
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
   * Refresh the current user from Supabase auth and update local signals.
   */
  async refreshCurrentUser(): Promise<User | null> {
    await this.waitForInit();
    try {
      const {
        data: { user },
        error,
      } = await this.client.auth.getUser();

      if (error) {
        this.logger.warn("supabase_refresh_user_failed", toLogContext(error));
        return null;
      }

      this._currentUser.set(user ?? null);
      return user ?? null;
    } catch (error) {
      this.logger.error("supabase_refresh_user_unexpected_error", error);
      return null;
    }
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
    await this.waitForInit();
    return await this.client.auth.signInWithPassword({
      email,
      password,
    });
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    metadata?: UserMetadata,
    options?: { emailRedirectTo?: string },
  ) {
    await this.waitForInit();
    return await this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: options?.emailRedirectTo,
      },
    });
  }

  /**
   * Sign out — clears auth session and all browser-cached data.
   */
  async signOut() {
    await this.waitForInit();
    const result = await this.client.auth.signOut();

    // Clear Angular state immediately (onAuthStateChange also does this, but be explicit)
    this._currentUser.set(null);
    this._session.set(null);

    // Clear service worker cache so stale athlete data cannot be read
    // by the next person who uses this device.
    if (typeof window !== "undefined" && "caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch {
        // Non-fatal — cache clearing is best-effort
      }
    }

    return result;
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    await this.waitForInit();
    return await this.client.auth.resetPasswordForEmail(email);
  }

  /**
   * Update user metadata
   */
  async updateUser(attributes: UserAttributes) {
    await this.waitForInit();
    return await this.client.auth.updateUser(attributes);
  }

  /**
   * Get auth token
   */
  async getToken(): Promise<string | null> {
    await this.waitForInit();
    try {
      const { data, error } = await this.client.auth.getSession();

      if (error) {
        this.logger.warn("supabase_get_session_token_failed", toLogContext(error));
        return null;
      }

      const session = data.session;
      if (!session) {
        return null;
      }

      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);

      if (expiresAt && expiresAt - now < 60) {
        this.logger.debug("supabase_token_expiring_refresh");

        const { data: refreshData, error: refreshError } =
          await this.client.auth.refreshSession();

        if (refreshError || !refreshData.session) {
          this.logger.warn(
            "supabase_refresh_session_token_failed",
            toLogContext(refreshError),
          );
          return null;
        }

        return refreshData.session.access_token;
      }

      return session.access_token;
    } catch (error) {
      this.logger.error("supabase_get_session_token_exception", error);
      return null;
    }
  }

  /**
   * Force a session refresh after HTTP 401 so the client can retry with a new access token.
   * Does not sign out on failure — callers decide (e.g. retry once, then sign out).
   */
  async refreshSessionForHttpRetry(): Promise<boolean> {
    await this.waitForInit();
    if (!this.client) {
      return false;
    }
    try {
      const { data, error } = await this.client.auth.refreshSession();
      if (error || !data.session) {
        this.logger.warn(
          "supabase_refresh_session_http_recovery_failed",
          error ? toLogContext(error) : undefined,
        );
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(
        "supabase_refresh_session_http_recovery_exception",
        error,
        toLogContext(error),
      );
      return false;
    }
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
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => void,
    onUpdate?: (
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => void,
  ): RealtimeChannel {
    const channelName = `coach-inbox:${coachId}`;

    let channel = this.client.channel(channelName);

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
      this.logger.debug("supabase_coach_inbox_subscription_status", {
        status,
      });
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
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => void,
    onUpdate?: (
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
    ) => void,
  ): RealtimeChannel {
    const channelName = `athlete-daily-state`;

    // Note: Supabase doesn't support IN filters for realtime, so we subscribe to all
    // and filter client-side. For performance, consider server-side filtering.
    let channel = this.client.channel(channelName);

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
      this.logger.debug("supabase_daily_wellness_subscription_status", {
        status,
      });
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
      this.client.removeChannel(channel);
    }
  }
}
