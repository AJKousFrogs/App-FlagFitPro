import { Injectable, inject } from "@angular/core";
import { ConfirmDialogService } from "../services/confirm-dialog.service";

function formatMessage(message: string, title?: string): string {
  if (title) {
    return `${title}\n\n${message}`;
  }
  return message;
}

@Injectable({
  providedIn: "root",
})
export class DialogService {
  private readonly confirmDialog = inject(ConfirmDialogService);

  confirm(message: string, title?: string): Promise<boolean> {
    if (typeof window === "undefined") {
      return Promise.resolve(true);
    }
    return this.confirmDialog.confirm({
      title: title || "Confirm",
      message,
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Confirm",
      rejectLabel: "Cancel",
      acceptSeverity: "primary",
      rejectSeverity: "secondary",
      defaultFocus: "reject",
    });
  }

  prompt(
    message: string,
    defaultValue = "",
    title?: string,
  ): Promise<string | null> {
    if (typeof window === "undefined") {
      return Promise.resolve(defaultValue);
    }
    const response = window.prompt(
      formatMessage(message, title),
      defaultValue,
    );
    return Promise.resolve(response);
  }

  alert(message: string, title?: string): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.resolve();
    }
    window.alert(formatMessage(message, title));
    return Promise.resolve();
  }
}
