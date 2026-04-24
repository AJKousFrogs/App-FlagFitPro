import { Injectable, inject } from "@angular/core";
import type { Session } from "@supabase/supabase-js";
import { HomeRouteService } from "../../../core/services/home-route.service";
import { PlatformService } from "../../../core/services/platform.service";
import { SupabaseService } from "../../../core/services/supabase.service";

@Injectable({
  providedIn: "root",
})
export class AuthFlowDataService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly homeRouteService = inject(HomeRouteService);
  private readonly platform = inject(PlatformService);
  private usersTableUnavailable = false;
  private readonly postOnboardingRedirectKey = "postOnboardingRedirect";
  private readonly pendingVerificationEmailKey = "pendingVerificationEmail";
  private readonly passwordRecoveryIntentKey = "passwordRecoveryIntentAt";
  private readonly passwordRecoveryIntentMaxAgeMs = 10 * 60 * 1000;

  getCurrentUser() {
    return this.supabaseService.getCurrentUser();
  }

  getCurrentSession() {
    return this.supabaseService.getSession();
  }

  storePostOnboardingRedirect(route: string | null | undefined): boolean {
    const normalizedRoute = this.normalizeInternalRoute(route);
    if (!normalizedRoute) {
      return false;
    }

    return this.platform.setSessionStorage(
      this.postOnboardingRedirectKey,
      normalizedRoute,
    );
  }

  consumePostOnboardingRedirect(): string | null {
    const storedRoute = this.normalizeInternalRoute(
      this.platform.getSessionStorage(this.postOnboardingRedirectKey),
    );

    this.platform.removeSessionStorage(this.postOnboardingRedirectKey);
    return storedRoute;
  }

  storePendingVerificationEmail(email: string | null | undefined): boolean {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      return false;
    }

    return this.platform.setSessionStorage(
      this.pendingVerificationEmailKey,
      normalizedEmail,
    );
  }

  getPendingVerificationEmail(): string | null {
    return this.normalizeEmail(
      this.platform.getSessionStorage(this.pendingVerificationEmailKey),
    );
  }

  clearPendingVerificationEmail(): boolean {
    return this.platform.removeSessionStorage(this.pendingVerificationEmailKey);
  }

  markPasswordRecoveryIntent(): boolean {
    return this.platform.setSessionStorage(
      this.passwordRecoveryIntentKey,
      Date.now().toString(),
    );
  }

  hasActivePasswordRecoveryIntent(): boolean {
    const storedValue = this.platform.getSessionStorage(
      this.passwordRecoveryIntentKey,
    );
    const intentTimestamp = Number(storedValue);

    if (!Number.isFinite(intentTimestamp)) {
      if (storedValue) {
        this.clearPasswordRecoveryIntent();
      }
      return false;
    }

    const isFresh =
      Date.now() - intentTimestamp <= this.passwordRecoveryIntentMaxAgeMs;

    if (!isFresh) {
      this.clearPasswordRecoveryIntent();
    }

    return isFresh;
  }

  clearPasswordRecoveryIntent(): boolean {
    return this.platform.removeSessionStorage(this.passwordRecoveryIntentKey);
  }

  async resolvePostAuthRedirect(options?: {
    returnUrl?: string | null;
    allowReturnUrlBypassOnboarding?: boolean;
    fallbackRoute?: string;
  }): Promise<string> {
    const user = this.getCurrentUser();
    const fallbackRoute =
      this.normalizeInternalRoute(options?.fallbackRoute) ??
      (user ? this.homeRouteService.getHomeRouteForUser(user) : "/");
    const returnUrl = this.normalizeInternalRoute(options?.returnUrl);

    if (!user) {
      return returnUrl ?? this.consumePostOnboardingRedirect() ?? fallbackRoute;
    }

    const { data: userData } = await this.getUserOnboardingStatus(user.id);
    const onboardingIncomplete = !userData?.onboarding_completed;

    if (
      onboardingIncomplete &&
      !(options?.allowReturnUrlBypassOnboarding && returnUrl)
    ) {
      return "/onboarding";
    }

    return returnUrl ?? this.consumePostOnboardingRedirect() ?? fallbackRoute;
  }

  async updateAuthUser(payload: Record<string, unknown>) {
    return await this.supabaseService.updateUser(payload);
  }

  async signOut() {
    return await this.supabaseService.signOut();
  }

  async setSession(input: {
    accessToken: string;
    refreshToken: string;
  }): Promise<{
    data: { session: Session | null } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client.auth.setSession({
      access_token: input.accessToken,
      refresh_token: input.refreshToken,
    });

    return { data: data ?? null, error };
  }

  async exchangeCodeForSession(code: string): Promise<{
    data: { session: Session | null } | null;
    error: { message?: string } | null;
  }> {
    const { data, error } =
      await this.supabaseService.client.auth.exchangeCodeForSession(code);
    return { data: data ?? null, error };
  }

  async resendVerificationEmail(input: {
    email: string;
    redirectTo: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client.auth.resend({
      type: "signup",
      email: input.email,
      options: {
        emailRedirectTo: input.redirectTo,
      },
    });

    return { error };
  }

  async resetPasswordForEmail(input: {
    email: string;
    redirectTo: string;
  }): Promise<{ error: { message?: string } | null }> {
    const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(
      input.email,
      {
        redirectTo: input.redirectTo,
      },
    );

    return { error };
  }

  async getSession(): Promise<{
    data: { session: Session | null };
    error: { message?: string } | null;
  }> {
    const { data, error } = await this.supabaseService.client.auth.getSession();
    return { data: { session: data.session }, error };
  }

  async getUserOnboardingStatus(userId: string): Promise<{
    data: { onboarding_completed?: boolean } | null;
    error: { message?: string } | null;
  }> {
    if (this.usersTableUnavailable) {
      return { data: null, error: null };
    }

    const { data, error } = await this.supabaseService.client
      .from("users")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();

    if (error && this.isMissingUsersTableError(error)) {
      this.usersTableUnavailable = true;
      return { data: null, error: null };
    }

    return { data: data ?? null, error };
  }

  buildAppUrl(path: string): string {
    const normalizedPath = this.normalizePath(path);
    const browserWindow = this.platform.getWindow();
    if (!browserWindow) {
      return normalizedPath;
    }

    return `${browserWindow.location.origin}${normalizedPath}`;
  }

  getEmailVerificationRedirectUrl(): string {
    return this.buildAppUrl("/auth/callback");
  }

  private normalizeInternalRoute(
    route: string | null | undefined,
  ): string | null {
    if (typeof route !== "string") {
      return null;
    }

    const normalizedRoute = route.trim();
    if (
      !normalizedRoute ||
      !normalizedRoute.startsWith("/") ||
      normalizedRoute.startsWith("//")
    ) {
      return null;
    }

    return normalizedRoute;
  }

  private normalizePath(path: string): string {
    const trimmed = path.trim();
    if (!trimmed) {
      return "/";
    }

    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  private normalizeEmail(email: string | null | undefined): string | null {
    if (typeof email !== "string") {
      return null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    return normalizedEmail ? normalizedEmail : null;
  }

  private isMissingUsersTableError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }

    const e = error as { code?: string; message?: string; details?: string };

    // Match only the Postgres undefined_table error code
    if (e.code === "42P01") {
      return true;
    }

    // Match PostgREST table-not-found message patterns
    const message = typeof e.message === "string" ? e.message.toLowerCase() : "";
    const details = typeof e.details === "string" ? e.details.toLowerCase() : "";
    const tableNotFoundPatterns = ["schema cache", "could not find the table"];
    if (tableNotFoundPatterns.some((p) => message.includes(p) || details.includes(p))) {
      return true;
    }

    return false;
  }
}
