# Feedback UI Audit - 2026-03-06

## Current Design-System Structure

### Global entry
- `src/styles.scss`
  - imports `src/scss/components/index.scss`
  - global feedback layer now includes `src/scss/components/notifications.scss`

### Canonical feedback tokens
- `src/scss/tokens/design-system-tokens.scss`
  - `--component-toast-height`
  - `--component-alert-padding`
  - `--component-alert-accent-width`
  - `--component-close-button-size-*`
  - `--motion-feedback-duration*`

### Canonical feedback styles
- `src/scss/components/notifications.scss`
  - shared animations
  - `CloseButton` visual contract
  - `Backdrop` visual contract
  - `Alert` visual contract
  - `Toast` visual contract
  - `Banner` and shared notification surfaces
  - `NotificationsPanel` visual contract
  - `OfflineBanner` visual contract

### Canonical components after this pass
- `src/app/shared/components/close-button/close-button.component.ts`
- `src/app/shared/components/backdrop/backdrop.component.ts`
- `src/app/shared/components/alert/alert.component.ts`
- `src/app/shared/components/toast/toast.component.ts`
- `src/app/core/services/toast.service.ts`
- `src/app/shared/components/dialog/dialog.component.ts`
- `src/app/shared/components/dialog-header/dialog-header.component.ts`
- `src/app/shared/components/dialog-footer/dialog-footer.component.ts`
- `src/app/core/services/confirm-dialog.service.ts`
- `src/app/core/ui/dialog.service.ts`

## Canonical Architecture

### Chosen canonical implementations
- `CloseButton`
  - `app-close-button`
  - source: `src/app/shared/components/close-button/close-button.component.ts`
- `Toast`
  - `ToastService` + root `app-toast`
  - sources:
    - `src/app/core/services/toast.service.ts`
    - `src/app/shared/components/toast/toast.component.ts`
- `Alert`
  - `app-alert`
  - source: `src/app/shared/components/alert/alert.component.ts`
- `Banner`
  - `app-banner` for CTA/page banners, with visuals sourced from `notifications.scss`
  - specialized wrappers should reuse shared notification classes instead of shipping local one-off visuals
- `Dialog / Modal`
  - `app-dialog` + `app-dialog-header` + `app-dialog-footer`
  - confirmations through `ConfirmDialogService`
- `Backdrop`
  - `app-backdrop`
- `FocusRing`
  - `.app-focus-ring` utility and token-backed focus styles in `notifications.scss`
- `IconButton`
  - existing `app-icon-button`
- `NotificationContainer`
  - transient: root `app-toast`
  - persistent: `app-notifications-panel`

### Recommended component tree
```text
shared/components/
  close-button/
  backdrop/
  alert/
  toast/
  dialog/
  dialog-header/
  dialog-footer/
  notifications-panel/
```

## Duplicate Implementation Audit

### 1. Duplicate toast implementations

#### Canonical
- `src/app/shared/components/toast/toast.component.ts`
- `src/app/core/services/toast.service.ts`

#### Duplicated toast styling logic found
- `src/scss/components/notifications.scss`
- `src/scss/components/primeng-theme.scss`
  - toast animation and close-button styling still duplicated here
- `src/scss/components/standardized-components.scss`
  - contains additional generic animation inventory that overlaps feedback motion

#### Decision
- Keep `ToastService + app-toast` as the only toast API.
- Retire leftover toast animation/close styling from `primeng-theme.scss` once PrimeNG-specific requirements are isolated.

### 2. Duplicate alert / banner implementations

#### Canonical
- `src/app/shared/components/alert/alert.component.ts`
- `src/app/shared/components/app-banner/app-banner.component.ts`
- shared visuals in `src/scss/components/notifications.scss`

#### Duplicate alert-like components still present
- `src/app/shared/components/data-source-banner/data-source-banner.component.ts`
- `src/app/shared/components/offline-banner/offline-banner.component.ts`
- `src/app/shared/components/announcements-banner/announcements-banner.component.ts`
- `src/app/shared/components/cookie-consent-banner/cookie-consent-banner.component.ts`
- `src/app/shared/components/form-error-summary/form-error-summary.component.ts`
- `src/app/features/wellness/wellness.component.scss`
  - `.alert-danger`, `.alert-warn`, `.alert-info`
- `src/app/features/tournaments/tournaments.component.html`
  - `.visibility-info-banner`
- `src/app/features/dashboard/player-dashboard.component.html`
  - `.announcement-banner`
- `src/app/features/community/community.component.html`
  - local banner/filter structures

#### Decision
- `app-alert` is the canonical inline/page alert.
- `app-banner` remains the canonical CTA banner.
- Specialized banners should become wrappers around those primitives or reuse the shared notification classes only.

### 3. Duplicate modal / dialog implementations

#### Canonical
- `src/app/shared/components/dialog/dialog.component.ts`
- `src/app/shared/components/dialog-header/dialog-header.component.ts`
- `src/app/shared/components/dialog-footer/dialog-footer.component.ts`
- `src/app/core/services/confirm-dialog.service.ts`

#### Duplicates fixed in this pass
- `src/app/features/superadmin/superadmin-settings.component.ts`
  - hand-rolled modal removed
- `src/app/features/superadmin/superadmin-dashboard.component.ts`
  - hand-rolled modal removed

#### Remaining duplicates
- `src/app/shared/components/modal/modal.component.ts`
  - second dialog wrapper with inline styles and duplicated modal animations
- direct `p-dialog` usage across many features:
  - `src/app/features/roster/roster.component.html`
  - `src/app/features/tournaments/tournaments.component.html`
  - `src/app/features/community/community.component.html`
  - `src/app/features/equipment/equipment.component.ts`
  - `src/app/shared/components/body-composition-card/body-composition-card.component.ts`
  - `src/app/shared/components/supplement-tracker/supplement-tracker.component.html`
  - many more
- local modal header styling still appears in:
  - `src/app/shared/components/keyboard-shortcuts-modal/keyboard-shortcuts-modal.component.scss`
  - `src/scss/components/standardized-components.scss`

#### Decision
- `app-dialog` is the canonical path.
- `app-modal` should be retired or rewritten as a thin alias to `app-dialog`.
- direct `p-dialog` usage should move behind `app-dialog` for new work and high-traffic routes first.

### 4. Duplicate close buttons

#### Canonical
- `src/app/shared/components/close-button/close-button.component.ts`

#### Converted in this pass
- `src/app/shared/components/dialog-header/dialog-header.component.ts`
- `src/app/shared/components/notifications-panel/notifications-panel.component.ts`
- `src/app/shared/components/data-source-banner/data-source-banner.component.ts`
- `src/app/shared/components/form-error-summary/form-error-summary.component.ts`
- `src/app/shared/components/bottom-nav/bottom-nav.component.ts`

#### Remaining duplicates
- `src/app/shared/components/sidebar/sidebar.component.ts`
  - `.sidebar-close-btn`
- `src/app/features/dashboard/player-dashboard.component.html`
  - `.announcement-close-btn`
- `src/app/shared/components/quick-actions-fab/quick-actions-fab.component.ts`
- `src/app/shared/components/image-upload/image-upload.component.ts`
- `src/app/shared/components/file-upload/file-upload.component.ts`
- `src/app/features/community/community.component.html`
- `src/app/features/onboarding/steps/onboarding-step-health.component.ts`

#### Decision
- All dismiss/close affordances should converge on `app-close-button` unless the icon is not actually a close affordance.

### 5. Duplicated animation keyframes

#### New canonical feedback motion
- `src/scss/components/notifications.scss`
  - `feedback-fade-in`
  - `feedback-slide-in-right`
  - `feedback-slide-up`
  - `feedback-slide-down`
  - `feedback-pulse-soft`

#### Remaining duplicates still in repo
- `src/scss/utilities/_mixins.scss`
  - `backdrop-fade-in`, `pulse`
- `src/scss/components/primitives/_dialogs.scss`
  - `dialog-scale-in`, `dialog-scale-out`, `backdrop-fade-in`
- `src/scss/components/primeng-theme.scss`
  - `dialog-scale-in`, `backdrop-fade-in`, `toast-slide-in`
- `src/scss/components/standardized-components.scss`
  - `fadeIn`, `slideIn`, `slideInRight`
- `src/app/shared/styles/animations.scss`
  - `fadeIn`, `slideIn`, `slideInRight`, `pulse`, `pulseGlow`
- feature-local duplicates still present in:
  - `src/app/shared/components/announcements-banner/announcements-banner.component.scss`
  - `src/app/shared/components/sidebar/sidebar.component.scss`
  - `src/app/features/settings/settings.component.scss`
  - `src/app/features/video-feed/video-feed.component.scss`
  - multiple other feature SCSS files

#### Decision
- Feedback-only motion should come from `notifications.scss`.
- Generic app-wide animation primitives should live in one shared animation file, not in page/component SCSS.

### 6. Duplicated notification containers

#### Canonical
- transient notifications: `app-toast` in `src/app/app.component.ts`
- persistent notifications: `app-notifications-panel`

#### Duplicate or parallel containers still present
- `src/app/shared/components/announcements-banner/announcements-banner.component.ts`
- `src/app/features/dashboard/player-dashboard.component.html`
  - local announcement banner container
- `src/app/features/today/today.component.html`
  - page-level banner stack through `app-banner`
- various feature-local banner stacks

#### Decision
- Top-right transient feedback belongs only to `app-toast`.
- Persistent inbox belongs only to `app-notifications-panel`.
- Page-level information belongs to `app-alert` / `app-banner`, not bespoke containers.

### 7. Duplicated overlay / backdrop systems

#### Canonical
- `src/app/shared/components/backdrop/backdrop.component.ts`
- shared visuals in `src/scss/components/notifications.scss`

#### Converted in this pass
- `src/app/shared/components/notifications-panel/notifications-panel.component.ts`
- `src/app/shared/components/bottom-nav/bottom-nav.component.ts`

#### Remaining overlay duplicates
- `src/app/shared/components/sidebar/sidebar.component.ts`
  - `sidebar-overlay`
- `src/app/shared/components/loading-overlay/loading-overlay.component.ts`
  - specialized full-screen overlay
- `src/app/shared/components/loading/loading.component.scss`
  - overlay variant styling
- `src/app/shared/components/quick-actions-fab/quick-actions-fab.component.scss`
  - `fabBackdropFade`
- `src/app/shared/components/modal/modal.component.ts`
  - internal mask/backdrop styling

#### Decision
- `app-backdrop` is the canonical interactive backdrop primitive.
- loading overlays remain specialized but should visually inherit the same overlay tokens.

## Duplicated Selectors / SCSS Blocks Worth Consolidating Next

### High-value duplicates
- `.sidebar-close-btn`
- `.announcement-close-btn`
- `.visibility-info-banner`
- `.filter-banner`
- `.modal-header`
- `.modal-content`
- `.modal-close`
- `.alert-*` variants inside feature SCSS
- backdrop selectors duplicated across `sidebar`, `loading`, `modal`, and shared animation files

### High-value duplicate icon usage
- raw `pi pi-times` close affordances still appear in:
  - sidebar
  - dashboard announcement dismiss
  - community feature modals/actions
  - quick actions FAB
  - onboarding health chip removal

## Refactors Completed In This Pass

- Added `CloseButton` primitive
- Added `Backdrop` primitive
- Added `Alert` primitive
- Added token-backed `notifications.scss`
- Routed `dialogService.confirm()` through `ConfirmDialogService`
- Migrated superadmin settings add-modal to `app-dialog`
- Migrated superadmin dashboard reject-modal to `app-dialog`
- Migrated notifications panel backdrop and close actions to shared primitives
- Migrated bottom-nav more-menu overlay and close action to shared primitives
- Migrated data-source banner dismiss control to shared close primitive
- Migrated dialog header close control to shared close primitive
- Moved toast/banner/notifications/offline-banner visuals into `src/scss/components/notifications.scss`

## Remaining Work

### P0
- retire `app-modal` or make it a thin alias over `app-dialog`
- migrate `sidebar` to `app-close-button` + `app-backdrop`
- migrate `player-dashboard` announcement dismiss to `app-close-button`
- migrate feature-local `.alert-*` patterns in `wellness` and `tournaments` to `app-alert`

### P1
- replace high-traffic direct `p-dialog` usage with `app-dialog`
  - roster
  - tournaments
  - community
  - equipment
- consolidate PrimeNG feedback animation overrides that still duplicate toast/dialog motion

### P2
- unify shared animation inventory so feedback motion exists in one place only
- collapse specialized banner wrappers onto `app-alert` / `app-banner` where the business model allows it

## Verification
- `npm run build` passed
- `npm run e2e:smoke` passed: `9 passed`
- Remaining style budget warning persists:
  - `styles` bundle exceeds budget by `25.94 kB`

## Recommendation
- Treat `app-dialog`, `app-alert`, `app-close-button`, `app-backdrop`, and `ToastService + app-toast` as non-negotiable primitives for all future UI feedback work.
- Do not add new raw `pi pi-times` buttons, local overlay masks, or feature-local alert palettes.
