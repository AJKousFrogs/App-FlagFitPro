import { Injectable, effect, inject, signal, untracked } from "@angular/core";
import { Router } from "@angular/router";
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
  [key: string]: unknown;
}

interface AuthResponse {
  success: boolean;
  data?:
    | {
        user: unknown;
        session?: unknown;
      }
    | User;
  message?: string;
  error?: string;
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
          const metadata = user.user_metadata as UserMetadata | undefined;
          const appUser: User = {
            id: user.id,
            email: user.email ?? "",
            name: metadata?.["name"] ?? metadata?.["full_name"] ?? user.email,
            role: metadata?.["role"] ?? "user",
            user_metadata: metadata,
          };
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
      const user: User = {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.user_metadata?.["name"] ?? session.user.email,
        role: session.user.user_metadata?.["role"] ?? "user",
      };
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.isLoading.set(true);

    return from(
      this.supabaseService.signIn(credentials.email, credentials.password),
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return {
          success: true,
          data: {
            user: response.data.user,
            session: response.data.session,
          },
        };
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => error);
      }),
      tap(() => this.isLoading.set(false)),
    );
  }

  register(data: RegisterData): Observable<AuthResponse> {
    this.isLoading.set(true);

    // Extract metadata (everything except email/password)
    const { email: _email, password: _password, ...metadata } = data;

    return from(
      this.supabaseService.signUp(data.email, data.password, metadata),
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return {
          success: true,
          data: {
            user: response.data.user,
            session: response.data.session,
          },
          message: "Please check your email to verify your account.",
        };
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => error);
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

  getCurrentUser(): Observable<AuthResponse> {
    // Use signal instead of property access
    const user = this.supabaseService.currentUser();
    if (user) {
      const appUser: User = {
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.["name"] ?? user.email,
        role: user.user_metadata?.["role"] ?? "user",
      };
      this.currentUser.set(appUser);
      this.isAuthenticated.set(true);
      return of({ success: true, data: appUser });
    }
    return of({ success: false, error: "No user found" });
  }

  async getToken(): Promise<string | null> {
    try {
      // Force refresh session to ensure we have the latest token
      const { data, error } =
        await this.supabaseService.client.auth.getSession();

      if (error) {
        this.logger.warn("[Auth] Error getting session:", error);
        return null;
      }

      // Check if token is expired or about to expire (within 60 seconds)
      if (data.session) {
        const expiresAt = data.session.expires_at;
        const now = Math.floor(Date.now() / 1000);

        if (expiresAt && expiresAt - now < 60) {
          // Token expired or expiring soon, try to refresh
          this.logger.debug("[Auth] Token expiring soon, attempting refresh");

          const { data: refreshData, error: refreshError } =
            await this.supabaseService.client.auth.refreshSession();

          if (!refreshError && refreshData.session) {
            return refreshData.session.access_token;
          } else {
            this.logger.warn("[Auth] Failed to refresh session:", refreshError);
            // CRITICAL FIX: If refresh fails, the token is invalid - return null
            // This prevents sending an expired token that will fail with 401
            return null;
          }
        }

        return data.session.access_token;
      }

      return null;
    } catch (error) {
      this.logger.error("[Auth] Exception getting token:", error);
      return null;
    }
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
        const metadata = user.user_metadata as UserMetadata | undefined;
        const appUser: User = {
          id: user.id,
          email: user.email ?? "",
          name: metadata?.["name"] ?? metadata?.["full_name"] ?? user.email,
          role: metadata?.["role"] ?? "user",
          position: metadata?.["position"],
          avatar_url: metadata?.["avatar_url"],
          user_metadata: metadata,
        };
        this.currentUser.set(appUser);
        this.isAuthenticated.set(true);
        this.logger.info("[Auth] User refreshed successfully");
      }
    } catch (error) {
      this.logger.error("[Auth] Failed to refresh user:", error);
    }
  }
}
