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
import { PrivacySettingsService } from "../core/services/privacy-settings.service";
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
      .st-tabs { display: flex; gap: var(--s-4); border-bottom: 1px solid var(--border-soft);
        padding-bottom: var(--s-2); font-size: var(--fs-sm); font-weight: var(--fw-semi); }
      .st-tab { background: none; border: 0; cursor: pointer; padding: 0 0 var(--s-2);
        color: var(--text-faint); font-weight: var(--fw-semi); font-family: var(--font-body); font-size: var(--fs-sm); }
      .st-tab.on { color: var(--text-strong); border-bottom: 2px solid var(--accent); }
      .st-tab:focus-visible { outline: none; box-shadow: var(--focus); border-radius: 4px; }
    `,
  ],
})
export class SettingsComponent {
  private readonly api = inject(ApiService);
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly privacy = inject(PrivacySettingsService);

  readonly tabs: Tab[] = ["Notifications", "Privacy", "Prefs", "Security"];
  readonly tab = signal<Tab>("Notifications");

  // Real server state must load before any toggle write fires — otherwise the
  // hardcoded defaults below would be persisted over the athlete's actual consent.
  readonly prefsLoaded = signal(false);

  constructor() {
    void this.loadPrefs();
  }

  private async loadPrefs(): Promise<void> {
    // Privacy / consent — seed from the canonical privacy settings.
    try {
      await this.privacy.loadSettings();
      const s = this.privacy.settings();
      this.aiPersonalisation.set(this.privacy.aiProcessingEnabled());
      this.sharePerformance.set(s?.performanceSharingDefault ?? true);
      this.shareHealth.set(s?.healthSharingDefault ?? false);
    } catch (e) {
      this.logger.error("settings_privacy_load_failed", e);
    }
    // Notification preferences — ON = not muted.
    try {
      const res = await firstValueFrom(
        this.api.get<Record<string, unknown>>("/api/notifications/preferences"),
      );
      const payload = (extractApiPayload<Record<string, unknown>>(res) ?? {}) as Record<string, unknown>;
      const prefs = ((payload["preferences"] ?? payload) ?? {}) as Record<string, { muted?: boolean }>;
      const on = (type: string) => prefs[type]?.muted !== true;
      this.trainingReminders.set(on("training"));
      this.gameDayAlerts.set(on("game"));
      this.acwrAlerts.set(on("injury_risk"));
      this.coachMessages.set(on("team"));
    } catch (e) {
      this.logger.error("settings_notif_load_failed", e);
    }
    this.prefsLoaded.set(true);
  }

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

      const { error } = await this.supabase.updateUser({ data: { avatar_url: url } });
      if (error) throw error;
      // updateUser doesn't always push a fresh currentUser() into the signal, so
      // pull it explicitly — that's what makes every <app-avatar> re-render.
      await this.supabase.refreshCurrentUser();
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

  // account actions
  readonly accountBusy = signal(false);
  readonly accountMsg = signal<string | null>(null);
  readonly confirmingDelete = signal(false);

  async changePassword(): Promise<void> {
    if (this.accountBusy()) return;
    const email = this.supabase.currentUser()?.email;
    if (!email) {
      this.accountMsg.set("Sign in again to change your password.");
      return;
    }
    this.accountBusy.set(true);
    this.accountMsg.set(null);
    try {
      const { error } = await this.supabase.resetPassword(email);
      if (error) throw error;
      this.accountMsg.set(`Password reset link sent to ${email}.`);
    } catch (err) {
      this.logger.error("password_reset_failed", err);
      this.accountMsg.set("Couldn't send the reset link — try again.");
    } finally {
      this.accountBusy.set(false);
    }
  }

  async confirmDeletion(): Promise<void> {
    if (this.accountBusy()) return;
    this.accountBusy.set(true);
    this.accountMsg.set(null);
    try {
      await firstValueFrom(
        this.api.post("/api/account/deletion", { confirmDelete: true }),
      );
      this.confirmingDelete.set(false);
      this.accountMsg.set(
        "Deletion scheduled. Your data is removed after a 30-day grace period — sign back in any time before then to cancel.",
      );
    } catch (err) {
      this.logger.error("account_deletion_failed", err);
      this.accountMsg.set("Couldn't schedule deletion — try again.");
    } finally {
      this.accountBusy.set(false);
    }
  }

  // notification prefs
  readonly trainingReminders = signal(true);
  readonly gameDayAlerts = signal(true);
  readonly acwrAlerts = signal(true);
  readonly coachMessages = signal(true);

  // Toggle-save failures must not leave the UI showing a consent/notification state
  // the server never accepted — reconcile from the server + tell the user.
  readonly prefsMsg = signal<string | null>(null);
  private reconcilePrefs(): void {
    this.prefsMsg.set("Couldn't save — reverted to your saved setting.");
    void this.loadPrefs(); // re-pull server truth so the toggle snaps back
  }

  saveNotifications(): void {
    if (!this.prefsLoaded()) return; // never write before real state has loaded
    this.prefsMsg.set(null);
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
      .subscribe({
        error: (e) => {
          this.logger.error("notif_prefs_save_failed", e);
          this.reconcilePrefs();
        },
      });
  }

  // privacy / consent
  readonly aiPersonalisation = signal(false);
  readonly sharePerformance = signal(true);
  readonly shareHealth = signal(false);

  savePrivacy(): void {
    if (!this.prefsLoaded()) return; // never write fabricated consent before load
    this.prefsMsg.set(null);
    // Endpoint expects the settings wrapped under a `settings` key.
    this.api
      .put("/api/privacy-settings", {
        settings: {
          aiProcessingEnabled: this.aiPersonalisation(),
          performanceSharingDefault: this.sharePerformance(),
          healthSharingDefault: this.shareHealth(),
        },
      })
      .subscribe({
        error: (e) => {
          this.logger.error("privacy_save_failed", e);
          this.reconcilePrefs();
        },
      });
  }
}
