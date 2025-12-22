import { Injectable, inject, signal, computed } from "@angular/core";
import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { environment } from "../../../environments/environment";
import { LoggerService } from "./logger.service";

@Injectable({
  providedIn: "root",
})
export class SupabaseService {
  private logger = inject(LoggerService);
  private supabase: SupabaseClient;
  
  // UI State: Use signals instead of BehaviorSubject
  private readonly _currentUser = signal<User | null>(null);
  private readonly _session = signal<Session | null>(null);

  // Public readonly signals for components
  readonly currentUser = this._currentUser.asReadonly();
  readonly session = this._session.asReadonly();

  // Computed signals for derived state
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userId = computed(() => this._currentUser()?.id ?? null);

  constructor() {
    // Validate Supabase configuration
    if (!environment.supabase.url || !environment.supabase.anonKey) {
      this.logger.error('[SupabaseService] Missing Supabase configuration!');
      this.logger.error('[SupabaseService] URL:', environment.supabase.url || 'MISSING');
      this.logger.error('[SupabaseService] AnonKey:', environment.supabase.anonKey ? 'SET' : 'MISSING');
      this.logger.error('[SupabaseService] For local dev, ensure dev server injects window._env');
      this.logger.error('[SupabaseService] For production, use Angular file replacement to inject values');
      throw new Error('Supabase configuration is required. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
    }

    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );

    // Initialize session and set up auth listener
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Get initial session
    const { data } = await this.supabase.auth.getSession();
    this._session.set(data.session);
    this._currentUser.set(data.session?.user ?? null);

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this.logger.debug("Auth state changed:", event);
      this._session.set(session);
      this._currentUser.set(session?.user ?? null);
    });
  }

  /**
   * Get the Supabase client instance
   */
  get client(): SupabaseClient {
    return this.supabase;
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
  async signUp(email: string, password: string, metadata?: any) {
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
  async updateUser(attributes: any) {
    return await this.supabase.auth.updateUser(attributes);
  }

  /**
   * Get auth token
   */
  async getToken(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }
}
