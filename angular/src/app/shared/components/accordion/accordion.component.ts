import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  contentChildren,
  TemplateRef,
  Directive,
  contentChild,
} from "@angular/core";
import { AccordionModule } from "primeng/accordion";

@Directive({
  selector: "[appAccordionPanel]",
  standalone: true,
})
export class AppAccordionPanelDirective {
  header = input.required<string>();
  value = input.required<string | number>();
  disabled = input(false);
  template = contentChild(TemplateRef);
}

@Component({
  selector: "app-accordion",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AccordionModule],
  template: `
    <p-accordion [multiple]="multiple()" [value]="value()">
      @for (panel of panels(); track panel.value()) {
        <p-accordion-panel [value]="panel.value()" [disabled]="panel.disabled()">
          <p-accordion-header>{{ panel.header() }}</p-accordion-header>
          <p-accordion-content>
            @if (panel.template()) {
              <ng-container [ngTemplateOutlet]="panel.template()!"></ng-container>
            }
          </p-accordion-content>
        </p-accordion-panel>
      }
    </p-accordion>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class AccordionComponent {
  multiple = input(false);
  value = input<any>(null);

  panels = contentChildren(AppAccordionPanelDirective);
}
