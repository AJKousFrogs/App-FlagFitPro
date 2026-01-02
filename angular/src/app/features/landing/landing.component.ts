import { CommonModule } from "@angular/common";
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";

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
        <div class="hero-particles">
          @for (particle of particles; track particle.id) {
            <div
              class="particle"
              [style.left.%]="particle.x"
              [style.top.%]="particle.y"
              [style.animation-delay]="particle.delay + 's'"
              [style.animation-duration]="particle.duration + 's'"
            ></div>
          }
        </div>
      </div>

      <div class="hero-container">
        <div class="hero-content" [class.hero-content-visible]="isLoaded()">
          <div class="hero-logo-wrapper animate-item" style="--delay: 0">
            <div class="hero-logo">
              <span class="merlin-icon">🏈</span>
            </div>
            <div class="hero-badge">🏆 Pro Platform</div>
          </div>

          <!-- Olympic Countdown Timer -->
          <div class="olympic-countdown animate-item" style="--delay: 1">
            <div class="countdown-label">
              <span class="countdown-label-text">TIME LEFT UNTIL THE</span>
              <span class="countdown-label-event">LA28 OLYMPIC GAMES</span>
            </div>
            <div class="countdown-timer">
              <div class="countdown-segment countdown-days">
                <span class="countdown-value">{{
                  olympicCountdown().days
                }}</span>
                <span class="countdown-unit">DAYS</span>
              </div>
              <div class="countdown-separator">:</div>
              <div class="countdown-segment">
                <span class="countdown-value">{{
                  olympicCountdown().hours | number: "2.0-0"
                }}</span>
                <span class="countdown-unit">HOURS</span>
              </div>
              <div class="countdown-separator">:</div>
              <div class="countdown-segment">
                <span class="countdown-value">{{
                  olympicCountdown().minutes | number: "2.0-0"
                }}</span>
                <span class="countdown-unit">MINS</span>
              </div>
              <div class="countdown-separator">:</div>
              <div class="countdown-segment">
                <span class="countdown-value">{{
                  olympicCountdown().seconds | number: "2.0-0"
                }}</span>
                <span class="countdown-unit">SEC</span>
              </div>
            </div>
          </div>

          <h1 class="hero-title animate-item" style="--delay: 2">
            Elevate Your
            <span class="hero-title-accent">Flag Football</span>
            Game
          </h1>

          <p class="hero-description animate-item" style="--delay: 3">
            The ultimate training and competition platform for serious players.
            Track performance, join tournaments, and connect with a community
            that shares your passion for the game.
          </p>

          <div class="hero-actions animate-item" style="--delay: 4">
            <p-button
              label="Get Started Free"
              icon="pi pi-arrow-right"
              iconPos="right"
              [rounded]="true"
              size="large"
              [routerLink]="['/register']"
              styleClass="hero-btn-primary"
            ></p-button>
            <p-button
              label="Sign In"
              icon="pi pi-sign-in"
              [rounded]="true"
              [outlined]="true"
              size="large"
              [routerLink]="['/login']"
              styleClass="hero-btn-secondary"
            ></p-button>
          </div>

          <div class="hero-stats animate-item" style="--delay: 5">
            @for (stat of heroStats; track stat.label) {
              <div class="hero-stat" [style.--stat-delay]="$index">
                <div class="hero-stat-number">{{ stat.value }}</div>
                <div class="hero-stat-label">{{ stat.label }}</div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div
        class="scroll-indicator animate-item"
        style="--delay: 6"
        [class.visible]="isLoaded()"
      >
        <div class="scroll-mouse">
          <div class="scroll-wheel"></div>
        </div>
        <span>Scroll to explore</span>
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
            <p-card class="feature-card">
              <ng-template pTemplate="header">
                <div class="feature-card-icon">
                  <div
                    class="feature-icon-wrapper"
                    [class]="'feature-icon-' + feature.id"
                  >
                    <i [class]="'pi ' + feature.icon"></i>
                  </div>
                </div>
              </ng-template>
              <h3 class="feature-card-title">{{ feature.title }}</h3>
              <p class="feature-card-description">{{ feature.description }}</p>
              <div
                class="feature-card-link"
                (click)="navigateToFeature(feature.id)"
              >
                <span>Learn more</span>
                <i class="pi pi-arrow-right"></i>
              </div>
            </p-card>
          }
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-container">
        <div class="footer-grid">
          <!-- Brand -->
          <div class="footer-brand">
            <div class="footer-logo">
              <i class="pi pi-football"></i>
              <span>FlagFit Pro</span>
            </div>
            <p class="footer-tagline">
              The ultimate training and competition platform for flag football
              athletes.
            </p>
          </div>

          <!-- Quick Links -->
          <div class="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><a routerLink="/login">Sign In</a></li>
              <li><a routerLink="/register">Get Started</a></li>
              <li>
                <a href="#features" (click)="scrollToFeatures($event)"
                  >Features</a
                >
              </li>
            </ul>
          </div>

          <!-- Resources -->
          <div class="footer-links">
            <h4>Resources</h4>
            <ul>
              <li><a routerLink="/settings/privacy">Privacy Settings</a></li>
              <li>
                <a href="mailto:support&#64;flagfitpro.com">Contact Support</a>
              </li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} FlagFit Pro. All rights reserved.</p>
        </div>
      </div>
      </footer>
  `,
  styleUrl: "./landing.component.scss",
})
export class LandingComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signals for reactive state
  isLoaded = signal(false);

  // Olympic countdown - LA 2028 Opening Ceremony: July 14, 2028
  olympicCountdown = signal({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // LA 2028 Olympics Opening Ceremony date
  private olympicDate = new Date("2028-07-14T20:00:00-07:00"); // Pacific Time
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  currentYear = new Date().getFullYear();

  // Hero stats data - authentic messaging for Olympic-bound athletes
  heroStats = [
    { value: "LA28", label: "Olympic Debut" },
    { value: "5v5", label: "Olympic Format" },
    { value: "∞", label: "Your Potential" },
  ];

  // Particle data for background animation
  particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 10,
  }));

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
    {
      id: "ai-coach",
      title: "AI Coach - Merlin",
      description:
        "Get personalized training advice from Merlin, your AI coach. Ask questions, get drill recommendations, and improve faster.",
      icon: "pi-sparkles",
    },
    {
      id: "progress",
      title: "Progress Reports",
      description:
        "Get detailed weekly and monthly reports on your development. Visualize your journey from beginner to elite athlete.",
      icon: "pi-chart-line",
    },
  ];

  constructor() {
    // Trigger animations after component renders
    afterNextRender(() => {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        this.isLoaded.set(true);
      }, 100);
    });
  }

  ngOnInit(): void {
    // Start countdown immediately
    this.updateCountdown();

    // Update every second
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    });
  }

  private updateCountdown(): void {
    const now = new Date().getTime();
    const target = this.olympicDate.getTime();
    const difference = target - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      this.olympicCountdown.set({ days, hours, minutes, seconds });
    } else {
      // Olympic games have started!
      this.olympicCountdown.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    }
  }

  trackByFeatureId(index: number, feature: { id: string }): string {
    return feature.id;
  }

  scrollToFeatures(event: Event): void {
    event.preventDefault();
    const featuresSection = document.querySelector(".features-section");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  }

  navigateToFeature(featureId: string): void {
    // Map feature IDs to their corresponding routes
    const featureRoutes: Record<string, string> = {
      analytics: "/analytics",
      tournament: "/tournaments",
      community: "/community",
      training: "/training",
      "ai-coach": "/ai-coach",
      progress: "/analytics",
    };

    const route = featureRoutes[featureId];
    if (route) {
      // Navigate to register first (since these are protected routes)
      this.router.navigate(["/register"], {
        queryParams: { redirect: route },
      });
    }
  }
}
