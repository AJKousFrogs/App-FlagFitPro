import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

/**
 * Toast Component - Angular 21
 * 
 * A wrapper around PrimeNG Toast for consistent notifications
 * Place this component once in your app root
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast
      [position]="position()"
      [styleClass]="styleClass()"
      [baseZIndex]="baseZIndex()"
      [autoZIndex]="autoZIndex()"
      [key]="key()">
    </p-toast>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  private messageService = inject(MessageService);
  
  position = input<'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center'>('top-right');
  styleClass = input<string>();
  baseZIndex = input<number>(10000);
  autoZIndex = input<boolean>(true);
  key = input<string>('app-toast');
  
  ngOnInit(): void {
    // Component initialized
  }
  
  ngOnDestroy(): void {
    // Cleanup if needed
  }
  
  // Static methods for showing toasts (can be called from anywhere)
  static showSuccess(messageService: MessageService, summary: string, detail?: string, life?: number): void {
    messageService.add({
      severity: 'success',
      summary,
      detail,
      life: life || 3000
    });
  }
  
  static showError(messageService: MessageService, summary: string, detail?: string, life?: number): void {
    messageService.add({
      severity: 'error',
      summary,
      detail,
      life: life || 5000
    });
  }
  
  static showInfo(messageService: MessageService, summary: string, detail?: string, life?: number): void {
    messageService.add({
      severity: 'info',
      summary,
      detail,
      life: life || 3000
    });
  }
  
  static showWarning(messageService: MessageService, summary: string, detail?: string, life?: number): void {
    messageService.add({
      severity: 'warn',
      summary,
      detail,
      life: life || 4000
    });
  }
}

