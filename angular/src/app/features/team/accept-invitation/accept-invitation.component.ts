import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from "@angular/core";

import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { ToastModule } from "primeng/toast";
import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-accept-invitation",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, CardModule, ButtonModule, MessageModule, ToastModule],
  template: `
    <p-toast></p-toast>
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
            <p-message
              severity="info"
              [text]="'Loading invitation...'"
            ></p-message>
          </div>
        } @else if (invitationError()) {
          <div class="error-state">
            <p-message severity="error" [text]="invitationError()"></p-message>
            <a [routerLink]="['/dashboard']" class="back-link mt-4"
              >Go to Dashboard</a
            >
          </div>
        } @else if (isAccepted()) {
          <div class="accepted-state">
            <p-message
              severity="success"
              [text]="'Invitation accepted!'"
            ></p-message>
            <p class="accepted-message">
              You've successfully joined {{ teamName() }}. Welcome to the team!
            </p>
            <p-button
              label="Go to Team Page"
              icon="pi pi-users"
              [routerLink]="['/roster']"
              styleClass="w-full mt-4"
            ></p-button>
          </div>
        } @else if (invitationData()) {
          <div class="invitation-state">
            <div class="team-info">
              <h3>{{ invitationData()?.teamName }}</h3>
              <p class="team-description">
                You've been invited to join this team by
                {{ invitationData()?.inviterName }}.
              </p>
            </div>

            <div class="invitation-actions">
              <p-button
                label="Accept Invitation"
                icon="pi pi-check"
                (onClick)="acceptInvitation()"
                [loading]="isProcessing()"
                styleClass="w-full mb-3"
              ></p-button>
              <p-button
                label="Decline"
                [outlined]="true"
                severity="secondary"
                (onClick)="declineInvitation()"
                [loading]="isProcessing()"
                styleClass="w-full"
              ></p-button>
            </div>
          </div>
        }
      </p-card>
    </div>
  `,
  styles: [
    `
      .accept-invitation-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: var(--space-6);
        background: var(--surface-secondary);
      }

      .accept-invitation-card {
        width: 100%;
        max-width: 500px;
      }

      .accept-invitation-logo {
        display: flex;
        justify-content: center;
        margin-bottom: var(--space-4);
      }

      .accept-invitation-logo i {
        font-size: var(--icon-3xl);
        color: var(--color-brand-primary);
      }

      .accept-invitation-title {
        text-align: center;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }

      .team-info {
        text-align: center;
        margin-bottom: var(--space-6);
      }

      .team-info h3 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .team-description {
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .accepted-message {
        margin-top: var(--space-4);
        color: var(--text-secondary);
        line-height: 1.6;
        text-align: center;
      }

      .back-link {
        display: block;
        text-align: center;
        color: var(--color-brand-primary);
        text-decoration: none;
      }

      .back-link:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class AcceptInvitationComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  isLoading = signal(true);
  isProcessing = signal(false);
  isAccepted = signal(false);
  invitationError = signal<string | undefined>(undefined);
  invitationData = signal<{
    teamName: string;
    inviterName: string;
    invitationId: string;
  } | null>(null);
  teamName = signal("");

  ngOnInit(): void {
    // Get invitation token from query params
    const token = this.route.snapshot.queryParams["token"];
    const invitationId = this.route.snapshot.queryParams["id"];

    if (token || invitationId) {
      this.loadInvitation(token || invitationId);
    } else {
      this.invitationError.set(
        "Invalid invitation link. Please check your email.",
      );
      this.isLoading.set(false);
    }
  }

  async loadInvitation(tokenOrId: string): Promise<void> {
    try {
      // See issue #4 - Implement team invitation API (load invitation data)
      // const response = await this.apiService.getInvitation(tokenOrId);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      this.invitationData.set({
        teamName: "Eagles Flag Football",
        inviterName: "Coach Johnson",
        invitationId: tokenOrId,
      });
      this.teamName.set("Eagles Flag Football");

      this.isLoading.set(false);
    } catch (error) {
      this.isLoading.set(false);
      this.invitationError.set(
        error instanceof Error ? error.message : "Failed to load invitation. It may have expired.",
      );
    }
  }

  async acceptInvitation(): Promise<void> {
    if (!this.invitationData()) return;

    this.isProcessing.set(true);

    try {
      // See issue #4 - Implement team invitation API (accept invitation)
      // await this.apiService.acceptInvitation(this.invitationData()!.invitationId);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.isAccepted.set(true);

      this.toastService.success(`You've joined ${this.teamName()}!`, "Invitation Accepted");

      // Redirect to roster after 2 seconds
      setTimeout(() => {
        this.router.navigate(["/roster"]);
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to accept invitation. Please try again.";
      this.toastService.error(message);
    } finally {
      this.isProcessing.set(false);
    }
  }

  async declineInvitation(): Promise<void> {
    if (!this.invitationData()) return;

    this.isProcessing.set(true);

    try {
      // See issue #4 - Implement team invitation API (decline invitation)
      // await this.apiService.declineInvitation(this.invitationData()!.invitationId);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.toastService.info("You have declined the team invitation.", "Invitation Declined");

      // Redirect to dashboard
      setTimeout(() => {
        this.router.navigate(["/dashboard"]);
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to decline invitation. Please try again.";
      this.toastService.error(message);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
