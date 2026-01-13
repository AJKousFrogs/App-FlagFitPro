# Wireframe: Header / Top Navigation Bar

**Component:** Global Header  
**Location:** Top of all pages  
**Users:** All users  
**Status:** ✅ Implemented  
**Source:** `angular/src/app/shared/components/header/header.component.ts`

---

## Purpose

Persistent top navigation bar providing quick access to key functions: Olympics countdown, global search, notifications, settings, theme toggle, and user profile.

---

## Skeleton Wireframe (Current Implementation)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                  │
│  ┌───────────────────────┐                     ┌────────────────────────────────────────────┐   │
│  │ 🏈 OLYMPICS           │                     │ 🔍 Search for players, teams &    ⌘K     │   │
│  │ 923D : 09H : 31M : 26S│                     │    more                                   │   │
│  └───────────────────────┘                     └────────────────────────────────────────────┘   │
│                                                                                                  │
│                                                                 🔔    ⚙️    🌙 Light    [AK]   │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Wireframe

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                        │
│  ┌─────────────────────────────┐         ┌───────────────────────────────────────┐    ┌──────────────┐│
│  │ 🏈 OLYMPICS                 │         │ 🔍 Search for players, teams & more   │    │ 🔔  ⚙️  🌙  ││
│  │ ───────────────────────── │         │                                  ⌘K   │    │  Light [AK] ││
│  │ 923D : 09H : 31M : 26S     │         └───────────────────────────────────────┘    └──────────────┘│
│  │                             │                                                                      │
│  │ ↑ Countdown to LA 2028     │                                                                      │
│  └─────────────────────────────┘                                                                      │
│                                                                                                        │
│    ↓ LEFT SECTION                          ↓ CENTER SECTION                     ↓ RIGHT SECTION       │
│                                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Left Section - Olympics Countdown ✅

| Element             | Status | Notes                            |
| ------------------- | ------ | -------------------------------- |
| Olympics badge/icon | ✅     | Green "OLYMPICS" label           |
| Countdown timer     | ✅     | Days : Hours : Minutes : Seconds |
| Real-time update    | ✅     | Ticks every second               |

**Business Logic:**

```typescript
// Target: LA 2028 Olympics Opening Ceremony
const olympicsDate = new Date("2028-07-14T19:00:00Z"); // July 14, 2028

interface CountdownDisplay {
  days: number; // 923
  hours: number; // 09
  minutes: number; // 31
  seconds: number; // 26
}

// Updates every second
setInterval(() => updateCountdown(), 1000);
```

---

### 2. Center Section - Global Search ✅

| Element                | Status | Notes                                           |
| ---------------------- | ------ | ----------------------------------------------- |
| Search input           | ✅     | Placeholder: "Search for players, teams & more" |
| Keyboard shortcut hint | ✅     | `⌘K` (Mac) / `Ctrl+K` (Windows)                 |
| Search icon            | ✅     | Magnifying glass                                |
| Click to open          | ✅     | Opens global search modal                       |

**Keyboard Shortcut:**

```typescript
// Global keyboard listener
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    openGlobalSearch();
  }
});
```

**Search Scope:**

- Players
- Teams
- Exercises
- Training programs
- Videos
- Plays (playbook)
- Knowledge base articles

---

### 3. Right Section - Actions ✅

| Element       | Icon  | Status | Notes                     |
| ------------- | ----- | ------ | ------------------------- |
| Notifications | 🔔    | ✅     | Opens notifications panel |
| Settings      | ⚙️    | ✅     | Links to `/settings`      |
| Theme toggle  | 🌙/☀️ | ✅     | Light/Dark mode switch    |
| User avatar   | [AK]  | ✅     | Initials or profile image |

---

### 3a. Notifications Bell 🔔

| Element      | Status | Notes                               |
| ------------ | ------ | ----------------------------------- |
| Bell icon    | ✅     | Static icon                         |
| Unread badge | ✅     | Red dot or count (e.g., "3")        |
| Click action | ✅     | Opens slide-out notifications panel |

**Badge Logic:**

```typescript
interface NotificationBadge {
  show: boolean; // true if unread > 0
  count: number; // Number of unread
  displayText: string; // "3" or "9+" if > 9
}
```

---

### 3b. Settings Gear ⚙️

| Element      | Status | Notes                    |
| ------------ | ------ | ------------------------ |
| Gear icon    | ✅     | Settings cog             |
| Click action | ✅     | Navigates to `/settings` |
| Tooltip      | ⚠️     | "Settings" on hover      |

---

### 3c. Theme Toggle 🌙/☀️

| Element          | Status | Notes                 |
| ---------------- | ------ | --------------------- |
| Moon icon (dark) | ✅     | When in light mode    |
| Sun icon (light) | ✅     | When in dark mode     |
| Label text       | ✅     | "Light" or "Dark"     |
| Click action     | ✅     | Toggles theme         |
| Persists         | ✅     | Saved to localStorage |

**Theme Logic:**

```typescript
interface ThemeState {
  current: "light" | "dark";
  label: string; // Displays opposite: "Light" when dark, "Dark" when light
  icon: "moon" | "sun";
}

function toggleTheme(): void {
  const newTheme = theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", newTheme);
  document.documentElement.setAttribute("data-theme", newTheme);
}
```

---

### 3d. User Avatar [AK]

| Element           | Status | Notes                             |
| ----------------- | ------ | --------------------------------- |
| Avatar image      | ✅     | If user has uploaded photo        |
| Initials fallback | ✅     | First + Last initial (e.g., "AK") |
| Click action      | ✅     | Opens dropdown menu               |
| Dropdown menu     | ✅     | Profile, Settings, Logout         |

**Avatar Dropdown Menu:**

```
┌─────────────────────────┐
│ 👤 View Profile         │
│ ⚙️ Settings             │
│ ─────────────────────── │
│ 🚪 Sign Out             │
└─────────────────────────┘
```

---

## Responsive Behavior

| Breakpoint          | Olympics            | Search                  | Actions            |
| ------------------- | ------------------- | ----------------------- | ------------------ |
| Desktop (>1024px)   | Full countdown      | Full width              | All icons + labels |
| Tablet (768-1024px) | Compact (D:H:M)     | Reduced width           | Icons only         |
| Mobile (<768px)     | Hidden or icon only | Icon only (opens modal) | Icons only         |

**Mobile Header:**

```
┌────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                    🔍  🔔  ⚙️  🌙  [AK]     │
└────────────────────────────────────────────────────────────────┘
```

---

## Interactions

| Action                   | Result                                            |
| ------------------------ | ------------------------------------------------- |
| Click Olympics countdown | No action (informational)                         |
| Click search bar         | Opens global search modal (`25-GLOBAL-SEARCH.md`) |
| Press `⌘K` / `Ctrl+K`    | Opens global search modal                         |
| Click 🔔                 | Opens notifications panel (`24-NOTIFICATIONS.md`) |
| Click ⚙️                 | Navigates to `/settings`                          |
| Click theme toggle       | Switches light/dark mode                          |
| Click avatar             | Opens dropdown menu                               |
| Click "View Profile"     | Navigates to `/profile`                           |
| Click "Sign Out"         | Logs out, redirects to login                      |

---

## States

| State                | Behavior                                  |
| -------------------- | ----------------------------------------- |
| Loading              | Skeleton for avatar, countdown shows "--" |
| Logged in            | Full header with user info                |
| Logged out           | Redirect to login (header not shown)      |
| Notifications unread | Badge shows count                         |
| No notifications     | No badge                                  |

---

## Data Sources

| Data          | Service               | Notes                   |
| ------------- | --------------------- | ----------------------- |
| User info     | `AuthService`         | Name, avatar, initials  |
| Unread count  | `NotificationService` | Real-time subscription  |
| Theme         | `ThemeService`        | localStorage + CSS vars |
| Olympics date | Static                | Hardcoded target date   |

---

## Implementation Checklist

- [x] Olympics countdown with live timer
- [x] Global search bar with placeholder
- [x] Keyboard shortcut (⌘K)
- [x] Notifications bell icon
- [x] Unread notifications badge
- [x] Settings gear icon
- [x] Theme toggle (light/dark)
- [x] Theme label text
- [x] User avatar with initials fallback
- [x] Avatar dropdown menu
- [x] Responsive layout
- [ ] Tooltip on hover for icons
- [ ] Mobile hamburger menu

---

## Related Wireframes

| Wireframe           | Route       | Relationship                |
| ------------------- | ----------- | --------------------------- |
| Global Search       | Modal       | Triggered by search bar     |
| Notifications Panel | Slide-out   | Triggered by bell icon      |
| Settings            | `/settings` | Linked from gear + dropdown |
| Profile             | `/profile`  | Linked from avatar dropdown |

---

## Design Tokens

| Element           | Token                    | Value              |
| ----------------- | ------------------------ | ------------------ |
| Header height     | `--header-height`        | 64px               |
| Header background | `--surface-card`         | White/Dark surface |
| Olympics badge    | `--green-500`            | Brand green        |
| Search background | `--surface-ground`       | Subtle gray        |
| Icon color        | `--text-color-secondary` | Muted text         |
| Avatar size       | 36px                     | Fixed              |
