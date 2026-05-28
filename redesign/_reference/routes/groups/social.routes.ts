import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";

export const socialRoutes: Routes = [
  {
    path: "notifications",
    loadComponent: () =>
      import("../../../features/notifications/notifications.component").then(
        (m) => m.NotificationsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "hub", headerPreset: "default" },
  },
  {
    path: "search",
    loadComponent: () =>
      import("../../../features/search/search.component").then(
        (m) => m.SearchComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal", headerPreset: "default" },
  },
  {
    path: "community",
    redirectTo: "team-chat",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  // Merlin AI - Main chat interface
  {
    path: "chat",
    loadComponent: () =>
      import("../../../features/ai-coach/ai-coach-chat.component").then(
        (m) => m.AiCoachChatComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal", headerPreset: "default" }, // Secondary workflow in 2.0
  },
  // Redirect old ai-coach path to new /chat
  {
    path: "ai-coach",
    redirectTo: "chat",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  // Team Channels - moved to /team-chat
  {
    path: "team-chat",
    loadComponent: () =>
      import("../../../features/chat/chat.component").then((m) => m.ChatComponent),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal", headerPreset: "default" }, // On-demand collaboration surface
  },
];
