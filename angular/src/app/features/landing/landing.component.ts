import { CommonModule } from "@angular/common";
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { ensurePrimeIconsStylesheet } from "../../core/utils/primeicons-loader";

@Component({
  selector: "app-landing",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, CardShellComponent, ButtonComponent],
  template: `
    <section class="hero-section">
      <div class="hero-background">
        <div class="hero-gradient-1"></div>
        <div class="hero-gradient-2"></div>
        @if (particles().length > 0) {
          <div class="hero-particles">
            @for (particle of particles(); track particle.id) {
              <div
                class="particle"
                [style.left.%]="particle.x"
                [style.top.%]="particle.y"
                [style.animation-delay]="particle.delay + 's'"
                [style.animation-duration]="particle.duration + 's'"
              ></div>
            }
          </div>
        }
      </div>

      <div class="hero-container">
        <div class="hero-content" [class.hero-content-visible]="isLoaded()">
          <div class="hero-logo-wrapper animate-item animate-delay-0">
            <div class="hero-logo">
              <span class="merlin-icon">🏈</span>
            </div>
            <div class="hero-badge">
              <span class="hero-badge-marker" aria-hidden="true"></span>
              Olympic-ready platform
            </div>
          </div>

          <!-- Olympic Countdown Timer -->
          <div class="olympic-countdown animate-item animate-delay-1">
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

          <h1 class="hero-title animate-item animate-delay-2">
            Elevate Your
            <span class="hero-title-accent">Flag Football</span>
            Game
          </h1>

          <p class="hero-description animate-item animate-delay-3">
            The ultimate training and competition platform for serious players.
            Track performance, join tournaments, and connect with a community
            that shares your passion for the game.
          </p>

          <div class="hero-actions animate-item animate-delay-4">
            <app-button
              size="lg"
              routerLink="/register"
              (mouseover)="preloadRegisterRoute()"
              (focusin)="preloadRegisterRoute()"
              (touchstart)="preloadRegisterRoute()"
              >Get Started Free</app-button
            >
            <app-button
              variant="outlined"
              size="lg"
              routerLink="/login"
              (mouseover)="preloadLoginRoute()"
              (focusin)="preloadLoginRoute()"
              (touchstart)="preloadLoginRoute()"
              >Sign In</app-button
            >
          </div>

          <div class="hero-stats animate-item animate-delay-5">
            @for (stat of heroStats; track stat.label) {
              <div [class]="'hero-stat stat-delay-' + $index">
                <div class="hero-stat-number">{{ stat.value }}</div>
                <div class="hero-stat-label">{{ stat.label }}</div>
              </div>
            }
          </div>

          <!-- Scroll indicator -->
          <div class="scroll-indicator animate-item animate-delay-6">
            <div class="scroll-mouse">
              <div class="scroll-wheel"></div>
            </div>
            <span>Scroll to explore</span>
          </div>
        </div>
      </div>
    </section>

    <section class="features-section" #featuresSection>
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
            <app-card-shell
              class="feature-card"
              [stretchBody]="true"
              state="interactive"
              (cardClick)="navigateToFeature(feature.id)"
            >
              <!-- Custom header with icon -->
              <div class="feature-card-icon">
                <div
                  class="feature-icon-wrapper"
                  [class]="'feature-icon-' + feature.id"
                >
                  <span class="feature-icon-glyph" aria-hidden="true">{{
                    feature.glyph
                  }}</span>
                </div>
              </div>
              <h3 class="feature-card-title">{{ feature.title }}</h3>
              <p class="feature-card-description">{{ feature.description }}</p>
              <div class="feature-card-link">
                <span>Learn more</span>
                <span class="feature-card-arrow" aria-hidden="true">→</span>
              </div>
            </app-card-shell>
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
              <span class="footer-logo-mark" aria-hidden="true">🏈</span>
              <span class="footer-logo-text">FlagFit Pro</span>
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
  private readonly heroRevealDelayMs = 100;
  private readonly particleRevealDelayMs = 700;
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private hasPrefetchedRegisterRoute = false;
  private hasPrefetchedLoginRoute = false;
  private heroRevealTimer: ReturnType<typeof setTimeout> | null = null;
  private particleRevealTimer: ReturnType<typeof setTimeout> | null = null;

  // ViewChild reference for scroll operation
  private readonly featuresSection =
    viewChild<ElementRef<HTMLElement>>("featuresSection");

  // Signals for reactive state
  isLoaded = signal(false);
  particles = signal<LandingParticle[]>([]);

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

  features = [
    {
      id: "analytics",
      title: "Performance Analytics",
      description:
        "Track every training session and game statistic. Get insights that help you identify strengths and areas for improvement.",
      glyph: "📊",
    },
    {
      id: "tournament",
      title: "Tournament System",
      description:
        "Join competitive tournaments, climb leaderboards, and compete against the best players in your region.",
      glyph: "🏆",
    },
    {
      id: "community",
      title: "Community Hub",
      description:
        "Connect with players, coaches, and teams. Share strategies, celebrate wins, and build lasting relationships.",
      glyph: "👥",
    },
    {
      id: "training",
      title: "Training Programs",
      description:
        "Access structured workouts and skill development plans designed by professional coaches and trainers.",
      glyph: "⚡",
    },
    {
      id: "ai-coach",
      title: "Merlin AI - Merlin",
      description:
        "Get personalized training advice from Merlin, your Merlin AI. Ask questions, get drill recommendations, and improve faster.",
      glyph: "✦",
    },
    {
      id: "progress",
      title: "Progress Reports",
      description:
        "Get detailed weekly and monthly reports on your development. Visualize your journey from beginner to elite athlete.",
      glyph: "📈",
    },
  ];

  constructor() {
    // Trigger animations after component renders
    afterNextRender(() => {
      // Small delay to ensure DOM is ready
      this.heroRevealTimer = setTimeout(() => {
        this.isLoaded.set(true);
        this.heroRevealTimer = null;
      }, this.heroRevealDelayMs);

      if (this.shouldDeferParticles()) {
        this.particleRevealTimer = setTimeout(() => {
          this.particles.set(this.createParticles());
          this.particleRevealTimer = null;
        }, this.particleRevealDelayMs);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.heroRevealTimer) {
        clearTimeout(this.heroRevealTimer);
      }
      if (this.particleRevealTimer) {
        clearTimeout(this.particleRevealTimer);
      }
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
    const sectionEl = this.featuresSection();
    if (sectionEl) {
      sectionEl.nativeElement.scrollIntoView({ behavior: "smooth" });
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
      ensurePrimeIconsStylesheet();
      // Navigate to register first (since these are protected routes)
      this.router.navigate(["/register"], {
        queryParams: { redirect: route },
      });
    }
  }

  preloadRegisterRoute(): void {
    ensurePrimeIconsStylesheet();

    if (this.hasPrefetchedRegisterRoute) {
      return;
    }

    this.hasPrefetchedRegisterRoute = true;
    void import("../auth/register/register.component");
  }

  preloadLoginRoute(): void {
    ensurePrimeIconsStylesheet();

    if (this.hasPrefetchedLoginRoute) {
      return;
    }

    this.hasPrefetchedLoginRoute = true;
    void import("../auth/login/login.component");
  }

  private shouldDeferParticles(): boolean {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return false;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTouchPrimary = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;

    return !prefersReducedMotion && !isTouchPrimary;
  }

  private createParticles(): LandingParticle[] {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return [];
    }

    const particleCount = window.matchMedia("(max-width: 80rem)").matches
      ? 10
      : 14;

    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
    }));
  }
}

interface LandingParticle {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}
