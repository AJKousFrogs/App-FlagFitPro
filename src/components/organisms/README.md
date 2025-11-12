# Organisms

## Overview

Organisms are complex components that combine molecules and atoms into distinct sections of an interface. They form the backbone of page layouts.

## Components

### Navigation Sidebar
Main navigation sidebar with logo, navigation links, and user section.

**File:** `navigation-sidebar/navigation-sidebar.html`  
**Documentation:** `navigation-sidebar/README.md`

**Quick Example:**
```html
<nav class="sidebar">
    <div class="sidebar-header">...</div>
    <ul class="sidebar-nav">...</ul>
</nav>
```

### Dashboard Header
Page header component with title, search, notifications, and user menu.

**File:** `dashboard-header/dashboard-header.html`  
**Documentation:** `dashboard-header/README.md`

**Quick Example:**
```html
<header class="dashboard-header">
    <div class="header-left">
        <h1 class="page-title">Title</h1>
    </div>
    <div class="header-right">...</div>
</header>
```

### Performance Chart
Data visualization component using Chart.js for performance metrics.

**File:** `performance-chart/performance-chart.html`  
**Documentation:** `performance-chart/README.md`

**Quick Example:**
```html
<div class="performance-chart-card card">
    <div class="card-body">
        <canvas id="chart"></canvas>
    </div>
</div>
```

### Roster Table
Data table component for displaying athlete rosters with sorting and actions.

**File:** `roster-table/roster-table.html`  
**Documentation:** `roster-table/README.md`

**Quick Example:**
```html
<div class="roster-table-card card">
    <div class="card-body">
        <table class="roster-table">...</table>
    </div>
</div>
```

## Usage

Organisms combine molecules and atoms into complex components:

```html
<!-- Navigation Sidebar combines logo, links, and user section -->
<nav class="sidebar">
    <div class="sidebar-header">
        <!-- Logo molecule -->
    </div>
    <ul class="sidebar-nav">
        <!-- Navigation links (atoms) -->
    </ul>
</nav>
```

## Design Principles

- **Complex Components** - Combine multiple molecules
- **Distinct Sections** - Form recognizable parts of interface
- **Reusable Patterns** - Can be used across pages
- **Functional** - Serve specific purposes

## Common Patterns

### Navigation Components
Sidebars, headers, and menus:

```html
<nav class="sidebar">
    <!-- Logo, links, user section -->
</nav>
```

### Data Display Components
Tables, charts, and lists:

```html
<div class="roster-table-card card">
    <div class="card-body">
        <table class="roster-table">
            <!-- Table content -->
        </table>
    </div>
</div>
```

### Form Sections
Complex forms with multiple fields:

```html
<div class="form-section">
    <!-- Multiple form groups -->
</div>
```

## Notes

- Organisms are the most complex components
- They combine molecules and atoms
- They form distinct interface sections
- They're used in templates to build pages

