# Frontend Layout Audit Report

**Date:** 2026-01-06

**Total Components Audited:** 245

---

## Critical Issues

### Missing SCSS Files (10)

- `angular/src/app/features/dashboard/dashboard.component.ts`
- `angular/src/app/features/team/team-workspace/team-workspace.component.ts`
- `angular/src/app/features/today/today.component.ts`
- `angular/src/app/features/training/advanced-training/advanced-training.component.ts`
- `angular/src/app/features/training/qb-hub/qb-hub.component.ts`
- `angular/src/app/shared/components/button/icon-button.component.ts`
- `angular/src/app/shared/components/chart-skeleton/chart-skeleton.component.ts`
- `angular/src/app/shared/components/lazy-chart/lazy-chart.component.ts`
- `angular/src/app/shared/components/realtime-base.component.ts`
- `angular/src/app/shared/components/status-tag/status-tag.component.ts`

### Missing Layout Styles (6)

#### `coach-analytics.component.ts`

**Path:** `angular/src/app/features/coach/coach-analytics/coach-analytics.component.ts`

**Missing Styles For:**
- `.header-content`
- `.charts-grid`
- `.trends-section`
- `.leaderboard-section`
- `.feedback-section`
- `.feedback-grid`
- `.stat-row`

#### `game-tracker.component.ts`

**Path:** `angular/src/app/features/game-tracker/game-tracker.component.ts`

**Missing Styles For:**
- `.empty-state-container`

#### `settings.component.ts`

**Path:** `angular/src/app/features/settings/settings.component.ts`

**Missing Styles For:**
- `.section-stack`
- `.two-columns`
- `.control-row`
- `.control-row__label`
- `.control-row__title`
- `.control-row__description`
- `.control-row__control`

#### `search-panel.component.ts`

**Path:** `angular/src/app/shared/components/search-panel/search-panel.component.ts`

**Missing Styles For:**
- `.pi-arrow-up-left`

#### `supplement-tracker.component.ts`

**Path:** `angular/src/app/shared/components/supplement-tracker/supplement-tracker.component.ts`

**Missing Styles For:**
- `.skeleton-row`
- `.form-row`

#### `todays-schedule.component.ts`

**Path:** `angular/src/app/shared/components/todays-schedule/todays-schedule.component.ts`

**Missing Styles For:**
- `.pi-arrow-right`

## All Issues

| Component | Issues |
|-----------|--------|
| `coach-analytics.component.ts` | Missing layout styles for: header-content, charts-grid, trends-section, leaderboard-section, feedback-section, feedback-grid, stat-row |
| `dashboard.component.ts` | Missing SCSS file |
| `game-tracker.component.ts` | Missing layout styles for: empty-state-container |
| `settings.component.ts` | Missing layout styles for: section-stack, two-columns, control-row, control-row__label, control-row__title, control-row__description, control-row__control |
| `team-workspace.component.ts` | Missing SCSS file |
| `today.component.ts` | Missing SCSS file |
| `advanced-training.component.ts` | Missing SCSS file |
| `qb-hub.component.ts` | Missing SCSS file |
| `icon-button.component.ts` | Missing SCSS file |
| `chart-skeleton.component.ts` | Missing SCSS file |
| `lazy-chart.component.ts` | Missing SCSS file |
| `realtime-base.component.ts` | Missing SCSS file; No HTML template found |
| `search-panel.component.ts` | Missing layout styles for: pi-arrow-up-left |
| `status-tag.component.ts` | Missing SCSS file |
| `supplement-tracker.component.ts` | Missing layout styles for: skeleton-row, form-row |
| `todays-schedule.component.ts` | Missing layout styles for: pi-arrow-right |
