import { Injectable, inject, signal } from "@angular/core";
import { TOAST } from "../../../core/constants";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { getErrorMessage } from "../../../shared/utils/error.utils";
import { SettingsDataService } from "./settings-data.service";

@Injectable({
  providedIn: "root",
})
export class SettingsAccountDeletionService {
  private readonly settingsDataService = inject(SettingsDataService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);

  readonly isDeletingAccount = signal(false);

  async requestDeletion(): Promise<boolean> {
    this.logger.debug("[deleteAccount] Attempting account deletion");
    this.isDeletingAccount.set(true);

    try {
      const user = this.settingsDataService.getCurrentUser();
      if (!user) {
        throw new Error("No user logged in");
      }

      const { error: deleteError } =
        await this.settingsDataService.insertDeletionRequest({
          user_id: user.id,
          reason: "User requested deletion",
          status: "pending",
          created_at: new Date().toISOString(),
        });

      if (deleteError) {
        this.logger.warn(
          "Could not submit deletion request:",
          deleteError.message,
        );
      }

      await this.settingsDataService.signOut();

      this.toastService.success(
        "Your account deletion request has been submitted. You will receive a confirmation email.",
      );
      this.logger.info("[deleteAccount] Deletion request submitted successfully");
      return true;
    } catch (error) {
      this.logger.error("[deleteAccount] Failed to delete account:", error);
      this.toastService.error(
        getErrorMessage(error, TOAST.ERROR.ACCOUNT_DELETE_FAILED),
      );
      return false;
    } finally {
      this.isDeletingAccount.set(false);
    }
  }
}
