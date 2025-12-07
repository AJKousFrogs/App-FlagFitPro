import { Component, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-landing",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule],
  template: `
    <section class="hero-section">
      <div class="hero-background">
        <div class="hero-gradient-1"></div>
        <div class="hero-gradient-2"></div>
      </div>
    
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-logo-wrapper">
            <div class="hero-logo">
              <i class="pi pi-football"></i>
            </div>
            <div class="hero-badge">🏆 Pro Platform</div>
          </div>
    
          <h1 class="hero-title">
            Elevate Your
            <span class="hero-title-accent">Flag Football</span>
            Game
          </h1>
    
          <p class="hero-description">
            The ultimate training and competition platform for serious players.
            Track performance, join tournaments, and connect with a community
            that shares your passion for the game.
          </p>
    
          <div class="hero-actions">
            <p-button
              label="Get Started Free"
              icon="pi pi-arrow-right"
              [routerLink]="['/register']"
              styleClass="p-button-lg"
            ></p-button>
            <p-button
              label="Sign In"
              icon="pi pi-sign-in"
              [routerLink]="['/login']"
              [outlined]="true"
              styleClass="p-button-lg"
            ></p-button>
          </div>
    
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="hero-stat-number">10K+</div>
              <div class="hero-stat-label">Active Players</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-number">500+</div>
              <div class="hero-stat-label">Tournaments</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-number">50K+</div>
              <div class="hero-stat-label">Training Sessions</div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <section class="features-section">
      <div class="features-container">
        <div class="features-header">
          <h2 class="features-title">Everything You Need to Excel</h2>
          <p class="features-subtitle">
            Powerful tools designed to help you train smarter, compete better,
            and grow faster
          </p>
        </div>
    
        <div class="features-grid">
          @for (feature of features; track trackByFeatureId($index, feature)) {
            <p-card
              class="feature-card"
              >
              <ng-template pTemplate="header">
                <div class="feature-card-icon">
                  <div
                    class="feature-icon-wrapper"
                    [ngClass]="'feature-icon-' + feature.id"
                    >
                    <i [class]="'pi ' + feature.icon"></i>
                  </div>
                </div>
              </ng-template>
              <h3 class="feature-card-title">{{ feature.title }}</h3>
              <p class="feature-card-description">{{ feature.description }}</p>
              <div class="feature-card-link">
                <span>Learn more</span>
                <i class="pi pi-arrow-right"></i>
              </div>
            </p-card>
          }
        </div>
      </div>
    </section>
    `,
  styles: [
    `
      .hero-section {
        position: relative;
        min-height: 90vh;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .hero-background {
        position: absolute;
        inset: 0;
        z-index: 0;
      }

      .hero-gradient-1,
      .hero-gradient-2 {
        position: absolute;
        border-radius: 50%;
        filter: blur(100px);
        opacity: 0.3;
      }

      .hero-gradient-1 {
        width: 500px;
        height: 500px;
        background: var(--color-brand-primary);
        top: -200px;
        right: -200px;
      }

      .hero-gradient-2 {
        width: 400px;
        height: 400px;
        background: var(--color-brand-secondary);
        bottom: -150px;
        left: -150px;
      }

      .hero-container {
        position: relative;
        z-index: 1;
        max-width: 1200px;
        width: 100%;
        padding: var(--space-6);
      }

      .hero-content {
        text-align: center;
      }

      .hero-logo-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
        margin-bottom: var(--space-8);
      }

      .hero-logo {
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-brand-light);
        border-radius: 50%;
        color: var(--color-brand-primary);
        font-size: 2rem;
      }

      .hero-badge {
        padding: var(--space-2) var(--space-4);
        background: var(--surface-secondary);
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
      }

      .hero-title {
        font-size: 3.5rem;
        font-weight: 800;
        margin-bottom: var(--space-6);
        line-height: 1.1;
      }

      .hero-title-accent {
        color: var(--color-brand-primary);
      }

      .hero-description {
        font-size: 1.25rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-8);
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
      }

      .hero-actions {
        display: flex;
        gap: var(--space-4);
        justify-content: center;
        margin-bottom: var(--space-12);
      }

      .hero-stats {
        display: flex;
        gap: var(--space-8);
        justify-content: center;
      }

      .hero-stat {
        text-align: center;
      }

      .hero-stat-number {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--color-brand-primary);
      }

      .hero-stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .features-section {
        padding: var(--space-16) var(--space-6);
        background: var(--surface-secondary);
      }

      .features-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .features-header {
        text-align: center;
        margin-bottom: var(--space-12);
      }

      .features-title {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: var(--space-4);
      }

      .features-subtitle {
        font-size: 1.125rem;
        color: var(--text-secondary);
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-6);
      }

      .feature-card {
        text-align: center;
      }

      .feature-card-icon {
        display: flex;
        justify-content: center;
        margin-bottom: var(--space-4);
      }

      .feature-icon-wrapper {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 1.5rem;
      }

      .feature-icon-analytics {
        background: rgba(8, 153, 73, 0.1);
        color: var(--color-brand-primary);
      }

      .feature-card-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--space-3);
      }

      .feature-card-description {
        color: var(--text-secondary);
        margin-bottom: var(--space-4);
      }

      .feature-card-link {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        color: var(--color-brand-primary);
        font-weight: 600;
        cursor: pointer;
      }
    `,
  ],
})
export class LandingComponent {
  features = [
    {
      id: "analytics",
      title: "Performance Analytics",
      description:
        "Track every training session and game statistic. Get insights that help you identify strengths and areas for improvement.",
      icon: "pi-chart-bar",
    },
    {
      id: "tournament",
      title: "Tournament System",
      description:
        "Join competitive tournaments, climb leaderboards, and compete against the best players in your region.",
      icon: "pi-trophy",
    },
    {
      id: "community",
      title: "Community Hub",
      description:
        "Connect with players, coaches, and teams. Share strategies, celebrate wins, and build lasting relationships.",
      icon: "pi-users",
    },
    {
      id: "training",
      title: "Training Programs",
      description:
        "Access structured workouts and skill development plans designed by professional coaches and trainers.",
      icon: "pi-bolt",
    },
  ];

  trackByFeatureId(index: number, feature: any): string {
    return feature.id;
  }
}
