# Icon Consistency Audit — PrimeNG Icons

**Date:** February 16, 2026  
**Scope:** Ensure all icons in the app use the PrimeNG Icons (PrimeIcons) library for consistency.

---

## Summary

| Category | Status | Count |
|----------|--------|-------|
| **PrimeIcons (compliant)** | ✅ | Majority of icons |
| **Custom CSS (non-compliant)** | ❌ | 7 classes in ACWR dashboard |
| **Emoji icons (non-compliant)** | ⚠️ | 25+ usages |
| **Image assets (non-compliant)** | ⚠️ | 2 services |

---

## 1. Non-PrimeIcons: Custom CSS Classes (ACWR Dashboard)

**File:** `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.html`

These elements use custom class names that only apply styling (font-size, color) but **do not render any icon** — they're empty `<i>` elements. The design system uses PrimeIcons (`pi pi-*`), so these should be migrated.

| Current (broken) | Recommended PrimeIcon |
|------------------|------------------------|
| `<i class="icon-activity"></i>` | `<i class="pi pi-chart-line"></i>` or `pi-activity`* |
| `<i class="icon-plus"></i>` | `<i class="pi pi-plus"></i>` |
| `<i class="icon-chart"></i>` | `<i class="pi pi-chart-bar"></i>` |
| `<i class="icon-download"></i>` | `<i class="pi pi-download"></i>` |
| `<i class="icon-file-pdf"></i>` | `<i class="pi pi-file-pdf"></i>` |
| `<i class="icon-alert"></i>` | `<i class="pi pi-exclamation-triangle"></i>` |
| `<i class="icon-check"></i>` | `<i class="pi pi-check"></i>` |

**SCSS:** `acwr-dashboard.component.scss` (lines 39–47) defines `.icon-activity`, `.icon-plus`, etc. These classes only set `font-size` and `color`; they do not use the PrimeIcons font. Remove these and use the standard `.icon` / `[data-icon]` wrapper from `primitives/_icons.scss` if needed.

> *Note: PrimeIcons uses `pi-chart-line` for activity; there is no `pi-activity`. Use `pi-chart-line` for "Load Monitoring" context.

---

## 2. Emoji Icons (Non-PrimeIcons)

Emojis are used as decorative icons in multiple components. For consistency, consider replacing with PrimeIcons where appropriate.

| File | Usage | Suggested PrimeIcon |
|------|-------|---------------------|
| `acwr-dashboard.component.html` | 🚨 ⚠️ ℹ️ (alert severity) | `pi-exclamation-triangle`, `pi-exclamation-circle`, `pi-info-circle` |
| `acwr-dashboard.component.html` | 💡 (recommendation) | `pi-lightbulb` |
| `today.component.html` | 🎉 (celebration) | `pi-star` or `pi-sparkles` |
| `analytics.component.ts` | 📈 🧪 🎯 (hub sections) | `pi-chart-line`, `pi-flask`, `pi-bullseye` |
| `superadmin-settings.component.ts` | 🏅 (Olympic) | `pi-trophy` |
| `tournament-nutrition.component.ts` | 🧂 🍌 🧊 🚫 🏁 (tips) | `pi-info-circle` or keep for food context |
| `qb-throwing-tracker.component.ts` | 💪 (reminder) | `pi-bolt` |
| `today.component.html` | Various | — |
| `tournaments.component.ts` | 📍 🏟️ | `pi-map-marker`, `pi-building` |
| `playbook-manager.component.ts` | 📋 ⚔️ 🛡️ 📊 | `pi-list`, `pi-shield`, `pi-chart-bar` |
| `calendar-coach.component.ts` | 🏋️ 🏈 🏆 📋 ● | `pi-dumbbell`*, `pi-flag`, `pi-trophy`, `pi-list` |
| `injury-management.component.ts` | 🔴 🟡 🟢 📊 | `pi-circle-fill` with color, `pi-chart-bar` |
| `program-builder.component.ts` | 📝 | `pi-pencil` |
| `film-room-coach.component.ts` | 🎬 ⏱️ 📋 👀 | `pi-video`, `pi-clock`, `pi-list`, `pi-eye` |
| `player-development.component.ts` | 📊 🎯 📈 🏆 | `pi-chart-bar`, `pi-bullseye`, etc. |
| `tournament-management.component.ts` | 🏆 | `pi-trophy` |
| `knowledge-base.component.ts` | 📝 (resource) | `pi-pencil` |
| `practice-planner.component.ts` | 🏋️ | `pi-dumbbell`* |
| `cycle-tracking.component.ts` | 🌸 🥩 (phase/nutrient) | Domain-specific; consider `pi-heart`, `pi-star` |
| `game-day-readiness.component.ts` | `metric.icon` (dynamic) | Ensure source uses PrimeIcons |

> *`pi-dumbbell` may not exist; verify against [PrimeIcons](https://primeng.org/icons). Use `pi-bolt` or `pi-heart` as fallback.

---

## 3. Image-Based Icons

| File | Usage | Notes |
|------|-------|------|
| `acwr-alerts.service.ts` | `/assets/icons/alert-icon.png`, `/assets/icons/badge.png` | Push notifications / badges; image assets may be intentional |
| `rest-timer.component.ts` | `/assets/icons/icon-192x192.png` | PWA/install icon |

**Recommendation:** For in-app UI, prefer PrimeIcons. For push notifications and PWA, image assets are standard.

---

## 4. Button Icon Input Mismatch

**File:** `angular/src/app/shared/components/readiness-widget/readiness-widget.component.ts`

```html
<app-button icon="refresh" variant="text" ... />
```

`app-button` does **not** have an `icon` input; it uses `iconLeft` and `iconRight`. This prop has no effect.

**Fix:** Use `iconLeft="pi-refresh"` (or `iconLeft="refresh"` — button's `normalizeIcon` adds `pi-` prefix).

---

## 5. Empty-State Icon Format

**File:** `angular/src/app/shared/components/supplement-tracker/supplement-tracker.component.html`

```html
<app-empty-state icon="inbox" heading="No supplements configured">
```

`empty-state` expects PrimeIcon format. It uses `'pi ' + resolvedIcon()` in the template, so `"inbox"` becomes `"pi inbox"` (invalid). Use `"pi-inbox"` or `"inbox"` if the component prepends `pi` and expects `pi-inbox`.

**Check:** `empty-state.component.ts` — `resolvedIcon()` returns `icon ?? config?.icon`. The template does `'pi ' + resolvedIcon()`, so value must be like `"pi-inbox"` or the component must normalize. Confirm and align with PrimeIcons (`pi-inbox` exists).

---

## 6. Dynamic Icon Sources (Verify PrimeIcons)

These components use runtime icon strings. Ensure all possible values resolve to valid PrimeIcons:

| Component | Icon Source | Status |
|-----------|-------------|--------|
| `achievements.component.ts` | `achievement.icon`, `cat.icon` | May include emojis; verify |
| `tournaments.component.ts` | `option.icon` | Check option definitions |
| `video-feed.component.ts` | `chip.icon` | Should be `pi pi-*` format |
| `roster-player-card.component.ts` | `positionInsight()!.icon` | Verify source |
| `recovery-dashboard.component.ts` | `metric.icon`, `protocol.icon` | Ensure PrimeIcons |
| `training-builder.component.ts` | `goal.icon`, `event.icon` | Ensure PrimeIcons |
| `nutrition-dashboard.component.ts` | `insight.icon` | Ensure PrimeIcons |
| `ai-training-companion.component.ts` | `insight.icon`, `metric.trend.icon` | Ensure PrimeIcons |
| `practice-planner.component.ts` | `ACTIVITY_TYPES` → emoji fallback | Replace with PrimeIcons |
| `knowledge-base.component.ts` | `category.icon` | May be emoji; verify |
| `ai-scheduler.component.ts` | `area.icon`, `session.icon` | Verify |
| `data-import.component.ts` | `type.icon` | Verify |
| `game-day-readiness.component.ts` | `metric.icon` | Verify |

---

## 7. PrimeIcons Usage Patterns (Correct)

Most of the app correctly uses PrimeIcons, for example:

- `pi pi-check`, `pi pi-plus`, `pi pi-calendar`, `pi pi-user`, `pi pi-heart`
- `pi pi-exclamation-triangle`, `pi pi-info-circle`, `pi pi-check-circle`
- `pi pi-sparkles`, `pi pi-megaphone`, `pi pi-file-pdf`, `pi pi-file-excel`
- Button components: `iconLeft="pi-check"`, `icon="pi-plus"` (icon-button)

The `normalizeIcon()` in the button component correctly maps `"refresh"` → `"pi-refresh"`.

---

## Recommendations

### High priority
1. **ACWR Dashboard:** Replace `icon-activity`, `icon-plus`, etc. with `pi pi-*` classes.
2. **Readiness widget:** Change `icon="refresh"` to `iconLeft="pi-refresh"` on `app-button`.

### Medium priority
3. Replace emoji icons with PrimeIcons in analytics, coach dashboards, tournament views, and similar UI-heavy areas.
4. Audit dynamic icon sources (achievements, tournaments, recovery, etc.) to ensure all values are PrimeIcons.

### Low priority
5. Confirm `pi-directions-run`, `pi-heart-pulse`, `pi-dumbbell`, etc. in your PrimeIcons version.

---

## PrimeIcons Reference

- **Library:** [primeicons](https://www.npmjs.com/package/primeicons) v7.0.0 (from package.json)
- **Docs:** [PrimeNG Icons](https://primeng.org/icons)
- **Format:** `<i class="pi pi-{icon-name}"></i>` or `pi-{icon-name}` for component inputs
