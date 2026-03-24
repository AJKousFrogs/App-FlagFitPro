import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  contentChildren,
  TemplateRef,
  Directive,
  inject,
} from "@angular/core";
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
  value = input<any>(null);

  panels = contentChildren(AppAccordionPanelDirective);
}
