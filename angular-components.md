# FlagFit Pro - Angular 19 + PrimeNG Component Examples

**Complete Component Library with Design System Integration**

This guide provides production-ready Angular 19 component examples using PrimeNG and the FlagFit Pro design system.

---

## 📋 Table of Contents

1. [Setup & Prerequisites](#setup--prerequisites)
2. [Button Components](#button-components)
3. [Card Components](#card-components)
4. [Form Components](#form-components)
5. [Navigation Components](#navigation-components)
6. [Data Display Components](#data-display-components)
7. [Feedback Components](#feedback-components)
8. [Layout Components](#layout-components)
9. [PrimeNG Integration](#primeng-integration)

---

## 🚀 Setup & Prerequisites

### Install Dependencies

```bash
npm install primeng primeicons @angular/animations
```

### Import Styles

```scss
// styles.scss
@import "./assets/styles/design-tokens.scss";
@import "./assets/styles/component-styles.scss";
@import "primeng/resources/themes/lara-light-green/theme.css";
@import "primeng/resources/primeng.css";
@import "primeicons/primeicons.css";
```

### Configure PrimeNG Theme

```typescript
// app.config.ts
import { provideAnimations } from "@angular/platform-browser/animations";
import { ApplicationConfig } from "@angular/core";

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    // ... other providers
  ],
};
```

---

## 🔘 Button Components

### Primary Button

```typescript
// button-primary.component.ts
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-button-primary",
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="btn btn-primary" [disabled]="disabled" (click)="onClick()">
      <span *ngIf="loading" class="spinner spinner-sm"></span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `,
  ],
})
export class ButtonPrimaryComponent {
  @Input() disabled = false;
  @Input() loading = false;
  @Output() clicked = new EventEmitter<void>();

  onClick() {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
```

### Button Variants

```typescript
// button.component.ts
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-button",
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="buttonClass"
      [disabled]="disabled"
      [type]="type"
      (click)="onClick()"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }
    `,
  ],
})
export class ButtonComponent {
  @Input() variant:
    | "primary"
    | "secondary"
    | "outlined"
    | "text"
    | "danger"
    | "success" = "primary";
  @Input() size: "sm" | "md" | "lg" = "md";
  @Input() disabled = false;
  @Input() type: "button" | "submit" | "reset" = "button";
  @Output() clicked = new EventEmitter<void>();

  get buttonClass(): string {
    const sizeClass = this.size !== "md" ? `btn-${this.size}` : "";
    return `btn btn-${this.variant} ${sizeClass}`.trim();
  }

  onClick() {
    if (!this.disabled) {
      this.clicked.emit();
    }
  }
}
```

**Usage:**

```html
<app-button variant="primary">Save</app-button>
<app-button variant="secondary">Cancel</app-button>
<app-button variant="outlined">Learn More</app-button>
<app-button variant="text">View Details</app-button>
<app-button variant="danger">Delete</app-button>
<app-button variant="success">Approve</app-button>
```

---

## 🃏 Card Components

### Basic Card

```typescript
// card.component.ts
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-card",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClass">
      <div *ngIf="title || subtitle" class="card-header">
        <h3 *ngIf="title" class="card-title">{{ title }}</h3>
        <p *ngIf="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </div>
      <div class="card-body">
        <ng-content></ng-content>
      </div>
      <div *ngIf="hasFooter" class="card-footer">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() variant:
    | "default"
    | "elevated"
    | "outlined"
    | "interactive"
    | "gradient" = "default";
  @Input() hasFooter = false;

  get cardClass(): string {
    return `card card-${this.variant}`;
  }
}
```

**Usage:**

```html
<app-card title="Player Stats" subtitle="Season 2024" variant="elevated">
  <p>Content goes here</p>
  <div footer>
    <app-button variant="primary">View Details</app-button>
  </div>
</app-card>
```

### Interactive Card

```typescript
// card-interactive.component.ts
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-card-interactive",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="card card-interactive"
      [class.selected]="selected"
      (click)="onClick()"
    >
      <div class="card-body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .card.selected {
        border-color: var(--color-brand-primary);
        box-shadow: var(--shadow-focus);
      }
    `,
  ],
})
export class CardInteractiveComponent {
  @Input() selected = false;
  @Output() cardClick = new EventEmitter<void>();

  onClick() {
    this.cardClick.emit();
  }
}
```

---

## 📝 Form Components

### Text Input

```typescript
// input.component.ts
import { Component, Input, forwardRef } from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-input",
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="form-group">
      <label *ngIf="label" [for]="id">{{ label }}</label>
      <input
        [id]="id"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [class.is-invalid]="invalid"
        [class.is-valid]="valid"
        [(ngModel)]="value"
        (blur)="onBlur()"
        (input)="onChange($event)"
        class="form-control"
      />
      <div *ngIf="helpText" class="form-help">{{ helpText }}</div>
      <div *ngIf="errorMessage" class="form-error">{{ errorMessage }}</div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class InputComponent implements ControlValueAccessor {
  @Input() id = `input-${Math.random().toString(36).substr(2, 9)}`;
  @Input() label?: string;
  @Input() type: string = "text";
  @Input() placeholder?: string;
  @Input() helpText?: string;
  @Input() errorMessage?: string;
  @Input() disabled = false;
  @Input() invalid = false;
  @Input() valid = false;

  value: string = "";
  private onChangeFn = (value: string) => {};
  private onTouchedFn = () => {};

  onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChangeFn(this.value);
  }

  onBlur() {
    this.onTouchedFn();
  }

  writeValue(value: string): void {
    this.value = value || "";
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
```

**Usage:**

```html
<app-input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  [(ngModel)]="email"
  [invalid]="emailInvalid"
  errorMessage="Please enter a valid email"
>
</app-input>
```

### Select Dropdown

```typescript
// select.component.ts
import { Component, Input, forwardRef } from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";

interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

@Component({
  selector: "app-select",
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="form-group">
      <label *ngIf="label" [for]="id">{{ label }}</label>
      <select
        [id]="id"
        [disabled]="disabled"
        [class.is-invalid]="invalid"
        [(ngModel)]="value"
        (change)="onChange($event)"
        (blur)="onBlur()"
        class="form-control"
      >
        <option [value]="null" disabled>{{ placeholder }}</option>
        <option
          *ngFor="let option of options"
          [value]="option.value"
          [disabled]="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
      <div *ngIf="errorMessage" class="form-error">{{ errorMessage }}</div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class SelectComponent implements ControlValueAccessor {
  @Input() id = `select-${Math.random().toString(36).substr(2, 9)}`;
  @Input() label?: string;
  @Input() placeholder = "Select an option";
  @Input() options: SelectOption[] = [];
  @Input() errorMessage?: string;
  @Input() disabled = false;
  @Input() invalid = false;

  value: any = null;
  private onChangeFn = (value: any) => {};
  private onTouchedFn = () => {};

  onChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChangeFn(this.value);
  }

  onBlur() {
    this.onTouchedFn();
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
```

**Usage:**

```typescript
// component.ts
positions = [
  { label: "Quarterback", value: "qb" },
  { label: "Wide Receiver", value: "wr" },
  { label: "Running Back", value: "rb" },
];
```

```html
<app-select
  label="Position"
  placeholder="Select position"
  [options]="positions"
  [(ngModel)]="selectedPosition"
>
</app-select>
```

---

## 🧭 Navigation Components

### Header Component

```typescript
// header.component.ts
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

interface NavItem {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-container">
        <a routerLink="/" class="header-logo"> FlagFit Pro </a>
        <nav class="header-nav">
          <a
            *ngFor="let item of navItems"
            [routerLink]="item.route"
            routerLinkActive="active"
            class="header-nav-link"
          >
            {{ item.label }}
          </a>
        </nav>
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class HeaderComponent {
  navItems: NavItem[] = [
    { label: "Dashboard", route: "/dashboard" },
    { label: "Training", route: "/training" },
    { label: "Analytics", route: "/analytics" },
    { label: "Roster", route: "/roster" },
  ];
}
```

### Sidebar Component

```typescript
// sidebar.component.ts
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

interface SidebarItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>FlagFit Pro</h2>
      </div>
      <nav class="sidebar-nav">
        <a
          *ngFor="let item of items"
          [routerLink]="item.route"
          routerLinkActive="active"
          class="sidebar-nav-item"
        >
          <i [class]="item.icon" class="sidebar-nav-icon"></i>
          <span>{{ item.label }}</span>
        </a>
      </nav>
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class SidebarComponent {
  @Input() items: SidebarItem[] = [];
}
```

---

## 📊 Data Display Components

### Table Component

```typescript
// table.component.ts
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

@Component({
  selector: "app-table",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <table
        class="table"
        [class.table-striped]="striped"
        [class.table-bordered]="bordered"
      >
        <thead>
          <tr>
            <th
              *ngFor="let column of columns"
              [class.sortable]="column.sortable"
              [class.sort-asc]="
                sortColumn === column.key && sortDirection === 'asc'
              "
              [class.sort-desc]="
                sortColumn === column.key && sortDirection === 'desc'
              "
              (click)="onSort(column)"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of sortedData">
            <td *ngFor="let column of columns">
              {{ row[column.key] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() striped = false;
  @Input() bordered = false;

  sortColumn: string | null = null;
  sortDirection: "asc" | "desc" = "asc";

  get sortedData(): any[] {
    if (!this.sortColumn) {
      return this.data;
    }

    return [...this.data].sort((a, b) => {
      const aVal = a[this.sortColumn!];
      const bVal = b[this.sortColumn!];

      if (aVal < bVal) {
        return this.sortDirection === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return this.sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }

  onSort(column: TableColumn) {
    if (!column.sortable) {
      return;
    }

    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortColumn = column.key;
      this.sortDirection = "asc";
    }
  }
}
```

**Usage:**

```typescript
columns = [
  { key: "name", label: "Player Name", sortable: true },
  { key: "position", label: "Position", sortable: true },
  { key: "stats", label: "Stats", sortable: false },
];

players = [
  { name: "John Doe", position: "QB", stats: "85%" },
  { name: "Jane Smith", position: "WR", stats: "92%" },
];
```

```html
<app-table [columns]="columns" [data]="players" [striped]="true"> </app-table>
```

---

## 💬 Feedback Components

### Alert Component

```typescript
// alert.component.ts
import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-alert",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="alertClass" *ngIf="show">
      <div class="alert-content">
        <h4 *ngIf="title" class="alert-title">{{ title }}</h4>
        <p class="alert-message">
          <ng-content></ng-content>
        </p>
      </div>
      <button *ngIf="dismissible" class="alert-close" (click)="dismiss()">
        ×
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class AlertComponent {
  @Input() type: "success" | "warning" | "error" | "info" = "info";
  @Input() title?: string;
  @Input() dismissible = false;
  show = true;

  get alertClass(): string {
    return `alert alert-${this.type}`;
  }

  dismiss() {
    this.show = false;
  }
}
```

**Usage:**

```html
<app-alert type="success" title="Success!">
  Your changes have been saved.
</app-alert>

<app-alert type="error" title="Error" [dismissible]="true">
  Something went wrong. Please try again.
</app-alert>
```

---

## 🎨 PrimeNG Integration

### PrimeNG Button with Design System

```typescript
// primeng-button.component.ts
import { Component } from "@angular/core";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-primeng-button",
  standalone: true,
  imports: [ButtonModule],
  template: `
    <p-button label="Save" icon="pi pi-check" styleClass="btn btn-primary">
    </p-button>
  `,
  styles: [
    `
      :host ::ng-deep .p-button {
        background-color: var(--color-brand-primary);
        border-color: var(--color-brand-primary);
        color: var(--color-text-on-primary);
      }

      :host ::ng-deep .p-button:hover {
        background-color: var(--color-brand-primary-hover);
        border-color: var(--color-brand-primary-hover);
      }
    `,
  ],
})
export class PrimeNGButtonComponent {}
```

### PrimeNG Card with Design System

```typescript
// primeng-card.component.ts
import { Component } from "@angular/core";
import { CardModule } from "primeng/card";

@Component({
  selector: "app-primeng-card",
  standalone: true,
  imports: [CardModule],
  template: `
    <p-card
      header="Player Stats"
      subheader="Season 2024"
      styleClass="card card-elevated"
    >
      <p>Content goes here</p>
    </p-card>
  `,
  styles: [
    `
      :host ::ng-deep .p-card {
        background-color: var(--surface-primary);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
      }

      :host ::ng-deep .p-card-header {
        background-color: var(--surface-secondary);
        border-bottom: 1px solid var(--color-border-primary);
      }
    `,
  ],
})
export class PrimeNGCardComponent {}
```

---

## 📚 Complete Example: Player Dashboard

```typescript
// player-dashboard.component.ts
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardComponent } from "./card.component";
import { ButtonComponent } from "./button.component";
import { TableComponent } from "./table.component";
import { AlertComponent } from "./alert.component";

@Component({
  selector: "app-player-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    TableComponent,
    AlertComponent,
  ],
  template: `
    <div class="container">
      <h1>Player Dashboard</h1>

      <app-alert
        *ngIf="showSuccess"
        type="success"
        title="Success!"
        [dismissible]="true"
        (dismiss)="showSuccess = false"
      >
        Player data updated successfully.
      </app-alert>

      <div class="grid grid-cols-3">
        <app-card title="Total Players" variant="elevated">
          <h2 class="text-3xl font-bold">{{ totalPlayers }}</h2>
        </app-card>

        <app-card title="Active Training" variant="elevated">
          <h2 class="text-3xl font-bold">{{ activeTraining }}</h2>
        </app-card>

        <app-card title="Upcoming Games" variant="elevated">
          <h2 class="text-3xl font-bold">{{ upcomingGames }}</h2>
        </app-card>
      </div>

      <app-card title="Recent Players" variant="outlined">
        <app-table [columns]="columns" [data]="players" [striped]="true">
        </app-table>

        <div footer>
          <app-button variant="primary" (clicked)="loadMore()">
            Load More
          </app-button>
        </div>
      </app-card>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: var(--space-6);
      }
    `,
  ],
})
export class PlayerDashboardComponent {
  showSuccess = false;
  totalPlayers = 24;
  activeTraining = 8;
  upcomingGames = 3;

  columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "position", label: "Position", sortable: true },
    { key: "stats", label: "Stats", sortable: false },
  ];

  players = [
    { name: "John Doe", position: "QB", stats: "85%" },
    { name: "Jane Smith", position: "WR", stats: "92%" },
  ];

  loadMore() {
    // Load more players
    this.showSuccess = true;
  }
}
```

---

## ✅ Best Practices

1. **Always use design tokens** - Never hardcode colors or spacing
2. **Follow component patterns** - Use provided examples as templates
3. **Test accessibility** - Ensure WCAG AA compliance
4. **Responsive design** - Use grid utilities for layouts
5. **Dark mode support** - Test in both light and dark themes

---

## 🎉 Complete!

You now have a complete Angular 19 + PrimeNG component library integrated with the FlagFit Pro design system!
