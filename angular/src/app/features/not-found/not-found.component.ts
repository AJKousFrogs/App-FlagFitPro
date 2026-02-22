import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ButtonComponent } from "../../shared/components/button/button.component";

@Component({
  selector: "app-not-found",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, ButtonComponent],
  template: `
    <div class="not-found-page">
      <div class="not-found-content">
        <div class="error-code">404</div>
        <h1 class="error-title">Page Not Found</h1>
        <p class="error-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="error-actions">
          <app-button size="lg" iconLeft="pi-home" routerLink="/dashboard"
            >Go to Dashboard</app-button
          >
          <app-button
            variant="outlined"
            size="lg"
            iconLeft="pi-arrow-left"
            (clicked)="goBack()"
            >Go Back</app-button
          >
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
  styleUrl: "./not-found.component.scss",
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
