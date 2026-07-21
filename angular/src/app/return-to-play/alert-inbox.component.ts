import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoadingComponent } from '../shared/loading.component';
import { ErrorComponent } from '../shared/error.component';

interface Alert {
  id: string;
  user_id: string;
  alert_type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  status: 'active' | 'resolved' | 'dismissed';
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_note?: string;
  trigger_data?: Record<string, unknown>;
  created_at: string;
  ruleName: string;
  deliveryChannels: { channel: string; status: string }[];
}

interface AlertResponse {
  success: boolean;
  data: Alert[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

@Component({
  selector: 'app-alert-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, ErrorComponent],
  template: `
    <div class="alert-inbox-container">
      <div class="inbox-header">
        <h2>Alert Inbox</h2>
        <div class="filters">
          <select [(ngModel)]="selectedStatus" (change)="refreshAlerts()">
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
          <input
            type="text"
            placeholder="Search alerts..."
            [(ngModel)]="searchText"
            (keyup)="onSearchChange()"
          />
        </div>
      </div>

      @if (isLoading()) {
        <app-loading></app-loading>
      }
      @if (error()) {
        <app-error [message]="error()"></app-error>
      }

      @if (!isLoading() && !error()) {
      <div class="alert-list">
        @if (displayedAlerts().length === 0) {
        <div class="empty-state">
          No alerts matching your filters.
        </div>
        }

        @for (alert of displayedAlerts(); track alert.id) {
        <div
          class="alert-item"
          [class.critical]="alert.alert_type === 'critical'"
          [class.high]="alert.alert_type === 'high'"
          [class.medium]="alert.alert_type === 'medium'"
          [class.acknowledged]="alert.acknowledged"
        >
          <div class="alert-content">
            <div class="alert-header">
              <span class="badge" [class]="alert.alert_type">
                {{ alert.alert_type.toUpperCase() }}
              </span>
              <h3>{{ alert.title }}</h3>
              <span class="rule-name">{{ alert.ruleName }}</span>
            </div>
            <p class="description">{{ alert.description }}</p>
            <div class="metadata">
              <small>{{ alert.created_at | date: 'short' }}</small>
              @if (alert.acknowledged) {
              <small>
                Acknowledged: {{ alert.acknowledged_at | date: 'short' }}
              </small>
              }
            </div>
          </div>

          <div class="alert-actions">
            @if (!alert.acknowledged && alert.status === 'active') {
            <button
              class="btn-acknowledge"
              (click)="acknowledgeAlert(alert)"
            >
              Acknowledge
            </button>
            }
            @if (alert.status === 'active') {
            <button
              class="btn-resolve"
              (click)="resolveAlert(alert)"
            >
              Resolve
            </button>
            }
            <button class="btn-details" (click)="viewDetails(alert)">
              Details
            </button>
          </div>
        </div>
        }
      </div>
      }

      <!-- Pagination -->
      @if (pagination()) {
      <div class="pagination">
        <button
          (click)="previousPage()"
          [disabled]="currentOffset() === 0 || isLoading()"
        >
          Previous
        </button>
        <span>
          Page {{ (currentOffset() / pageSize()) + 1 }} of
          {{ Math.ceil((pagination()?.total || 0) / pageSize()) }}
        </span>
        <button
          (click)="nextPage()"
          [disabled]="!pagination()?.hasMore || isLoading()"
        >
          Next
        </button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .alert-inbox-container {
        padding: 1rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .inbox-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .filters {
        display: flex;
        gap: 1rem;
      }

      .filters select,
      .filters input {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .alert-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .alert-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 1rem;
        border-left: 4px solid #999;
        background: #f9f9f9;
        border-radius: 4px;
        gap: 1rem;
      }

      .alert-item.critical {
        border-left-color: #d32f2f;
        background-color: #ffebee;
      }

      .alert-item.high {
        border-left-color: #f57c00;
        background-color: #fff3e0;
      }

      .alert-item.medium {
        border-left-color: #fbc02d;
        background-color: #fffde7;
      }

      .alert-item.acknowledged {
        opacity: 0.6;
      }

      .alert-content {
        flex: 1;
      }

      .alert-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .badge {
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        font-size: 0.75rem;
        font-weight: bold;
        color: white;
      }

      .badge.critical {
        background-color: #d32f2f;
      }

      .badge.high {
        background-color: #f57c00;
      }

      .badge.medium {
        background-color: #fbc02d;
        color: #333;
      }

      .badge.low {
        background-color: #1976d2;
      }

      .rule-name {
        font-size: 0.85rem;
        color: #666;
        font-style: italic;
      }

      .description {
        margin: 0.5rem 0;
        color: #333;
      }

      .metadata {
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;
        font-size: 0.85rem;
        color: #999;
      }

      .alert-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background-color 0.2s;
      }

      .btn-acknowledge {
        background-color: #4caf50;
        color: white;
      }

      .btn-acknowledge:hover {
        background-color: #45a049;
      }

      .btn-resolve {
        background-color: #2196f3;
        color: white;
      }

      .btn-resolve:hover {
        background-color: #0b7dda;
      }

      .btn-details {
        background-color: #757575;
        color: white;
      }

      .btn-details:hover {
        background-color: #616161;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #ddd;
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        color: #999;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertInboxComponent implements OnInit {
  isLoading = signal(false);
  error = signal<string | null>(null);
  alerts = signal<Alert[]>([]);
  pagination = signal<AlertResponse['pagination'] | null>(null);

  selectedStatus = 'active';
  searchText = '';
  currentOffset = signal(0);
  pageSize = signal(20);

  displayedAlerts = computed(() => {
    let filtered = this.alerts();
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          a.description.toLowerCase().includes(search) ||
          a.ruleName.toLowerCase().includes(search)
      );
    }
    return filtered;
  });

  private http = inject(HttpClient);

  Math = Math;
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      this.refreshAlerts();
    });
  }

  ngOnInit() {
    this.refreshAlerts();
  }

  refreshAlerts() {
    this.isLoading.set(true);
    this.error.set(null);

    const athleteId = this.getAthleteIdFromContext();
    const params = new HttpParams()
      .set('status', this.selectedStatus)
      .set('limit', this.pageSize().toString())
      .set('offset', this.currentOffset().toString());

    this.http
      .get<AlertResponse>(`/api/alerts/athlete/${athleteId}`, { params })
      .pipe(
        tap((response: AlertResponse) => {
          this.alerts.set(response.data);
          this.pagination.set(response.pagination);
        }),
        catchError((_err) => {
          this.error.set('Failed to load alerts');
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentOffset.set(0);
      this.refreshAlerts();
    }, 300);
  }

  acknowledgeAlert(alert: Alert) {
    this.http
      .patch(`/api/alerts/${alert.id}/acknowledge`, { note: null })
      .pipe(
        catchError(() => {
          this.error.set('Failed to acknowledge alert');
          return of(null);
        })
      )
      .subscribe(() => {
        this.refreshAlerts();
      });
  }

  resolveAlert(alert: Alert) {
    const notes = prompt('Enter resolution notes (optional):');
    if (notes === null) return;

    this.http
      .patch(`/api/alerts/${alert.id}/resolve`, {
        resolutionNotes: notes || null,
      })
      .pipe(
        catchError(() => {
          this.error.set('Failed to resolve alert');
          return of(null);
        })
      )
      .subscribe(() => {
        this.refreshAlerts();
      });
  }

  viewDetails(alert: Alert) {
    console.log('Alert details:', alert);
    // In production, open a modal or detail view
  }

  nextPage() {
    this.currentOffset.update((offset) => offset + this.pageSize());
  }

  previousPage() {
    this.currentOffset.update((offset) => Math.max(0, offset - this.pageSize()));
  }

  private getAthleteIdFromContext(): string {
    // TODO: Get from route params or user context
    return 'current-user-id';
  }
}
