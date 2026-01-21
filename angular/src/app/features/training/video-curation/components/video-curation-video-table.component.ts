/**
 * Video Curation Video Table Component
 *
 * Displays the main videos table with filtering and actions.
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal
} from "@angular/core";
import { FormsModule } from "@angular/forms";

// PrimeNG
import { Avatar } from "primeng/avatar";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";

import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";

import {
  formatFocus,
  getStatusSeverity,
  POSITION_OPTIONS,
  STATUS_OPTIONS
} from "../video-curation-utils";
import {
  FlagPosition,
  InstagramVideo,
  VideoStatus
} from "../video-curation.models";

@Component({
  selector: "app-video-curation-video-table",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TableModule,
    StatusTagComponent,
    InputText,
    Select,
    Avatar,
    IconButtonComponent
  ],
  template: `
    <div class="tab-content">
      <!-- Filters -->
      <div class="table-filters">
        <span class="p-input-icon-left">
          <i class="pi pi-search" aria-hidden="true"></i>
          <input
            type="text"
            pInputText
            [ngModel]="searchValue()"
            (ngModelChange)="searchValue.set($event); onFilterChange()"
            placeholder="Search videos..."
            aria-label="Search videos by title or description"
            class="filter-input"
          />
        </span>
        <p-select
          [ngModel]="positionValue()"
          (ngModelChange)="positionValue.set($event); onFilterChange()"
          [options]="positionOptions"
          placeholder="All Positions"
          [showClear]="true"
          styleClass="filter-select"
          ariaLabel="Filter by position"
        ></p-select>
        <p-select
          [ngModel]="statusValue()"
          (ngModelChange)="statusValue.set($event); onFilterChange()"
          [options]="statusOptions"
          placeholder="All Statuses"
          [showClear]="true"
          styleClass="filter-select"
          ariaLabel="Filter by status"
        ></p-select>
      </div>

      <!-- Videos Table -->
      <p-table
        [value]="videos()"
        [paginator]="true"
        [rows]="10"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} videos"
        [rowsPerPageOptions]="[10, 25, 50]"
        styleClass="p-datatable-sm"
      >
        <ng-template pTemplate="header">
          <tr>
            <th style="width: var(--space-12)"></th>
            <th pSortableColumn="title">
              Title <p-sortIcon field="title"></p-sortIcon>
            </th>
            <th>Creator</th>
            <th>Positions</th>
            <th>Focus</th>
            <th pSortableColumn="rating">
              Rating <p-sortIcon field="rating"></p-sortIcon>
            </th>
            <th>Status</th>
            <th style="width: 150px">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-video>
          <tr>
            <td>
              <p-avatar
                icon="pi pi-play"
                shape="circle"
                styleClass="video-avatar"
                ariaLabel="Video thumbnail"
              ></p-avatar>
            </td>
            <td>
              <div class="video-title-cell">
                <span class="title">{{ video.title }}</span>
                <span class="subtitle"
                  >{{ video.description | slice: 0 : 50 }}...</span
                >
              </div>
            </td>
            <td>
              <div class="creator-cell">
                <span class="creator-name">{{
                  video.creator.displayName
                }}</span>
                @if (video.creator.verified) {
                  <i class="pi pi-verified verified-icon" aria-label="Verified creator"></i>
                }
              </div>
            </td>
            <td>
              <div class="tags-cell">
                @for (pos of video.positions.slice(0, 2); track pos) {
                  <app-status-tag [value]="pos" severity="info" size="sm" />
                }
                @if (video.positions.length > 2) {
                  <span class="more-tag"
                    >+{{ video.positions.length - 2 }}</span
                  >
                }
              </div>
            </td>
            <td>
              <div class="tags-cell">
                @for (focus of video.trainingFocus.slice(0, 2); track focus) {
                  <app-status-tag
                    [value]="getFormatFocus(focus)"
                    severity="success"
                    size="sm"
                  />
                }
              </div>
            </td>
            <td>
              <div class="rating-cell">
                <i class="pi pi-star-fill" aria-hidden="true"></i>
                <span class="visually-hidden">Rating:</span>
                {{ video.rating.toFixed(1) }}
              </div>
            </td>
            <td>
              <app-status-tag
                [value]="getVideoStatusValue(video.id)"
                [severity]="
                  getStatusSeverityValue(getVideoStatusValue(video.id))
                "
                size="sm"
              />
            </td>
            <td>
              <div class="action-buttons">
                <app-icon-button
                  icon="pi-eye"
                  ariaLabel="Preview video"
                  tooltip="Preview"
                  (clicked)="preview.emit(video)"
                />
                @if (getVideoStatusValue(video.id) !== "approved") {
                  <app-icon-button
                    icon="pi-check"
                    variant="success"
                    ariaLabel="Approve video"
                    tooltip="Approve"
                    (clicked)="approve.emit(video)"
                  />
                }
                @if (getVideoStatusValue(video.id) !== "rejected") {
                  <app-icon-button
                    icon="pi-times"
                    variant="danger"
                    ariaLabel="Reject video"
                    tooltip="Reject"
                    (clicked)="reject.emit(video)"
                  />
                }
                <app-icon-button
                  icon="pi-plus"
                  ariaLabel="Add to playlist"
                  tooltip="Add to Playlist"
                  (clicked)="addToPlaylist.emit(video)"
                />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" class="empty-message" role="status">
              <i class="pi pi-inbox" aria-hidden="true"></i>
              <span>No videos found</span>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styleUrl: "./video-curation-video-table.component.scss",
})
export class VideoCurationVideoTableComponent {
  videos = input.required<InstagramVideo[]>();
  videoStatuses = input.required<Map<string, VideoStatus>>();

  preview = output<InstagramVideo>();
  approve = output<InstagramVideo>();
  reject = output<InstagramVideo>();
  addToPlaylist = output<InstagramVideo>();
  filterChange = output<{
    search: string;
    position: FlagPosition | null;
    status: string | null;
  }>();

  searchValue = signal("");
  positionValue = signal<FlagPosition | null>(null);
  statusValue = signal<string | null>(null);

  positionOptions = POSITION_OPTIONS;
  statusOptions = STATUS_OPTIONS;

  getFormatFocus(focus: string): string {
    return formatFocus(focus);
  }

  getVideoStatusValue(videoId: string): VideoStatus {
    return this.videoStatuses().get(videoId) || "pending";
  }

  getStatusSeverityValue(
    status: string,
  ): "warning" | "success" | "danger" | "secondary" {
    return getStatusSeverity(status);
  }

  onFilterChange(): void {
    this.filterChange.emit({
      search: this.searchValue(),
      position: this.positionValue(),
      status: this.statusValue(),
    });
  }
}
