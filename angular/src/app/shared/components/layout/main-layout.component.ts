import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="dashboard-container">
      <app-sidebar #sidebar></app-sidebar>
      <main class="main-content">
        <app-header (toggleSidebar)="sidebar.toggleSidebar()"></app-header>
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      margin-left: 250px;
    }

    .content-wrapper {
      flex: 1;
      padding: var(--space-6);
      overflow-y: auto;
    }

    @media (max-width: 1024px) {
      .main-content {
        margin-left: 0;
      }
    }

    @media (min-width: 769px) and (max-width: 1024px) {
      .main-content {
        margin-left: 0;
      }
    }
  `]
})
export class MainLayoutComponent {}

