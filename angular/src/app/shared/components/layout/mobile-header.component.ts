import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { HeaderSearchWidgetComponent } from "../header/header-search-widget.component";
import { ContextService } from "../../../core/services/context.service";

@Component({
  selector: "app-mobile-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderSearchWidgetComponent],
  template: `
    <header class="mobile-header-shell">
      <button
        (click)="toggleSidebar.emit()"
        class="mobile-menu-toggle"
        type="button"
        aria-label="Open navigation"
      >
        <i class="pi pi-bars"></i>
      </button>
      <div class="mobile-header-center">
        <span class="mobile-header-eyebrow">FlagFit Pro</span>
        <strong class="mobile-header-title">{{ pageTitle() }}</strong>
      </div>
      <div class="mobile-header-end">
        <app-header-search-widget></app-header-search-widget>
      </div>
    </header>
  `,
  styleUrl: "./mobile-header.component.scss",
})
export class MobileHeaderComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly contextService = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentRoute = signal("");

  readonly toggleSidebar = output<void>();

  readonly pageTitle = computed(() => {
    const route = this.currentRoute() || this.router.url;
    const items = this.contextService.buildBreadcrumbItems(route);
    if (items.length === 0) {
      return "Dashboard";
    }

    return items[items.length - 1]?.label ?? "Dashboard";
  });

  ngOnInit(): void {
    this.currentRoute.set(this.router.url);

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentRoute.set((event as NavigationEnd).urlAfterRedirects);
      });
  }
}
