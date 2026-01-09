// Enhanced Chart Configuration with Modern Design & UX Improvements
// Provides comprehensive chart configurations with smooth curves, tooltips, gradients, interactive legends, and accessibility

export class EnhancedChartConfig {
  constructor() {
    this.theme = this.detectTheme();
    this.colors = this.getColorPalette();
    this.fontFamily = this.getFontFamily();
  }

  detectTheme() {
    const body = document.body || document.documentElement;
    return body.getAttribute("data-theme") || body.classList.contains("dark")
      ? "dark"
      : "light";
  }

  getFontFamily() {
    // Use consistent font stack across the app
    return "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif";
  }

  getColorPalette() {
    const isDark = this.theme === "dark";

    return {
      // Semantic colors for wellness metrics
      sleep: isDark ? "rgba(99, 102, 241, 1)" : "rgba(99, 102, 241, 1)", // Blue - calm
      energy: isDark ? "rgba(245, 158, 11, 1)" : "rgba(245, 158, 11, 1)", // Orange - energetic
      soreness: isDark ? "rgba(239, 68, 68, 1)" : "rgba(239, 68, 68, 1)", // Red - negative
      stress: isDark ? "rgba(236, 72, 153, 1)" : "rgba(236, 72, 153, 1)", // Pink - stress
      nutrition: isDark ? "rgba(16, 185, 129, 1)" : "rgba(16, 185, 129, 1)", // Green - positive
      hydration: isDark ? "rgba(59, 130, 246, 1)" : "rgba(59, 130, 246, 1)", // Blue - water

      // Performance metrics
      overall: isDark ? "rgba(99, 102, 241, 1)" : "rgba(99, 102, 241, 1)", // Purple
      speed: isDark ? "rgba(239, 68, 68, 1)" : "rgba(239, 68, 68, 1)", // Red
      agility: isDark ? "rgba(245, 158, 11, 1)" : "rgba(245, 158, 11, 1)", // Orange
      strength: isDark ? "rgba(16, 185, 129, 1)" : "rgba(16, 185, 129, 1)", // Green
      endurance: isDark ? "rgba(139, 92, 246, 1)" : "rgba(139, 92, 246, 1)", // Purple

      // Background colors
      grid: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
      text: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
      textSecondary: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
      tooltipBg: isDark ? "rgba(0, 0, 0, 0.95)" : "rgba(255, 255, 255, 0.98)",
      tooltipBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    };
  }

  // Get enhanced tooltip configuration
  getTooltipConfig() {
    return {
      enabled: true,
      mode: "index",
      intersect: false,
      backgroundColor: this.colors.tooltipBg,
      titleColor: this.colors.text,
      bodyColor: this.colors.text,
      borderColor: this.colors.tooltipBorder,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 12,
      displayColors: true,
      titleFont: {
        family: this.fontFamily,
        size: 14,
        weight: "700",
        lineHeight: 1.4,
      },
      bodyFont: {
        family: this.fontFamily,
        size: 13,
        weight: "500",
        lineHeight: 1.4,
      },
      callbacks: {
        title: (context) => {
          return new Date(context[0].label).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        },
        label: (context) => {
          const label = context.dataset.label || "";
          const value = context.parsed.y;
          return `${label}: ${value.toFixed(1)}`;
        },
      },
      animation: {
        duration: 200,
      },
      boxPadding: 8,
    };
  }

  // Get enhanced legend configuration
  getLegendConfig(containerId = null) {
    return {
      display: !containerId, // Hide default legend if custom container provided
      position: "bottom",
      align: "center",
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
        padding: 16,
        font: {
          family: this.fontFamily,
          size: 13,
          weight: "600",
        },
        color: this.colors.text,
        generateLabels: (chart) => {
          const original = Chart.defaults.plugins.legend.labels.generateLabels;
          const labels = original.call(this, chart);
          return labels.map((label) => ({
            ...label,
            fillStyle: label.strokeStyle,
            strokeStyle: label.strokeStyle,
          }));
        },
      },
      onClick: (e, legendItem, legend) => {
        // Toggle dataset visibility
        const index = legendItem.datasetIndex;
        const { chart } = legend;
        const meta = chart.getDatasetMeta(index);

        meta.hidden =
          meta.hidden === null ? !chart.data.datasets[index].hidden : null;
        chart.update();

        // Update custom legend if exists
        if (containerId) {
          this.updateCustomLegend(chart, containerId);
        }
      },
    };
  }

  // Create custom interactive legend
  createCustomLegend(chart, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    container.textContent = "";
    const { datasets } = chart.data;

    datasets.forEach((dataset, index) => {
      const meta = chart.getDatasetMeta(index);
      const isHidden = meta.hidden;

      const legendItem = document.createElement("div");
      legendItem.className = `chart-legend-item ${isHidden ? "hidden" : ""}`;
      legendItem.setAttribute("data-dataset-index", index);

      const colorBox = document.createElement("div");
      colorBox.className = "chart-legend-color";
      colorBox.style.backgroundColor =
        dataset.borderColor || dataset.backgroundColor;

      const label = document.createElement("span");
      label.className = "chart-legend-label";
      label.textContent = dataset.label;

      legendItem.appendChild(colorBox);
      legendItem.appendChild(label);

      legendItem.addEventListener("click", () => {
        meta.hidden = !meta.hidden;
        chart.update();
        this.updateCustomLegend(chart, containerId);
      });

      container.appendChild(legendItem);
    });
  }

  // Update custom legend state
  updateCustomLegend(chart, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    const items = container.querySelectorAll(".chart-legend-item");
    items.forEach((item, index) => {
      const meta = chart.getDatasetMeta(index);
      if (meta.hidden) {
        item.classList.add("hidden");
      } else {
        item.classList.remove("hidden");
      }
    });
  }

  // Get enhanced scale configuration
  getScaleConfig(type = "y", options = {}) {
    const baseConfig = {
      grid: {
        color: this.colors.grid,
        lineWidth: 1,
        drawBorder: false,
        drawOnChartArea: true,
      },
      ticks: {
        color: this.colors.textSecondary,
        font: {
          family: this.fontFamily,
          size: 12,
          weight: "500",
        },
        padding: 8,
        callback: (value) => {
          if (type === "y" && options.max === 10) {
            return value.toFixed(0);
          }
          return value;
        },
      },
      title: {
        display: options.title || false,
        text: options.titleText || "",
        color: this.colors.text,
        font: {
          family: this.fontFamily,
          size: 13,
          weight: "600",
        },
        padding: {
          top: 8,
          bottom: 8,
        },
      },
    };

    if (type === "x") {
      return {
        ...baseConfig,
        grid: {
          ...baseConfig.grid,
          display: false,
        },
        ticks: {
          ...baseConfig.ticks,
          maxRotation: 45,
          minRotation: 0,
        },
      };
    }

    return baseConfig;
  }

  // Get dataset configuration with gradients and smooth curves
  getDatasetConfig(label, data, color, options = {}) {
    const isDark = this.theme === "dark";
    const baseColor =
      typeof color === "string" ? color : color.color || this.colors.overall;

    // Create gradient if fill is enabled
    let backgroundColor = baseColor;
    if (options.fill !== false) {
      backgroundColor = (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(
          0,
          0,
          0,
          ctx.chart.height,
        );
        const alpha = isDark ? 0.15 : 0.1;
        gradient.addColorStop(0, baseColor.replace("1)", `${alpha})`));
        gradient.addColorStop(1, baseColor.replace("1)", "0)"));
        return gradient;
      };
    }

    return {
      label,
      data,
      borderColor: baseColor,
      backgroundColor,
      borderWidth: options.borderWidth || 3,
      fill: options.fill !== false,
      tension: options.tension !== undefined ? options.tension : 0.4, // Smooth curves
      pointRadius: options.pointRadius !== undefined ? options.pointRadius : 4,
      pointHoverRadius:
        options.pointHoverRadius !== undefined ? options.pointHoverRadius : 6,
      pointBackgroundColor: baseColor,
      pointBorderColor: isDark ? "#1a1a1a" : "#ffffff",
      pointBorderWidth: 2,
      pointHoverBackgroundColor: baseColor,
      pointHoverBorderColor: isDark ? "#ffffff" : "#1a1a1a",
      pointHoverBorderWidth: 3,
      cubicInterpolationMode: "monotone", // Smooth interpolation
      spanGaps: true,
      ...options,
    };
  }

  // Get performance trends chart configuration
  getPerformanceTrendsConfig(data, _timeframe = "6m") {
    return {
      type: "line",
      data: {
        labels: data.dates.map((date) => new Date(date).toLocaleDateString()),
        datasets: [
          this.getDatasetConfig("Overall", data.overall, this.colors.overall, {
            fill: true,
          }),
          this.getDatasetConfig("Speed", data.speed, this.colors.speed),
          this.getDatasetConfig("Agility", data.agility, this.colors.agility),
          this.getDatasetConfig(
            "Strength",
            data.strength,
            this.colors.strength,
          ),
          this.getDatasetConfig(
            "Endurance",
            data.endurance,
            this.colors.endurance,
          ),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          tooltip: this.getTooltipConfig(),
          legend: this.getLegendConfig("performance-legend-container"),
        },
        scales: {
          y: {
            ...this.getScaleConfig("y", {
              title: true,
              titleText: "Performance Score",
            }),
            beginAtZero: true,
            max: 100,
            ticks: {
              ...this.getScaleConfig("y").ticks,
              stepSize: 10,
            },
          },
          x: this.getScaleConfig("x"),
        },
        animation: {
          duration: 1000,
          easing: "easeInOutQuart",
        },
        transitions: {
          show: {
            animations: {
              x: { from: 0 },
              y: { from: 0 },
            },
          },
          hide: {
            animations: {
              x: { to: 0 },
              y: { to: 0 },
            },
          },
        },
      },
    };
  }

  // Get wellness chart configuration
  getWellnessChartConfig(data, _timeframe = "30d") {
    return {
      type: "line",
      data: {
        labels: data.dates.map((date) => new Date(date).toLocaleDateString()),
        datasets: [
          this.getDatasetConfig("Sleep (hrs)", data.sleep, this.colors.sleep, {
            yAxisID: "y",
            fill: true,
            pointRadius: 3,
          }),
          this.getDatasetConfig(
            "Energy (1-10)",
            data.energy,
            this.colors.energy,
            {
              yAxisID: "y1",
              pointRadius: 3,
            },
          ),
          this.getDatasetConfig(
            "Soreness (1-5)",
            data.soreness,
            this.colors.soreness,
            {
              yAxisID: "y1",
              pointRadius: 3,
            },
          ),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          tooltip: this.getTooltipConfig(),
          legend: this.getLegendConfig("wellness-legend-container"),
        },
        scales: {
          y: {
            ...this.getScaleConfig("y", {
              title: true,
              titleText: "Hours",
            }),
            type: "linear",
            position: "left",
            beginAtZero: true,
            max: 12,
            ticks: {
              ...this.getScaleConfig("y").ticks,
              stepSize: 2,
            },
          },
          y1: {
            ...this.getScaleConfig("y", {
              title: true,
              titleText: "Scale (1-10)",
            }),
            type: "linear",
            position: "right",
            beginAtZero: true,
            max: 10,
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              ...this.getScaleConfig("y").ticks,
              stepSize: 1,
            },
          },
          x: this.getScaleConfig("x"),
        },
        animation: {
          duration: 1000,
          easing: "easeInOutQuart",
        },
        transitions: {
          show: {
            animations: {
              x: { from: 0 },
              y: { from: 0 },
            },
          },
          hide: {
            animations: {
              x: { to: 0 },
              y: { to: 0 },
            },
          },
        },
      },
    };
  }

  // Update theme and refresh colors
  updateTheme() {
    this.theme = this.detectTheme();
    this.colors = this.getColorPalette();
  }
}

// Export singleton instance
export const enhancedChartConfig = new EnhancedChartConfig();
