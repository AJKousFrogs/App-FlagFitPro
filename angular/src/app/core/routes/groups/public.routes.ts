import { Routes } from "@angular/router";

export const publicRoutes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("../../../features/landing/landing.component").then(
        (m) => m.LandingComponent,
      ),
    data: { preload: true, priority: "high", entry: "internal" }, // Landing page loads immediately
  },
  {
    path: "login",
    loadComponent: () =>
      import("../../../features/auth/login/login.component").then(
        (m) => m.LoginComponent,
      ),
    data: { preload: true, priority: "medium", entry: "internal" }, // Auth pages preload after delay
  },
  {
    path: "register",
    loadComponent: () =>
      import("../../../features/auth/register/register.component").then(
        (m) => m.RegisterComponent,
      ),
    data: { preload: true, priority: "medium", entry: "internal" },
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("../../../features/auth/reset-password/reset-password.component").then(
        (m) => m.ResetPasswordComponent,
      ),
    data: { preload: false, entry: "deeplink" }, // On-demand - rarely accessed
  },
  {
    path: "update-password",
    loadComponent: () =>
      import("../../../features/auth/update-password/update-password.component").then(
        (m) => m.UpdatePasswordComponent,
      ),
    data: { preload: false, entry: "deeplink" }, // On-demand - rarely accessed
  },
  {
    path: "verify-email",
    loadComponent: () =>
      import("../../../features/auth/verify-email/verify-email.component").then(
        (m) => m.VerifyEmailComponent,
      ),
    data: { preload: false, entry: "deeplink" }, // On-demand - one-time use
  },
  {
    path: "auth/callback",
    loadComponent: () =>
      import("../../../features/auth/auth-callback/auth-callback.component").then(
        (m) => m.AuthCallbackComponent,
      ),
    data: { preload: false, entry: "deeplink" }, // On-demand - OAuth callback
  },
  {
    path: "onboarding",
    loadComponent: () =>
      import("../../../features/onboarding/onboarding.component").then(
        (m) => m.OnboardingComponent,
      ),
    data: { preload: false, entry: "internal" }, // On-demand - one-time use
  },
  {
    path: "accept-invitation",
    loadComponent: () =>
      import("../../../features/team/accept-invitation/accept-invitation.component").then(
        (m) => m.AcceptInvitationComponent,
      ),
    data: { preload: false, entry: "deeplink" }, // On-demand - rarely accessed
  },
  {
    path: "terms",
    loadComponent: () =>
      import("../../../features/legal/legal-doc.component").then(
        (m) => m.LegalDocComponent,
      ),
    data: { preload: false, legalDoc: "terms", entry: "internal" },
    title: "Terms of Use - FlagFit Pro",
  },
  {
    path: "privacy",
    loadComponent: () =>
      import("../../../features/legal/legal-doc.component").then(
        (m) => m.LegalDocComponent,
      ),
    data: { preload: false, legalDoc: "privacy", entry: "internal" },
    title: "Privacy Policy - FlagFit Pro",
  },
  {
    path: "privacy-policy",
    redirectTo: "privacy",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
];
