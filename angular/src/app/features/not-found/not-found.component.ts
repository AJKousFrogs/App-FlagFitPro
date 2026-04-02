import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";

@Component({
  selector: "app-not-found",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, ButtonComponent, PageErrorStateComponent],
  template: `
    <div class="not-found-page">
      <div class="not-found-content">
        <div class="not-found-code">404</div>
        <app-page-error-state
          class="not-found-state"
          titleTag="h1"
          title="Page Not Found"
          message="Oops! The page you're looking for doesn't exist or has been moved."
          icon="pi-compass"
          [showRetry]="false"
        ></app-page-error-state>
        <div class="not-found-actions">
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
        <div class="not-found-links">
          <p>Here are some helpful links:</p>
          <ul>
            <li><a routerLink="/dashboard">Dashboard</a></li>
            <li><a routerLink="/training">Training</a></li>
            <li><a routerLink="/performance/insights">Performance</a></li>
            <li><a routerLink="/settings">Settings</a></li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styleUrl: "./not-found.component.scss",
})
export class NotFoundComponent {
  private readonly router = inject(Router);

  goBack(): void {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      void this.router.navigate(["/dashboard"]);
    }
  }
}
