import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { firstValueFrom } from "rxjs";
import { AvatarComponent } from "../shared/avatar.component";

import { ApiService } from "../core/services/api.service";
import { SupabaseService } from "../core/services/supabase.service";
import { LoggerService } from "../core/services/logger.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";

type Tab = "Notifications" | "Privacy" | "Prefs" | "Security";

/**
 * Settings — ported 1:1 from redesign/ground-zero/02-hifi/settings.html.
 * Notification toggles → PUT /api/notifications/preferences; privacy/consent
 * toggles → PUT /api/privacy-settings (both best-effort, optimistic UI). Identity
 * reads the signed-in user. "Change photo" uploads to storage (POST /api/upload)
 * and writes avatar_url to the auth user metadata — which the avatar reads
 * reactively everywhere. Account actions are flagged for their own steps.
 */
@Component({
  selector: "app-settings",
  standalone: true,
  imports: [AvatarComponent, RouterLink, LucideAngularModule],
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

  // profile photo upload
  readonly photoBusy = signal(false);
  readonly photoMsg = signal<string | null>(null);
  private static readonly MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
  private static readonly PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ""; // allow re-selecting the same file later
    if (!file || this.photoBusy()) return;

    if (!SettingsComponent.PHOTO_TYPES.includes(file.type)) {
      this.flashPhoto("Use a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > SettingsComponent.MAX_PHOTO_BYTES) {
      this.flashPhoto("Image too large — keep it under 5MB.");
      return;
    }

    this.photoBusy.set(true);
    this.photoMsg.set(null);
    try {
      const dataUrl = await this.readAsDataUrl(file);
      const res = await firstValueFrom(
        this.api.post<{ url?: string }>("/api/upload", {
          file: dataUrl,
          fileType: file.type,
          fileName: file.name,
        }),
      );
      const url = extractApiPayload<{ url?: string }>(res)?.url;
      if (!url) throw new Error("Upload returned no URL");

      const { error } = await this.supabase.client.auth.updateUser({
        data: { avatar_url: url },
      });
      if (error) throw error;
      this.flashPhoto("Photo updated");
    } catch (err) {
      this.logger.error("avatar_upload_failed", err);
      this.flashPhoto("Couldn't update photo — try again.");
    } finally {
      this.photoBusy.set(false);
    }
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("read failed"));
      reader.readAsDataURL(file);
    });
  }
  private flashPhoto(msg: string): void {
    this.photoMsg.set(msg);
  }

  // notification prefs
  readonly trainingReminders = signal(true);
  readonly gameDayAlerts = signal(true);
  readonly acwrAlerts = signal(true);
  readonly coachMessages = signal(true);

  saveNotifications(): void {
    // Endpoint expects { preferences: { <type>: { muted, pushEnabled, inAppEnabled } } }
    // with backend notification types. A toggle ON = delivered, OFF = muted.
    const cfg = (on: boolean) => ({ muted: !on, pushEnabled: on, inAppEnabled: on });
    this.api
      .put("/api/notifications/preferences", {
        preferences: {
          training: cfg(this.trainingReminders()),
          game: cfg(this.gameDayAlerts()),
          injury_risk: cfg(this.acwrAlerts()),
          team: cfg(this.coachMessages()),
        },
      })
      .subscribe({ error: (e) => this.logger.error("notif_prefs_save_failed", e) });
  }

  // privacy / consent
  readonly aiPersonalisation = signal(false);
  readonly sharePerformance = signal(true);
  readonly shareHealth = signal(false);

  savePrivacy(): void {
    // Endpoint expects the settings wrapped under a `settings` key.
    this.api
      .put("/api/privacy-settings", {
        settings: {
          aiProcessingEnabled: this.aiPersonalisation(),
          performanceSharingDefault: this.sharePerformance(),
          healthSharingDefault: this.shareHealth(),
        },
      })
      .subscribe({ error: (e) => this.logger.error("privacy_save_failed", e) });
  }
}
