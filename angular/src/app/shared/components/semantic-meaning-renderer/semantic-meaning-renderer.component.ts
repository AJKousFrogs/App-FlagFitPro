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
  ViewChild,
  ComponentRef,
  OnDestroy,
  OnInit,
  effect,
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
  imports: [
    CommonModule,
  ],
  template: `
    <ng-container #renderTarget></ng-container>
  `,
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

  @ViewChild("renderTarget", { read: ViewContainerRef })
  renderTarget!: ViewContainerRef;

  private rendererService = inject(SemanticRendererService);
  private logger = inject(LoggerService);
  private componentRef: ComponentRef<unknown> | null = null;

  // Computed render decision
  renderDecision = computed(() => {
    const metadata: MeaningMetadata = {
      meaning: this.meaning(),
      context: this.context(),
    };
    return this.rendererService.renderMeaning(metadata);
  });

  // Effect to re-render when meaning or context changes
  private renderEffect = effect(() => {
    // Access computed to trigger effect
    this.renderDecision();
    // Render after view is initialized
    setTimeout(() => this.render(), 0);
  });

  ngOnInit(): void {
    // Render the meaning when component initializes
    setTimeout(() => this.render(), 0);
  }

  ngOnDestroy(): void {
    // Clean up component reference
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  private render(): void {
    if (!this.renderTarget) {
      return;
    }

    const decision = this.renderDecision();

    // Clear previous render
    this.renderTarget.clear();
    if (this.componentRef) {
      this.componentRef.destroy();
    }

    // Create component based on render decision
    try {
      let componentClass: any;

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
            decision.component
          );
          return;
      }

      // Create component instance
      this.componentRef = this.renderTarget.createComponent(componentClass);

      // Set component inputs using setInput() for signal input compatibility
      Object.keys(decision.props).forEach((key) => {
        this.componentRef!.setInput(key, decision.props[key]);
      });

      // Trigger change detection
      this.componentRef.changeDetectorRef.markForCheck();
    } catch (error) {
      this.logger.error(
        "[SemanticRenderer] Error rendering meaning:",
        error,
        decision
      );
    }
  }
}

