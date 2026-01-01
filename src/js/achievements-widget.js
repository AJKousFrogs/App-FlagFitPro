import { logger } from "../logger.js";
import { setSafeContent } from "./utils/shared.js";

/**
 * FlagFit Pro - Achievements Widget
 * Displays achievements on the dashboard
 */

(function () {
  "use strict";

  /**
   * Create and render achievements widget
   */
  function renderAchievementsWidget(containerId) {
    // Wait for achievements service to be available
    if (!window.achievementsService) {
      logger.info("[Achievements Widget] Waiting for achievements service...");
      setTimeout(() => renderAchievementsWidget(containerId), 100);
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      logger.error(`[Achievements Widget] Container #${containerId} not found`);
      return;
    }

    const service = window.achievementsService;
    const allAchievements = service.getAllAchievements();
    const unlockedCount = service.getUnlockedAchievements().length;
    const totalPoints = service.getTotalPoints();
    const progress = service.getProgress();

    // Create widget HTML
    const widget = document.createElement("div");
    widget.className = "achievements-widget";
    setSafeContent(
      widget,
      `
      <div class="achievements-header">
        <div class="achievements-title">
          <h3>🏆 Achievements</h3>
          <span class="achievements-count">${unlockedCount}/${allAchievements.length}</span>
        </div>
        <div class="achievements-points">
          <span class="points-label">Total Points:</span>
          <span class="points-value">${totalPoints}</span>
        </div>
      </div>

      <div class="achievements-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <span class="progress-text">${progress}% Complete</span>
      </div>

      <div class="achievements-grid" id="achievements-grid">
        ${renderAchievementsList(allAchievements)}
      </div>

      <div class="achievements-footer">
        <button class="view-all-btn" onclick="showAllAchievements()">
          View All Achievements
        </button>
      </div>
    `,
      true,
      true,
    );

    // Add styles
    addAchievementsStyles();

    // Clear and append
    container.textContent = "";
    container.appendChild(widget);

    logger.info("[Achievements Widget] Rendered successfully");
  }

  /**
   * Render achievements list
   */
  function renderAchievementsList(achievements) {
    // Sort: unlocked first, then by points
    const sorted = achievements.sort((a, b) => {
      if (a.unlocked && !b.unlocked) {
        return -1;
      }
      if (!a.unlocked && b.unlocked) {
        return 1;
      }
      return b.points - a.points;
    });

    // Show top 6 achievements
    const topAchievements = sorted.slice(0, 6);

    return topAchievements
      .map(
        (achievement) => `
      <div class="achievement-badge ${achievement.unlocked ? "unlocked" : "locked"}"
           title="${achievement.description}">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-points">${achievement.points} pts</div>
        ${achievement.unlocked ? '<div class="achievement-check">✓</div>' : ""}
        ${!achievement.unlocked ? '<div class="achievement-lock">🔒</div>' : ""}
      </div>
    `,
      )
      .join("");
  }

  /**
   * Add CSS styles for achievements widget
   */
  function addAchievementsStyles() {
    // Check if styles already added
    if (document.getElementById("achievements-widget-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "achievements-widget-styles";
    style.textContent = `
      .achievements-widget {
        background: var(--surface-primary, #ffffff);
        border-radius: var(--radius-lg, 12px);
        padding: var(--space-5, 24px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .achievements-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4, 16px);
      }

      .achievements-title {
        display: flex;
        align-items: center;
        gap: var(--space-2, 8px);
      }

      .achievements-title h3 {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary, #1a1a1a);
      }

      .achievements-count {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        background: var(--surface-secondary, #f3f4f6);
        padding: 4px 12px;
        border-radius: 12px;
        font-weight: 600;
      }

      .achievements-points {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
      }

      .points-label {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .points-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--brand-primary-700, #089949);
      }

      .achievements-progress {
        margin-bottom: var(--space-5, 24px);
      }

      .progress-bar {
        height: 8px;
        background: var(--surface-secondary, #f3f4f6);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: var(--space-2, 8px);
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--brand-primary-700, #089949) 0%, #10c96b 100%);
        border-radius: 4px;
        transition: width 0.5s ease-out;
      }

      .progress-text {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        font-weight: 500;
      }

      .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: var(--space-3, 12px);
        margin-bottom: var(--space-4, 16px);
      }

      .achievement-badge {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-4, 16px);
        border-radius: var(--radius-md, 8px);
        background: var(--surface-secondary, #f3f4f6);
        transition: all 0.3s ease;
        cursor: pointer;
        border: 2px solid transparent;
      }

      .achievement-badge.unlocked {
        background: linear-gradient(135deg, var(--brand-primary-700, #089949) 0%, #10c96b 100%);
        color: white;
        border-color: var(--brand-primary-900, #036d35);
        transform: scale(1);
        animation: unlock-bounce 0.5s ease-out;
      }

      @keyframes unlock-bounce {
        0% {
          transform: scale(0.8);
          opacity: 0;
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      .achievement-badge.locked {
        opacity: 0.5;
        filter: grayscale(70%);
      }

      .achievement-badge:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .achievement-badge.unlocked:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 8px 20px rgba(8, 153, 73, 0.3);
      }

      .achievement-icon {
        font-size: 2.5rem;
        margin-bottom: var(--space-2, 8px);
      }

      .achievement-name {
        font-size: 0.875rem;
        font-weight: 600;
        text-align: center;
        margin-bottom: var(--space-1, 4px);
        color: var(--text-primary, #1a1a1a);
      }

      .achievement-badge.unlocked .achievement-name {
        color: white;
      }

      .achievement-points {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
        font-weight: 500;
      }

      .achievement-badge.unlocked .achievement-points {
        color: rgba(255, 255, 255, 0.9);
      }

      .achievement-check {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        color: var(--brand-primary-700, #089949);
        font-weight: 700;
      }

      .achievement-lock {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 1rem;
        opacity: 0.6;
      }

      .achievements-footer {
        display: flex;
        justify-content: center;
        padding-top: var(--space-4, 16px);
        border-top: 1px solid var(--surface-border, #e5e7eb);
      }

      .view-all-btn {
        padding: var(--space-2, 8px) var(--space-4, 16px);
        background: transparent;
        border: 1px solid var(--brand-primary-700, #089949);
        color: var(--brand-primary-700, #089949);
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .view-all-btn:hover {
        background: var(--brand-primary-700, #089949);
        color: white;
        transform: translateY(-1px);
      }

      @media (max-width: 768px) {
        .achievements-grid {
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        }

        .achievement-icon {
          font-size: 2rem;
        }

        .achievement-name {
          font-size: 0.75rem;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Show all achievements in a modal
   */
  window.showAllAchievements = function () {
    if (!window.achievementsService) {
      return;
    }

    const service = window.achievementsService;
    const categories = [
      "wellness",
      "training",
      "performance",
      "social",
      "special",
    ];

    // Create modal
    const modal = document.createElement("div");
    modal.className = "achievements-modal";
    setSafeContent(
      modal,
      `
      <div class="achievements-modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="achievements-modal-content">
        <div class="modal-header">
          <h2>🏆 All Achievements</h2>
          <button class="modal-close" onclick="this.closest('.achievements-modal').remove()">×</button>
        </div>

        <div class="modal-stats">
          <div class="stat-item">
            <span class="stat-value">${service.getUnlockedAchievements().length}</span>
            <span class="stat-label">Unlocked</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${service.getTotalPoints()}</span>
            <span class="stat-label">Total Points</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${service.getProgress()}%</span>
            <span class="stat-label">Complete</span>
          </div>
        </div>

        ${categories
          .map((category) => {
            const categoryAchievements =
              service.getAchievementsByCategory(category);
            if (categoryAchievements.length === 0) {
              return "";
            }

            return `
            <div class="category-section">
              <h3 class="category-title">${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
              <div class="achievements-grid">
                ${categoryAchievements
                  .map(
                    (a) => `
                  <div class="achievement-badge ${a.unlocked ? "unlocked" : "locked"}">
                    <div class="achievement-icon">${a.icon}</div>
                    <div class="achievement-name">${a.name}</div>
                    <div class="achievement-description">${a.description}</div>
                    <div class="achievement-points">${a.points} pts</div>
                    ${a.unlocked ? '<div class="achievement-check">✓</div>' : ""}
                    ${!a.unlocked ? '<div class="achievement-lock">🔒</div>' : ""}
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `,
      true,
      true,
    );

    // Add modal styles
    const modalStyles = document.createElement("style");
    modalStyles.textContent = `
      .achievements-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .achievements-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
      }

      .achievements-modal-content {
        position: relative;
        background: var(--surface-primary, #ffffff);
        border-radius: 20px;
        width: 90%;
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        padding: var(--space-6, 32px);
        animation: slideUp 0.3s ease-out;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-5, 24px);
      }

      .modal-header h2 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary, #1a1a1a);
      }

      .modal-close {
        width: 40px;
        height: 40px;
        border: none;
        background: var(--surface-secondary, #f3f4f6);
        border-radius: 50%;
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--text-secondary, #6b7280);
      }

      .modal-close:hover {
        background: var(--surface-tertiary, #e5e7eb);
        transform: rotate(90deg);
      }

      .modal-stats {
        display: flex;
        gap: var(--space-4, 16px);
        margin-bottom: var(--space-6, 32px);
        padding: var(--space-4, 16px);
        background: var(--surface-secondary, #f3f4f6);
        border-radius: 12px;
      }

      .stat-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--brand-primary-700, #089949);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
      }

      .category-section {
        margin-bottom: var(--space-6, 32px);
      }

      .category-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: var(--space-4, 16px);
        color: var(--text-primary, #1a1a1a);
      }

      .achievement-description {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
        text-align: center;
        margin-top: var(--space-1, 4px);
      }

      .achievement-badge.unlocked .achievement-description {
        color: rgba(255, 255, 255, 0.85);
      }
    `;

    document.head.appendChild(modalStyles);
    document.body.appendChild(modal);
  };

  // Auto-render widget if container exists
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.getElementById("achievements-widget-container")) {
        renderAchievementsWidget("achievements-widget-container");
      }
    });
  } else {
    if (document.getElementById("achievements-widget-container")) {
      renderAchievementsWidget("achievements-widget-container");
    }
  }

  // Export for manual rendering
  window.renderAchievementsWidget = renderAchievementsWidget;

  logger.info("[Achievements Widget] Widget script loaded");
})();
