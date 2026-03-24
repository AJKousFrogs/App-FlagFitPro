import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  contentChildren,
  TemplateRef,
  Directive,
  inject,
} from "@angular/core";
import { TabsModule } from "primeng/tabs";

@Directive({
  selector: "ng-template[appTabPanel]",
  standalone: true,
})
export class AppTabPanelDirective {
  header = input.required<string>({ alias: "appTabPanelHeader" });
  value = input.required<string | number>({ alias: "appTabPanelValue" });
  icon = input<string>("", { alias: "appTabPanelIcon" });
  disabled = input(false, { alias: "appTabPanelDisabled" });

  public templateRef = inject(TemplateRef);
}

@Component({
  selector: "app-tabs",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TabsModule],
  template: `
    <p-tabs [value]="value()" (valueChange)="onValueChange($event)">
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
            <ng-container [ngTemplateOutlet]="panel.templateRef"></ng-container>
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

  protected onValueChange(value: string | number | undefined): void {
    if (value === undefined) {
      return;
    }

    this.valueChange.emit(value);
  }
}
