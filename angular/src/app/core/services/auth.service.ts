import { Injectable, effect, inject, signal, untracked } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, from, of, throwError } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

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
        this.logger.error("[Auth] Logout error on server, clearing local auth", { userId, error });
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
    return await this.supabaseService.getToken();
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
    sessionStorage.removeItem(this.CSRF_KEY);
  }

  generateCsrfToken(): string {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    sessionStorage.setItem(this.CSRF_KEY, token);
    return token;
  }

  getCsrfToken(): string | null {
    return sessionStorage.getItem(this.CSRF_KEY);
  }
}
