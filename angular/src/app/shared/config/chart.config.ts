/**
 * Shared Chart Configuration
 * Default chart options for PrimeNG Charts
 */
export const DEFAULT_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const
    },
    tooltip: {
      enabled: true
    }
  },
  scales: {
    x: {
      display: true
    },
    y: {
      display: true
    }
  }
};

export const LINE_CHART_OPTIONS = {
  ...DEFAULT_CHART_OPTIONS,
  elements: {
    line: {
      tension: 0.4
    }
  }
};

export const BAR_CHART_OPTIONS = {
  ...DEFAULT_CHART_OPTIONS
};

export const DOUGHNUT_CHART_OPTIONS = {
  ...DEFAULT_CHART_OPTIONS,
  scales: {
    x: { display: false },
    y: { display: false }
  }
};

