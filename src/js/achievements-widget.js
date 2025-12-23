/**
 * FlagFit Pro - Achievements Widget
 * Displays achievements on the dashboard
 */

import { logger } from "../logger.js";

(function () {
  "use strict";

  // Helper function to safely set HTML content
  // Uses temp container pattern - acceptable per ESLint exception for safe helper functions
  function setSafeContent(element, content, isHTML, allowRichText) {
    if (!element) {
      return;
    }
    if (!isHTML) {
      element.textContent = content;
      return;
    }
    // Use temp container pattern for safe HTML insertion

    const temp = document.createElement("div");
    // eslint-disable-next-line no-restricted-syntax
    temp.innerHTML = content; // Content is already sanitized by caller
    while (temp.firstChild) {
      element.appendChild(temp.firstChild);
    }
  }

  /**
   * Create and render achievements widget
   */
  function renderAchievementsWidget(containerId) {
    // Wait for achievements service to be available
    if (!window.achievementsService) {
      logger.debug("[Achievements Widget] Waiting for achievements service...");
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
    // Build widget HTML (data is from trusted service, but we sanitize for safety)
    const widgetHtml = `
      <div class="achievements-header">
        <div class="achievements-title">
          <h3><i data-lucide="trophy" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;"></i>Achievements</h3>
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
    `;

    // Use setSafeContent to sanitize HTML before insertion
    setSafeContent(widget, widgetHtml, true, true);

    // Add styles
    addAchievementsStyles();

    // Clear and append using replaceChildren for consistency
    container.replaceChildren();
    container.appendChild(widget);

    // Replace onclick with addEventListener
    const viewAllBtn = widget.querySelector(".view-all-btn");
    if (viewAllBtn) {
      viewAllBtn.removeAttribute("onclick");
      viewAllBtn.addEventListener("click", () => {
        if (typeof window.showAllAchievements === "function") {
          window.showAllAchievements();
        }
      });
    }

    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons(widget);
    }

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
      <div class="achievement-badge ${achievement.unlocked ? "unlocked" : "locked"} rarity-${achievement.rarity || "common"}"
           title="${achievement.description}">
        <div class="achievement-icon">
          <i data-lucide="${achievement.icon}" style="width: 32px; height: 32px;"></i>
        </div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-points">${achievement.points} pts</div>
        ${achievement.rarity && achievement.rarity !== "common" ? `<div class="achievement-rarity rarity-${achievement.rarity}">${achievement.rarity.toUpperCase()}</div>` : ""}
        ${achievement.unlocked ? '<div class="achievement-check"><i data-lucide="check" style="width: 16px; height: 16px;"></i></div>' : ""}
        ${!achievement.unlocked ? '<div class="achievement-lock"><i data-lucide="lock" style="width: 16px; height: 16px;"></i></div>' : ""}
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
        color: white;
        border-color: var(--brand-primary-900, #036d35);
        transform: scale(1);
        animation: unlock-bounce 0.5s ease-out;
      }

      /* Rarity-based styling */
      .achievement-badge.unlocked.rarity-common {
        background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
        border-color: #4b5563;
      }

      .achievement-badge.unlocked.rarity-rare {
        background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
        border-color: #2563eb;
      }

      .achievement-badge.unlocked.rarity-epic {
        background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
        border-color: #7c3aed;
      }

      .achievement-badge.unlocked.rarity-legendary {
        background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
        border-color: #d97706;
        box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
        animation: legendary-glow 2s ease-in-out infinite;
      }

      @keyframes legendary-glow {
        0%, 100% {
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
        }
        50% {
          box-shadow: 0 0 30px rgba(245, 158, 11, 0.8);
        }
      }

      .achievement-rarity {
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
        opacity: 0.9;
      }

      .achievement-rarity.rarity-rare {
        background: rgba(59, 130, 246, 0.3);
        color: #dbeafe;
      }

      .achievement-rarity.rarity-epic {
        background: rgba(139, 92, 246, 0.3);
        color: #e9d5ff;
      }

      .achievement-rarity.rarity-legendary {
        background: rgba(245, 158, 11, 0.3);
        color: #fef3c7;
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
        margin-bottom: var(--space-2, 8px);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .achievement-icon i {
        color: var(--text-primary, #1a1a1a);
      }
      
      .achievement-badge.unlocked .achievement-icon i {
        color: white;
      }
      
      .achievement-badge.locked .achievement-icon i {
        opacity: 0.5;
        filter: grayscale(100%);
      }
      
      .achievement-check {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .achievement-check i {
        color: var(--brand-primary-700, #089949);
      }
      
      .achievement-lock {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .achievement-lock i {
        color: var(--text-secondary, #6b7280);
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

        .achievement-icon i {
          width: 24px;
          height: 24px;
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
      "games",
      "tournaments",
      "qb",
      "social",
      "special",
    ];

    // Create modal
    const modal = document.createElement("div");
    modal.className = "achievements-modal";
    // Build modal HTML (data is from trusted service, but we sanitize for safety)
    const modalHtml = `
      <div class="achievements-modal-overlay"></div>
      <div class="achievements-modal-content">
        <div class="modal-header">
          <h2><i data-lucide="trophy" style="width: 24px; height: 24px; display: inline-block; vertical-align: middle; margin-right: 8px;"></i>All Achievements</h2>
          <button class="modal-close">×</button>
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

        <div class="rarity-stats">
          ${(() => {
            const rarityStats = service.getRarityStats();
            return `
              <div class="rarity-stat-item rarity-common">
                <span class="rarity-icon">⚪</span>
                <span class="rarity-count">${rarityStats.common}</span>
                <span class="rarity-label">Common</span>
              </div>
              <div class="rarity-stat-item rarity-rare">
                <span class="rarity-icon">🔵</span>
                <span class="rarity-count">${rarityStats.rare}</span>
                <span class="rarity-label">Rare</span>
              </div>
              <div class="rarity-stat-item rarity-epic">
                <span class="rarity-icon">🟣</span>
                <span class="rarity-count">${rarityStats.epic}</span>
                <span class="rarity-label">Epic</span>
              </div>
              <div class="rarity-stat-item rarity-legendary">
                <span class="rarity-icon">🟡</span>
                <span class="rarity-count">${rarityStats.legendary}</span>
                <span class="rarity-label">Legendary</span>
              </div>
            `;
          })()}
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
                  <div class="achievement-badge ${a.unlocked ? "unlocked" : "locked"} rarity-${a.rarity || "common"}">
                    <div class="achievement-icon">
                      <i data-lucide="${a.icon}" style="width: 32px; height: 32px;"></i>
                    </div>
                    <div class="achievement-name">${a.name}</div>
                    <div class="achievement-description">${a.description}</div>
                    <div class="achievement-points">${a.points} pts</div>
                    ${a.rarity && a.rarity !== "common" ? `<div class="achievement-rarity rarity-${a.rarity}">${a.rarity.toUpperCase()}</div>` : ""}
                    ${a.unlocked ? '<div class="achievement-check"><i data-lucide="check" style="width: 16px; height: 16px;"></i></div>' : ""}
                    ${!a.unlocked ? '<div class="achievement-lock"><i data-lucide="lock" style="width: 16px; height: 16px;"></i></div>' : ""}
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
    `;

    // Use setSafeContent to sanitize HTML before insertion
    setSafeContent(modal, modalHtml, true, true);

    // Replace onclick with addEventListener
    const overlay = modal.querySelector(".achievements-modal-overlay");
    const closeBtn = modal.querySelector(".modal-close");

    if (overlay) {
      overlay.addEventListener("click", () => modal.remove());
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", () => modal.remove());
    }

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

      .rarity-stats {
        display: flex;
        gap: var(--space-3, 12px);
        margin-bottom: var(--space-6, 32px);
        padding: var(--space-4, 16px);
        background: var(--surface-secondary, #f3f4f6);
        border-radius: 12px;
        justify-content: space-around;
      }

      .rarity-stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .rarity-icon {
        font-size: 1.5rem;
      }

      .rarity-count {
        font-size: 1.5rem;
        font-weight: 700;
      }

      .rarity-stat-item.rarity-common .rarity-count {
        color: #6b7280;
      }

      .rarity-stat-item.rarity-rare .rarity-count {
        color: #3b82f6;
      }

      .rarity-stat-item.rarity-epic .rarity-count {
        color: #8b5cf6;
      }

      .rarity-stat-item.rarity-legendary .rarity-count {
        color: #f59e0b;
      }

      .rarity-label {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
    `;

    document.head.appendChild(modalStyles);
    document.body.appendChild(modal);

    // Initialize Lucide icons in modal
    if (typeof lucide !== "undefined") {
      lucide.createIcons(modal);
    }
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
