# `--border-radius` Migration Guide

> **Status:** Ready for Implementation  
> **Total Occurrences:** 31  
> **Risk Level:** Low (safe global replacement)  
> **Estimated Time:** 30 minutes

---

## Problem

The token `--border-radius` is **undefined** in the design system. It was likely a legacy variable that was never properly defined or was removed. All occurrences should be replaced with the canonical tokens.

## Replacement Strategy

| Context                            | Replace With         | Token Value |
| ---------------------------------- | -------------------- | ----------- |
| Cards, panels, dialogs, containers | `var(--radius-lg)`   | 8px         |
| Badges, small pills                | `var(--radius-xl)`   | 12px        |
| Chips, tags (pill shape)           | `var(--radius-full)` | 9999px      |
| Input fields                       | `var(--radius-md)`   | 6px         |
| Small UI elements                  | `var(--radius-sm)`   | 2px         |

---

## File-by-File Migration

### Summary by File

| File                                | Occurrences | Replacement   |
| ----------------------------------- | ----------- | ------------- |
| `training.component.scss`           | 11          | `--radius-lg` |
| `achievements-panel.component.scss` | 6           | `--radius-lg` |
| `la28-roadmap.component.scss`       | 5           | `--radius-lg` |
| `depth-chart.component.scss`        | 4           | `--radius-lg` |
| `password-strength.component.scss`  | 2           | `--radius-lg` |
| `form-input.component.scss`         | 1           | `--radius-md` |
| `equipment.component.scss`          | 1           | `--radius-lg` |
| `officials.component.scss`          | 1           | `--radius-lg` |
| `attendance.component.scss`         | 1           | `--radius-lg` |

**Total: 31 occurrences across 9 files**

---

## Exact Diffs (All 31 Occurrences)

### 1. `angular/src/app/features/training/training.component.scss`

**11 occurrences - all replace with `var(--radius-lg)`**

```diff
--- a/angular/src/app/features/training/training.component.scss
+++ b/angular/src/app/features/training/training.component.scss
@@ -18,7 +18,7 @@
     padding: var(--space-3) var(--space-4);
     background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-50) 100%);
     border: 1px solid var(--primary-300);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     margin-bottom: var(--space-4);
     cursor: pointer;
     transition: transform var(--transition-fast), opacity var(--transition-fast);
@@ -113,7 +113,7 @@
   .readiness-badge-compact {
     display: flex;
     flex-direction: column;
     align-items: center;
     padding: 0.5rem 0.75rem;
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     min-width: 60px;
   }
@@ -150,7 +150,7 @@
   .wellness-alert-banner.compact {
     display: flex;
     align-items: center;
     gap: var(--space-3);
     padding: var(--space-2) var(--space-3);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     margin-bottom: var(--space-4);
   }
@@ -201,7 +201,7 @@
   .action-card {
     display: flex;
     flex-direction: column;
     align-items: center;
     gap: 0.25rem;
     padding: var(--space-3);
     background: var(--surface-card);
     border: 1px solid var(--surface-border);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     cursor: pointer;
     transition: transform var(--transition-fast), opacity var(--transition-fast);
@@ -241,7 +241,7 @@
   .priority-workouts {
     background: var(--surface-card);
     border: 1px solid var(--surface-border);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     padding: var(--space-4);
     margin-bottom: var(--space-4);
   }
@@ -273,7 +273,7 @@
   .priority-card {
     display: flex;
     align-items: center;
     gap: 0.75rem;
     padding: 0.75rem;
     background: var(--surface-ground);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     border: 1px solid transparent;
     cursor: pointer;
@@ -360,7 +360,7 @@
   .schedule-day-compact {
     flex: 1;
     display: flex;
     flex-direction: column;
     align-items: center;
     padding: 0.5rem 0.25rem;
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     background: var(--surface-ground);
   }
@@ -417,7 +417,7 @@
   .workout-card-compact {
     display: flex;
     align-items: center;
     gap: 0.75rem;
     padding: 0.5rem;
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     border-left: 3px solid;
     background: var(--surface-ground);
@@ -476,7 +476,7 @@
   .achievements-strip {
     background: var(--surface-card);
     border: 1px solid var(--surface-border);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     padding: var(--space-3);
     margin-bottom: var(--space-4);
   }
@@ -527,7 +527,7 @@
   .la28-teaser {
     display: flex;
     align-items: center;
     gap: var(--space-3);
     padding: var(--space-3);
     background: linear-gradient(135deg, var(--primitive-blue-600) 0%, var(--primitive-blue-800) 100%);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     cursor: pointer;
     transition: transform 0.2s;
```

---

### 2. `angular/src/app/features/training/daily-protocol/components/achievements-panel.component.scss`

**6 occurrences - all replace with `var(--radius-lg)`**

```diff
--- a/angular/src/app/features/training/daily-protocol/components/achievements-panel.component.scss
+++ b/angular/src/app/features/training/daily-protocol/components/achievements-panel.component.scss
@@ -7,7 +7,7 @@
   .achievements-panel {
     .summary-card {
       background: var(--surface-card);
-      border-radius: var(--border-radius);
+      border-radius: var(--radius-lg);
       padding: var(--space-4);
       border: var(--border-1) solid var(--surface-border);
     }
@@ -91,7 +91,7 @@
     .achievement-card {
       display: flex;
       align-items: center;
       gap: var(--space-3);
       background: var(--surface-ground);
-      border-radius: var(--border-radius);
+      border-radius: var(--radius-lg);
       padding: var(--space-3);
@@ -168,7 +168,7 @@
     .streak-card {
       display: flex;
       align-items: center;
       gap: var(--space-4);
       background: var(--surface-ground);
-      border-radius: var(--border-radius);
+      border-radius: var(--radius-lg);
       border: var(--border-1) solid var(--surface-border);
@@ -249,7 +249,7 @@
     .leaderboard-item {
       display: flex;
       align-items: center;
       gap: var(--space-3);
       background: var(--surface-ground);
-      border-radius: var(--border-radius);
+      border-radius: var(--radius-lg);
       padding: var(--space-4);
@@ -328,7 +328,7 @@
     .empty-state {
       display: flex;
       flex-direction: column;
       align-items: center;
       gap: var(--space-3);
       background: var(--surface-ground);
-      border-radius: var(--border-radius);
+      border-radius: var(--radius-lg);
       text-align: center;
@@ -357,7 +357,7 @@
     .achievement-unlocked-toast {
       display: flex;
       align-items: center;
       gap: var(--space-3);
       background: var(--primary-100);
-      border-radius: var(--border-radius);
+      border-radius: var(--radius-lg);
```

---

### 3. `angular/src/app/features/training/daily-protocol/components/la28-roadmap.component.scss`

**5 occurrences - all replace with `var(--radius-lg)`**

```diff
--- a/angular/src/app/features/training/daily-protocol/components/la28-roadmap.component.scss
+++ b/angular/src/app/features/training/daily-protocol/components/la28-roadmap.component.scss
@@ -7,7 +7,7 @@
   .roadmap-panel {
     .summary-card {
       background: linear-gradient(135deg, var(--primary-50), var(--surface-card));
-      border-radius: var(--border-radius);
+      border-radius: var(--radius-lg);
       padding: var(--space-4);
       border: var(--border-1) solid var(--primary-200);
     }
@@ -123,7 +123,7 @@
     .milestone-badge {
       display: flex;
       align-items: center;
       gap: var(--space-2);
       background: var(--surface-card);
-      border-radius: var(--border-radius);
+      border-radius: var(--radius-lg);
       font-size: var(--font-size-h4);
@@ -163,7 +163,7 @@
     .countdown-card {
       display: flex;
       align-items: center;
       gap: var(--space-4);
       background: linear-gradient(135deg, var(--primary-100), var(--primary-50));
-      border-radius: var(--border-radius);
+      border-radius: var(--radius-lg);
       margin-bottom: var(--space-6);
@@ -200,7 +200,7 @@
     .phase-card {
       display: flex;
       flex-direction: column;
       gap: var(--space-2);
       background: var(--surface-ground);
-      border-radius: var(--border-radius);
+      border-radius: var(--radius-lg);
       padding: var(--space-4);
@@ -282,7 +282,7 @@
     .cta-card {
       display: flex;
       flex-direction: column;
       align-items: center;
       gap: var(--space-3);
       background: linear-gradient(135deg, var(--primitive-blue-600), var(--primitive-yellow-400));
-      border-radius: var(--border-radius);
+      border-radius: var(--radius-lg);
       padding: var(--space-8);
```

---

### 4. `angular/src/app/features/depth-chart/depth-chart.component.scss`

**4 occurrences - all replace with `var(--radius-lg)`**

```diff
--- a/angular/src/app/features/depth-chart/depth-chart.component.scss
+++ b/angular/src/app/features/depth-chart/depth-chart.component.scss
@@ -56,7 +56,7 @@
   .position-group {
     background: var(--surface-card);
     border: 1px solid var(--surface-border);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     overflow: hidden;
@@ -77,7 +77,7 @@
   .position-badge {
     padding: 0.25rem 0.5rem;
     color: white;
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     font-weight: var(--font-weight-bold);
@@ -100,7 +100,7 @@
   .player-card {
     display: flex;
     align-items: center;
     gap: var(--space-3);
     background: var(--surface-50);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     border: 1px solid var(--surface-border);
@@ -208,7 +208,7 @@
   .drop-zone.over {
     background: var(--surface-100);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
   }
```

---

### 5. `angular/src/app/shared/components/password-strength/password-strength.component.scss`

**2 occurrences - all replace with `var(--radius-lg)`**

```diff
--- a/angular/src/app/shared/components/password-strength/password-strength.component.scss
+++ b/angular/src/app/shared/components/password-strength/password-strength.component.scss
@@ -41,7 +41,7 @@
 .requirements-container {
   padding: 0.75rem;
   background: var(--surface-50);
-  border-radius: var(--border-radius);
+  border-radius: var(--radius-lg);
   margin-top: 0.75rem;
@@ -73,7 +73,7 @@
 .strength-tip {
   padding: 0.5rem 0.75rem;
   border-left: 3px solid var(--blue-500);
-  border-radius: var(--border-radius);
+  border-radius: var(--radius-lg);
   font-size: var(--font-size-badge);
```

---

### 6. `angular/src/app/shared/components/form-input/form-input.component.scss`

**1 occurrence - replace with `var(--radius-md)` (input field context)**

```diff
--- a/angular/src/app/shared/components/form-input/form-input.component.scss
+++ b/angular/src/app/shared/components/form-input/form-input.component.scss
@@ -99,7 +99,7 @@
   .password-toggle {
     display: flex;
     align-items: center;
     justify-content: center;
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-md);
     transition: transform var(--transition-fast), opacity var(--transition-fast), background var(--transition-fast);
```

---

### 7. `angular/src/app/features/equipment/equipment.component.scss`

**1 occurrence - replace with `var(--radius-lg)`**

```diff
--- a/angular/src/app/features/equipment/equipment.component.scss
+++ b/angular/src/app/features/equipment/equipment.component.scss
@@ -180,7 +180,7 @@
   .equipment-specs {
     padding: var(--space-3);
     background: var(--surface-100);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     margin: 0;
```

---

### 8. `angular/src/app/features/officials/officials.component.scss`

**1 occurrence - replace with `var(--radius-lg)`**

```diff
--- a/angular/src/app/features/officials/officials.component.scss
+++ b/angular/src/app/features/officials/officials.component.scss
@@ -183,7 +183,7 @@
   .official-specs {
     padding: var(--space-3);
     background: var(--surface-100);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
     margin: 0;
```

---

### 9. `angular/src/app/features/attendance/attendance.component.scss`

**1 occurrence - replace with `var(--radius-lg)`**

```diff
--- a/angular/src/app/features/attendance/attendance.component.scss
+++ b/angular/src/app/features/attendance/attendance.component.scss
@@ -280,7 +280,7 @@
   .attendance-note {
     padding: var(--space-2);
     background-color: var(--surface-50);
-    border-radius: var(--border-radius);
+    border-radius: var(--radius-lg);
   }
```

---

## Quick Command (Find & Replace)

For editors with regex support, use this pattern:

**Find:** `var\(--border-radius\)`  
**Replace:** `var(--radius-lg)`

⚠️ **Exception:** In `form-input.component.scss`, use `var(--radius-md)` instead.

---

## Verification Steps

After replacement, run:

```bash
# Verify no --border-radius remains
grep -r "border-radius" angular/src/app --include="*.scss" | grep -v "var(--radius"

# Build to check for errors
cd angular && npm run build
```

---

## Post-Migration Checklist

- [ ] All 31 occurrences replaced
- [ ] `form-input.component.scss` uses `--radius-md` (input context)
- [ ] All other files use `--radius-lg` (card/panel context)
- [ ] Build passes without errors
- [ ] Visual regression test on affected pages:
  - [ ] Training page
  - [ ] Achievements panel
  - [ ] LA28 Roadmap
  - [ ] Depth chart
  - [ ] Password strength indicator
  - [ ] Equipment page
  - [ ] Officials page
  - [ ] Attendance page

---

_Generated: January 4, 2026_
