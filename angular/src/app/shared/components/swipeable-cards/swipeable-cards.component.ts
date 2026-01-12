/**
 * Swipeable Cards Component
 *
 * Mobile-friendly card stack with swipe navigation.
 * Perfect for onboarding, feature tours, workout cards, etc.
 *
 * Features:
 * - Touch swipe gestures
 * - Keyboard navigation
 * - Dot indicators
 * - Auto-play option
 * - Snap scrolling
 *
 * @example
 * <app-swipeable-cards [cards]="workoutCards">
 *   <ng-template let-card>
 *     <div class="workout-card">{{ card.name }}</div>
 *   </ng-template>
 * </app-swipeable-cards>
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  contentChild,
  TemplateRef,
  ElementRef,
  inject,
  afterNextRender,
  OnDestroy,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-swipeable-cards",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="swipeable-cards"
      [class.show-overflow]="showOverflow()"
      role="region"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-roledescription]="'carousel'"
    >
      <!-- Cards container -->
      <div
        #cardsContainer
        class="cards-container"
        [style.transform]="'translateX(' + translateX() + 'px)'"
        [class.is-dragging]="isDragging()"
        (touchstart)="onTouchStart($event)"
        (touchmove)="onTouchMove($event)"
        (touchend)="onTouchEnd()"
        (mousedown)="onMouseDown($event)"
      >
        @for (card of cards(); track trackBy(card, $index); let i = $index) {
          <div
            class="card-slide"
            [class.active]="i === currentIndex()"
            [style.width.px]="cardWidth()"
            role="group"
            [attr.aria-roledescription]="'slide'"
            [attr.aria-label]="'Slide ' + (i + 1) + ' of ' + cards().length"
          >
            <ng-container
              [ngTemplateOutlet]="cardTemplate()"
              [ngTemplateOutletContext]="{ $implicit: card, index: i }"
            ></ng-container>
          </div>
        }
      </div>

      <!-- Navigation arrows -->
      @if (showArrows() && cards().length > 1) {
        <button
          class="nav-arrow nav-prev"
          [disabled]="!loop() && currentIndex() === 0"
          (click)="prev()"
          aria-label="Previous slide"
        >
          <i class="pi pi-chevron-left"></i>
        </button>
        <button
          class="nav-arrow nav-next"
          [disabled]="!loop() && currentIndex() === cards().length - 1"
          (click)="next()"
          aria-label="Next slide"
        >
          <i class="pi pi-chevron-right"></i>
        </button>
      }

      <!-- Dot indicators -->
      @if (showDots() && cards().length > 1) {
        <div class="dots-container" role="tablist">
          @for (card of cards(); track $index; let i = $index) {
            <button
              class="dot"
              [class.active]="i === currentIndex()"
              (click)="goTo(i)"
              role="tab"
              [attr.aria-selected]="i === currentIndex()"
              [attr.aria-label]="'Go to slide ' + (i + 1)"
            ></button>
          }
        </div>
      }

      <!-- Progress bar -->
      @if (showProgress()) {
        <div class="progress-container">
          <div
            class="progress-bar"
            [style.width.%]="progressPercentage()"
          ></div>
        </div>
      }
    </div>
  `,
  styleUrl: "./swipeable-cards.component.scss",
})
export class SwipeableCardsComponent<T> implements OnDestroy {
  private elementRef = inject(ElementRef);

  // Angular 21: Use contentChild() signal instead of @ContentChild()
  cardTemplate = contentChild.required<TemplateRef<{ $implicit: T; index: number }>>(TemplateRef);

  // Inputs
  cards = input<T[]>([]);
  showArrows = input<boolean>(true);
  showDots = input<boolean>(true);
  showProgress = input<boolean>(false);
  showOverflow = input<boolean>(false);
  loop = input<boolean>(false);
  autoPlay = input<boolean>(false);
  autoPlayInterval = input<number>(5000);
  ariaLabel = input<string>("Card carousel");

  // Outputs
  slideChange = output<number>();

  // State
  currentIndex = signal(0);
  isDragging = signal(false);
  translateX = signal(0);
  cardWidth = signal(300);

  // Touch/mouse tracking
  private startX = 0;
  private currentX = 0;
  private autoPlayTimer: ReturnType<typeof setInterval> | null = null;

  // Computed
  progressPercentage = computed(() => {
    const total = this.cards().length;
    if (total === 0) return 0;
    return ((this.currentIndex() + 1) / total) * 100;
  });

  constructor() {
    // Update card width on resize
    afterNextRender(() => {
      this.updateCardWidth();
      this.updateTranslateX();
    });

    // Start auto-play if enabled
    effect(() => {
      if (this.autoPlay()) {
        this.startAutoPlay();
      } else {
        this.stopAutoPlay();
      }
    });

    // Update translate when index changes
    effect(() => {
      this.currentIndex();
      this.updateTranslateX();
    });
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  @HostListener("window:resize")
  onResize(): void {
    this.updateCardWidth();
    this.updateTranslateX();
  }

  @HostListener("keydown.arrowLeft")
  onArrowLeft(): void {
    this.prev();
  }

  @HostListener("keydown.arrowRight")
  onArrowRight(): void {
    this.next();
  }

  trackBy(item: T, index: number): number {
    return index;
  }

  // Navigation
  next(): void {
    const total = this.cards().length;
    if (total === 0) return;

    let nextIndex = this.currentIndex() + 1;
    if (nextIndex >= total) {
      nextIndex = this.loop() ? 0 : total - 1;
    }

    this.goTo(nextIndex);
  }

  prev(): void {
    const total = this.cards().length;
    if (total === 0) return;

    let prevIndex = this.currentIndex() - 1;
    if (prevIndex < 0) {
      prevIndex = this.loop() ? total - 1 : 0;
    }

    this.goTo(prevIndex);
  }

  goTo(index: number): void {
    const total = this.cards().length;
    if (index < 0 || index >= total) return;

    this.currentIndex.set(index);
    this.slideChange.emit(index);
  }

  // Touch handlers
  onTouchStart(event: TouchEvent): void {
    this.startDrag(event.touches[0].clientX);
  }

  onTouchMove(event: TouchEvent): void {
    this.moveDrag(event.touches[0].clientX);
  }

  onTouchEnd(): void {
    this.endDrag();
  }

  // Mouse handlers
  onMouseDown(event: MouseEvent): void {
    this.startDrag(event.clientX);

    const onMouseMove = (e: MouseEvent) => this.moveDrag(e.clientX);
    const onMouseUp = () => {
      this.endDrag();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  private startDrag(x: number): void {
    this.isDragging.set(true);
    this.startX = x;
    this.currentX = x;
    this.stopAutoPlay();
  }

  private moveDrag(x: number): void {
    if (!this.isDragging()) return;

    this.currentX = x;
    const diff = this.currentX - this.startX;
    const baseTranslate = -this.currentIndex() * this.cardWidth();
    this.translateX.set(baseTranslate + diff);
  }

  private endDrag(): void {
    if (!this.isDragging()) return;

    this.isDragging.set(false);
    const diff = this.currentX - this.startX;
    const threshold = this.cardWidth() * 0.25;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.prev();
      } else {
        this.next();
      }
    } else {
      this.updateTranslateX();
    }

    if (this.autoPlay()) {
      this.startAutoPlay();
    }
  }

  private updateCardWidth(): void {
    const container =
      this.elementRef.nativeElement.querySelector(".swipeable-cards");
    if (container) {
      this.cardWidth.set(container.offsetWidth);
    }
  }

  private updateTranslateX(): void {
    this.translateX.set(-this.currentIndex() * this.cardWidth());
  }

  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      this.next();
    }, this.autoPlayInterval());
  }

  private stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }
}
