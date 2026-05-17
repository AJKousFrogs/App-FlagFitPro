import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
} from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { ensurePrimeIconsStylesheet } from "../../core/utils/primeicons-loader";

/**
 * Landing page — public marketing surface.
 *
 * 2026-05 redesign (sprint 1):
 *  - Replaced the Olympic countdown gimmick with concrete proof metrics
 *  - Outcome-driven hero ("Train smarter. Win Sundays.")
 *  - Added a "Built around real data" chart showcase section so the page
 *    proves the product is a data platform, not generic SaaS marketing
 *  - All hero/outcome metrics carry an inline visualization (sparkline,
 *    gauge, ring, or dot grid) — what makes this feel premium athletic
 *
 * The page is fully static (no backend dependencies). All chart visuals
 * are inline SVG and adapt to the active theme via canonical design tokens.
 */
@Component({
  selector: "app-landing",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: "./landing.component.html",
  styleUrl: "./landing.component.scss",
})
export class LandingComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private hasPrefetchedRegisterRoute = false;
  private hasPrefetchedLoginRoute = false;

  // Smooth-scroll target for "Why FlagFit" anchor in marketing nav
  readonly outcomesSection =
    viewChild<ElementRef<HTMLElement>>("outcomesSection");

  readonly currentYear = new Date().getFullYear();

  scrollToOutcomes(event: Event): void {
    event.preventDefault();
    this.outcomesSection()?.nativeElement.scrollIntoView({ behavior: "smooth" });
  }

  preloadRegisterRoute(): void {
    ensurePrimeIconsStylesheet();
    if (this.hasPrefetchedRegisterRoute) return;
    this.hasPrefetchedRegisterRoute = true;
    void import("../auth/register/register.component");
  }

  preloadLoginRoute(): void {
    ensurePrimeIconsStylesheet();
    if (this.hasPrefetchedLoginRoute) return;
    this.hasPrefetchedLoginRoute = true;
    void import("../auth/login/login.component");
  }
}
