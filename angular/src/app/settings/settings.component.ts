import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../core/services/api.service";
import { SupabaseService } from "../core/services/supabase.service";
import { LoggerService } from "../core/services/logger.service";

type Tab = "Notifications" | "Privacy" | "Prefs" | "Security";

/**
 * Settings — ported 1:1 from redesign/ground-zero/02-hifi/settings.html.
 * Notification toggles → PUT /api/notifications/preferences; privacy/consent
 * toggles → PUT /api/privacy-settings (both best-effort, optimistic UI). Identity
 * reads the signed-in user. Photo upload + account actions are flagged for their
 * own steps.
 */
@Component({
  selector: "app-settings",
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./settings.component.html",
  styles: [
    `
      .st-tabs { display: flex; gap: 16px; border-bottom: 1px solid var(--border-soft);
        padding-bottom: 8px; font-size: 14px; font-weight: 600; }
      .st-tab { background: none; border: 0; cursor: pointer; padding: 0 0 8px;
        color: var(--text-faint); font-weight: 600; font-family: var(--font-body); font-size: 14px; }
      .st-tab.on { color: var(--text-strong); border-bottom: 2px solid var(--accent); }
      .st-tab:focus-visible { outline: none; box-shadow: var(--focus); border-radius: 4px; }
    `,
  ],
})
export class SettingsComponent {
  private readonly api = inject(ApiService);
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  readonly tabs: Tab[] = ["Notifications", "Privacy", "Prefs", "Security"];
  readonly tab = signal<Tab>("Notifications");

  readonly name = computed(() => {
    const meta = (this.supabase.currentUser()?.user_metadata ?? {}) as Record<string, unknown>;
    return ((meta["full_name"] ?? meta["name"] ?? "Athlete") as string).trim() || "Athlete";
  });
  readonly subtitle = computed(() => {
    const meta = (this.supabase.currentUser()?.user_metadata ?? {}) as Record<string, unknown>;
    const j = meta["jersey_number"];
    const pos = (meta["position"] ?? "") as string;
    return [j != null ? `#${j}` : null, pos || null].filter(Boolean).join(" · ") || "Your profile";
  });

  // notification prefs
  readonly trainingReminders = signal(true);
  readonly gameDayAlerts = signal(true);
  readonly acwrAlerts = signal(true);
  readonly coachMessages = signal(true);

  saveNotifications(): void {
    this.api
      .put("/api/notifications/preferences", {
        trainingReminders: this.trainingReminders(),
        gameDayAlerts: this.gameDayAlerts(),
        acwrAlerts: this.acwrAlerts(),
        coachMessages: this.coachMessages(),
      })
      .subscribe({ error: (e) => this.logger.error("notif_prefs_save_failed", e) });
  }

  // privacy / consent
  readonly aiPersonalisation = signal(false);
  readonly sharePerformance = signal(true);
  readonly shareHealth = signal(false);

  savePrivacy(): void {
    this.api
      .put("/api/privacy-settings", {
        aiProcessingEnabled: this.aiPersonalisation(),
        performanceSharingDefault: this.sharePerformance(),
        healthSharingDefault: this.shareHealth(),
      })
      .subscribe({ error: (e) => this.logger.error("privacy_save_failed", e) });
  }
}
