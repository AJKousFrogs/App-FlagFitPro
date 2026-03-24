import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  contentChild,
  TemplateRef
} from "@angular/core";
import { MenuItem } from "primeng/api";
import { MenubarModule } from "primeng/menubar";

@Component({
  selector: "app-menubar",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MenubarModule],
  template: `
    <p-menubar [model]="model()" [styleClass]="styleClass()">
      <ng-template pTemplate="start">
         <ng-content select="[start]"></ng-content>
      </ng-template>
      <ng-template pTemplate="end">
         <ng-content select="[end]"></ng-content>
      </ng-template>
      <ng-template pTemplate="item" let-item let-root="root">
        @if (itemTemplate()) {
             <ng-container *ngTemplateOutlet="itemTemplate()!; context: { $implicit: item, root: root }"></ng-container>
        } @else {
            <a [attr.href]="item.url" [class]="item.icon" [target]="item.target" [tabindex]="0" class="p-menuitem-link">
                <span [class]="item.icon"></span>
                <span class="p-menuitem-text">{{ item.label }}</span>
                @if (item.items) {
                    <span class="pi pi-angle-down ml-auto"></span>
                }
            </a>
        }
      </ng-template>
    </p-menubar>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MenubarComponent {
  model = input.required<MenuItem[]>();
  styleClass = input<string>("");

  itemTemplate = contentChild<TemplateRef<{ $implicit: MenuItem; root: boolean }>>("item");
}
