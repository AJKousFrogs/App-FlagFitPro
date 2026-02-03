/**
 * Semantic Meaning Renderer Component
 *
 * Phase 3 - Meaning-First Architecture
 *
 * This component automatically renders semantic meanings using the SemanticRendererService.
 *
 * Usage:
 * <app-semantic-meaning-renderer
 *   [meaning]="riskMeaning"
 *   [context]="{ container: 'dashboard', priority: 'high' }">
 * </app-semantic-meaning-renderer>
 *
 * Features NEVER choose components directly.
 * Features choose meanings, and this component renders them.
 */

import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
  ViewContainerRef,
  Type,
  viewChild,
  ComponentRef,
  OnDestroy,
  OnInit,
  effect,
  DestroyRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  SemanticMeaning,
  MeaningMetadata,
} from "../../../core/semantics/semantic-meaning.types";
import { SemanticRendererService } from "../../../core/semantics/semantic-renderer.service";
import { LoggerService } from "../../../core/services/logger.service";

// Import all semantic components
import { RiskBadgeComponent } from "../risk-badge/risk-badge.component";
import { IncompleteDataBadgeComponent } from "../incomplete-data-badge/incomplete-data-badge.component";
import { ActionRequiredBadgeComponent } from "../action-required-badge/action-required-badge.component";
import { ActionPanelComponent } from "../action-panel/action-panel.component";
import { CoachOverrideBadgeComponent } from "../coach-override-badge/coach-override-badge.component";

@Component({
  selector: "app-semantic-meaning-renderer",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: ` <ng-container #renderTarget></ng-container> `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class SemanticMeaningRendererComponent implements OnInit, OnDestroy {
  // Required inputs
  meaning = input.required<SemanticMeaning>();
  context = input.required<MeaningMetadata["context"]>();

  // Angular 21: Use viewChild() signal with { read: ViewContainerRef } to get container ref
  // Note: ng-container doesn't create a real DOM element, so we must explicitly read ViewContainerRef
  renderTarget = viewChild.required("renderTarget", { read: ViewContainerRef });

  private rendererService = inject(SemanticRendererService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);
  private componentRef: ComponentRef<unknown> | null = null;

  // MEMORY SAFETY: Track pending timeouts for cleanup
  private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;

  // Computed render decision
  renderDecision = computed(() => {
    const metadata: MeaningMetadata = {
      meaning: this.meaning(),
      context: this.context(),
    };
    return this.rendererService.renderMeaning(metadata);
  });

  constructor() {
    // MEMORY SAFETY: Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });

    // Effect to re-render when meaning or context changes
    effect(() => {
      // Access computed to trigger effect
      this.renderDecision();
      // MEMORY SAFETY: Clear any pending timeout before setting new one
      this.clearPendingTimeout();
      // Render after view is initialized, but only if not destroyed
      this.pendingTimeoutId = setTimeout(() => {
        if (!this.isDestroyed) {
          this.render();
        }
      }, 0);
    });
  }

  ngOnInit(): void {
    // Render the meaning when component initializes
    // MEMORY SAFETY: Clear any pending timeout before setting new one
    this.clearPendingTimeout();
    this.pendingTimeoutId = setTimeout(() => {
      if (!this.isDestroyed) {
        this.render();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * MEMORY SAFETY: Centralized cleanup method
   */
  private cleanup(): void {
    this.isDestroyed = true;
    this.clearPendingTimeout();

    // Clean up component reference
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }

  /**
   * MEMORY SAFETY: Clear any pending timeout
   */
  private clearPendingTimeout(): void {
    if (this.pendingTimeoutId !== null) {
      clearTimeout(this.pendingTimeoutId);
      this.pendingTimeoutId = null;
    }
  }

  private render(): void {
    const target = this.renderTarget();
    if (!target) {
      return;
    }

    const decision = this.renderDecision();

    // Clear previous render
    if (typeof target.clear === "function") {
      target.clear();
    }
    if (this.componentRef) {
      this.componentRef.destroy();
    }

    // Create component based on render decision
    try {
      let componentClass: Type<unknown>;

      switch (decision.component) {
        case "app-risk-badge":
          componentClass = RiskBadgeComponent;
          break;
        case "app-incomplete-data-badge":
          componentClass = IncompleteDataBadgeComponent;
          break;
        case "app-action-required-badge":
          componentClass = ActionRequiredBadgeComponent;
          break;
        case "app-action-panel":
          componentClass = ActionPanelComponent;
          break;
        case "app-coach-override-badge":
          componentClass = CoachOverrideBadgeComponent;
          break;
        default:
          this.logger.error(
            "[SemanticRenderer] Unknown component:",
            decision.component,
          );
          return;
      }

      // Create component instance

      this.componentRef = target.createComponent(componentClass);

      // Set component inputs using setInput() for signal input compatibility
      if (this.componentRef) {
        Object.keys(decision.props).forEach((key) => {
          this.componentRef?.setInput(key, decision.props[key]);
        });
      }

      // Trigger change detection
      this.componentRef.changeDetectorRef.markForCheck();
    } catch (error) {
      this.logger.error(
        "[SemanticRenderer] Error rendering meaning:",
        error,
        decision,
      );
    }
  }
}
