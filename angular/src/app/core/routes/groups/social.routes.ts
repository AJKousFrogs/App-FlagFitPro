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
    data: { preload: true, priority: "medium", entry: "internal" },
  },
  {
    path: "community",
    loadComponent: () =>
      import("../../../features/community/community.component").then(
        (m) => m.CommunityComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "low", entry: "internal" }, // Social feature
  },
  // Merlin AI - Main chat interface
  {
    path: "chat",
    loadComponent: () =>
      import("../../../features/ai-coach/ai-coach-chat.component").then(
        (m) => m.AiCoachChatComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high", entry: "internal" }, // Merlin AI is frequently used
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
    data: { preload: true, priority: "medium", entry: "internal" }, // Team communication
  },
];
