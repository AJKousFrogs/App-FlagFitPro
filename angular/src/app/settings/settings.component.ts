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
import { PeriodizationService } from "../core/services/periodization.service";
import { RecoveryService } from "../core/services/recovery.service";
import { RECOVERY_EQUIPMENT } from "../core/models/recovery-modalities";
import {
  POSITION_VOLUME,
  type PositionKey,
} from "../core/config/position-volume.config";
import { extractApiPayload } from "../core/utils/api-response-mapper";
import { readFileAsDataUrl } from "../shared/utils/file.utils";

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
      .lbl { font-size: var(--fs-sm); color: var(--text-muted); font-weight: var(--fw-semi); }
      .chiprow { display: flex; flex-wrap: wrap; gap: 6px; }
    `,
  ],
})
export class SettingsComponent {
  private readonly api = inject(ApiService);
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly privacy = inject(PrivacySettingsService);
  private readonly periodization = inject(PeriodizationService);
  private readonly recovery = inject(RecoveryService);

  // Recovery equipment (Prefs tab) — reuses athlete_training_config.available_equipment.
  readonly recoveryEquipment = RECOVERY_EQUIPMENT;
  readonly ownedEquipment = signal<string[]>([]);
  readonly savingEquip = signal(false);
  readonly equipMsg = signal<string | null>(null);

  toggleEquipment(id: string): void {
    const cur = this.ownedEquipment();
    this.ownedEquipment.set(
      cur.includes(id) ? cur.filter((e) => e !== id) : [...cur, id],
    );
  }

  async saveEquipment(): Promise<void> {
    if (this.savingEquip()) return;
    this.savingEquip.set(true);
    this.equipMsg.set(null);
    try {
      const res = await firstValueFrom(
        this.api.post("/api/player-settings", {
          availableEquipment: this.ownedEquipment(),
        }),
      );
      if (res.success) {
        this.equipMsg.set("Saved — recovery suggestions now match your gear.");
        void this.recovery.loadEquipment();
      } else {
        this.equipMsg.set(res.error ?? "Couldn't save — try again.");
      }
    } catch (e) {
      this.logger.error("settings_equipment_save_failed", e);
      this.equipMsg.set("Couldn't save — try again.");
    } finally {
      this.savingEquip.set(false);
    }
  }

  // Primary position (Prefs tab) — drives position-specific prehab emphasis and
  // worst-case volume targets in the prescription engine. Saved to
  // player_settings.primary_position (and users.position) via /api/player-settings;
  // labels are single-sourced from the canonical POSITION_VOLUME model.
  readonly positions: { key: PositionKey; label: string }[] = (
    Object.keys(POSITION_VOLUME) as PositionKey[]
  ).map((key) => ({ key, label: POSITION_VOLUME[key].label }));
  readonly position = signal<PositionKey | null>(null);
  readonly savingPosition = signal(false);
  readonly positionMsg = signal<string | null>(null);

  selectPosition(key: PositionKey): void {
    this.position.set(this.position() === key ? null : key);
  }

  async savePosition(): Promise<void> {
    const pos = this.position();
    if (!pos || this.savingPosition()) return;
    this.savingPosition.set(true);
    this.positionMsg.set(null);
    try {
      const res = await firstValueFrom(
        this.api.post("/api/player-settings", { primaryPosition: pos }),
      );
      if (res.success) {
        this.positionMsg.set("Saved — your plan now emphasises this position's prehab.");
        this.periodization.refreshSettings();
      } else {
        this.positionMsg.set(res.error ?? "Couldn't save — try again.");
      }
    } catch (e) {
      this.logger.error("settings_position_save_failed", e);
      this.positionMsg.set("Couldn't save — try again.");
    } finally {
      this.savingPosition.set(false);
    }
  }

  readonly tabs: Tab[] = ["Notifications", "Privacy", "Prefs", "Security"];
  readonly tab = signal<Tab>("Notifications");

  // Flag football team-practice days (Prefs tab). dow: 0=Sun…6=Sat.
  readonly weekdays = [
    { dow: 1, label: "Mon" },
    { dow: 2, label: "Tue" },
    { dow: 3, label: "Wed" },
    { dow: 4, label: "Thu" },
    { dow: 5, label: "Fri" },
    { dow: 6, label: "Sat" },
    { dow: 0, label: "Sun" },
  ];
  readonly trainingDays = signal<number[]>([]);
  readonly trainingTime = signal("18:00");
  readonly savingTraining = signal(false);
  readonly trainingMsg = signal<string | null>(null);

  timeVal(e: Event): string {
    return (e.target as HTMLInputElement).value || "18:00";
  }

  toggleTrainingDay(dow: number): void {
    const cur = this.trainingDays();
    this.trainingDays.set(
      cur.includes(dow) ? cur.filter((d) => d !== dow) : [...cur, dow].sort((a, b) => a - b),
    );
  }

  async saveTraining(): Promise<void> {
    if (this.savingTraining()) return;
    this.savingTraining.set(true);
    this.trainingMsg.set(null);
    try {
      const res = await firstValueFrom(
        this.api.post("/api/player-settings", {
          teamTrainingDays: { days: this.trainingDays(), time: this.trainingTime() },
        }),
      );
      if (res.success) {
        this.trainingMsg.set("Saved — your plan now builds around these days.");
        this.periodization.refreshSettings();
      } else {
        this.trainingMsg.set(res.error ?? "Couldn't save — try again.");
      }
    } catch (e) {
      this.logger.error("settings_training_days_save_failed", e);
      this.trainingMsg.set("Couldn't save — try again.");
    } finally {
      this.savingTraining.set(false);
    }
  }

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
    // Flag football team-practice days + owned recovery equipment.
    try {
      const res = await firstValueFrom(
        this.api.get<{
          teamTrainingDays?: { days?: number[]; time?: string };
          availableEquipment?: string[];
          primaryPosition?: string;
          primary_position?: string;
        }>("/api/player-settings"),
      );
      const data =
        extractApiPayload<{
          teamTrainingDays?: { days?: number[]; time?: string };
          availableEquipment?: string[];
          primaryPosition?: string;
          primary_position?: string;
        }>(res) ?? {};
      const ttd = data.teamTrainingDays;
      if (ttd) {
        if (Array.isArray(ttd.days)) this.trainingDays.set(ttd.days);
        if (ttd.time) this.trainingTime.set(ttd.time);
      }
      if (Array.isArray(data.availableEquipment)) {
        this.ownedEquipment.set(data.availableEquipment.map(String));
      }
      const savedPos = (data.primaryPosition ?? data.primary_position ?? "")
        .toString()
        .toLowerCase();
      if (this.positions.some((p) => p.key === savedPos)) {
        this.position.set(savedPos as PositionKey);
      }
    } catch (e) {
      this.logger.error("settings_prefs_load_failed", e);
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
      const dataUrl = await readFileAsDataUrl(file);
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
