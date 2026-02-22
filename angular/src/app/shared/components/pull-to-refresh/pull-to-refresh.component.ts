import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  OnDestroy,
  inject,
  afterNextRender,
  Injector,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-pull-to-refresh",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="pull-to-refresh-container"
      #container
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd()"
    >
      <!-- Pull indicator -->
      <div
        class="pull-indicator"
        [class.visible]="showIndicator()"
        [class.refreshing]="isRefreshing()"
        [style.transform]="indicatorTransform()"
        [style.opacity]="indicatorOpacity()"
      >
        <div class="indicator-content">
          @if (isRefreshing()) {
            <i class="pi pi-spin pi-spinner"></i>
            <span>Refreshing...</span>
          } @else if (pullProgress() >= 1) {
            <i class="pi pi-arrow-up"></i>
            <span>Release to refresh</span>
          } @else {
            <i class="pi pi-arrow-down"></i>
            <span>Pull to refresh</span>
          }
        </div>
      </div>

      <!-- Content -->
      <div class="pull-content" [style.transform]="contentTransform()">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrl: "./pull-to-refresh.component.scss",
})
export class PullToRefreshComponent implements OnDestroy {
  private document = inject(DOCUMENT);
  private injector = inject(Injector);

  // Angular 21: Use viewChild() signal instead of @ViewChild()
  container = viewChild.required<ElementRef<HTMLDivElement>>("container");

  // Angular 21: Use input() signal API
  threshold = input<number>(80); // Pull distance to trigger refresh
  maxPull = input<number>(120); // Maximum pull distance
  disabled = input<boolean>(false);

  // Angular 21: Use output() signal API
  refresh = output<void>();

  isRefreshing = signal(false);
  pullDistance = signal(0);

  private startY = 0;
  private currentY = 0;
  private isPulling = false;

  showIndicator = computed(
    () => this.pullDistance() > 10 || this.isRefreshing(),
  );
  pullProgress = computed(() =>
    Math.min(this.pullDistance() / this.threshold(), 1),
  );

  indicatorTransform = computed(() => {
    if (this.isRefreshing()) return "translateY(0)";
    const distance = Math.min(this.pullDistance(), this.maxPull());
    return `translateY(calc(${distance}px - (var(--size-120) * 0.5)))`;
  });

  indicatorOpacity = computed(() => {
    if (this.isRefreshing()) return 1;
    return Math.min(this.pullDistance() / 40, 1);
  });

  contentTransform = computed(() => {
    if (this.isRefreshing())
      return "translateY(calc(var(--size-120) * 0.5))";
    const distance = Math.min(this.pullDistance(), this.maxPull());
    return `translateY(${distance}px)`;
  });

  constructor() {
    // Angular 21: Use afterNextRender for DOM-dependent initialization
    // This ensures the DOM is ready before modifying document styles
    afterNextRender(
      () => {
        // Prevent default pull-to-refresh on mobile browsers
        this.document.body.style.overscrollBehavior = "contain";
      },
      { injector: this.injector },
    );
  }

  ngOnDestroy(): void {
    this.document.body.style.overscrollBehavior = "";
  }

  onTouchStart(event: TouchEvent): void {
    if (this.disabled() || this.isRefreshing()) return;

    const containerEl = this.container();
    const scrollTop = containerEl?.nativeElement?.scrollTop || 0;

    // Only start pull if at top of scroll
    if (scrollTop <= 0) {
      this.startY = event.touches[0].clientY;
      this.isPulling = true;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isPulling || this.disabled() || this.isRefreshing()) return;

    this.currentY = event.touches[0].clientY;
    const distance = this.currentY - this.startY;

    // Only pull down, not up
    if (distance > 0) {
      // Apply resistance to pull
      const resistance = 0.5;
      const resistedDistance = distance * resistance;
      this.pullDistance.set(Math.min(resistedDistance, this.maxPull()));

      // Prevent scroll while pulling
      if (distance > 10) {
        event.preventDefault();
      }
    }
  }

  onTouchEnd(): void {
    if (!this.isPulling || this.disabled()) return;

    this.isPulling = false;

    if (this.pullDistance() >= this.threshold() && !this.isRefreshing()) {
      this.triggerRefresh();
    } else {
      this.pullDistance.set(0);
    }
  }

  private triggerRefresh(): void {
    this.isRefreshing.set(true);
    this.pullDistance.set(0);
    this.refresh.emit();
  }

  // Call this from parent when refresh is complete
  completeRefresh(): void {
    this.isRefreshing.set(false);
  }
}
