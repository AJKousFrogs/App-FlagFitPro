/**
 * Roster Skeleton Component
 *
 * Loading placeholder for roster/table views
 * Matches table structure with rows and columns
 *
 * Used in: Roster page, Player lists, Team management
 */

import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SkeletonComponent } from "../skeleton/skeleton.component";

@Component({
  selector: "app-roster-skeleton",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="roster-skeleton" aria-label="Loading roster...">
      <!-- Header Skeleton -->
      <div class="roster-header-skeleton">
        <app-skeleton variant="text" width="150px" height="28px"></app-skeleton>
        <div class="header-actions-skeleton">
          <app-skeleton
            variant="rectangle"
            width="120px"
            height="40px"
            borderRadius="8px"
          ></app-skeleton>
          <app-skeleton
            variant="rectangle"
            width="100px"
            height="40px"
            borderRadius="8px"
          ></app-skeleton>
        </div>
      </div>

      <!-- Search/Filter Bar Skeleton -->
      <div class="filter-bar-skeleton">
        <app-skeleton
          variant="rectangle"
          width="300px"
          height="40px"
          borderRadius="8px"
        ></app-skeleton>
        <app-skeleton
          variant="rectangle"
          width="150px"
          height="40px"
          borderRadius="8px"
        ></app-skeleton>
      </div>

      <!-- Table Skeleton -->
      <div class="table-skeleton">
        <!-- Table Header -->
        <div class="table-header-skeleton">
          @for (col of columns(); track col) {
            <div class="table-header-cell-skeleton">
              <app-skeleton
                variant="text"
                [width]="col.width"
                height="16px"
              ></app-skeleton>
            </div>
          }
        </div>

        <!-- Table Rows -->
        @for (row of rows(); track row) {
          <div class="table-row-skeleton">
            @for (col of columns(); track col) {
              <div class="table-cell-skeleton">
                @if (col.type === "avatar") {
                  <app-skeleton
                    variant="circle"
                    width="40px"
                    height="40px"
                  ></app-skeleton>
                } @else if (col.type === "badge") {
                  <app-skeleton
                    variant="rectangle"
                    width="80px"
                    height="24px"
                    borderRadius="12px"
                  ></app-skeleton>
                } @else {
                  <app-skeleton
                    variant="text"
                    [width]="col.cellWidth || col.width"
                    height="16px"
                  ></app-skeleton>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Pagination Skeleton -->
      <div class="pagination-skeleton">
        <app-skeleton variant="text" width="120px" height="16px"></app-skeleton>
        <div class="pagination-buttons-skeleton">
          <app-skeleton
            variant="rectangle"
            width="32px"
            height="32px"
            borderRadius="4px"
          ></app-skeleton>
          <app-skeleton
            variant="rectangle"
            width="32px"
            height="32px"
            borderRadius="4px"
          ></app-skeleton>
          <app-skeleton
            variant="rectangle"
            width="32px"
            height="32px"
            borderRadius="4px"
          ></app-skeleton>
          <app-skeleton
            variant="rectangle"
            width="32px"
            height="32px"
            borderRadius="4px"
          ></app-skeleton>
        </div>
      </div>
    </div>
  `,
  styleUrl: "./roster-skeleton.component.scss",
})
export class RosterSkeletonComponent {
  /** Number of rows to display */
  rows = input<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  /** Column definitions for table structure */
  columns = input<
    Array<{
      width: string;
      cellWidth?: string;
      type?: "text" | "avatar" | "badge";
    }>
  >([
    { width: "60px", type: "avatar" },
    { width: "180px", cellWidth: "150px", type: "text" },
    { width: "120px", cellWidth: "100px", type: "text" },
    { width: "100px", cellWidth: "80px", type: "badge" },
    { width: "120px", cellWidth: "100px", type: "text" },
    { width: "100px", cellWidth: "80px", type: "text" },
  ]);
}
