import { CommonModule, DatePipe } from "@angular/common";
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { CardModule } from "primeng/card";
import { Message } from "primeng/message";
import { interval } from "rxjs";
import { environment } from "../../../../environments/environment";
import { AuthDebugService } from "../../../core/services/auth-debug.service";
import { AuthService } from "../../../core/services/auth.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ButtonComponent } from "../button/button.component";

/**
 * Authentication Debug Component
 * Display current auth status and provide debugging tools
 *
 * Usage: Add to any component temporarily to debug auth issues
 * <app-auth-debug-panel></app-auth-debug-panel>
 *
 * WARNING: This component throws in production to prevent accidental shipping.
 */
@Component({
  selector: "app-auth-debug-panel",
  standalone: true,
  imports: [CommonModule, DatePipe, CardModule, Message, ButtonComponent],
  template: `
    <p-card
      header="🔍 Authentication Debug Panel"
      styleClass="mb-4"
      data-testid="auth-debug-panel"
    >
      <div class="grid">
        <!-- Current Status -->
        <div class="col-12 md:col-6">
          <h4>Current Status</h4>
          <div class="flex flex-col gap-2">
            <div data-testid="auth-status">
              <strong>Authenticated:</strong>
              <span [class]="authClass()">
                {{ authStatus() }}
              </span>
            </div>
            <div data-testid="user-id">
              <strong>User ID:</strong> {{ userId() }}
            </div>
            <div data-testid="user-email">
              <strong>Email:</strong> {{ userEmail() }}
            </div>
            <div data-testid="session-expires">
              <strong>Session Expires:</strong>
              @if (expiresAt()) {
                <span>{{ expiresAt() | date: "short" }}</span>
                <span class="ml-2" [class]="expiryClass()">
                  ({{ timeUntilExpiry() }})
                </span>
              } @else {
                <span class="text-red-600">No session</span>
              }
            </div>
          </div>

          <!-- Token Debug Info -->
          <h4 class="mt-4">Token Status</h4>
          <div class="flex flex-col gap-2">
            <div data-testid="access-token-status">
              <strong>Access Token:</strong>
              <span [class]="hasAccessToken() ? 'text-green-600' : 'text-red-600'">
                {{ hasAccessToken() ? '✅ Present' : '❌ Missing' }}
              </span>
            </div>
            <div data-testid="refresh-token-status">
              <strong>Refresh Token:</strong>
              <span [class]="hasRefreshToken() ? 'text-green-600' : 'text-red-600'">
                {{ hasRefreshToken() ? '✅ Present' : '❌ Missing' }}
              </span>
            </div>
            <div data-testid="last-auth-event">
              <strong>Last Auth Event:</strong>
              <span class="text-blue-600">{{ lastAuthEvent() }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="col-12 md:col-6">
          <h4>Debug Actions</h4>
          <div class="flex flex-col gap-2">
            <app-button
              iconLeft="pi-check"
              variant="secondary"
              (clicked)="checkAuthStatus()"
              [loading]="checking()"
              [fullWidth]="true"
            >Check Auth Status</app-button>
            <app-button
              iconLeft="pi-refresh"
              variant="success"
              (clicked)="refreshSession()"
              [loading]="refreshing()"
              [fullWidth]="true"
            >Refresh Session</app-button>
            <app-button
              iconLeft="pi-sign-in"
              variant="outlined"
              (clicked)="forceReauth()"
              [loading]="reauthing()"
              [fullWidth]="true"
            >Force Re-authenticate</app-button>
          </div>
        </div>

        <!-- Last Check Result -->
        @if (lastCheckMessage()) {
          <div class="col-12">
            <p-message [severity]="lastCheckSeverity()" styleClass="status-message">
              {{ lastCheckMessage() }}
            </p-message>
          </div>
        }

        <!-- Console Notice -->
        <div class="col-12">
          <p-message severity="info" styleClass="status-message">
            Detailed logs are available in the browser console (press F12)
          </p-message>
        </div>
      </div>
    </p-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class AuthDebugPanelComponent {
  private destroyRef = inject(DestroyRef);

  authDebugService = inject(AuthDebugService);
  supabase = inject(SupabaseService);
  authService = inject(AuthService);

  checking = signal(false);
  refreshing = signal(false);
  reauthing = signal(false);

  lastCheckMessage = signal<string | null>(null);
  lastCheckSeverity = signal<"success" | "info" | "warn" | "error">("info");

  // Reactive "clock" so the countdown updates
  private now = signal(Date.now());

  // Session-derived signals
  expiresAt = signal<Date | null>(null);
  userId = signal<string>("N/A");
  userEmail = signal<string>("N/A");

  // Token debug signals
  hasAccessToken = signal(false);
  hasRefreshToken = signal(false);
  lastAuthEvent = signal<string>("None");

  // Computed UI values
  authStatus = computed(() =>
    this.authService.isAuthenticated() ? "✅ Yes" : "❌ No",
  );

  authClass = computed(() =>
    this.authService.isAuthenticated() ? "text-green-600" : "text-red-600",
  );

  timeUntilExpiry = computed(() => {
    const expires = this.expiresAt();
    if (!expires) return "Unknown";

    const diff = expires.getTime() - this.now();
    if (diff < 0) return "EXPIRED";

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  });

  expiryClass = computed(() => {
    const expires = this.expiresAt();
    if (!expires) return "text-red-600";

    const diff = expires.getTime() - this.now();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 0) return "text-red-600 font-bold";
    if (minutes < 5) return "text-red-600";
    if (minutes < 30) return "text-orange-600";
    return "text-green-600";
  });

  constructor() {
    // Prevent accidental use in production
    if (environment.production) {
      throw new Error(
        "AuthDebugPanelComponent must not be used in production. " +
          "Remove <app-auth-debug-panel> from your template.",
      );
    }

    // Tick every 30s so countdown moves
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));

    // React to auth changes and sync state
    const { data } = this.supabase.client.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        this.lastAuthEvent.set(event);
        this.syncFromSession(session);
      },
    );

    // Initial load via effect (Angular style - avoids constructor side-effects)
    effect(() => {
      // This runs once on init
      this.syncFromSupabase();
    });

    // Cleanup subscription on destroy
    this.destroyRef.onDestroy(() => {
      data.subscription.unsubscribe();
    });
  }

  private syncFromSupabase() {
    const session = this.supabase.getSession();
    this.syncFromSession(session);
  }

  private syncFromSession(session: Session | null) {
    const user = session?.user ?? this.supabase.getCurrentUser();

    this.userId.set(user?.id ?? this.supabase.userId() ?? "N/A");
    this.userEmail.set(user?.email ?? "N/A");

    // Token presence
    this.hasAccessToken.set(!!session?.access_token);
    this.hasRefreshToken.set(!!session?.refresh_token);

    if (session?.expires_at) {
      this.expiresAt.set(new Date(session.expires_at * 1000));
    } else {
      this.expiresAt.set(null);
    }
  }

  async checkAuthStatus() {
    this.checking.set(true);
    this.lastCheckMessage.set(
      "Checking authentication... (see console for details)",
    );
    this.lastCheckSeverity.set("info");

    try {
      await this.authDebugService.checkAuthStatus();
      this.lastCheckMessage.set(
        "✅ Auth check complete! See console for details.",
      );
      this.lastCheckSeverity.set("success");
      this.syncFromSupabase();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.lastCheckMessage.set(`❌ Error: ${msg}`);
      this.lastCheckSeverity.set("error");
    } finally {
      this.checking.set(false);
    }
  }

  async refreshSession() {
    this.refreshing.set(true);
    this.lastCheckMessage.set("Refreshing session...");
    this.lastCheckSeverity.set("info");

    try {
      const { error } = await this.supabase.client.auth.refreshSession();
      if (error) {
        this.lastCheckMessage.set(`❌ Failed to refresh: ${error.message}`);
        this.lastCheckSeverity.set("error");
      } else {
        this.lastCheckMessage.set("✅ Session refreshed successfully!");
        this.lastCheckSeverity.set("success");
        this.syncFromSupabase();
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.lastCheckMessage.set(`❌ Error: ${msg}`);
      this.lastCheckSeverity.set("error");
    } finally {
      this.refreshing.set(false);
    }
  }

  async forceReauth() {
    this.reauthing.set(true);
    this.lastCheckMessage.set("Force re-authenticating...");
    this.lastCheckSeverity.set("info");

    try {
      await this.authDebugService.forceReauthenticate();
      this.lastCheckMessage.set("✅ Re-authentication complete!");
      this.lastCheckSeverity.set("success");
      this.syncFromSupabase();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.lastCheckMessage.set(`❌ Error: ${msg}`);
      this.lastCheckSeverity.set("error");
    } finally {
      this.reauthing.set(false);
    }
  }
}
