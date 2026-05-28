import { Routes } from "@angular/router";

/**
 * Feature Route Groups Composition
 *
 * STATIC-FIRST REBUILD: all screen routes were removed alongside the UI layer.
 * The original per-group route definitions (path → screen → guard / preload /
 * showBottomNav) are preserved uncompiled in `redesign/_reference/routes/` and
 * are restored incrementally in Phase E as each screen is rebuilt from the
 * approved static design. The kept business-logic services remain available for
 * those rebuilt screens to consume.
 */
export const featureRoutes: Routes = [];
