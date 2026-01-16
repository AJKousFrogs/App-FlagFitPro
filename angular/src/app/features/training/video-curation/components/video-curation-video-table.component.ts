/**
 * Video Curation Video Table Component
 *
 * Displays the main videos table with filtering and actions.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

// PrimeNG
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { InputTextModule } from "primeng/inputtext";
import { Select } from "primeng/select";
import { TooltipModule } from "primeng/tooltip";
import { AvatarModule } from "primeng/avatar";

import {
  InstagramVideo,
  FlagPosition,
  VideoStatus,
} from "../video-curation.models";
import {
  formatFocus,
  getStatusSeverity,
  POSITION_OPTIONS,
  STATUS_OPTIONS,
} from "../video-curation-utils";

@Component({
  selector: "app-video-curation-video-table",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    InputTextModule,
    Select,
    TooltipModule,
    AvatarModule,
  ],
  template: `
    <div class="tab-content">
      <!-- Filters -->
      <div class="table-filters">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input
            type="text"
            pInputText
            [ngModel]="searchValue()"
            (ngModelChange)="searchValue.set($event); onFilterChange()"
            placeholder="Search videos..."
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
        ></p-select>
        <p-select
          [ngModel]="statusValue()"
          (ngModelChange)="statusValue.set($event); onFilterChange()"
          [options]="statusOptions"
          placeholder="All Statuses"
          [showClear]="true"
          styleClass="filter-select"
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
            <th style="width: 50px"></th>
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
                  <i class="pi pi-verified verified-icon"></i>
                }
              </div>
            </td>
            <td>
              <div class="tags-cell">
                @for (pos of video.positions.slice(0, 2); track pos) {
                  <p-tag [value]="pos" severity="info"></p-tag>
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
                  <p-tag
                    [value]="getFormatFocus(focus)"
                    severity="success"
                    styleClass="status-tag status-tag--success"
                  ></p-tag>
                }
              </div>
            </td>
            <td>
              <div class="rating-cell">
                <i class="pi pi-star-fill"></i>
                {{ video.rating.toFixed(1) }}
              </div>
            </td>
            <td>
              <p-tag
                [value]="getVideoStatusValue(video.id)"
                [severity]="
                  getStatusSeverityValue(getVideoStatusValue(video.id))
                "
              ></p-tag>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  pButton
                  icon="pi pi-eye"
                  class="p-button-text"
                  pTooltip="Preview"
                  aria-label="Preview video"
                  (click)="preview.emit(video)"
                ></button>
                @if (getVideoStatusValue(video.id) !== "approved") {
                  <button
                    pButton
                    icon="pi pi-check"
                    class="p-button-text p-button-success"
                    pTooltip="Approve"
                    aria-label="Approve video"
                    (click)="approve.emit(video)"
                  ></button>
                }
                @if (getVideoStatusValue(video.id) !== "rejected") {
                  <button
                    pButton
                    icon="pi pi-times"
                    class="p-button-text p-button-danger"
                    pTooltip="Reject"
                    aria-label="Reject video"
                    (click)="reject.emit(video)"
                  ></button>
                }
                <button
                  pButton
                  icon="pi pi-plus"
                  class="p-button-text"
                  pTooltip="Add to Playlist"
                  aria-label="Add to playlist"
                  (click)="addToPlaylist.emit(video)"
                ></button>
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" class="empty-message">
              <i class="pi pi-inbox"></i>
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
  ): "warn" | "success" | "danger" | undefined {
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
