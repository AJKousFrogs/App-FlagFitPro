import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-not-found",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, ButtonModule],
  template: `
    <div class="not-found-page">
      <div class="not-found-content">
        <div class="error-code">404</div>
        <h1 class="error-title">Page Not Found</h1>
        <p class="error-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="error-actions">
          <p-button
            label="Go to Dashboard"
            icon="pi pi-home"
            [rounded]="true"
            size="large"
            [routerLink]="['/dashboard']"
          ></p-button>
          <p-button
            label="Go Back"
            icon="pi pi-arrow-left"
            [rounded]="true"
            [outlined]="true"
            size="large"
            (onClick)="goBack()"
          ></p-button>
        </div>
        <div class="helpful-links">
          <p>Here are some helpful links:</p>
          <ul>
            <li><a routerLink="/dashboard">Dashboard</a></li>
            <li><a routerLink="/training">Training</a></li>
            <li><a routerLink="/analytics">Analytics</a></li>
            <li><a routerLink="/settings">Settings</a></li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .not-found-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: var(--space-6);
        background: linear-gradient(
          135deg,
          var(--surface-secondary) 0%,
          var(--surface-primary) 100%
        );
      }

      .not-found-content {
        text-align: center;
        max-width: 500px;
      }

      .error-code {
        font-size: 8rem;
        font-weight: 800;
        color: var(--color-brand-primary);
        line-height: 1;
        margin-bottom: var(--space-4);
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
      }

      .error-title {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--space-4);
      }

      .error-message {
        font-size: 1.125rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-6);
        line-height: 1.6;
      }

      .error-actions {
        display: flex;
        gap: var(--space-4);
        justify-content: center;
        margin-bottom: var(--space-8);
      }

      .helpful-links {
        padding-top: var(--space-6);
        border-top: 1px solid var(--p-surface-200);
      }

      .helpful-links p {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }

      .helpful-links ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        gap: var(--space-4);
        justify-content: center;
        flex-wrap: wrap;
      }

      .helpful-links a {
        color: var(--color-brand-primary);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
      }

      .helpful-links a:hover {
        color: var(--color-brand-dark);
        text-decoration: underline;
      }

      @media (max-width: 768px) {
        .error-code {
          font-size: 5rem;
        }

        .error-title {
          font-size: 1.5rem;
        }

        .error-actions {
          flex-direction: column;
        }

        .helpful-links ul {
          flex-direction: column;
          gap: var(--space-2);
        }
      }
    `,
  ],
})
export class NotFoundComponent {
  goBack(): void {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to dashboard if no history
      window.location.href = "/dashboard";
    }
  }
}
