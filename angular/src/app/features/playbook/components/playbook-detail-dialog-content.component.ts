import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { MobileOptimizedImageDirective } from "../../../shared/directives/mobile-optimized-image.directive";
import { Play } from "../playbook.models";

@Component({
  selector: "app-playbook-detail-dialog-content",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonComponent, MobileOptimizedImageDirective],
  templateUrl: "./playbook-detail-dialog-content.component.html",
  styleUrl: "./playbook-detail-dialog-content.component.scss",
})
export class PlaybookDetailDialogContentComponent {
  readonly play = input.required<Play>();

  readonly toggleMemorized = input.required<(play: Play) => void>();
}
