import { logger } from '../logger.js';
import { setSafeContent } from './utils/shared.js';


/**
 * FlagFit Pro - Wellness Notifications Integration
 * Integrates push notifications with wellness tracking
 */

(function () {
  "use strict";

  // Get storageService from global window object
  const {storageService} = window;

  // Wait for notification manager to be available
  function initWellnessNotifications() {
    if (!window.notificationManager) {
      logger.info("[Wellness] Waiting for notification manager...");
      setTimeout(initWellnessNotifications, 100);
      return;
    }

    logger.info("[Wellness] Initializing wellness notifications");

    // Check if this is first visit
    const hasSeenPrompt = storageService.get(
      "wellnessNotificationPromptSeen",
      null,
      { usePrefix: false },
    );

    if (!hasSeenPrompt) {
      // Show permission prompt after a short delay (better UX)
      setTimeout(() => {
        showNotificationPrompt();
      }, 3000); // 3 seconds after page load
    }

    // Listen for wellness form submissions
    listenForWellnessSubmissions();

    // Check for wellness streaks
    checkWellnessStreak();
  }

  /**
   * Show a friendly notification permission prompt
   */
  function showNotificationPrompt() {
    const status = window.notificationManager.getPermissionStatus();

    // Don't show if already granted or denied
    if (status.permission !== "default") {
      return;
    }

    // Create prompt modal
    const modal = document.createElement("div");
    modal.className = "notification-prompt-modal";
    setSafeContent(modal, `
      <div class="notification-prompt-overlay"></div>
      <div class="notification-prompt-content">
        <div class="notification-prompt-icon">🔔</div>
        <h3>Stay on Track!</h3>
        <p>Get daily reminders to log your wellness check-ins and track your progress.</p>
        <div class="notification-prompt-benefits">
          <div class="benefit-item">
            <span class="benefit-icon">📊</span>
            <span>Daily wellness reminders</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🏆</span>
            <span>Achievement notifications</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🔥</span>
            <span>Streak celebrations</span>
          </div>
        </div>
        <div class="notification-prompt-buttons">
          <button class="btn-primary" id="enable-notifications">
            Enable Notifications
          </button>
          <button class="btn-secondary" id="maybe-later">
            Maybe Later
          </button>
        </div>
      </div>
    `, true, true);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .notification-prompt-modal {
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

      .notification-prompt-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
      }

      .notification-prompt-content {
        position: relative;
        background: var(--surface-primary, #ffffff);
        border-radius: 20px;
        padding: var(--space-6, 32px);
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .notification-prompt-icon {
        font-size: 4rem;
        margin-bottom: var(--space-4, 16px);
      }

      .notification-prompt-content h3 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: var(--space-3, 12px);
        color: var(--text-primary, #1a1a1a);
      }

      .notification-prompt-content p {
        font-size: 1rem;
        color: var(--text-secondary, #6b7280);
        margin-bottom: var(--space-5, 24px);
        line-height: 1.5;
      }

      .notification-prompt-benefits {
        display: flex;
        flex-direction: column;
        gap: var(--space-3, 12px);
        margin-bottom: var(--space-5, 24px);
        text-align: left;
      }

      .benefit-item {
        display: flex;
        align-items: center;
        gap: var(--space-3, 12px);
        font-size: 0.9375rem;
        color: var(--text-primary, #1a1a1a);
      }

      .benefit-icon {
        font-size: 1.5rem;
      }

      .notification-prompt-buttons {
        display: flex;
        flex-direction: column;
        gap: var(--space-3, 12px);
      }

      .notification-prompt-buttons button {
        width: 100%;
        padding: var(--space-3, 12px) var(--space-4, 16px);
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .notification-prompt-buttons .btn-primary {
        background: var(--brand-primary-700, #089949);
        color: white;
      }

      .notification-prompt-buttons .btn-primary:hover {
        background: var(--brand-primary-900, #036d35);
        transform: translateY(-1px);
      }

      .notification-prompt-buttons .btn-secondary {
        background: transparent;
        color: var(--text-secondary, #6b7280);
        border: 1px solid var(--surface-border, #e5e7eb);
      }

      .notification-prompt-buttons .btn-secondary:hover {
        background: var(--surface-secondary, #f3f4f6);
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // Handle enable button
    document
      .getElementById("enable-notifications")
      .addEventListener("click", async () => {
        const granted = await window.notificationManager.requestPermission();

        if (granted) {
          // Show success message
          setSafeContent(modal.querySelector(".notification-prompt-content"), `
          <div class="notification-prompt-icon">✅</div>
          <h3>You're all set!</h3>
          <p>You'll receive daily wellness reminders at 9:00 PM.</p>
          <button class="btn-primary" onclick="this.closest('.notification-prompt-modal').remove()">
            Got it!
          </button>
        `, true, true);

          // Auto-close after 2 seconds
          setTimeout(() => {
            modal.remove();
          }, 2000);
        } else {
          modal.remove();
        }

        // Mark as seen
        storageService.set("wellnessNotificationPromptSeen", "true", {
          usePrefix: false,
        });
      });

    // Handle maybe later button
    document.getElementById("maybe-later").addEventListener("click", () => {
      modal.remove();
      storageService.set("wellnessNotificationPromptSeen", "true", {
        usePrefix: false,
      });

      // Ask again in 7 days
      const nextPrompt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      storageService.set("wellnessNotificationNextPrompt", nextPrompt, {
        usePrefix: false,
      });
    });
  }

  /**
   * Listen for wellness form submissions
   */
  function listenForWellnessSubmissions() {
    // This will integrate with the wellness form
    // For now, we'll listen for custom events

    document.addEventListener("wellnessSubmitted", (event) => {
      logger.info("[Wellness] Wellness submitted:", event.detail);

      if (
        window.notificationManager &&
        window.notificationManager.isEnabled()
      ) {
        // Show confirmation notification
        window.notificationManager.show("Wellness Logged! ✅", {
          body: "Your wellness check-in has been recorded successfully.",
          tag: "wellness-logged",
          requireInteraction: false,
        });

        // Check for streaks and achievements
        checkWellnessStreak();
      }
    });
  }

  /**
   * Check for wellness streaks
   */
  function checkWellnessStreak() {
    // Get wellness history from storageService
    const wellnessHistory = storageService.get("wellnessHistory", [], {
      usePrefix: false,
    });

    if (wellnessHistory.length === 0) {
      return;
    }

    // Calculate streak
    const streak = calculateStreak(wellnessHistory);

    // Notify on milestone streaks
    if (
      streak === 7 ||
      streak === 14 ||
      streak === 30 ||
      streak === 60 ||
      streak === 100
    ) {
      if (
        window.notificationManager &&
        window.notificationManager.isEnabled()
      ) {
        window.notificationManager.notifyStreak(streak);
      }
    }
  }

  /**
   * Calculate wellness streak
   */
  function calculateStreak(history) {
    if (history.length === 0) {
      return 0;
    }

    // Sort by date descending
    const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    const currentDate = new Date(today);

    for (const entry of sorted) {
      const entryDate = new Date(entry.date).toISOString().split("T")[0];
      const expectedDate = currentDate.toISOString().split("T")[0];

      if (entryDate === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Create install prompt for PWA
   */
  let deferredPrompt;

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;

    logger.info("[PWA] Install prompt available");

    // Show custom install button
    showInstallButton();
  });

  function showInstallButton() {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      logger.info("[PWA] Already installed");
      return;
    }

    // Create install button
    const installBtn = document.createElement("button");
    installBtn.className = "pwa-install-btn";
    setSafeContent(installBtn, `
      <span class="pwa-install-icon">📱</span>
      <span>Install App</span>
    `, true, true);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .pwa-install-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--brand-primary-700, #089949);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 24px;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.4);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .pwa-install-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(8, 153, 73, 0.5);
      }

      .pwa-install-icon {
        font-size: 1.25rem;
      }

      @media (max-width: 768px) {
        .pwa-install-btn {
          bottom: 80px; /* Above mobile nav if present */
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(installBtn);

    // Handle install button click
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) {
        return;
      }

      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      logger.info(`[PWA] User response: ${outcome}`);

      if (outcome === "accepted") {
        logger.info("[PWA] App installed");
        installBtn.remove();
      }

      // Clear the deferredPrompt
      deferredPrompt = null;
    });
  }

  // Initialize on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWellnessNotifications);
  } else {
    initWellnessNotifications();
  }

  logger.info("[Wellness] Wellness notifications script loaded");
})();
