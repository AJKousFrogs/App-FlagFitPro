import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { TitleCasePipe } from "@angular/common";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { getErrorMessage } from "../../../shared/utils/error.utils";
import { ToastService } from "../../../core/services/toast.service";
import { PlatformService } from "../../../core/services/platform.service";
import { formatDate } from "../../../shared/utils/date.utils";
import { TeamInvitationDataService } from "../services/team-invitation-data.service";

interface InvitationData {
  id: string;
  teamId: string;
  teamName: string;
  inviterName: string;
  invitedEmail: string;
  role: string;
  position: string | null;
  jerseyNumber: number | null;
  expiresAt: string;
  status: string;
}

/**
 * Accept Invitation Component
 *
 * Handles team invitation acceptance flow.
 * Users receive an email with a link containing a token.
 * This component validates the token and allows users to accept/decline.
 *
 * Database tables involved:
 * - team_invitations: Stores invitation records with tokens
 * - team_members: Where accepted invitations create new records via RPC
 * - teams: For team information display
 */
@Component({
  selector: "app-accept-invitation",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    AlertComponent,
    TitleCasePipe,
    ButtonComponent,
    AppLoadingComponent,
    CardShellComponent,
    PageErrorStateComponent,
  ],
  templateUrl: "./accept-invitation.component.html",
  styleUrl: "./accept-invitation.component.scss",
})
export class AcceptInvitationComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private teamInvitationDataService = inject(TeamInvitationDataService);
  private platform = inject(PlatformService);

  isLoading = signal(true);
  isProcessing = signal(false);
  isAccepted = signal(false);
  isDeclined = signal(false);
  needsLogin = signal(false);
  invitationError = signal<string | undefined>(undefined);
  invitationData = signal<InvitationData | null>(null);
  teamName = signal("");
  currentUrl = signal("");
  invitationToken = signal<string | null>(null);
  authRedirectQueryParams = computed<Record<string, string> | null>(() => {
    const returnUrl = this.currentUrl();
    return returnUrl ? { returnUrl } : null;
  });

  ngOnInit(): void {
    // Store current URL for return after login
    this.currentUrl.set(this.getCurrentRelativeUrl());

    // Get invitation token from query params
    const token = this.route.snapshot.queryParams["token"];

    if (token) {
      this.invitationToken.set(token);
      this.loadInvitation(token);
    } else {
      this.invitationError.set(
        "Invalid invitation link. Please check your email for the correct link.",
      );
      this.isLoading.set(false);
    }
  }

  hasRetryableError(): boolean {
    const token = this.invitationToken();
    const message = this.invitationError()?.toLowerCase() || "";

    if (!token) {
      return false;
    }

    if (
      message.includes("not found") ||
      message.includes("expired") ||
      message.includes("already been")
    ) {
      return false;
    }

    return true;
  }

  retryLoadInvitation(): void {
    const token = this.invitationToken();
    if (!token) {
      return;
    }

    this.isLoading.set(true);
    this.invitationError.set(undefined);
    this.loadInvitation(token);
  }

  /**
   * Load invitation details from Supabase
   */
  async loadInvitation(token: string): Promise<void> {
    try {
      // Query the team_invitations table with the token
      const { invitation, error } =
        await this.teamInvitationDataService.getInvitationByToken(token);

      if (error) {
        if (error.code === "PGRST116") {
          this.invitationError.set(
            "Invitation not found. It may have been used or expired.",
          );
        } else {
          throw error;
        }
        this.isLoading.set(false);
        return;
      }

      if (!invitation) {
        this.invitationError.set("Invitation not found.");
        this.isLoading.set(false);
        return;
      }

      // Check if invitation is still pending
      if (invitation.status !== "pending") {
        this.invitationError.set(
          `This invitation has already been ${invitation.status}.`,
        );
        this.isLoading.set(false);
        return;
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        this.invitationError.set(
          "This invitation has expired. Please request a new one from the team.",
        );
        this.isLoading.set(false);
        return;
      }

      // Get inviter information
      let inviterName = "a team member";
      if (invitation.invited_by) {
        const { inviter } = await this.teamInvitationDataService.getInviter(
          invitation.invited_by,
        );

        if (inviter) {
          inviterName =
            inviter.first_name && inviter.last_name
              ? `${inviter.first_name} ${inviter.last_name}`
              : inviter.email ?? "a team member";
        }
      }

      // Extract team data safely - Supabase returns joined data as an array or object
      const teamsJoined = invitation.teams;
      const teamData = Array.isArray(teamsJoined)
        ? teamsJoined[0]
        : teamsJoined;
      const teamNameValue = teamData?.name || "Unknown Team";

      // Set invitation data
      this.invitationData.set({
        id: invitation.id,
        teamId: invitation.team_id,
        teamName: teamNameValue,
        inviterName: inviterName,
        invitedEmail: invitation.email,
        role: invitation.role || "player",
        position: invitation.position,
        jerseyNumber: invitation.jersey_number,
        expiresAt: invitation.expires_at,
        status: invitation.status,
      });
      this.teamName.set(teamNameValue);

      // Check if user is logged in
      const currentUser = this.teamInvitationDataService.getCurrentUser();
      if (!currentUser) {
        this.needsLogin.set(true);
      }

      this.isLoading.set(false);
    } catch (error) {
      this.isLoading.set(false);
      this.invitationError.set(
        error instanceof Error
          ? error.message
          : "Failed to load invitation. Please try again.",
      );
    }
  }

  /**
   * Accept the team invitation
   */
  async acceptInvitation(): Promise<void> {
    const invitation = this.invitationData();
    if (!invitation) return;

    const currentUser = this.teamInvitationDataService.getCurrentUser();
    if (!currentUser) {
      this.needsLogin.set(true);
      return;
    }

    if (this.hasInvitationEmailMismatch(currentUser.email, invitation.invitedEmail)) {
      this.toastService.warn(
        `This invitation was sent to ${invitation.invitedEmail}. Sign out and sign in with that email to accept it.`,
        "Wrong Account",
      );
      return;
    }

    this.isProcessing.set(true);

    try {
      const { error: updateError } =
        await this.teamInvitationDataService.acceptInvitation(invitation.id);

      if (updateError) {
        throw updateError;
      }

      this.isAccepted.set(true);
      this.toastService.success(
        `You've joined ${this.teamName()}!`,
        "Invitation Accepted",
      );

      // Redirect to roster after 2 seconds
      setTimeout(() => {
        this.router.navigate(["/roster"]);
      }, 2000);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to accept invitation. Please try again.",
      );
      this.toastService.error(message);
    } finally {
      this.isProcessing.set(false);
    }
  }

  /**
   * Decline the team invitation
   */
  async declineInvitation(): Promise<void> {
    const invitation = this.invitationData();
    if (!invitation) return;

    this.isProcessing.set(true);

    try {
      // Update invitation status to 'declined'
      const { error } =
        await this.teamInvitationDataService.declineInvitation(invitation.id);

      if (error) {
        throw error;
      }

      this.isDeclined.set(true);
      this.toastService.info(
        "You have declined the team invitation.",
        "Invitation Declined",
      );

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        this.router.navigate(["/dashboard"]);
      }, 2000);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to decline invitation. Please try again.",
      );
      this.toastService.error(message);
    } finally {
      this.isProcessing.set(false);
    }
  }

  /**
   * Format expiry date for display
   */
  formatExpiry(expiresAt: string | undefined): string {
    if (!expiresAt) return "Unknown";

    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return "Expired";
    } else if (diffDays === 1) {
      return "Tomorrow";
    } else if (diffDays <= 7) {
      return `In ${diffDays} days`;
    } else {
      return formatDate(expiry, "P");
    }
  }

  private getCurrentRelativeUrl(): string {
    const browserLocation = this.platform.getWindow()?.location;
    if (browserLocation) {
      return `${browserLocation.pathname}${browserLocation.search}`;
    }

    const token = this.route.snapshot.queryParams["token"];
    return token
      ? `/accept-invitation?token=${encodeURIComponent(token)}`
      : "/accept-invitation";
  }

  private hasInvitationEmailMismatch(
    currentUserEmail: string | undefined,
    invitedEmail: string,
  ): boolean {
    const normalizedCurrentUserEmail = this.normalizeEmail(currentUserEmail);
    const normalizedInvitedEmail = this.normalizeEmail(invitedEmail);

    if (!normalizedCurrentUserEmail || !normalizedInvitedEmail) {
      return false;
    }

    return normalizedCurrentUserEmail !== normalizedInvitedEmail;
  }

  private normalizeEmail(email: string | undefined | null): string {
    return email?.trim().toLowerCase() || "";
  }
}
