# Empty State & Data Source Components - Usage Guide

## Overview

This guide demonstrates how to use the enhanced `app-empty-state`, `app-data-source-banner`, and `app-skeleton-loader` components for consistent UX across the application.

---

## 1. Empty State Component

### Basic Usage

```typescript
<app-empty-state
  title="No Training Sessions Yet"
  message="Start logging your sessions to track your progress and prevent injuries"
  icon="pi-inbox"
  actionLabel="Log Your First Session"
  actionLink="/training/log"
  actionIcon="pi-plus"
/>
```

### With Secondary Action

```typescript
<app-empty-state
  title="No Performance Data"
  message="Run a performance test to track your speed, strength, and agility"
  icon="pi-chart-line"
  actionLabel="Take Performance Test"
  [actionHandler]="startTest"
  actionIcon="pi-bolt"
  secondaryActionLabel="Learn More"
  secondaryActionLink="/docs/performance-testing"
  secondaryActionIcon="pi-info-circle"
/>
```

### With Benefits List

```typescript
<app-empty-state
  title="Join a Team"
  message="Connect with other athletes and compete together"
  icon="pi-users"
  [benefits]="[
    'Compare stats with teammates',
    'Compete in team challenges',
    'Share training plans',
    'Get coach feedback'
  ]"
  actionLabel="Browse Teams"
  actionLink="/teams"
  actionIcon="pi-search"
  helpText="How does team membership work?"
  helpLink="/help/teams"
/>
```

### Compact Mode

```typescript
<app-empty-state
  [compact]="true"
  title="No Recent Activity"
  message="You haven't logged any sessions this week"
  icon="pi-calendar-times"
  actionLabel="Log Session"
  actionLink="/training/log"
/>
```

---

## 2. Data Source Banner Component

### No Data State

```typescript
<app-data-source-banner
  [dataState]="DataState.NO_DATA"
  metricName="training sessions"
/>
```

**Result:**

- Gray gradient background
- "No Data" badge
- Message: "You haven't logged any training session data yet"

### Insufficient Data State

```typescript
<app-data-source-banner
  [dataState]="DataState.INSUFFICIENT_DATA"
  [currentDataPoints]="12"
  [minimumRequired]="28"
  metricName="training sessions"
  [warnings]="['ACWR calculations require at least 28 days of data']"
/>
```

**Result:**

- Yellow/orange gradient background
- "Limited Data" badge
- Progress bar showing 12/28 days
- Warning message displayed

### Real Data State (Optional)

```typescript
<app-data-source-banner
  [dataState]="DataState.REAL_DATA"
  [showWhenReal]="true"
  metricName="training sessions"
/>
```

**Result:**

- Green gradient background
- "Live Data" badge
- Success message

### With Dismissible Option

```typescript
<app-data-source-banner
  [dataState]="DataState.INSUFFICIENT_DATA"
  [currentDataPoints]="20"
  [minimumRequired]="28"
  [showDismiss]="true"
/>
```

**Result:**

- Shows dismiss button (X) in top-right
- Banner hides when dismissed

---

## 3. Skeleton Loader Component

### Text Skeletons

```typescript
<!-- Single line -->
<app-skeleton-loader variant="text" width="100%" />

<!-- Title -->
<app-skeleton-loader variant="title" width="60%" />

<!-- Paragraph -->
<app-skeleton-loader variant="paragraph" />
```

### Card Skeleton

```typescript
<app-skeleton-loader variant="card" />
```

### Stat Card Skeleton

```typescript
<app-skeleton-loader variant="stat-card" />
```

### Workout Card Skeleton

```typescript
<app-skeleton-loader variant="workout-card" />
```

### Chart Skeleton

```typescript
<app-skeleton-loader variant="chart" />
```

### List of Skeletons (with stagger animation)

```typescript
<app-skeleton-repeat
  variant="list-item"
  [count]="5"
  [staggerDelay]="75"
/>
```

### Dashboard Widget Skeleton

```typescript
<app-skeleton-loader variant="dashboard-widget" />
```

---

## 4. Complete Loading/Empty Pattern

### Training Log with All States

```typescript
@Component({
  template: `
    <app-main-layout>
      <app-page-header title="Training Sessions" />

      <!-- Data Source Banner -->
      <app-data-source-banner
        [dataState]="dataState()"
        [currentDataPoints]="sessions().length"
        [minimumRequired]="28"
        metricName="training sessions"
      />

      <!-- Loading State -->
      @if (loading()) {
        <app-skeleton-repeat
          variant="workout-card"
          [count]="3"
          [staggerDelay]="100"
        />
      }

      <!-- Empty State -->
      @else if (sessions().length === 0) {
        <app-empty-state
          title="No Training Sessions Yet"
          message="Start logging your sessions to track load and prevent injuries"
          icon="pi-inbox"
          iconColor="var(--color-text-muted)"
          [benefits]="[
            'Track training load with RPE',
            'Calculate ACWR automatically',
            'Prevent overtraining injuries',
            'View progress over time',
          ]"
          actionLabel="Log Your First Session"
          actionLink="/training/log"
          actionIcon="pi-plus"
          helpText="What is sRPE training load?"
          helpLink="/help/training-load"
        />
      }

      <!-- Data Display -->
      @else {
        @for (session of sessions(); track session.id) {
          <app-workout-card [session]="session" />
        }
      }
    </app-main-layout>
  `,
})
export class TrainingLogComponent {
  loading = signal(false);
  sessions = signal<TrainingSession[]>([]);
  dataState = computed(() => {
    if (this.sessions().length === 0) return DataState.NO_DATA;
    if (this.sessions().length < 28) return DataState.INSUFFICIENT_DATA;
    return DataState.REAL_DATA;
  });
}
```

---

## 5. Dashboard Pattern

```typescript
@Component({
  template: `
    <app-main-layout>
      <app-page-header title="Dashboard" />

      <!-- Data Source Banner (only show if not real data) -->
      <app-data-source-banner
        [dataState]="dataState()"
        [currentDataPoints]="trainingDays()"
        [minimumRequired]="28"
        metricName="metrics"
      />

      <!-- Loading Skeletons -->
      @if (loading()) {
        <div class="dashboard-grid">
          <app-skeleton-loader variant="stat-card" />
          <app-skeleton-loader variant="stat-card" />
          <app-skeleton-loader variant="stat-card" />
          <app-skeleton-loader variant="stat-card" />
        </div>

        <app-skeleton-loader variant="chart" />

        <app-skeleton-loader variant="dashboard-widget" />
      }

      <!-- Dashboard Content -->
      @else {
        <div class="dashboard-grid">
          @for (metric of metrics(); track metric.label) {
            <app-stat-card [metric]="metric" />
          }
        </div>

        <app-performance-chart [data]="chartData()" />

        <app-recent-activity [sessions]="recentSessions()" />
      }
    </app-main-layout>
  `
})
```

---

## 6. Analytics Page Pattern

```typescript
@Component({
  template: `
    <app-main-layout>
      <app-page-header title="Performance Analytics" />

      <!-- Loading State -->
      @if (loading()) {
        <div class="analytics-layout">
          <app-skeleton-loader variant="chart" />
          <app-skeleton-loader variant="chart" />
          <app-skeleton-loader variant="dashboard-widget" />
        </div>
      }

      <!-- Empty State (no data at all) -->
      @else if (dataState() === DataState.NO_DATA) {
        <app-empty-state
          title="No Performance Data Available"
          message="Log training sessions and run performance tests to see your analytics"
          icon="pi-chart-bar"
          [benefits]="[
            'Track performance trends over time',
            'Identify strengths and weaknesses',
            'Compare against team averages',
            'Set data-driven goals'
          ]"
          actionLabel="Log Training Session"
          actionLink="/training/log"
          actionIcon="pi-plus"
          secondaryActionLabel="Run Performance Test"
          secondaryActionLink="/performance/test"
          secondaryActionIcon="pi-bolt"
        />
      }

      <!-- Data with Banner (insufficient) -->
      @else {
        <app-data-source-banner
          [dataState]="dataState()"
          [currentDataPoints]="dataPoints()"
          [minimumRequired]="28"
          metricName="performance tests"
          [warnings]="[
            'Trends require 28+ days for accuracy',
            'Weekly comparisons need 4+ weeks'
          ]"
        />

        <!-- Charts display here -->
        <app-performance-charts [data]="analyticsData()" />
      }
    </app-main-layout>
  `
})
```

---

## 7. Style Customization

### Empty State Custom Styling

```scss
.empty-state {
  // Override compact padding
  &.my-compact {
    padding: var(--space-4);
    min-height: 150px;
  }

  // Custom icon color
  .empty-icon {
    color: var(--ds-primary-green);
    opacity: 0.7;
  }
}
```

### Data Banner Custom Colors

```scss
.data-source-banner {
  // Custom gradient for demo state
  &.demo {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  }
}
```

---

## 8. Best Practices

### ✅ DO

- **Use empty states everywhere there could be no data**
- **Show loading skeletons while fetching data**
- **Display data source banner when data is insufficient**
- **Provide clear action buttons** ("Log Session", "Take Test")
- **Use benefits lists to explain value**
- **Show progress bars for insufficient data**

### ❌ DON'T

- Don't show generic "Loading..." text - use skeletons
- Don't hide that data is insufficient - be transparent
- Don't use empty states without action buttons
- Don't make users guess what to do next
- Don't show mock data without labeling it
- Don't use spinner icons - use skeleton loaders

---

## 9. Data State Enum

```typescript
export enum DataState {
  NO_DATA = "NO_DATA", // No data logged yet
  INSUFFICIENT_DATA = "INSUFFICIENT_DATA", // <28 days
  REAL_DATA = "REAL_DATA", // 28+ days, reliable
}
```

### Determining Data State

```typescript
const dataState = computed(() => {
  const dayCount = sessions().length;

  if (dayCount === 0) return DataState.NO_DATA;
  if (dayCount < 28) return DataState.INSUFFICIENT_DATA;
  return DataState.REAL_DATA;
});
```

---

## 10. Accessibility

All components are WCAG 2.1 AA compliant:

- ✅ Focus indicators on all interactive elements
- ✅ Proper ARIA labels
- ✅ Keyboard navigation support
- ✅ Color contrast meets 4.5:1 minimum
- ✅ Screen reader announcements for state changes
- ✅ Reduced motion support (`@prefers-reduced-motion`)

---

## 11. Testing Checklist

When implementing empty states:

- [ ] Empty state shows when `data.length === 0`
- [ ] Skeleton loaders show while `loading === true`
- [ ] Data source banner shows for insufficient data
- [ ] Action buttons work and navigate correctly
- [ ] Benefits list displays properly
- [ ] Help links point to correct documentation
- [ ] Mobile responsive (full-width buttons)
- [ ] Loading → Empty → Data transitions smoothly
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Focus management for keyboard users

---

## 12. Migration Example

### Before (Plain Text)

```typescript
@if (sessions().length === 0) {
  <p>No training sessions found.</p>
}
```

### After (Enhanced Empty State)

```typescript
@if (loading()) {
  <app-skeleton-repeat variant="workout-card" [count]="3" />
} @else if (sessions().length === 0) {
  <app-empty-state
    title="No Training Sessions Yet"
    message="Start logging to track your progress"
    icon="pi-inbox"
    actionLabel="Log Session"
    actionLink="/training/log"
    actionIcon="pi-plus"
  />
} @else {
  @for (session of sessions(); track session.id) {
    <app-workout-card [session]="session" />
  }
}
```

---

## Summary

Using these components consistently:

- ✅ Improves perceived performance (skeletons vs spinners)
- ✅ Provides clear guidance to users (actionable empty states)
- ✅ Maintains transparency (data source banners)
- ✅ Enhances accessibility (WCAG compliant)
- ✅ Creates professional UX (smooth transitions)

---

**Last Updated:** January 9, 2026  
**Components:** v2.0.0 (Angular 21 + Signals)
