/**
 * Enhanced Chart Configuration
 *
 * Advanced Chart.js configuration with:
 * - Custom tooltips showing trend data
 * - Zoom/pan capabilities
 * - Legend toggling
 * - Responsive font sizes
 * - onClick handlers for drill-down
 */

import {
  ChartOptions,
  TooltipItem,
  Chart,
  LegendItem,
  ChartEvent,
  ActiveElement,
  LegendElement,
  ChartType,
} from "chart.js";

/**
 * Calculate trend from data points
 */
function calculateTrend(data: number[]): {
  direction: "up" | "down" | "stable";
  percentage: number;
} {
  if (data.length < 2) return { direction: "stable", percentage: 0 };

  const first = data[0];
  const last = data[data.length - 1];

  if (first === 0)
    return { direction: last > 0 ? "up" : "stable", percentage: 0 };

  const percentage = ((last - first) / first) * 100;

  if (Math.abs(percentage) < 1) return { direction: "stable", percentage: 0 };
  return {
    direction: percentage > 0 ? "up" : "down",
    percentage: Math.abs(percentage),
  };
}

/**
 * Get responsive font size based on screen width
 */
function getResponsiveFontSize(baseSize: number): number {
  if (typeof window === "undefined") return baseSize;

  const width = window.innerWidth;

  if (width < 640) {
    return baseSize * 0.75; // Mobile: 75% of base size
  } else if (width < 1024) {
    return baseSize * 0.875; // Tablet: 87.5% of base size
  }

  return baseSize; // Desktop: full size
}

/**
 * Custom tooltip with trend data
 */
export const CUSTOM_TOOLTIP_CALLBACKS = {
  title: (tooltipItems: TooltipItem<ChartType>[]) => {
    return tooltipItems[0]?.label || "";
  },

  label: (tooltipItem: TooltipItem<ChartType>) => {
    const dataset = tooltipItem.dataset;
    const value = tooltipItem.parsed.y;
    const label = dataset.label || "";

    return `${label}: ${value}`;
  },

  afterLabel: (tooltipItem: TooltipItem<ChartType>) => {
    const dataset = tooltipItem.dataset;
    const datasetData = dataset.data as number[];

    // Calculate trend for this dataset
    const trend = calculateTrend(datasetData);

    if (trend.direction === "stable") {
      return ["", "Trend: Stable"];
    }

    const arrow = trend.direction === "up" ? "↑" : "↓";
    return [
      "",
      `Trend: ${arrow} ${trend.percentage.toFixed(1)}%`,
      trend.direction === "up" ? "Improving" : "Declining",
    ];
  },

  footer: (_tooltipItems: TooltipItem<ChartType>[]) => {
    // Add contextual information
    return ["", "Click to view details"];
  },
};

/**
 * Enhanced Chart Options with Zoom, Pan, Custom Tooltips
 */
export const ENHANCED_CHART_OPTIONS: ChartOptions<ChartType> = {
  responsive: true,
  maintainAspectRatio: false,

  // Interaction settings
  interaction: {
    mode: "index",
    intersect: false,
  },

  // Custom onClick handler for drill-down
  onClick: (
    event: ChartEvent,
    activeElements: ActiveElement[],
    chart: Chart,
  ) => {
    if (activeElements.length > 0) {
      const element = activeElements[0];
      const datasetIndex = element.datasetIndex;
      const index = element.index;
      const dataset = chart.data.datasets[datasetIndex];
      const label = chart.data.labels?.[index];

      // Dispatch custom event for component to handle
      const customEvent = new CustomEvent("chartClick", {
        detail: {
          datasetLabel: dataset.label,
          dataLabel: label,
          value: dataset.data[index],
          datasetIndex,
          index,
        },
      });
      chart.canvas.dispatchEvent(customEvent);
    }
  },

  plugins: {
    // Legend configuration with toggle
    legend: {
      display: true,
      position: "top",
      align: "center",
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: getResponsiveFontSize(12),
          family: "'Poppins', sans-serif",
          weight: 500,
        },
        color: "var(--color-text-primary)",
        generateLabels: (chart: Chart) => {
          const datasets = chart.data.datasets;
          return datasets.map((dataset, i) => ({
            text: dataset.label || "",
            fillStyle: dataset.backgroundColor as string,
            strokeStyle: dataset.borderColor as string,
            lineWidth: 2,
            hidden: !chart.isDatasetVisible(i),
            datasetIndex: i,
          }));
        },
      },
      onClick: (
        e: ChartEvent,
        legendItem: LegendItem,
        legend: LegendElement<"line">,
      ) => {
        const index = legendItem.datasetIndex;
        if (index === undefined) return;

        const chart = legend.chart;

        if (chart.isDatasetVisible(index)) {
          chart.hide(index);
          legendItem.hidden = true;
        } else {
          chart.show(index);
          legendItem.hidden = false;
        }

        chart.update();
      },
    },

    // Enhanced tooltip
    tooltip: {
      enabled: true,
      mode: "index",
      intersect: false,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "var(--color-brand-primary)",
      borderWidth: 1,
      padding: 12,
      titleFont: {
        size: getResponsiveFontSize(14),
        weight: "bold",
        family: "'Poppins', sans-serif",
      },
      bodyFont: {
        size: getResponsiveFontSize(13),
        family: "'Poppins', sans-serif",
      },
      footerFont: {
        size: getResponsiveFontSize(11),
        family: "'Poppins', sans-serif",
        style: "italic",
      },
      displayColors: true,
      callbacks: CUSTOM_TOOLTIP_CALLBACKS,
    },
  },

  scales: {
    x: {
      display: true,
      grid: {
        display: true,
        color: "rgba(0, 0, 0, 0.05)",
      },
      ticks: {
        font: {
          size: getResponsiveFontSize(12),
          family: "'Poppins', sans-serif",
        },
        color: "var(--color-text-secondary)",
        maxRotation: 45,
        minRotation: 0,
      },
    },
    y: {
      display: true,
      beginAtZero: true,
      grid: {
        display: true,
        color: "rgba(0, 0, 0, 0.05)",
      },
      ticks: {
        font: {
          size: getResponsiveFontSize(12),
          family: "'Poppins', sans-serif",
        },
        color: "var(--color-text-secondary)",
        padding: 8,
      },
    },
  },
};

/**
 * Line Chart Options with Enhanced Features
 */
export const ENHANCED_LINE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: "top",
      align: "center",
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: getResponsiveFontSize(12),
          family: "'Poppins', sans-serif",
          weight: 500,
        },
        color: "var(--color-text-primary)",
      },
    },
    tooltip: {
      enabled: true,
      mode: "index",
      intersect: false,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "var(--color-brand-primary)",
      borderWidth: 1,
      padding: 12,
      titleFont: {
        size: getResponsiveFontSize(14),
        weight: "bold",
        family: "'Poppins', sans-serif",
      },
      bodyFont: {
        size: getResponsiveFontSize(13),
        family: "'Poppins', sans-serif",
      },
      displayColors: true,
    },
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: true,
        color: "rgba(0, 0, 0, 0.05)",
      },
      ticks: {
        font: {
          size: getResponsiveFontSize(12),
          family: "'Poppins', sans-serif",
        },
        color: "var(--color-text-secondary)",
        maxRotation: 45,
        minRotation: 0,
      },
    },
    y: {
      display: true,
      beginAtZero: true,
      grid: {
        display: true,
        color: "rgba(0, 0, 0, 0.05)",
      },
      ticks: {
        font: {
          size: getResponsiveFontSize(12),
          family: "'Poppins', sans-serif",
        },
        color: "var(--color-text-secondary)",
        padding: 8,
      },
    },
  },
  elements: {
    line: {
      tension: 0.4,
      borderWidth: 3,
    },
    point: {
      radius: 4,
      hitRadius: 10,
      hoverRadius: 6,
      hoverBorderWidth: 2,
    },
  },
};

/**
 * Bar Chart Options with Enhanced Features
 */
export const ENHANCED_BAR_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: "top",
      align: "center",
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: getResponsiveFontSize(12),
          family: "'Poppins', sans-serif",
          weight: 500,
        },
        color: "var(--color-text-primary)",
      },
    },
    tooltip: {
      enabled: true,
      mode: "index",
      intersect: false,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "var(--color-brand-primary)",
      borderWidth: 1,
      padding: 12,
      titleFont: {
        size: getResponsiveFontSize(14),
        weight: "bold",
        family: "'Poppins', sans-serif",
      },
      bodyFont: {
        size: getResponsiveFontSize(13),
        family: "'Poppins', sans-serif",
      },
      displayColors: true,
    },
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: true,
        color: "rgba(0, 0, 0, 0.05)",
      },
      ticks: {
        font: {
          size: getResponsiveFontSize(12),
          family: "'Poppins', sans-serif",
        },
        color: "var(--color-text-secondary)",
        maxRotation: 45,
        minRotation: 0,
      },
    },
    y: {
      display: true,
      beginAtZero: true,
      grid: {
        display: true,
        color: "rgba(0, 0, 0, 0.05)",
      },
      ticks: {
        font: {
          size: getResponsiveFontSize(12),
          family: "'Poppins', sans-serif",
        },
        color: "var(--color-text-secondary)",
        padding: 8,
      },
    },
  },
  elements: {
    bar: {
      borderWidth: 0,
      borderRadius: 4,
    },
  },
};

/**
 * Get responsive legend position for doughnut charts
 * On mobile, legend goes to bottom; on desktop, legend goes to right
 */
function getDoughnutLegendPosition(): "right" | "bottom" {
  if (typeof window === "undefined") return "right";
  return window.innerWidth < 768 ? "bottom" : "right";
}

/**
 * Doughnut Chart Options with Enhanced Features
 */
export const ENHANCED_DOUGHNUT_CHART_OPTIONS: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "65%",
  plugins: {
    legend: {
      display: true,
      position: getDoughnutLegendPosition(),
      align: "center",
      labels: {
        usePointStyle: true,
        padding: 12,
        boxWidth: 12,
        font: {
          size: getResponsiveFontSize(11),
          family: "'Poppins', sans-serif",
          weight: 500,
        },
        color: "var(--color-text-primary)",
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "var(--color-brand-primary)",
      borderWidth: 1,
      padding: 12,
      titleFont: {
        size: getResponsiveFontSize(14),
        weight: "bold",
        family: "'Poppins', sans-serif",
      },
      bodyFont: {
        size: getResponsiveFontSize(13),
        family: "'Poppins', sans-serif",
      },
      displayColors: true,
    },
  },
};

/**
 * Radar Chart Options with Enhanced Features
 */
export const ENHANCED_RADAR_CHART_OPTIONS: ChartOptions<"radar"> = {
  responsive: true,
  maintainAspectRatio: false,

  interaction: {
    mode: "index",
    intersect: false,
  },

  plugins: {
    legend: {
      display: true,
      position: "top",
      labels: {
        font: {
          size: getResponsiveFontSize(12),
          family: "'Poppins', sans-serif",
        },
        color: "var(--color-text-primary)",
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      titleFont: {
        size: getResponsiveFontSize(14),
        family: "'Poppins', sans-serif",
      },
      bodyFont: {
        size: getResponsiveFontSize(13),
        family: "'Poppins', sans-serif",
      },
      callbacks: CUSTOM_TOOLTIP_CALLBACKS,
    },
  },

  scales: {
    r: {
      beginAtZero: true,
      max: 10,
      ticks: {
        stepSize: 2,
        font: {
          size: getResponsiveFontSize(11),
          family: "'Poppins', sans-serif",
        },
        color: "var(--color-text-secondary)",
        backdropColor: "transparent",
      },
      grid: {
        color: "rgba(0, 0, 0, 0.1)",
      },
      pointLabels: {
        font: {
          size: getResponsiveFontSize(12),
          family: "'Poppins', sans-serif",
          weight: 500,
        },
        color: "var(--color-text-primary)",
      },
    },
  },
};

/**
 * Export chart as PNG image
 * @param chart - Chart.js instance
 * @param filename - Filename for download
 */
export function exportChartAsPNG(
  chart: Chart,
  filename: string = "chart",
): void {
  // Defensive guard: ensure chart and canvas exist
  if (!chart?.canvas) {
    console.warn("[exportChartAsPNG] Chart or canvas not available");
    return;
  }
  const canvas = chart.canvas;
  const url = canvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.png`;
  link.href = url;
  link.click();
}

/**
 * Reset zoom/pan to original view
 * @param chart - Chart.js instance
 */
export function resetChartZoom(chart: Chart): void {
  if (chart && (chart as Chart & { resetZoom?: () => void }).resetZoom) {
    (chart as Chart & { resetZoom: () => void }).resetZoom();
  }
}

/**
 * Toggle dataset visibility
 * @param chart - Chart.js instance
 * @param datasetIndex - Index of dataset to toggle
 */
export function toggleDataset(chart: Chart, datasetIndex: number): void {
  // Defensive guard: ensure chart methods exist
  if (!chart || typeof chart.isDatasetVisible !== "function") {
    console.warn("[toggleDataset] Chart instance not properly initialized");
    return;
  }
  if (chart.isDatasetVisible(datasetIndex)) {
    chart.hide(datasetIndex);
  } else {
    chart.show(datasetIndex);
  }
  chart.update();
}

/**
 * Update chart font sizes on window resize
 * @param chart - Chart.js instance
 */
export function updateChartFontSizes(chart: Chart): void {
  // Defensive guard: ensure chart and its methods exist
  // This prevents "t.clear is not a function" when chart isn't fully initialized
  if (!chart || typeof chart.update !== "function") {
    console.warn("[updateChartFontSizes] Chart instance not properly initialized");
    return;
  }
  const options = chart.options;

  if (!options?.plugins || !options?.scales) return;

  // Update legend font size
  const legendFont = options.plugins.legend?.labels?.font;
  if (legendFont && typeof legendFont === "object" && "size" in legendFont) {
    (legendFont as { size?: number }).size = getResponsiveFontSize(12);
  }

  // Update tooltip font sizes
  if (options.plugins.tooltip) {
    const titleFont = options.plugins.tooltip.titleFont;
    if (titleFont && typeof titleFont === "object" && "size" in titleFont) {
      (titleFont as { size?: number }).size = getResponsiveFontSize(14);
    }
    const bodyFont = options.plugins.tooltip.bodyFont;
    if (bodyFont && typeof bodyFont === "object" && "size" in bodyFont) {
      (bodyFont as { size?: number }).size = getResponsiveFontSize(13);
    }
    const footerFont = options.plugins.tooltip.footerFont;
    if (footerFont && typeof footerFont === "object" && "size" in footerFont) {
      (footerFont as { size?: number }).size = getResponsiveFontSize(11);
    }
  }

  // Update axis font sizes
  const xFont = options.scales.x?.ticks?.font;
  if (xFont && typeof xFont === "object" && "size" in xFont) {
    (xFont as { size?: number }).size = getResponsiveFontSize(12);
  }
  const yFont = options.scales.y?.ticks?.font;
  if (yFont && typeof yFont === "object" && "size" in yFont) {
    (yFont as { size?: number }).size = getResponsiveFontSize(12);
  }

  chart.update();
}
