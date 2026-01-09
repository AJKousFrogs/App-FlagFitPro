import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  exportChartAsPNG,
  resetChartZoom,
  toggleDataset,
  updateChartFontSizes,
  CUSTOM_TOOLTIP_CALLBACKS,
  ENHANCED_LINE_CHART_OPTIONS,
  ENHANCED_BAR_CHART_OPTIONS,
  ENHANCED_DOUGHNUT_CHART_OPTIONS,
  ENHANCED_RADAR_CHART_OPTIONS,
} from "./enhanced-chart.config";
import { Chart, TooltipItem } from "chart.js";

// Helper to access private calculateTrend function via tooltip callbacks
function calculateTrendViaTooltip(data: number[]): {
  direction: "up" | "down" | "stable";
  percentage: number;
} {
  const tooltipItem = {
    dataset: {
      data,
      label: "Test Dataset",
    },
    parsed: { y: data[data.length - 1] },
  } as TooltipItem<any>;

  const result = CUSTOM_TOOLTIP_CALLBACKS.afterLabel(tooltipItem);

  // Result is an array like ['', 'Trend: Stable'] or ['', 'Trend: ↑ 50.0%', 'Improving']
  const trendLine = Array.isArray(result) ? result[1] : result;

  if (trendLine.includes("Stable")) {
    return { direction: "stable", percentage: 0 };
  }

  const percentageMatch = trendLine.match(/([\d.]+)%/);
  const percentage = percentageMatch ? parseFloat(percentageMatch[1]) : 0;
  const direction = trendLine.includes("↑") ? "up" : "down";

  return { direction, percentage };
}

describe("Enhanced Chart Config", () => {
  describe("Trend Calculation (via Tooltip Callbacks)", () => {
    it("should calculate upward trend correctly", () => {
      const data = [50, 60, 70, 80, 90];
      const trend = calculateTrendViaTooltip(data);

      expect(trend.direction).toBe("up");
      expect(trend.percentage).toBeCloseTo(80, 0); // (90-50)/50 * 100 = 80%
    });

    it("should calculate downward trend correctly", () => {
      const data = [100, 90, 80, 70, 60];
      const trend = calculateTrendViaTooltip(data);

      expect(trend.direction).toBe("down");
      expect(trend.percentage).toBeCloseTo(40, 0); // (60-100)/100 * 100 = -40%
    });

    it("should return stable for minimal change (<1%)", () => {
      const data = [100, 100.5, 100.2, 100.3];
      const trend = calculateTrendViaTooltip(data);

      expect(trend.direction).toBe("stable");
      expect(trend.percentage).toBe(0);
    });

    it("should handle single data point (stable)", () => {
      const data = [50];
      const trend = calculateTrendViaTooltip(data);

      expect(trend.direction).toBe("stable");
      expect(trend.percentage).toBe(0);
    });

    it("should handle first value = 0 (edge case)", () => {
      const data = [0, 10, 20, 30];
      const trend = calculateTrendViaTooltip(data);

      expect(trend.direction).toBe("up");
      expect(trend.percentage).toBe(0); // Special case: from 0
    });

    it("should handle negative values", () => {
      const data = [-50, -40, -30, -20, -10];
      const trend = calculateTrendViaTooltip(data);

      // Note: (-10 - (-50)) / -50 = 40 / -50 = -80%, so direction is 'down'
      // The implementation treats this as 'down' because percentage is negative
      expect(trend.direction).toBe("down");
      expect(trend.percentage).toBeCloseTo(80, 0);
    });

    it("should handle two data points", () => {
      const data = [100, 150];
      const trend = calculateTrendViaTooltip(data);

      expect(trend.direction).toBe("up");
      expect(trend.percentage).toBeCloseTo(50, 0); // 50% increase
    });

    it("should handle zero to zero (stable)", () => {
      const data = [0, 0];
      const trend = calculateTrendViaTooltip(data);

      expect(trend.direction).toBe("stable");
      expect(trend.percentage).toBe(0);
    });
  });

  describe("Custom Tooltip Callbacks", () => {
    it("should return correct title", () => {
      const tooltipItems = [{ label: "Week 1" } as TooltipItem<any>];

      const title = CUSTOM_TOOLTIP_CALLBACKS.title(tooltipItems);

      expect(title).toBe("Week 1");
    });

    it("should return empty string when no tooltip items", () => {
      const title = CUSTOM_TOOLTIP_CALLBACKS.title([]);

      expect(title).toBe("");
    });

    it("should return correct label with dataset name and value", () => {
      const tooltipItem = {
        dataset: {
          label: "Performance",
          data: [80, 85, 90],
        },
        parsed: { y: 90 },
      } as TooltipItem<any>;

      const label = CUSTOM_TOOLTIP_CALLBACKS.label(tooltipItem);

      expect(label).toBe("Performance: 90");
    });

    it("should handle dataset without label", () => {
      const tooltipItem = {
        dataset: {
          data: [80, 85, 90],
        },
        parsed: { y: 90 },
      } as TooltipItem<any>;

      const label = CUSTOM_TOOLTIP_CALLBACKS.label(tooltipItem);

      expect(label).toBe(": 90");
    });

    it("should show trend arrow for upward trend", () => {
      const tooltipItem = {
        dataset: {
          data: [50, 60, 70, 80, 90],
          label: "Score",
        },
        parsed: { y: 90 },
      } as TooltipItem<any>;

      const afterLabel = CUSTOM_TOOLTIP_CALLBACKS.afterLabel(tooltipItem);

      expect(afterLabel[1]).toContain("↑");
      expect(afterLabel[2]).toBe("Improving");
    });

    it("should show trend arrow for downward trend", () => {
      const tooltipItem = {
        dataset: {
          data: [100, 90, 80, 70, 60],
          label: "Score",
        },
        parsed: { y: 60 },
      } as TooltipItem<any>;

      const afterLabel = CUSTOM_TOOLTIP_CALLBACKS.afterLabel(tooltipItem);

      expect(afterLabel[1]).toContain("↓");
      expect(afterLabel[2]).toBe("Declining");
    });

    it('should show "Stable" for minimal trend', () => {
      const tooltipItem = {
        dataset: {
          data: [100, 100.2, 100.1],
          label: "Score",
        },
        parsed: { y: 100.1 },
      } as TooltipItem<any>;

      const afterLabel = CUSTOM_TOOLTIP_CALLBACKS.afterLabel(tooltipItem);

      expect(afterLabel[1]).toBe("Trend: Stable");
      expect(afterLabel.length).toBe(2);
    });

    it("should return footer with click instruction", () => {
      const tooltipItems = [{ label: "Week 1" } as TooltipItem<any>];

      const footer = CUSTOM_TOOLTIP_CALLBACKS.footer(tooltipItems);

      expect(footer).toEqual(["", "Click to view details"]);
    });
  });

  describe("PNG Export Utility", () => {
    let mockCanvas: HTMLCanvasElement;
    let mockChart: Chart;
    let mockLink: HTMLAnchorElement;
    let createElementSpy: any;
    let clickSpy: any;

    beforeEach(() => {
      // Create mock canvas
      mockCanvas = document.createElement("canvas");
      mockCanvas.toDataURL = vi
        .fn()
        .mockReturnValue("data:image/png;base64,mockImageData");

      // Create mock chart
      mockChart = {
        canvas: mockCanvas,
      } as unknown as Chart;

      // Create mock link
      mockLink = document.createElement("a");
      clickSpy = vi.spyOn(mockLink, "click").mockImplementation(() => {});

      // Spy on document.createElement
      createElementSpy = vi
        .spyOn(document, "createElement")
        .mockReturnValue(mockLink);
    });

    it("should create download link with correct filename", () => {
      const today = new Date().toISOString().split("T")[0];

      exportChartAsPNG(mockChart, "test-chart");

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(mockLink.download).toBe(`test-chart-${today}.png`);
    });

    it("should use canvas.toDataURL for PNG", () => {
      exportChartAsPNG(mockChart, "test-chart");

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/png");
      expect(mockLink.href).toBe("data:image/png;base64,mockImageData");
    });

    it("should trigger link click", () => {
      exportChartAsPNG(mockChart, "test-chart");

      expect(clickSpy).toHaveBeenCalled();
    });

    it("should use default filename when not provided", () => {
      const today = new Date().toISOString().split("T")[0];

      exportChartAsPNG(mockChart);

      expect(mockLink.download).toBe(`chart-${today}.png`);
    });

    it("should include date in filename", () => {
      exportChartAsPNG(mockChart, "analytics");

      expect(mockLink.download).toMatch(/analytics-\d{4}-\d{2}-\d{2}\.png/);
    });
  });

  describe("Zoom Reset Utility", () => {
    it("should call chart.resetZoom()", () => {
      const mockResetZoom = vi.fn();
      const mockChart = {
        resetZoom: mockResetZoom,
      } as unknown as Chart;

      resetChartZoom(mockChart);

      expect(mockResetZoom).toHaveBeenCalled();
    });

    it("should handle chart without resetZoom method", () => {
      const mockChart = {} as Chart;

      expect(() => resetChartZoom(mockChart)).not.toThrow();
    });

    it("should work with zoom plugin enabled", () => {
      const mockResetZoom = vi.fn();
      const mockChart = {
        resetZoom: mockResetZoom,
        options: {
          plugins: {
            zoom: {
              zoom: { enabled: true },
            },
          },
        },
      } as unknown as Chart;

      resetChartZoom(mockChart);

      expect(mockResetZoom).toHaveBeenCalled();
    });
  });

  describe("Dataset Toggle Utility", () => {
    it("should hide visible dataset", () => {
      const mockHide = vi.fn();
      const mockUpdate = vi.fn();
      const mockChart = {
        isDatasetVisible: vi.fn().mockReturnValue(true),
        hide: mockHide,
        show: vi.fn(),
        update: mockUpdate,
      } as unknown as Chart;

      toggleDataset(mockChart, 0);

      expect(mockChart.isDatasetVisible).toHaveBeenCalledWith(0);
      expect(mockHide).toHaveBeenCalledWith(0);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should show hidden dataset", () => {
      const mockShow = vi.fn();
      const mockUpdate = vi.fn();
      const mockChart = {
        isDatasetVisible: vi.fn().mockReturnValue(false),
        hide: vi.fn(),
        show: mockShow,
        update: mockUpdate,
      } as unknown as Chart;

      toggleDataset(mockChart, 1);

      expect(mockChart.isDatasetVisible).toHaveBeenCalledWith(1);
      expect(mockShow).toHaveBeenCalledWith(1);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("should toggle multiple datasets", () => {
      const mockUpdate = vi.fn();
      const mockChart = {
        isDatasetVisible: vi
          .fn()
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false),
        hide: vi.fn(),
        show: vi.fn(),
        update: mockUpdate,
      } as unknown as Chart;

      toggleDataset(mockChart, 0);
      toggleDataset(mockChart, 1);

      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe("Font Size Update Utility", () => {
    it("should update legend font size", () => {
      const mockUpdate = vi.fn();
      const mockChart = {
        options: {
          plugins: {
            legend: {
              labels: {
                font: { size: 12 },
              },
            },
            tooltip: {},
          },
          scales: {
            x: { ticks: { font: {} } },
            y: { ticks: { font: {} } },
          },
        },
        update: mockUpdate,
      } as unknown as Chart;

      updateChartFontSizes(mockChart);

      expect(mockUpdate).toHaveBeenCalled();
      expect(
        (mockChart.options.plugins?.legend?.labels?.font as any)?.size,
      ).toBeDefined();
    });

    it("should update tooltip font sizes", () => {
      const mockUpdate = vi.fn();
      const mockChart = {
        options: {
          plugins: {
            legend: {},
            tooltip: {
              titleFont: { size: 14 },
              bodyFont: { size: 13 },
              footerFont: { size: 11 },
            },
          },
          scales: {
            x: { ticks: { font: {} } },
            y: { ticks: { font: {} } },
          },
        },
        update: mockUpdate,
      } as unknown as Chart;

      updateChartFontSizes(mockChart);

      expect(mockUpdate).toHaveBeenCalled();
      expect(
        (mockChart.options.plugins?.tooltip?.titleFont as any)?.size,
      ).toBeDefined();
      expect(
        (mockChart.options.plugins?.tooltip?.bodyFont as any)?.size,
      ).toBeDefined();
      expect(
        (mockChart.options.plugins?.tooltip?.footerFont as any)?.size,
      ).toBeDefined();
    });

    it("should update axis font sizes", () => {
      const mockUpdate = vi.fn();
      const mockChart = {
        options: {
          plugins: {},
          scales: {
            x: { ticks: { font: { size: 12 } } },
            y: { ticks: { font: { size: 12 } } },
          },
        },
        update: mockUpdate,
      } as unknown as Chart;

      updateChartFontSizes(mockChart);

      expect(mockUpdate).toHaveBeenCalled();
      expect(
        (mockChart.options.scales?.x?.ticks?.font as any)?.size,
      ).toBeDefined();
      expect(
        (mockChart.options.scales?.y?.ticks?.font as any)?.size,
      ).toBeDefined();
    });

    it("should handle missing options gracefully", () => {
      const mockChart = {
        options: {},
        update: vi.fn(),
      } as unknown as Chart;

      expect(() => updateChartFontSizes(mockChart)).not.toThrow();
    });

    it("should call chart.update() after font size changes", () => {
      const mockUpdate = vi.fn();
      const mockChart = {
        options: {
          plugins: {
            legend: { labels: { font: { size: 12 } } },
          },
          scales: {
            x: { ticks: { font: { size: 12 } } },
          },
        },
        update: mockUpdate,
      } as unknown as Chart;

      updateChartFontSizes(mockChart);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe("Chart Options Configuration", () => {
    it("should have responsive enabled", () => {
      expect(ENHANCED_LINE_CHART_OPTIONS.responsive).toBe(true);
      expect(ENHANCED_BAR_CHART_OPTIONS.responsive).toBe(true);
      expect(ENHANCED_DOUGHNUT_CHART_OPTIONS.responsive).toBe(true);
      expect(ENHANCED_RADAR_CHART_OPTIONS.responsive).toBe(true);
    });

    it("should have maintainAspectRatio disabled for flex layouts", () => {
      expect(ENHANCED_LINE_CHART_OPTIONS.maintainAspectRatio).toBe(false);
      expect(ENHANCED_BAR_CHART_OPTIONS.maintainAspectRatio).toBe(false);
      expect(ENHANCED_DOUGHNUT_CHART_OPTIONS.maintainAspectRatio).toBe(false);
      expect(ENHANCED_RADAR_CHART_OPTIONS.maintainAspectRatio).toBe(false);
    });

    it("should have interaction mode set to index", () => {
      expect(ENHANCED_LINE_CHART_OPTIONS.interaction?.mode).toBe("index");
      expect(ENHANCED_BAR_CHART_OPTIONS.interaction?.mode).toBe("index");
      // Doughnut and Radar may not have interaction mode
    });

    it("should have tooltip configured", () => {
      expect(ENHANCED_LINE_CHART_OPTIONS.plugins?.tooltip).toBeDefined();
      expect(ENHANCED_BAR_CHART_OPTIONS.plugins?.tooltip).toBeDefined();
      expect(ENHANCED_DOUGHNUT_CHART_OPTIONS.plugins?.tooltip).toBeDefined();
      expect(ENHANCED_RADAR_CHART_OPTIONS.plugins?.tooltip).toBeDefined();
    });

    it("should have legend configured", () => {
      expect(ENHANCED_LINE_CHART_OPTIONS.plugins?.legend).toBeDefined();
      expect(ENHANCED_BAR_CHART_OPTIONS.plugins?.legend).toBeDefined();
      expect(ENHANCED_DOUGHNUT_CHART_OPTIONS.plugins?.legend).toBeDefined();
      expect(ENHANCED_RADAR_CHART_OPTIONS.plugins?.legend).toBeDefined();
    });

    it("should have scales configured for line charts", () => {
      expect(ENHANCED_LINE_CHART_OPTIONS.scales?.x).toBeDefined();
      expect(ENHANCED_LINE_CHART_OPTIONS.scales?.y).toBeDefined();
    });

    it("should have element styling for line charts", () => {
      expect(ENHANCED_LINE_CHART_OPTIONS.elements?.line).toBeDefined();
      expect(ENHANCED_LINE_CHART_OPTIONS.elements?.point).toBeDefined();
    });

    it("should have doughnut chart with cutout configured", () => {
      expect(ENHANCED_DOUGHNUT_CHART_OPTIONS.cutout).toBe("65%");
    });

    it("should have doughnut chart with legend on right", () => {
      expect(ENHANCED_DOUGHNUT_CHART_OPTIONS.plugins?.legend?.position).toBe(
        "right",
      );
    });

    it("should have doughnut chart without scales", () => {
      expect(ENHANCED_DOUGHNUT_CHART_OPTIONS.scales).toBeUndefined();
    });

    it("should have radar chart with max scale of 10", () => {
      expect(ENHANCED_RADAR_CHART_OPTIONS.scales?.r?.max).toBe(10);
    });

    it("should have line chart with tension configured", () => {
      expect(ENHANCED_LINE_CHART_OPTIONS.elements?.line?.tension).toBe(0.4);
      expect(ENHANCED_LINE_CHART_OPTIONS.elements?.line?.borderWidth).toBe(3);
    });

    it("should have bar chart with border radius", () => {
      expect(ENHANCED_BAR_CHART_OPTIONS.elements?.bar?.borderRadius).toBe(4);
      expect(ENHANCED_BAR_CHART_OPTIONS.elements?.bar?.borderWidth).toBe(0);
    });
  });
});
