import { Injectable, signal, inject } from "@angular/core";
import { LoggerService } from "./logger.service";

export type FeedbackType = "success" | "error" | "warning" | "info";

export interface FeedbackMessage {
  id: string;
  message: string;
  type: FeedbackType;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

/**
 * Feedback Service
 * Manages user-facing notifications, network status, and error mapping.
 * Ported from legacy src/error-handler.js
 */
@Injectable({
  providedIn: "root",
})
export class FeedbackService {
  private logger = inject(LoggerService);

  // Reactive state for active messages
  public messages = signal<FeedbackMessage[]>([]);

  // Network status signal
  public isOnline = signal<boolean>(navigator.onLine);

  constructor() {
    this.initNetworkMonitoring();
  }

  /**
   * Initializes monitoring for online/offline status.
   */
  private initNetworkMonitoring(): void {
    window.addEventListener("online", () => {
      this.isOnline.set(true);
      this.showSuccess("Connection restored");
      this.logger.info("Network status: Online");
    });

    window.addEventListener("offline", () => {
      this.isOnline.set(false);
      this.showWarning("You are offline. Some features may not work properly.");
      this.logger.warn("Network status: Offline");
    });
  }

  /**
   * Shows a success notification.
   */
  showSuccess(message: string, duration: number = 5000): void {
    this.addMessage(message, "success", duration);
  }

  /**
   * Shows an error notification.
   */
  showError(message: string, duration: number = 8000): void {
    this.addMessage(message, "error", duration);
  }

  /**
   * Shows a warning notification.
   */
  showWarning(message: string, duration: number = 6000): void {
    this.addMessage(message, "warning", duration);
  }

  /**
   * Shows an info notification.
   */
  showInfo(message: string, duration: number = 5000): void {
    this.addMessage(message, "info", duration);
  }

  /**
   * Shows an error with a retry action.
   */
  showErrorWithRetry(
    message: string,
    retryCallback: () => void,
    duration: number = 10000,
  ): void {
    this.addMessage(message, "error", duration, {
      label: "Retry",
      callback: retryCallback,
    });
  }

  /**
   * Internal method to add a message to the signal.
   */
  private addMessage(
    message: string,
    type: FeedbackType,
    duration: number,
    action?: FeedbackMessage["action"],
  ): string {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: FeedbackMessage = { id, message, type, duration, action };

    this.messages.update((msgs) => [...msgs, newMessage]);

    if (duration > 0) {
      setTimeout(() => this.removeMessage(id), duration);
    }

    return id;
  }

  /**
   * Removes a specific message by ID.
   */
  public removeMessage(id: string): void {
    this.messages.update((msgs) => msgs.filter((m) => m.id !== id));
  }

  /**
   * Maps an API error to a user-friendly message and shows it.
   */
  handleApiError(
    error: any,
    context: string = "",
  ): { error: boolean; message: string } {
    this.logger.error(`API Error ${context}:`, error);

    let message = "Something went wrong. Please try again.";

    if (error.status === 401) {
      message = "Your session has expired. Please log in again.";
      // Logic for redirecting to login should ideally be in AuthService or a Guard
    } else if (error.status === 403) {
      message = "You do not have permission to perform this action.";
    } else if (error.status === 404) {
      message = "The requested resource was not found.";
    } else if (error.status >= 500) {
      message = "Server error. Please try again later.";
    } else if (!this.isOnline()) {
      message = "You are offline. Please check your internet connection.";
    } else if (error.message) {
      message = error.message;
    }

    this.showError(message);
    return { error: true, message };
  }
}
