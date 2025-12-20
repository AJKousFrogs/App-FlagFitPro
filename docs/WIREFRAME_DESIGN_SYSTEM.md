# Wireframe Design System
*Consolidated Design Standards & Component Library*

## 🎯 **Overview**

This document establishes the **unified design system** for all wireframes in the Flag Football Training App. It consolidates design standards from multiple wireframe files into a single source of truth for **consistent, professional-grade wireframe implementation**.

## 🎨 **Design Foundation**

### **Core Design Principles**
1. **Ultra-Minimal Aesthetics** - Clean, distraction-free wireframes
2. **Functional Clarity** - Every element serves a clear purpose
3. **Research-Driven Layout** - Based on sports science user research
4. **Olympic-Level Standards** - Professional athlete-grade UX
5. **Mobile-First Responsive** - Optimized for all device types

### **Visual Hierarchy**
```
Level 1: Primary Actions (Training, Performance)
Level 2: Navigation & Core Features  
Level 3: Supporting Information
Level 4: Metadata & Research Citations
```

## 🎨 **Color System**

### **Wireframe Color Palette**
```css
:root {
  /* Primary Colors */
  --wireframe-black: #000000;      /* Borders, text, icons */
  --wireframe-white: #ffffff;      /* Backgrounds, negative space */
  --wireframe-gray-light: #f5f5f5; /* Subtle backgrounds */
  --wireframe-gray-medium: #cccccc; /* Disabled states */
  --wireframe-gray-dark: #666666;  /* Secondary text */
  
  /* Semantic Colors (minimal use) */
  --success-indicator: #000000;     /* Keep monochrome */
  --warning-indicator: #000000;     /* Use text/icons instead */
  --error-indicator: #000000;       /* Use clear labeling */
  --info-indicator: #000000;        /* Maintain consistency */
}
```

### **Color Usage Guidelines**
- **Primary**: Black borders and text only
- **Backgrounds**: White for content areas
- **Accents**: None - rely on typography and spacing
- **Status Indicators**: Use text labels instead of colors

## 📝 **Typography System**

### **Font Stack**
```css
:root {
  --font-primary: Arial, sans-serif;
  --font-fallback: system-ui, -apple-system, sans-serif;
}

/* Typography Scale */
--font-size-xs: 12px;    /* Metadata, timestamps */
--font-size-sm: 14px;    /* Body text, labels */
--font-size-md: 16px;    /* Buttons, inputs */
--font-size-lg: 18px;    /* Section headers */
--font-size-xl: 24px;    /* Page titles */
--font-size-xxl: 32px;   /* Hero elements */
```

### **Typography Classes**
```css
.wireframe-heading-1 {
  font-size: var(--font-size-xxl);
  font-weight: bold;
  margin: 0 0 24px 0;
  color: var(--wireframe-black);
}

.wireframe-heading-2 {
  font-size: var(--font-size-xl);
  font-weight: bold;
  margin: 0 0 16px 0;
  color: var(--wireframe-black);
}

.wireframe-heading-3 {
  font-size: var(--font-size-lg);
  font-weight: bold;
  margin: 0 0 12px 0;
  color: var(--wireframe-black);
}

.wireframe-body {
  font-size: var(--font-size-sm);
  font-weight: normal;
  line-height: 1.4;
  color: var(--wireframe-black);
}

.wireframe-caption {
  font-size: var(--font-size-xs);
  color: var(--wireframe-gray-dark);
  line-height: 1.3;
}
```

## 📐 **Spacing System**

### **Spacing Scale**
```css
:root {
  /* Spacing Scale (8px base unit) */
  --space-xs: 4px;      /* Micro spacing */
  --space-sm: 8px;      /* Small spacing */
  --space-md: 16px;     /* Medium spacing (base) */
  --space-lg: 24px;     /* Large spacing */
  --space-xl: 32px;     /* Extra large spacing */
  --space-xxl: 48px;    /* Section breaks */
  --space-xxxl: 64px;   /* Page level spacing */
}
```

### **Layout Grid**
```css
.wireframe-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

.wireframe-grid {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.wireframe-section {
  margin-bottom: var(--space-xxl);
}
```

## 🧱 **Component Library**

### **Base Components**

#### **Wireframe Box**
```css
.wireframe-box {
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  padding: var(--space-md);
  margin: var(--space-sm) 0;
  box-sizing: border-box;
}

.wireframe-box--large {
  padding: var(--space-lg);
}

.wireframe-box--compact {
  padding: var(--space-sm);
}
```

#### **Buttons**
```css
.wireframe-button {
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-primary);
  font-size: var(--font-size-md);
  cursor: pointer;
  min-height: 44px; /* Touch-friendly */
  min-width: 44px;
  text-align: center;
  box-sizing: border-box;
}

.wireframe-button:hover {
  background-color: var(--wireframe-gray-light);
}

.wireframe-button--primary {
  background-color: var(--wireframe-black);
  color: var(--wireframe-white);
}

.wireframe-button--large {
  padding: var(--space-md) var(--space-lg);
  font-size: var(--font-size-lg);
}

.wireframe-button--full-width {
  width: 100%;
}
```

#### **Form Elements**
```css
.wireframe-input {
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  padding: var(--space-sm);
  font-family: var(--font-primary);
  font-size: var(--font-size-md);
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
}

.wireframe-input:focus {
  outline: 2px solid var(--wireframe-black);
  outline-offset: 2px;
}

.wireframe-select {
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  padding: var(--space-sm);
  font-family: var(--font-primary);
  width: 100%;
  min-height: 44px;
}

.wireframe-checkbox {
  width: 20px;
  height: 20px;
  border: 1px solid var(--wireframe-black);
  margin-right: var(--space-sm);
}
```

### **Complex Components**

#### **Navigation Component**
```css
.wireframe-navigation {
  border-bottom: 1px solid var(--wireframe-black);
  padding: var(--space-md) 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wireframe-nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.wireframe-nav-logo {
  width: 40px;
  height: 40px;
  border: 1px solid var(--wireframe-black);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wireframe-nav-menu {
  display: flex;
  gap: var(--space-lg);
  list-style: none;
  margin: 0;
  padding: 0;
}

.wireframe-nav-link {
  text-decoration: none;
  color: var(--wireframe-black);
  padding: var(--space-sm);
  border: 1px solid transparent;
}

.wireframe-nav-link:hover {
  border-color: var(--wireframe-black);
}

.wireframe-nav-actions {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}
```

#### **Card Component**
```css
.wireframe-card {
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  overflow: hidden;
}

.wireframe-card-header {
  padding: var(--space-md);
  border-bottom: 1px solid var(--wireframe-black);
}

.wireframe-card-body {
  padding: var(--space-md);
}

.wireframe-card-footer {
  padding: var(--space-md);
  border-top: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-gray-light);
}
```

#### **Performance Metrics Component**
```css
.wireframe-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}

.wireframe-metric {
  border: 1px solid var(--wireframe-black);
  padding: var(--space-md);
  text-align: center;
}

.wireframe-metric-value {
  font-size: var(--font-size-xl);
  font-weight: bold;
  display: block;
  margin-bottom: var(--space-sm);
}

.wireframe-metric-label {
  font-size: var(--font-size-sm);
  color: var(--wireframe-gray-dark);
}

.wireframe-metric-research {
  font-size: var(--font-size-xs);
  color: var(--wireframe-gray-dark);
  margin-top: var(--space-sm);
  font-style: italic;
}
```

## 📱 **Responsive Design System**

### **Breakpoint System**
```css
:root {
  --breakpoint-xs: 320px;
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
}

/* Mobile First Approach */
@media (max-width: 767px) {
  .wireframe-nav-menu {
    display: none;
  }
  
  .wireframe-mobile-menu {
    display: block;
  }
  
  .wireframe-grid {
    grid-template-columns: 1fr;
  }
  
  .wireframe-container {
    padding: 0 var(--space-sm);
  }
}

@media (max-width: 479px) {
  .wireframe-button {
    width: 100%;
    margin-bottom: var(--space-sm);
  }
  
  .wireframe-metrics {
    grid-template-columns: 1fr;
  }
}
```

### **Mobile Components**
```css
.wireframe-mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  border-bottom: 1px solid var(--wireframe-black);
}

.wireframe-hamburger {
  width: 30px;
  height: 30px;
  border: 1px solid var(--wireframe-black);
  background: none;
  cursor: pointer;
}

.wireframe-mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--wireframe-white);
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.wireframe-mobile-menu.open {
  transform: translateX(0);
}
```

## 🏈 **Flag Football Specific Components**

### **Performance Dashboard**
```css
.wireframe-performance-dashboard {
  display: grid;
  grid-template-areas: 
    "summary predictions"
    "metrics research"
    "actions timeline";
  gap: var(--space-md);
}

.wireframe-performance-summary {
  grid-area: summary;
  border: 2px solid var(--wireframe-black); /* Emphasized */
}

.wireframe-ai-predictions {
  grid-area: predictions;
}

.wireframe-research-evidence {
  grid-area: research;
  background-color: var(--wireframe-gray-light);
}
```

### **Training Session Components**
```css
.wireframe-training-session {
  border: 1px solid var(--wireframe-black);
  margin-bottom: var(--space-lg);
}

.wireframe-ai-coach-message {
  border: 2px solid var(--wireframe-black);
  padding: var(--space-lg);
  background-color: var(--wireframe-gray-light);
}

.wireframe-live-tracking {
  border: 1px dashed var(--wireframe-black);
  padding: var(--space-md);
  text-align: center;
}

.wireframe-drill-category {
  border: 1px solid var(--wireframe-black);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
}
```

### **Olympics Tracking Components**
```css
.wireframe-olympics-tracker {
  border: 3px solid var(--wireframe-black); /* Highest emphasis */
  padding: var(--space-lg);
  text-align: center;
}

.wireframe-qualification-status {
  font-size: var(--font-size-xl);
  font-weight: bold;
  margin-bottom: var(--space-md);
}

.wireframe-trajectory-chart {
  height: 200px;
  border: 1px solid var(--wireframe-black);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--wireframe-gray-light);
}
```

## 🔬 **Research Integration Components**

### **Evidence Display**
```css
.wireframe-research-citation {
  border-left: 3px solid var(--wireframe-black);
  padding-left: var(--space-md);
  margin: var(--space-md) 0;
  font-style: italic;
}

.wireframe-study-meta {
  font-size: var(--font-size-xs);
  color: var(--wireframe-gray-dark);
  margin-top: var(--space-sm);
}

.wireframe-confidence-indicator {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--wireframe-black);
  font-size: var(--font-size-xs);
  margin-left: var(--space-sm);
}
```

### **Prediction Accuracy Display**
```css
.wireframe-accuracy-badge {
  display: inline-block;
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--wireframe-black);
  font-weight: bold;
  margin-right: var(--space-sm);
}

.wireframe-model-validation {
  border: 1px solid var(--wireframe-black);
  padding: var(--space-md);
  background-color: var(--wireframe-gray-light);
}
```

## ♿ **Accessibility Standards**

### **WCAG 2.1 AA Compliance**
```css
/* Focus Management */
*:focus {
  outline: 2px solid var(--wireframe-black);
  outline-offset: 2px;
}

/* Minimum Touch Targets */
.wireframe-button,
.wireframe-input,
.wireframe-select {
  min-height: 44px;
  min-width: 44px;
}

/* Screen Reader Support */
.wireframe-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### **Semantic HTML Requirements**
```html
<!-- Required ARIA labels -->
<button 
  class="wireframe-button" 
  aria-label="Start training session"
  role="button"
>
  Start Training
</button>

<!-- Required heading hierarchy -->
<section aria-labelledby="performance-heading">
  <h2 id="performance-heading">Performance Analytics</h2>
  <!-- Content -->
</section>

<!-- Required form labels -->
<label for="sprint-time">10-Yard Sprint Time</label>
<input 
  id="sprint-time" 
  class="wireframe-input" 
  type="text"
  aria-describedby="sprint-help"
>
<div id="sprint-help" class="wireframe-caption">
  Based on research: target under 1.6 seconds
</div>
```

## 📏 **Layout Patterns**

### **Dashboard Layout**
```css
.wireframe-dashboard {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 250px 1fr 300px;
  min-height: 100vh;
  gap: var(--space-md);
}

@media (max-width: 768px) {
  .wireframe-dashboard {
    grid-template-areas:
      "header"
      "main"
      "footer";
    grid-template-columns: 1fr;
  }
}
```

### **Content Layouts**
```css
.wireframe-two-column {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-lg);
}

.wireframe-three-column {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.wireframe-hero {
  text-align: center;
  padding: var(--space-xxxl) var(--space-md);
  border-bottom: 1px solid var(--wireframe-black);
}
```

## 🎯 **Performance Standards**

### **Loading States**
```css
.wireframe-loading {
  border: 1px solid var(--wireframe-black);
  padding: var(--space-md);
  text-align: center;
  background-color: var(--wireframe-gray-light);
}

.wireframe-skeleton {
  background-color: var(--wireframe-gray-light);
  border: 1px solid var(--wireframe-black);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### **Performance Requirements**
- **CSS Bundle Size**: <50KB compressed
- **Render Time**: <100ms for component rendering
- **Animation Performance**: 60fps on mobile devices
- **Touch Response**: <50ms delay on touch events

## 🔧 **Implementation Guidelines**

### **CSS Organization**
```
/wireframe-styles/
├── base/
│   ├── reset.css
│   ├── typography.css
│   └── spacing.css
├── components/
│   ├── buttons.css
│   ├── forms.css
│   ├── navigation.css
│   └── cards.css
├── layouts/
│   ├── dashboard.css
│   ├── mobile.css
│   └── responsive.css
├── flag-football/
│   ├── performance.css
│   ├── training.css
│   └── olympics.css
└── wireframe.css (main entry point)
```

### **Component Naming Convention**
```css
/* Block Element Modifier (BEM) for wireframes */
.wireframe-[component] { /* Block */ }
.wireframe-[component]__[element] { /* Element */ }
.wireframe-[component]--[modifier] { /* Modifier */ }

/* Examples */
.wireframe-button { }
.wireframe-button__icon { }
.wireframe-button--primary { }
```

### **Research Integration Standards**
```css
/* Research-backed component variations */
.wireframe-metric--research-backed {
  border-left: 3px solid var(--wireframe-black);
}

.wireframe-prediction--high-confidence {
  border: 2px solid var(--wireframe-black);
}

.wireframe-recommendation--evidence-based::before {
  content: "📊 ";
  margin-right: var(--space-xs);
}
```

---

**🎯 This design system provides the complete foundation for consistent, professional wireframe implementation across all 28+ wireframe files, consolidated into a single maintainable reference.**