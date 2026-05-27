/**
 * Chart.js Type Definitions
 *
 * @module core/models/chart
 */

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
 * Simplified chart data for component usage
 */
export interface SimpleChartData {
  labels: string[];
  datasets: ChartDataset[];
}
