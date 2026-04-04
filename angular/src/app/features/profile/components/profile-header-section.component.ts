import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ProgressBarComponent } from "../../../shared/components/progress-bar/progress-bar.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../shared/components/button/icon-button.component";
import { MobileOptimizedImageDirective } from "../../../shared/directives/mobile-optimized-image.directive";

@Component({
  selector: "app-profile-header-section",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ProgressBarComponent,
    ButtonComponent,
    IconButtonComponent,
    MobileOptimizedImageDirective,
  ],
  templateUrl: "./profile-header-section.component.html",
  styleUrl: "./profile-header-section.component.scss",
})
export class ProfileHeaderSectionComponent {
  readonly avatarUrl = input<string | null>(null);
  readonly userInitials = input.required<string>();
  readonly isUploadingAvatar = input(false);
  readonly jerseyNumber = input<string | null>(null);
  readonly userName = input.required<string>();
  readonly userPosition = input<string | null>(null);
  readonly teamName = input<string | null>(null);
  readonly userEmail = input.required<string>();
  readonly memberSince = input.required<string>();
  readonly profileCompletionPercentage = input.required<number>();
  readonly profileCompletionMissingFields = input<string[]>([]);
  readonly missingFieldsPreviewCount = input.required<number>();
  readonly deletionPending = input(false);

  readonly fileSelected = output<Event>();
  readonly shareProfile = output<void>();

  protected handleFileChange(event: Event): void {
    this.fileSelected.emit(event);
  }
}
