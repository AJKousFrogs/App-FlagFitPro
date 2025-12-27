import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-pull-to-refresh",
  standalone: true,
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
      <div 
        class="pull-content"
        [style.transform]="contentTransform()"
      >
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .pull-to-refresh-container {
      position: relative;
      overflow-y: auto;
      overflow-x: hidden;
      height: 100%;
      -webkit-overflow-scrolling: touch;
    }

    .pull-indicator {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 60px;
      pointer-events: none;
      opacity: 0;
      transform: translateY(-100%);
      transition: opacity 0.2s ease;
    }

    .pull-indicator.visible {
      opacity: 1;
    }

    .pull-indicator.refreshing {
      transform: translateY(0) !important;
      opacity: 1 !important;
    }

    .indicator-content {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--surface-primary);
      border-radius: 999px;
      box-shadow: var(--shadow-md);
      color: var(--color-brand-primary);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .indicator-content i {
      font-size: 1rem;
    }

    .pull-content {
      min-height: 100%;
      transition: transform 0.2s ease;
    }

    .pull-indicator.refreshing + .pull-content {
      transform: translateY(60px) !important;
    }
  `],
})
export class PullToRefreshComponent implements OnInit, OnDestroy {
  @ViewChild("container") container!: ElementRef<HTMLDivElement>;
  
  @Input() threshold = 80; // Pull distance to trigger refresh
  @Input() maxPull = 120; // Maximum pull distance
  @Input() disabled = false;
  
  @Output() refresh = new EventEmitter<void>();

  isRefreshing = signal(false);
  pullDistance = signal(0);
  
  private startY = 0;
  private currentY = 0;
  private isPulling = false;

  showIndicator = computed(() => this.pullDistance() > 10 || this.isRefreshing());
  pullProgress = computed(() => Math.min(this.pullDistance() / this.threshold, 1));
  
  indicatorTransform = computed(() => {
    if (this.isRefreshing()) return "translateY(0)";
    const distance = Math.min(this.pullDistance(), this.maxPull);
    return `translateY(${distance - 60}px)`;
  });

  indicatorOpacity = computed(() => {
    if (this.isRefreshing()) return 1;
    return Math.min(this.pullDistance() / 40, 1);
  });

  contentTransform = computed(() => {
    if (this.isRefreshing()) return "translateY(60px)";
    const distance = Math.min(this.pullDistance(), this.maxPull);
    return `translateY(${distance}px)`;
  });

  ngOnInit(): void {
    // Prevent default pull-to-refresh on mobile browsers
    document.body.style.overscrollBehavior = "contain";
  }

  ngOnDestroy(): void {
    document.body.style.overscrollBehavior = "";
  }

  onTouchStart(event: TouchEvent): void {
    if (this.disabled || this.isRefreshing()) return;
    
    const scrollTop = this.container?.nativeElement?.scrollTop || 0;
    
    // Only start pull if at top of scroll
    if (scrollTop <= 0) {
      this.startY = event.touches[0].clientY;
      this.isPulling = true;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isPulling || this.disabled || this.isRefreshing()) return;
    
    this.currentY = event.touches[0].clientY;
    const distance = this.currentY - this.startY;
    
    // Only pull down, not up
    if (distance > 0) {
      // Apply resistance to pull
      const resistance = 0.5;
      const resistedDistance = distance * resistance;
      this.pullDistance.set(Math.min(resistedDistance, this.maxPull));
      
      // Prevent scroll while pulling
      if (distance > 10) {
        event.preventDefault();
      }
    }
  }

  onTouchEnd(): void {
    if (!this.isPulling || this.disabled) return;
    
    this.isPulling = false;
    
    if (this.pullDistance() >= this.threshold && !this.isRefreshing()) {
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
