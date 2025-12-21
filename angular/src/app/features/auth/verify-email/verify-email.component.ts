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
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";

@Component({
  selector: "app-verify-email",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    CardModule,
    ButtonModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="verify-email-page">
      <p-card class="verify-email-card">
        <ng-template pTemplate="header">
          <div class="verify-email-logo">
            <i class="pi pi-envelope"></i>
          </div>
          <h1 class="verify-email-title">Verify Your Email</h1>
        </ng-template>
    
        @if (isVerifying()) {
          <div class="verifying-state">
            <p-message severity="info" [text]="'Verifying your email address...'"></p-message>
          </div>
        } @else if (isVerified()) {
          <div class="verified-state">
            <p-message severity="success" [text]="'Email verified successfully!'"></p-message>
            <p class="verified-message">
              Your email has been verified. You can now access all features.
            </p>
            <p-button
              label="Go to Dashboard"
              icon="pi pi-home"
              [routerLink]="['/dashboard']"
              styleClass="w-full mt-4"
            ></p-button>
          </div>
        } @else if (verificationError()) {
          <div class="error-state">
            <p-message severity="error" [text]="verificationError()"></p-message>
            <p-button
              label="Resend Verification Email"
              icon="pi pi-send"
              [outlined]="true"
              (onClick)="resendVerification()"
              [loading]="isResending()"
              styleClass="w-full mt-4"
            ></p-button>
            <a [routerLink]="['/login']" class="back-to-login-link mt-4"
              >Back to Sign In</a
            >
          </div>
        } @else {
          <div class="pending-state">
            <p-message severity="warn" [text]="'Please check your email'"></p-message>
            <p class="pending-message">
              We've sent a verification link to your email address. Please click the link to verify your account.
            </p>
            <p-button
              label="Resend Verification Email"
              icon="pi pi-send"
              [outlined]="true"
              (onClick)="resendVerification()"
              [loading]="isResending()"
              styleClass="w-full mt-4"
            ></p-button>
            <a [routerLink]="['/login']" class="back-to-login-link mt-4"
              >Back to Sign In</a
            >
          </div>
        }
      </p-card>
    </div>
  `,
  styles: [
    `
      .verify-email-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: var(--space-6);
        background: var(--surface-secondary);
      }

      .verify-email-card {
        width: 100%;
        max-width: 500px;
      }

      .verify-email-logo {
        display: flex;
        justify-content: center;
        margin-bottom: var(--space-4);
      }

      .verify-email-logo i {
        font-size: 3rem;
        color: var(--color-brand-primary);
      }

      .verify-email-title {
        text-align: center;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }

      .verifying-state,
      .verified-state,
      .error-state,
      .pending-state {
        text-align: center;
      }

      .verified-message,
      .pending-message {
        margin-top: var(--space-4);
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .back-to-login-link {
        display: block;
        text-align: center;
        color: var(--color-brand-primary);
        text-decoration: none;
        margin-top: var(--space-4);
      }

      .back-to-login-link:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class VerifyEmailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  isVerifying = signal(false);
  isVerified = signal(false);
  verificationError = signal<string | null>(null);
  isResending = signal(false);

  ngOnInit(): void {
    // Check for token in query params
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.verifyEmail(token);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    this.isVerifying.set(true);
    this.verificationError.set(null);

    try {
      // TODO: Call API to verify email token
      // const response = await this.apiService.verifyEmail(token);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isVerified.set(true);
      this.isVerifying.set(false);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Email Verified',
        detail: 'Your email has been verified successfully!'
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
    } catch (error: any) {
      this.isVerifying.set(false);
      this.verificationError.set(error.message || 'Verification failed. Please try again.');
    }
  }

  async resendVerification(): Promise<void> {
    this.isResending.set(true);

    try {
      // TODO: Call API to resend verification email
      // await this.apiService.resendVerificationEmail();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.messageService.add({
        severity: 'success',
        summary: 'Email Sent',
        detail: 'Verification email has been sent. Please check your inbox.'
      });
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to send verification email. Please try again.'
      });
    } finally {
      this.isResending.set(false);
    }
  }
}

