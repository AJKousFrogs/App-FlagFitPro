/**
 * Chart.js Type Definitions
 *
 * TypeScript interfaces for Chart.js configurations and data structures.
 * These types ensure type safety when working with charts across the application.
 *
 * @module core/models/chart
 */

import type {
  ChartData,
  ChartOptions,
  ChartType,
  ScaleOptions,
  TooltipItem,
} from "chart.js";

// ============================================================================
// CHART DATA TYPES
// ============================================================================

/**
 * Generic chart dataset configuration
 */
export interface ChartDataset<T = number> {
  label: string;
  data: T[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean | string;
  tension?: number;
  pointRadius?: number;
  pointBackgroundColor?: string;
  pointBorderColor?: string;
  pointHoverRadius?: number;
  hidden?: boolean;
  order?: number;
  stack?: string;
  yAxisID?: string;
  xAxisID?: string;
}

/**
 * Line chart specific dataset
 */
export interface LineChartDataset extends ChartDataset<number> {
  tension?: number;
  stepped?: boolean | "before" | "after" | "middle";
  spanGaps?: boolean;
  segment?: {
    borderColor?: (ctx: unknown) => string;
    borderDash?: (ctx: unknown) => number[];
  };
}

/**
 * Bar chart specific dataset
 */
export interface BarChartDataset extends ChartDataset<number> {
  borderRadius?:
    | number
    | {
        topLeft?: number;
        topRight?: number;
        bottomLeft?: number;
        bottomRight?: number;
      };
  barThickness?: number | "flex";
  maxBarThickness?: number;
  minBarLength?: number;
  barPercentage?: number;
  categoryPercentage?: number;
}

/**
 * Radar chart specific dataset
 */
export interface RadarChartDataset extends ChartDataset<number> {
  pointStyle?: string;
  pointHitRadius?: number;
}

/**
 * Doughnut/Pie chart specific dataset
 */
export interface DoughnutChartDataset extends ChartDataset<number> {
  cutout?: string | number;
  rotation?: number;
  circumference?: number;
  hoverOffset?: number;
}

// ============================================================================
// CHART CONFIGURATION TYPES
// ============================================================================

/**
 * Complete chart configuration for PrimeNG p-chart
 */
export interface ChartConfiguration<T extends ChartType = ChartType> {
  type: T;
  data: ChartData<T>;
  options?: ChartOptions<T>;
}

/**
 * Simplified chart data for component usage
 */
export interface SimpleChartData {
  labels: string[];
  datasets: ChartDataset[];
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  x: Date | string | number;
  y: number;
}

/**
 * Chart scale configuration
 */
export interface ChartScaleConfig {
  min?: number;
  max?: number;
  beginAtZero?: boolean;
  stepSize?: number;
  display?: boolean;
  title?: {
    display: boolean;
    text: string;
    font?: { size?: number; weight?: string };
  };
  grid?: {
    display?: boolean;
    color?: string;
    drawBorder?: boolean;
  };
  ticks?: {
    font?: { size?: number };
    color?: string;
    padding?: number;
    maxRotation?: number;
    callback?: (value: number | string) => string;
  };
}

// ============================================================================
// TOOLTIP TYPES
// ============================================================================

/**
 * Custom tooltip context
 */
export interface TooltipContext<T extends ChartType = ChartType> {
  chart: unknown;
  tooltip: unknown;
  tooltipItems: TooltipItem<T>[];
}

/**
 * Tooltip callback functions
 */
export interface TooltipCallbacks {
  title?: (items: TooltipItem<ChartType>[]) => string | string[];
  label?: (item: TooltipItem<ChartType>) => string | string[];
  afterLabel?: (item: TooltipItem<ChartType>) => string | string[];
  footer?: (items: TooltipItem<ChartType>[]) => string | string[];
  beforeTitle?: (items: TooltipItem<ChartType>[]) => string | string[];
  afterTitle?: (items: TooltipItem<ChartType>[]) => string | string[];
}

// ============================================================================
// CHART EVENT TYPES
// ============================================================================

/**
 * Chart click event detail
 */
export interface ChartClickEventDetail {
  datasetLabel: string;
  dataLabel: string | number | undefined;
  value: number;
  datasetIndex: number;
  index: number;
}

/**
 * Chart zoom event detail
 */
export interface ChartZoomEventDetail {
  scales: Record<string, ScaleOptions>;
}

/**
 * Chart pan event detail
 */
export interface ChartPanEventDetail {
  scales: Record<string, ScaleOptions>;
}

// ============================================================================
// ANALYTICS CHART TYPES
// ============================================================================

/**
 * Performance chart data structure
 */
export interface PerformanceChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
    tension?: number;
  }[];
}

/**
 * ACWR (Acute:Chronic Workload Ratio) chart data
 */
export interface ACWRChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    borderDash?: number[];
  }[];
  annotations?: {
    sweetSpot: { min: number; max: number };
    dangerZone: number;
  };
}

/**
 * Wellness trend chart data
 */
export interface WellnessTrendChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
  metrics: ("sleep" | "energy" | "stress" | "soreness" | "motivation")[];
}

/**
 * Body composition chart data
 */
export interface BodyCompositionChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    yAxisID?: string;
  }[];
}

/**
 * Training volume chart data
 */
export interface TrainingVolumeChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    stack?: string;
  }[];
}

/**
 * Radar chart for skills/attributes
 */
export interface SkillsRadarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    pointBackgroundColor: string;
  }[];
}

// ============================================================================
// CHART PRESET TYPES
// ============================================================================

/**
 * Color palette for charts
 */
export interface ChartColorPalette {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  muted: string;
}

/**
 * Chart theme configuration
 */
export interface ChartTheme {
  colors: ChartColorPalette;
  fontFamily: string;
  fontSize: {
    title: number;
    label: number;
    tick: number;
  };
  gridColor: string;
  textColor: string;
  backgroundColor: string;
}

/**
 * Trend calculation result
 */
export interface TrendResult {
  direction: "up" | "down" | "stable";
  percentage: number;
  changeValue: number;
}

// ============================================================================
// CHART BUILDER TYPES
// ============================================================================

/**
 * Options for building a chart
 */
export interface ChartBuilderOptions {
  type: ChartType;
  title?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  animate?: boolean;
  theme?: "light" | "dark";
}

/**
 * Chart export options
 */
export interface ChartExportOptions {
  format: "png" | "jpeg" | "pdf";
  filename?: string;
  quality?: number;
  backgroundColor?: string;
}
