import { CommonModule, DatePipe, TitleCasePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

interface ProfileInvitation {
  id: string;
  teamId: string;
  teamName: string;
  role: string;
  message?: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
}

@Component({
  selector: "app-profile-invitations-section",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    TitleCasePipe,
    AppLoadingComponent,
    EmptyStateComponent,
    CardShellComponent,
    StatusTagComponent,
    ButtonComponent,
  ],
  templateUrl: "./profile-invitations-section.component.html",
  styleUrl: "./profile-invitations-section.component.scss",
})
export class ProfileInvitationsSectionComponent {
  readonly loading = input(false);
  readonly invitations = input<ProfileInvitation[]>([]);
  readonly processingInvitationId = input<string | null>(null);

  readonly acceptInvitation = output<ProfileInvitation>();
  readonly declineInvitation = output<ProfileInvitation>();
  readonly requestNewInvitation = output<ProfileInvitation>();
}
