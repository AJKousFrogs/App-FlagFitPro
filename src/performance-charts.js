/* eslint-disable no-promise-executor-return */
// Performance Trend Visualization Charts
// Creates interactive charts for athlete performance data using Chart.js

import { performanceAPI } from "./performance-api.js";
import { logger } from "./logger.js";

export class PerformanceCharts {
  constructor() {
    this.charts = new Map();
    this.chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          titleColor: "#333",
          bodyColor: "#666",
          borderColor: "#667eea",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          type: "time",
          time: {
            tooltipFormat: "MMM DD, YYYY",
            displayFormats: {
              month: "MMM YYYY",
              day: "MMM DD",
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: false,
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    };
  }

  // Initialize charts in dashboard
  async initializeDashboardCharts() {
    try {
      // Cleanup any existing charts first
      this.cleanupAllCharts();

      await this.loadChartJS();

      // Create performance trends chart
      await this.createPerformanceTrendsChart("performance-trends-chart");

      // Create wellness tracking chart
      await this.createWellnessChart("wellness-trends-chart");

      // Create body composition chart
      await this.createBodyCompositionChart("body-composition-chart");

      // Create combined overview chart
      await this.createOverviewChart("performance-overview-chart");
    } catch (error) {
      logger.error("Failed to initialize charts:", error);
      this.showChartError();
    }
  }

  // Cleanup all charts to prevent memory leaks
  cleanupAllCharts() {
    this.charts.forEach((chart, canvasId) => {
      try {
        chart.destroy();
      } catch (error) {
        logger.warn(`Error destroying chart ${canvasId}:`, error);
      }
    });
    this.charts.clear();
  }

  // Load Chart.js library dynamically
  async loadChartJS() {
    if (window.Chart) {return;} // Already loaded

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.js";
      script.crossOrigin = "anonymous";
      script.onload = () => {
        // Load Chart.js date adapter
        const dateScript = document.createElement("script");
        dateScript.src =
          "https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js";
        dateScript.crossOrigin = "anonymous";
        dateScript.onload = resolve;
        dateScript.onerror = reject;
        void document.head.appendChild(dateScript);
      };
      script.onerror = reject;
      void document.head.appendChild(script);
    });
  }

  // Performance Trends Chart (40-yard dash, broad jump, etc.)
  async createPerformanceTrendsChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {return;}

    // Destroy existing chart if present (prevent memory leaks)
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
      this.charts.delete(canvasId);
    }

    try {
      const performanceHistory = await performanceAPI.getPerformanceHistory(
        "all",
        "6m",
      );

      const datasets = this.preparePerformanceDatasets(performanceHistory);

      const chart = new Chart(canvas, {
        type: "line",
        data: { datasets },
        options: {
          ...this.chartDefaults,
          plugins: {
            ...this.chartDefaults.plugins,
            title: {
              display: true,
              text: "Performance Trends (Last 6 Months)",
              font: { size: 16, weight: "bold" },
            },
          },
          scales: {
            ...this.chartDefaults.scales,
            y: {
              ...this.chartDefaults.scales.y,
              title: {
                display: true,
                text: "Time / Distance",
              },
            },
          },
        },
      });

      this.charts.set(canvasId, chart);
      this.addChartInteractivity(chart, "performance");
    } catch (error) {
      logger.error("Performance trends chart error:", error);
      this.showMockPerformanceChart(canvas);
    }
  }

  // Wellness Tracking Chart (sleep, energy, stress, etc.)
  async createWellnessChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {return;}

    // Destroy existing chart if present (prevent memory leaks)
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
      this.charts.delete(canvasId);
    }

    try {
      const wellnessHistory = await performanceAPI.getWellnessHistory("30d");

      const datasets = this.prepareWellnessDatasets(wellnessHistory);

      const chart = new Chart(canvas, {
        type: "line",
        data: { datasets },
        options: {
          ...this.chartDefaults,
          plugins: {
            ...this.chartDefaults.plugins,
            title: {
              display: true,
              text: "Daily Wellness Tracking (Last 30 Days)",
              font: { size: 16, weight: "bold" },
            },
          },
          scales: {
            ...this.chartDefaults.scales,
            y: {
              ...this.chartDefaults.scales.y,
              min: 0,
              max: 10,
              title: {
                display: true,
                text: "Wellness Score (1-10)",
              },
            },
          },
        },
      });

      this.charts.set(canvasId, chart);
      this.addChartInteractivity(chart, "wellness");
    } catch (error) {
      logger.error("Wellness chart error:", error);
      this.showMockWellnessChart(canvas);
    }
  }

  // Body Composition Chart (weight, body fat, muscle mass)
  async createBodyCompositionChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {return;}

    // Destroy existing chart if present (prevent memory leaks)
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
      this.charts.delete(canvasId);
    }

    try {
      const measurementHistory = await performanceAPI.getPhysicalMeasurements(
        "current",
        "6m",
      );

      const datasets = this.prepareBodyCompositionDatasets(measurementHistory);

      const chart = new Chart(canvas, {
        type: "line",
        data: { datasets },
        options: {
          ...this.chartDefaults,
          plugins: {
            ...this.chartDefaults.plugins,
            title: {
              display: true,
              text: "Body Composition Trends (Last 6 Months)",
              font: { size: 16, weight: "bold" },
            },
          },
          scales: {
            ...this.chartDefaults.scales,
            y: {
              ...this.chartDefaults.scales.y,
              title: {
                display: true,
                text: "Weight (kg) / Body Fat (%)",
              },
            },
          },
        },
      });

      this.charts.set(canvasId, chart);
      this.addChartInteractivity(chart, "body-composition");
    } catch (error) {
      logger.error("Body composition chart error:", error);
      this.showMockBodyCompositionChart(canvas);
    }
  }

  // Combined Overview Chart
  async createOverviewChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {return;}

    // Destroy existing chart if present (prevent memory leaks)
    if (this.charts.has(canvasId)) {
      this.charts.get(canvasId).destroy();
      this.charts.delete(canvasId);
    }

    try {
      const trends = await performanceAPI.getPerformanceTrends("3m");

      const chart = new Chart(canvas, {
        type: "radar",
        data: this.prepareOverviewData(trends),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Performance Overview",
              font: { size: 16, weight: "bold" },
            },
            legend: {
              position: "bottom",
            },
          },
          scales: {
            r: {
              angleLines: {
                display: true,
                color: "rgba(0, 0, 0, 0.1)",
              },
              suggestedMin: 0,
              suggestedMax: 100,
              pointLabels: {
                font: { size: 12 },
              },
            },
          },
        },
      });

      this.charts.set(canvasId, chart);
    } catch (error) {
      logger.error("Overview chart error:", error);
      this.showMockOverviewChart(canvas);
    }
  }

  // Prepare performance datasets
  preparePerformanceDatasets(performanceHistory) {
    const datasets = [];
    const colors = {
      "40YardDash": "#667eea",
      BroadJump: "#10b981",
      VerticalJump: "#f59e0b",
      ProAgility: "#ef4444",
      "300YardShuttle": "#8b5cf6",
    };

    // Group by test type
    const grouped = {};
    performanceHistory.forEach((test) => {
      if (!grouped[test.testType]) {grouped[test.testType] = [];}
      // eslint-disable-next-line no-promise-executor-return
      void grouped[test.testType].push({
        x: test.timestamp,
        y: test.result,
      });
    });

    Object.keys(grouped).forEach((testType) => {
      datasets.push({
        label: testType.replace(/([A-Z])/g, " $1").trim(),
        data: grouped[testType].sort((a, b) => new Date(a.x) - new Date(b.x)),
        borderColor: colors[testType] || "#667eea",
        backgroundColor: colors[testType] + "20" || "#667eea20",
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    });

    return datasets;
  }

  // Prepare wellness datasets
  prepareWellnessDatasets(wellnessHistory) {
    const datasets = [];
    const metrics = [
      { key: "sleep", label: "Sleep Quality", color: "#667eea" },
      { key: "energy", label: "Energy Level", color: "#10b981" },
      { key: "stress", label: "Stress Level", color: "#ef4444" },
      { key: "motivation", label: "Motivation", color: "#f59e0b" },
    ];

    metrics.forEach((metric) => {
      const data = wellnessHistory
        .filter((w) => w[metric.key] != null)
        .map((w) => ({
          x: w.date,
          y: w[metric.key],
        }))
        .sort((a, b) => new Date(a.x) - new Date(b.x));

      if (data.length > 0) {
        datasets.push({
          label: metric.label,
          data: data,
          borderColor: metric.color,
          backgroundColor: metric.color + "20",
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 3,
          pointHoverRadius: 5,
        });
      }
    });

    return datasets;
  }

  // Prepare body composition datasets
  prepareBodyCompositionDatasets(measurementHistory) {
    const datasets = [];

    if (measurementHistory.length > 0) {
      // Weight data
      const weightData = measurementHistory
        .filter((m) => m.weight != null)
        .map((m) => ({ x: m.timestamp, y: m.weight }))
        .sort((a, b) => new Date(a.x) - new Date(b.x));

      if (weightData.length > 0) {
        datasets.push({
          label: "Weight (kg)",
          data: weightData,
          borderColor: "#667eea",
          backgroundColor: "#667eea20",
          borderWidth: 2,
          fill: false,
          yAxisID: "y",
        });
      }

      // Body fat data
      const bodyFatData = measurementHistory
        .filter((m) => m.bodyFat != null)
        .map((m) => ({ x: m.timestamp, y: m.bodyFat }))
        .sort((a, b) => new Date(a.x) - new Date(b.x));

      if (bodyFatData.length > 0) {
        datasets.push({
          label: "Body Fat (%)",
          data: bodyFatData,
          borderColor: "#10b981",
          backgroundColor: "#10b98120",
          borderWidth: 2,
          fill: false,
          yAxisID: "y1",
        });
      }
    }

    return datasets;
  }

  // Prepare overview radar chart data
  prepareOverviewData(trends) {
    const performanceScores = {
      Speed: this.calculatePerformanceScore(trends.performance?.["40YardDash"]),
      Power: this.calculatePerformanceScore(trends.performance?.["BroadJump"]),
      Agility: this.calculatePerformanceScore(
        trends.performance?.["ProAgility"],
      ),
      Endurance: this.calculatePerformanceScore(
        trends.performance?.["300YardShuttle"],
      ),
      Wellness: this.calculateWellnessScore(trends.wellness),
      Consistency: this.calculateConsistencyScore(trends),
    };

    return {
      labels: Object.keys(performanceScores),
      datasets: [
        {
          label: "Current Performance",
          data: Object.values(performanceScores),
          backgroundColor: "rgba(102, 126, 234, 0.2)",
          borderColor: "#667eea",
          pointBackgroundColor: "#667eea",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "#667eea",
        },
      ],
    };
  }

  // Add chart interactivity
  addChartInteractivity(chart, type) {
    const canvas = chart.canvas;

    // Add click events for data points
    canvas.addEventListener("click", (event) => {
      const points = chart.getElementsAtEventForMode(
        event,
        "nearest",
        { intersect: true },
        true,
      );

      if (points.length > 0) {
        const point = points[0];
        const datasetIndex = point.datasetIndex;
        const index = point.index;
        const dataset = chart.data.datasets[datasetIndex];
        const value = dataset.data[index];

        this.showDataPointDetails(type, dataset.label, value, event);
      }
    });

    // Add hover effects
    chart.options.onHover = (event, elements) => {
      canvas.style.cursor = elements.length > 0 ? "pointer" : "default";
    };
  }

  // Show data point details in tooltip
  showDataPointDetails(type, label, value, event) {
    const tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip";
    tooltip.innerHTML = `
            <div class="tooltip-header">${label}</div>
            <div class="tooltip-content">
                <div>Date: ${new Date(value.x).toLocaleDateString()}</div>
                <div>Value: ${value.y}</div>
                <div class="tooltip-actions">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
                </div>
            </div>
        `;

    tooltip.style.cssText = `
            position: fixed;
            left: ${event.clientX + 10}px;
            top: ${event.clientY - 50}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            max-width: 200px;
        `;

    document.body.appendChild(tooltip);

    // Remove after 5 seconds
    // eslint-disable-next-line no-promise-executor-return
    void setTimeout(() => {
      if (tooltip.parentElement) {
        tooltip.remove();
      }
    }, 5000);
  }

  // Performance scoring methods
  calculatePerformanceScore(trend) {
    if (!trend) {return 50;}

    if (trend.trend === "improving") {return Math.min(100, 70 + Math.abs(trend.changePercent));}
    if (trend.trend === "declining") {return Math.max(0, 70 - Math.abs(trend.changePercent));}
    return 70; // stable
  }

  // eslint-disable-next-line no-promise-executor-return
  calculateWellnessScore(wellness) {
    if (!wellness || !wellness.averageScore) {return 50;}
    return Math.min(100, wellness.averageScore * 10);
  }

  calculateConsistencyScore(trends) {
    // Calculate based on variance in performance
    const performanceData = Object.values(trends.performance || {});
    if (performanceData.length === 0) {return 50;}

    let totalVariance = 0;
    performanceData.forEach((perf) => {
      if (perf.data && perf.data.length > 1) {
        const values = perf.data.map((d) => d.value);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance =
          values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
          values.length;
        totalVariance += variance;
      }
    });

    // Lower variance = higher consistency score
    return Math.max(0, Math.min(100, 100 - totalVariance * 10));
  }

  // Mock chart methods for fallback
  showMockPerformanceChart(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6b7280";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Performance data will appear here",
      canvas.width / 2,
      canvas.height / 2,
    );
    ctx.fillText(
      "when connected to backend",
      canvas.width / 2,
      canvas.height / 2 + 25,
    );
  }

  showMockWellnessChart(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6b7280";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Wellness trends will appear here",
      canvas.width / 2,
      canvas.height / 2,
    );
  }

  showMockBodyCompositionChart(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6b7280";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Body composition trends will appear here",
      canvas.width / 2,
      canvas.height / 2,
    );
  }

  showMockOverviewChart(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6b7280";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Performance overview will appear here",
      canvas.width / 2,
      canvas.height / 2,
    );
  }

  showChartError() {
    logger.warn(
      "Charts could not be initialized - falling back to mock data display",
    );
  }

  // Utility methods for chart management
  updateChart(chartId, newData) {
    const chart = this.charts.get(chartId);
    if (chart) {
      chart.data = newData;
      chart.update();
    }
  }

  resizeCharts() {
    this.charts.forEach((chart) => {
      chart.resize();
    });
  }

  destroyChart(chartId) {
    const chart = this.charts.get(chartId);
    if (chart) {
      chart.destroy();
      this.charts.delete(chartId);
    }
  }

  destroyAllCharts() {
    this.charts.forEach((chart) => chart.destroy());
    this.charts.clear();
  }
}

// Export singleton instance
export const performanceCharts = new PerformanceCharts();
