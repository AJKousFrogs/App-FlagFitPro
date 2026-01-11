import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthDebugService } from '../../core/services/auth-debug.service';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';

/**
 * Authentication Debug Component
 * Display current auth status and provide debugging tools
 * 
 * Usage: Add to any component temporarily to debug auth issues
 * <app-auth-debug-panel></app-auth-debug-panel>
 */
@Component({
  selector: 'app-auth-debug-panel',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    MessageModule,
  ],
  template: `
    <p-card header="🔍 Authentication Debug Panel" styleClass="mb-4">
      <div class="grid">
        <!-- Current Status -->
        <div class="col-12 md:col-6">
          <h4>Current Status</h4>
          <div class="flex flex-col gap-2">
            <div>
              <strong>Authenticated:</strong> 
              <span [class]="authService.isAuthenticated() ? 'text-green-600' : 'text-red-600'">
                {{ authService.isAuthenticated() ? '✅ Yes' : '❌ No' }}
              </span>
            </div>
            <div>
              <strong>User ID:</strong> {{ supabase.userId() || 'N/A' }}
            </div>
            <div>
              <strong>Email:</strong> {{ supabase.getCurrentUser()?.email || 'N/A' }}
            </div>
            <div>
              <strong>Session Expires:</strong> 
              @if (expiresAt()) {
                <span>{{ expiresAt() | date:'short' }}</span>
                <span class="ml-2" [class]="getExpiryClass()">
                  ({{ getTimeUntilExpiry() }})
                </span>
              } @else {
                <span class="text-red-600">No session</span>
              }
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="col-12 md:col-6">
          <h4>Debug Actions</h4>
          <div class="flex flex-col gap-2">
            <p-button 
              label="Check Auth Status" 
              icon="pi pi-check"
              severity="info"
              (onClick)="checkAuthStatus()"
              [loading]="checking()"
              styleClass="w-full"
            />
            <p-button 
              label="Refresh Session" 
              icon="pi pi-refresh"
              severity="success"
              (onClick)="refreshSession()"
              [loading]="refreshing()"
              styleClass="w-full"
            />
            <p-button 
              label="Force Re-authenticate" 
              icon="pi pi-sign-in"
              severity="warning"
              (onClick)="forceReauth()"
              [loading]="reauthing()"
              styleClass="w-full"
            />
          </div>
        </div>

        <!-- Last Check Result -->
        @if (lastCheckMessage()) {
          <div class="col-12">
            <p-message 
              [severity]="lastCheckSeverity()" 
              [text]="lastCheckMessage()!"
              styleClass="w-full"
            />
          </div>
        }

        <!-- Console Notice -->
        <div class="col-12">
          <p-message 
            severity="info" 
            text="Detailed logs are available in the browser console (press F12)"
            styleClass="w-full"
          />
        </div>
      </div>
    </p-card>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AuthDebugPanelComponent {
  authDebugService = inject(AuthDebugService);
  supabase = inject(SupabaseService);
  authService = inject(AuthService);

  checking = signal(false);
  refreshing = signal(false);
  reauthing = signal(false);
  
  lastCheckMessage = signal<string | null>(null);
  lastCheckSeverity = signal<'success' | 'info' | 'warn' | 'error'>('info');

  expiresAt = signal<Date | null>(null);

  constructor() {
    this.updateExpiryTime();
  }

  async checkAuthStatus() {
    this.checking.set(true);
    this.lastCheckMessage.set('Checking authentication... (see console for details)');
    this.lastCheckSeverity.set('info');

    try {
      await this.authDebugService.checkAuthStatus();
      this.lastCheckMessage.set('✅ Auth check complete! See console for details.');
      this.lastCheckSeverity.set('success');
      this.updateExpiryTime();
    } catch (error) {
      this.lastCheckMessage.set(`❌ Error: ${error}`);
      this.lastCheckSeverity.set('error');
    } finally {
      this.checking.set(false);
    }
  }

  async refreshSession() {
    this.refreshing.set(true);
    this.lastCheckMessage.set('Refreshing session...');
    this.lastCheckSeverity.set('info');

    try {
      const { data, error } = await this.supabase.client.auth.refreshSession();
      if (error) {
        this.lastCheckMessage.set(`❌ Failed to refresh: ${error.message}`);
        this.lastCheckSeverity.set('error');
      } else {
        this.lastCheckMessage.set('✅ Session refreshed successfully!');
        this.lastCheckSeverity.set('success');
        this.updateExpiryTime();
      }
    } catch (error) {
      this.lastCheckMessage.set(`❌ Error: ${error}`);
      this.lastCheckSeverity.set('error');
    } finally {
      this.refreshing.set(false);
    }
  }

  async forceReauth() {
    this.reauthing.set(true);
    this.lastCheckMessage.set('Force re-authenticating...');
    this.lastCheckSeverity.set('info');

    try {
      await this.authDebugService.forceReauthenticate();
      this.lastCheckMessage.set('✅ Re-authentication complete!');
      this.lastCheckSeverity.set('success');
      this.updateExpiryTime();
    } catch (error) {
      this.lastCheckMessage.set(`❌ Error: ${error}`);
      this.lastCheckSeverity.set('error');
    } finally {
      this.reauthing.set(false);
    }
  }

  private updateExpiryTime() {
    const session = this.supabase.getSession();
    if (session?.expires_at) {
      this.expiresAt.set(new Date(session.expires_at * 1000));
    } else {
      this.expiresAt.set(null);
    }
  }

  getTimeUntilExpiry(): string {
    const expires = this.expiresAt();
    if (!expires) return 'Unknown';

    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    
    if (diff < 0) return 'EXPIRED';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  getExpiryClass(): string {
    const expires = this.expiresAt();
    if (!expires) return 'text-red-600';

    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 0) return 'text-red-600 font-bold'; // Expired
    if (minutes < 5) return 'text-red-600'; // Less than 5 minutes
    if (minutes < 30) return 'text-orange-600'; // Less than 30 minutes
    return 'text-green-600'; // Good
  }
}
