import {
  ChangeDetectionStrategy,
  Component,
  input,
  contentChildren,
  TemplateRef,
  Directive,
  inject,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { AccordionModule } from "primeng/accordion";

@Directive({
  selector: "ng-template[appAccordionPanel]",
  standalone: true,
})
export class AppAccordionPanelDirective {
  header = input.required<string>();
  value = input.required<string | number>();
  disabled = input(false);

  public templateRef = inject(TemplateRef);
}

type AccordionValue = string | number;
type AccordionModelValue = AccordionValue | string[] | number[] | null;

@Component({
  selector: "app-accordion",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccordionModule, NgTemplateOutlet],
  template: `
    <p-accordion [multiple]="multiple()" [value]="value()">
      @for (panel of panels(); track panel.value()) {
        <p-accordion-panel [value]="panel.value()" [disabled]="panel.disabled()">
          <p-accordion-header>{{ panel.header() }}</p-accordion-header>
          <p-accordion-content>
            <ng-container [ngTemplateOutlet]="panel.templateRef"></ng-container>
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
  value = input<AccordionModelValue>(null);

  panels = contentChildren(AppAccordionPanelDirective);
}
