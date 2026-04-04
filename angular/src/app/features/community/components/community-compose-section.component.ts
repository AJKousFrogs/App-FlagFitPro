import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { AvatarComponent } from "../../../shared/components/avatar/avatar.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { Tooltip } from "primeng/tooltip";

import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";

@Component({
  selector: "app-community-compose-section",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AvatarComponent,
    TextareaComponent,
    Tooltip,
    AlertComponent,
    ButtonComponent,
  ],
  templateUrl: "./community-compose-section.component.html",
  styleUrl: "./community-compose-section.component.scss",
})
export class CommunityComposeSectionComponent {
  readonly currentUserInitials = input.required<string>();
  readonly newPostContent = input("");
  readonly selectedTopic = input<string | null>(null);

  readonly updateContent = output<string>();
  readonly attachPhoto = output<void>();
  readonly attachVideo = output<void>();
  readonly createPoll = output<void>();
  readonly addLocation = output<void>();
  readonly submitPost = output<void>();
  readonly clearTopicFilter = output<void>();

  onInput(value: string): void {
    this.updateContent.emit(value);
  }
}
