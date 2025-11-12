# Performance Chart Component

## Overview

Performance data visualization component using Chart.js. Displays training metrics and performance trends over time. This is an organism combining card molecule with chart visualization.

## Usage

Copy the HTML from `performance-chart.html` into your page. Requires Chart.js library to be loaded.

## Dependencies

- Chart.js library (loaded via CDN or npm)
- Card component CSS

## HTML Structure

```html
<div class="performance-chart-card card">
  <div class="card-header">
    <h3>Chart Title</h3>
    <div class="chart-controls">
      <!-- Period buttons -->
    </div>
  </div>
  <div class="card-body">
    <canvas id="chart-id"></canvas>
  </div>
  <div class="card-footer">
    <div class="chart-legend">
      <!-- Legend items -->
    </div>
  </div>
</div>
```

## Chart Types

- **Line Chart** - Trends over time
- **Bar Chart** - Comparisons
- **Area Chart** - Cumulative data
- **Pie Chart** - Proportions

## CSS Classes

- `.performance-chart-card` - Card wrapper
- `.chart-controls` - Period selector container
- `.chart-legend` - Legend container
- `.legend-item` - Individual legend item
- `.legend-color` - Color indicator dot

## Chart.js Configuration

The component includes a basic Chart.js configuration. Customize:

- Chart type (`line`, `bar`, `pie`, etc.)
- Data labels
- Colors (use CSS variables)
- Scales and axes
- Responsive behavior

## Accessibility

- ✅ Chart data should have text alternative
- ✅ Use `aria-label` for chart canvas
- ✅ Include data table alternative
- ✅ Ensure color contrast for readability

## Notes

- Chart.js must be loaded before initialization
- Canvas element requires explicit dimensions or responsive config
- Use CSS variables for colors to match theme
- Consider adding data export functionality
