import { Injectable } from "@angular/core";
import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { environment } from "../../../environments/environment";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private _currentUser = new BehaviorSubject<User | null>(null);
  private _session = new BehaviorSubject<Session | null>(null);

  public currentUser$: Observable<User | null> = this._currentUser.asObservable();
  public session$: Observable<Session | null> = this._session.asObservable();

  constructor() {
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
    this._session.next(data.session);
    this._currentUser.next(data.session?.user ?? null);

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log("Auth state changed:", event);
      this._session.next(session);
      this._currentUser.next(session?.user ?? null);
    });
  }

  /**
   * Get the Supabase client instance
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get current user
   */
  get currentUser(): User | null {
    return this._currentUser.value;
  }

  /**
   * Get current session
   */
  get session(): Session | null {
    return this._session.value;
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
