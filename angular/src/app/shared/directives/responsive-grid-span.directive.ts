import {
  Directive,
  HostBinding,
  input,
  OnDestroy,
  OnInit,
  inject,
  effect,
} from "@angular/core";
import { PlatformService } from "../../core/services/platform.service";

@Directive({
  selector: "[appResponsiveGridSpan]",
  standalone: true,
})
export class ResponsiveGridSpanDirective implements OnInit, OnDestroy {
  private readonly platform = inject(PlatformService);
  private mediaQueryList: MediaQueryList | null = null;
  private readonly onMediaQueryChange = () => this.applySpan();

  desktop = input<string>("span 6");
  tablet = input<string>("span 6");
  mobile = input<string>("span 12");

  @HostBinding("style.grid-column")
  gridColumn = "span 6";

  constructor() {
    effect(() => {
      // Re-apply whenever inputs change
      this.desktop();
      this.tablet();
      this.mobile();
      this.applySpan();
    });
  }

  ngOnInit(): void {
    if (!this.platform.isBrowser) {
      this.gridColumn = this.desktop();
      return;
    }

    this.mediaQueryList = window.matchMedia("(max-width: 1023px)");
    this.mediaQueryList.addEventListener("change", this.onMediaQueryChange);
    window.addEventListener("resize", this.onMediaQueryChange, { passive: true });

    this.applySpan();
  }

  ngOnDestroy(): void {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener("change", this.onMediaQueryChange);
    }

    if (this.platform.isBrowser) {
      window.removeEventListener("resize", this.onMediaQueryChange);
    }
  }

  private applySpan(): void {
    if (!this.platform.isBrowser) {
      this.gridColumn = this.desktop();
      return;
    }

    const width = window.innerWidth;
    if (width <= 767) {
      this.gridColumn = this.mobile();
      return;
    }

    if (width <= 1023) {
      this.gridColumn = this.tablet();
      return;
    }

    this.gridColumn = this.desktop();
  }
}
