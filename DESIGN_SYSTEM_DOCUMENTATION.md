# FlagFit Pro - Comprehensive Design System Documentation
*Updated: December 2025 - Version 7.0 - Angular 19 + PrimeNG Edition*

## Table of Contents

1. [Overview](#overview)
2. [Angular 19 Setup & Prerequisites](#angular-19-setup--prerequisites)
3. [Design Principles](#design-principles)
4. [Design Token Architecture](#design-token-architecture)
5. [Typography System](#typography-system)
6. [Color System](#color-system)
7. [Spacing & Layout](#spacing--layout)
8. [Component Library](#component-library)
9. [Component Composition Patterns](#component-composition-patterns)
10. [Icon System](#icon-system)
11. [Motion & Animation](#motion--animation)
12. [Accessibility](#accessibility)
13. [Component Testing Guidelines](#component-testing-guidelines)
14. [Error Handling & Validation](#error-handling--validation)
15. [Implementation Guide](#implementation-guide)
16. [Performance Guidelines](#performance-guidelines)
17. [Versioning & Changelog](#versioning--changelog)
18. [Governance](#governance)
19. [Browser Compatibility Matrix](#browser-compatibility-matrix)
20. [Writing Guidelines](#writing-guidelines)
21. [Advanced Dashboard Components](#advanced-dashboard-components)
22. [AI/ML Interface Components](#aiml-interface-components)
23. [Enhanced Visualization Patterns](#enhanced-visualization-patterns)
24. [Roadmap](#roadmap)

## Overview

The FlagFit Pro Design System is a comprehensive, semantic token-based design framework built for Olympic-level flag football training applications using **Angular 19** and **PrimeNG**. It provides a scalable, accessible, and maintainable foundation for creating consistent user experiences across all touchpoints.

### Key Features

- **Angular 19 Framework**: Built on Angular 19 with standalone components, signals, and modern Angular patterns
- **PrimeNG Component Library**: Production-ready UI components with comprehensive theming support
- **Semantic Token Architecture**: Two-tier system with primitive and semantic tokens via CSS custom properties
- **Complete Component Library**: 25+ production-ready components with multiple variants
- **AI/ML Interface Components**: Advanced AI prediction panels and confidence indicators
- **Wellness Dashboard System**: Health tracking with progress visualization
- **Enhanced Training Modules**: Position-specific QB/DB training with ML recommendations
- **Advanced Chart Integration**: PrimeNG Charts with real-time data visualization
- **Flexible Layout System**: Angular Flex Layout and CSS Grid for responsive layouts
- **Accessibility-First**: WCAG 2.1 AA compliant with comprehensive accessibility features
- **Theme System**: PrimeNG theming with custom green theme palette
- **PrimeIcons**: Icon library integrated with PrimeNG components
- **Responsive Design**: Comprehensive mobile, tablet, and desktop breakpoints
- **Performance Optimized**: Angular's built-in optimizations with OnPush change detection

### Technology Stack

- **Framework**: Angular 19 (Standalone Components)
- **UI Library**: PrimeNG 19+
- **Icons**: PrimeIcons + Lucide Angular
- **Charts**: PrimeNG Charts (Chart.js wrapper)
- **Forms**: Angular Reactive Forms
- **State Management**: Angular Signals + RxJS
- **Styling**: SCSS with CSS Custom Properties
- **Build**: Angular CLI with ESBuild

## Angular 19 Setup & Prerequisites

### Installation

```bash
# Install Angular CLI globally
npm install -g @angular/cli@19

# Create new Angular project
ng new flagfit-pro --routing --style=scss --standalone

# Install PrimeNG and dependencies
cd flagfit-pro
ng add primeng
npm install primeicons @angular/animations
npm install chart.js primeicons
```

### Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   ├── guards/
│   │   └── interceptors/
│   ├── shared/
│   │   ├── components/
│   │   ├── directives/
│   │   ├── pipes/
│   │   └── models/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── training/
│   │   └── analytics/
│   └── app.config.ts
├── assets/
│   ├── styles/
│   │   ├── _variables.scss
│   │   ├── _tokens.scss
│   │   └── _theme.scss
│   └── themes/
│       └── flagfit-green/
│           └── theme.scss
└── styles.scss
```

### App Configuration

```typescript
// app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([]))
  ]
};
```

### PrimeNG Theme Setup

```scss
// styles.scss
@import "primeng/resources/themes/lara-light-green/theme.css";
@import "primeng/resources/primeng.css";
@import "primeicons/primeicons.css";

// Custom theme overrides
@import "./assets/styles/_theme.scss";
```

## Design Principles

Our design system is built on four foundational principles:

### 1. **Clarity & Simplicity**

- Information hierarchy is immediately apparent
- Visual noise is minimized to focus on essential content
- Complex data is broken down into digestible components

### 2. **Accessibility & Inclusion**

- Meets WCAG 2.1 AA standards across all components
- Supports assistive technologies and diverse user needs
- Color-blind friendly with redundant indicators
- PrimeNG components include built-in accessibility features

### 3. **Athletic Performance Focus**

- Data visualization emphasizes performance metrics
- Quick recognition of status and progress indicators
- Optimized for rapid decision-making during training

### 4. **Scalable Architecture**

- Component-based approach enables rapid development
- Semantic tokens allow global theming changes
- Modular system grows with product needs
- Angular's standalone components for better tree-shaking

## Design Token Architecture

Our token system uses a two-tier architecture for maximum flexibility and maintainability, integrated with PrimeNG's theming system.

### Primitive Tokens (Global Values)

```scss
// assets/styles/_tokens.scss

/* Color Primitives - Green Theme */
:root {
  --primitive-primary-500: #10c96b;
  --primitive-primary-600: #0ab85a;
  --primitive-primary-700: #089949;
  --primitive-secondary-500: #89c300;
  --primitive-tertiary-500: #cc9610;
  --primitive-neutral-300: #d0d0d0;

  /* Typography Primitives */
  --primitive-font-size-16: 1rem;
  --primitive-font-weight-600: 600;

  /* Spacing Primitives (8-point grid) */
  --primitive-space-16: 1rem;
  --primitive-space-24: 1.5rem;
}
```

### Semantic Tokens (Contextual Values)

```scss
// assets/styles/_variables.scss

:root {
  /* Brand Colors - Green/White Theme */
  --color-brand-primary: #089949;
  --color-brand-primary-hover: #036d35;
  --color-brand-secondary: #10c96b;
  --color-brand-light: #d0f0eb;

  /* Surface Colors */
  --surface-primary: #ffffff;
  --surface-secondary: #f8faf9;
  --surface-dark: #1a1a1a;

  /* Text Colors */
  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --text-on-green: #ffffff;
  --text-on-white: #089949;

  /* Status Colors */
  --color-success: #f1c40f;
  --color-warning: #ef4444;
  --color-info: #089949;

  /* Interactive Colors */
  --color-interactive-primary: var(--color-brand-primary);
  --color-interactive-secondary: var(--color-brand-secondary);
  --color-interactive-disabled: #d0d0d0;
}
```

### PrimeNG Theme Integration

```scss
// assets/themes/flagfit-green/theme.scss

// Override PrimeNG theme variables
:root {
  --p-primary-color: #089949;
  --p-primary-color-text: #ffffff;
  --p-primary-50: #f0f9f7;
  --p-primary-100: #d0f0eb;
  --p-primary-200: #a0e4d7;
  --p-primary-300: #70d8c3;
  --p-primary-400: #40ccaf;
  --p-primary-500: #10c96b;
  --p-primary-600: #0ab85a;
  --p-primary-700: #089949;
  --p-primary-800: #067a3c;
  --p-primary-900: #036d35;

  --p-surface-0: #ffffff;
  --p-surface-50: #f8faf9;
  --p-surface-100: #f0f0f0;
  --p-surface-200: #e5e5e5;
  --p-surface-300: #d4d4d4;
  --p-surface-400: #a3a3a3;
  --p-surface-500: #737373;
  --p-surface-600: #404040;
  --p-surface-700: #262626;
  --p-surface-800: #171717;
  --p-surface-900: #0a0a0a;

  --p-text-color: #1a1a1a;
  --p-text-color-secondary: #4a4a4a;
  --p-border-radius: 0.5rem;
  --p-focus-ring: 0 0 0 0.2rem rgba(8, 153, 73, 0.2);
}
```

### Design Tokens TypeScript Export

```typescript
// src/app/shared/models/design-tokens.ts

export const designTokens = {
  colors: {
    brand: {
      primary: {
        50: "#f0f9f7",
        100: "#d0f0eb",
        200: "#a0e4d7",
        300: "#70d8c3",
        400: "#40ccaf",
        500: "#10c96b",
        600: "#0ab85a",
        700: "#089949",
        800: "#067a3c",
        900: "#036d35",
      },
      white: {
        pure: "#ffffff",
        soft: "#f8faf9",
      },
      text: {
        primary: "#1a1a1a",
        secondary: "#4a4a4a",
        onGreen: "#ffffff",
        onWhite: "#089949",
      },
    },
    status: {
      success: {
        50: "#fefce8",
        100: "#fef3c7",
        500: "#f1c40f",
        600: "#d4a617",
        700: "#b7941f",
      },
      warning: {
        50: "#fef2f2",
        100: "#fee2e2",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
      },
      info: {
        50: "#f0f9f7",
        100: "#d0f0eb",
        500: "#089949",
        600: "#067a3c",
        700: "#036d35",
      },
    },
  },
  spacing: {
    0: "0",
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
  },
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      display: "'Poppins', 'Inter', sans-serif",
      mono: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
    },
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
      "6xl": "3.75rem", // 60px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  borderRadius: {
    none: "0",
    sm: "0.125rem", // 2px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    "3xl": "1.5rem", // 24px
    full: "9999px",
  },
} as const;

export type DesignTokens = typeof designTokens;
```

## Typography System

### Font Families

- **Primary**: `'Poppins'` - Used for all text elements including UI text, headings, and body content
- **Monospace**: `'SF Mono'` - Code snippets and data tables

### Typography Scale

```scss
// assets/styles/_typography.scss

:root {
  --font-display-2xl: 4.5rem; // 72px
  --font-display-xl: 3.75rem; // 60px
  --font-heading-2xl: 2.5rem; // 40px
  --font-heading-xl: 1.875rem; // 30px
  --font-heading-lg: 1.5rem; // 24px
  --font-heading-md: 1.25rem; // 20px
  --font-body-lg: 1.125rem; // 18px
  --font-body-md: 1rem; // 16px
  --font-body-sm: 0.875rem; // 14px
  --font-caption: 0.75rem; // 12px
}

h1 {
  font-family: 'Poppins', sans-serif;
  font-size: var(--font-heading-2xl);
  line-height: 1.0;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 0;
  margin-bottom: var(--space-6);
}

h2 {
  font-family: 'Poppins', sans-serif;
  font-size: var(--font-heading-xl);
  line-height: 1.25;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 0;
  margin-bottom: var(--space-4);
}

h3 {
  font-family: 'Poppins', sans-serif;
  font-size: var(--font-heading-lg);
  line-height: 1.25;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 0;
  margin-bottom: var(--space-3);
}

h4 {
  font-family: 'Poppins', sans-serif;
  font-size: var(--font-heading-md);
  line-height: 1.375;
  font-weight: 500;
  color: var(--text-primary);
  margin-top: 0;
  margin-bottom: var(--space-3);
}

h5 {
  font-family: 'Poppins', sans-serif;
  font-size: var(--font-body-lg);
  line-height: 1.625;
  font-weight: 500;
  color: var(--text-primary);
  margin-top: 0;
  margin-bottom: var(--space-2);
}

h6 {
  font-family: 'Poppins', sans-serif;
  font-size: var(--font-body-md);
  line-height: 1.5;
  font-weight: 500;
  color: var(--text-primary);
  margin-top: 0;
  margin-bottom: var(--space-2);
}
```

### Angular Typography Component

```typescript
// src/app/shared/components/typography/typography.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-heading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 *ngIf="level === 1" [class]="classes">
      <ng-content></ng-content>
    </h1>
    <h2 *ngIf="level === 2" [class]="classes">
      <ng-content></ng-content>
    </h2>
    <h3 *ngIf="level === 3" [class]="classes">
      <ng-content></ng-content>
    </h3>
    <h4 *ngIf="level === 4" [class]="classes">
      <ng-content></ng-content>
    </h4>
    <h5 *ngIf="level === 5" [class]="classes">
      <ng-content></ng-content>
    </h5>
    <h6 *ngIf="level === 6" [class]="classes">
      <ng-content></ng-content>
    </h6>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class HeadingComponent {
  @Input() level: 1 | 2 | 3 | 4 | 5 | 6 = 1;
  @Input() size?: 'display-2xl' | 'display-xl' | 'heading-2xl' | 'heading-xl' | 'heading-lg' | 'heading-md';

  get classes(): string {
    const sizeClass = this.size ? `text-${this.size}` : '';
    return sizeClass;
  }
}
```

**Usage:**

```html
<app-heading level="1" size="heading-2xl">Performance Analytics</app-heading>
<app-heading level="2" size="heading-lg">Training Progress</app-heading>
```

## Color System

### Color Philosophy

The FlagFit Pro design system uses a green-based color palette that reflects athletic energy and growth. Colors are semantic, meaning they communicate meaning beyond aesthetics.

### Primary Palette - Green Theme

```scss
// assets/styles/_colors.scss

:root {
  /* Brand Colors */
  --color-brand-primary: #089949;
  --color-brand-primary-hover: #036d35;
  --color-brand-secondary: #10c96b;
  --color-brand-light: #d0f0eb;

  /* Status Colors */
  --color-success: #f1c40f;
  --color-warning: #ef4444;
  --color-info: #089949;
  --color-error: #ef4444;
}
```

### PrimeNG Color Integration

PrimeNG components automatically use the theme colors defined in the theme file. Customize via CSS variables:

```scss
:root {
  --p-primary-color: #089949;
  --p-primary-color-text: #ffffff;
  --p-success-color: #f1c40f;
  --p-warning-color: #ef4444;
  --p-danger-color: #ef4444;
  --p-info-color: #089949;
}
```

## Spacing & Layout

### Spacing Scale System

The design system uses an 8-point grid system for consistent spacing:

```scss
:root {
  --space-1: 0.25rem; // 4px
  --space-2: 0.5rem; // 8px
  --space-3: 0.75rem; // 12px
  --space-4: 1rem; // 16px
  --space-5: 1.25rem; // 20px
  --space-6: 1.5rem; // 24px
  --space-8: 2rem; // 32px
  --space-10: 2.5rem; // 40px
  --space-12: 3rem; // 48px
  --space-16: 4rem; // 64px
}
```

### Angular Flex Layout

```typescript
// Using Angular Flex Layout or CSS Grid
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-grid">
      <div class="grid-item" *ngFor="let item of items">
        <p-card>
          <ng-template pTemplate="header">
            <h3>{{ item.title }}</h3>
          </ng-template>
          <p>{{ item.content }}</p>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--space-6);
      padding: var(--space-6);
    }
  `]
})
export class DashboardLayoutComponent {
  items = [
    { title: 'Card 1', content: 'Content 1' },
    { title: 'Card 2', content: 'Content 2' },
  ];
}
```

## Component Library

### Button System

**Status**: ✅ **Stable** - Using PrimeNG Button Component

PrimeNG provides comprehensive button components with multiple variants and sizes.

#### Component API

```typescript
// PrimeNG Button Properties
interface ButtonProps {
  label?: string;
  icon?: string;
  iconPos?: 'left' | 'right' | 'top' | 'bottom';
  loading?: boolean;
  loadingIcon?: string;
  disabled?: boolean;
  severity?: 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help';
  size?: 'small' | 'large';
  rounded?: boolean;
  raised?: boolean;
  text?: boolean;
  outlined?: boolean;
  link?: boolean;
  plain?: boolean;
}
```

#### Usage Examples

```html
<!-- Primary Button -->
<p-button label="Start Training" icon="pi pi-play" (onClick)="startTraining()"></p-button>

<!-- Secondary Button -->
<p-button label="View Stats" severity="secondary" icon="pi pi-chart-bar"></p-button>

<!-- Outlined Button -->
<p-button label="Learn More" [outlined]="true" icon="pi pi-info-circle"></p-button>

<!-- Text Button -->
<p-button label="Cancel" [text]="true" icon="pi pi-times"></p-button>

<!-- Loading State -->
<p-button label="Saving..." [loading]="isSaving" [disabled]="true"></p-button>

<!-- Custom Sizes -->
<p-button label="Small" size="small"></p-button>
<p-button label="Large" size="large"></p-button>

<!-- Icon Only -->
<p-button icon="pi pi-check" [rounded]="true" [text]="true" 
          ariaLabel="Confirm"></p-button>
```

#### Angular Component Example

```typescript
// src/app/shared/components/button/button.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [ButtonModule, CommonModule],
  template: `
    <p-button
      [label]="label"
      [icon]="icon"
      [iconPos]="iconPos"
      [loading]="loading"
      [disabled]="disabled"
      [severity]="severity"
      [size]="size"
      [outlined]="outlined"
      [text]="text"
      [rounded]="rounded"
      (onClick)="handleClick($event)">
      <ng-content></ng-content>
    </p-button>
  `
})
export class AppButtonComponent {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() iconPos: 'left' | 'right' | 'top' | 'bottom' = 'left';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() severity?: 'secondary' | 'success' | 'info' | 'warn' | 'danger';
  @Input() size?: 'small' | 'large';
  @Input() outlined = false;
  @Input() text = false;
  @Input() rounded = false;
  @Output() onClick = new EventEmitter<Event>();

  handleClick(event: Event): void {
    this.onClick.emit(event);
  }
}
```

### Form Components

**Status**: ✅ **Stable** - Using PrimeNG Form Components

PrimeNG provides comprehensive form components with built-in validation.

#### InputText Component

```html
<!-- Basic Input -->
<div class="p-field">
  <label for="email" class="p-label">Email Address</label>
  <input 
    id="email" 
    type="text" 
    pInputText 
    [(ngModel)]="email"
    class="p-inputtext-lg"
    [class.ng-invalid]="emailForm.get('email')?.invalid && emailForm.get('email')?.touched">
  <small class="p-error" *ngIf="emailForm.get('email')?.invalid && emailForm.get('email')?.touched">
    Please enter a valid email address
  </small>
</div>

<!-- With Icon -->
<span class="p-input-icon-left">
  <i class="pi pi-search"></i>
  <input type="text" pInputText placeholder="Search" [(ngModel)]="searchText">
</span>
```

#### Dropdown Component

```html
<p-dropdown
  [options]="athletes"
  [(ngModel)]="selectedAthlete"
  optionLabel="name"
  optionValue="id"
  placeholder="Select an athlete"
  [showClear]="true"
  [filter]="true"
  filterBy="name"
  [loading]="loading">
</p-dropdown>
```

```typescript
// Component TypeScript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';

interface Athlete {
  id: number;
  name: string;
  position: string;
}

@Component({
  selector: 'app-athlete-selector',
  standalone: true,
  imports: [FormsModule, DropdownModule, InputTextModule],
  template: `
    <p-dropdown
      [options]="athletes"
      [(ngModel)]="selectedAthlete"
      optionLabel="name"
      placeholder="Select an athlete"
      [filter]="true">
    </p-dropdown>
  `
})
export class AthleteSelectorComponent {
  selectedAthlete: Athlete | null = null;
  athletes: Athlete[] = [
    { id: 1, name: 'John Smith', position: 'QB' },
    { id: 2, name: 'Sarah Johnson', position: 'WR' },
    { id: 3, name: 'Mike Davis', position: 'DB' }
  ];
}
```

#### Calendar Component (Date Picker)

```html
<p-calendar
  [(ngModel)]="trainingDate"
  [minDate]="today"
  [showIcon]="true"
  dateFormat="mm/dd/yy"
  placeholder="Select training date"
  [showButtonBar]="true">
</p-calendar>
```

#### MultiSelect Component

```html
<p-multiSelect
  [options]="positions"
  [(ngModel)]="selectedPositions"
  optionLabel="label"
  placeholder="Select positions"
  [showClear]="true"
  [filter]="true">
</p-multiSelect>
```

#### Reactive Forms Example

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-training-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    ButtonModule
  ],
  template: `
    <form [formGroup]="trainingForm" (ngSubmit)="onSubmit()">
      <div class="p-field">
        <label for="sessionName" class="p-label required">Session Name</label>
        <input 
          id="sessionName"
          type="text"
          pInputText
          formControlName="sessionName"
          [class.ng-invalid]="isFieldInvalid('sessionName')">
        <small class="p-error" *ngIf="isFieldInvalid('sessionName')">
          {{ getFieldError('sessionName') }}
        </small>
      </div>

      <div class="p-field">
        <label for="trainingDate" class="p-label required">Training Date</label>
        <p-calendar
          id="trainingDate"
          formControlName="trainingDate"
          [minDate]="today"
          [showIcon]="true"
          dateFormat="mm/dd/yy">
        </p-calendar>
        <small class="p-error" *ngIf="isFieldInvalid('trainingDate')">
          {{ getFieldError('trainingDate') }}
        </small>
      </div>

      <div class="p-field">
        <label for="athlete" class="p-label required">Select Athlete</label>
        <p-dropdown
          id="athlete"
          [options]="athletes"
          formControlName="athlete"
          optionLabel="name"
          placeholder="Select an athlete">
        </p-dropdown>
        <small class="p-error" *ngIf="isFieldInvalid('athlete')">
          {{ getFieldError('athlete') }}
        </small>
      </div>

      <p-button 
        type="submit" 
        label="Create Session"
        [disabled]="trainingForm.invalid"
        [loading]="isSubmitting">
      </p-button>
    </form>
  `
})
export class TrainingFormComponent {
  trainingForm: FormGroup;
  today = new Date();
  athletes = [
    { id: 1, name: 'John Smith' },
    { id: 2, name: 'Sarah Johnson' }
  ];
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.trainingForm = this.fb.group({
      sessionName: ['', [Validators.required, Validators.minLength(3)]],
      trainingDate: [null, Validators.required],
      athlete: [null, Validators.required]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.trainingForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.trainingForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field?.hasError('minlength')) {
      return `${fieldName} must be at least ${field.errors?.['minlength'].requiredLength} characters`;
    }
    return '';
  }

  onSubmit(): void {
    if (this.trainingForm.valid) {
      this.isSubmitting = true;
      // Submit logic
      console.log(this.trainingForm.value);
    }
  }
}
```

### Card System

**Status**: ✅ **Stable** - Using PrimeNG Card Component

```html
<p-card>
  <ng-template pTemplate="header">
    <img alt="Card" src="assets/images/card-header.jpg">
  </ng-template>
  <p>Card content goes here</p>
  <ng-template pTemplate="footer">
    <p-button label="Save" icon="pi pi-check"></p-button>
    <p-button label="Cancel" icon="pi pi-times" [text]="true"></p-button>
  </ng-template>
</p-card>
```

### Modal System

**Status**: ✅ **Stable** - Using PrimeNG Dialog Component

```html
<p-button (click)="showDialog()" label="Show Dialog" icon="pi pi-external-link"></p-button>

<p-dialog
  [(visible)]="displayDialog"
  [modal]="true"
  [style]="{width: '50vw'}"
  [draggable]="false"
  [resizable]="false"
  header="Training Session Details">
  <p>Dialog content goes here</p>
  <ng-template pTemplate="footer">
    <p-button label="Cancel" icon="pi pi-times" (onClick)="displayDialog=false" [text]="true"></p-button>
    <p-button label="Save" icon="pi pi-check" (onClick)="save()"></p-button>
  </ng-template>
</p-dialog>
```

```typescript
import { Component } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-training-modal',
  standalone: true,
  imports: [DialogModule, ButtonModule],
  template: `
    <p-dialog
      [(visible)]="displayDialog"
      [modal]="true"
      header="Create Training Session"
      [style]="{width: '50vw'}">
      <!-- Form content -->
      <p-button label="Save" (onClick)="save()"></p-button>
    </p-dialog>
  `
})
export class TrainingModalComponent {
  displayDialog = false;

  showDialog(): void {
    this.displayDialog = true;
  }

  save(): void {
    // Save logic
    this.displayDialog = false;
  }
}
```

### Toast Notifications

**Status**: ✅ **Stable** - Using PrimeNG Toast Service

```typescript
import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-notification-example',
  standalone: true,
  imports: [ToastModule, ButtonModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    
    <p-button 
      label="Show Success" 
      (onClick)="showSuccess()"
      severity="success">
    </p-button>
    
    <p-button 
      label="Show Error" 
      (onClick)="showError()"
      severity="danger">
    </p-button>
  `
})
export class NotificationExampleComponent {
  constructor(private messageService: MessageService) {}

  showSuccess(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Training session created successfully'
    });
  }

  showError(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save training session'
    });
  }
}
```

### Table/Data Grid

**Status**: ✅ **Stable** - Using PrimeNG Table Component

```html
<p-table
  [value]="athletes"
  [paginator]="true"
  [rows]="10"
  [rowsPerPageOptions]="[10, 25, 50]"
  [globalFilterFields]="['name', 'position']"
  [sortMode]="'multiple'"
  [selectionMode]="'multiple'"
  [(selection)]="selectedAthletes"
  [loading]="loading"
  dataKey="id">
  
  <ng-template pTemplate="caption">
    <div class="flex justify-content-between align-items-center">
      <span class="p-input-icon-left">
        <i class="pi pi-search"></i>
        <input 
          type="text" 
          pInputText 
          placeholder="Search athletes"
          (input)="table.filterGlobal($event.target.value, 'contains')">
      </span>
      <p-button 
        label="Add Athlete" 
        icon="pi pi-plus"
        (onClick)="addAthlete()">
      </p-button>
    </div>
  </ng-template>

  <ng-template pTemplate="header">
    <tr>
      <th style="width: 3rem">
        <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
      </th>
      <th pSortableColumn="name">
        Name <p-sortIcon field="name"></p-sortIcon>
      </th>
      <th pSortableColumn="position">
        Position <p-sortIcon field="position"></p-sortIcon>
      </th>
      <th pSortableColumn="sessions">
        Sessions <p-sortIcon field="sessions"></p-sortIcon>
      </th>
      <th pSortableColumn="performance">
        Performance <p-sortIcon field="performance"></p-sortIcon>
      </th>
      <th>Actions</th>
    </tr>
  </ng-template>

  <ng-template pTemplate="body" let-athlete>
    <tr>
      <td>
        <p-tableCheckbox [value]="athlete"></p-tableCheckbox>
      </td>
      <td>{{ athlete.name }}</td>
      <td>{{ athlete.position }}</td>
      <td>{{ athlete.sessions }}</td>
      <td>
        <p-tag [value]="athlete.performance + '%'" 
               [severity]="getPerformanceSeverity(athlete.performance)">
        </p-tag>
      </td>
      <td>
        <p-button 
          icon="pi pi-eye" 
          [text]="true"
          [rounded]="true"
          (onClick)="viewAthlete(athlete)"
          ariaLabel="View details">
        </p-button>
        <p-button 
          icon="pi pi-pencil" 
          [text]="true"
          [rounded]="true"
          (onClick)="editAthlete(athlete)"
          ariaLabel="Edit">
        </p-button>
      </td>
    </tr>
  </ng-template>

  <ng-template pTemplate="emptymessage">
    <tr>
      <td colspan="6">No athletes found</td>
    </tr>
  </ng-template>
</p-table>
```

```typescript
import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';

interface Athlete {
  id: number;
  name: string;
  position: string;
  sessions: number;
  performance: number;
}

@Component({
  selector: 'app-athletes-table',
  standalone: true,
  imports: [TableModule, ButtonModule, InputTextModule, TagModule, CommonModule],
  template: `<!-- Template from above -->`
})
export class AthletesTableComponent {
  athletes: Athlete[] = [
    { id: 1, name: 'John Smith', position: 'Quarterback', sessions: 24, performance: 85 },
    { id: 2, name: 'Sarah Johnson', position: 'Wide Receiver', sessions: 18, performance: 92 },
    { id: 3, name: 'Mike Davis', position: 'Defensive Back', sessions: 20, performance: 78 }
  ];
  
  selectedAthletes: Athlete[] = [];
  loading = false;

  getPerformanceSeverity(performance: number): string {
    if (performance >= 85) return 'success';
    if (performance >= 70) return 'info';
    if (performance >= 55) return 'warn';
    return 'danger';
  }

  viewAthlete(athlete: Athlete): void {
    console.log('View', athlete);
  }

  editAthlete(athlete: Athlete): void {
    console.log('Edit', athlete);
  }

  addAthlete(): void {
    console.log('Add athlete');
  }
}
```

### Tabs Component

**Status**: ✅ **Stable** - Using PrimeNG TabView Component

```html
<p-tabView>
  <p-tabPanel header="Stats" leftIcon="pi pi-chart-bar">
    <p>Stats content goes here</p>
  </p-tabPanel>
  
  <p-tabPanel header="Training" leftIcon="pi pi-calendar">
    <p>Training content goes here</p>
  </p-tabPanel>
  
  <p-tabPanel header="Nutrition" leftIcon="pi pi-apple">
    <p>Nutrition content goes here</p>
  </p-tabPanel>
  
  <p-tabPanel header="Performance" leftIcon="pi pi-chart-line">
    <p>Performance content goes here</p>
  </p-tabPanel>
</p-tabView>
```

### Badge System

**Status**: ✅ **Stable** - Using PrimeNG Tag Component

```html
<!-- Status Badges -->
<p-tag value="Active" severity="success"></p-tag>
<p-tag value="Pending" severity="warning"></p-tag>
<p-tag value="Inactive" severity="danger"></p-tag>
<p-tag value="Info" severity="info"></p-tag>

<!-- Icon Badge -->
<p-badge value="5" severity="danger">
  <i class="pi pi-bell" style="font-size: 1.5rem"></i>
</p-badge>
```

### Accordion Component

**Status**: ✅ **Stable** - Using PrimeNG Accordion Component

```html
<p-accordion>
  <p-accordionTab header="Training Schedule" [selected]="true">
    <p>Training schedule content</p>
  </p-accordionTab>
  
  <p-accordionTab header="Performance Metrics">
    <p>Performance metrics content</p>
  </p-accordionTab>
  
  <p-accordionTab header="Nutrition Plan">
    <p>Nutrition plan content</p>
  </p-accordionTab>
</p-accordion>
```

## Component Composition Patterns

### Card with Form

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-athlete-form-card',
  standalone: true,
  imports: [CardModule, ReactiveFormsModule, InputTextModule, ButtonModule],
  template: `
    <p-card header="Add New Athlete">
      <form [formGroup]="athleteForm" (ngSubmit)="onSubmit()">
        <div class="p-field">
          <label for="name" class="p-label">Name</label>
          <input id="name" type="text" pInputText formControlName="name">
        </div>
        
        <div class="p-field">
          <label for="position" class="p-label">Position</label>
          <input id="position" type="text" pInputText formControlName="position">
        </div>
        
        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            icon="pi pi-times" 
            [text]="true"
            (onClick)="cancel()">
          </p-button>
          <p-button 
            type="submit"
            label="Save" 
            icon="pi pi-check"
            [disabled]="athleteForm.invalid">
          </p-button>
        </ng-template>
      </form>
    </p-card>
  `
})
export class AthleteFormCardComponent {
  athleteForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.athleteForm = this.fb.group({
      name: ['', Validators.required],
      position: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.athleteForm.valid) {
      console.log(this.athleteForm.value);
    }
  }

  cancel(): void {
    this.athleteForm.reset();
  }
}
```

### Dashboard Layout Pattern

```typescript
import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule, ChartModule, CommonModule],
  template: `
    <div class="dashboard-grid">
      <div class="grid-item" *ngFor="let card of dashboardCards">
        <p-card [header]="card.title">
          <p-chart 
            *ngIf="card.chartData"
            [type]="card.chartType" 
            [data]="card.chartData"
            [options]="chartOptions">
          </p-chart>
          <p *ngIf="!card.chartData">{{ card.content }}</p>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--space-6);
      padding: var(--space-6);
    }
  `]
})
export class DashboardComponent {
  dashboardCards = [
    { title: 'Performance Overview', chartType: 'line', chartData: this.getLineChartData() },
    { title: 'Training Sessions', chartType: 'bar', chartData: this.getBarChartData() },
    { title: 'Quick Stats', content: 'Stats content here' }
  ];

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  getLineChartData() {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [{
        label: 'Performance',
        data: [65, 72, 80, 85],
        borderColor: '#089949'
      }]
    };
  }

  getBarChartData() {
    return {
      labels: ['Week 1', 'Week 2', 'Week 3'],
      datasets: [{
        label: 'Sessions',
        data: [12, 15, 18],
        backgroundColor: '#10c96b'
      }]
    };
  }
}
```

## Icon System

### PrimeIcons Integration

PrimeNG includes PrimeIcons, a comprehensive icon library:

```html
<!-- Basic Usage -->
<i class="pi pi-check"></i>
<i class="pi pi-times"></i>
<i class="pi pi-user"></i>

<!-- With Buttons -->
<p-button icon="pi pi-check" label="Confirm"></p-button>
<p-button icon="pi pi-times" [text]="true" label="Cancel"></p-button>

<!-- Sizes -->
<i class="pi pi-user" style="font-size: 1rem"></i>
<i class="pi pi-user" style="font-size: 1.5rem"></i>
<i class="pi pi-user" style="font-size: 2rem"></i>
```

### Lucide Angular Integration

For additional icons, use Lucide Angular:

```bash
npm install lucide-angular
```

```typescript
import { Component } from '@angular/core';
import { LucideAngularModule, Play, Pause, Stop } from 'lucide-angular';

@Component({
  selector: 'app-icon-example',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <lucide-play [size]="24" [color]="'#089949'"></lucide-play>
    <lucide-pause [size]="24"></lucide-pause>
    <lucide-stop [size]="24"></lucide-stop>
  `
})
export class IconExampleComponent {}
```

## Motion & Animation

### Angular Animations

Angular provides built-in animation support. Use with PrimeNG components:

```typescript
import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-animated-card',
  standalone: true,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ],
  template: `
    <div [@fadeIn]>
      <p-card header="Animated Card">
        <p>This card fades in on enter</p>
      </p-card>
    </div>
  `
})
export class AnimatedCardComponent {}
```

## Accessibility

### WCAG 2.1 AA Compliance

PrimeNG components include built-in accessibility features:

- **ARIA Attributes**: All components include proper ARIA labels and roles
- **Keyboard Navigation**: Full keyboard support for all interactive components
- **Screen Reader Support**: Semantic HTML and ARIA attributes
- **Focus Management**: Proper focus handling in modals and dialogs

### Accessibility Best Practices

```html
<!-- Proper Label Association -->
<label for="email" class="p-label">Email</label>
<input id="email" type="email" pInputText [(ngModel)]="email" 
       aria-describedby="email-help" aria-required="true">
<small id="email-help" class="p-error">Please enter a valid email</small>

<!-- Button with Aria Label -->
<p-button 
  icon="pi pi-check" 
  [rounded]="true"
  ariaLabel="Confirm action"
  (onClick)="confirm()">
</p-button>

<!-- Table with Proper Headers -->
<p-table [value]="data">
  <ng-template pTemplate="header">
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Position</th>
    </tr>
  </ng-template>
</p-table>
```

## Error Handling & Validation

### Angular Reactive Forms Validation

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-validated-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, MessageModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="p-field">
        <label for="email" class="p-label required">Email</label>
        <input 
          id="email"
          type="email"
          pInputText
          formControlName="email"
          [class.ng-invalid]="isFieldInvalid('email')"
          aria-describedby="email-error">
        <small 
          id="email-error"
          class="p-error" 
          *ngIf="isFieldInvalid('email')">
          {{ getFieldError('email') }}
        </small>
      </div>
    </form>
  `
})
export class ValidatedFormComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
```

## Implementation Guide

### Getting Started

1. **Install Angular CLI and create project**:

```bash
ng new flagfit-pro --routing --style=scss --standalone
cd flagfit-pro
```

2. **Install PrimeNG**:

```bash
ng add primeng
npm install primeicons @angular/animations
```

3. **Configure PrimeNG Theme**:

```scss
// styles.scss
@import "primeng/resources/themes/lara-light-green/theme.css";
@import "primeng/resources/primeng.css";
@import "primeicons/primeicons.css";
```

4. **Import PrimeNG Modules**:

```typescript
// In your component
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
// ... other modules
```

5. **Use Components**:

```html
<p-button label="Click Me" (onClick)="handleClick()"></p-button>
```

### Best Practices

#### Do ✅

- Use standalone components for better tree-shaking
- Use Angular Signals for reactive state management
- Leverage PrimeNG's built-in accessibility features
- Use semantic tokens via CSS custom properties
- Follow Angular style guide conventions
- Use OnPush change detection for performance
- Implement proper form validation with Reactive Forms

#### Don't ❌

- Don't override PrimeNG styles with !important
- Don't use primitive tokens directly in components
- Don't rely solely on color to convey meaning
- Don't skip accessibility attributes
- Don't create custom components when PrimeNG provides equivalents
- Don't use template-driven forms for complex validation

## Performance Guidelines

### Angular Performance Optimizations

1. **OnPush Change Detection**:

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-performance-component',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<!-- Template -->`
})
export class PerformanceComponent {}
```

2. **Lazy Loading**:

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  }
];
```

3. **TrackBy Functions**:

```html
<div *ngFor="let item of items; trackBy: trackById">
  {{ item.name }}
</div>
```

```typescript
trackById(index: number, item: any): number {
  return item.id;
}
```

## Versioning & Changelog

### Version 7.0 - Angular 19 + PrimeNG Edition (December 2025)

#### ✅ **Major Changes**

- **Migrated to Angular 19**: Full support for standalone components, signals, and modern Angular patterns
- **PrimeNG Integration**: Complete component library using PrimeNG 19+
- **TypeScript First**: All examples use TypeScript with proper typing
- **Reactive Forms**: All form examples use Angular Reactive Forms
- **Component Architecture**: Standalone components for better tree-shaking

#### ✅ **Component Updates**

- ✅ Button System → PrimeNG Button Component
- ✅ Form Components → PrimeNG InputText, Dropdown, Calendar, MultiSelect
- ✅ Card System → PrimeNG Card Component
- ✅ Modal System → PrimeNG Dialog Component
- ✅ Toast Notifications → PrimeNG Toast Service
- ✅ Table/Data Grid → PrimeNG Table Component
- ✅ Tabs → PrimeNG TabView Component
- ✅ Badges → PrimeNG Tag Component
- ✅ Accordion → PrimeNG Accordion Component

#### ✅ **New Features**

- Angular Signals integration examples
- Standalone component patterns
- PrimeNG theming customization
- Reactive Forms validation patterns
- Performance optimization strategies

---

_This documentation is maintained by the FlagFit Pro Design System team. Last updated: December 2025 - Version 7.0 - Angular 19 + PrimeNG Edition_
