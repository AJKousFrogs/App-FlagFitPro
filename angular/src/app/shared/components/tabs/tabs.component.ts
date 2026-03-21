import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  contentChildren,
  TemplateRef,
  Directive,
  contentChild,
} from "@angular/core";
import { TabsModule } from "primeng/tabs";

@Directive({
  selector: "[appTabPanel]",
  standalone: true,
})
export class AppTabPanelDirective {
  header = input.required<string>();
  value = input.required<string | number>();
  icon = input<string>();
  disabled = input(false);
  template = contentChild(TemplateRef);
}

@Component({
  selector: "app-tabs",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TabsModule],
  template: `
    <p-tabs [value]="value()" (valueChange)="valueChange.emit($event)" [styleClass]="styleClass()">
      <p-tablist>
        @for (panel of panels(); track panel.value()) {
          <p-tab [value]="panel.value()" [disabled]="panel.disabled()">
            @if (panel.icon()) {
              <i [class]="'pi ' + panel.icon() + ' mr-2'"></i>
            }
            {{ panel.header() }}
          </p-tab>
        }
      </p-tablist>
      <p-tabpanels>
        @for (panel of panels(); track panel.value()) {
          <p-tabpanel [value]="panel.value()">
            @if (panel.template()) {
              <ng-container [ngTemplateOutlet]="panel.template()!"></ng-container>
            }
          </p-tabpanel>
        }
      </p-tabpanels>
    </p-tabs>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TabsComponent {
  value = input.required<string | number>();
  styleClass = input<string>("");
  valueChange = output<string | number>();

  panels = contentChildren(AppTabPanelDirective);
}
