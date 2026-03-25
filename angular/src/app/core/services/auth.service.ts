import { Injectable, effect, inject, signal, untracked } from "@angular/core";
import { Router } from "@angular/router";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { Observable, from, of, throwError } from "rxjs";
import { catchError, map, tap } from "rxjs";
import { LoggerService } from "./logger.service";
import { PlatformService } from "./platform.service";
import { SupabaseService } from "./supabase.service";

export interface UserMetadata {
  full_name?: string;
  name?: string;
  role?: string;
  team_id?: string;
  avatar_url?: string;
  position?: string;
  [key: string]: unknown;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  position?: string;
  avatar_url?: string;
  emailConfirmed?: boolean;
  isSuperadmin?: boolean;
  user_metadata?: UserMetadata;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  redirectTo?: string;
  [key: string]: unknown;
}

export interface AuthSessionResult {
  user: User;
  session: Session | null;
  message?: string;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private logger = inject(LoggerService);
  private platform = inject(PlatformService);

  private readonly TOKEN_KEY = "authToken";
  private readonly USER_KEY = "user";
  private readonly CSRF_KEY = "csrfToken";

  // Signals for reactive state
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  constructor() {
    // Load stored auth state immediately
    this.loadStoredAuth();

    // Use effect() to reactively watch Supabase auth state changes (signals)
    // This is zoneless-compatible and more efficient than subscriptions
    effect(() => {
      const user = this.supabaseService.currentUser();
      // Use untracked for state updates to prevent effect from tracking its own writes
      untracked(() => {
        if (user) {
          const appUser = this.mapSupabaseUser(user);
          this.currentUser.set(appUser);
          this.isAuthenticated.set(true);
        } else {
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
        }
      });
    });
  }

  private loadStoredAuth(): void {
    // Supabase handles session persistence automatically
    // Just check if we have a current session (using signal)
    const session = this.supabaseService.session();
    if (session?.user) {
      this.currentUser.set(this.mapSupabaseUser(session.user));
      this.isAuthenticated.set(true);
    }
  }

  login(credentials: LoginCredentials): Observable<AuthSessionResult> {
    this.isLoading.set(true);
    const normalizedEmail = credentials.email.trim().toLowerCase();

    return from(
      this.supabaseService.signIn(normalizedEmail, credentials.password),
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(this.mapSupabaseAuthError(response.error.message));
        }
        if (!response.data.user) {
          throw new Error("Authentication succeeded without a user session.");
        }
        return {
          user: this.mapSupabaseUser(response.data.user),
          session: response.data.session,
        };
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => this.normalizeAuthError(error));
      }),
      tap(() => this.isLoading.set(false)),
    );
  }

  register(data: RegisterData): Observable<AuthSessionResult> {
    this.isLoading.set(true);

    // Extract metadata (everything except email/password)
    const {
      email: _email,
      password: _password,
      redirectTo,
      ...metadata
    } = data;
    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedMetadata = {
      ...metadata,
      name:
        typeof metadata["name"] === "string"
          ? metadata["name"].trim()
          : metadata["name"],
      full_name:
        typeof metadata["name"] === "string"
          ? metadata["name"].trim()
          : metadata["full_name"],
    };

    return from(
      this.supabaseService.signUp(
        normalizedEmail,
        data.password,
        normalizedMetadata,
        {
          emailRedirectTo: redirectTo,
        },
      ),
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(this.mapSupabaseAuthError(response.error.message));
        }
        if (!response.data.user) {
          throw new Error("Registration succeeded without a user record.");
        }
        return {
          user: this.mapSupabaseUser(response.data.user),
          session: response.data.session,
          message: "Please check your email to verify your account.",
        };
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => this.normalizeAuthError(error));
      }),
      tap(() => this.isLoading.set(false)),
    );
  }

  logout(): Observable<unknown> {
    const userId = this.currentUser()?.id;
    const email = this.currentUser()?.email;

    this.logger.info("[Auth] User logout initiated", { userId, email });

    return from(this.supabaseService.signOut()).pipe(
      tap(() => {
        this.clearAuth();
        this.logger.info("[Auth] User logout completed", { userId });
        this.router.navigate(["/login"]);
      }),
      catchError((error) => {
        // Even if logout fails on server, clear local auth
        this.logger.error(
          "[Auth] Logout error on server, clearing local auth",
          error,
          { userId: userId },
        );
        this.clearAuth();
        this.router.navigate(["/login"]);
        return throwError(() => error);
      }),
    );
  }

  getCurrentUser(): Observable<User | null> {
    // Use signal instead of property access
    const user = this.supabaseService.currentUser();
    if (user) {
      const appUser = this.mapSupabaseUser(user);
      this.currentUser.set(appUser);
      this.isAuthenticated.set(true);
      return of(appUser);
    }
    return of(null);
  }

  async getToken(): Promise<string | null> {
    return this.supabaseService.getToken();
  }

  getUser(): User | null {
    return this.currentUser();
  }

  checkAuth(): boolean {
    // Check if we have an authenticated session (using signal)
    const session = this.supabaseService.session();
    const isAuth = !!session && this.isAuthenticated();

    if (!isAuth && session) {
      // Session exists but state is not set, reload user
      this.getCurrentUser().subscribe();
    }

    return isAuth;
  }

  redirectToDashboard(): void {
    this.router.navigate(["/dashboard"]);
  }

  redirectToLogin(): void {
    this.router.navigate(["/login"]);
  }

  private clearAuth(): void {
    // Supabase handles session cleanup
    // Just clear our local state
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.platform.removeSessionStorage(this.CSRF_KEY);
  }

  generateCsrfToken(): string {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    this.platform.setSessionStorage(this.CSRF_KEY, token);
    return token;
  }

  getCsrfToken(): string | null {
    return this.platform.getSessionStorage(this.CSRF_KEY);
  }

  /**
   * Force refresh the current user from Supabase
   * Useful after updating user metadata
   */
  async refreshUser(): Promise<void> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabaseService.client.auth.getUser();

      if (error) {
        this.logger.warn("[Auth] Error refreshing user:", error);
        return;
      }

      if (user) {
        this.currentUser.set(this.mapSupabaseUser(user));
        this.isAuthenticated.set(true);
        this.logger.info("[Auth] User refreshed successfully");
      }
    } catch (error) {
      this.logger.error("[Auth] Failed to refresh user:", error);
    }
  }

  private mapSupabaseAuthError(message: string): string {
    const normalized = (message || "").toLowerCase();
    if (normalized.includes("invalid login credentials")) {
      return "Invalid email or password.";
    }
    if (
      normalized.includes("failed to fetch") ||
      normalized.includes("network error") ||
      normalized.includes("network request failed")
    ) {
      return "Authentication service unreachable. Check your network connection and Supabase configuration.";
    }
    if (normalized.includes("email not confirmed")) {
      return "Please verify your email before signing in.";
    }
    if (normalized.includes("user already registered")) {
      return "This email is already registered. Try signing in instead.";
    }
    if (normalized.includes("password should be at least")) {
      return "Password is too weak. Use at least 8 characters.";
    }
    return message || "Authentication failed. Please try again.";
  }

  private normalizeAuthError(error: unknown): Error {
    if (error instanceof Error) {
      return new Error(this.mapSupabaseAuthError(error.message));
    }

    return new Error(
      this.mapSupabaseAuthError(
        typeof error === "string" ? error : "Authentication failed. Please try again.",
      ),
    );
  }

  private mapSupabaseUser(user: SupabaseUser): User {
    const metadata = user.user_metadata as UserMetadata | undefined;
    const email = user.email ?? "";

    return {
      id: user.id,
      email,
      name: metadata?.["name"] ?? metadata?.["full_name"] ?? email,
      role: metadata?.["role"] ?? "user",
      position: metadata?.["position"] as string | undefined,
      avatar_url: metadata?.["avatar_url"] as string | undefined,
      emailConfirmed: !!user.email_confirmed_at,
      user_metadata: metadata,
    };
  }
}
