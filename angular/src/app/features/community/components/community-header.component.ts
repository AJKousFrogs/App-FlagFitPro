import { CommonModule } from "@angular/common";
import { Component, output } from "@angular/core";
import { RouterModule } from "@angular/router";

import { ButtonComponent } from "../../../shared/components/button/button.component";

@Component({
  selector: "app-community-header",
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: "./community-header.component.html",
  styleUrl: "./community-header.component.scss",
})
export class CommunityHeaderComponent {
  readonly createPost = output<void>();
}
