import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  inject,
  Signal,
  ComponentRef,
  input,
  Input,
} from "@angular/core";
import { SkeletonLoaderComponent } from "../components/skeleton-loader/skeleton-loader.component";

type SkeletonVariant = "text" | "circle" | "rect" | "card" | "chart" | "table";

/**
 * Structural directive that shows a skeleton loader while content is loading.
 *
 * Usage:
 * ```html
 * <div *appLoadingState="isLoading(); skeleton: 'card'">
 *   <!-- Content shown when not loading -->
 * </div>
 * ```
 *
 * Or with signals:
 * ```html
 * <div *appLoadingState="isLoading; skeleton: 'chart'">
 *   <!-- Content shown when not loading -->
 * </div>
 * ```
 */
@Directive({
  selector: "[appLoadingState]",
  standalone: true,
})
export class LoadingStateDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;
  private skeletonRef: ComponentRef<SkeletonLoaderComponent> | null = null;

  readonly appLoadingStateSkeleton = input<SkeletonVariant>("text");
  readonly appLoadingStateLineCount = input<number>(3);
  readonly appLoadingStateRowCount = input<number>(5);

  @Input()
  set appLoadingState(condition: boolean | Signal<boolean>) {
    const isLoading = typeof condition === "function" ? condition() : condition;

    if (isLoading && !this.skeletonRef) {
      // Show skeleton
      this.viewContainer.clear();
      this.hasView = false;

      this.skeletonRef = this.viewContainer.createComponent(
        SkeletonLoaderComponent,
      );
      // Use setInput for signal inputs
      this.skeletonRef.setInput("variant", this.appLoadingStateSkeleton);
    } else if (!isLoading && !this.hasView) {
      // Show content
      if (this.skeletonRef) {
        this.skeletonRef.destroy();
        this.skeletonRef = null;
      }

      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    }
  }
}
