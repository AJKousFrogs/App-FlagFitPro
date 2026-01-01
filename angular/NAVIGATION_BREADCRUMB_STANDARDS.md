# Navigation & Breadcrumb Standards

**Version:** 1.0
**Date:** December 30, 2024
**Status:** ✅ Standard

---

## Overview

This document establishes navigation and breadcrumb standards for FlagFit Pro to ensure consistent user experience across all devices and features.

---

## Navigation Architecture

### **Three-Tier Navigation System**

1. **Desktop Sidebar** (> 768px) - Full navigation menu
2. **Tablet Sidebar** (768-1024px) - Collapsible sidebar
3. **Mobile Bottom Navigation** (< 768px) - Bottom tab bar

---

## Sidebar Navigation (Desktop/Tablet)

### **Structure**

```
┌─────────────────────┐
│ Logo                │
│ User Info           │
├─────────────────────┤
│ [Navigation Groups] │
│  ↳ Dashboard        │
│  ↳ Training         │
│  ↳ Analytics        │
│  ↳ ...             │
├─────────────────────┤
│ Profile             │
│ Logout              │
└─────────────────────┘
```

### **Navigation Groups**

```typescript
const navGroups = [
  {
    id: "main",
    label: "Main",
    icon: "pi-home",
    items: [
      {
        label: "Dashboard",
        route: "/dashboard",
        icon: "pi-home",
        ariaLabel: "Go to dashboard",
      },
      {
        label: "Calendar",
        route: "/calendar",
        icon: "pi-calendar",
        ariaLabel: "View calendar",
      },
    ],
  },
  {
    id: "training",
    label: "Training",
    icon: "pi-bolt",
    items: [
      {
        label: "Training Plans",
        route: "/training",
        icon: "pi-list",
        ariaLabel: "View training plans",
      },
      {
        label: "Exercises",
        route: "/exercises",
        icon: "pi-video",
        ariaLabel: "View exercises",
      },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    icon: "pi-chart-line",
    items: [
      {
        label: "Analytics",
        route: "/analytics",
        icon: "pi-chart-bar",
        ariaLabel: "View analytics",
      },
      {
        label: "Reports",
        route: "/reports",
        icon: "pi-file",
        ariaLabel: "View reports",
      },
    ],
  },
];
```

### **Active State Indicators**

```scss
.nav-item {
  position: relative;

  &.active {
    background: var(--primary-50);
    color: var(--color-brand-primary);
    font-weight: 600;

    // Active indicator bar
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--color-brand-primary);
    }
  }
}
```

### **Badge Notifications**

```html
<a routerLink="/messages" class="nav-item">
  <span class="nav-item-icon">
    <i class="pi pi-envelope"></i>
    @if (unreadMessages() > 0) {
    <p-badge
      [value]="unreadMessages().toString()"
      severity="danger"
      class="nav-badge"
    />
    }
  </span>
  <span class="nav-item-label">Messages</span>
</a>
```

### **Collapsible Mobile Sidebar**

```typescript
// In sidebar component
isOpen = signal(false);

toggleSidebar(): void {
  this.isOpen.update(v => !v);
}

closeSidebar(): void {
  this.isOpen.set(false);
}

@HostListener('window:resize', ['$event'])
onResize(event: any) {
  if (event.target.innerWidth > 768) {
    this.isOpen.set(false); // Auto-close on desktop
  }
}
```

---

## Bottom Navigation (Mobile)

### **Structure**

```
┌────────┬────────┬────────┬────────┬────────┐
│ Home   │Training│Analytics│ Team  │ More   │
└────────┴────────┴────────┴────────┴────────┘
```

### **Maximum 5 Items**

Only show 4 primary items + "More" menu for additional items:

```typescript
const PRIMARY_NAV_ITEMS = 4;

visibleNavItems = computed(() => {
  const allItems = this.getAllNavItems();
  return allItems.slice(0, PRIMARY_NAV_ITEMS);
});

moreNavItems = computed(() => {
  const allItems = this.getAllNavItems();
  return allItems.slice(PRIMARY_NAV_ITEMS);
});

hasMoreItems = computed(() => {
  return this.moreNavItems().length > 0;
});
```

### **Active State**

```scss
.nav-item {
  &.active {
    color: var(--color-brand-primary);

    .nav-icon-wrapper {
      background: var(--primary-50);
    }

    .nav-label {
      font-weight: 600;
    }
  }
}
```

### **Touch Targets**

```scss
.nav-item {
  min-height: 64px;
  min-width: 64px;

  @include touch-device {
    @include tap-target(64px);
  }
}
```

---

## Smart Breadcrumbs

### **Breadcrumb Structure**

```
Home > Training > Exercise Library > Pull-up Progressions
```

### **Automatic Route-Based Generation**

```typescript
buildBreadcrumbItems(route: string): BreadcrumbItem[] {
  const segments = route.split('/').filter(s => s);
  const items: BreadcrumbItem[] = [
    { label: 'Home', route: '/dashboard', icon: 'pi-home' }
  ];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = this.formatLabel(segment);
    const icon = this.getIconForRoute(currentPath);

    items.push({
      label,
      route: currentPath,
      icon,
      current: currentPath === route
    });
  }

  return items;
}
```

### **Context Enhancement**

```typescript
// Add contextual information (e.g., player name, team name)
enhanceWithContext(items: BreadcrumbItem[]): BreadcrumbItem[] {
  return items.map(item => {
    // If route is /players/:id, fetch player name
    if (item.route.includes('/players/')) {
      const playerId = this.extractId(item.route);
      const player = this.getPlayer(playerId);
      if (player) {
        return { ...item, label: player.name };
      }
    }
    return item;
  });
}
```

### **Quick Actions Integration**

```html
<div class="breadcrumbs-container">
  <p-breadcrumb [model]="breadcrumbItems()" />

  <!-- Context-aware quick actions -->
  <p-select
    [options]="quickActions()"
    placeholder="Quick Actions"
    (onChange)="executeAction($event.value)"
  >
    <ng-template let-action pTemplate="item">
      <div class="quick-action-item">
        <i [class]="action.icon"></i>
        <span>{{ action.label }}</span>
      </div>
    </ng-template>
  </p-select>
</div>
```

### **Responsive Breadcrumbs**

```scss
.smart-breadcrumbs {
  // Desktop: Full breadcrumb trail
  @include respond-above(md) {
    .p-breadcrumb-list {
      display: flex;
    }
  }

  // Mobile: Only show current page with back button
  @include respond-to(md) {
    .p-breadcrumb-list li:not(:last-child) {
      display: none;
    }

    .p-breadcrumb-list li:nth-last-child(2) {
      display: flex; // Show parent
    }
  }
}
```

---

## Accessibility Requirements

### **ARIA Labels**

```html
<!-- Navigation container -->
<nav aria-label="Main navigation" role="navigation">
  <!-- Navigation groups -->
  <div role="group" aria-label="Training navigation">
    <a
      routerLink="/training"
      aria-label="Go to training plans"
      [attr.aria-current]="isActive('/training') ? 'page' : null"
    >
      Training Plans
    </a>
  </div>
</nav>
```

### **Keyboard Navigation**

- **Tab** - Move between nav items
- **Enter/Space** - Activate nav item
- **Arrow Keys** - Navigate within groups (optional)
- **Escape** - Close mobile sidebar/menu

```typescript
@HostListener('keydown.escape')
onEscape() {
  this.closeSidebar();
  this.closeMoreMenu();
}
```

### **Focus Management**

```typescript
// After navigation, announce page change to screen readers
afterNavigation(): void {
  const pageName = this.getCurrentPageName();
  this.announceToScreenReader(`Navigated to ${pageName}`);
}

private announceToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
```

---

## Role-Based Navigation

### **Filter Items by Role**

```typescript
interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: string[]; // undefined = all roles
}

const navItems: NavItem[] = [
  { label: "Dashboard", route: "/dashboard", icon: "pi-home" }, // All roles
  {
    label: "Team Management",
    route: "/team",
    icon: "pi-users",
    roles: ["coach", "admin"],
  },
  {
    label: "Training Plans",
    route: "/training",
    icon: "pi-list",
    roles: ["athlete", "coach"],
  },
  { label: "Admin Panel", route: "/admin", icon: "pi-cog", roles: ["admin"] },
];

// Filter based on user role
filteredNavItems = computed(() => {
  const userRole = this.authService.getUserRole();
  return this.navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole),
  );
});
```

---

## Navigation State Management

### **Active Route Detection**

```typescript
private router = inject(Router);

currentRoute = signal<string>('');

ngOnInit(): void {
  // Track current route
  this.router.events
    .pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe((event: NavigationEnd) => {
      this.currentRoute.set(event.url);
    });
}

isActive(route: string): boolean {
  return this.currentRoute().startsWith(route);
}
```

### **Navigation Analytics**

```typescript
trackNavigation(item: NavItem): void {
  // Track navigation events for analytics
  this.analyticsService.trackEvent('navigation', {
    from: this.currentRoute(),
    to: item.route,
    label: item.label,
    timestamp: new Date().toISOString()
  });
}
```

---

## Breadcrumb Patterns

### **Dashboard → Feature → Detail**

```
Home > Team Management > Roster > John Doe (Player Profile)
```

```typescript
breadcrumbItems = [
  { label: "Home", route: "/dashboard", icon: "pi-home" },
  { label: "Team Management", route: "/team", icon: "pi-users" },
  { label: "Roster", route: "/roster", icon: "pi-list" },
  { label: "John Doe", route: "/roster/player/123", current: true },
];
```

### **With Badges**

```
Home > Messages > Inbox (3 unread)
```

```typescript
breadcrumbItems = [
  { label: "Home", route: "/dashboard", icon: "pi-home" },
  { label: "Messages", route: "/messages", icon: "pi-envelope" },
  {
    label: "Inbox",
    route: "/messages/inbox",
    current: true,
    badge: { text: "3", severity: "danger" },
  },
];
```

### **Dynamic Context**

```typescript
// For player profile: /players/123
enhancePlayerBreadcrumb(playerId: string): BreadcrumbItem {
  const player = this.playerService.getPlayer(playerId);

  return {
    label: player ? player.name : 'Player',
    route: `/players/${playerId}`,
    icon: 'pi-user',
    current: true,
    badge: player?.status === 'injured' ? { text: 'Injured', severity: 'danger' } : undefined
  };
}
```

---

## Mobile Navigation Patterns

### **Show/Hide on Scroll**

```typescript
@HostListener('window:scroll', ['$event'])
onScroll(event: any) {
  const scrollY = window.scrollY;
  const lastScrollY = this.lastScrollY();

  if (scrollY > lastScrollY && scrollY > 100) {
    // Scrolling down - hide bottom nav
    this.bottomNavVisible.set(false);
  } else {
    // Scrolling up - show bottom nav
    this.bottomNavVisible.set(true);
  }

  this.lastScrollY.set(scrollY);
}
```

```scss
.bottom-nav {
  transform: translateY(0);
  transition: transform 0.3s ease;

  &.hidden {
    transform: translateY(100%);
  }
}
```

### **Safe Area Insets** (for iOS notch)

```scss
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
  padding-bottom: constant(safe-area-inset-bottom); // iOS 11.0-11.2
}
```

---

## Testing Checklist

### **Navigation Tests**

- [ ] Active state highlights current route
- [ ] Badges update dynamically
- [ ] Role-based filtering works
- [ ] Mobile sidebar opens/closes
- [ ] Bottom nav shows correct items
- [ ] "More" menu displays overflow items
- [ ] Keyboard navigation works
- [ ] Focus indicators visible

### **Breadcrumb Tests**

- [ ] Breadcrumbs generate correctly from route
- [ ] Context enhancement adds dynamic data
- [ ] Current page is not clickable
- [ ] Quick actions show for current page
- [ ] Mobile breadcrumbs show parent + current
- [ ] ARIA labels present

### **Accessibility Tests**

- [ ] Screen reader announces navigation
- [ ] Keyboard shortcuts work
- [ ] Focus management correct
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets 44x44px minimum

---

## Migration Checklist

- [ ] Move inline styles to SCSS files
- [ ] Use design system spacing (`space()`)
- [ ] Use responsive mixins (`respond-to()`)
- [ ] Add ARIA labels to all nav items
- [ ] Implement role-based filtering
- [ ] Add navigation analytics tracking
- [ ] Test on all breakpoints (320px - 1920px)
- [ ] Test with keyboard only
- [ ] Test with screen reader
- [ ] Ensure safe area insets on iOS

---

## Examples

### **Sidebar Navigation Item**

```html
<a
  routerLink="/training"
  routerLinkActive="active"
  class="nav-item"
  aria-label="Go to training plans"
  (click)="trackNavigation('training')"
>
  <span class="nav-item-icon">
    <i class="pi pi-list"></i>
    @if (newTrainingPlans() > 0) {
    <p-badge [value]="newTrainingPlans().toString()" severity="info" />
    }
  </span>
  <span class="nav-item-label">Training Plans</span>
</a>
```

### **Bottom Nav Item**

```html
<a
  routerLink="/dashboard"
  routerLinkActive="active"
  [routerLinkActiveOptions]="{ exact: true }"
  class="nav-item"
  pRipple
>
  <div class="nav-icon-wrapper">
    <i class="pi pi-home"></i>
  </div>
  <span class="nav-label">Home</span>
</a>
```

### **Breadcrumb with Quick Actions**

```html
<app-smart-breadcrumbs />
```

```typescript
// In component
quickActions = computed(() => {
  const page = this.getCurrentPage();

  const actionsMap: Record<string, QuickAction[]> = {
    roster: [
      { label: "Add Player", icon: "pi-plus", action: () => this.addPlayer() },
      {
        label: "Import CSV",
        icon: "pi-upload",
        action: () => this.importCSV(),
      },
    ],
    training: [
      { label: "New Plan", icon: "pi-plus", action: () => this.createPlan() },
      { label: "Templates", icon: "pi-file", route: "/training/templates" },
    ],
  };

  return actionsMap[page] || [];
});
```

---

**Status:** ✅ Standards established
**Next:** Migrate all navigation components to new standards
