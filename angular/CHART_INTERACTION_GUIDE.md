# Chart Interaction & Customization Guide

**Version:** 1.0
**Date:** December 30, 2024
**Status:** ✅ Complete

---

## Overview

This guide covers the enhanced chart interactions and customization features for FlagFit Pro analytics charts. All charts now include zoom/pan, custom tooltips with trend data, legend toggling, real PNG export, and responsive font sizes.

---

## Features Implemented

### ✅ 1. Custom Tooltips with Trend Data

**Feature:**
- Shows data value
- Calculates and displays trend (↑ up, ↓ down, or stable)
- Shows percentage change
- Displays "Improving" or "Declining" status
- Click hint for drill-down

**Example:**
```
Performance Score: 91
Trend: ↑ 5.2%
Improving

Click to view details
```

**Implementation:**
```typescript
import { CUSTOM_TOOLTIP_CALLBACKS } from '@/shared/config/enhanced-chart.config';

chartOptions = {
  plugins: {
    tooltip: {
      callbacks: CUSTOM_TOOLTIP_CALLBACKS
    }
  }
};
```

---

### ✅ 2. Zoom & Pan Capabilities

**Feature:**
- Mouse wheel zoom on X-axis
- Pinch-to-zoom on touch devices
- Pan by holding Shift + drag
- Reset zoom button
- Minimum 2 data points always visible

**User Controls:**
- **Zoom In:** Scroll up with mouse wheel
- **Zoom Out:** Scroll down with mouse wheel
- **Pan:** Hold Shift + drag left/right
- **Reset:** Click "Reset Zoom" button

**Implementation:**
```typescript
import { ENHANCED_LINE_CHART_OPTIONS, resetChartZoom } from '@/shared/config/enhanced-chart.config';

// In component
chartOptions = ENHANCED_LINE_CHART_OPTIONS;

// Reset zoom programmatically
onResetZoom(): void {
  if (this.chartInstance) {
    resetChartZoom(this.chartInstance);
  }
}
```

---

### ✅ 3. Legend Toggling

**Feature:**
- Click legend items to show/hide datasets
- Visual indication when dataset is hidden
- Multiple datasets can be toggled independently
- Chart automatically rescales when datasets hidden

**User Controls:**
- **Toggle Dataset:** Click on legend label
- **Show All:** Click "Show All" button (if provided)

**Implementation:**
```typescript
// Legend onClick handler is built into enhanced config
chartOptions = ENHANCED_LINE_CHART_OPTIONS;

// Programmatically toggle dataset
import { toggleDataset } from '@/shared/config/enhanced-chart.config';

toggleDataset(chartInstance, datasetIndex);
```

---

### ✅ 4. Real PNG Export

**Feature:**
- Export chart as high-quality PNG image
- Includes timestamp in filename
- Preserves chart styling and colors
- Works on all devices

**User Controls:**
- **Export:** Click "Export" button → Downloads PNG

**Implementation:**
```typescript
import { exportChartAsPNG } from '@/shared/config/enhanced-chart.config';

exportChart(chartType: string): void {
  const chart = this.getChartInstance(chartType);
  if (chart) {
    exportChartAsPNG(chart, `${chartType}-analytics`);
  }
}
```

---

### ✅ 5. Responsive Font Sizes

**Feature:**
- Font sizes automatically adjust based on screen width
- Mobile: 75% of base size
- Tablet: 87.5% of base size
- Desktop: 100% of base size
- Updates on window resize

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Implementation:**
```typescript
import { updateChartFontSizes } from '@/shared/config/enhanced-chart.config';

@HostListener('window:resize')
onResize(): void {
  if (this.chartInstance) {
    updateChartFontSizes(this.chartInstance);
  }
}
```

---

### ✅ 6. onClick Drill-Down Handlers

**Feature:**
- Click on data points to view details
- Dispatches custom event with click data
- Can navigate to detailed view
- Shows loading state during navigation

**Implementation:**
```typescript
// In component template
<p-chart
  #chartRef
  type="line"
  [data]="chartData()"
  [options]="enhancedChartOptions"
  (chartClick)="onChartClick($event)"
/>

// In component class
onChartClick(event: CustomEvent): void {
  const { datasetLabel, dataLabel, value, datasetIndex, index } = event.detail;

  this.logger.info('Chart clicked:', event.detail);

  // Navigate to detailed view
  this.router.navigate(['/analytics/details'], {
    queryParams: {
      dataset: datasetLabel,
      point: dataLabel,
      value: value
    }
  });
}
```

---

## Chart Types & Options

### **Line Chart**

```typescript
import { ENHANCED_LINE_CHART_OPTIONS } from '@/shared/config/enhanced-chart.config';

chartOptions = ENHANCED_LINE_CHART_OPTIONS;
```

**Features:**
- Smooth curves (tension: 0.4)
- Hover effects on points
- Zoom/pan enabled
- Custom tooltips with trends

**Best For:**
- Performance trends over time
- Speed development progress
- Multi-metric comparisons

---

### **Bar Chart**

```typescript
import { ENHANCED_BAR_CHART_OPTIONS } from '@/shared/config/enhanced-chart.config';

chartOptions = ENHANCED_BAR_CHART_OPTIONS;
```

**Features:**
- Rounded bar corners
- Zoom/pan on X-axis
- Custom tooltips
- Legend toggling

**Best For:**
- Position performance comparison
- Category-based metrics
- Team statistics

---

### **Doughnut Chart**

```typescript
import { ENHANCED_DOUGHNUT_CHART_OPTIONS } from '@/shared/config/enhanced-chart.config';

chartOptions = ENHANCED_DOUGHNUT_CHART_OPTIONS;
```

**Features:**
- 65% cutout (donut shape)
- Legend on right side
- Custom tooltips
- Click to drill-down

**Best For:**
- Training session distribution
- Category percentages
- Resource allocation

---

### **Radar Chart**

```typescript
import { ENHANCED_RADAR_CHART_OPTIONS } from '@/shared/config/enhanced-chart.config';

chartOptions = ENHANCED_RADAR_CHART_OPTIONS;
```

**Features:**
- 0-10 scale with step 2
- Custom tooltips
- Multi-dataset comparison

**Best For:**
- Team chemistry analysis
- Multi-dimensional comparisons
- Skill assessments

---

## Component Integration

### **Full Example: Enhanced Analytics Chart**

```typescript
import { Component, ViewChild, HostListener, signal } from '@angular/core';
import { UIChart } from 'primeng/chart';
import {
  ENHANCED_LINE_CHART_OPTIONS,
  exportChartAsPNG,
  resetChartZoom,
  updateChartFontSizes
} from '@/shared/config/enhanced-chart.config';

@Component({
  selector: 'app-performance-chart',
  template: `
    <p-card>
      <ng-template pTemplate="header">
        <div class="chart-header">
          <h3>Performance Trends</h3>
          <div class="chart-actions">
            <p-button
              label="Reset Zoom"
              icon="pi pi-refresh"
              [outlined]="true"
              size="small"
              (onClick)="onResetZoom()"
            />
            <p-button
              label="Export PNG"
              icon="pi pi-download"
              [outlined]="true"
              size="small"
              (onClick)="onExportPNG()"
            />
          </div>
        </div>
      </ng-template>

      <p-chart
        #chartRef
        type="line"
        [data]="chartData()"
        [options]="chartOptions"
      />

      <div class="chart-help">
        <small>
          <i class="pi pi-info-circle"></i>
          Scroll to zoom, Shift+drag to pan, click legend to toggle datasets
        </small>
      </div>
    </p-card>
  `
})
export class PerformanceChartComponent {
  @ViewChild('chartRef') chartRef!: UIChart;

  chartData = signal<any>({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
    datasets: [
      {
        label: 'Performance Score',
        data: [78, 82, 80, 85, 87, 89, 91],
        borderColor: 'var(--color-brand-primary)',
        backgroundColor: 'var(--color-brand-primary-subtle)',
        fill: true
      }
    ]
  });

  chartOptions = ENHANCED_LINE_CHART_OPTIONS;

  get chartInstance() {
    return this.chartRef?.chart;
  }

  onResetZoom(): void {
    if (this.chartInstance) {
      resetChartZoom(this.chartInstance);
    }
  }

  onExportPNG(): void {
    if (this.chartInstance) {
      exportChartAsPNG(this.chartInstance, 'performance-trends');
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.chartInstance) {
      updateChartFontSizes(this.chartInstance);
    }
  }
}
```

---

## Chart Action Patterns

### **Export Chart as PNG**

```typescript
exportChart(chartType: string): void {
  const chart = this.getChartInstance(chartType);

  if (!chart) {
    this.toastService.error('Chart not available for export');
    return;
  }

  try {
    exportChartAsPNG(chart, `${chartType}-analytics`);
    this.toastService.success('Chart exported successfully');
  } catch (error) {
    this.logger.error('Export failed:', error);
    this.toastService.error('Failed to export chart');
  }
}
```

---

### **Reset Zoom**

```typescript
resetZoom(chartType: string): void {
  const chart = this.getChartInstance(chartType);

  if (!chart) return;

  resetChartZoom(chart);
  this.toastService.info('Zoom reset');
}
```

---

### **Handle Chart Click (Drill-Down)**

```typescript
onChartClick(event: CustomEvent): void {
  const { datasetLabel, dataLabel, value } = event.detail;

  // Show loading state
  this.isNavigating.set(true);

  // Navigate to details page
  this.router.navigate(['/analytics/details'], {
    queryParams: {
      metric: datasetLabel,
      date: dataLabel,
      value: value
    }
  }).finally(() => {
    this.isNavigating.set(false);
  });
}
```

---

### **Toggle All Datasets**

```typescript
toggleAllDatasets(show: boolean): void {
  const chart = this.chartInstance;
  if (!chart) return;

  chart.data.datasets.forEach((_, index) => {
    if (show) {
      chart.show(index);
    } else {
      chart.hide(index);
    }
  });

  chart.update();
}
```

---

## Chart Events

### **Available Events**

1. **chartClick** - Data point clicked
   ```typescript
   detail: {
     datasetLabel: string;
     dataLabel: string;
     value: number;
     datasetIndex: number;
     index: number;
   }
   ```

2. **chartZoom** - Zoom completed
   ```typescript
   detail: {
     scales: Chart.scales
   }
   ```

3. **chartPan** - Pan completed
   ```typescript
   detail: {
     scales: Chart.scales
   }
   ```

### **Event Handling Example**

```typescript
ngAfterViewInit(): void {
  const canvas = this.chartRef?.nativeElement;

  if (canvas) {
    canvas.addEventListener('chartClick', this.handleChartClick.bind(this));
    canvas.addEventListener('chartZoom', this.handleChartZoom.bind(this));
    canvas.addEventListener('chartPan', this.handleChartPan.bind(this));
  }
}

handleChartClick(event: CustomEvent): void {
  this.logger.info('Chart clicked:', event.detail);
}

handleChartZoom(event: CustomEvent): void {
  this.logger.info('Chart zoomed:', event.detail);
}

handleChartPan(event: CustomEvent): void {
  this.logger.info('Chart panned:', event.detail);
}
```

---

## Accessibility

### **Keyboard Navigation**

- **Tab:** Focus on chart
- **Arrow Keys:** Navigate data points
- **Enter/Space:** Activate data point (trigger click)
- **Escape:** Reset zoom

### **Screen Reader Support**

```typescript
<p-chart
  [data]="chartData()"
  [options]="chartOptions"
  [ariaLabel]="'Performance trends chart showing weekly progress'"
  role="img"
/>
```

---

## Performance Optimization

### **Lazy Loading**

```typescript
@defer (on viewport) {
  <p-chart [data]="chartData()" [options]="enhancedOptions" />
} @placeholder {
  <div class="chart-skeleton">Loading chart...</div>
}
```

### **Data Decimation**

For large datasets (> 1000 points), enable decimation:

```typescript
chartOptions = {
  ...ENHANCED_LINE_CHART_OPTIONS,
  plugins: {
    ...ENHANCED_LINE_CHART_OPTIONS.plugins,
    decimation: {
      enabled: true,
      algorithm: 'lttb', // Largest-Triangle-Three-Buckets
      samples: 500
    }
  }
};
```

---

## Testing Checklist

### **Visual Tests**
- [ ] Tooltips show correct trend data
- [ ] Legend toggle hides/shows datasets
- [ ] Export produces valid PNG
- [ ] Font sizes adjust on resize
- [ ] Charts render at all breakpoints

### **Interaction Tests**
- [ ] Mouse wheel zoom works
- [ ] Pinch zoom works on mobile
- [ ] Shift+drag pan works
- [ ] Reset zoom restores original view
- [ ] Click on data point fires event

### **Accessibility Tests**
- [ ] Chart has aria-label
- [ ] Keyboard navigation works
- [ ] Screen reader announces chart type
- [ ] Focus indicators visible

---

## Troubleshooting

### **Issue: Zoom not working**

**Solution:** Ensure chartjs-plugin-zoom is installed:
```bash
npm install chartjs-plugin-zoom
```

Register plugin:
```typescript
import zoomPlugin from 'chartjs-plugin-zoom';
Chart.register(zoomPlugin);
```

---

### **Issue: Export produces blank image**

**Solution:** Wait for chart to fully render:
```typescript
exportChart(): void {
  setTimeout(() => {
    exportChartAsPNG(this.chartInstance, 'chart');
  }, 100);
}
```

---

### **Issue: Fonts not responsive**

**Solution:** Call updateChartFontSizes on window resize:
```typescript
@HostListener('window:resize')
onResize(): void {
  updateChartFontSizes(this.chartInstance);
}
```

---

## Migration Guide

### **From Basic to Enhanced Charts**

**Before:**
```typescript
import { LINE_CHART_OPTIONS } from '@/shared/config/chart.config';

chartOptions = LINE_CHART_OPTIONS;
```

**After:**
```typescript
import { ENHANCED_LINE_CHART_OPTIONS } from '@/shared/config/enhanced-chart.config';

chartOptions = ENHANCED_LINE_CHART_OPTIONS;
```

---

## Next Steps

1. ✅ Implement chart interactions
2. ⏭️ Add chart customization panel (colors, fonts, etc.)
3. ⏭️ Create chart comparison mode (side-by-side)
4. ⏭️ Add chart annotations (markers, zones)
5. ⏭️ Implement chart templates (save/load configurations)

---

**Status:** ✅ Chart interactions complete
**Documentation:** ✅ Complete
**Testing:** Pending
