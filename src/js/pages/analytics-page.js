/* eslint-disable no-console */
// Analytics Page JavaScript
// Fetches real analytics data from backend and renders charts

import { apiClient } from "../../api-client.js";
import { API_ENDPOINTS } from "../../api-config.js";
import { authManager } from "../../auth-manager.js";
import { errorHandler } from "../utils/unified-error-handler.js";

class AnalyticsPage {
  constructor() {
    this.charts = {};
    this.init();
  }

  async init() {
    // Wait for DOM and Chart.js to be ready
    await this.waitForChartJS();
    
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.initializeCharts();
      });
    } else {
      this.initializeCharts();
    }
  }

  /**
   * Wait for Chart.js to be available
   * Retries up to 10 times with 100ms delay between attempts
   */
  async waitForChartJS(maxAttempts = 10, delay = 100) {
    for (let i = 0; i < maxAttempts; i++) {
      if (typeof Chart !== "undefined") {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // If Chart.js still not loaded, log error and return false
    if (typeof Chart === "undefined") {
      console.error("Chart.js not loaded after waiting. Please ensure Chart.js is loaded before analytics-page.js");
      return false;
    }
    return true;
  }

  async initializeCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === "undefined") {
      console.error("Chart.js not loaded");
      return;
    }

    console.log("🚀 Initializing FlagFit Pro Analytics Dashboard...");

    // Check authentication
    if (!authManager.requireAuth()) {
      console.error("User not authenticated");
      return;
    }

    try {
      // Load all analytics data
      await this.loadAnalyticsData();

      // Initialize charts progressively using requestAnimationFrame for better performance
      const charts = [
        'PerformanceTrends',
        'TeamChemistry',
        'TrainingDistribution',
        'PositionPerformance',
        'OlympicProgress',
        'InjuryRisk',
        'SpeedDevelopment',
        'EngagementFunnel'
      ];

      // Initialize charts one by one in animation frames
      charts.forEach((chart, index) => {
        requestAnimationFrame(() => {
          try {
            this[`init${chart}Chart`]();
          } catch (error) {
            console.error(`Error initializing ${chart} chart:`, error);
          }
        });
      });

      console.log("✅ All charts initialized successfully!");
    } catch (error) {
      console.error("Error loading analytics data:", error);
      // Don't load fallback data for authenticated users - show empty state instead
      this.showEmptyState();
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
        { userId: user.id }
      );

      if (summaryResponse.success && summaryResponse.data) {
        this.analyticsData = summaryResponse.data;
        this.updateMetricsDisplay();
      }

      // Load individual analytics
      const [performanceTrends, teamChemistry, trainingDistribution, positionPerformance, speedDevelopment] = await Promise.all([
        apiClient.get(API_ENDPOINTS.analytics.performanceTrends, { userId: user.id, weeks: 7 }),
        apiClient.get(API_ENDPOINTS.analytics.teamChemistry, { userId: user.id }),
        apiClient.get(API_ENDPOINTS.analytics.trainingDistribution, { userId: user.id, period: "30days" }),
        apiClient.get(API_ENDPOINTS.analytics.positionPerformance, { userId: user.id }),
        apiClient.get(API_ENDPOINTS.analytics.speedDevelopment, { userId: user.id, weeks: 7 }),
      ]);

      // Store data for chart initialization
      this.chartData = {
        performanceTrends: performanceTrends.success ? performanceTrends.data : null,
        teamChemistry: teamChemistry.success ? teamChemistry.data : null,
        trainingDistribution: trainingDistribution.success ? trainingDistribution.data : null,
        positionPerformance: positionPerformance.success ? positionPerformance.data : null,
        speedDevelopment: speedDevelopment.success ? speedDevelopment.data : null,
      };
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      throw error;
    }
  }

  updateMetricsDisplay() {
    const metricCards = document.querySelectorAll(".metric-card");
    
    // If no data, show "No data" for all metrics
    if (!this.analyticsData || !this.analyticsData.metrics || this.analyticsData.metrics.length === 0) {
      metricCards.forEach((card) => {
        const valueEl = card.querySelector(".metric-value");
        const trendEl = card.querySelector(".metric-trend");
        if (valueEl) {valueEl.textContent = "—";}
        if (trendEl) {
          trendEl.textContent = "No data entry yet";
          trendEl.className = "metric-trend";
        }
      });
      return;
    }

    const metrics = this.analyticsData.metrics;

    metrics.forEach((metric, index) => {
      if (metricCards[index]) {
        const valueEl = metricCards[index].querySelector(".metric-value");
        const labelEl = metricCards[index].querySelector(".metric-label");
        const trendEl = metricCards[index].querySelector(".metric-trend");

        if (valueEl) {
          // Show 0 or "—" if value is null/undefined/0
          if (metric.value === null || metric.value === undefined || metric.value === 0) {
            valueEl.textContent = "—";
          } else {
            valueEl.textContent = metric.value;
          }
        }
        if (labelEl && metric.label) {labelEl.textContent = metric.label;}
        if (trendEl) {
          if (metric.trend) {
            trendEl.textContent = metric.trend;
            trendEl.className = `metric-trend trend-${metric.trendType || 'neutral'}`;
          } else {
            trendEl.textContent = "No data entry yet";
            trendEl.className = "metric-trend";
          }
        }
      }
    });
  }

  initPerformanceTrendsChart() {
    const ctx = document.getElementById("performanceTrendsChart");
    if (!ctx) {return;}

    const data = this.chartData?.performanceTrends;
    
    // If no data, show empty chart with message
    if (!data || !data.values || data.values.length === 0) {
      this.showNoDataMessage(ctx.closest(".chart-card"), "Performance Trends");
      return;
    }

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
      const insightValue = document.querySelector("#performanceTrendsChart").closest(".chart-card")?.querySelector(".insight-item .insight-value");
      if (insightValue) {insightValue.textContent = data.currentScore;}
    }
  }

  initTeamChemistryChart() {
    const ctx = document.getElementById("teamChemistryChart");
    if (!ctx) {return;}

    const data = this.chartData?.teamChemistry;
    
    // If no data, show empty chart with message
    if (!data || !data.values || data.values.length === 0) {
      this.showNoDataMessage(ctx.closest(".chart-card"), "Team Chemistry");
      return;
    }

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
      const chartCard = document.querySelector("#teamChemistryChart").closest(".chart-card");
      const overallValue = chartCard?.querySelector(".insight-item .insight-value");
      if (overallValue) {overallValue.textContent = data.overall.toFixed(1);}
    }
  }

  initTrainingDistributionChart() {
    const ctx = document.getElementById("trainingDistributionChart");
    if (!ctx) {return;}

    const data = this.chartData?.trainingDistribution;
    
    // If no data, show empty chart with message
    if (!data || !data.values || data.values.length === 0) {
      this.showNoDataMessage(ctx.closest(".chart-card"), "Training Distribution");
      return;
    }

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
      const chartCard = document.querySelector("#trainingDistributionChart").closest(".chart-card");
      const agilityValue = chartCard?.querySelectorAll(".insight-item .insight-value")[0];
      const speedValue = chartCard?.querySelectorAll(".insight-item .insight-value")[1];
      const technicalValue = chartCard?.querySelectorAll(".insight-item .insight-value")[2];
      
      if (agilityValue) {agilityValue.textContent = data.agilitySessions;}
      if (speedValue) {speedValue.textContent = data.speedSessions;}
      if (technicalValue) {technicalValue.textContent = data.technicalSessions;}
    }
  }

  initPositionPerformanceChart() {
    const ctx = document.getElementById("positionPerformanceChart");
    if (!ctx) {return;}

    const data = this.chartData?.positionPerformance;
    
    // If no data, show empty chart with message
    if (!data || !data.values || data.values.length === 0) {
      this.showNoDataMessage(ctx.closest(".chart-card"), "Position Performance");
      return;
    }

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
      const chartCard = document.querySelector("#positionPerformanceChart").closest(".chart-card");
      const insightValues = chartCard?.querySelectorAll(".insight-item .insight-value");
      const insightLabels = chartCard?.querySelectorAll(".insight-item .insight-label");
      
      data.topPerformers.slice(0, 3).forEach((performer, index) => {
        if (insightValues[index]) {insightValues[index].textContent = performer.score;}
        if (insightLabels[index]) {insightLabels[index].textContent = performer.name;}
      });
    }
  }

  initOlympicProgressChart() {
    const ctx = document.getElementById("olympicProgressChart");
    if (!ctx) {return;}

    // Get progress from analytics summary
    const progressMetric = this.analyticsData?.metrics?.find(m => m.label === "Olympic Qualification");
    if (!progressMetric || !progressMetric.value) {
      this.showNoDataMessage(ctx.closest(".chart-card"), "Olympic Qualification");
      return;
    }
    
    const progress = progressMetric.value;
    const progressValue = parseInt(String(progress).replace("%", "")) || 0;

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
    if (!ctx) {return;}

    const data = this.chartData?.injuryRisk;
    
    // If no data, show empty chart with message
    if (!data || !data.values || data.values.length === 0) {
      this.showNoDataMessage(ctx.closest(".chart-card"), "Injury Risk");
      return;
    }

    this.charts.injuryRisk = new Chart(ctx, {
      type: "pie",
      data: {
        labels: data.labels || ["Low Risk", "Medium Risk", "High Risk"],
        datasets: [
          {
            data: data.values,
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
    if (!ctx) {return;}

    const data = this.chartData?.speedDevelopment;
    
    // If no data, show empty chart with message
    if (!data || !data.datasets || data.datasets.length === 0 || !data.datasets.some(ds => ds.data && ds.data.length > 0)) {
      this.showNoDataMessage(ctx.closest(".chart-card"), "Speed Development");
      return;
    }

    this.charts.speedDevelopment = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: data.datasets.map((ds) => ({
          ...ds,
          borderColor: ds.label.includes("40") ? "var(--primary-500)" : "var(--primary-500)",
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
      const chartCard = document.querySelector("#speedDevelopmentChart").closest(".chart-card");
      const best40Value = chartCard?.querySelectorAll(".insight-item .insight-value")[0];
      const best10Value = chartCard?.querySelectorAll(".insight-item .insight-value")[1];
      const improvementValue = chartCard?.querySelectorAll(".insight-item .insight-value")[2];
      
      if (best40Value) {best40Value.textContent = `${data.best40Yard}s`;}
      if (best10Value) {best10Value.textContent = `${data.best10Yard}s`;}
      if (improvementValue) {improvementValue.textContent = `-${data.improvement}s`;}
    }
  }

  initEngagementFunnelChart() {
    const ctx = document.getElementById("engagementFunnelChart");
    if (!ctx) {return;}

    const data = this.chartData?.engagementFunnel;
    
    // If no data, show empty chart with message
    if (!data || !data.values || data.values.length === 0) {
      this.showNoDataMessage(ctx.closest(".chart-card"), "Engagement Funnel");
      return;
    }

    this.charts.engagementFunnel = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels || [
          "App Opens",
          "Training Started",
          "Session Completed",
          "Goals Set",
          "Goals Achieved",
        ],
        datasets: [
          {
            label: "Users",
            data: data.values,
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

  /**
   * Show empty state message for charts when no data is available
   */
  showNoDataMessage(chartCard, chartName) {
    if (!chartCard) return;
    
    const canvas = chartCard.querySelector("canvas");
    if (canvas) {
      canvas.style.display = "none";
    }
    
    // Check if message already exists
    let noDataMsg = chartCard.querySelector(".no-data-message");
    if (!noDataMsg) {
      noDataMsg = document.createElement("div");
      noDataMsg.className = "no-data-message";
      noDataMsg.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        text-align: center;
        color: var(--color-text-tertiary);
        min-height: 300px;
      `;
      noDataMsg.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📊</div>
        <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--color-text-secondary);">No Data Available</div>
        <div style="font-size: 0.875rem;">No ${chartName} data has been entered yet.</div>
      `;
      chartCard.appendChild(noDataMsg);
    }
  }

  /**
   * Show empty state for entire analytics page
   */
  showEmptyState() {
    // Update metrics to show "No data"
    this.updateMetricsDisplay();
    
    // Show empty messages for all charts
    const chartCards = document.querySelectorAll(".chart-card");
    chartCards.forEach((card) => {
      const canvas = card.querySelector("canvas");
      if (canvas && !canvas.closest(".no-data-message")) {
        const chartName = card.querySelector(".chart-title")?.textContent || "Chart";
        this.showNoDataMessage(card, chartName);
      }
    });
  }
}

// Initialize analytics page
if (document.getElementById("performanceTrendsChart")) {
  window.analyticsPage = new AnalyticsPage();
}

// Make functions globally available for onclick handlers
window.toggleSidebar = function() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const toggleBtn = document.getElementById("mobile-menu-toggle");

  if (!sidebar) {return;}

  const isOpen = sidebar.classList.contains("open") || sidebar.classList.contains("mobile-open");

  if (isOpen) {
    sidebar.classList.remove("open", "mobile-open");
    if (overlay) {overlay.classList.remove("active");}
    document.body.classList.remove("sidebar-open", "menu-open");
    if (toggleBtn) {toggleBtn.setAttribute("aria-expanded", "false");}
    if (toggleBtn) {toggleBtn.focus();}
  } else {
    sidebar.classList.add("open", "mobile-open");
    if (overlay) {overlay.classList.add("active");}
    document.body.classList.add("sidebar-open", "menu-open");
    if (toggleBtn) {toggleBtn.setAttribute("aria-expanded", "true");}
    const firstNavItem = sidebar.querySelector(".nav-item");
    if (firstNavItem) {firstNavItem.focus();}
  }
};

window.closeMenu = function() {
  window.toggleSidebar();
};

