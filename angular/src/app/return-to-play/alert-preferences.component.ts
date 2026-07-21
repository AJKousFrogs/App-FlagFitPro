import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface AlertPreference {
  id: string;
  user_id: string;
  alert_type: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  channels: string[];
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
}

@Component({
  selector: 'app-alert-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="preferences-container">
      <h2>Alert Notification Preferences</h2>

      <div *ngIf="isLoading()" class="loading">Loading preferences...</div>
      <div *ngIf="error()" class="error">{{ error() }}</div>
      <div *ngIf="successMessage()" class="success">{{ successMessage() }}</div>

      <form *ngIf="!isLoading()" (ngSubmit)="savePreferences()">
        <!-- Alert Type Preferences -->
        <div class="preferences-section">
          <h3>Alert Severity Settings</h3>

          <div
            *ngFor="let pref of preferences()"
            class="preference-item"
          >
            <div class="pref-header">
              <label>
                <input
                  type="checkbox"
                  [(ngModel)]="pref.enabled"
                  [name]="'enabled-' + pref.alert_type"
                />
                {{ pref.alert_type | titlecase }} Alerts
              </label>
            </div>

            <div class="pref-details" *ngIf="pref.enabled">
              <div class="channels">
                <label>
                  <input
                    type="checkbox"
                    [(ngModel)]="pref.channels"
                    value="in_app"
                    [name]="'channel-in_app-' + pref.alert_type"
                  />
                  In-App Notifications
                </label>
                <label>
                  <input
                    type="checkbox"
                    [(ngModel)]="pref.channels"
                    value="push"
                    [name]="'channel-push-' + pref.alert_type"
                  />
                  Push Notifications
                </label>
                <label>
                  <input
                    type="checkbox"
                    [(ngModel)]="pref.channels"
                    value="email"
                    [name]="'channel-email-' + pref.alert_type"
                  />
                  Email Digests
                </label>
              </div>

              <div class="quiet-hours">
                <label>
                  Quiet Hours Start:
                  <input
                    type="time"
                    [(ngModel)]="pref.quiet_hours_start"
                    [name]="'quiet-start-' + pref.alert_type"
                  />
                </label>
                <label>
                  Quiet Hours End:
                  <input
                    type="time"
                    [(ngModel)]="pref.quiet_hours_end"
                    [name]="'quiet-end-' + pref.alert_type"
                  />
                </label>
              </div>

              <label>
                Timezone:
                <select
                  [(ngModel)]="pref.timezone"
                  [name]="'tz-' + pref.alert_type"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Chicago">America/Chicago</option>
                  <option value="America/Denver">America/Denver</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" [disabled]="isLoading()">
            {{ isLoading() ? 'Saving...' : 'Save Preferences' }}
          </button>
          <button type="button" (click)="resetToDefaults()">
            Reset to Defaults
          </button>
        </div>
      </form>

      <div class="preferences-info">
        <h4>About Your Alert Preferences</h4>
        <ul>
          <li>
            <strong>In-App:</strong> Notifications appear in your alert inbox
          </li>
          <li>
            <strong>Push:</strong> Browser/device notifications sent to your
            device
          </li>
          <li>
            <strong>Email:</strong> Nightly digest of alerts sent to your email
          </li>
          <li>
            <strong>Quiet Hours:</strong> No alerts sent during this time window
            (respects your timezone)
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [
    `
      .preferences-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
      }

      .loading,
      .error,
      .success {
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 4px;
        text-align: center;
      }

      .loading {
        background-color: #e3f2fd;
        color: #1976d2;
      }

      .error {
        background-color: #ffebee;
        color: #d32f2f;
      }

      .success {
        background-color: #e8f5e9;
        color: #388e3c;
      }

      .preferences-section {
        margin-bottom: 2rem;
      }

      .preference-item {
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 1rem;
        margin-bottom: 1rem;
      }

      .pref-header {
        font-weight: bold;
        margin-bottom: 0.5rem;
      }

      .pref-details {
        margin-top: 1rem;
        padding-left: 1.5rem;
        border-left: 2px solid #ddd;
      }

      .channels,
      .quiet-hours {
        margin-bottom: 1rem;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
      }

      input[type='checkbox'],
      input[type='time'],
      select {
        margin-right: 0.5rem;
        padding: 0.25rem;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.2s;
      }

      button[type='submit'] {
        background-color: #4caf50;
        color: white;
      }

      button[type='submit']:hover:not(:disabled) {
        background-color: #45a049;
      }

      button[type='button'] {
        background-color: #757575;
        color: white;
      }

      button[type='button']:hover {
        background-color: #616161;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .preferences-info {
        background-color: #f5f5f5;
        padding: 1rem;
        border-radius: 4px;
        margin-top: 2rem;
      }

      .preferences-info ul {
        margin: 1rem 0;
        padding-left: 1.5rem;
      }

      .preferences-info li {
        margin-bottom: 0.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertPreferencesComponent implements OnInit {
  isLoading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  preferences = signal<AlertPreference[]>([]);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadPreferences();
  }

  loadPreferences() {
    this.isLoading.set(true);
    this.error.set(null);

    this.http
      .get<{ data: AlertPreference[] }>('/api/alert-preferences')
      .pipe(
        tap((response) => {
          this.preferences.set(response.data);
        }),
        catchError((err) => {
          this.error.set('Failed to load preferences. Using defaults.');
          this.initializeDefaults();
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  savePreferences() {
    this.isLoading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.http
      .patch('/api/alert-preferences', {
        preferences: this.preferences(),
      })
      .pipe(
        tap(() => {
          this.successMessage.set('Preferences saved successfully!');
          setTimeout(() => this.successMessage.set(null), 3000);
        }),
        catchError((err) => {
          this.error.set('Failed to save preferences');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  resetToDefaults() {
    this.initializeDefaults();
  }

  private initializeDefaults() {
    this.preferences.set([
      {
        id: '1',
        user_id: 'current',
        alert_type: 'critical',
        enabled: true,
        channels: ['in_app', 'push'],
        quiet_hours_start: '22:00',
        quiet_hours_end: '06:00',
        timezone: 'UTC',
      },
      {
        id: '2',
        user_id: 'current',
        alert_type: 'high',
        enabled: true,
        channels: ['in_app'],
        quiet_hours_start: '22:00',
        quiet_hours_end: '06:00',
        timezone: 'UTC',
      },
      {
        id: '3',
        user_id: 'current',
        alert_type: 'medium',
        enabled: true,
        channels: ['in_app'],
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: 'UTC',
      },
      {
        id: '4',
        user_id: 'current',
        alert_type: 'low',
        enabled: false,
        channels: [],
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: 'UTC',
      },
    ]);
  }
}
