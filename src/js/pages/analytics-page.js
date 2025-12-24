// Analytics Page JavaScript
// Fetches real analytics data from backend and renders charts

import { apiClient } from "../api-client.js";
import { API_ENDPOINTS } from "../../api-config.js";
import { authManager } from "../../auth-manager.js";
import { errorHandler } from "../utils/unified-error-handler.js";

import { logger } from '../../logger.js';

class AnalyticsPage {
  constructor() {
    this.charts = {};
    this.init();
  }

  async init() {
    // Wait for DOM and Chart.js to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.initializeCharts();
      });
    } else {
      this.initializeCharts();
    }
  }

  async initializeCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === "undefined") {
      logger.error("Chart.js not loaded");
      return;
    }

    logger.info("🚀 Initializing FlagFit Pro Analytics Dashboard...");

    // Check authentication
    if (!authManager.requireAuth()) {
      logger.error("User not authenticated");
      return;
    }

    try {
      // Load all analytics data
      await this.loadAnalyticsData();

      // Initialize all charts
      setTimeout(() => {
        this.initPerformanceTrendsChart();
        this.initTeamChemistryChart();
        this.initTrainingDistributionChart();
        this.initPositionPerformanceChart();
        this.initOlympicProgressChart();
        this.initInjuryRiskChart();
        this.initSpeedDevelopmentChart();
        this.initEngagementFunnelChart();
        logger.info("✅ All charts initialized successfully!");
      }, 100);
    } catch (error) {
      logger.error("Error loading analytics data:", error);
      // Fallback to hardcoded data
      this.loadFallbackData();
    }
  }

  async loadAnalyticsData() {
    const user = authManager.getCurrentUser();
    if (!user || !user.id) {
      throw new Error("User not authenticated");
    }

    try {
      // Load analytics summary for metrics
      const summaryResponse = await apiClient.get(
        API_ENDPOINTS.analytics.summary,
        { userId: user.id },
      );

      if (summaryResponse.success && summaryResponse.data) {
        this.analyticsData = summaryResponse.data;
        this.updateMetricsDisplay();
      }

      // Load individual analytics
      const [
        performanceTrends,
        teamChemistry,
        trainingDistribution,
        positionPerformance,
        speedDevelopment,
      ] = await Promise.all([
        apiClient.get(API_ENDPOINTS.analytics.performanceTrends, {
          userId: user.id,
          weeks: 7,
        }),
        apiClient.get(API_ENDPOINTS.analytics.teamChemistry, {
          userId: user.id,
        }),
        apiClient.get(API_ENDPOINTS.analytics.trainingDistribution, {
          userId: user.id,
          period: "30days",
        }),
        apiClient.get(API_ENDPOINTS.analytics.positionPerformance, {
          userId: user.id,
        }),
        apiClient.get(API_ENDPOINTS.analytics.speedDevelopment, {
          userId: user.id,
          weeks: 7,
        }),
      ]);

      // Store data for chart initialization
      this.chartData = {
        performanceTrends: performanceTrends.success
          ? performanceTrends.data
          : null,
        teamChemistry: teamChemistry.success ? teamChemistry.data : null,
        trainingDistribution: trainingDistribution.success
          ? trainingDistribution.data
          : null,
        positionPerformance: positionPerformance.success
          ? positionPerformance.data
          : null,
        speedDevelopment: speedDevelopment.success
          ? speedDevelopment.data
          : null,
      };
    } catch (error) {
      logger.error("Error fetching analytics data:", error);
      throw error;
    }
  }

  updateMetricsDisplay() {
    if (!this.analyticsData || !this.analyticsData.metrics) {
      return;
    }

    const metrics = this.analyticsData.metrics;
    const metricCards = document.querySelectorAll(".metric-card");

    metrics.forEach((metric, index) => {
      if (metricCards[index]) {
        const valueEl = metricCards[index].querySelector(".metric-value");
        const labelEl = metricCards[index].querySelector(".metric-label");
        const trendEl = metricCards[index].querySelector(".metric-trend");

        if (valueEl) {
          valueEl.textContent = metric.value;
        }
        if (labelEl) {
          labelEl.textContent = metric.label;
        }
        if (trendEl) {
          trendEl.textContent = metric.trend;
          trendEl.className = `metric-trend trend-${metric.trendType}`;
        }
      }
    });
  }

  initPerformanceTrendsChart() {
    const ctx = document.getElementById("performanceTrendsChart");
    if (!ctx) {
      return;
    }

    const data = this.chartData?.performanceTrends || {
      labels: [
        "Week 1",
        "Week 2",
        "Week 3",
        "Week 4",
        "Week 5",
        "Week 6",
        "Week 7",
      ],
      values: [78, 82, 85, 79, 88, 91, 87],
    };

    this.charts.performanceTrends = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Performance Score",
            data: data.values,
            borderColor: "var(--primary-500)",
            backgroundColor: "rgba(8, 153, 73, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100 },
        },
      },
    });

    // Update insights
    if (data.currentScore !== undefined) {
      const insightValue = document
        .querySelector("#performanceTrendsChart")
        .closest(".chart-card")
        ?.querySelector(".insight-item .insight-value");
      if (insightValue) {
        insightValue.textContent = data.currentScore;
      }
    }
  }

  initTeamChemistryChart() {
    const ctx = document.getElementById("teamChemistryChart");
    if (!ctx) {
      return;
    }

    const data = this.chartData?.teamChemistry || {
      labels: [
        "Communication",
        "Coordination",
        "Trust",
        "Cohesion",
        "Leadership",
        "Adaptability",
      ],
      values: [8.4, 9.1, 7.5, 8.8, 9.2, 8.0],
    };

    this.charts.teamChemistry = new Chart(ctx, {
      type: "radar",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Team Chemistry",
            data: data.values,
            borderColor: "var(--primary-500)",
            backgroundColor: "rgba(16, 201, 107, 0.2)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: { beginAtZero: true, max: 10 },
        },
      },
    });

    // Update insights
    if (data.overall !== undefined) {
      const chartCard = document
        .querySelector("#teamChemistryChart")
        .closest(".chart-card");
      const overallValue = chartCard?.querySelector(
        ".insight-item .insight-value",
      );
      if (overallValue) {
        overallValue.textContent = data.overall.toFixed(1);
      }
    }
  }

  initTrainingDistributionChart() {
    const ctx = document.getElementById("trainingDistributionChart");
    if (!ctx) {
      return;
    }

    const data = this.chartData?.trainingDistribution || {
      labels: [
        "Speed Training",
        "Strength",
        "Agility",
        "Endurance",
        "Technique",
      ],
      values: [25, 20, 22, 18, 15],
    };

    this.charts.trainingDistribution = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              "var(--primary-500)",
              "var(--primary-500)",
              "var(--tertiary-500)",
              "var(--error-500)",
              "var(--primary-500)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    // Update insights
    if (data.agilitySessions !== undefined) {
      const chartCard = document
        .querySelector("#trainingDistributionChart")
        .closest(".chart-card");
      const agilityValue = chartCard?.querySelectorAll(
        ".insight-item .insight-value",
      )[0];
      const speedValue = chartCard?.querySelectorAll(
        ".insight-item .insight-value",
      )[1];
      const technicalValue = chartCard?.querySelectorAll(
        ".insight-item .insight-value",
      )[2];

      if (agilityValue) {
        agilityValue.textContent = data.agilitySessions;
      }
      if (speedValue) {
        speedValue.textContent = data.speedSessions;
      }
      if (technicalValue) {
        technicalValue.textContent = data.technicalSessions;
      }
    }
  }

  initPositionPerformanceChart() {
    const ctx = document.getElementById("positionPerformanceChart");
    if (!ctx) {
      return;
    }

    const data = this.chartData?.positionPerformance || {
      labels: ["QB", "WR", "RB", "DB", "Rusher"],
      values: [94, 91, 89, 87, 85],
    };

    this.charts.positionPerformance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Performance Score",
            data: data.values,
            backgroundColor: [
              "var(--primary-500)",
              "var(--primary-500)",
              "var(--tertiary-500)",
              "var(--error-500)",
              "var(--primary-500)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 100 },
        },
      },
    });

    // Update insights with top performers
    if (data.topPerformers && data.topPerformers.length > 0) {
      const chartCard = document
        .querySelector("#positionPerformanceChart")
        .closest(".chart-card");
      const insightValues = chartCard?.querySelectorAll(
        ".insight-item .insight-value",
      );
      const insightLabels = chartCard?.querySelectorAll(
        ".insight-item .insight-label",
      );

      data.topPerformers.slice(0, 3).forEach((performer, index) => {
        if (insightValues[index]) {
          insightValues[index].textContent = performer.score;
        }
        if (insightLabels[index]) {
          insightLabels[index].textContent = performer.name;
        }
      });
    }
  }

  initOlympicProgressChart() {
    const ctx = document.getElementById("olympicProgressChart");
    if (!ctx) {
      return;
    }

    // This would come from analytics summary
    const progress =
      this.analyticsData?.metrics?.find(
        (m) => m.label === "Olympic Qualification",
      )?.value || "73%";
    const progressValue = parseInt(progress.replace("%", ""));

    this.charts.olympicProgress = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Qualified", "Remaining"],
        datasets: [
          {
            data: [progressValue, 100 - progressValue],
            backgroundColor: ["var(--primary-500)", "#E5E7EB"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  initInjuryRiskChart() {
    const ctx = document.getElementById("injuryRiskChart");
    if (!ctx) {
      return;
    }

    // Default values - would come from analytics endpoint
    this.charts.injuryRisk = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Low Risk", "Medium Risk", "High Risk"],
        datasets: [
          {
            data: [60, 30, 10],
            backgroundColor: [
              "var(--primary-500)",
              "var(--tertiary-500)",
              "var(--error-500)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  initSpeedDevelopmentChart() {
    const ctx = document.getElementById("speedDevelopmentChart");
    if (!ctx) {
      return;
    }

    const data = this.chartData?.speedDevelopment || {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
      datasets: [
        { label: "40-yard Dash", data: [5.2, 5.1, 4.9, 4.8, 4.7, 4.52] },
        { label: "10-yard Split", data: [1.8, 1.75, 1.7, 1.68, 1.65, 1.62] },
      ],
    };

    this.charts.speedDevelopment = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: data.datasets.map((ds) => ({
          ...ds,
          borderColor: ds.label.includes("40")
            ? "var(--primary-500)"
            : "var(--primary-500)",
          tension: 0.4,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: false, min: 1.5, max: 5.5 },
        },
      },
    });

    // Update insights
    if (data.best40Yard !== undefined) {
      const chartCard = document
        .querySelector("#speedDevelopmentChart")
        .closest(".chart-card");
      const best40Value = chartCard?.querySelectorAll(
        ".insight-item .insight-value",
      )[0];
      const best10Value = chartCard?.querySelectorAll(
        ".insight-item .insight-value",
      )[1];
      const improvementValue = chartCard?.querySelectorAll(
        ".insight-item .insight-value",
      )[2];

      if (best40Value) {
        best40Value.textContent = `${data.best40Yard}s`;
      }
      if (best10Value) {
        best10Value.textContent = `${data.best10Yard}s`;
      }
      if (improvementValue) {
        improvementValue.textContent = `-${data.improvement}s`;
      }
    }
  }

  initEngagementFunnelChart() {
    const ctx = document.getElementById("engagementFunnelChart");
    if (!ctx) {
      return;
    }

    // Default values - would come from analytics endpoint
    this.charts.engagementFunnel = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "App Opens",
          "Training Started",
          "Session Completed",
          "Goals Set",
          "Goals Achieved",
        ],
        datasets: [
          {
            label: "Users",
            data: [1000, 780, 680, 450, 320],
            backgroundColor: "var(--primary-500)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        scales: {
          x: { beginAtZero: true },
        },
      },
    });
  }

  loadFallbackData() {
    // Fallback to hardcoded data if API fails
    this.chartData = {
      performanceTrends: {
        labels: [
          "Week 1",
          "Week 2",
          "Week 3",
          "Week 4",
          "Week 5",
          "Week 6",
          "Week 7",
        ],
        values: [78, 82, 85, 79, 88, 91, 87],
      },
      teamChemistry: {
        labels: [
          "Communication",
          "Coordination",
          "Trust",
          "Cohesion",
          "Leadership",
          "Adaptability",
        ],
        values: [8.4, 9.1, 7.5, 8.8, 9.2, 8.0],
      },
      trainingDistribution: {
        labels: [
          "Speed Training",
          "Strength",
          "Agility",
          "Endurance",
          "Technique",
        ],
        values: [25, 20, 22, 18, 15],
      },
      positionPerformance: {
        labels: ["QB", "WR", "RB", "DB", "Rusher"],
        values: [94, 91, 89, 87, 85],
      },
      speedDevelopment: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
        datasets: [
          { label: "40-yard Dash", data: [5.2, 5.1, 4.9, 4.8, 4.7, 4.52] },
          { label: "10-yard Split", data: [1.8, 1.75, 1.7, 1.68, 1.65, 1.62] },
        ],
      },
    };
  }
}

// Initialize analytics page
if (document.getElementById("performanceTrendsChart")) {
  window.analyticsPage = new AnalyticsPage();
}

// Make functions globally available for onclick handlers
window.toggleSidebar = function () {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const toggleBtn = document.getElementById("mobile-menu-toggle");

  if (!sidebar) {
    return;
  }

  const isOpen =
    sidebar.classList.contains("open") ||
    sidebar.classList.contains("mobile-open");

  if (isOpen) {
    sidebar.classList.remove("open", "mobile-open");
    if (overlay) {
      overlay.classList.remove("active");
    }
    document.body.classList.remove("sidebar-open", "menu-open");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", "false");
    }
    if (toggleBtn) {
      toggleBtn.focus();
    }
  } else {
    sidebar.classList.add("open", "mobile-open");
    if (overlay) {
      overlay.classList.add("active");
    }
    document.body.classList.add("sidebar-open", "menu-open");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-expanded", "true");
    }
    const firstNavItem = sidebar.querySelector(".nav-item");
    if (firstNavItem) {
      firstNavItem.focus();
    }
  }
};

window.closeMenu = function () {
  window.toggleSidebar();
};
