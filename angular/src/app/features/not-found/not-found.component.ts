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
  styleUrl: './not-found.component.scss',
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
