# Data Visualization Guidelines

## Overview

Data visualization is critical for FlagFit Pro - athletes and coaches need to quickly understand performance trends, compare metrics, and make data-driven training decisions. This guide provides comprehensive patterns for displaying sports performance data.

## Core Principles

### 1. Clarity Over Complexity

- **One insight per chart**: Each visualization should answer a single question
- **Minimal decoration**: Remove gridlines, borders, and embellishments that don't add value
- **Progressive disclosure**: Show summary first, details on interaction

### 2. Performance-Focused Design

- **Color indicates status**: Green for improvement, red for decline, gray for neutral
- **Trend direction matters**: Always show direction of change (↑↓→)
- **Context is critical**: Include comparison data (team average, personal best, last session)

### 3. Responsive & Mobile-First

- **Touch-friendly**: Minimum 44×44px touch targets for interactive elements
- **Readable at all sizes**: Key metrics visible without zooming
- **Simplified mobile views**: Reduce data points on small screens

## Chart Types & Use Cases

### 1. Performance Line Chart

**Use Case**: Show performance trends over time (speed, strength, endurance)

**When to Use**:
- Tracking metrics across multiple sessions (3+ data points)
- Showing improvement or decline over weeks/months
- Comparing current performance to historical data

**Design Specifications**:

```css
/* Line Chart Tokens */
--chart-line-primary: var(--color-brand-primary); /* #10c96b */
--chart-line-secondary: var(--color-brand-secondary); /* #89c300 */
--chart-line-tertiary: var(--color-brand-tertiary); /* #cc9610 */
--chart-line-comparison: var(--primitive-gray-400); /* Comparison/baseline */
--chart-line-width: 3px;
--chart-point-radius: 6px;
--chart-point-radius-hover: 8px;
--chart-grid-color: var(--primitive-gray-200);
--chart-axis-color: var(--primitive-gray-400);
```

**HTML Structure**:

```html
<div class="chart-container">
  <div class="chart-header">
    <h3 class="chart-title">40-Yard Dash Time</h3>
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
      <span class="legend-indicator" style="background: var(--chart-line-primary)"></span>
      <span class="legend-label">Your Time</span>
    </button>
    <button class="legend-item" data-series="team">
      <span class="legend-indicator" style="background: var(--chart-line-comparison)"></span>
      <span class="legend-label">Team Average</span>
    </button>
  </div>
  
  <div class="chart-canvas" role="img" aria-label="Line chart showing 40-yard dash time improvement from 4.64s to 4.52s over 12 weeks">
    <!-- Chart rendered via Chart.js or D3.js -->
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
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
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
  border-radius: var(--radius-md);
}

.metric-change--positive {
  color: var(--status-success-700);
  background: var(--status-success-50);
}

.metric-change--negative {
  color: var(--status-error-700);
  background: var(--status-error-50);
}

.metric-change--neutral {
  color: var(--text-secondary);
  background: var(--primitive-gray-100);
}

.chart-legend {
  display: flex;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-2);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--motion-duration-fast) var(--motion-easing-standard);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.legend-item:hover {
  background: var(--surface-secondary);
  border-color: var(--border-default);
}

.legend-item--active {
  color: var(--text-primary);
  background: var(--surface-secondary);
  border-color: var(--border-strong);
}

.legend-indicator {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.chart-canvas {
  height: 300px;
  margin-bottom: var(--spacing-3);
}

.chart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-caption {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .chart-container {
    padding: var(--spacing-4);
  }
  
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

**Chart.js Configuration**:

```javascript
// Chart.js v4+ configuration for performance line chart
const performanceLineChart = {
  type: 'line',
  data: {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'],
    datasets: [
      {
        label: 'Your Time',
        data: [4.64, 4.62, 4.60, 4.59, 4.58, 4.57, 4.56, 4.55, 4.54, 4.53, 4.53, 4.52],
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
        data: [4.70, 4.69, 4.68, 4.67, 4.67, 4.66, 4.65, 4.65, 4.64, 4.64, 4.63, 4.63],
        borderColor: '#d4d4d4',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 6,
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
        display: false // Using custom legend
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#171717',
        bodyColor: '#404040',
        borderColor: '#e5e5e5',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y + 's';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 4.4,
        max: 4.8,
        ticks: {
          callback: function(value) {
            return value.toFixed(2) + 's';
          },
          color: '#737373',
          font: {
            size: 12
          }
        },
        grid: {
          color: '#f0f0f0',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: '#737373',
          font: {
            size: 12
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6
        },
        grid: {
          display: false
        }
      }
    }
  }
};
```

### 2. Comparison Bar Chart

**Use Case**: Compare multiple athletes or compare athlete metrics side-by-side

**When to Use**:
- Ranking players by performance
- Showing multiple metrics for one player
- Comparing session results

**Design Specifications**:

```html
<div class="chart-container">
  <div class="chart-header">
    <h3 class="chart-title">Team Sprint Rankings</h3>
    <select class="chart-filter">
      <option value="40-yard">40-Yard Dash</option>
      <option value="20-yard">20-Yard Shuttle</option>
      <option value="vertical">Vertical Jump</option>
    </select>
  </div>
  
  <div class="bar-chart">
    <div class="bar-item" data-rank="1">
      <div class="bar-label">
        <span class="bar-rank">1</span>
        <span class="bar-name">John Smith</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: 100%; background: var(--color-brand-primary);">
          <span class="bar-value">4.42s</span>
        </div>
      </div>
    </div>
    
    <div class="bar-item bar-item--highlight" data-rank="2">
      <div class="bar-label">
        <span class="bar-rank">2</span>
        <span class="bar-name">You</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: 95%; background: var(--color-brand-primary);">
          <span class="bar-value">4.52s</span>
        </div>
      </div>
    </div>
    
    <div class="bar-item" data-rank="3">
      <div class="bar-label">
        <span class="bar-rank">3</span>
        <span class="bar-name">Mike Johnson</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: 90%; background: var(--color-brand-primary);">
          <span class="bar-value">4.58s</span>
        </div>
      </div>
    </div>
    
    <!-- Additional bar items -->
  </div>
</div>
```

**CSS Styles**:

```css
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.bar-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: var(--spacing-3);
  align-items: center;
  padding: var(--spacing-2);
  border-radius: var(--radius-md);
  transition: background var(--motion-duration-fast) var(--motion-easing-standard);
}

.bar-item:hover {
  background: var(--surface-secondary);
}

.bar-item--highlight {
  background: var(--color-brand-primary-alpha-10);
  border: 2px solid var(--color-brand-primary);
}

.bar-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.bar-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--surface-secondary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.bar-item[data-rank="1"] .bar-rank {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #8b6914;
}

.bar-item[data-rank="2"] .bar-rank {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
  color: #404040;
}

.bar-item[data-rank="3"] .bar-rank {
  background: linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%);
  color: #6b3e1a;
}

.bar-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-track {
  position: relative;
  height: 32px;
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 var(--spacing-2);
  border-radius: var(--radius-md);
  transition: width var(--motion-duration-slow) var(--motion-easing-standard);
}

.bar-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: #ffffff;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .bar-item {
    grid-template-columns: 100px 1fr;
    gap: var(--spacing-2);
  }
  
  .bar-name {
    font-size: var(--font-size-sm);
  }
}
```

### 3. Radial Progress (Performance Score)

**Use Case**: Show overall performance score or completion percentage

**When to Use**:
- Overall athlete performance score
- Training plan completion
- Skill proficiency level
- Goal achievement percentage

**HTML Structure**:

```html
<div class="radial-progress-container">
  <svg class="radial-progress" viewBox="0 0 160 160" width="160" height="160">
    <!-- Background circle -->
    <circle
      class="radial-progress-track"
      cx="80"
      cy="80"
      r="70"
      fill="none"
      stroke="#f0f0f0"
      stroke-width="12"
    ></circle>
    
    <!-- Progress circle -->
    <circle
      class="radial-progress-fill"
      cx="80"
      cy="80"
      r="70"
      fill="none"
      stroke="#10c96b"
      stroke-width="12"
      stroke-linecap="round"
      stroke-dasharray="440"
      stroke-dashoffset="110"
      transform="rotate(-90 80 80)"
    ></circle>
    
    <!-- Center text -->
    <text class="radial-progress-value" x="80" y="75" text-anchor="middle">
      75%
    </text>
    <text class="radial-progress-label" x="80" y="95" text-anchor="middle">
      Complete
    </text>
  </svg>
</div>
```

**CSS Styles**:

```css
.radial-progress-container {
  display: inline-flex;
  position: relative;
}

.radial-progress {
  transform: rotate(0deg);
}

.radial-progress-track {
  opacity: 1;
}

.radial-progress-fill {
  transition: stroke-dashoffset var(--motion-duration-slow) var(--motion-easing-standard);
}

.radial-progress-value {
  font-size: 32px;
  font-weight: var(--font-weight-bold);
  fill: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.radial-progress-label {
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  fill: var(--text-secondary);
}

/* Color variants */
.radial-progress[data-status="excellent"] .radial-progress-fill {
  stroke: var(--status-success-600);
}

.radial-progress[data-status="good"] .radial-progress-fill {
  stroke: var(--color-brand-primary);
}

.radial-progress[data-status="average"] .radial-progress-fill {
  stroke: var(--status-warning-500);
}

.radial-progress[data-status="poor"] .radial-progress-fill {
  stroke: var(--status-error-500);
}
```

**JavaScript for Animation**:

```javascript
function animateRadialProgress(element, targetPercentage) {
  const circle = element.querySelector('.radial-progress-fill');
  const valueText = element.querySelector('.radial-progress-value');
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // 440
  
  // Calculate stroke-dashoffset for percentage
  const offset = circumference - (targetPercentage / 100) * circumference;
  
  // Animate the circle
  circle.style.strokeDashoffset = offset;
  
  // Animate the number
  let current = 0;
  const duration = 1000; // 1 second
  const increment = targetPercentage / (duration / 16); // 60fps
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= targetPercentage) {
      current = targetPercentage;
      clearInterval(timer);
    }
    valueText.textContent = Math.round(current) + '%';
  }, 16);
}

// Usage
const progressElement = document.querySelector('.radial-progress');
animateRadialProgress(progressElement, 75);
```

### 4. Heatmap Calendar (Training Consistency)

**Use Case**: Show training activity across days/weeks

**When to Use**:
- Visualizing training consistency
- Showing attendance patterns
- Displaying habit tracking

**HTML Structure**:

```html
<div class="heatmap-container">
  <div class="heatmap-header">
    <h3 class="heatmap-title">Training Activity</h3>
    <div class="heatmap-legend">
      <span class="legend-label">Less</span>
      <div class="legend-scale">
        <span class="legend-box" data-level="0"></span>
        <span class="legend-box" data-level="1"></span>
        <span class="legend-box" data-level="2"></span>
        <span class="legend-box" data-level="3"></span>
        <span class="legend-box" data-level="4"></span>
      </div>
      <span class="legend-label">More</span>
    </div>
  </div>
  
  <div class="heatmap-calendar">
    <!-- Week rows -->
    <div class="heatmap-week">
      <span class="heatmap-day" data-level="0" data-date="2024-01-01" title="No training"></span>
      <span class="heatmap-day" data-level="2" data-date="2024-01-02" title="2 sessions"></span>
      <span class="heatmap-day" data-level="3" data-date="2024-01-03" title="3 sessions"></span>
      <span class="heatmap-day" data-level="1" data-date="2024-01-04" title="1 session"></span>
      <span class="heatmap-day" data-level="4" data-date="2024-01-05" title="4 sessions"></span>
      <span class="heatmap-day" data-level="0" data-date="2024-01-06" title="No training"></span>
      <span class="heatmap-day" data-level="0" data-date="2024-01-07" title="No training"></span>
    </div>
    <!-- More weeks -->
  </div>
  
  <div class="heatmap-stats">
    <div class="heatmap-stat">
      <span class="stat-value">47</span>
      <span class="stat-label">Total Sessions</span>
    </div>
    <div class="heatmap-stat">
      <span class="stat-value">12</span>
      <span class="stat-label">Week Streak</span>
    </div>
  </div>
</div>
```

**CSS Styles**:

```css
.heatmap-container {
  background: var(--surface-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
}

.heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.heatmap-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.legend-scale {
  display: flex;
  gap: 2px;
}

.legend-box {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid var(--border-default);
}

.legend-box[data-level="0"] {
  background: var(--surface-secondary);
}

.legend-box[data-level="1"] {
  background: #c6f6d5;
}

.legend-box[data-level="2"] {
  background: #9ae6b4;
}

.legend-box[data-level="3"] {
  background: #48bb78;
}

.legend-box[data-level="4"] {
  background: var(--color-brand-primary);
}

.legend-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.heatmap-calendar {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: var(--spacing-4);
}

.heatmap-week {
  display: flex;
  gap: 3px;
}

.heatmap-day {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: transform var(--motion-duration-fast) var(--motion-easing-standard);
}

.heatmap-day:hover {
  transform: scale(1.2);
  z-index: 1;
}

.heatmap-day[data-level="0"] {
  background: var(--surface-secondary);
}

.heatmap-day[data-level="1"] {
  background: #c6f6d5;
}

.heatmap-day[data-level="2"] {
  background: #9ae6b4;
}

.heatmap-day[data-level="3"] {
  background: #48bb78;
}

.heatmap-day[data-level="4"] {
  background: var(--color-brand-primary);
}

.heatmap-stats {
  display: flex;
  gap: var(--spacing-6);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--border-default);
}

.heatmap-stat {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .heatmap-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-3);
  }
  
  .heatmap-day {
    width: 10px;
    height: 10px;
  }
}
```

### 5. Skills Radar Chart

**Use Case**: Show athlete's skill levels across multiple dimensions

**When to Use**:
- Overall player assessment
- Skills evaluation
- Comparing skill profiles between players

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
  
  <div class="skills-list">
    <div class="skill-item">
      <div class="skill-label">
        <span class="skill-name">Speed</span>
        <span class="skill-score">85/100</span>
      </div>
      <div class="skill-bar">
        <div class="skill-bar-fill" style="width: 85%"></div>
      </div>
    </div>
    
    <div class="skill-item">
      <div class="skill-label">
        <span class="skill-name">Agility</span>
        <span class="skill-score">78/100</span>
      </div>
      <div class="skill-bar">
        <div class="skill-bar-fill" style="width: 78%"></div>
      </div>
    </div>
    
    <!-- More skill items -->
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
      pointRadius: 4,
      pointHoverRadius: 6
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
          color: '#737373',
          backdropColor: 'transparent'
        },
        grid: {
          color: '#f0f0f0'
        },
        pointLabels: {
          color: '#404040',
          font: {
            size: 13,
            weight: '500'
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.label + ': ' + context.parsed.r + '/100';
          }
        }
      }
    }
  }
};
```

### 6. Stat Cards (Key Metrics)

**Use Case**: Display critical performance metrics at a glance

**When to Use**:
- Dashboard overview
- Session summary
- Player profile highlights

**HTML Structure**:

```html
<div class="stat-cards-grid">
  <div class="stat-card stat-card--primary">
    <div class="stat-icon">
      <svg width="24" height="24">
        <use href="#icon-zap"></use>
      </svg>
    </div>
    <div class="stat-content">
      <span class="stat-label">Performance Score</span>
      <span class="stat-value">87</span>
      <span class="stat-change stat-change--positive">
        <svg class="icon-arrow-up" width="12" height="12">
          <use href="#icon-arrow-up"></use>
        </svg>
        +5 from last week
      </span>
    </div>
  </div>
  
  <div class="stat-card">
    <div class="stat-icon">
      <svg width="24" height="24">
        <use href="#icon-activity"></use>
      </svg>
    </div>
    <div class="stat-content">
      <span class="stat-label">Training Sessions</span>
      <span class="stat-value">24</span>
      <span class="stat-change stat-change--positive">
        <svg class="icon-arrow-up" width="12" height="12">
          <use href="#icon-arrow-up"></use>
        </svg>
        +3 this month
      </span>
    </div>
  </div>
  
  <div class="stat-card">
    <div class="stat-icon">
      <svg width="24" height="24">
        <use href="#icon-target"></use>
      </svg>
    </div>
    <div class="stat-content">
      <span class="stat-label">Goals Achieved</span>
      <span class="stat-value">12/15</span>
      <span class="stat-progress">
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: 80%"></div>
        </div>
        <span class="progress-text">80%</span>
      </span>
    </div>
  </div>
  
  <div class="stat-card">
    <div class="stat-icon">
      <svg width="24" height="24">
        <use href="#icon-calendar"></use>
      </svg>
    </div>
    <div class="stat-content">
      <span class="stat-label">Attendance</span>
      <span class="stat-value">95%</span>
      <span class="stat-change stat-change--neutral">
        No change
      </span>
    </div>
  </div>
</div>
```

**CSS Styles**:

```css
.stat-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-4);
}

.stat-card {
  display: flex;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  background: var(--surface-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  transition: all var(--motion-duration-fast) var(--motion-easing-standard);
}

.stat-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-sm);
}

.stat-card--primary {
  background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--primitive-primary-600) 100%);
  border-color: transparent;
  color: #ffffff;
}

.stat-card--primary .stat-label,
.stat-card--primary .stat-value,
.stat-card--primary .stat-change {
  color: #ffffff;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--surface-secondary);
  border-radius: var(--radius-lg);
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
  flex: 1;
}

.stat-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-top: var(--spacing-1);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--surface-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-brand-primary);
  border-radius: var(--radius-full);
  transition: width var(--motion-duration-slow) var(--motion-easing-standard);
}

.progress-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .stat-cards-grid {
    grid-template-columns: 1fr;
  }
}
```

## Data Visualization Best Practices

### 1. Color Usage

**Do:**
- Use brand green (#10c96b) for primary data
- Use status colors for contextual meaning (red=bad, green=good)
- Maintain sufficient contrast ratios (4.5:1 minimum for text)
- Use color + pattern/shape for colorblind accessibility

**Don't:**
- Use more than 5-6 colors in a single chart
- Rely solely on color to convey information
- Use red/green only (add icons or patterns)

### 2. Performance Optimization

**Loading States:**

```html
<div class="chart-skeleton">
  <div class="skeleton-header"></div>
  <div class="skeleton-chart"></div>
  <div class="skeleton-legend"></div>
</div>
```

**Lazy Loading:**

```javascript
// Only load Chart.js when chart comes into viewport
const chartObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadChartLibrary().then(() => {
        renderChart(entry.target);
      });
      chartObserver.unobserve(entry.target);
    }
  });
});

document.querySelectorAll('.chart-canvas').forEach(chart => {
  chartObserver.observe(chart);
});
```

### 3. Mobile Considerations

**Touch Interactions:**
- Minimum 44×44px touch targets for interactive elements
- Add tap feedback with scale transform
- Show tooltip on tap, not hover
- Simplify charts on small screens (reduce data points)

**Responsive Charts:**

```javascript
// Adjust chart based on screen size
function getChartConfig(screenWidth) {
  if (screenWidth < 768) {
    return {
      aspectRatio: 1,
      legend: { display: false },
      plugins: {
        tooltip: { enabled: true, mode: 'index' }
      }
    };
  }
  return defaultChartConfig;
}
```

### 4. Accessibility

**Requirements:**
- All charts must have `role="img"` and descriptive `aria-label`
- Provide data table alternative (can be hidden, accessible via keyboard)
- Ensure keyboard navigation for interactive elements
- Use patterns in addition to colors

**Example:**

```html
<div role="img" aria-label="Line chart showing 15% improvement in sprint time from 4.64 seconds to 4.52 seconds over 12 weeks">
  <canvas id="chart"></canvas>
</div>

<!-- Hidden data table for screen readers -->
<table class="visually-hidden" aria-label="Sprint performance data">
  <thead>
    <tr>
      <th>Week</th>
      <th>Sprint Time (seconds)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Week 1</td><td>4.64</td></tr>
    <tr><td>Week 2</td><td>4.62</td></tr>
    <!-- ... -->
  </tbody>
</table>
```

### 5. Error States

**No Data State:**

```html
<div class="chart-empty-state">
  <svg class="empty-state-icon" width="48" height="48">
    <use href="#icon-bar-chart"></use>
  </svg>
  <h4 class="empty-state-title">No data yet</h4>
  <p class="empty-state-description">
    Complete your first training session to see your performance data here.
  </p>
  <button class="btn-primary">Start Training</button>
</div>
```

**Data Loading Failed:**

```html
<div class="chart-error-state">
  <svg class="error-state-icon" width="48" height="48">
    <use href="#icon-alert-circle"></use>
  </svg>
  <h4 class="error-state-title">Unable to load chart</h4>
  <p class="error-state-description">
    There was a problem loading your performance data.
  </p>
  <button class="btn-secondary" onclick="retryLoadChart()">Try Again</button>
</div>
```

## Chart Library Recommendations

### Primary: Chart.js v4+

**Best for:** Line charts, bar charts, radar charts

**Pros:** Lightweight, responsive, good defaults

**Cons:** Limited advanced visualizations

**Installation:**

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

### Secondary: D3.js v7+

**Best for:** Custom visualizations, heatmaps, complex interactions

**Pros:** Maximum flexibility, powerful

**Cons:** Steeper learning curve, larger bundle

**Installation:**

```html
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
```

### Lightweight Alternative: ApexCharts

**Best for:** Quick implementation, modern defaults

**Pros:** Beautiful out-of-box, good mobile support

**Cons:** Larger bundle than Chart.js

## Testing Checklist

Before deploying any data visualization:

- [ ] Chart displays correctly on mobile (< 768px)
- [ ] Chart displays correctly on tablet (768px - 1024px)
- [ ] Chart displays correctly on desktop (> 1024px)
- [ ] Loading state shows before data loads
- [ ] Empty state shows when no data available
- [ ] Error state shows on load failure
- [ ] Chart has proper ARIA labels
- [ ] Keyboard navigation works for interactive elements
- [ ] Touch interactions work on mobile devices
- [ ] Color contrast meets WCAG AA standards (4.5:1)
- [ ] Chart is readable in both light and dark modes
- [ ] Data updates animate smoothly
- [ ] Tooltips display on hover/tap
- [ ] Legend items toggle data series visibility
- [ ] Chart exports to image/PDF (if required)
- [ ] Performance: Chart renders in < 500ms

---

## Component Files Reference

All chart components should follow this file structure:

```
components/
  charts/
    line-chart/
      line-chart.html
      line-chart.css
      line-chart.js
      README.md
    bar-chart/
      bar-chart.html
      bar-chart.css
      bar-chart.js
      README.md
    radar-chart/
      radar-chart.html
      radar-chart.css
      radar-chart.js
      README.md
    heatmap/
      heatmap.html
      heatmap.css
      heatmap.js
      README.md
```

Each README.md should include:
- Component overview
- When to use
- Props/configuration options
- Code examples
- Accessibility notes
- Browser support

---

_Last Updated: December 2024_

