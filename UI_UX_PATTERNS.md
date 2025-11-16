# 🎨 FlagFit Pro - UI/UX Patterns Guide

*Comprehensive design system for data visualization and mobile-first responsive patterns*

---

## 📋 Overview

This guide provides complete patterns for building FlagFit Pro's user interface, combining data visualization best practices with mobile-first design principles. Every component is optimized for flag football athletes who primarily access the app on mobile devices during training.

---

## 🎨 Design System Foundation

### **Color System**

```css
:root {
  /* Brand Colors */
  --color-brand-primary: #10c96b;
  --color-brand-secondary: #89c300;
  --color-brand-tertiary: #cc9610;
  --color-brand-primary-alpha-10: rgba(16, 201, 107, 0.1);
  
  /* Status Colors */
  --status-success-50: #f0fff4;
  --status-success-600: #16a34a;
  --status-success-700: #15803d;
  --status-warning-500: #f59e0b;
  --status-error-50: #fef2f2;
  --status-error-500: #ef4444;
  --status-error-600: #dc2626;
  --status-error-700: #b91c1c;
  
  /* Neutral Colors */
  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;
  --text-primary: #171717;
  --text-secondary: #404040;
  --text-tertiary: #737373;
  --border-default: #e5e5e5;
  --border-strong: #d4d4d4;
}
```

### **Typography Scale**

```css
:root {
  /* Font Sizes */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  
  /* Font Weights */
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### **Responsive Breakpoints**

```css
:root {
  /* Mobile-First Breakpoints */
  --breakpoint-xs: 320px;   /* Portrait phones */
  --breakpoint-sm: 480px;   /* Landscape phones */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Small laptops */
  --breakpoint-xl: 1280px;  /* Desktops */
  --breakpoint-2xl: 1536px; /* Large desktops */
}

/* Media Query Usage */
@media (min-width: 480px) { /* sm and up */ }
@media (min-width: 768px) { /* md and up */ }
@media (min-width: 1024px) { /* lg and up */ }
```

### **Spacing System**

```css
:root {
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  --spacing-20: 80px;
}
```

---

## 📊 Data Visualization Components

### **1. Performance Line Chart**

**Use Case**: Track performance trends over time (speed, strength, endurance)

**HTML Structure**:
```html
<div class="chart-container">
  <div class="chart-header">
    <h3 class="chart-title">40-Yard Dash Progress</h3>
    <div class="chart-metric">
      <span class="metric-value">4.52s</span>
      <span class="metric-change metric-change--positive">
        <svg class="icon-arrow-up" width="16" height="16">
          <use href="#icon-arrow-up"></use>
        </svg>
        0.12s faster
      </span>
    </div>
  </div>
  
  <div class="chart-legend">
    <button class="legend-item legend-item--active" data-series="player">
      <span class="legend-indicator" style="background: var(--color-brand-primary)"></span>
      <span class="legend-label">Your Time</span>
    </button>
    <button class="legend-item" data-series="team">
      <span class="legend-indicator" style="background: var(--text-tertiary)"></span>
      <span class="legend-label">Team Average</span>
    </button>
  </div>
  
  <div class="chart-canvas" role="img" aria-label="Line chart showing 40-yard dash improvement from 4.64s to 4.52s over 12 weeks">
    <canvas id="performance-line-chart"></canvas>
  </div>
  
  <div class="chart-footer">
    <span class="chart-caption">Last 12 weeks • Updated 2 hours ago</span>
  </div>
</div>
```

**CSS Styles**:
```css
.chart-container {
  background: var(--surface-primary);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-6);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-4);
}

.chart-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.chart-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-1);
}

.metric-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.metric-change {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: 8px;
}

.metric-change--positive {
  color: var(--status-success-700);
  background: var(--status-success-50);
}

.metric-change--negative {
  color: var(--status-error-700);
  background: var(--status-error-50);
}

.chart-canvas {
  height: 300px;
  margin: var(--spacing-4) 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: var(--spacing-3);
  }
  
  .chart-metric {
    align-items: flex-start;
  }
  
  .chart-canvas {
    height: 240px;
  }
}
```

**Chart.js v4.4+ Configuration**:
```javascript
const performanceLineChart = {
  type: 'line',
  data: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Your Time',
        data: [4.64, 4.62, 4.60, 4.59, 4.58, 4.52],
        borderColor: '#10c96b',
        backgroundColor: 'rgba(16, 201, 107, 0.1)',
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#10c96b',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: true
      },
      {
        label: 'Team Average',
        data: [4.70, 4.69, 4.68, 4.67, 4.66, 4.63],
        borderColor: '#d4d4d4',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.3,
        fill: false
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#171717',
        bodyColor: '#404040',
        borderColor: '#e5e5e5',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return value.toFixed(2) + 's';
          },
          color: '#737373',
          font: { size: 12 }
        },
        grid: {
          color: '#f0f0f0',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: '#737373',
          font: { size: 12 },
          maxRotation: 0
        },
        grid: { display: false }
      }
    }
  }
};
```

### **2. Skills Radar Chart**

**Use Case**: Show athlete's skill levels across multiple dimensions

**HTML Structure**:
```html
<div class="chart-container">
  <div class="chart-header">
    <h3 class="chart-title">Skills Assessment</h3>
    <button class="btn-secondary btn-sm">View Details</button>
  </div>
  
  <div class="radar-chart-wrapper">
    <canvas id="skills-radar-chart"></canvas>
  </div>
  
  <div class="skills-summary">
    <div class="skill-item">
      <span class="skill-name">Speed</span>
      <span class="skill-score">85/100</span>
    </div>
    <div class="skill-item">
      <span class="skill-name">Agility</span>
      <span class="skill-score">78/100</span>
    </div>
    <div class="skill-item">
      <span class="skill-name">Endurance</span>
      <span class="skill-score">88/100</span>
    </div>
  </div>
</div>
```

**Chart.js Radar Configuration**:
```javascript
const radarChartConfig = {
  type: 'radar',
  data: {
    labels: ['Speed', 'Agility', 'Strength', 'Endurance', 'Technique', 'Game IQ'],
    datasets: [{
      label: 'Current Level',
      data: [85, 78, 72, 88, 75, 82],
      backgroundColor: 'rgba(16, 201, 107, 0.2)',
      borderColor: '#10c96b',
      borderWidth: 2,
      pointBackgroundColor: '#10c96b',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          stepSize: 20,
          color: '#737373'
        },
        grid: {
          color: '#f0f0f0'
        },
        pointLabels: {
          color: '#404040',
          font: { size: 13, weight: '500' }
        }
      }
    },
    plugins: {
      legend: { display: false }
    }
  }
};
```

### **3. Performance Stats Cards**

**HTML Structure**:
```html
<div class="stat-cards-grid">
  <div class="stat-card stat-card--primary">
    <div class="stat-icon">
      <svg width="24" height="24"><use href="#icon-zap"></use></svg>
    </div>
    <div class="stat-content">
      <span class="stat-label">Performance Score</span>
      <span class="stat-value">87</span>
      <span class="stat-change stat-change--positive">
        <svg width="12" height="12"><use href="#icon-arrow-up"></use></svg>
        +5 this week
      </span>
    </div>
  </div>
  
  <div class="stat-card">
    <div class="stat-icon">
      <svg width="24" height="24"><use href="#icon-activity"></use></svg>
    </div>
    <div class="stat-content">
      <span class="stat-label">Training Sessions</span>
      <span class="stat-value">24</span>
      <span class="stat-change stat-change--positive">
        <svg width="12" height="12"><use href="#icon-arrow-up"></use></svg>
        +3 this month
      </span>
    </div>
  </div>
  
  <div class="stat-card">
    <div class="stat-icon">
      <svg width="24" height="24"><use href="#icon-target"></use></svg>
    </div>
    <div class="stat-content">
      <span class="stat-label">Goals Achieved</span>
      <span class="stat-value">12/15</span>
      <div class="stat-progress">
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: 80%"></div>
        </div>
        <span class="progress-text">80%</span>
      </div>
    </div>
  </div>
</div>
```

**CSS Styles**:
```css
.stat-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

@media (min-width: 768px) {
  .stat-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .stat-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  display: flex;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  background: var(--surface-primary);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  transition: all 200ms ease;
}

.stat-card:hover {
  border-color: var(--border-strong);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card--primary {
  background: linear-gradient(135deg, var(--color-brand-primary) 0%, #0ea55a 100%);
  color: #ffffff;
  border-color: transparent;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--surface-secondary);
  border-radius: 12px;
  flex-shrink: 0;
  color: var(--color-brand-primary);
}

.stat-card--primary .stat-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.stat-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.stat-card--primary .stat-label {
  color: rgba(255, 255, 255, 0.9);
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-card--primary .stat-value {
  color: #ffffff;
}

.progress-bar {
  height: 6px;
  background: var(--surface-secondary);
  border-radius: 3px;
  overflow: hidden;
  margin: var(--spacing-1) 0;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-brand-primary);
  border-radius: 3px;
  transition: width 300ms ease;
}
```

---

## 📱 Mobile-First Patterns

### **Touch Target Guidelines**

```css
:root {
  /* Touch target sizes */
  --touch-target-min: 44px;         /* iOS minimum */
  --touch-target-comfortable: 48px;  /* Comfortable size */
  --touch-target-large: 56px;       /* Primary actions */
  --touch-spacing-min: 8px;         /* Minimum between targets */
}

/* Button hierarchy */
.btn {
  min-height: var(--touch-target-comfortable);
  min-width: var(--touch-target-comfortable);
  padding: 12px 24px;
  font-size: 16px; /* Prevents iOS zoom */
  border-radius: 8px;
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-lg {
  min-height: var(--touch-target-large);
  padding: 16px 32px;
  font-size: 18px;
}

.btn-sm {
  min-height: var(--touch-target-min);
  padding: 8px 16px;
  font-size: 14px;
}

.btn-icon {
  width: var(--touch-target-comfortable);
  height: var(--touch-target-comfortable);
  padding: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### **Bottom Navigation**

**HTML Structure**:
```html
<nav class="bottom-nav" role="navigation" aria-label="Main navigation">
  <a href="/dashboard" class="bottom-nav-item bottom-nav-item--active" aria-current="page">
    <svg class="bottom-nav-icon" width="24" height="24">
      <use href="#icon-home"></use>
    </svg>
    <span class="bottom-nav-label">Home</span>
  </a>
  
  <a href="/training" class="bottom-nav-item">
    <svg class="bottom-nav-icon" width="24" height="24">
      <use href="#icon-activity"></use>
    </svg>
    <span class="bottom-nav-label">Training</span>
  </a>
  
  <a href="/analytics" class="bottom-nav-item">
    <svg class="bottom-nav-icon" width="24" height="24">
      <use href="#icon-bar-chart"></use>
    </svg>
    <span class="bottom-nav-label">Analytics</span>
  </a>
  
  <a href="/roster" class="bottom-nav-item">
    <svg class="bottom-nav-icon" width="24" height="24">
      <use href="#icon-users"></use>
    </svg>
    <span class="bottom-nav-label">Team</span>
  </a>
  
  <a href="/profile" class="bottom-nav-item">
    <svg class="bottom-nav-icon" width="24" height="24">
      <use href="#icon-user"></use>
    </svg>
    <span class="bottom-nav-label">Profile</span>
  </a>
</nav>
```

**CSS Styles**:
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: var(--surface-primary);
  border-top: 1px solid var(--border-default);
  padding: 8px 0;
  z-index: 50;
  /* Safe area for iPhone notch */
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  min-width: 64px;
  text-decoration: none;
  color: var(--text-secondary);
  border-radius: 8px;
  transition: all 200ms ease;
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav-item:active {
  transform: scale(0.95);
}

.bottom-nav-item--active {
  color: var(--color-brand-primary);
  background: var(--color-brand-primary-alpha-10);
}

.bottom-nav-icon {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
}

.bottom-nav-label {
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
}

/* Hide on desktop - use sidebar instead */
@media (min-width: 1024px) {
  .bottom-nav {
    display: none;
  }
}
```

### **Mobile Form Optimization**

**HTML Structure**:
```html
<form class="mobile-form">
  <div class="form-group">
    <label for="athlete-name" class="form-label">Athlete Name</label>
    <input
      type="text"
      id="athlete-name"
      name="athlete-name"
      class="form-input"
      placeholder="Enter full name"
      autocomplete="name"
      autocapitalize="words"
      required
    />
  </div>
  
  <div class="form-group">
    <label for="email" class="form-label">Email Address</label>
    <input
      type="email"
      id="email"
      name="email"
      class="form-input"
      placeholder="athlete@example.com"
      autocomplete="email"
      inputmode="email"
      required
    />
  </div>
  
  <div class="form-group">
    <label for="weight" class="form-label">Weight (lbs)</label>
    <input
      type="number"
      id="weight"
      name="weight"
      class="form-input"
      placeholder="180"
      inputmode="numeric"
      pattern="[0-9]*"
      min="100"
      max="400"
    />
  </div>
  
  <div class="form-group">
    <label for="position" class="form-label">Position</label>
    <select id="position" name="position" class="form-select">
      <option value="">Select position</option>
      <option value="qb">Quarterback</option>
      <option value="rb">Running Back</option>
      <option value="wr">Wide Receiver</option>
      <option value="db">Defensive Back</option>
    </select>
  </div>
  
  <button type="submit" class="btn-primary btn-lg btn-full-width">
    Save Athlete
  </button>
</form>
```

**CSS Styles**:
```css
.mobile-form {
  padding: var(--spacing-4);
  padding-bottom: calc(var(--spacing-20) + env(safe-area-inset-bottom));
}

.form-group {
  margin-bottom: var(--spacing-5);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-input,
.form-select {
  width: 100%;
  min-height: var(--touch-target-comfortable);
  padding: 12px 16px;
  font-size: 16px; /* Prevents iOS zoom */
  line-height: 1.5;
  color: var(--text-primary);
  background: var(--surface-primary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  transition: all 200ms ease;
  appearance: none;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px var(--color-brand-primary-alpha-10);
}

.form-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23404040' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 44px;
}

.btn-full-width {
  width: 100%;
  justify-content: center;
}

/* Sticky submit button on mobile */
@media (max-width: 768px) {
  .mobile-form .btn-primary {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0;
    border-radius: 0;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    z-index: 40;
  }
}
```

### **Responsive Card Layouts**

```css
/* Mobile-first card grid */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-5);
    padding: var(--spacing-6);
  }
}

/* Desktop: 3+ columns */
@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-6);
  }
}

@media (min-width: 1280px) {
  .card-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### **Horizontal Scroll Cards**

**HTML Structure**:
```html
<div class="horizontal-scroll-container">
  <h3 class="section-title">Recent Workouts</h3>
  
  <div class="horizontal-scroll">
    <div class="workout-card">
      <h4 class="workout-title">Speed Training</h4>
      <p class="workout-date">Today, 2:30 PM</p>
      <div class="workout-stats">
        <span class="stat">45 min</span>
        <span class="stat">High intensity</span>
      </div>
    </div>
    
    <div class="workout-card">
      <h4 class="workout-title">Agility Drills</h4>
      <p class="workout-date">Yesterday</p>
      <div class="workout-stats">
        <span class="stat">30 min</span>
        <span class="stat">Medium intensity</span>
      </div>
    </div>
    
    <!-- More cards -->
  </div>
</div>
```

**CSS Styles**:
```css
.horizontal-scroll-container {
  margin: var(--spacing-6) 0;
}

.section-title {
  padding: 0 var(--spacing-4);
  margin-bottom: var(--spacing-3);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.horizontal-scroll {
  display: flex;
  gap: var(--spacing-4);
  overflow-x: auto;
  padding: 0 var(--spacing-4);
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.workout-card {
  flex: 0 0 280px;
  scroll-snap-align: start;
  background: var(--surface-primary);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: var(--spacing-4);
}

.workout-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-1) 0;
}

.workout-date {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-3) 0;
}

.workout-stats {
  display: flex;
  gap: var(--spacing-2);
}

.stat {
  font-size: var(--font-size-xs);
  padding: 4px 8px;
  background: var(--surface-secondary);
  border-radius: 4px;
  color: var(--text-secondary);
}

/* Desktop: Show grid instead of scroll */
@media (min-width: 1024px) {
  .horizontal-scroll {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    overflow-x: visible;
  }
}
```

---

## 🎨 Component Library

### **Button Components**

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  min-height: var(--touch-target-comfortable);
  padding: 12px 24px;
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 200ms ease;
  -webkit-tap-highlight-color: transparent;
}

.btn-primary {
  background: var(--color-brand-primary);
  color: #ffffff;
  border-color: var(--color-brand-primary);
}

.btn-primary:hover {
  background: #0ea55a;
  border-color: #0ea55a;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-secondary {
  background: var(--surface-primary);
  color: var(--text-primary);
  border-color: var(--border-default);
}

.btn-secondary:hover {
  background: var(--surface-secondary);
  border-color: var(--border-strong);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: transparent;
}

.btn-ghost:hover {
  background: var(--surface-secondary);
  color: var(--text-primary);
}
```

### **Loading States**

```css
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-text {
  height: 1em;
  border-radius: 4px;
  margin-bottom: 0.5em;
}

.skeleton-text--short {
  width: 60%;
}

.skeleton-text--medium {
  width: 80%;
}
```

---

## ♿ Accessibility Guidelines

### **Color Contrast**
- Text on background: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

### **Focus Management**
```css
.focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}

.btn:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}
```

### **Screen Reader Support**
```html
<!-- Chart accessibility -->
<div role="img" aria-label="Chart showing performance improvement over time">
  <canvas id="chart"></canvas>
</div>

<!-- Hidden data table for screen readers -->
<table class="visually-hidden">
  <caption>Performance data by week</caption>
  <thead>
    <tr><th>Week</th><th>Time (seconds)</th></tr>
  </thead>
  <tbody>
    <tr><td>Week 1</td><td>4.64</td></tr>
  </tbody>
</table>

<!-- Loading state announcement -->
<div aria-live="polite" aria-atomic="true" class="visually-hidden">
  <span id="loading-status">Loading chart data...</span>
</div>
```

### **Utility Classes**
```css
.visually-hidden {
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

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  z-index: 1000;
  padding: 8px;
  background: var(--color-brand-primary);
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.skip-link:focus {
  top: 6px;
}
```

---

## 📱 Safe Areas & Device Support

```css
:root {
  --safe-area-top: env(safe-area-inset-top, 0);
  --safe-area-bottom: env(safe-area-inset-bottom, 0);
  --safe-area-left: env(safe-area-inset-left, 0);
  --safe-area-right: env(safe-area-inset-right, 0);
}

/* Fixed header with notch support */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding-top: var(--safe-area-top);
  background: var(--surface-primary);
  z-index: 50;
}

/* Bottom navigation with home indicator support */
.bottom-nav {
  padding-bottom: calc(8px + var(--safe-area-bottom));
}

/* Full-screen modal */
.modal-fullscreen {
  padding: var(--safe-area-top) var(--safe-area-right) var(--safe-area-bottom) var(--safe-area-left);
}
```

---

## 🚀 Performance Best Practices

### **Lazy Loading**
```javascript
// Intersection Observer for charts
const chartObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadChart(entry.target);
      chartObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '50px' });

// Observe all chart containers
document.querySelectorAll('.chart-canvas').forEach(chart => {
  chartObserver.observe(chart);
});
```

### **Image Optimization**
```html
<!-- Responsive images -->
<img
  src="athlete-400.webp"
  srcset="
    athlete-400.webp 400w,
    athlete-800.webp 800w
  "
  sizes="
    (max-width: 480px) 100vw,
    (max-width: 768px) 50vw,
    400px
  "
  alt="Athlete training"
  loading="lazy"
  decoding="async"
/>
```

---

## ✅ Quality Checklist

### **Mobile Testing**
- [ ] Touch targets ≥ 44px
- [ ] Forms prevent zoom (font-size ≥ 16px)
- [ ] Safe areas respected
- [ ] Bottom nav doesn't overlap content
- [ ] Works in landscape/portrait
- [ ] Gestures don't interfere with browser

### **Performance**
- [ ] Charts load in < 500ms
- [ ] Images optimized and lazy-loaded
- [ ] No layout shift during loading
- [ ] Smooth 60fps animations
- [ ] Bundle size minimized

### **Accessibility**
- [ ] Color contrast ≥ 4.5:1
- [ ] Keyboard navigation works
- [ ] Screen reader support
- [ ] Focus indicators visible
- [ ] Semantic HTML structure

### **Cross-Device**
- [ ] iPhone SE (375×667)
- [ ] iPhone 14 Pro (393×852)
- [ ] Samsung Galaxy (360×760)
- [ ] iPad Mini (768×1024)
- [ ] Desktop (1280×720)

---

**Last Updated**: November 16, 2024  
**Version**: 2.0  
**Maintained By**: FlagFit Pro Design Team

*This guide combines data visualization excellence with mobile-first responsive design for optimal athletic performance tracking.*