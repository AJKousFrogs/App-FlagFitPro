import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewEncapsulation,
} from "@angular/core";
import { RouterModule } from "@angular/router";
import { Tooltip } from "primeng/tooltip";

import { IconButtonComponent } from "../button/icon-button.component";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { HeaderBreadcrumbsComponent } from "./header-breadcrumbs.component";

@Component({
  selector: "app-header-left",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    Tooltip,
    IconButtonComponent,
    StatusTagComponent,
    HeaderBreadcrumbsComponent,
  ],
  templateUrl: "./header-left.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class HeaderLeftComponent {
  readonly sidebarToggleIcon = input<string>("pi-bars");
  readonly sidebarToggleAriaLabel = input<string>("Open navigation menu");
  readonly showLogo = input<boolean>(true);
  readonly showBreadcrumbs = input<boolean>(false);

  readonly toggleSidebar = output<void>();
}

