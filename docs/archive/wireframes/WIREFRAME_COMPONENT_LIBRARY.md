# Wireframe Component Library

_Complete Component Catalog & Implementation Reference_

## 🎯 **Overview**

This document provides a **comprehensive component library** for all wireframe elements used throughout the Flag Football Training App. It consolidates components from all wireframe files into a **single, reusable component system** with implementation details, usage guidelines, and sport-specific variations.

## 🧱 **Component Categories**

### **Component Hierarchy**

```
1. Foundation Components (Buttons, Inputs, Cards)
2. Navigation Components (Headers, Menus, Breadcrumbs)
3. Data Display Components (Metrics, Charts, Tables)
4. Interaction Components (Forms, Modals, Dialogs)
5. Layout Components (Grids, Containers, Sections)
6. Flag Football Specific (Training, Performance, Olympics)
7. Research Integration (Citations, Confidence, Evidence)
```

## 🔘 **Foundation Components**

### **Button Component System**

#### **Base Button**

```html
<!-- Basic Wireframe Button -->
<button class="wireframe-button" type="button">Button Text</button>
```

```css
.wireframe-button {
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-primary);
  font-size: var(--font-size-md);
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  text-align: center;
  transition: background-color 0.15s ease;
}

.wireframe-button:hover {
  background-color: var(--wireframe-gray-light);
}

.wireframe-button:focus {
  outline: 2px solid var(--wireframe-black);
  outline-offset: 2px;
}

.wireframe-button:active {
  transform: translateY(1px);
}
```

#### **Button Variations**

```html
<!-- Primary Button (Training Actions) -->
<button class="wireframe-button wireframe-button--primary">
  Start Training Session
</button>

<!-- Secondary Button (Supporting Actions) -->
<button class="wireframe-button wireframe-button--secondary">
  View Details
</button>

<!-- Large Button (Mobile Touch) -->
<button class="wireframe-button wireframe-button--large">
  Complete Training
</button>

<!-- Full Width Button (Mobile) -->
<button class="wireframe-button wireframe-button--full-width">
  Register for Tournament
</button>

<!-- Icon Button -->
<button class="wireframe-button wireframe-button--icon" aria-label="Settings">
  [⚙]
</button>

<!-- Disabled Button -->
<button class="wireframe-button" disabled>Unavailable Action</button>
```

```css
/* Button Variations */
.wireframe-button--primary {
  background-color: var(--wireframe-black);
  color: var(--wireframe-white);
  border: 2px solid var(--wireframe-black);
  font-weight: bold;
}

.wireframe-button--secondary {
  border: 1px dashed var(--wireframe-black);
  background-color: var(--wireframe-white);
}

.wireframe-button--large {
  padding: var(--space-md) var(--space-lg);
  font-size: var(--font-size-lg);
  min-height: 56px;
}

.wireframe-button--full-width {
  width: 100%;
  display: block;
}

.wireframe-button--icon {
  width: 44px;
  height: 44px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wireframe-button:disabled {
  background-color: var(--wireframe-gray-light);
  color: var(--wireframe-gray-medium);
  cursor: not-allowed;
  border-color: var(--wireframe-gray-medium);
}
```

### **Input Component System**

#### **Base Input**

```html
<!-- Text Input -->
<div class="wireframe-input-group">
  <label for="sprint-time" class="wireframe-label">10-Yard Sprint Time</label>
  <input
    id="sprint-time"
    type="text"
    class="wireframe-input"
    placeholder="1.65 seconds"
    aria-describedby="sprint-help"
  />
  <div id="sprint-help" class="wireframe-help-text">
    Target: Under 1.60 seconds (based on research)
  </div>
</div>
```

```css
.wireframe-input-group {
  margin-bottom: var(--space-md);
}

.wireframe-label {
  display: block;
  margin-bottom: var(--space-xs);
  font-weight: bold;
  color: var(--wireframe-black);
}

.wireframe-input {
  width: 100%;
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  padding: var(--space-sm);
  font-family: var(--font-primary);
  font-size: var(--font-size-md);
  min-height: 44px;
  box-sizing: border-box;
}

.wireframe-input:focus {
  outline: 2px solid var(--wireframe-black);
  outline-offset: 1px;
}

.wireframe-help-text {
  margin-top: var(--space-xs);
  font-size: var(--font-size-xs);
  color: var(--wireframe-gray-dark);
}
```

#### **Input Variations**

```html
<!-- Select Dropdown -->
<select class="wireframe-select">
  <option value="">Choose Position</option>
  <option value="qb">Quarterback</option>
  <option value="wr">Wide Receiver</option>
  <option value="rb">Running Back</option>
</select>

<!-- Number Input (Performance Metrics) -->
<input
  type="number"
  class="wireframe-input wireframe-input--number"
  placeholder="1.65"
  step="0.01"
  min="0"
  max="10"
/>

<!-- Textarea (Training Notes) -->
<textarea
  class="wireframe-textarea"
  placeholder="Training session notes..."
  rows="4"
></textarea>

<!-- Checkbox (Goal Selection) -->
<div class="wireframe-checkbox-group">
  <input type="checkbox" id="olympics" class="wireframe-checkbox" />
  <label for="olympics" class="wireframe-checkbox-label">
    LA28 Olympics Preparation
  </label>
</div>

<!-- Radio Group (Training Intensity) -->
<div class="wireframe-radio-group">
  <div class="wireframe-radio-item">
    <input type="radio" id="low" name="intensity" class="wireframe-radio" />
    <label for="low" class="wireframe-radio-label">Low Intensity</label>
  </div>
  <div class="wireframe-radio-item">
    <input type="radio" id="high" name="intensity" class="wireframe-radio" />
    <label for="high" class="wireframe-radio-label">High Intensity</label>
  </div>
</div>
```

### **Card Component System**

#### **Base Card**

```html
<div class="wireframe-card">
  <div class="wireframe-card-header">
    <h3 class="wireframe-card-title">Performance Summary</h3>
    <div class="wireframe-card-actions">
      <button class="wireframe-button wireframe-button--icon">[...]</button>
    </div>
  </div>

  <div class="wireframe-card-body">
    <p>Your sprint times have improved by 0.08 seconds this week.</p>
  </div>

  <div class="wireframe-card-footer">
    <span class="wireframe-card-meta">Updated 2 hours ago</span>
  </div>
</div>
```

```css
.wireframe-card {
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  overflow: hidden;
  margin-bottom: var(--space-md);
}

.wireframe-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  border-bottom: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-gray-light);
}

.wireframe-card-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: bold;
}

.wireframe-card-body {
  padding: var(--space-md);
}

.wireframe-card-footer {
  padding: var(--space-md);
  border-top: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-gray-light);
}

.wireframe-card-meta {
  font-size: var(--font-size-xs);
  color: var(--wireframe-gray-dark);
}
```

## 🧭 **Navigation Components**

### **Main Navigation Header**

```html
<header class="wireframe-header">
  <nav class="wireframe-navigation">
    <!-- Brand Section -->
    <div class="wireframe-nav-brand">
      <div class="wireframe-logo">
        <span class="logo-icon">[🏈]</span>
      </div>
      <span class="wireframe-app-name">Flag Football Training</span>
    </div>

    <!-- Primary Navigation -->
    <div class="wireframe-nav-menu">
      <a
        href="/dashboard"
        class="wireframe-nav-link wireframe-nav-link--active"
      >
        Dashboard
      </a>
      <a href="/training" class="wireframe-nav-link"> Training </a>
      <a href="/tournaments" class="wireframe-nav-link"> Tournaments </a>
      <a href="/community" class="wireframe-nav-link"> Community </a>
      <a href="/profile" class="wireframe-nav-link"> Profile </a>
    </div>

    <!-- Action Items -->
    <div class="wireframe-nav-actions">
      <button class="wireframe-nav-button" aria-label="Search">
        <span class="nav-icon">[🔍]</span>
      </button>

      <button class="wireframe-nav-button" aria-label="Notifications">
        <span class="nav-icon">[🔔]</span>
        <span class="notification-badge">3</span>
      </button>

      <div class="wireframe-user-avatar">
        <button class="avatar-button" aria-label="User menu">
          <span class="avatar-icon">[👤]</span>
        </button>
      </div>
    </div>
  </nav>
</header>
```

```css
.wireframe-header {
  border-bottom: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  position: sticky;
  top: 0;
  z-index: 100;
}

.wireframe-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  max-width: 1200px;
  margin: 0 auto;
}

.wireframe-nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.wireframe-logo {
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
}

.wireframe-nav-link {
  text-decoration: none;
  color: var(--wireframe-black);
  padding: var(--space-sm);
  border: 1px solid transparent;
  transition: border-color 0.15s ease;
}

.wireframe-nav-link:hover {
  border-color: var(--wireframe-black);
}

.wireframe-nav-link--active {
  border-color: var(--wireframe-black);
  background-color: var(--wireframe-gray-light);
  font-weight: bold;
}

.wireframe-nav-actions {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.wireframe-nav-button {
  width: 40px;
  height: 40px;
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: var(--wireframe-black);
  color: var(--wireframe-white);
  font-size: var(--font-size-xs);
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}
```

### **Breadcrumb Navigation**

```html
<nav class="wireframe-breadcrumb" aria-label="Breadcrumb">
  <ol class="wireframe-breadcrumb-list">
    <li class="wireframe-breadcrumb-item">
      <a href="/dashboard" class="wireframe-breadcrumb-link">Dashboard</a>
    </li>
    <li class="wireframe-breadcrumb-item">
      <span class="wireframe-breadcrumb-separator">/</span>
      <a href="/training" class="wireframe-breadcrumb-link">Training</a>
    </li>
    <li class="wireframe-breadcrumb-item">
      <span class="wireframe-breadcrumb-separator">/</span>
      <span class="wireframe-breadcrumb-current">Speed & Agility</span>
    </li>
  </ol>
</nav>
```

## 📊 **Data Display Components**

### **Performance Metrics Component**

```html
<div class="wireframe-metrics-grid">
  <!-- Primary Metric -->
  <div class="wireframe-metric wireframe-metric--primary">
    <div class="wireframe-metric-header">
      <span class="wireframe-metric-label">10-Yard Sprint</span>
      <span class="wireframe-metric-trend">↗ +5%</span>
    </div>

    <div class="wireframe-metric-value">
      <span class="metric-number">1.65</span>
      <span class="metric-unit">seconds</span>
    </div>

    <div class="wireframe-metric-context">
      <span class="metric-target">Target: 1.60s</span>
      <span class="metric-percentile">78th percentile</span>
    </div>

    <div class="wireframe-metric-research">
      <span class="research-badge">Research-Backed</span>
      <span class="research-note">Based on 156 studies</span>
    </div>
  </div>

  <!-- Secondary Metrics -->
  <div class="wireframe-metric">
    <span class="wireframe-metric-label">Route Precision</span>
    <span class="wireframe-metric-value">87%</span>
    <span class="wireframe-metric-context">89% skill transfer rate</span>
  </div>

  <div class="wireframe-metric">
    <span class="wireframe-metric-label">Game Readiness</span>
    <span class="wireframe-metric-value">85%</span>
    <span class="wireframe-metric-context">Competition Ready</span>
  </div>

  <div class="wireframe-metric">
    <span class="wireframe-metric-label">Injury Risk</span>
    <span class="wireframe-metric-value">18%</span>
    <span class="wireframe-metric-context">Low Risk (78% prevention)</span>
  </div>
</div>
```

```css
.wireframe-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.wireframe-metric {
  border: 1px solid var(--wireframe-black);
  padding: var(--space-md);
  text-align: center;
  background-color: var(--wireframe-white);
}

.wireframe-metric--primary {
  border: 2px solid var(--wireframe-black);
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
  text-align: left;
}

.wireframe-metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.wireframe-metric-label {
  font-weight: bold;
  font-size: var(--font-size-sm);
  color: var(--wireframe-gray-dark);
  text-transform: uppercase;
}

.wireframe-metric-trend {
  font-size: var(--font-size-sm);
  font-weight: bold;
}

.wireframe-metric-value {
  margin-bottom: var(--space-sm);
}

.metric-number {
  font-size: var(--font-size-xxl);
  font-weight: bold;
  display: block;
}

.metric-unit {
  font-size: var(--font-size-sm);
  color: var(--wireframe-gray-dark);
}

.wireframe-metric-context {
  font-size: var(--font-size-xs);
  color: var(--wireframe-gray-dark);
  margin-bottom: var(--space-sm);
}

.wireframe-metric-research {
  border-top: 1px solid var(--wireframe-black);
  padding-top: var(--space-sm);
  font-size: var(--font-size-xs);
}

.research-badge {
  background-color: var(--wireframe-black);
  color: var(--wireframe-white);
  padding: 2px 6px;
  margin-right: var(--space-xs);
}
```

### **Progress Bar Component**

```html
<!-- Simple Progress Bar -->
<div class="wireframe-progress-bar">
  <div class="wireframe-progress-label">
    <span>Training Progress</span>
    <span>65%</span>
  </div>
  <div class="wireframe-progress-track">
    <div class="wireframe-progress-fill" style="width: 65%;"></div>
  </div>
</div>

<!-- Olympics Progress Bar -->
<div class="wireframe-progress-bar wireframe-progress-bar--olympics">
  <div class="wireframe-progress-label">
    <span>LA28 Olympics Qualification</span>
    <span>68% to Standard</span>
  </div>
  <div class="wireframe-progress-track">
    <div class="wireframe-progress-fill" style="width: 68%;"></div>
  </div>
  <div class="wireframe-progress-milestones">
    <span class="milestone milestone--reached">Baseline</span>
    <span class="milestone milestone--current">Current</span>
    <span class="milestone milestone--target">Olympic Standard</span>
  </div>
</div>
```

```css
.wireframe-progress-bar {
  margin-bottom: var(--space-md);
}

.wireframe-progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
  font-size: var(--font-size-sm);
  font-weight: bold;
}

.wireframe-progress-track {
  height: 20px;
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  overflow: hidden;
}

.wireframe-progress-fill {
  height: 100%;
  background-color: var(--wireframe-black);
  transition: width 0.3s ease;
}

.wireframe-progress-bar--olympics {
  border: 2px solid var(--wireframe-black);
  padding: var(--space-md);
}

.wireframe-progress-milestones {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-xs);
  font-size: var(--font-size-xs);
}

.milestone--reached {
  color: var(--wireframe-black);
  font-weight: bold;
}

.milestone--current {
  color: var(--wireframe-black);
  font-weight: bold;
  text-decoration: underline;
}

.milestone--target {
  color: var(--wireframe-gray-dark);
}
```

## 🏈 **Flag Football Specific Components**

### **AI Coach Message Component**

```html
<div class="wireframe-ai-coach">
  <div class="ai-coach-header">
    <div class="ai-coach-avatar">
      <span class="ai-icon">[🤖]</span>
    </div>
    <div class="ai-coach-info">
      <span class="ai-coach-title">AI Coach</span>
      <span class="ai-coach-accuracy">87.4% Prediction Accuracy</span>
    </div>
    <div class="ai-coach-confidence">
      <span class="confidence-badge">91% Confidence</span>
    </div>
  </div>

  <div class="ai-coach-message">
    <p>
      "Based on your performance data, focus on route precision today. Your
      sprint times are excellent, but route running accuracy can improve by
      12%."
    </p>
  </div>

  <div class="ai-coach-evidence">
    <div class="evidence-item">
      <span class="evidence-label">Prediction Based On:</span>
      <span class="evidence-value">156 studies, 3,847 participants</span>
    </div>
    <div class="evidence-item">
      <span class="evidence-label">Flag Football Specific:</span>
      <span class="evidence-value">73% agility focus optimization</span>
    </div>
  </div>

  <div class="ai-coach-actions">
    <button class="wireframe-button wireframe-button--primary">
      Accept Recommendation
    </button>
    <button class="wireframe-button">View Research</button>
    <button class="wireframe-button">Customize Plan</button>
  </div>
</div>
```

```css
.wireframe-ai-coach {
  border: 2px solid var(--wireframe-black);
  background-color: var(--wireframe-gray-light);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.ai-coach-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.ai-coach-avatar {
  width: 50px;
  height: 50px;
  border: 2px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
}

.ai-coach-info {
  flex: 1;
}

.ai-coach-title {
  display: block;
  font-weight: bold;
  font-size: var(--font-size-lg);
}

.ai-coach-accuracy {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--wireframe-gray-dark);
}

.confidence-badge {
  background-color: var(--wireframe-black);
  color: var(--wireframe-white);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-xs);
  font-weight: bold;
}

.ai-coach-message {
  background-color: var(--wireframe-white);
  border: 1px solid var(--wireframe-black);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  font-style: italic;
}

.ai-coach-evidence {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.evidence-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.evidence-label {
  font-size: var(--font-size-xs);
  font-weight: bold;
  text-transform: uppercase;
}

.evidence-value {
  font-size: var(--font-size-sm);
}

.ai-coach-actions {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}
```

### **Training Session Component**

```html
<div class="wireframe-training-session">
  <div class="training-session-header">
    <div class="session-info">
      <h3 class="session-title">Speed & Agility Training</h3>
      <span class="session-duration">45 minutes</span>
      <span class="session-type">Flag Football Specific</span>
    </div>

    <div class="session-status">
      <span class="status-badge status-badge--active">In Progress</span>
      <span class="session-timer">00:23:45</span>
    </div>
  </div>

  <div class="training-session-content">
    <!-- Live Metrics -->
    <div class="live-metrics">
      <div class="live-metric">
        <span class="metric-label">Current Sprint</span>
        <span class="metric-value">1.67s</span>
        <span class="metric-target">Target: 1.60s</span>
      </div>

      <div class="live-metric">
        <span class="metric-label">Heart Rate</span>
        <span class="metric-value">148 bpm</span>
        <span class="metric-zone">Zone 4</span>
      </div>

      <div class="live-metric">
        <span class="metric-label">Reps Completed</span>
        <span class="metric-value">8/12</span>
        <span class="metric-progress">67% Complete</span>
      </div>
    </div>

    <!-- Drill Instructions -->
    <div class="drill-instructions">
      <h4>Current Drill: 10-Yard Sprint</h4>
      <p>
        Focus on explosive start and maintaining form through the finish line.
        73% more agility emphasis for flag football optimization.
      </p>

      <div class="drill-research">
        <span class="research-note"
          >Research shows 91% of game sprints are 10-25 yards</span
        >
      </div>
    </div>
  </div>

  <div class="training-session-actions">
    <button class="wireframe-button wireframe-button--primary">
      Complete Rep
    </button>
    <button class="wireframe-button">Skip Drill</button>
    <button class="wireframe-button">End Session</button>
  </div>
</div>
```

### **Olympics Tracker Component**

```html
<div class="wireframe-olympics-tracker">
  <div class="olympics-header">
    <div class="olympics-logo">
      <span class="olympics-icon">[🥇]</span>
    </div>
    <div class="olympics-info">
      <h3 class="olympics-title">LA28 Olympics Preparation</h3>
      <span class="olympics-countdown">1,247 days remaining</span>
    </div>
    <div class="olympics-status">
      <span class="status-indicator status-indicator--on-track">On Track</span>
    </div>
  </div>

  <div class="olympics-metrics">
    <div class="olympics-metric">
      <span class="metric-label">Current Trajectory</span>
      <span class="metric-value">Qualification Likely</span>
      <span class="metric-confidence">82% probability</span>
    </div>

    <div class="olympics-metric">
      <span class="metric-label">Performance Gap</span>
      <span class="metric-value">-0.12s to Standard</span>
      <span class="metric-timeline">Estimated: June 2027</span>
    </div>

    <div class="olympics-metric">
      <span class="metric-label">Training Progress</span>
      <span class="metric-value">68% Complete</span>
      <span class="metric-phase">Development Phase</span>
    </div>
  </div>

  <div class="olympics-roadmap">
    <h4>Qualification Roadmap</h4>
    <div class="roadmap-milestones">
      <div class="milestone milestone--completed">
        <span class="milestone-date">2024</span>
        <span class="milestone-title">Training Foundation</span>
        <span class="milestone-status">✓ Complete</span>
      </div>

      <div class="milestone milestone--current">
        <span class="milestone-date">2025</span>
        <span class="milestone-title">Performance Development</span>
        <span class="milestone-status">→ In Progress</span>
      </div>

      <div class="milestone milestone--upcoming">
        <span class="milestone-date">2026-2027</span>
        <span class="milestone-title">Competition Preparation</span>
        <span class="milestone-status">○ Upcoming</span>
      </div>

      <div class="milestone milestone--target">
        <span class="milestone-date">2028</span>
        <span class="milestone-title">LA28 Olympics</span>
        <span class="milestone-status">🎯 Target</span>
      </div>
    </div>
  </div>
</div>
```

```css
.wireframe-olympics-tracker {
  border: 3px solid var(--wireframe-black);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  background-color: var(--wireframe-white);
}

.olympics-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.olympics-logo {
  width: 60px;
  height: 60px;
  border: 2px solid var(--wireframe-black);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
}

.olympics-info {
  flex: 1;
}

.olympics-title {
  margin: 0 0 var(--space-xs) 0;
  font-size: var(--font-size-xl);
  font-weight: bold;
}

.olympics-countdown {
  font-size: var(--font-size-sm);
  color: var(--wireframe-gray-dark);
}

.status-indicator {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--wireframe-black);
  font-weight: bold;
  font-size: var(--font-size-sm);
}

.status-indicator--on-track {
  background-color: var(--wireframe-black);
  color: var(--wireframe-white);
}

.olympics-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.olympics-metric {
  border: 1px solid var(--wireframe-black);
  padding: var(--space-md);
  text-align: center;
}

.roadmap-milestones {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-sm);
}

.milestone {
  border: 1px solid var(--wireframe-black);
  padding: var(--space-md);
  text-align: center;
}

.milestone--completed {
  background-color: var(--wireframe-gray-light);
}

.milestone--current {
  border: 2px solid var(--wireframe-black);
}

.milestone--target {
  border: 2px dashed var(--wireframe-black);
}
```

## 🔬 **Research Integration Components**

### **Research Citation Component**

```html
<div class="wireframe-research-citation">
  <div class="citation-header">
    <span class="citation-icon">[📊]</span>
    <span class="citation-title">Evidence-Based Recommendation</span>
    <span class="citation-confidence">87.4% Accuracy</span>
  </div>

  <div class="citation-content">
    <p>
      Flag football athletes should increase agility training by 73% compared to
      traditional football players for optimal performance.
    </p>
  </div>

  <div class="citation-meta">
    <div class="meta-item">
      <span class="meta-label">Research Base:</span>
      <span class="meta-value">156 studies, 3,847 participants</span>
    </div>

    <div class="meta-item">
      <span class="meta-label">Study Period:</span>
      <span class="meta-value">2024-2025 Meta-analysis</span>
    </div>

    <div class="meta-item">
      <span class="meta-label">Confidence Interval:</span>
      <span class="meta-value">CI: 68-78% (95% confidence)</span>
    </div>
  </div>

  <div class="citation-actions">
    <button class="wireframe-button wireframe-button--small">
      View Full Study
    </button>
    <button class="wireframe-button wireframe-button--small">
      Related Research
    </button>
  </div>
</div>
```

```css
.wireframe-research-citation {
  border-left: 4px solid var(--wireframe-black);
  background-color: var(--wireframe-gray-light);
  padding: var(--space-md);
  margin: var(--space-md) 0;
}

.citation-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.citation-title {
  flex: 1;
  font-weight: bold;
  font-size: var(--font-size-md);
}

.citation-confidence {
  background-color: var(--wireframe-black);
  color: var(--wireframe-white);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-xs);
  font-weight: bold;
}

.citation-content {
  font-style: italic;
  margin-bottom: var(--space-md);
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  padding: var(--space-sm);
}

.citation-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.meta-label {
  font-size: var(--font-size-xs);
  font-weight: bold;
  text-transform: uppercase;
  color: var(--wireframe-gray-dark);
}

.meta-value {
  font-size: var(--font-size-sm);
}

.citation-actions {
  display: flex;
  gap: var(--space-sm);
}

.wireframe-button--small {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-xs);
  min-height: 32px;
}
```

## 📱 **Mobile-Specific Components**

### **Mobile Quick Actions Grid**

```html
<div class="mobile-quick-actions">
  <button class="mobile-action-card mobile-action-card--primary">
    <div class="action-icon-large">[▶]</div>
    <span class="action-title">Start Training</span>
    <span class="action-subtitle">AI Recommended</span>
  </button>

  <button class="mobile-action-card">
    <div class="action-icon-large">[📊]</div>
    <span class="action-title">View Progress</span>
    <span class="action-subtitle">87% This Week</span>
  </button>

  <button class="mobile-action-card">
    <div class="action-icon-large">[🏆]</div>
    <span class="action-title">Tournaments</span>
    <span class="action-subtitle">3 Upcoming</span>
  </button>

  <button class="mobile-action-card">
    <div class="action-icon-large">[👥]</div>
    <span class="action-title">Team Chat</span>
    <span class="action-subtitle">5 New Messages</span>
  </button>
</div>
```

```css
.mobile-quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.mobile-action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  border: 1px solid var(--wireframe-black);
  background-color: var(--wireframe-white);
  min-height: 120px;
  cursor: pointer;
  text-align: center;
}

.mobile-action-card--primary {
  border: 2px solid var(--wireframe-black);
  background-color: var(--wireframe-gray-light);
}

.mobile-action-card:active {
  transform: scale(0.98);
  background-color: var(--wireframe-gray-light);
}

.action-icon-large {
  font-size: 2rem;
  margin-bottom: var(--space-sm);
}

.action-title {
  font-weight: bold;
  font-size: var(--font-size-md);
  margin-bottom: var(--space-xs);
}

.action-subtitle {
  font-size: var(--font-size-xs);
  color: var(--wireframe-gray-dark);
}
```

---

**🎯 This component library consolidates all wireframe elements from 28+ files into a comprehensive, reusable system that maintains consistency while supporting the app's research-backed, Olympic-level functionality.**
