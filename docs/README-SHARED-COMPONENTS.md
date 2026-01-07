# Advanced UX/UI Components

This directory contains advanced sports-specific components designed to elevate FlagFit Pro to professional-grade standards.

## Components

### 1. Performance Dashboard (`performance-dashboard`)

A real-time performance monitoring dashboard with interactive metrics, trend indicators, and visualizations.

**Features:**

- Real-time metric updates (configurable interval)
- Interactive knob displays for key metrics
- Progress bars showing goal completion
- Mini trend charts for each metric
- Radar chart overview of all performance dimensions

**Usage:**

```typescript
import { PerformanceDashboardComponent } from '@app/shared/components/performance-dashboard/performance-dashboard.component';

@Component({
  imports: [PerformanceDashboardComponent],
  template: `
    <app-performance-dashboard
      [athleteId]="'athlete-123'"
      [realTimeEnabled]="true">
    </app-performance-dashboard>
  `
})
```

**Inputs:**

- `athleteId?: string` - Optional athlete ID for filtering metrics
- `realTimeEnabled: boolean` - Enable/disable real-time updates (default: true)

---

### 2. Training Builder (`training-builder`)

An AI-powered smart training session builder with multi-step wizard interface.

**Features:**

- Step-by-step session creation wizard
- Goal-based exercise selection
- Weather-aware recommendations
- AI-generated exercise suggestions
- Interactive timeline view of generated session
- Equipment-based filtering

**Usage:**

```typescript
import { TrainingBuilderComponent } from '@app/shared/components/training-builder/training-builder.component';

@Component({
  imports: [TrainingBuilderComponent],
  template: `<app-training-builder></app-training-builder>`
})
```

**Features:**

- Three-step wizard: Goals → Parameters → Generated Session
- Real-time weather integration
- AI-powered exercise recommendations
- Session preview and modification

---

### 3. Swipe Table (`swipe-table`)

A mobile-optimized table component with swipe gestures for row actions.

**Features:**

- Touch-friendly swipe gestures (mobile only)
- Edit and delete actions on swipe
- Responsive design (desktop shows actions always visible)
- Accessible keyboard navigation

**Usage:**

```typescript
import { SwipeTableComponent } from '@app/shared/components/swipe-table/swipe-table.component';

@Component({
  imports: [SwipeTableComponent],
  template: `
    <app-swipe-table
      [data]="tableData"
      [columns]="columns"
      [onEdit]="handleEdit"
      [onDelete]="handleDelete">
    </app-swipe-table>
  `
})
```

**Inputs:**

- `data: Signal<any[]>` - Table data array
- `columns: Signal<Array<{field: string, header: string}>>` - Column definitions
- `onEdit?: (row: any) => void` - Edit callback
- `onDelete?: (row: any) => void` - Delete callback

---

### 4. Training Heatmap (`training-heatmap`)

An interactive heatmap visualization for training load over time periods.

**Features:**

- Calendar-style heatmap grid
- Toggle between intensity and volume views
- Time range selection (3/6/12 months)
- Click cells for detailed information
- Color-coded intensity levels
- Accessible keyboard navigation

**Usage:**

```typescript
import { TrainingHeatmapComponent } from '@app/shared/components/training-heatmap/training-heatmap.component';

@Component({
  imports: [TrainingHeatmapComponent],
  template: `<app-training-heatmap></app-training-heatmap>`
})
```

**Features:**

- Visual representation of training consistency
- Detailed modal on cell click
- Legend for intensity levels
- Responsive grid layout

---

## Design Principles

All components follow these principles:

1. **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and ARIA labels
2. **Responsive**: Mobile-first design with breakpoints at 768px
3. **Performance**: OnPush change detection strategy for optimal performance
4. **Type Safety**: Full TypeScript support with interfaces and types
5. **PrimeNG Integration**: Built on PrimeNG 19 components for consistency

## Dependencies

All components require:

- Angular 19+
- PrimeNG 19+
- PrimeIcons
- Chart.js (for chart components)

## Styling

Components use CSS custom properties (CSS variables) for theming:

- `--p-primary-color` - Primary brand color
- `--p-surface-border` - Border colors
- `--p-text-color` - Text colors
- `--p-border-radius` - Border radius values

Customize these in your global styles or theme configuration.
