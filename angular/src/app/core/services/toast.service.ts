/**
 * Toast Notification Service
 * 
 * Centralized service for displaying toast notifications using PrimeNG MessageService.
 * Provides simple, type-safe methods for common notification types.
 * 
 * @example
 * ```typescript
 * constructor(private toastService = inject(ToastService)) {}
 * 
 * // Success notification
 * this.toastService.success('Data saved successfully!');
 * 
 * // Error notification
 * this.toastService.error('Failed to save data');
 * 
 * // Custom notification
 * this.toastService.show({
 *   severity: 'info',
 *   summary: 'Custom',
 *   detail: 'Custom message',
 *   life: 5000
 * });
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export interface ToastOptions {
  severity?: 'success' | 'info' | 'warn' | 'error';
  summary?: string;
  detail: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private messageService = inject(MessageService);

  /**
   * Show a success notification
   * @param detail - The message to display
   * @param summary - Optional summary (defaults to 'Success')
   * @param life - Optional lifetime in ms (defaults to 3000)
   */
  success(detail: string, summary = 'Success', life = 3000): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life,
    });
  }

  /**
   * Show an error notification
   * @param detail - The error message to display
   * @param summary - Optional summary (defaults to 'Error')
   * @param life - Optional lifetime in ms (defaults to 5000)
   */
  error(detail: string, summary = 'Error', life = 5000): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life,
    });
  }

  /**
   * Show a warning notification
   * @param detail - The warning message to display
   * @param summary - Optional summary (defaults to 'Warning')
   * @param life - Optional lifetime in ms (defaults to 4000)
   */
  warn(detail: string, summary = 'Warning', life = 4000): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life,
    });
  }

  /**
   * Show an info notification
   * @param detail - The info message to display
   * @param summary - Optional summary (defaults to 'Info')
   * @param life - Optional lifetime in ms (defaults to 3000)
   */
  info(detail: string, summary = 'Info', life = 3000): void {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life,
    });
  }

  /**
   * Show a custom notification with full options
   * @param options - Full toast options
   */
  show(options: ToastOptions): void {
    this.messageService.add({
      severity: options.severity || 'info',
      summary: options.summary || '',
      detail: options.detail,
      life: options.life || 3000,
      sticky: options.sticky,
      closable: options.closable,
    });
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.messageService.clear();
  }

  /**
   * Clear a specific notification by key
   * @param key - The key of the notification to clear
   */
  clearByKey(key: string): void {
    this.messageService.clear(key);
  }
}

