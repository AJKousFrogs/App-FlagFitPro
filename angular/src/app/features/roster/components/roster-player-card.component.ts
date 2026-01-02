/**
 * Roster Player Card Component
 * Displays a single player card with actions
 */
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from "@angular/core";
import { TitleCasePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { TooltipModule } from "primeng/tooltip";
import { Player } from "../roster.models";
import {
  getJerseyColor,
  getStatusSeverity,
  getPlayerStats,
} from "../roster-utils";

@Component({
  selector: "app-roster-player-card",
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
  styleUrl: './roster-player-card.component.scss',
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
