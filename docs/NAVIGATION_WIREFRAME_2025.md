# FlagFit Pro Navigation Wireframe 2025

## 🎯 Design Philosophy

Modern, intuitive navigation that prioritizes user experience, accessibility, and performance while maintaining the competitive edge of flag football training.

## 📱 Responsive Navigation System

### **Desktop Navigation (1200px+)**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🏈 FlagFit Pro                    [Dashboard] [Training] [Community] [Tournaments] [Profile]           │
│                                                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                                                     │ │
│ │  🏈 Hawks • 7.8 Chemistry           [🔔 3] [🧑 Alex] [⚙️] [🟢 Synced] [🔍] [Logout]              │ │
│ │  vs Eagles Tomorrow • 🌤️ 75°F                                                                      │ │
│ │                                                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### **Tablet Navigation (768px - 1199px)**

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 🏈 FlagFit Pro              [Dashboard] [Training] [Community] [Tournaments] [Profile] │
│                                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                                     │ │
│ │  🏈 Hawks • 7.8 Chemistry           [🔔 3] [🧑 Alex] [⚙️] [🟢 Synced] [Logout]    │ │
│ │  vs Eagles Tomorrow • 🌤️ 75°F                                                      │ │
│ │                                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### **Mobile Navigation (320px - 767px)**

```
┌─────────────────────────────────────────┐
│ 🏈 FlagFit Pro    [🔔 3] [🧑 Alex] [☰] │
├─────────────────────────────────────────┤
│                                         │
│ 🏈 Hawks • 7.8 Chemistry               │
│ vs Eagles Tomorrow • 🌤️ 75°F          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │          Main Content               │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## 🎨 Visual Design System

### **Color Palette**

- **Primary**: `#2563eb` (Blue-600) - Main brand color
- **Secondary**: `#059669` (Emerald-600) - Success states
- **Accent**: `#f59e0b` (Amber-500) - Warnings and highlights
- **Neutral**: `#6b7280` (Gray-500) - Text and borders
- **Background**: `#ffffff` (White) / `#111827` (Gray-900) - Light/Dark modes

### **Typography**

- **Logo**: `Inter Bold, 24px` - Brand identity
- **Navigation**: `Inter Medium, 16px` - Main navigation items
- **Sub-navigation**: `Inter Regular, 14px` - Secondary items
- **Status Text**: `Inter Regular, 12px` - Small status indicators

### **Spacing System**

- **Container**: `max-width: 1280px, padding: 0 24px`
- **Navigation Height**: `64px` (desktop), `56px` (mobile)
- **Item Spacing**: `32px` between main nav items
- **Icon Spacing**: `8px` between icon and text

## 🏗️ Navigation Structure

### **Primary Navigation Items**

#### 1. **Dashboard** (🏠)

- **Route**: `/dashboard`
- **Icon**: HomeIcon
- **Description**: Overview of performance, stats, and recent activity
- **Sub-items**: None (direct link)

#### 2. **Training** (💪)

- **Route**: `/training`
- **Icon**: AcademicCapIcon
- **Description**: Practice sessions, drills, and skill development
- **Sub-items**:
  - **Route Running** - Agility and route precision drills
  - **Plyometrics** - Power and explosive movement training
  - **Speed Training** - Sprint mechanics and acceleration
  - **Catching Drills** - Hand-eye coordination and ball skills
  - **Strength Training** - Resistance and conditioning
  - **Recovery** - Rest and regeneration protocols

#### 3. **Community** (👥)

- **Route**: `/community`
- **Icon**: UserGroupIcon
- **Description**: Team communication and social features
- **Sub-items**:
  - **Team Chat** - Real-time team communication
  - **Discussion Forums** - Strategy sharing and advice
  - **Team Events** - Upcoming activities and schedules
  - **Leaderboards** - Performance rankings and achievements

#### 4. **Tournaments** (🏆)

- **Route**: `/tournaments`
- **Icon**: TrophyIcon
- **Description**: Competition and tournament management
- **Sub-items**:
  - **Upcoming** - Register for future tournaments
  - **Active** - Current tournament participation
  - **Past Results** - Historical performance data
  - **Standings** - Current rankings and statistics

#### 5. **Profile** (👤)

- **Route**: `/profile`
- **Icon**: UserIcon
- **Description**: Personal settings and account management
- **Sub-items**:
  - **Personal Info** - Basic profile information
  - **Performance Stats** - Individual statistics and metrics
  - **Achievements** - Badges and accomplishments
  - **Settings** - App preferences and configuration

### **Secondary Navigation Elements**

#### **Status Bar (Top Right)**

```
[🔔 3] [🧑 Alex] [⚙️] [🟢 Synced] [🔍] [Logout]
```

- **🔔 Notifications**: Unread count badge, dropdown with recent notifications
- **🧑 User Menu**: Avatar with dropdown for profile, settings, logout
- **⚙️ Quick Settings**: Theme toggle, backup status, app preferences
- **🟢 Sync Status**: Real-time sync indicator with last sync time
- **🔍 Search**: Global search functionality
- **Logout**: Quick logout button (desktop only)

#### **Team Context Bar (Below Main Nav)**

```
🏈 Hawks • 7.8 Chemistry           vs Eagles Tomorrow • 🌤️ 75°F
```

- **Team Name**: Current team with football emoji
- **Chemistry Rating**: Team cohesion score (0-10)
- **Next Game**: Upcoming opponent and date
- **Weather**: Current conditions for training/game planning

## 🎯 Interactive States

### **Hover Effects**

- **Main Nav Items**: Background color change, subtle shadow
- **Dropdown Triggers**: Arrow rotation, background highlight
- **Status Icons**: Scale transform (1.05x), color transition
- **User Avatar**: Ring highlight, scale transform

### **Active States**

- **Current Page**: Blue underline, background tint
- **Dropdown Open**: Arrow rotation, expanded background
- **Notifications**: Red badge pulse animation
- **Sync Status**: Green pulse for active sync

### **Focus States**

- **Keyboard Navigation**: Blue outline, high contrast
- **Accessibility**: Clear focus indicators for screen readers
- **Tab Order**: Logical navigation flow

## 📱 Mobile Navigation Patterns

### **Hamburger Menu (Mobile)**

```
┌─────────────────────────────────────────┐
│ 🏈 FlagFit Pro    [🔔 3] [🧑 Alex] [☰] │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Alex Rivera                      │ │
│ │ QB/WR • Level 8                     │ │
│ │ 🔥 7 day streak                     │ │
│ ├─────────────────────────────────────┤ │
│ │ 🏠 Dashboard                        │ │
│ │ 💪 Training                         │ │
│ │ 👥 Community                        │ │
│ │ 🏆 Tournaments                      │ │
│ │ 👤 Profile                          │ │
│ ├─────────────────────────────────────┤ │
│ │ ⚙️ Settings                         │ │
│ │ 🔔 Notifications (3)                │ │
│ │ 🟢 Sync Status                      │ │
│ │ 🚪 Logout                           │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### **Bottom Navigation (Mobile Alternative)**

```
┌─────────────────────────────────────────┐
│                                         │
│              Main Content               │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ [🏠] [💪] [👥] [🏆] [👤]                │
│ Dashboard Training Community Tournaments Profile
└─────────────────────────────────────────┘
```

## 🔧 Advanced Features

### **Smart Navigation**

- **Context Awareness**: Show relevant nav items based on user role
- **Progressive Disclosure**: Hide advanced features from beginners
- **Personalization**: Remember user preferences and frequently used items
- **Adaptive Layout**: Adjust based on screen size and device capabilities

### **Performance Optimizations**

- **Lazy Loading**: Load navigation components on demand
- **Caching**: Cache navigation state and user preferences
- **Preloading**: Preload critical navigation paths
- **Minimal Re-renders**: Optimize Angular component change detection with OnPush strategy

### **Accessibility Features**

- **ARIA Labels**: Proper semantic markup for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Support for high contrast mode
- **Focus Management**: Clear focus indicators and logical tab order
- **Screen Reader**: Descriptive text for all interactive elements

## 🎨 Component Specifications

### **Navigation Container**

```css
.navigation-container {
  position: sticky;
  top: 0;
  z-index: 50;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}
```

### **Navigation Item**

```css
.nav-item {
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.nav-item.active {
  color: #2563eb;
  background: #eff6ff;
  border-bottom: 2px solid #2563eb;
}
```

### **Dropdown Menu**

```css
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 100;
  animation: slideDown 0.2s ease;
}
```

### **Status Indicators**

```css
.status-indicator {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.status-synced {
  background: #dcfce7;
  color: #166534;
}

.status-syncing {
  background: #fef3c7;
  color: #92400e;
  animation: pulse 2s infinite;
}
```

## 🚀 Implementation Guidelines

### **Angular Component Structure**

```typescript
// Main Navigation Component
@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, PrimeNGModules],
  template: `
    <nav class="navigation-container">
      <div class="navigation-header">
        <app-logo />
        <app-team-context />
      </div>

      <ul class="navigation-menu">
        <li>
          <a routerLink="/dashboard" routerLinkActive="active">
            <i class="pi pi-home"></i>
            Dashboard
          </a>
        </li>

        <li class="dropdown">
          <a routerLink="/training" routerLinkActive="active">
            <i class="pi pi-book"></i>
            Training
          </a>
          <ul class="dropdown-menu">
            <li><a routerLink="/training/routes">Route Running</a></li>
            <li><a routerLink="/training/plyometrics">Plyometrics</a></li>
            <!-- ... more items -->
          </ul>
        </li>

        <!-- ... more navigation items -->
      </ul>

      <div class="navigation-actions">
        <app-notification-bell />
        <app-user-menu />
        <app-quick-actions />
      </div>
    </nav>
  `
})
export class NavigationComponent {
  // Angular 21: Use signals for reactive state
  notifications = signal(0);
  user = signal<User | null>(null);
  team = signal<Team | null>(null);
}
```

### **State Management**

```typescript
// Angular 21: Signal-based Navigation State
export class NavigationComponent {
  // Signals for reactive state
  currentRoute = signal('/dashboard');
  isMenuOpen = signal(false);
  
  notifications = signal({
    unread: 3,
    items: [] as Notification[]
  });
  
  user = signal({
    name: 'Alex Rivera',
    avatar: '/avatar.jpg',
    role: 'player' as UserRole
  });
  
  team = signal({
    name: 'Hawks',
    chemistry: 7.8,
    nextGame: 'vs Eagles Tomorrow'
  });
  
  sync = signal({
    status: 'synced' as SyncStatus,
    lastSync: new Date('2024-12-19T10:30:00Z')
  });
  
  // Computed signal for derived state
  hasUnreadNotifications = computed(() => 
    this.notifications().unread > 0
  );
}
```

### **Responsive Breakpoints**

```css
/* Mobile First Approach */
.navigation {
  /* Base mobile styles */
}

@media (min-width: 768px) {
  .navigation {
    /* Tablet styles */
  }
}

@media (min-width: 1024px) {
  .navigation {
    /* Desktop styles */
  }
}

@media (min-width: 1280px) {
  .navigation {
    /* Large desktop styles */
  }
}
```

## 📊 User Experience Metrics

### **Performance Targets**

- **Navigation Load Time**: < 100ms
- **Dropdown Open Time**: < 50ms
- **Mobile Menu Transition**: < 200ms
- **Accessibility Score**: 100/100

### **User Engagement Goals**

- **Navigation Completion Rate**: > 95%
- **Mobile Menu Usage**: > 80% on mobile devices
- **Search Usage**: > 30% of users
- **Notification Click Rate**: > 60%

### **Accessibility Standards**

- **WCAG 2.1 AA Compliance**: Full compliance
- **Keyboard Navigation**: 100% functional
- **Screen Reader Support**: Complete compatibility
- **Color Contrast**: 4.5:1 minimum ratio

## 🎯 Success Criteria

### **Functional Requirements**

- ✅ All navigation items accessible from any page
- ✅ Responsive design works on all screen sizes
- ✅ Keyboard navigation fully functional
- ✅ Screen reader compatibility
- ✅ Performance meets target metrics

### **User Experience Requirements**

- ✅ Intuitive navigation flow
- ✅ Clear visual hierarchy
- ✅ Consistent interaction patterns
- ✅ Fast response times
- ✅ Accessible to all users

### **Technical Requirements**

- ✅ Angular 21 standalone component architecture
- ✅ TypeScript strict mode type safety
- ✅ SCSS with CSS Custom Properties (Design Tokens)
- ✅ Performance optimized (OnPush change detection, lazy loading)
- ✅ SEO friendly (Angular SSR support)

---

_This wireframe provides a comprehensive foundation for the FlagFit Pro navigation system, ensuring a modern, accessible, and user-friendly experience across all devices and user types._
