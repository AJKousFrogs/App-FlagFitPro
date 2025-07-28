# FlagFit Pro - Modern Design System 2025

## 🎯 **System Overview**

### **Design Philosophy**
- **Athletic Energy**: High-performance visual language for competitive sports
- **Clean Minimal**: Uncluttered interface focusing on essential information
- **High Contrast**: WCAG AA compliant for optimal accessibility
- **Mobile-First**: 70% mobile usage for players, desktop priority for coaches
- **Subtle Dynamics**: 70% subtle animations, 30% dynamic celebrations

### **Target Audience**
- **Primary**: Athletes aged 18-45 (mobile-focused)
- **Secondary**: Coaches/Staff (desktop-focused)
- **Usage**: Performance tracking, team management, game analysis

---

## 🎨 **Color System**

### **Core Brand Palette**

#### **Primary Colors**
```css
/* Primary - Sky Blue (Main Brand) */
--primary-50: #f0f9ff;
--primary-100: #e0f2fe;
--primary-200: #bae6fd;
--primary-300: #7dd3fc;
--primary-400: #38bdf8;
--primary-500: #0ea5e9; /* Main Brand */
--primary-600: #0284c7; /* Hover States */
--primary-700: #0369a1;
--primary-800: #075985;
--primary-900: #0c4a6e; /* Text/Authority */

/* Secondary - Amber Gold (Energy/CTA) */
--secondary-50: #fffbeb;
--secondary-100: #fef3c7;
--secondary-200: #fde68a;
--secondary-300: #fcd34d;
--secondary-400: #fbbf24;
--secondary-500: #f59e0b; /* Energy/CTA */
--secondary-600: #d97706; /* Hover */
--secondary-700: #b45309;
--secondary-800: #92400e;
--secondary-900: #78350f;

/* Tertiary - Deep Navy (Authority/Text) */
--tertiary-50: #f8fafc;
--tertiary-100: #f1f5f9;
--tertiary-200: #e2e8f0;
--tertiary-300: #cbd5e1;
--tertiary-400: #94a3b8;
--tertiary-500: #64748b;
--tertiary-600: #475569;
--tertiary-700: #334155;
--tertiary-800: #1e293b;
--tertiary-900: #0c4a6e; /* Authority */
```

#### **Neutral System**
```css
/* Neutral Grays */
--neutral-50: #fafafa;   /* Light backgrounds */
--neutral-100: #f5f5f5;  /* Card backgrounds */
--neutral-200: #e5e5e5;  /* Borders */
--neutral-300: #d4d4d4;  /* Dividers */
--neutral-400: #a3a3a3;  /* Placeholder text */
--neutral-500: #737373;  /* Secondary text */
--neutral-600: #525252;  /* Body text */
--neutral-700: #404040;  /* Dark text */
--neutral-800: #262626;  /* Headings */
--neutral-900: #171717;  /* High contrast text */
--neutral-950: #0a0a0a;  /* Maximum contrast */

/* Pure Colors */
--white: #ffffff;
--black: #0a0a0a;
```

#### **Semantic Colors**
```css
/* Success - Win Green */
--success-50: #ecfdf5;
--success-500: #10b981;
--success-600: #059669;
--success-900: #064e3b;

/* Error - Penalty Red */
--error-50: #fef2f2;
--error-500: #ef4444;
--error-600: #dc2626;
--error-900: #7f1d1d;

/* Warning - Caution Amber */
--warning-50: #fffbeb;
--warning-500: #f59e0b;
--warning-600: #d97706;
--warning-900: #78350f;

/* Info - Stats Blue */
--info-50: #eff6ff;
--info-500: #3b82f6;
--info-600: #2563eb;
--info-900: #1e3a8a;
```

### **Usage Guidelines**

#### **Color Hierarchy**
1. **Primary (Sky Blue)**: Main interactions, active states, brand elements
2. **Secondary (Amber Gold)**: Call-to-action, highlights, achievements
3. **Tertiary (Deep Navy)**: Headers, navigation, authority elements
4. **Neutral**: Supporting text, backgrounds, borders
5. **Semantic**: Feedback states, alerts, status indicators

#### **Accessibility Standards**
- **Text on White**: Minimum contrast ratio 4.5:1 (WCAG AA)
- **Large Text**: Minimum contrast ratio 3:1
- **Interactive Elements**: Focus indicators with 3:1 contrast
- **Color Blindness**: Never rely on color alone for information

---

## 📝 **Typography System**

### **Font Family**
```css
font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### **Type Scale**

#### **Headings**
```css
/* H1 - Page Titles */
.h1 {
  font-size: 2.5rem;     /* 40px */
  font-weight: 700;      /* Bold */
  line-height: 1.2;
  color: var(--black);
  letter-spacing: -0.025em;
}

/* H2 - Section Headers */
.h2 {
  font-size: 2rem;       /* 32px */
  font-weight: 600;      /* Semibold */
  line-height: 1.25;
  color: var(--tertiary-900);
  letter-spacing: -0.015em;
}

/* H3 - Subsection Headers */
.h3 {
  font-size: 1.5rem;     /* 24px */
  font-weight: 600;      /* Semibold */
  line-height: 1.3;
  color: var(--tertiary-900);
}

/* H4 - Component Headers */
.h4 {
  font-size: 1.25rem;    /* 20px */
  font-weight: 500;      /* Medium */
  line-height: 1.4;
  color: var(--neutral-700);
}

/* H5 - Card Headers */
.h5 {
  font-size: 1rem;       /* 16px */
  font-weight: 500;      /* Medium */
  line-height: 1.5;
  color: var(--neutral-700);
}
```

#### **Body Text**
```css
/* Body Large - Important content */
.body-large {
  font-size: 1.125rem;   /* 18px */
  font-weight: 400;      /* Normal */
  line-height: 1.6;
  color: var(--neutral-700);
}

/* Body - Default text */
.body {
  font-size: 1rem;       /* 16px */
  font-weight: 400;      /* Normal */
  line-height: 1.6;
  color: var(--neutral-700);
}

/* Body Small - Secondary content */
.body-small {
  font-size: 0.875rem;   /* 14px */
  font-weight: 400;      /* Normal */
  line-height: 1.5;
  color: var(--neutral-500);
}

/* Caption - Metadata */
.caption {
  font-size: 0.75rem;    /* 12px */
  font-weight: 300;      /* Thin */
  line-height: 1.4;
  color: var(--neutral-500);
}
```

#### **Interactive Elements**
```css
/* CTA Primary Buttons */
.cta-primary {
  font-size: 1rem;       /* 16px */
  font-weight: 600;      /* Semibold */
  line-height: 1.5;
  color: var(--white);
  text-transform: none;
  letter-spacing: 0.025em;
}

/* CTA Secondary Buttons */
.cta-secondary {
  font-size: 1rem;       /* 16px */
  font-weight: 500;      /* Medium */
  line-height: 1.5;
  color: var(--primary-500);
}

/* Navigation Items */
.navigation {
  font-size: 0.875rem;   /* 14px */
  font-weight: 500;      /* Medium */
  line-height: 1.4;
  color: var(--neutral-700);
}

/* Links */
.link {
  font-size: 1rem;       /* 16px */
  font-weight: 500;      /* Medium */
  line-height: 1.5;
  color: var(--primary-500);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Data/Numbers (Monospace for alignment) */
.data {
  font-family: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.875rem;   /* 14px */
  font-weight: 500;      /* Medium */
  line-height: 1.4;
  color: var(--black);
}
```

---

## 📏 **Spacing System**

### **8px Base Unit Grid**
```css
/* Spacing Scale */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

### **Component Spacing**
- **Buttons**: Padding 12px 24px
- **Cards**: Padding 24px, margin 16px
- **Sections**: Margin 48px
- **Page margins**: 16px mobile, 24px tablet, 32px desktop

---

## 🔲 **Border Radius System**

```css
/* Border Radius Scale */
--radius-sm: 6px;    /* Inputs, badges */
--radius-md: 12px;   /* Buttons, cards */
--radius-lg: 16px;   /* Modals, major containers */
--radius-xl: 24px;   /* Hero sections */
--radius-full: 50%;  /* Circular elements */
```

### **Usage**
- **Forms**: 6px for clean, professional feel
- **Cards**: 12px for modern depth
- **Modals**: 16px for prominent containers
- **Heroes**: 24px for visual impact

---

## 🌫️ **Shadow System**

```css
/* Shadow Definitions */
--shadow-button: 0 1px 3px rgba(0, 0, 0, 0.12);
--shadow-card: 0 4px 12px rgba(0, 0, 0, 0.08);
--shadow-modal: 0 20px 40px rgba(0, 0, 0, 0.15);
--shadow-focus: 0 0 0 3px rgba(14, 165, 233, 0.3);
```

### **Elevation Hierarchy**
1. **Button**: Subtle elevation for clickable elements
2. **Card**: Medium lift for content containers
3. **Modal**: Strong depth for overlays
4. **Focus**: Accessibility indicator

---

## 📱 **Responsive Breakpoints**

```css
/* Mobile-First Breakpoints */
--breakpoint-mobile: 375px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1200px;
--breakpoint-wide: 1600px;

/* Media Queries */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1200px) { /* Desktop */ }
@media (min-width: 1600px) { /* Wide Desktop */ }
```

### **Content Strategy**
- **Mobile (375px-768px)**: Single column, touch-friendly
- **Tablet (768px-1200px)**: Two columns, hybrid interaction
- **Desktop (1200px+)**: Multi-column, dense data tables

---

## 🎭 **Animation System**

### **70% Subtle Animations**
```css
/* Micro-interactions */
--duration-fast: 100ms;     /* Hovers */
--duration-normal: 150ms;   /* State changes */
--duration-slow: 200ms;     /* Focus states */
--duration-page: 300ms;     /* Page transitions */

/* Easing Functions */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

#### **Subtle Animation Examples**
- **Button Hover**: `transform: translateY(-1px)` in 150ms
- **Card Hover**: `box-shadow` elevation change in 200ms
- **Input Focus**: `border-color` transition in 200ms
- **Page Navigation**: `opacity` and `translateX` in 300ms

### **30% Dynamic Animations**
```css
/* Celebration animations */
--duration-celebration: 800ms;
--duration-counter: 1200ms;
--duration-loading: 2000ms;

/* Spring Physics */
--spring-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--spring-gentle: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

#### **Dynamic Animation Examples**
- **Stat Counters**: Spring-powered number animations
- **Achievement Unlock**: Bounce + scale effects
- **Loading States**: Skeleton screens with pulse
- **Success States**: Confetti or particle effects

---

## 🎨 **Component Library**

### **Navigation Components**

#### **Mobile Bottom Navigation (Instagram Style)**
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: var(--white);
  border-top: 1px solid var(--neutral-200);
  backdrop-filter: blur(16px);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: var(--space-3) var(--space-4);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--duration-normal) var(--ease-out);
}

.nav-item:hover {
  background: var(--primary-50);
  transform: translateY(-1px);
}

.nav-item.active {
  color: var(--primary-500);
}
```

#### **Desktop Sidebar Navigation**
```css
.sidebar {
  width: 280px;
  height: 100vh;
  background: var(--white);
  border-right: 1px solid var(--neutral-200);
  padding: var(--space-6);
  position: fixed;
  left: 0;
  top: 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
  transition: all var(--duration-normal) var(--ease-out);
}

.sidebar-item:hover {
  background: var(--neutral-100);
}

.sidebar-item.active {
  background: var(--primary-50);
  color: var(--primary-600);
  border-left: 3px solid var(--primary-500);
}
```

### **Floating Action Button (FAB)**

#### **Context-Aware FAB System**
```css
.fab-container {
  position: fixed;
  bottom: 100px; /* Above bottom nav */
  right: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  z-index: 1000;
}

.fab-primary {
  width: 56px;
  height: 56px;
  background: var(--primary-500);
  color: var(--white);
  border-radius: var(--radius-full);
  border: none;
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-normal) var(--ease-out);
}

.fab-primary:hover {
  background: var(--primary-600);
  transform: translateY(-2px);
  box-shadow: var(--shadow-modal);
}

.fab-secondary {
  width: 48px;
  height: 48px;
  background: var(--white);
  color: var(--primary-500);
  border: 1px solid var(--neutral-200);
  /* Same hover effects */
}
```

**FAB Usage:**
- **Players**: "Quick Stats" (primary), "Log Activity" (secondary)
- **Coaches**: "Add Player" (primary), "Game Analysis" (secondary)

### **Form Components**

#### **Input Fields**
```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  line-height: 1.5;
  background: var(--white);
  transition: all var(--duration-slow) var(--ease-in-out);
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus);
}

.input::placeholder {
  color: var(--neutral-400);
}

.input:disabled {
  background: var(--neutral-100);
  color: var(--neutral-400);
  cursor: not-allowed;
}
```

#### **Button System**
```css
/* Primary CTA Button */
.btn-primary {
  background: var(--primary-500);
  color: var(--white);
  border: none;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: 600;
  box-shadow: var(--shadow-button);
  transition: all var(--duration-normal) var(--ease-out);
  min-height: 44px; /* Touch-friendly */
}

.btn-primary:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--primary-500);
  border: 1px solid var(--primary-500);
  /* Same padding and transitions */
}

.btn-secondary:hover {
  background: var(--primary-50);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--neutral-600);
  border: none;
  /* Same padding and transitions */
}

.btn-ghost:hover {
  background: var(--neutral-100);
}
```

### **Card Components**

#### **Standard Card**
```css
.card {
  background: var(--white);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
  transition: all var(--duration-normal) var(--ease-out);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-modal);
}

.card-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--neutral-200);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--neutral-800);
  margin-bottom: var(--space-2);
}

.card-description {
  color: var(--neutral-500);
  font-size: 0.875rem;
}
```

#### **Player Card**
```css
.player-card {
  background: var(--white);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: all var(--duration-normal) var(--ease-out);
}

.player-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-modal);
}

.player-avatar {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 3px solid var(--white);
  box-shadow: var(--shadow-button);
}

.player-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--neutral-900);
  display: block;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### **Data Visualization Components**

#### **Dense Data Tables**
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--white);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.table-header {
  background: var(--neutral-50);
  border-bottom: 1px solid var(--neutral-200);
}

.table-header th {
  padding: var(--space-4);
  text-align: left;
  font-weight: 600;
  color: var(--tertiary-900);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background var(--duration-normal);
}

.table-header th:hover {
  background: var(--neutral-100);
}

.table-header th.sortable::after {
  content: '↕';
  margin-left: var(--space-2);
  opacity: 0.5;
}

.table-header th.sorted-asc::after {
  content: '↑';
  opacity: 1;
  color: var(--primary-500);
}

.table-header th.sorted-desc::after {
  content: '↓';
  opacity: 1;
  color: var(--primary-500);
}

.table-row {
  border-bottom: 1px solid var(--neutral-200);
  transition: background var(--duration-fast);
}

.table-row:hover {
  background: var(--neutral-50);
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  padding: var(--space-4);
  color: var(--neutral-700);
  font-size: 0.875rem;
}

.table-cell.number {
  font-family: var(--font-mono);
  font-weight: 500;
  text-align: right;
  color: var(--black);
}

.table-cell.status {
  font-weight: 500;
}

.table-cell.status.success {
  color: var(--success-600);
}

.table-cell.status.warning {
  color: var(--warning-600);
}

.table-cell.status.error {
  color: var(--error-600);
}
```

#### **Progress Indicators**
```css
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
  border-radius: var(--radius-full);
  transition: width var(--duration-celebration) var(--ease-out);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

#### **Stat Counters (Dynamic Animation)**
```css
.stat-counter {
  font-size: 3rem;
  font-weight: 700;
  color: var(--neutral-900);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

/* JavaScript will handle the counting animation */
.stat-counter.animating {
  transform: scale(1.1);
  transition: transform var(--duration-celebration) var(--spring-bounce);
}
```

### **Modal & Overlay Components**

#### **Modal System**
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  transition: opacity var(--duration-page) var(--ease-in-out);
}

.modal-overlay.active {
  opacity: 1;
}

.modal-content {
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-modal);
  max-width: 500px;
  width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  transform: translateY(20px) scale(0.95);
  transition: transform var(--duration-page) var(--ease-out);
}

.modal-overlay.active .modal-content {
  transform: translateY(0) scale(1);
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--neutral-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--neutral-900);
}

.modal-close {
  background: none;
  border: none;
  padding: var(--space-2);
  color: var(--neutral-500);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--duration-normal);
}

.modal-close:hover {
  background: var(--neutral-100);
  color: var(--neutral-700);
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--neutral-200);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
```

---

## 🔤 **Icon System**

### **Dual Icon Approach**

#### **Heroicons (Primary UI)**
```javascript
// Navigation, buttons, forms, general UI
import {
  HomeIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  SearchIcon,
  MenuIcon,
  XIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  ExclamationIcon
} from '@heroicons/react/24/outline';
```

#### **Lucide (Sports/Data Specific)**
```javascript
// Athletic performance, stats, sports-specific icons
import {
  Activity,
  BarChart3,
  TrendingUp,
  Target,
  Timer,
  Zap,
  Award,
  Trophy,
  Users,
  Calendar,
  Clock,
  MapPin,
  Play,
  Pause,
  SkipForward
} from 'lucide-react';
```

### **Icon Standards**
- **Size**: 20px default, 24px for headers, 16px for small UI
- **Stroke Width**: 1.5px (consistent between both libraries)
- **Color**: Inherit from parent text color
- **Accessibility**: Always include descriptive `aria-label`

### **Icon Usage Guidelines**
```css
.icon {
  width: 20px;
  height: 20px;
  stroke-width: 1.5;
  flex-shrink: 0;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.icon-lg {
  width: 24px;
  height: 24px;
}

.icon-xl {
  width: 32px;
  height: 32px;
}
```

---

## 📐 **Layout System**

### **Container System**
```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding: 0 var(--space-6);
    max-width: 768px;
  }
}

@media (min-width: 1200px) {
  .container {
    padding: 0 var(--space-8);
    max-width: 1200px;
  }
}

@media (min-width: 1600px) {
  .container {
    max-width: 1400px;
  }
}
```

### **Grid System**
```css
.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* Responsive Grid */
.grid-responsive {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1200px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### **Flexbox Utilities**
```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }

.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }
.gap-8 { gap: var(--space-8); }
```

---

## 🌙 **Dark Mode Support**

### **Dark Color Palette**
```css
[data-theme="dark"] {
  /* Primary colors remain the same for brand consistency */
  --primary-500: #0ea5e9;
  --secondary-500: #f59e0b;
  
  /* Neutral system inverted */
  --neutral-50: #0a0a0a;
  --neutral-100: #171717;
  --neutral-200: #262626;
  --neutral-300: #404040;
  --neutral-400: #525252;
  --neutral-500: #737373;
  --neutral-600: #a3a3a3;
  --neutral-700: #d4d4d4;
  --neutral-800: #e5e5e5;
  --neutral-900: #f5f5f5;
  --neutral-950: #fafafa;
  
  --white: #0a0a0a;
  --black: #fafafa;
  
  /* Adjusted semantic colors for dark backgrounds */
  --success-500: #22c55e;
  --error-500: #f87171;
  --warning-500: #fbbf24;
  --info-500: #60a5fa;
  
  /* Dark mode specific */
  --card-background: #171717;
  --border-color: #262626;
}
```

### **Dark Mode Implementation**
```javascript
// Toggle dark mode
function toggleDarkMode() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Initialize theme on page load
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = savedTheme || systemPreference;
  
  document.documentElement.setAttribute('data-theme', theme);
}
```

---

## ♿ **Accessibility Guidelines**

### **Color Contrast Requirements**
- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text (18px+)**: 3:1 minimum contrast ratio
- **Interactive elements**: 3:1 minimum contrast ratio
- **Focus indicators**: Visible and 3:1 contrast ratio

### **Keyboard Navigation**
```css
/* Focus indicators for all interactive elements */
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
a:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  box-shadow: var(--shadow-focus);
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-500);
  color: var(--white);
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 10000;
}

.skip-link:focus {
  top: 6px;
}
```

### **Screen Reader Support**
```html
<!-- Semantic HTML structure -->
<main role="main" aria-label="Main content">
  <section aria-labelledby="stats-heading">
    <h2 id="stats-heading">Performance Statistics</h2>
    <!-- content -->
  </section>
</main>

<!-- ARIA labels for complex interactions -->
<button aria-label="Sort by player name" aria-pressed="false">
  Player Name
</button>

<!-- Status announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- Status updates announced to screen readers -->
</div>
```

### **Touch Targets**
- **Minimum size**: 44px × 44px for all interactive elements
- **Spacing**: 8px minimum between touch targets
- **Hover states**: Don't rely solely on hover for important interactions

---

## 🚀 **Performance Optimization**

### **CSS Custom Properties Strategy**
```css
/* Define once, use everywhere */
:root {
  /* Color system */
  --primary: #0ea5e9;
  --secondary: #f59e0b;
  /* ... all other tokens */
}

/* Component-specific overrides */
.button {
  background: var(--primary);
  color: var(--white);
}

.button--secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}
```

### **Critical CSS**
```css
/* Inline critical styles for above-the-fold content */
/* - Typography basics */
/* - Layout containers */
/* - Navigation styles */
/* - Primary button styles */
```

### **Animation Performance**
```css
/* Use transform and opacity for best performance */
.optimized-animation {
  transform: translateX(0);
  opacity: 1;
  transition: transform 200ms ease-out, opacity 200ms ease-out;
  will-change: transform, opacity;
}

.optimized-animation.hidden {
  transform: translateX(-20px);
  opacity: 0;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📊 **Component Usage Examples**

### **Player Dashboard (Mobile)**
```html
<div class="container">
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="flex items-center gap-4 mb-6">
      <img src="player-avatar.jpg" alt="Player avatar" class="player-avatar">
      <div>
        <h1 class="h2">John Smith</h1>
        <p class="body-small">Wide Receiver</p>
      </div>
    </div>
    
    <!-- Quick Stats -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="card text-center">
        <div class="stat-counter" data-target="47">0</div>
        <div class="stat-label">Catches</div>
      </div>
      <div class="card text-center">
        <div class="stat-counter" data-target="12">0</div>
        <div class="stat-label">TDs</div>
      </div>
      <div class="card text-center">
        <div class="stat-counter" data-target="847">0</div>
        <div class="stat-label">Yards</div>
      </div>
    </div>
  </section>
  
  <!-- Recent Performance -->
  <section class="mb-8">
    <h2 class="h3 mb-4">Recent Performance</h2>
    <div class="space-y-3">
      <div class="card">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="h5">vs Raiders</h3>
            <p class="body-small">Oct 15, 2025</p>
          </div>
          <div class="text-right">
            <div class="data">8 catches, 124 yards</div>
            <div class="flex items-center gap-1">
              <span class="body-small">Performance:</span>
              <span class="badge badge-success">Excellent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>

<!-- Bottom Navigation -->
<nav class="bottom-nav">
  <a href="/dashboard" class="nav-item active">
    <HomeIcon class="icon" />
    <span class="caption">Home</span>
  </a>
  <a href="/stats" class="nav-item">
    <BarChart3 class="icon" />
    <span class="caption">Stats</span>
  </a>
  <a href="/team" class="nav-item">
    <Users class="icon" />
    <span class="caption">Team</span>
  </a>
  <a href="/profile" class="nav-item">
    <UserIcon class="icon" />
    <span class="caption">Profile</span>
  </a>
</nav>

<!-- Floating Action Button -->
<div class="fab-container">
  <button class="fab-primary" aria-label="View quick stats">
    <Activity class="icon" />
  </button>
</div>
```

### **Coach Dashboard (Desktop)**
```html
<div class="flex h-screen">
  <!-- Sidebar Navigation -->
  <nav class="sidebar">
    <div class="mb-8">
      <h2 class="h4">FlagFit Pro</h2>
      <p class="body-small">Coach Dashboard</p>
    </div>
    
    <ul class="space-y-2">
      <li>
        <a href="/dashboard" class="sidebar-item active">
          <HomeIcon class="icon" />
          <span>Dashboard</span>
        </a>
      </li>
      <li>
        <a href="/team" class="sidebar-item">
          <Users class="icon" />
          <span>Team Management</span>
        </a>
      </li>
      <li>
        <a href="/analytics" class="sidebar-item">
          <BarChart3 class="icon" />
          <span>Analytics</span>
        </a>
      </li>
      <li>
        <a href="/games" class="sidebar-item">
          <Calendar class="icon" />
          <span>Game Schedule</span>
        </a>
      </li>
    </ul>
  </nav>
  
  <!-- Main Content -->
  <main class="flex-1 overflow-auto">
    <div class="container py-8">
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="h1">Team Dashboard</h1>
          <p class="body-large">Season 2025 Overview</p>
        </div>
        <div class="flex gap-3">
          <button class="btn-secondary">
            <Download class="icon icon-sm" />
            Export Data
          </button>
          <button class="btn-primary">
            <Plus class="icon icon-sm" />
            Add Player
          </button>
        </div>
      </div>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="h5">Team Record</h3>
            <Trophy class="icon text-secondary-500" />
          </div>
          <div class="stat-counter">12-3</div>
          <div class="body-small">Wins-Losses</div>
        </div>
        
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="h5">Avg Points</h3>
            <Target class="icon text-primary-500" />
          </div>
          <div class="stat-counter">28.4</div>
          <div class="body-small">Points per game</div>
        </div>
        
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="h5">Top Performer</h3>
            <Award class="icon text-success-500" />
          </div>
          <div class="h4">John Smith</div>
          <div class="body-small">847 total yards</div>
        </div>
        
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="h5">Next Game</h3>
            <Calendar class="icon text-info-500" />
          </div>
          <div class="h4">Oct 22</div>
          <div class="body-small">vs Eagles</div>
        </div>
      </div>
      
      <!-- Dense Data Table -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Player Statistics</h2>
          <div class="flex gap-3">
            <input 
              type="search" 
              placeholder="Search players..." 
              class="input"
              style="width: 250px;"
            >
            <select class="input">
              <option>All Positions</option>
              <option>QB</option>
              <option>WR</option>
              <option>RB</option>
            </select>
          </div>
        </div>
        
        <table class="data-table">
          <thead class="table-header">
            <tr>
              <th class="sortable">Player</th>
              <th class="sortable">Position</th>
              <th class="sortable">Games</th>
              <th class="sortable">Touchdowns</th>
              <th class="sortable">Total Yards</th>
              <th class="sortable">Avg/Game</th>
              <th class="sortable">Performance</th>
            </tr>
          </thead>
          <tbody>
            <tr class="table-row">
              <td class="table-cell">
                <div class="flex items-center gap-3">
                  <img src="john-avatar.jpg" alt="John Smith" class="w-8 h-8 rounded-full">
                  <span class="font-medium">John Smith</span>
                </div>
              </td>
              <td class="table-cell">WR</td>
              <td class="table-cell number">15</td>
              <td class="table-cell number">12</td>
              <td class="table-cell number">847</td>
              <td class="table-cell number">56.5</td>
              <td class="table-cell status success">Excellent</td>
            </tr>
            <!-- More rows... -->
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>

<!-- Coach FAB -->
<div class="fab-container">
  <button class="fab-primary" aria-label="Add new player">
    <Plus class="icon" />
  </button>
  <button class="fab-secondary" aria-label="Game analysis tools">
    <BarChart3 class="icon" />
  </button>
</div>
```

---

## 🔧 **Implementation Guidelines**

### **CSS Architecture**
```
styles/
├── tokens/
│   ├── colors.css          /* Color system variables */
│   ├── typography.css      /* Font and text styles */
│   ├── spacing.css         /* Spacing and layout tokens */
│   ├── shadows.css         /* Elevation system */
│   └── animations.css      /* Motion tokens */
├── components/
│   ├── buttons.css         /* Button variations */
│   ├── forms.css           /* Input and form styles */
│   ├── cards.css           /* Card components */
│   ├── navigation.css      /* Nav and menu styles */
│   ├── tables.css          /* Data table styles */
│   └── modals.css          /* Modal and overlay styles */
├── utilities/
│   ├── layout.css          /* Flexbox and grid utilities */
│   ├── spacing.css         /* Margin and padding utilities */
│   └── typography.css      /* Text utility classes */
└── main.css                /* Import all modules */
```

### **Component Development Principles**
1. **Mobile-first**: Start with mobile layout, enhance for larger screens
2. **Progressive enhancement**: Core functionality works without JavaScript
3. **Accessibility-first**: ARIA labels, keyboard navigation, screen reader support
4. **Performance**: Use CSS transforms for animations, minimize repaints
5. **Consistency**: Follow established patterns and token system

### **Testing Checklist**
- [ ] Keyboard navigation works for all interactive elements
- [ ] Color contrast meets WCAG AA standards
- [ ] Components work across all target browsers
- [ ] Touch targets are minimum 44px on mobile
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Dark mode toggle works correctly
- [ ] Table sorting and filtering functions properly
- [ ] Modal dialogs trap focus correctly

---

## 📈 **Success Metrics**

### **Design Consistency**
- ✅ 100% of components use design tokens
- ✅ Color system fully replaces legacy khaki/yellow system
- ✅ Typography hierarchy consistently applied
- ✅ Spacing system follows 8px grid

### **User Experience**
- ✅ Touch-friendly mobile interface (44px minimum targets)
- ✅ Fast page transitions (<300ms)
- ✅ Smooth animations at 60fps
- ✅ Intuitive navigation patterns

### **Accessibility**
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ High contrast mode support

### **Performance**
- ✅ Critical CSS under 14KB
- ✅ Component CSS under 50KB total
- ✅ Animation performance optimized
- ✅ Dark mode toggle under 100ms

---

## 🚀 **Next Steps**

### **Phase 1: Foundation (Week 1-2)**
1. Implement color system and design tokens
2. Update typography across all components
3. Replace old button and form styles
4. Add dark mode support

### **Phase 2: Components (Week 3-4)**
1. Build new navigation systems (mobile bottom nav, desktop sidebar)
2. Create card component library
3. Implement dense data tables with sorting/filtering
4. Add modal and overlay system

### **Phase 3: Advanced Features (Week 5-6)**
1. Implement floating action button system
2. Add animated stat counters and progress bars
3. Create responsive dashboard layouts
4. Performance optimization and testing

### **Phase 4: Polish (Week 7-8)**
1. Animation refinements and celebrations
2. Accessibility audit and improvements
3. Cross-browser testing and fixes
4. Documentation and style guide completion

---

## 📚 **Resources & References**

### **Design Inspiration**
- Apple Human Interface Guidelines
- Material Design 3
- Ant Design
- Atlassian Design System

### **Accessibility Standards**
- WCAG 2.1 AA Guidelines
- WAI-ARIA Authoring Practices
- Inclusive Design Principles

### **Performance Guidelines**
- Core Web Vitals
- CSS Animation Performance
- Critical Rendering Path Optimization

### **Browser Support**
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- iOS Safari 14+
- Android Chrome 90+

---

This modern design system provides a solid foundation for building a high-performance, accessible, and visually appealing flag football application that serves both players and coaches with an optimal user experience across all devices.