import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";

@Component({
  selector: "app-staff-hub",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    MainLayoutComponent,
    PageHeaderComponent,
    CardShellComponent,
  ],
  template: `
    <app-main-layout>
      <div class="staff-hub-page">
        <app-page-header
          title="Staff Hub"
          subtitle="Nutrition, physio, and psychology workflows"
          icon="pi-briefcase"
        ></app-page-header>

        <app-card-shell title="Staff Areas" headerIcon="pi-compass">
          <div class="staff-hub-grid">
            <a routerLink="/staff/nutritionist" class="staff-hub-link">
              <span class="staff-hub-icon">🥗</span>
              <span class="staff-hub-title">Nutritionist</span>
              <span class="staff-hub-subtitle">Plans and fueling</span>
            </a>
            <a routerLink="/staff/physiotherapist" class="staff-hub-link">
              <span class="staff-hub-icon">🩺</span>
              <span class="staff-hub-title">Physiotherapist</span>
              <span class="staff-hub-subtitle">Recovery & rehab</span>
            </a>
            <a routerLink="/staff/psychology" class="staff-hub-link">
              <span class="staff-hub-icon">🧠</span>
              <span class="staff-hub-title">Psychology</span>
              <span class="staff-hub-subtitle">Mental performance</span>
            </a>
            <a routerLink="/staff/decisions" class="staff-hub-link">
              <span class="staff-hub-icon">📌</span>
              <span class="staff-hub-title">Decisions</span>
              <span class="staff-hub-subtitle">Clinical notes</span>
            </a>
          </div>
        </app-card-shell>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./staff-hub.component.scss",
})
export class StaffHubComponent {}
