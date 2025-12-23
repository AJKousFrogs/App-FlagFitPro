/**
 * Universal Chart Accessibility Component
 * Enhances chart accessibility across analytics pages
 * Pages: analytics.html, enhanced-analytics.html, dashboard.html, performance-tracking.html
 */

class UniversalChartAccessibility {
  constructor(options = {}) {
    this.options = {
      enableDataTables: true,
      enableAriaLabels: true,
      enableKeyboardNavigation: true,
      enableScreenReaderAnnouncements: true,
      enableSummaryDescriptions: true,
      ...options,
    };

    this.charts = new Map();
    this.init();
  }

  init() {
    this.setupChartObserver();
    this.enhanceExistingCharts();
    this.setupGlobalKeyboardNavigation();
  }

  setupChartObserver() {
    // Watch for new charts being added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const charts = node.querySelectorAll(
              'canvas[id*="chart"], canvas[id*="Chart"], .chart-canvas canvas',
            );
            charts.forEach((chart) => this.enhanceChart(chart));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  enhanceExistingCharts() {
    // Find and enhance all existing charts
    const chartSelectors = [
      'canvas[id*="chart"]',
      'canvas[id*="Chart"]',
      ".chart-canvas canvas",
      "#performanceTrendsChart",
      "#skillsRadarChart",
      "#trainingProgressChart",
      "#performanceMetricsChart",
    ];

    chartSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((chart) => {
        this.enhanceChart(chart);
      });
    });
  }

  enhanceChart(chartCanvas) {
    if (!chartCanvas || this.charts.has(chartCanvas)) {
      return;
    }

    const chartInfo = this.analyzeChart(chartCanvas);
    this.charts.set(chartCanvas, chartInfo);

    // Apply accessibility enhancements
    this.addAriaLabels(chartCanvas, chartInfo);
    this.createDataTable(chartCanvas, chartInfo);
    this.addKeyboardNavigation(chartCanvas, chartInfo);
    this.addScreenReaderSupport(chartCanvas, chartInfo);
    this.addSummaryDescription(chartCanvas, chartInfo);
  }

  analyzeChart(chartCanvas) {
    const container = chartCanvas.closest(
      ".chart-container, .stat-card, .progress-section, .analytics-card",
    );
    const title = container?.querySelector(
      "h1, h2, h3, h4, h5, h6, .chart-title, .section-title",
    );
    const chartId = chartCanvas.id;

    // Try to determine chart type and data from Chart.js instance
    let chartInstance = null;
    let chartType = "unknown";
    let chartData = null;

    // Check if Chart.js is available and get instance
    if (window.Chart && chartId) {
      chartInstance = Chart.getChart(chartId) || Chart.getChart(chartCanvas);
    }

    if (chartInstance) {
      chartType = chartInstance.config.type;
      chartData = chartInstance.data;
    }

    return {
      id: chartId,
      canvas: chartCanvas,
      container: container,
      title: title?.textContent?.trim() || "Chart",
      type: chartType,
      data: chartData,
      instance: chartInstance,
      isAccessible: false,
    };
  }

  addAriaLabels(chartCanvas, chartInfo) {
    if (!this.options.enableAriaLabels) {
      return;
    }

    // Set role and basic labels
    chartCanvas.setAttribute("role", "img");
    chartCanvas.setAttribute("tabindex", "0");

    // Generate descriptive aria-label
    const ariaLabel = this.generateChartDescription(chartInfo);
    chartCanvas.setAttribute("aria-label", ariaLabel);

    // Add aria-describedby if we have additional information
    const descriptionId = `${chartInfo.id}-description`;
    chartCanvas.setAttribute("aria-describedby", descriptionId);
  }

  generateChartDescription(chartInfo) {
    const { title, type, data } = chartInfo;

    if (!data || !data.datasets || data.datasets.length === 0) {
      return `${title} - ${type} chart`;
    }

    const dataset = data.datasets[0];
    const dataPoints = dataset.data || [];
    const labels = data.labels || [];

    let description = `${title} - ${type} chart`;

    // Add data summary based on chart type
    switch (type) {
      case "line":
        if (dataPoints.length > 0) {
          const min = Math.min(...dataPoints);
          const max = Math.max(...dataPoints);
          const latest = dataPoints[dataPoints.length - 1];
          description += `. Shows trend from ${min} to ${max}, current value ${latest}`;

          if (dataPoints.length > 1) {
            const trend = latest > dataPoints[0] ? "increasing" : "decreasing";
            description += `. Overall trend: ${trend}`;
          }
        }
        break;

      case "bar":
        if (dataPoints.length > 0) {
          const total = dataPoints.reduce((sum, val) => sum + val, 0);
          const max = Math.max(...dataPoints);
          const maxIndex = dataPoints.indexOf(max);
          const maxLabel = labels[maxIndex] || `item ${maxIndex + 1}`;
          description += `. Total: ${total}, highest value: ${max} for ${maxLabel}`;
        }
        break;

      case "pie":
      case "doughnut":
        if (dataPoints.length > 0) {
          const total = dataPoints.reduce((sum, val) => sum + val, 0);
          const percentages = dataPoints.map((val) =>
            Math.round((val / total) * 100),
          );
          const segments = percentages.map(
            (pct, i) => `${labels[i] || `segment ${i + 1}`}: ${pct}%`,
          );
          description += `. Distribution: ${segments.join(", ")}`;
        }
        break;

      case "radar":
        if (dataPoints.length > 0) {
          const avg =
            dataPoints.reduce((sum, val) => sum + val, 0) / dataPoints.length;
          description += `. Average score: ${Math.round(avg)}`;

          // Find highest and lowest scores
          const max = Math.max(...dataPoints);
          const min = Math.min(...dataPoints);
          const maxIndex = dataPoints.indexOf(max);
          const minIndex = dataPoints.indexOf(min);

          description += `. Highest: ${labels[maxIndex]} (${max}), Lowest: ${labels[minIndex]} (${min})`;
        }
        break;
    }

    return description;
  }

  createDataTable(chartCanvas, chartInfo) {
    if (!this.options.enableDataTables || !chartInfo.data) {
      return;
    }

    const { id, data, container, title } = chartInfo;
    const tableId = `${id}-data-table`;

    // Check if table already exists
    if (document.getElementById(tableId)) {
      return;
    }

    const table = document.createElement("table");
    table.id = tableId;
    table.className = "chart-data-table sr-only";
    table.setAttribute("aria-label", `Data table for ${title}`);

    // Create table structure
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Create header row
    const headerRow = document.createElement("tr");

    if (data.labels && data.labels.length > 0) {
      // Multi-column layout (labels as rows, datasets as columns)
      const labelHeader = document.createElement("th");
      labelHeader.scope = "col";
      labelHeader.textContent = "Category";
      headerRow.appendChild(labelHeader);

      data.datasets.forEach((dataset) => {
        const datasetHeader = document.createElement("th");
        datasetHeader.scope = "col";
        datasetHeader.textContent = dataset.label || "Value";
        headerRow.appendChild(datasetHeader);
      });

      thead.appendChild(headerRow);

      // Create data rows
      data.labels.forEach((label, index) => {
        const row = document.createElement("tr");

        const labelCell = document.createElement("th");
        labelCell.scope = "row";
        labelCell.textContent = label;
        row.appendChild(labelCell);

        data.datasets.forEach((dataset) => {
          const valueCell = document.createElement("td");
          const value = dataset.data[index];
          valueCell.textContent =
            typeof value === "number" ? value.toLocaleString() : value;
          row.appendChild(valueCell);
        });

        tbody.appendChild(row);
      });
    }

    table.appendChild(thead);
    table.appendChild(tbody);

    // Add table to DOM
    const tableContainer = document.createElement("div");
    tableContainer.className = "chart-data-table-container sr-only";
    tableContainer.appendChild(table);

    if (container) {
      container.appendChild(tableContainer);
    } else {
      chartCanvas.parentNode.appendChild(tableContainer);
    }

    // Create toggle button for sighted users
    this.createTableToggle(chartCanvas, tableContainer, title);
  }

  createTableToggle(chartCanvas, tableContainer, _title) {
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "chart-table-toggle btn btn-secondary btn-sm";
    toggleBtn.textContent = "View Data Table";
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.setAttribute(
      "aria-controls",
      tableContainer.querySelector("table").id,
    );

    let isVisible = false;

    toggleBtn.addEventListener("click", () => {
      isVisible = !isVisible;

      if (isVisible) {
        tableContainer.classList.remove("sr-only");
        toggleBtn.textContent = "Hide Data Table";
        toggleBtn.setAttribute("aria-expanded", "true");
      } else {
        tableContainer.classList.add("sr-only");
        toggleBtn.textContent = "View Data Table";
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Insert toggle button after the chart
    const chartContainer =
      chartCanvas.closest(".chart-container") || chartCanvas.parentNode;
    if (chartContainer) {
      chartContainer.appendChild(toggleBtn);
    }
  }

  addKeyboardNavigation(chartCanvas, chartInfo) {
    if (!this.options.enableKeyboardNavigation) {
      return;
    }

    chartCanvas.addEventListener("keydown", (e) => {
      const { instance } = chartInfo;
      if (!instance) {
        return;
      }

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          this.announceChartSummary(chartInfo);
          break;

        case "ArrowRight":
        case "ArrowLeft":
          e.preventDefault();
          this.navigateChartData(chartInfo, e.key === "ArrowRight" ? 1 : -1);
          break;

        case "Home":
          e.preventDefault();
          this.navigateChartData(chartInfo, "first");
          break;

        case "End":
          e.preventDefault();
          this.navigateChartData(chartInfo, "last");
          break;
      }
    });

    // Add help text
    const helpText = document.createElement("div");
    helpText.className = "chart-help-text sr-only";
    helpText.textContent =
      "Press Enter for summary, arrow keys to navigate data points, Home/End to go to first/last point";
    chartCanvas.parentNode.appendChild(helpText);
  }

  navigateChartData(chartInfo, direction) {
    const { instance, data } = chartInfo;
    if (!instance || !data || !data.datasets || data.datasets.length === 0) {
      return;
    }

    const dataset = data.datasets[0];
    const dataPoints = dataset.data || [];
    const labels = data.labels || [];

    if (dataPoints.length === 0) {
      return;
    }

    let currentIndex = chartInfo.currentDataIndex || 0;

    switch (direction) {
      case 1: // Right arrow
        currentIndex = Math.min(currentIndex + 1, dataPoints.length - 1);
        break;
      case -1: // Left arrow
        currentIndex = Math.max(currentIndex - 1, 0);
        break;
      case "first":
        currentIndex = 0;
        break;
      case "last":
        currentIndex = dataPoints.length - 1;
        break;
    }

    chartInfo.currentDataIndex = currentIndex;

    // Announce current data point
    const label = labels[currentIndex] || `Point ${currentIndex + 1}`;
    const value = dataPoints[currentIndex];
    const announcement = `${label}: ${value}`;

    this.announceToScreenReader(announcement);

    // Highlight data point if possible (Chart.js specific)
    if (instance.setActiveElements) {
      instance.setActiveElements([
        {
          datasetIndex: 0,
          index: currentIndex,
        },
      ]);
      instance.update();
    }
  }

  addScreenReaderSupport(chartCanvas, chartInfo) {
    if (!this.options.enableScreenReaderAnnouncements) {
      return;
    }

    // Add live region for announcements
    const liveRegion = document.createElement("div");
    liveRegion.id = `${chartInfo.id}-live`;
    liveRegion.className = "sr-only";
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");

    chartCanvas.parentNode.appendChild(liveRegion);
    chartInfo.liveRegion = liveRegion;
  }

  addSummaryDescription(chartCanvas, chartInfo) {
    if (!this.options.enableSummaryDescriptions) {
      return;
    }

    const descriptionId = `${chartInfo.id}-description`;

    // Check if description already exists
    if (document.getElementById(descriptionId)) {
      return;
    }

    const description = document.createElement("div");
    description.id = descriptionId;
    description.className = "chart-description sr-only";

    // Generate detailed description
    description.textContent = this.generateDetailedDescription(chartInfo);

    chartCanvas.parentNode.appendChild(description);
  }

  generateDetailedDescription(chartInfo) {
    const { title, type, data } = chartInfo;

    let description = `This is a ${type} chart titled "${title}". `;

    if (data && data.datasets && data.datasets.length > 0) {
      const dataset = data.datasets[0];
      const dataPoints = dataset.data || [];
      // const labels = data.labels || []; // Unused but kept for potential future use

      description += `It contains ${dataPoints.length} data points. `;

      if (dataPoints.length > 0) {
        description += `The data ranges from ${Math.min(...dataPoints)} to ${Math.max(...dataPoints)}. `;

        if (type === "line") {
          const trend = this.calculateTrend(dataPoints);
          description += `The overall trend is ${trend}. `;
        }

        description +=
          "Use arrow keys to navigate through individual data points. ";
      }
    }

    description +=
      "Press Enter to hear a summary, or use the View Data Table button for detailed information.";

    return description;
  }

  calculateTrend(dataPoints) {
    if (dataPoints.length < 2) {
      return "stable";
    }

    const first = dataPoints[0];
    const last = dataPoints[dataPoints.length - 1];
    const change = ((last - first) / first) * 100;

    if (Math.abs(change) < 5) {
      return "stable";
    }
    return change > 0 ? "increasing" : "decreasing";
  }

  setupGlobalKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      // Alt + C to cycle through charts
      if (e.altKey && e.key === "c") {
        e.preventDefault();
        this.cycleToNextChart();
      }
    });
  }

  cycleToNextChart() {
    const chartCanvases = Array.from(this.charts.keys());
    if (chartCanvases.length === 0) {
      return;
    }

    const currentActive = document.activeElement;
    let currentIndex = chartCanvases.indexOf(currentActive);

    if (currentIndex === -1) {
      currentIndex = 0;
    } else {
      currentIndex = (currentIndex + 1) % chartCanvases.length;
    }

    const nextChart = chartCanvases[currentIndex];
    nextChart.focus();

    const chartInfo = this.charts.get(nextChart);
    this.announceToScreenReader(`Focused on ${chartInfo.title}`);
  }

  announceChartSummary(chartInfo) {
    const summary = this.generateChartDescription(chartInfo);
    this.announceToScreenReader(summary);
  }

  announceToScreenReader(message) {
    if (!this.options.enableScreenReaderAnnouncements) {
      return;
    }

    // Try to use existing live region first
    let liveRegion = document.querySelector('[aria-live="polite"]');

    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.className = "sr-only";
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      document.body.appendChild(liveRegion);
    }

    // Clear and set new message
    liveRegion.textContent = "";
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);

    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = "";
    }, 5000);
  }

  // Public methods
  updateChart(chartCanvas) {
    const chartInfo = this.charts.get(chartCanvas);
    if (chartInfo) {
      // Re-analyze chart data
      const updatedInfo = this.analyzeChart(chartCanvas);
      this.charts.set(chartCanvas, { ...chartInfo, ...updatedInfo });

      // Update aria-label
      this.addAriaLabels(chartCanvas, this.charts.get(chartCanvas));
    }
  }

  removeChart(chartCanvas) {
    this.charts.delete(chartCanvas);

    // Clean up associated elements
    const relatedElements = chartCanvas.parentNode.querySelectorAll(
      `#${chartCanvas.id}-description, #${chartCanvas.id}-data-table, #${chartCanvas.id}-live`,
    );
    relatedElements.forEach((el) => el.remove());
  }

  getChartInfo(chartCanvas) {
    return this.charts.get(chartCanvas);
  }

  getAllCharts() {
    return Array.from(this.charts.keys());
  }
}

// Auto-initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  window.chartAccessibility = new UniversalChartAccessibility();
});

// Export for module usage
export { UniversalChartAccessibility };
