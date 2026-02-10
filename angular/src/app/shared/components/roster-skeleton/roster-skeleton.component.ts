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
        <app-skeleton
          variant="text"
          width="var(--size-150)"
          height="calc(var(--space-5) + var(--space-2))"
        ></app-skeleton>
        <div class="header-actions-skeleton">
          <app-skeleton
            variant="rectangle"
            width="var(--size-120)"
            height="var(--icon-container-md)"
            borderRadius="var(--radius-lg)"
          ></app-skeleton>
          <app-skeleton
            variant="rectangle"
            width="var(--size-100)"
            height="var(--icon-container-md)"
            borderRadius="var(--radius-lg)"
          ></app-skeleton>
        </div>
      </div>

      <!-- Search/Filter Bar Skeleton -->
      <div class="filter-bar-skeleton">
        <app-skeleton
          variant="rectangle"
          width="calc(var(--size-150) * 2)"
          height="var(--icon-container-md)"
          borderRadius="var(--radius-lg)"
        ></app-skeleton>
        <app-skeleton
          variant="rectangle"
          width="var(--size-150)"
          height="var(--icon-container-md)"
          borderRadius="var(--radius-lg)"
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
                height="var(--space-4)"
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
                    width="var(--icon-container-md)"
                    height="var(--icon-container-md)"
                  ></app-skeleton>
                } @else if (col.type === "badge") {
                  <app-skeleton
                    variant="rectangle"
                    width="var(--size-80)"
                    height="var(--space-6)"
                    borderRadius="var(--radius-xl)"
                  ></app-skeleton>
                } @else {
                  <app-skeleton
                    variant="text"
                    [width]="col.cellWidth || col.width"
                    height="var(--space-4)"
                  ></app-skeleton>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Pagination Skeleton -->
      <div class="pagination-skeleton">
        <app-skeleton
          variant="text"
          width="var(--size-120)"
          height="var(--space-4)"
        ></app-skeleton>
        <div class="pagination-buttons-skeleton">
          <app-skeleton
            variant="rectangle"
            width="var(--space-8)"
            height="var(--space-8)"
            borderRadius="var(--radius-sm)"
          ></app-skeleton>
          <app-skeleton
            variant="rectangle"
            width="var(--space-8)"
            height="var(--space-8)"
            borderRadius="var(--radius-sm)"
          ></app-skeleton>
          <app-skeleton
            variant="rectangle"
            width="var(--space-8)"
            height="var(--space-8)"
            borderRadius="var(--radius-sm)"
          ></app-skeleton>
          <app-skeleton
            variant="rectangle"
            width="var(--space-8)"
            height="var(--space-8)"
            borderRadius="var(--radius-sm)"
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
    { width: "calc(var(--size-120) * 0.5)", type: "avatar" },
    {
      width: "calc(var(--size-200) * 0.9)",
      cellWidth: "var(--size-150)",
      type: "text",
    },
    { width: "var(--size-120)", cellWidth: "var(--size-100)", type: "text" },
    { width: "var(--size-100)", cellWidth: "var(--size-80)", type: "badge" },
    { width: "var(--size-120)", cellWidth: "var(--size-100)", type: "text" },
    { width: "var(--size-100)", cellWidth: "var(--size-80)", type: "text" },
  ]);
}
