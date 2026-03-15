import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";

export const socialRoutes: Routes = [
  {
    path: "search",
    loadComponent: () =>
      import("../../../features/search/search.component").then(
        (m) => m.SearchComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" },
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
    data: { preload: false, entry: "internal" }, // Secondary workflow in 2.0
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
    data: { preload: false, entry: "internal" }, // On-demand collaboration surface
  },
];
