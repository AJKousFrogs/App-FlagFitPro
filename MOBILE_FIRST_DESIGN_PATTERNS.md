# Mobile-First Design Patterns

## Overview

Flag football athletes primarily access FlagFit Pro on mobile devices during training sessions. This guide ensures every component is optimized for touch interactions, small screens, and on-the-go usage.

## Core Mobile Principles

### 1. Touch-First Design

- **Minimum touch target**: 44×44px (iOS) or 48×48dp (Android)
- **Adequate spacing**: 8px minimum between interactive elements
- **Thumb-friendly zones**: Place primary actions in easy-to-reach areas

### 2. Progressive Enhancement

- Build mobile-first, enhance for larger screens
- Core functionality works without JavaScript
- Critical content loads first

### 3. Performance Obsession

- Pages load in < 2 seconds on 3G
- Images are optimized and lazy-loaded
- Minimize JavaScript bundle size

## Responsive Breakpoints

```css
/* Mobile breakpoints - design system standard */
:root {
  /* Extra Small (Portrait phones) */
  --breakpoint-xs: 320px;
  
  /* Small (Landscape phones) */
  --breakpoint-sm: 480px;
  
  /* Medium (Tablets) */
  --breakpoint-md: 768px;
  
  /* Large (Small laptops) */
  --breakpoint-lg: 1024px;
  
  /* Extra Large (Desktops) */
  --breakpoint-xl: 1280px;
  
  /* 2X Large (Large desktops) */
  --breakpoint-2xl: 1536px;
}

/* Usage in media queries */
@media (min-width: 480px) {
  /* Styles for sm and up */
}

@media (min-width: 768px) {
  /* Styles for md and up */
}

@media (min-width: 1024px) {
  /* Styles for lg and up */
}
```

## Touch Target Guidelines

### Minimum Sizes

```css
/* Touch target tokens */
:root {
  --touch-target-min: 44px; /* iOS minimum */
  --touch-target-comfortable: 48px; /* Android/comfortable */
  --touch-target-large: 56px; /* Large/primary actions */
  --touch-spacing-min: 8px; /* Minimum spacing between targets */
}
```

### Button Sizes

```css
/* Mobile button hierarchy */
.btn {
  min-height: var(--touch-target-comfortable);
  min-width: var(--touch-target-comfortable);
  padding: 12px 24px;
  font-size: 16px; /* Prevents zoom on iOS */
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

/* Icon-only buttons */
.btn-icon {
  width: var(--touch-target-comfortable);
  height: var(--touch-target-comfortable);
  padding: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### Interactive List Items

```css
.list-item-interactive {
  min-height: var(--touch-target-comfortable);
  padding: 12px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* Add visual feedback */
.list-item-interactive:active {
  background: var(--surface-secondary);
  transform: scale(0.98);
}
```

## Mobile Navigation Patterns

### Bottom Navigation Bar

**Use Case:** Primary app navigation on mobile devices

**HTML Structure:**

```html
<nav class="bottom-nav" role="navigation" aria-label="Main navigation">
  <a href="/dashboard" class="bottom-nav-item bottom-nav-item--active" aria-current="page">
    <svg class="bottom-nav-icon" width="24" height="24">
      <use href="#icon-home"></use>
    </svg>
    <span class="bottom-nav-label">Home</span>
  </a>
  
  <a href="/schedule" class="bottom-nav-item">
    <svg class="bottom-nav-icon" width="24" height="24">
      <use href="#icon-calendar"></use>
    </svg>
    <span class="bottom-nav-label">Schedule</span>
  </a>
  
  <a href="/training" class="bottom-nav-item">
    <svg class="bottom-nav-icon" width="24" height="24">
      <use href="#icon-activity"></use>
    </svg>
    <span class="bottom-nav-label">Training</span>
  </a>
  
  <a href="/roster" class="bottom-nav-item">
    <svg class="bottom-nav-icon" width="24" height="24">
      <use href="#icon-users"></use>
    </svg>
    <span class="bottom-nav-label">Roster</span>
  </a>
  
  <a href="/profile" class="bottom-nav-item">
    <svg class="bottom-nav-icon" width="24" height="24">
      <use href="#icon-user"></use>
    </svg>
    <span class="bottom-nav-label">Profile</span>
  </a>
</nav>
```

**CSS Styles:**

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
  z-index: var(--z-index-navigation);
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
  border-radius: var(--radius-md);
  transition: all var(--motion-duration-fast) var(--motion-easing-standard);
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

/* Hide on desktop */
@media (min-width: 1024px) {
  .bottom-nav {
    display: none;
  }
}
```

### Hamburger Menu (Overflow Navigation)

**Use Case:** Secondary navigation and settings on mobile

**HTML Structure:**

```html
<button class="hamburger-btn" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
  <span class="hamburger-icon">
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
  </span>
</button>

<div class="mobile-menu" id="mobile-menu" aria-hidden="true">
  <div class="mobile-menu-backdrop"></div>
  
  <nav class="mobile-menu-panel" role="navigation">
    <div class="mobile-menu-header">
      <h2 class="mobile-menu-title">Menu</h2>
      <button class="btn-icon" aria-label="Close menu">
        <svg width="24" height="24">
          <use href="#icon-x"></use>
        </svg>
      </button>
    </div>
    
    <ul class="mobile-menu-list">
      <li>
        <a href="/settings" class="mobile-menu-item">
          <svg class="menu-icon" width="20" height="20">
            <use href="#icon-settings"></use>
          </svg>
          <span>Settings</span>
        </a>
      </li>
      <li>
        <a href="/notifications" class="mobile-menu-item">
          <svg class="menu-icon" width="20" height="20">
            <use href="#icon-bell"></use>
          </svg>
          <span>Notifications</span>
          <span class="menu-badge">3</span>
        </a>
      </li>
      <li>
        <a href="/help" class="mobile-menu-item">
          <svg class="menu-icon" width="20" height="20">
            <use href="#icon-help-circle"></use>
          </svg>
          <span>Help & Support</span>
        </a>
      </li>
      <li>
        <button class="mobile-menu-item" onclick="logout()">
          <svg class="menu-icon" width="20" height="20">
            <use href="#icon-log-out"></use>
          </svg>
          <span>Sign Out</span>
        </button>
      </li>
    </ul>
  </nav>
</div>
```

**CSS Styles:**

```css
/* Hamburger button */
.hamburger-btn {
  width: var(--touch-target-comfortable);
  height: var(--touch-target-comfortable);
  padding: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 24px;
}

.hamburger-line {
  width: 100%;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all var(--motion-duration-normal) var(--motion-easing-standard);
}

.hamburger-btn[aria-expanded="true"] .hamburger-line:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.hamburger-btn[aria-expanded="true"] .hamburger-line:nth-child(2) {
  opacity: 0;
}

.hamburger-btn[aria-expanded="true"] .hamburger-line:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* Mobile menu */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-index-modal);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--motion-duration-normal) var(--motion-easing-standard);
}

.mobile-menu[aria-hidden="false"] {
  opacity: 1;
  pointer-events: auto;
}

.mobile-menu-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.mobile-menu-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  max-width: 80vw;
  background: var(--surface-primary);
  box-shadow: var(--shadow-2xl);
  transform: translateX(100%);
  transition: transform var(--motion-duration-normal) var(--motion-easing-standard);
  overflow-y: auto;
}

.mobile-menu[aria-hidden="false"] .mobile-menu-panel {
  transform: translateX(0);
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-default);
}

.mobile-menu-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.mobile-menu-list {
  list-style: none;
  padding: var(--spacing-2) 0;
  margin: 0;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  background: transparent;
  border: none;
  text-align: left;
  text-decoration: none;
  color: var(--text-primary);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: background var(--motion-duration-fast) var(--motion-easing-standard);
  -webkit-tap-highlight-color: transparent;
}

.mobile-menu-item:active {
  background: var(--surface-secondary);
}

.menu-icon {
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.menu-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: var(--status-error-500);
  color: #ffffff;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
}
```

**JavaScript:**

```javascript
// Mobile menu functionality
const hamburgerBtn = document.querySelector('.hamburger-btn');
const mobileMenu = document.querySelector('.mobile-menu');
const backdrop = document.querySelector('.mobile-menu-backdrop');
const closeBtn = document.querySelector('.mobile-menu-header .btn-icon');

function openMenu() {
  mobileMenu.setAttribute('aria-hidden', 'false');
  hamburgerBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  mobileMenu.setAttribute('aria-hidden', 'true');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburgerBtn.addEventListener('click', () => {
  const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
  isExpanded ? closeMenu() : openMenu();
});

backdrop.addEventListener('click', closeMenu);
closeBtn.addEventListener('click', closeMenu);

// Close on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu.getAttribute('aria-hidden') === 'false') {
    closeMenu();
  }
});
```

## Mobile Form Patterns

### Form Input Optimization

**HTML Structure:**

```html
<form class="mobile-form">
  <!-- Optimized text input -->
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
  
  <!-- Email input with proper keyboard -->
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
  
  <!-- Phone input with numeric keyboard -->
  <div class="form-group">
    <label for="phone" class="form-label">Phone Number</label>
    <input
      type="tel"
      id="phone"
      name="phone"
      class="form-input"
      placeholder="(555) 123-4567"
      autocomplete="tel"
      inputmode="tel"
      pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
    />
  </div>
  
  <!-- Number input for metrics -->
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
      step="1"
    />
  </div>
  
  <!-- Date input with native picker -->
  <div class="form-group">
    <label for="birth-date" class="form-label">Date of Birth</label>
    <input
      type="date"
      id="birth-date"
      name="birth-date"
      class="form-input"
      autocomplete="bday"
    />
  </div>
  
  <!-- Select with large touch targets -->
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
  
  <!-- Mobile-friendly submit -->
  <button type="submit" class="btn-primary btn-lg btn-full-width">
    Save Athlete
  </button>
</form>
```

**CSS Styles:**

```css
.mobile-form {
  padding: var(--spacing-4);
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
  border-radius: var(--radius-md);
  transition: all var(--motion-duration-fast) var(--motion-easing-standard);
  appearance: none;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px var(--color-brand-primary-alpha-10);
}

/* iOS specific fixes */
.form-input::-webkit-input-placeholder {
  color: var(--text-tertiary);
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
  .mobile-form {
    padding-bottom: calc(var(--spacing-20) + env(safe-area-inset-bottom));
  }
  
  .mobile-form .btn-primary {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0;
    border-radius: 0;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    z-index: var(--z-index-sticky);
  }
}
```

### Input Type Best Practices

| Data Type | Input Type | inputmode | Pattern | Keyboard |
|-----------|-----------|-----------|---------|----------|
| Name | text | text | - | QWERTY |
| Email | email | email | - | Email (@) |
| Phone | tel | tel | [0-9]+ | Numeric |
| Number | number | numeric | [0-9]* | Numeric |
| URL | url | url | - | URL (.com) |
| Search | search | search | - | QWERTY with search |
| Password | password | text | - | QWERTY |

## Swipe Gestures

### Swipeable List Items

**Use Case:** Delete or archive items with swipe gesture

**HTML Structure:**

```html
<ul class="swipeable-list">
  <li class="swipeable-item">
    <div class="swipeable-content">
      <div class="athlete-card">
        <img src="avatar.jpg" alt="John Smith" class="athlete-avatar">
        <div class="athlete-info">
          <h4 class="athlete-name">John Smith</h4>
          <p class="athlete-position">Quarterback</p>
        </div>
      </div>
    </div>
    
    <div class="swipeable-actions">
      <button class="swipe-action swipe-action--delete" aria-label="Remove athlete">
        <svg width="20" height="20">
          <use href="#icon-trash"></use>
        </svg>
      </button>
    </div>
  </li>
  
  <!-- More swipeable items -->
</ul>
```

**CSS Styles:**

```css
.swipeable-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.swipeable-item {
  position: relative;
  overflow: hidden;
  background: var(--surface-primary);
  border-bottom: 1px solid var(--border-default);
}

.swipeable-content {
  position: relative;
  background: var(--surface-primary);
  transition: transform var(--motion-duration-normal) var(--motion-easing-standard);
  z-index: 2;
}

.swipeable-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding-right: var(--spacing-4);
  z-index: 1;
}

.swipe-action {
  width: 64px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  transition: background var(--motion-duration-fast) var(--motion-easing-standard);
}

.swipe-action--delete {
  background: var(--status-error-500);
}

.swipe-action--delete:active {
  background: var(--status-error-600);
}

.athlete-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
}

.athlete-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.athlete-info {
  flex: 1;
}

.athlete-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 4px 0;
}

.athlete-position {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}
```

**JavaScript:**

```javascript
class SwipeableList {
  constructor(element) {
    this.element = element;
    this.items = element.querySelectorAll('.swipeable-item');
    this.init();
  }
  
  init() {
    this.items.forEach(item => {
      const content = item.querySelector('.swipeable-content');
      let startX = 0;
      let currentX = 0;
      let isDragging = false;
      
      content.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        content.style.transition = 'none';
      });
      
      content.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        
        // Only allow left swipe (negative values)
        if (diffX < 0) {
          const moveX = Math.max(diffX, -80); // Max swipe 80px
          content.style.transform = `translateX(${moveX}px)`;
        }
      });
      
      content.addEventListener('touchend', () => {
        isDragging = false;
        content.style.transition = '';
        
        const diffX = currentX - startX;
        
        if (diffX < -40) {
          // Swipe threshold reached - show actions
          content.style.transform = 'translateX(-80px)';
        } else {
          // Reset
          content.style.transform = 'translateX(0)';
        }
      });
      
      // Delete action
      const deleteBtn = item.querySelector('.swipe-action--delete');
      deleteBtn.addEventListener('click', () => {
        item.style.height = item.offsetHeight + 'px';
        item.style.overflow = 'hidden';
        item.style.transition = 'height 0.3s ease';
        
        setTimeout(() => {
          item.style.height = '0';
          setTimeout(() => item.remove(), 300);
        }, 10);
      });
    });
  }
}

// Initialize
document.querySelectorAll('.swipeable-list').forEach(list => {
  new SwipeableList(list);
});
```

## Pull-to-Refresh Pattern

**Use Case:** Refresh data on mobile by pulling down

**HTML Structure:**

```html
<div class="pull-to-refresh-container">
  <div class="pull-to-refresh-indicator">
    <svg class="refresh-icon" width="24" height="24">
      <use href="#icon-refresh-cw"></use>
    </svg>
    <span class="refresh-text">Pull to refresh</span>
  </div>
  
  <div class="scrollable-content">
    <!-- Your content here -->
  </div>
</div>
```

**CSS Styles:**

```css
.pull-to-refresh-container {
  position: relative;
  overflow: hidden;
  height: 100vh;
}

.pull-to-refresh-indicator {
  position: absolute;
  top: -80px;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  background: var(--surface-primary);
  transition: top var(--motion-duration-normal) var(--motion-easing-standard);
}

.pull-to-refresh-indicator.active {
  top: 0;
}

.refresh-icon {
  width: 24px;
  height: 24px;
  color: var(--color-brand-primary);
  animation: spin 1s linear infinite;
}

.pull-to-refresh-indicator:not(.refreshing) .refresh-icon {
  animation: none;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.refresh-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.scrollable-content {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

**JavaScript:**

```javascript
class PullToRefresh {
  constructor(container, onRefresh) {
    this.container = container;
    this.indicator = container.querySelector('.pull-to-refresh-indicator');
    this.content = container.querySelector('.scrollable-content');
    this.onRefresh = onRefresh;
    this.startY = 0;
    this.currentY = 0;
    this.threshold = 80;
    this.init();
  }
  
  init() {
    this.content.addEventListener('touchstart', (e) => {
      if (this.content.scrollTop === 0) {
        this.startY = e.touches[0].clientY;
      }
    });
    
    this.content.addEventListener('touchmove', (e) => {
      if (this.content.scrollTop === 0) {
        this.currentY = e.touches[0].clientY;
        const diff = this.currentY - this.startY;
        
        if (diff > 0) {
          e.preventDefault();
          const pull = Math.min(diff * 0.5, this.threshold);
          this.indicator.style.top = (pull - this.threshold) + 'px';
          
          if (pull >= this.threshold) {
            this.indicator.classList.add('ready');
          } else {
            this.indicator.classList.remove('ready');
          }
        }
      }
    });
    
    this.content.addEventListener('touchend', () => {
      if (this.indicator.classList.contains('ready')) {
        this.refresh();
      } else {
        this.reset();
      }
    });
  }
  
  async refresh() {
    this.indicator.classList.add('refreshing');
    this.indicator.classList.remove('ready');
    this.indicator.style.top = '0';
    
    try {
      await this.onRefresh();
    } finally {
      setTimeout(() => this.reset(), 500);
    }
  }
  
  reset() {
    this.indicator.classList.remove('refreshing', 'ready');
    this.indicator.style.top = '';
  }
}

// Usage
new PullToRefresh(
  document.querySelector('.pull-to-refresh-container'),
  async () => {
    // Refresh data
    await fetch('/api/refresh');
  }
);
```

## Mobile Card Layouts

### Stacked Cards (Mobile-First)

```css
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

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-6);
  }
}

/* Large desktop: 4 columns */
@media (min-width: 1280px) {
  .card-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Horizontal Scroll Cards

**Use Case:** Show multiple cards horizontally on mobile without wrapping

```html
<div class="horizontal-scroll-container">
  <h3 class="section-title">Recent Workouts</h3>
  
  <div class="horizontal-scroll">
    <div class="workout-card">
      <!-- Card content -->
    </div>
    <div class="workout-card">
      <!-- Card content -->
    </div>
    <div class="workout-card">
      <!-- Card content -->
    </div>
  </div>
</div>
```

**CSS Styles:**

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
  overflow-y: hidden;
  padding: 0 var(--spacing-4);
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.horizontal-scroll::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}

.workout-card {
  flex: 0 0 280px;
  scroll-snap-align: start;
  background: var(--surface-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
}

/* Desktop: Show grid instead of scroll */
@media (min-width: 1024px) {
  .horizontal-scroll {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    overflow-x: visible;
    scroll-snap-type: none;
  }
  
  .workout-card {
    flex: 1;
  }
}
```

## Safe Areas for Notched Devices

```css
/* Support for iPhone notch, home indicator, etc. */
:root {
  --safe-area-top: env(safe-area-inset-top, 0);
  --safe-area-bottom: env(safe-area-inset-bottom, 0);
  --safe-area-left: env(safe-area-inset-left, 0);
  --safe-area-right: env(safe-area-inset-right, 0);
}

/* Fixed header with safe area */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding-top: var(--safe-area-top);
  background: var(--surface-primary);
  z-index: var(--z-index-sticky);
}

/* Bottom navigation with safe area */
.bottom-nav {
  padding-bottom: calc(8px + var(--safe-area-bottom));
}

/* Full-screen modal */
.modal-fullscreen {
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
  padding-left: var(--safe-area-left);
  padding-right: var(--safe-area-right);
}
```

## Mobile Performance Optimizations

### Image Optimization

```html
<!-- Responsive images with srcset -->
<img
  src="athlete-400.jpg"
  srcset="
    athlete-400.jpg 400w,
    athlete-800.jpg 800w,
    athlete-1200.jpg 1200w
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

<!-- WebP with fallback -->
<picture>
  <source srcset="athlete.webp" type="image/webp">
  <source srcset="athlete.jpg" type="image/jpeg">
  <img src="athlete.jpg" alt="Athlete training">
</picture>
```

### Lazy Loading Content

```javascript
// Intersection Observer for lazy loading
const lazyLoadObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const element = entry.target;
      
      // Load image
      if (element.dataset.src) {
        element.src = element.dataset.src;
        element.removeAttribute('data-src');
      }
      
      // Load component
      if (element.dataset.component) {
        loadComponent(element.dataset.component, element);
      }
      
      lazyLoadObserver.unobserve(element);
    }
  });
}, {
  rootMargin: '50px' // Start loading 50px before visible
});

// Observe all lazy elements
document.querySelectorAll('[data-src], [data-component]').forEach(el => {
  lazyLoadObserver.observe(el);
});
```

### Reduce JavaScript Bundle

```javascript
// Dynamic imports for mobile
async function loadHeavyFeature() {
  if (window.innerWidth < 768) {
    // Load lightweight mobile version
    const module = await import('./features/mobile-version.js');
    return module.default;
  } else {
    // Load full desktop version
    const module = await import('./features/desktop-version.js');
    return module.default;
  }
}
```

## Mobile Testing Checklist

Test every component on mobile devices:

- [ ] Touch targets are minimum 44×44px
- [ ] Forms prevent zoom (font-size ≥ 16px)
- [ ] Swipe gestures work smoothly
- [ ] Pull-to-refresh functions correctly
- [ ] Bottom navigation doesn't overlap content
- [ ] Safe areas respected on notched devices
- [ ] Images are optimized and lazy-loaded
- [ ] Content readable without horizontal scroll
- [ ] Interactive feedback (active states) visible
- [ ] Forms show correct keyboard types
- [ ] Page loads in < 2 seconds on 3G
- [ ] No layout shift during loading
- [ ] Works in landscape and portrait
- [ ] Gestures don't interfere with browser navigation
- [ ] Works offline (PWA features if applicable)

## Device Testing Matrix

| Device | Screen Size | Test Priority | Key Focus Areas |
|--------|------------|---------------|-----------------|
| iPhone SE | 375×667 | High | Small screen, single column |
| iPhone 14 Pro | 393×852 | High | Notch/Dynamic Island, safe areas |
| iPhone 14 Pro Max | 430×932 | Medium | Large phone, reachability |
| Samsung Galaxy S23 | 360×760 | High | Android, small screen |
| iPad Mini | 768×1024 | Medium | Tablet breakpoint transition |
| iPad Pro 11" | 834×1194 | Low | Large tablet layout |

---

_Last Updated: December 2024_

