import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";

@Component({
  selector: "app-header-breadcrumbs",
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./header-breadcrumbs.component.html",
})
export class HeaderBreadcrumbsComponent implements OnInit {
  private readonly router = inject(Router);

  readonly currentSection = signal("");
  readonly currentPage = signal("");

  private readonly navigationEnd$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
  );
  private readonly navigationEnd = toSignal(this.navigationEnd$, {
    initialValue: null,
  });

  ngOnInit(): void {
    this.updateBreadcrumbs();

    // Update breadcrumbs whenever the route changes.
    effect(() => {
      if (this.navigationEnd()) {
        this.updateBreadcrumbs();
      }
    });
  }

  private updateBreadcrumbs(): void {
    const url = this.router.url;

    interface BreadcrumbRule {
      match: (url: string) => boolean;
      section: string;
      page: (url: string) => string;
    }

    const rules: BreadcrumbRule[] = [
      { match: (u) => u.includes("/dashboard"), section: "Dashboard", page: () => "" },
      {
        match: (u) => u.includes("/training"),
        section: "Training",
        page: (u) => (u.includes("/overview") ? "Overview" : ""),
      },
      {
        match: (u) =>
          u.includes("/analytics") ||
          u.includes("/performance/insights") ||
          u.includes("/performance/tests") ||
          u.includes("/performance/load"),
        section: "Performance",
        page: () => "",
      },
      { match: (u) => u.includes("/roster"), section: "Roster", page: () => "" },
      { match: (u) => u.includes("/settings"), section: "Settings", page: () => "" },
      { match: (u) => u.includes("/profile"), section: "Profile", page: () => "" },
    ];

    const rule = rules.find((r) => r.match(url));
    this.currentSection.set(rule?.section ?? "");
    this.currentPage.set(rule ? rule.page(url) : "");
  }
}

