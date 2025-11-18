import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonModule, InputTextModule],
  template: `
    <div class="top-bar" role="banner">
      <div class="header-left">
        <button
          type="button"
          class="mobile-menu-toggle"
          (click)="onToggleSidebar()"
          aria-label="Toggle navigation menu"
          aria-expanded="false">
          <i class="pi pi-bars"></i>
        </button>
        
        <div class="search-box">
          <label for="global-search" class="sr-only">Search for players, teams and more</label>
          <span class="search-icon" aria-hidden="true">
            <i class="pi pi-search"></i>
          </span>
          <input
            id="global-search"
            type="text"
            pInputText
            [(ngModel)]="searchQuery"
            placeholder="Search..."
            class="search-input"
            aria-label="Search">
        </div>
      </div>

      <div class="header-right">
        <button pButton type="button" icon="pi pi-bell" [text]="true" [rounded]="true" 
                ariaLabel="Notifications" class="header-icon-btn"></button>
        <button pButton type="button" icon="pi pi-user" [text]="true" [rounded]="true"
                [routerLink]="['/profile']" ariaLabel="Profile" class="header-icon-btn"></button>
        <button pButton type="button" label="Logout" icon="pi pi-sign-out" 
                (onClick)="logout()" [text]="true"></button>
      </div>
    </div>
  `,
  styles: [`
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-6);
      background: var(--surface-primary);
      border-bottom: 1px solid var(--p-surface-200);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex: 1;
    }

    .mobile-menu-toggle {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      padding: var(--space-2);
      color: var(--text-primary);
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 400px;
    }

    .search-icon {
      position: absolute;
      left: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
    }

    .search-input {
      width: 100%;
      padding-left: 2.5rem;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .header-icon-btn {
      width: 2.5rem;
      height: 2.5rem;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    @media (max-width: 768px) {
      .mobile-menu-toggle {
        display: block;
      }
    }
  `]
})
export class HeaderComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  
  @Output() toggleSidebar = new EventEmitter<void>();
  searchQuery = signal('');

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}

