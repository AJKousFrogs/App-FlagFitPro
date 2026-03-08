# App Shell Audit

Date: March 8, 2026

## Broken before refactor

- The header only lived inside the content column, not across the full shell.
- The sidebar was `position: fixed` while the content column used its own internal scroller.
- The shell used a flex layout with `min-height: 100vh` instead of a viewport-locked grid, so body/page scrolling could still compete with content scrolling.
- Sticky behavior was fragile because:
  - the header was sticky inside a nested content column
  - the sidebar was fixed to the viewport instead of participating in a coherent shell layout
  - the content wrapper scrolled, but the overall shell was not height-constrained tightly enough
- Breadcrumbs rendered as a detached full-width strip that did not align with the content rhythm.
- `page-header` still had a default bottom margin, which duplicated stack gaps on pages already using the page layout primitives.
- The player dashboard did not use the shared page shell, so the onboarding/setup state floated inside an oversized content canvas.

## Anti-patterns found

- fixed sidebar + sticky header + nested scroll region
- shell spacing owned by local component overrides instead of shell/layout primitives
- dashboard pages missing `ui-page-shell`
- duplicated vertical rhythm from both stack gaps and component margins
- mobile sidebar/body scroll lock handled independently from the shell itself
- shell-level behavior coupled to template refs without a real layout controller

## Final shell structure

```text
AppShell
├── Header
└── MainLayout
    ├── Sidebar
    └── ContentArea
        ├── OfflineBanner
        ├── SmartBreadcrumbs
        └── PageContent
```

## Refactor decisions

- The shell is now a viewport-locked grid:
  - header row
  - main row
- The main row is also a grid:
  - sidebar track
  - content track
- Only `.app-main` scrolls vertically.
- The body is scroll-locked while the shell is active via `body.app-shell-active`.
- The sidebar is sticky on desktop/tablet and becomes a drawer on mobile.
- The header spans the full width of the shell.
- Breadcrumbs were pulled into the content flow and aligned to page spacing.
- The player and coach dashboards were moved onto the shared page shell.

## Key files

- [app.component.scss](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/app.component.scss)
- [styles.scss](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/styles.scss)
- [design-system-tokens.scss](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/scss/tokens/design-system-tokens.scss)
- [main-layout.component.ts](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/shared/components/layout/main-layout.component.ts)
- [main-layout.component.scss](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/shared/components/layout/main-layout.component.scss)
- [header.component.html](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/shared/components/header/header.component.html)
- [header.component.scss](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/shared/components/header/header.component.scss)
- [sidebar.component.scss](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/shared/components/sidebar/sidebar.component.scss)
- [smart-breadcrumbs.component.scss](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/shared/components/smart-breadcrumbs/smart-breadcrumbs.component.scss)
- [page-header.component.scss](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/shared/components/page-header/page-header.component.scss)
- [player-dashboard.component.html](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/dashboard/player-dashboard.component.html)
- [player-dashboard.component.scss](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/dashboard/player-dashboard.component.scss)
- [coach-dashboard.component.html](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/dashboard/coach-dashboard.component.html)
- [coach-dashboard.component.scss](/Users/aljosaursakous/Desktop/Flag football HTML - APP/angular/src/app/features/dashboard/coach-dashboard.component.scss)

## Verification

- `npm run lint`
- `npm run lint:css`
- `npm run build`
- `npm run e2e:smoke`

All passed after the refactor.
