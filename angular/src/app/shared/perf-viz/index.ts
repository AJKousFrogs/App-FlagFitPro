/**
 * perf-viz — the premium athlete performance-visualization component library.
 *
 * Data-agnostic standalone primitives (signal inputs, OnPush, encapsulated
 * styles that reference ONLY the app's semantic design tokens). Each surface
 * (today / wellness / stats / staff / monitoring-report) maps its own
 * service signals into these inputs — the components never fetch. Honest empty
 * states everywhere: missing data renders "—" or a prompt, never a fabricated
 * value (Law #7).
 */
export { SparklineComponent } from "./sparkline.component";
export { DeltaChipComponent } from "./delta-chip.component";
export { KpiCardComponent } from "./kpi-card.component";
export { ReadinessRingComponent } from "./readiness-ring.component";
export { LoadTimelineComponent } from "./load-timeline.component";
export { AcwrBandComponent } from "./acwr-band.component";
export { LoadHeatmapComponent, type HeatCell } from "./load-heatmap.component";
export {
  WellnessBarsComponent,
  type WellnessRow,
} from "./wellness-bars.component";
export {
  WeightTrendComponent,
  type WeightPoint,
} from "./weight-trend.component";
export * from "./perf-viz.geometry";
