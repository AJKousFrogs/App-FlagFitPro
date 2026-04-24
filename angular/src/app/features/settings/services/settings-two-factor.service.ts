import { Injectable, inject, signal } from "@angular/core";
import { TOAST } from "../../../core/constants";
import { LoggerService, toLogContext } from "../../../core/services/logger.service";
import { PlatformService } from "../../../core/services/platform.service";
import { ToastService } from "../../../core/services/toast.service";
import { getErrorMessage } from "../../../shared/utils/error.utils";
import { SettingsDataService } from "./settings-data.service";

@Injectable({
  providedIn: "root",
})
export class SettingsTwoFactorService {
  private readonly settingsDataService = inject(SettingsDataService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly platform = inject(PlatformService);

  readonly twoFAStep = signal(1);
  readonly twoFASecret = signal("");
  readonly qrCodeUrl = signal("");
  readonly twoFAError = signal("");
  readonly backupCodes = signal<string[]>([]);
  readonly is2FAEnabled = signal(false);
  readonly isEnabling2FA = signal(false);
  readonly isDisabling2FA = signal(false);

  async startSetup(): Promise<void> {
    this.twoFAStep.set(1);
    this.twoFAError.set("");
    await this.generate2FASecret();
  }

  resetSetup(): void {
    this.twoFAStep.set(1);
    this.twoFASecret.set("");
    this.qrCodeUrl.set("");
    this.twoFAError.set("");
  }

  async verify(code: string): Promise<boolean> {
    this.logger.debug("[verify2FA] Attempting verification");

    if (code.length !== 6) {
      this.logger.warn("[verify2FA] Invalid code length, aborting");
      return false;
    }

    this.isEnabling2FA.set(true);
    this.twoFAError.set("");

    try {
      const user = this.settingsDataService.getCurrentUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await this.settingsDataService.upsertUserSecurity({
        user_id: user.id,
        two_factor_enabled: true,
        two_factor_secret: this.twoFASecret(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        this.logger.warn(
          "Could not save 2FA settings:",
          toLogContext(error.message),
        );
      }

      this.backupCodes.set(this.generateBackupCodes());
      this.twoFAStep.set(4);
      this.is2FAEnabled.set(true);
      this.toastService.success(TOAST.SUCCESS.UPDATED);
      this.logger.info("[verify2FA] 2FA enabled successfully");
      return true;
    } catch (error) {
      this.logger.error("[verify2FA] Verification failed:", error);
      this.twoFAError.set(
        getErrorMessage(error, TOAST.ERROR.TWO_FA_VERIFICATION_FAILED),
      );
      return false;
    } finally {
      this.isEnabling2FA.set(false);
    }
  }

  async disable(code: string): Promise<boolean> {
    this.logger.debug("[disable2FA] Attempting to disable 2FA");

    if (code.length !== 6) {
      this.logger.warn("[disable2FA] Invalid code length, aborting");
      return false;
    }

    this.isDisabling2FA.set(true);

    try {
      const user = this.settingsDataService.getCurrentUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await this.settingsDataService.updateUserSecurity(
        user.id,
        {
          two_factor_enabled: false,
          two_factor_secret: null,
          updated_at: new Date().toISOString(),
        },
      );

      if (error) {
        this.logger.warn("Could not disable 2FA:", toLogContext(error.message));
      }

      this.is2FAEnabled.set(false);
      this.toastService.success(TOAST.SUCCESS.UPDATED);
      this.logger.info("[disable2FA] 2FA disabled successfully");
      return true;
    } catch (error) {
      this.logger.error("[disable2FA] Failed to disable 2FA:", error);
      this.toastService.error(
        getErrorMessage(error, TOAST.ERROR.TWO_FA_DISABLE_FAILED),
      );
      return false;
    } finally {
      this.isDisabling2FA.set(false);
    }
  }

  copySecret(): void {
    if (!this.platform.isBrowser) {
      return;
    }

    void navigator.clipboard.writeText(this.twoFASecret());
    this.toastService.success(TOAST.SUCCESS.COPIED);
  }

  downloadBackupCodes(): void {
    if (!this.platform.isBrowser) {
      return;
    }

    const windowRef = this.platform.getWindow();
    const documentRef = this.platform.getDocument();
    if (!windowRef || !documentRef) {
      return;
    }

    const codes = this.backupCodes().join("\n");
    const content = `FlagFit Pro Backup Codes\n========================\n\nStore these codes in a safe place. Each code can only be used once.\n\n${codes}\n\nGenerated: ${new Date().toISOString()}`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = documentRef.createElement("a");
    a.href = url;
    a.download = "flagfit-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);

    this.toastService.success(TOAST.SUCCESS.COPIED);
  }

  private async generate2FASecret(): Promise<void> {
    try {
      const user = this.settingsDataService.getCurrentUser();
      if (!user) return;

      const secret = this.generateRandomSecret();
      this.twoFASecret.set(secret);

      const issuer = encodeURIComponent("FlagFit Pro");
      const accountName = encodeURIComponent(user.email || "user");
      const otpAuthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

      this.qrCodeUrl.set(
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`,
      );
    } catch (error) {
      this.logger.error("Error generating 2FA secret:", error);
      this.twoFAError.set("Failed to generate 2FA secret");
    }
  }

  private generateRandomSecret(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes, (b) => chars[b % chars.length]).join("");
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const bytes = crypto.getRandomValues(new Uint8Array(8));
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      codes.push(`${hex.slice(0, 4).toUpperCase()}-${hex.slice(4, 8).toUpperCase()}`);
    }
    return codes;
  }
}
