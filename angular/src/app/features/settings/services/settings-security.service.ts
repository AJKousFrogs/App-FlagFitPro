import { Injectable, inject, signal } from "@angular/core";
import { TOAST } from "../../../core/constants";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { getErrorMessage } from "../../../shared/utils/error.utils";
import { SettingsDataService } from "./settings-data.service";

@Injectable({
  providedIn: "root",
})
export class SettingsSecurityService {
  private readonly settingsDataService = inject(SettingsDataService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);

  readonly isChangingPassword = signal(false);

  async changePassword(newPassword: string): Promise<boolean> {
    this.isChangingPassword.set(true);

    try {
      const { error } = await this.settingsDataService.updateAuthUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      this.toastService.success(TOAST.SUCCESS.PASSWORD_CHANGED);
      this.logger.info("[changePassword] Password changed successfully");
      return true;
    } catch (error) {
      this.logger.error("[changePassword] Failed to change password:", error);
      this.toastService.error(
        getErrorMessage(error, TOAST.ERROR.PASSWORD_CHANGE_FAILED),
      );
      return false;
    } finally {
      this.isChangingPassword.set(false);
    }
  }
}
