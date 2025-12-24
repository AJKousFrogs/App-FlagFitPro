import { logger } from '../logger.js';
import { setSafeContent } from './utils/shared.js';


/**
 * FlagFit Pro - Wellness Export Buttons
 * Adds PDF/CSV export buttons to wellness page
 */

(function () {
  "use strict";

  function addExportButtons() {
    // Wait for export service
    if (!window.exportService) {
      setTimeout(addExportButtons, 100);
      return;
    }

    // Find a good location for export buttons
    // Look for wellness form or wellness header
    const wellnessPage = document.querySelector(
      '.wellness-page, .wellness-container, [class*="wellness"]',
    );

    if (!wellnessPage) {
      logger.info(
        "[Wellness Export] Wellness container not found, will try again",
      );
      setTimeout(addExportButtons, 500);
      return;
    }

    // Check if buttons already added
    if (document.getElementById("wellness-export-buttons")) {
      return;
    }

    // Create export buttons container
    const exportContainer = document.createElement("div");
    exportContainer.id = "wellness-export-buttons";
    exportContainer.className = "wellness-export-buttons";
    setSafeContent(exportContainer, `
      <div class="export-buttons-wrapper">
        <h3 class="export-title">📊 Export Your Data</h3>
        <p class="export-description">Download your wellness data for your records or to share with your coach</p>
        <div class="export-buttons-grid">
          <button
            class="export-btn export-btn-pdf"
            onclick="handleWellnessExportPDF()"
            aria-label="Export wellness data to PDF">
            <span class="export-btn-icon">📄</span>
            <span class="export-btn-text">
              <strong>Export PDF</strong>
              <small>Full wellness report</small>
            </span>
          </button>
          <button
            class="export-btn export-btn-csv"
            onclick="handleWellnessExportCSV()"
            aria-label="Export wellness data to CSV">
            <span class="export-btn-icon">📊</span>
            <span class="export-btn-text">
              <strong>Export CSV</strong>
              <small>Spreadsheet format</small>
            </span>
          </button>
        </div>
      </div>
    `, true, true);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .wellness-export-buttons {
        margin: var(--space-6, 32px) 0;
        padding: var(--space-5, 24px);
        background: var(--surface-secondary, #f3f4f6);
        border-radius: var(--radius-lg, 12px);
        border: 1px solid var(--surface-border, #e5e7eb);
      }

      .export-buttons-wrapper {
        max-width: 600px;
        margin: 0 auto;
      }

      .export-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 var(--space-2, 8px) 0;
        color: var(--text-primary, #1a1a1a);
        text-align: center;
      }

      .export-description {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        margin: 0 0 var(--space-4, 16px) 0;
        text-align: center;
        line-height: 1.5;
      }

      .export-buttons-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-3, 12px);
      }

      .export-btn {
        display: flex;
        align-items: center;
        gap: var(--space-3, 12px);
        padding: var(--space-4, 16px);
        background: white;
        border: 2px solid var(--surface-border, #e5e7eb);
        border-radius: var(--radius-md, 8px);
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }

      .export-btn:hover {
        border-color: var(--brand-primary-700, #089949);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .export-btn:active {
        transform: translateY(0);
      }

      .export-btn-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }

      .export-btn-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .export-btn-text strong {
        font-size: 1rem;
        color: var(--text-primary, #1a1a1a);
        font-weight: 600;
      }

      .export-btn-text small {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
      }

      .export-btn-pdf:hover {
        background: #fef2f2;
        border-color: #ef4444;
      }

      .export-btn-csv:hover {
        background: #f0fdf4;
        border-color: #10c96b;
      }

      @media (max-width: 768px) {
        .export-buttons-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);

    // Insert export buttons (try to find a good spot)
    const insertBefore = wellnessPage.querySelector(
      "form, .wellness-form, .checkin-form",
    );
    if (insertBefore) {
      insertBefore.parentNode.insertBefore(exportContainer, insertBefore);
    } else {
      wellnessPage.appendChild(exportContainer);
    }

    logger.info("[Wellness Export] Export buttons added");
  }

  /**
   * Handle PDF export
   */
  window.handleWellnessExportPDF = function () {
    // Get wellness history from localStorage
    const wellnessHistory = JSON.parse(
      localStorage.getItem("wellnessHistory") || "[]",
    );

    if (wellnessHistory.length === 0) {
      alert("No wellness data to export. Log some wellness check-ins first!");
      return;
    }

    // Show loading state
    const btn = event.target.closest(".export-btn");
    const originalContent = btn.cloneNode(true);
    btn.disabled = true;
    setSafeContent(btn, "<span>⏳ Generating PDF...</span>", true, true);

    // Export with slight delay for UI feedback
    setTimeout(async () => {
      const success =
        await window.exportService.exportWellnessToPDF(wellnessHistory);

      if (success) {
        setSafeContent(btn, "<span>✅ PDF Downloaded!</span>", true, true);
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = '';
          while (originalContent.firstChild) {
            btn.appendChild(originalContent.firstChild.cloneNode(true));
          }
        }, 2000);
      } else {
        setSafeContent(btn, "<span>❌ Export Failed</span>", true, true);
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = '';
          while (originalContent.firstChild) {
            btn.appendChild(originalContent.firstChild.cloneNode(true));
          }
        }, 2000);
      }
    }, 300);
  };

  /**
   * Handle CSV export
   */
  window.handleWellnessExportCSV = function () {
    // Get wellness history from localStorage
    const wellnessHistory = JSON.parse(
      localStorage.getItem("wellnessHistory") || "[]",
    );

    if (wellnessHistory.length === 0) {
      alert("No wellness data to export. Log some wellness check-ins first!");
      return;
    }

    // Show loading state
    const btn = event.target.closest(".export-btn");
    const originalContent = btn.cloneNode(true);
    btn.disabled = true;
    setSafeContent(btn, "<span>⏳ Generating CSV...</span>", true, true);

    // Format data for CSV
    const csvData = wellnessHistory.map((entry) => ({
      Date: new Date(entry.date).toLocaleDateString(),
      "Sleep (hours)": entry.sleep || "N/A",
      "Energy (1-10)": entry.energy || "N/A",
      "Mood (1-10)": entry.mood || "N/A",
      "Stress (1-10)": entry.stress || "N/A",
      "Soreness (1-10)": entry.soreness || "N/A",
      "Motivation (1-10)": entry.motivation || "N/A",
      "Hydration (1-10)": entry.hydration || "N/A",
      Notes: entry.notes || "",
    }));

    // Export with slight delay for UI feedback
    setTimeout(() => {
      const success = window.exportService.exportToCSV(
        csvData,
        "flagfit-wellness-data.csv",
      );

      if (success) {
        setSafeContent(btn, "<span>✅ CSV Downloaded!</span>", true, true);
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = '';
          while (originalContent.firstChild) {
            btn.appendChild(originalContent.firstChild.cloneNode(true));
          }
        }, 2000);
      } else {
        setSafeContent(btn, "<span>❌ Export Failed</span>", true, true);
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = '';
          while (originalContent.firstChild) {
            btn.appendChild(originalContent.firstChild.cloneNode(true));
          }
        }, 2000);
      }
    }, 300);
  };

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addExportButtons);
  } else {
    addExportButtons();
  }

  logger.info("[Wellness Export] Export buttons script loaded");
})();
