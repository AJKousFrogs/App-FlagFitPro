# Modern UI Component Examples

This document shows how to use the new modern design system components inspired by Kraken's aesthetic.

## Modern Session Card

Replace your old text lists with visual cards:

```html
<div class="card-session">
  <!-- Accent bar at top -->
  <div class="card-accent-bar"></div>

  <!-- Header with icon -->
  <div class="card-header">
    <div class="card-icon">
      <i data-lucide="activity" style="width: 24px; height: 24px;"></i>
    </div>
    <div class="card-title-group">
      <h3 class="card-title">Active Recovery + Mobility</h3>
      <p class="card-meta">
        <span class="badge badge-info">
          <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
          Today at 5:30 PM
        </span>
      </p>
    </div>
  </div>

  <!-- Body with metadata -->
  <div class="card-body">
    <div class="meta-row">
      <span class="meta-label">Duration</span>
      <span class="meta-value">50 minutes</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Athletes</span>
      <span class="meta-value">12 registered</span>
    </div>
  </div>

  <!-- Footer with action -->
  <div class="card-footer">
    <button class="btn btn-primary btn-sm full-width">Start Session</button>
  </div>
</div>
```

## Hero Section

Create a modern hero section with gradients:

```html
<section class="hero-section">
  <!-- Left: Next Session -->
  <div class="hero-card">
    <div class="hero-label">Today's Focus</div>
    <div class="hero-title">
      <i data-lucide="calendar-check" style="width: 28px; height: 28px;"></i>
      Next Session
    </div>

    <!-- Session Card inside Hero -->
    <div class="hero-session">
      <div class="session-header">
        <h3>Active Recovery + Mobility</h3>
        <span class="badge-time">
          <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
          Today at 5:30 PM
        </span>
      </div>
      <div class="session-details">
        <span class="detail-item">
          <i data-lucide="clock" style="width: 16px; height: 16px;"></i>
          50 minutes
        </span>
      </div>
      <button class="btn btn-primary btn-lg full-width">Start Training</button>
    </div>
  </div>

  <!-- Right: Progress Ring -->
  <div class="hero-card hero-card-stat">
    <div class="hero-label">Weekly Progress</div>
    <div class="hero-stat">
      <!-- SVG Circular Progress -->
      <svg class="progress-ring" width="180" height="180">
        <circle cx="90" cy="90" r="80" class="progress-bg"></circle>
        <circle
          cx="90"
          cy="90"
          r="80"
          class="progress-fill"
          style="stroke-dasharray: 502.6; stroke-dashoffset: 125.65;"
        ></circle>
      </svg>
      <div class="progress-text">
        <div class="progress-value">75%</div>
        <div class="progress-change">↗ +12% from last week</div>
      </div>
    </div>
  </div>
</section>
```

## Dashboard Grid

Use the modern dashboard grid system:

```html
<div class="dashboard-grid">
  <!-- Wide card (2/3 width) -->
  <div class="dashboard-item span-2">
    <div class="hero-card">
      <!-- Session content -->
    </div>
  </div>

  <!-- Tall card (1/3 width, 2x height) -->
  <div class="dashboard-item span-1 tall">
    <div class="card stat-card">
      <div class="stat-label">Total Sessions</div>
      <div class="stat-value">142</div>
      <div class="stat-change">
        <i data-lucide="trending-up" style="width: 14px; height: 14px;"></i>
        +12% from last week
      </div>
    </div>
  </div>

  <!-- Regular cards -->
  <div class="dashboard-item">
    <div class="card">Training History</div>
  </div>

  <div class="dashboard-item">
    <div class="card">Weekly Schedule</div>
  </div>
</div>
```

## Modern Badges with Icons

```html
<div class="badge-group">
  <!-- Success badge -->
  <span class="badge badge-success">
    <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i>
    Completed
  </span>

  <!-- Warning badge -->
  <span class="badge badge-warning">
    <i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i>
    Pending
  </span>

  <!-- Info badge -->
  <span class="badge badge-info">
    <i data-lucide="info" style="width: 14px; height: 14px;"></i>
    12 Athletes
  </span>
</div>
```

## Chart Card

```html
<div class="card-chart">
  <div class="card-header">
    <h3>Performance Trend</h3>
    <select class="select-period">
      <option value="7days">Last 7 days</option>
      <option value="30days">Last 30 days</option>
      <option value="90days">Last 90 days</option>
    </select>
  </div>

  <div class="chart-container">
    <canvas id="performance-chart"></canvas>
  </div>
</div>
```

## Stat Card

```html
<div class="stat-card">
  <div class="stat-label">Total Athletes</div>
  <div class="stat-value">247</div>
  <div class="stat-change">
    <i data-lucide="trending-up" style="width: 14px; height: 14px;"></i>
    +8% from last month
  </div>
</div>
```

## Loading Skeletons

```html
<!-- Text skeleton -->
<div class="skeleton skeleton-text"></div>
<div class="skeleton skeleton-text" style="width: 80%;"></div>

<!-- Title skeleton -->
<div class="skeleton skeleton-title"></div>

<!-- Card skeleton -->
<div class="skeleton skeleton-card"></div>
```

## Typography Classes

```html
<h1 class="heading-hero">Hero Title</h1>
<h2 class="heading-page">Page Title</h2>
<h3 class="heading-section">Section Title</h3>
<h4 class="heading-card">Card Title</h4>

<p class="body-lg">Large body text</p>
<p class="body">Regular body text</p>
<p class="body-sm">Small body text</p>

<span class="label">LABEL TEXT</span>
```

## Gradient Utilities

```html
<!-- Gradient background -->
<div class="gradient-primary">Content</div>
<div class="gradient-card">Content</div>

<!-- Gradient text -->
<h1 class="gradient-text">Gradient Text</h1>

<!-- Gradient border -->
<div class="gradient-border">Content</div>

<!-- Radial gradients -->
<div class="gradient-radial-primary">Content</div>
```

## Animation Classes

```html
<!-- Fade in animations -->
<div class="u-animate-fade-in">Fades in</div>
<div class="u-animate-fade-in-up">Fades in from bottom</div>

<!-- Glow effect -->
<div class="u-animate-glow">Glowing element</div>

<!-- Slide animations -->
<div class="u-animate-slide-in-right">Slides in from right</div>
```

## Key Design Principles

1. **Visual Hierarchy**: Use cards with icons, colors, and clear spacing
2. **Color Usage**: Strategic use of brand green with high contrast
3. **Whitespace**: Generous spacing for breathing room
4. **Typography**: Bold headlines with varied sizes
5. **Components**: Polished cards, badges, progress indicators
6. **Visual Interest**: Gradients, accent lines, micro-interactions
7. **Mobile-First**: Responsive grids that stack properly

## Migration Guide

### Before (Old UI)

```html
<div class="session-item">
  <p>Active Recovery + Mobility</p>
  <p>Today at 5:30 PM</p>
  <p>50 min</p>
</div>
```

### After (Modern UI)

```html
<div class="card-session">
  <div class="card-accent-bar"></div>
  <div class="card-header">
    <div class="card-icon">
      <i data-lucide="activity"></i>
    </div>
    <div class="card-title-group">
      <h3 class="card-title">Active Recovery + Mobility</h3>
      <p class="card-meta">
        <span class="badge badge-info">
          <i data-lucide="calendar"></i>
          Today at 5:30 PM
        </span>
      </p>
    </div>
  </div>
  <div class="card-body">
    <div class="meta-row">
      <span class="meta-label">Duration</span>
      <span class="meta-value">50 minutes</span>
    </div>
  </div>
</div>
```
