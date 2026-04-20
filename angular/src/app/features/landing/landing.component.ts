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
  templateUrl: "./landing.component.html",
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
      title: "Merlin AI - Merlin",
      description:
        "Get personalized training advice from Merlin, your Merlin AI. Ask questions, get drill recommendations, and improve faster.",
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
