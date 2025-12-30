/**
 * Roster Player Card Component
 * Displays a single player card with actions
 */
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { Player } from '../roster.models';
import { getJerseyColor, getStatusSeverity, getPlayerStats } from '../roster-utils';

@Component({
  selector: 'app-roster-player-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardModule,
    TagModule,
    ButtonModule,
    CheckboxModule,
    TooltipModule,
    FormsModule,
    TitleCasePipe,
  ],
  template: `
    <p-card class="player-card" [class.selected]="isSelected()">
      <!-- Selection Checkbox (Coach+ only) -->
      @if (canManage()) {
        <div class="card-checkbox">
          <p-checkbox
            [binary]="true"
            [ngModel]="isSelected()"
            (ngModelChange)="selectionChange.emit(player().id)"
          ></p-checkbox>
        </div>
      }
      
      <!-- Status Badge -->
      <div class="status-badge" [class]="'status-' + player().status">
        {{ player().status | titlecase }}
      </div>
      
      <div class="player-header">
        <div
          class="player-jersey"
          [style.background]="getJerseyColor(player().position)"
        >
          {{ player().jersey }}
        </div>
        <div class="player-info">
          <h3 class="player-name">{{ player().name }}</h3>
          <div class="player-position">{{ player().position }}</div>
          <div class="player-meta">
            <span>{{ player().country }}</span>
            <span class="separator">•</span>
            <span>Age {{ player().age }}</span>
          </div>
        </div>
      </div>
      
      <div class="player-details">
        <div class="detail-item">
          <span class="detail-label">Height:</span>
          <span class="detail-value">{{ player().height }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Weight:</span>
          <span class="detail-value">{{ player().weight }}</span>
        </div>
      </div>
      
      @if (player().stats && playerStats.length > 0) {
        <div class="player-stats">
          @for (stat of playerStats; track stat.key) {
            <p-tag
              [value]="stat.label + ': ' + stat.value"
              severity="info"
              styleClass="mr-2 mb-2"
            ></p-tag>
          }
        </div>
      }
      
      <!-- Action Buttons -->
      <div class="card-actions">
        <p-button
          icon="pi pi-eye"
          [rounded]="true"
          [text]="true"
          severity="secondary"
          (onClick)="viewDetails.emit(player())"
          pTooltip="View Details"
        ></p-button>
        
        @if (canManage()) {
          <p-button
            icon="pi pi-pencil"
            [rounded]="true"
            [text]="true"
            (onClick)="edit.emit(player())"
            pTooltip="Edit Player"
          ></p-button>
          
          <p-button
            icon="pi pi-tag"
            [rounded]="true"
            [text]="true"
            severity="info"
            (onClick)="changeStatus.emit(player())"
            pTooltip="Change Status"
          ></p-button>
        }
        
        @if (canDelete()) {
          <p-button
            icon="pi pi-trash"
            [rounded]="true"
            [text]="true"
            severity="danger"
            (onClick)="remove.emit(player())"
            pTooltip="Remove Player"
          ></p-button>
        }
      </div>
    </p-card>
  `,
  styles: [`
    .player-card {
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .player-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .player-card.selected {
      outline: 2px solid var(--color-brand-primary);
      outline-offset: 2px;
    }

    .card-checkbox {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 1;
    }

    .status-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: var(--font-body-xs);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-active {
      background: var(--color-status-success-bg);
      color: var(--color-status-success);
    }

    .status-injured {
      background: var(--color-status-error-bg);
      color: var(--color-status-error);
    }

    .status-inactive {
      background: var(--p-surface-200);
      color: var(--text-secondary);
    }

    .player-header {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
      margin-top: var(--space-4);
    }

    .player-jersey {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-bold);
      font-size: var(--font-body-lg);
      color: var(--color-text-on-primary);
      box-shadow: var(--shadow-md);
      flex-shrink: 0;
    }

    .player-info {
      flex: 1;
      min-width: 0;
    }

    .player-name {
      font-size: var(--font-body-lg);
      font-weight: var(--font-weight-semibold);
      margin-bottom: var(--space-1);
      color: var(--text-primary);
    }

    .player-position {
      font-size: var(--font-body-sm);
      color: var(--text-secondary);
      font-weight: var(--font-weight-medium);
      margin-bottom: var(--space-1);
    }

    .player-meta {
      font-size: var(--font-body-sm);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .separator {
      opacity: 0.5;
    }

    .player-details {
      display: flex;
      gap: var(--space-4);
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--p-surface-200);
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .detail-label {
      font-size: var(--font-body-xs);
      color: var(--text-secondary);
    }

    .detail-value {
      font-size: var(--font-body-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
    }

    .player-stats {
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--p-surface-200);
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-1);
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--p-surface-200);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .player-header {
        flex-direction: column;
        text-align: center;
      }

      .player-jersey {
        width: 48px;
        height: 48px;
        font-size: var(--font-body-md);
      }

      .card-actions {
        justify-content: center;
        flex-wrap: wrap;
      }
    }

    @media (max-width: 480px) {
      .player-jersey {
        width: 40px;
        height: 40px;
        font-size: var(--font-body-sm);
      }

      .player-details {
        flex-direction: column;
        gap: var(--space-2);
      }
    }

    /* Touch devices */
    @media (hover: none) and (pointer: coarse) {
      .player-card:hover {
        transform: none;
        box-shadow: var(--shadow-md);
      }

      .card-actions button {
        min-height: 44px;
        min-width: 44px;
      }
    }
  `],
})
export class RosterPlayerCardComponent {
  // Inputs
  player = input.required<Player>();
  isSelected = input<boolean>(false);
  canManage = input<boolean>(false);
  canDelete = input<boolean>(false);

  // Outputs
  viewDetails = output<Player>();
  edit = output<Player>();
  changeStatus = output<Player>();
  remove = output<Player>();
  selectionChange = output<string>();

  // Expose utility functions
  getJerseyColor = getJerseyColor;

  get playerStats() {
    return getPlayerStats(this.player());
  }
}

