import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";

export const profileRoutes: Routes = [
  {
    path: "profile",
    loadComponent: () =>
      import("../../../features/profile/profile.component").then(
        (m) => m.ProfileComponent,
      ),
    canActivate: [authGuard],
    data: {
      preload: false,
      entry: "internal",
      headerPreset: "default",
    }, // User profile - on demand
  },
  {
    path: "settings",
    loadComponent: () =>
      import("../../../features/settings/settings.component").then(
        (m) => m.SettingsComponent,
      ),
    canActivate: [authGuard],
    data: {
      preload: false,
      entry: "internal",
      headerPreset: "default",
    }, // Settings - on demand
  },
  {
    path: "settings/profile",
    loadComponent: () =>
      import("../../../features/settings/settings.component").then(
        (m) => m.SettingsComponent,
      ),
    canActivate: [authGuard],
    data: {
      preload: false,
      entry: "internal",
      headerPreset: "default",
    }, // Settings - on demand
  },
  {
    path: "settings/privacy",
    loadComponent: () =>
      import("../../../features/settings/privacy-controls/privacy-controls.component").then(
        (m) => m.PrivacyControlsComponent,
      ),
    canActivate: [authGuard],
    title: "Privacy Controls - FlagFit Pro",
    data: {
      entry: "internal",
      headerPreset: "default",
    },
  },
];
