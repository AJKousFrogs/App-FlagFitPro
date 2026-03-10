import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { ReactiveFormsModule, FormControl } from "@angular/forms";
import { Tooltip } from "primeng/tooltip";

import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { SearchInputComponent } from "../../../../shared/components/search-input/search-input.component";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";
import { FilterChip } from "../video-feed.models";

@Component({
  selector: "app-video-feed-header-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Tooltip,
    ButtonComponent,
    SearchInputComponent,
    StatusTagComponent,
  ],
  templateUrl: "./video-feed-header-section.component.html",
  styleUrl: "./video-feed-header-section.component.scss",
})
export class VideoFeedHeaderSectionComponent {
  readonly searchControl = input.required<FormControl<string>>();
  readonly totalVideos = input.required<number>();
  readonly totalCreators = input.required<number>();
  readonly positionChips = input.required<FilterChip[]>();
  readonly focusChips = input.required<FilterChip[]>();
  readonly hasActiveFilters = input.required<boolean>();
  readonly activeFilterLabels = input.required<string[]>();

  readonly scrollToVideos = output<void>();
  readonly scrollToCreators = output<void>();
  readonly navigateToSuggest = output<void>();
  readonly togglePositionFilter = output<FilterChip>();
  readonly toggleFocusFilter = output<FilterChip>();
  readonly clearAllFilters = output<void>();
}
