import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { TitleCasePipe } from "@angular/common";
import { Card } from "primeng/card";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { Message } from "primeng/message";
import { ToastService } from "../../../core/services/toast.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { formatDate } from "../../../shared/utils/date.utils";

interface InvitationData {
  id: string;
  teamId: string;
  teamName: string;
  inviterName: string;
  inviterEmail: string;
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
 * - team_members: Where accepted invitations create new records
 * - teams: For team information display
 */
@Component({
  selector: "app-accept-invitation",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, Card, Message, TitleCasePipe, ButtonComponent],
  template: `
<div class="accept-invitation-page">
      <p-card class="accept-invitation-card">
        <ng-template pTemplate="header">
          <div class="accept-invitation-logo">
            <i class="pi pi-users"></i>
          </div>
          <h1 class="accept-invitation-title">Team Invitation</h1>
        </ng-template>

        @if (isLoading()) {
          <div class="loading-state">
            <p-message severity="info" styleClass="status-message">
              Loading invitation...
            </p-message>
          </div>
        } @else if (needsLogin()) {
          <div class="login-required-state">
            <p-message severity="warn" styleClass="status-message">
              Please sign in to accept this invitation
            </p-message>
            <p class="login-message">
              You need to be signed in to accept team invitations.
              @if (invitationData()) {
                You've been invited to join
                <strong>{{ invitationData()?.teamName }}</strong
                >.
              }
            </p>
            <app-button iconLeft="pi-sign-in" routerLink="/login"
              >Sign In</app-button
            >
            <app-button
              variant="outlined"
              iconLeft="pi-user-plus"
              routerLink="/register"
              >Create Account</app-button
            >
          </div>
        } @else if (invitationError()) {
          <div class="error-state">
            <p-message severity="error" styleClass="status-message">
              {{ invitationError() }}
            </p-message>
            <a [routerLink]="['/dashboard']" class="back-link mt-4"
              >Go to Dashboard</a
            >
          </div>
        } @else if (isAccepted()) {
          <div class="accepted-state">
            <p-message
              severity="success"
              styleClass="status-message status-message--success"
              >Invitation accepted!</p-message
            >
            <p class="accepted-message">
              You've successfully joined {{ teamName() }}. Welcome to the team!
            </p>
            <app-button iconLeft="pi-users" routerLink="/roster"
              >Go to Team Page</app-button
            >
          </div>
        } @else if (isDeclined()) {
          <div class="declined-state">
            <p-message severity="info" styleClass="status-message">
              Invitation declined
            </p-message>
            <p class="declined-message">
              You have declined the invitation to join {{ teamName() }}.
            </p>
            <app-button iconLeft="pi-home" routerLink="/dashboard"
              >Go to Dashboard</app-button
            >
          </div>
        } @else if (invitationData()) {
          <div class="invitation-state">
            <div class="team-info">
              <h3>{{ invitationData()?.teamName }}</h3>
              <p class="team-description">
                You've been invited to join this team by
                {{ invitationData()?.inviterName }}.
              </p>
              @if (invitationData()?.role) {
                <p class="role-info">
                  <i class="pi pi-tag"></i>
                  Role:
                  <strong>{{ invitationData()?.role | titlecase }}</strong>
                </p>
              }
              @if (invitationData()?.position) {
                <p class="position-info">
                  <i class="pi pi-map-marker"></i>
                  Position: <strong>{{ invitationData()?.position }}</strong>
                </p>
              }
              @if (invitationData()?.jerseyNumber) {
                <p class="jersey-info">
                  <i class="pi pi-hashtag"></i>
                  Jersey: <strong>#{{ invitationData()?.jerseyNumber }}</strong>
                </p>
              }
              <p class="expires-info">
                <i class="pi pi-clock"></i>
                Expires: {{ formatExpiry(invitationData()?.expiresAt) }}
              </p>
            </div>

            <div class="invitation-actions">
              <app-button
                iconLeft="pi-check"
                [loading]="isProcessing()"
                (clicked)="acceptInvitation()"
                >Accept Invitation</app-button
              >
              <app-button
                variant="outlined"
                [loading]="isProcessing()"
                (clicked)="declineInvitation()"
                >Decline</app-button
              >
            </div>
          </div>
        }
      </p-card>
    </div>
  `,
  styleUrl: "./accept-invitation.component.scss",
})
export class AcceptInvitationComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private supabaseService = inject(SupabaseService);

  isLoading = signal(true);
  isProcessing = signal(false);
  isAccepted = signal(false);
  isDeclined = signal(false);
  needsLogin = signal(false);
  invitationError = signal<string | undefined>(undefined);
  invitationData = signal<InvitationData | null>(null);
  teamName = signal("");
  currentUrl = signal("");

  ngOnInit(): void {
    // Store current URL for return after login
    this.currentUrl.set(window.location.pathname + window.location.search);

    // Get invitation token from query params
    const token = this.route.snapshot.queryParams["token"];

    if (token) {
      this.loadInvitation(token);
    } else {
      this.invitationError.set(
        "Invalid invitation link. Please check your email for the correct link.",
      );
      this.isLoading.set(false);
    }
  }

  /**
   * Load invitation details from Supabase
   */
  async loadInvitation(token: string): Promise<void> {
    try {
      // Query the team_invitations table with the token
      const { data: invitation, error } = await this.supabaseService.client
        .from("team_invitations")
        .select(
          `
          id,
          team_id,
          email,
          role,
          position,
          jersey_number,
          status,
          expires_at,
          invited_by,
          teams!team_invitations_team_id_fkey (
            id,
            name
          )
        `,
        )
        .eq("token", token)
        .single();

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
        const { data: inviter } = await this.supabaseService.client
          .from("users")
          .select("first_name, last_name, email")
          .eq("id", invitation.invited_by)
          .single();

        if (inviter) {
          inviterName =
            inviter.first_name && inviter.last_name
              ? `${inviter.first_name} ${inviter.last_name}`
              : inviter.email;
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
        inviterEmail: invitation.email,
        role: invitation.role || "player",
        position: invitation.position,
        jerseyNumber: invitation.jersey_number,
        expiresAt: invitation.expires_at,
        status: invitation.status,
      });
      this.teamName.set(teamNameValue);

      // Check if user is logged in
      const currentUser = this.supabaseService.getCurrentUser();
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

    const currentUser = this.supabaseService.getCurrentUser();
    if (!currentUser) {
      this.needsLogin.set(true);
      return;
    }

    this.isProcessing.set(true);

    try {
      // Start a transaction-like operation
      // 1. Update invitation status to 'accepted'
      const { error: updateError } = await this.supabaseService.client
        .from("team_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      if (updateError) {
        throw updateError;
      }

      // 2. Create team_members record
      const { error: memberError } = await this.supabaseService.client
        .from("team_members")
        .insert({
          team_id: invitation.teamId,
          user_id: currentUser.id,
          role: invitation.role || "player",
          position: invitation.position,
          jersey_number: invitation.jerseyNumber,
          status: "active",
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        // If member creation fails, try to revert invitation status
        await this.supabaseService.client
          .from("team_invitations")
          .update({ status: "pending", accepted_at: null })
          .eq("id", invitation.id);

        // Check if user is already a member
        if (memberError.code === "23505") {
          // Unique violation
          this.toastService.info(
            "You are already a member of this team.",
            "Already a Member",
          );
          this.router.navigate(["/roster"]);
          return;
        }

        throw memberError;
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
      const message =
        error instanceof Error
          ? error.message
          : "Failed to accept invitation. Please try again.";
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
      const { error } = await this.supabaseService.client
        .from("team_invitations")
        .update({
          status: "declined",
        })
        .eq("id", invitation.id);

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
      const message =
        error instanceof Error
          ? error.message
          : "Failed to decline invitation. Please try again.";
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
}
