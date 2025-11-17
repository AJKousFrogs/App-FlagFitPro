// Dashboard Page JavaScript
// Handles all interactive elements on the dashboard

import { apiClient, API_ENDPOINTS } from "../../api-config.js";
import { authManager } from "../../auth-manager.js";
import { logger } from "../../logger.js";

class DashboardPage {
  constructor() {
    // Initialize with today's date
    this.selectedDate = new Date();
    this.selectedDate.setHours(0, 0, 0, 0);

    this.wellnessData = {
      energy: null,
      sleep: null,
      mood: null,
      trainingLoad: null,
    };
    this.supplements = {
      "beta-alanine": { taken: false, time: null },
      caffeine: { taken: false, time: null },
      calcium: { taken: false, time: null },
      creatine: { taken: false, time: null },
      iron: { taken: false, time: null },
      magnesium: { taken: false, time: null },
      nitrate: { taken: false, time: null },
      protein: { taken: false, time: null },
      "vitamin-d": { taken: false, time: null },
    };
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.setupEventListeners();
        this.setupGlobalFunctions();
      });
    } else {
      this.setupEventListeners();
      this.setupGlobalFunctions();
    }
  }

  setupGlobalFunctions() {
    // Make toggleSidebar globally available for onclick handlers
    window.toggleSidebar = () => this.toggleSidebar();
    window.toggleNotifications = () => this.toggleNotifications();
    window.markAllAsRead = () => this.markAllAsRead();
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const toggleBtn = document.getElementById("mobile-menu-toggle");

    if (!sidebar) return;

    const isOpen = sidebar.classList.contains("open") || sidebar.classList.contains("mobile-open");

    if (isOpen) {
      sidebar.classList.remove("open", "mobile-open");
      if (overlay) overlay.classList.remove("active");
      document.body.classList.remove("sidebar-open", "menu-open");
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    } else {
      sidebar.classList.add("open", "mobile-open");
      if (overlay) overlay.classList.add("active");
      document.body.classList.add("sidebar-open", "menu-open");
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", "true");
      }
    }
  }

  toggleNotifications() {
    const panel = document.getElementById("notification-panel");
    const bell = document.getElementById("notification-bell");

    if (!panel || !bell) return;

    const isHidden = panel.hidden;
    panel.hidden = !isHidden;
    bell.setAttribute("aria-expanded", String(!isHidden));

    // Load notifications if opening
    if (!isHidden) {
      this.loadNotifications();
    }
  }

  async loadNotifications() {
    const notificationList = document.getElementById("notification-list");
    if (!notificationList) return;

    try {
      // Try to get notifications from API
      const response = await apiClient.get(API_ENDPOINTS.dashboard.notifications);
      if (response.success && response.data) {
        this.renderNotifications(response.data);
      } else {
        // Fallback to mock notifications
        this.renderNotifications(this.getMockNotifications());
      }
    } catch (error) {
      logger.warn("Failed to load notifications, using mock data:", error);
      this.renderNotifications(this.getMockNotifications());
    }
  }

  getMockNotifications() {
    return [
      {
        id: 1,
        type: "training",
        title: "Training Session Reminder",
        message: "Speed & Agility training starts in 30 minutes",
        time: "5 minutes ago",
        read: false,
      },
      {
        id: 2,
        type: "achievement",
        title: "New Achievement Unlocked",
        message: "You've completed 10 training sessions this month!",
        time: "1 hour ago",
        read: false,
      },
      {
        id: 3,
        type: "team",
        title: "Team Update",
        message: "New team member joined: Alex Johnson",
        time: "2 hours ago",
        read: false,
      },
    ];
  }

  renderNotifications(notifications) {
    const notificationList = document.getElementById("notification-list");
    if (!notificationList) return;

    if (notifications.length === 0) {
      notificationList.innerHTML = '<div class="notification-empty">No notifications</div>';
      return;
    }

    notificationList.innerHTML = notifications
      .map(
        (notif) => `
      <div class="notification-item ${notif.read ? "read" : ""}" data-id="${notif.id}">
        <div class="notification-icon">${this.getNotificationIcon(notif.type)}</div>
        <div class="notification-content">
          <div class="notification-title">${notif.title}</div>
          <div class="notification-message">${notif.message}</div>
          <div class="notification-time">${notif.time}</div>
        </div>
        ${!notif.read ? '<button class="notification-mark-read" aria-label="Mark as read">×</button>' : ""}
      </div>
    `,
      )
      .join("");

    // Add click handlers for mark as read
    notificationList.querySelectorAll(".notification-mark-read").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const item = btn.closest(".notification-item");
        const id = item.dataset.id;
        this.markNotificationAsRead(id);
      });
    });
  }

  getNotificationIcon(type) {
    const icons = {
      training: "🏃",
      achievement: "🏆",
      team: "👥",
      wellness: "💚",
      default: "🔔",
    };
    return icons[type] || icons.default;
  }

  markNotificationAsRead(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) {
      item.classList.add("read");
      const markBtn = item.querySelector(".notification-mark-read");
      if (markBtn) markBtn.remove();
    }
  }

  markAllAsRead() {
    const items = document.querySelectorAll(".notification-item");
    items.forEach((item) => {
      item.classList.add("read");
      const markBtn = item.querySelector(".notification-mark-read");
      if (markBtn) markBtn.remove();
    });

    // Update badge
    const badge = document.getElementById("notification-badge");
    if (badge) badge.hidden = true;
  }

  setupEventListeners() {
    // Date Picker Setup
    this.setupDatePicker();

    // Wellness Check-in Sliders
    this.setupWellnessSliders();

    // Wellness Submit Button
    const submitBtn = document.querySelector(".btn-submit-checkin");
    if (submitBtn) {
      submitBtn.addEventListener("click", (e) => this.handleWellnessSubmit(e));
    }

    // Training Session Start Button
    const startSessionBtn = document.querySelector(".btn-start-session");
    if (startSessionBtn) {
      logger.debug("✅ Found START SESSION button, attaching event listener");
      startSessionBtn.addEventListener("click", (e) => {
        logger.debug("🖱️ START SESSION button clicked");
        this.handleStartSession(e);
      });
    } else {
      logger.warn("⚠️ START SESSION button not found!");
    }

    // Supplement Buttons
    this.setupSupplementButtons();

    // AI Chat Assistant Button
    const aiChatBtn = document.querySelector(".ai-chat-button");
    if (aiChatBtn) {
      aiChatBtn.addEventListener("click", (e) => this.handleAIChat(e));
    }

    // Settings Button in Header
    const settingsBtn = document.querySelector(".header-icon[aria-label='Settings']");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        window.location.href = "/settings.html";
      });
    }

    // Sidebar Overlay Click Handler
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", () => this.toggleSidebar());
    }

    // Load data for selected date
    this.loadDateData();

    // Load notifications on page load
    this.loadNotifications();
  }

  setupWellnessSliders() {
    const sliders = [
      { id: "energy-slider", key: "energy" },
      { id: "sleep-slider", key: "sleep" },
      { id: "mood-slider", key: "mood" },
      { id: "training-load-slider", key: "trainingLoad" },
    ];

    sliders.forEach(({ id, key }) => {
      const slider = document.getElementById(id);
      const valueDisplay = slider?.parentElement.querySelector(".slider-value");

      if (slider && valueDisplay) {
        // Update display on change
        slider.addEventListener("input", (e) => {
          const value = e.target.value;
          valueDisplay.textContent = value;
          this.wellnessData[key] = parseInt(value);
        });

        // Initialize display
        valueDisplay.textContent = slider.value;
        this.wellnessData[key] = parseInt(slider.value);
      }
    });
  }

  async handleWellnessSubmit(e) {
    e.preventDefault();
    const button = e.target;
    const originalText = button.textContent;

    // Disable button and show loading state
    button.disabled = true;
    button.textContent = "Submitting...";
    button.style.opacity = "0.7";

    try {
      // Get current user
      const user = authManager.getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Prepare wellness data for selected date
      const dateStr = this.formatDateForInput(this.selectedDate);
      const wellnessCheckIn = {
        userId: user.id || user.email,
        date: dateStr,
        energy: this.wellnessData.energy,
        sleep: this.wellnessData.sleep,
        mood: this.wellnessData.mood,
        trainingLoad: this.wellnessData.trainingLoad,
        timestamp: new Date().toISOString(),
      };

      // Save to API (or localStorage for demo)
      try {
        await apiClient.post(API_ENDPOINTS.wellness.checkin, wellnessCheckIn);
        logger.success("Wellness check-in submitted successfully");
      } catch (apiError) {
        // Fallback to localStorage for demo/testing
        logger.warn("API unavailable, saving to localStorage:", apiError);
        const saved = JSON.parse(localStorage.getItem("wellnessCheckIns") || "[]");
        // Remove existing entry for this date
        const filtered = saved.filter(w => w.date !== dateStr);
        filtered.push(wellnessCheckIn);
        localStorage.setItem("wellnessCheckIns", JSON.stringify(filtered));
      }

      // Show success message
      this.showNotification("Wellness check-in submitted successfully! ✓", "success");

      // Reset button after delay
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
        button.style.opacity = "1";
      }, 1500);
    } catch (error) {
      logger.error("Failed to submit wellness check-in:", error);
      this.showNotification("Failed to submit check-in. Please try again.", "error");

      // Reset button
      button.disabled = false;
      button.textContent = originalText;
      button.style.opacity = "1";
    }
  }

  async handleStartSession(e) {
    e.preventDefault();
    e.stopPropagation();
    logger.debug("🚀 handleStartSession called");

    try {
      // Handle case where button might be inside a label or wrapper
      const button = e.target.closest(".btn-start-session") || e.target;
      if (!button || !button.classList.contains("btn-start-session")) {
        logger.error("❌ Could not find button element");
        return;
      }

      const originalText = button.textContent;

      // Disable button and show loading state
      button.disabled = true;
      button.textContent = "Starting...";
      button.style.opacity = "0.7";

      // Get current user
      const user = authManager.getCurrentUser();
      if (!user) {
        logger.warn("⚠️ User not authenticated, using demo mode");
        // Continue with demo mode instead of throwing error
      }

      // Get training session details
      const trainingTime = document.querySelector(".training-time")?.textContent || "18:30";
      const trainingType = trainingTime.includes("Speed & Agility") ? "Speed & Agility" : "Training";
      const coach = document.querySelector(".training-info")?.textContent || "Coach: Ales Zaksek";

      const sessionData = {
        userId: user ? (user.id || user.email) : "demo-user",
        sessionType: trainingType,
        coach: coach.replace("Coach: ", ""),
        startTime: new Date().toISOString(),
        scheduledTime: trainingTime,
      };

      logger.debug("📝 Session data:", sessionData);

      // Save session start
      try {
        await apiClient.post("/api/training/start-session", sessionData);
        logger.success("Training session started");
      } catch (apiError) {
        // Fallback to localStorage
        logger.warn("API unavailable, saving to localStorage:", apiError);
        const saved = JSON.parse(localStorage.getItem("trainingSessions") || "[]");
        saved.push({ ...sessionData, status: "in_progress" });
        localStorage.setItem("trainingSessions", JSON.stringify(saved));
      }

      // Store session data for training-schedule page
      const sessionDate = this.formatDateForInput(this.selectedDate);
      localStorage.setItem("currentTrainingSession", JSON.stringify({
        ...sessionData,
        date: sessionDate,
        status: "in_progress"
      }));

      // Show success and redirect to training schedule page
      this.showNotification("Training session started! Redirecting...", "success");

      // Redirect to training schedule page with date parameter
      setTimeout(() => {
        logger.debug("🔄 Redirecting to training schedule page");
        const dateParam = sessionDate;
        const sessionParam = encodeURIComponent(sessionData.sessionType);
        window.location.href = `/training-schedule.html?date=${dateParam}&session=${sessionParam}`;
      }, 1000);
    } catch (error) {
      logger.error("❌ Failed to start training session:", error);
      console.error("Start session error:", error);
      this.showNotification("Failed to start session. Please try again.", "error");

      // Reset button
      const button = e.target.closest(".btn-start-session") || e.target;
      if (button) {
        button.disabled = false;
        button.textContent = "START SESSION";
        button.style.opacity = "1";
      }
    }
  }

  setupSupplementButtons() {
    const supplementItems = document.querySelectorAll(".supplement-item");

    supplementItems.forEach((item) => {
      const supplementKey = item.getAttribute("data-supplement");
      const toggleInput = item.querySelector(".supplement-toggle-input");

      if (!toggleInput || !supplementKey) return;

      // Load saved state
      const savedState = localStorage.getItem("supplements");
      if (savedState) {
        try {
          const supplements = JSON.parse(savedState);
          if (supplements[supplementKey]?.taken) {
            toggleInput.checked = true;
          }
        } catch (e) {
          logger.warn("Failed to load supplement state:", e);
        }
      }

      // Handle toggle change
      toggleInput.addEventListener("change", (e) => {
        this.handleSupplementToggle(e, supplementKey);
      });
    });
  }

  async handleSupplementToggle(e, supplementKey) {
    const toggleInput = e.target;
    const isChecked = toggleInput.checked;
    const now = new Date();

    try {
      // Get current user
      const user = authManager.getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get supplement display name
      const supplementItem = toggleInput.closest(".supplement-item");
      const supplementName = supplementItem?.querySelector(".supplement-name")?.textContent.trim() || supplementKey;

      // Update supplement state
      this.supplements[supplementKey] = {
        taken: isChecked,
        time: isChecked ? now.toISOString() : null,
      };

      // Save to API or localStorage for selected date
      const dateStr = this.formatDateForInput(this.selectedDate);
      const supplementData = {
        userId: user.id || user.email,
        supplement: supplementKey,
        supplementName: supplementName,
        date: dateStr,
        taken: isChecked,
        timestamp: isChecked ? now.toISOString() : null,
      };

      try {
        if (isChecked) {
          await apiClient.post(API_ENDPOINTS.supplements.log, supplementData);
          logger.success(`Logged ${supplementName} intake`);
          this.showNotification(`${supplementName} logged! ✓`, "success");
        } else {
          // Optionally handle "untaken" action
          await apiClient.post(API_ENDPOINTS.supplements.log, { ...supplementData, action: "untake" });
          logger.info(`Unmarked ${supplementName}`);
        }
      } catch (apiError) {
        logger.warn("API unavailable, saving to localStorage:", apiError);
        const saved = JSON.parse(localStorage.getItem("supplementLogs") || "[]");

        // Remove existing entry for this supplement on selected date
        const filtered = saved.filter(log => {
          const logDate = log.date || (log.timestamp ? new Date(log.timestamp).toISOString().split("T")[0] : null);
          return !(log.supplement === supplementKey && logDate === dateStr);
        });

        if (isChecked) {
          filtered.push(supplementData);
        }

        localStorage.setItem("supplementLogs", JSON.stringify(filtered));

        if (isChecked) {
          this.showNotification(`${supplementName} logged! ✓`, "success");
        }
      }

      // State is now managed per-date, no need to save global state
    } catch (error) {
      logger.error("Failed to log supplement:", error);
      this.showNotification("Failed to log supplement. Please try again.", "error");

      // Revert toggle on error
      toggleInput.checked = !isChecked;
    }
  }

  async handleAIChat(e) {
    e.preventDefault();

    const chatButton = e.target.closest(".ai-chat-button") || e.target;

    // Add visual feedback
    chatButton.style.transform = "scale(0.95)";
    setTimeout(() => {
      chatButton.style.transform = "scale(1)";
    }, 150);

    // Open the chatbot modal
    try {
      // Import and open chatbot
      const chatbotModule = await import("../components/chatbot.js");
      const { flagFitChatbot } = chatbotModule;

      if (flagFitChatbot && typeof flagFitChatbot.open === "function") {
        flagFitChatbot.open();
      } else {
        throw new Error("Chatbot module not properly initialized");
      }
    } catch (error) {
      logger.error("Failed to load chatbot:", error);
      logger.error("Chatbot error details:", error);

      // Try to use global chatbot if available
      if (window.flagFitChatbot && typeof window.flagFitChatbot.open === "function") {
        window.flagFitChatbot.open();
      } else {
        // Last resort: show alert
        alert("AI Assistant Chat\n\nAsk me about:\n• Sports psychology & mental training\n• Nutrition & supplements\n• Speed & agility development\n• Injury prevention & treatment\n• Recovery strategies\n• Training programs");
      }
    }
  }

  setupDatePicker() {
    const datePicker = document.getElementById("dashboard-date-picker");
    const prevBtn = document.getElementById("prev-day-btn");
    const nextBtn = document.getElementById("next-day-btn");
    const todayBtn = document.getElementById("today-btn");

    if (!datePicker) return;

    // Initialize date picker with today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.selectedDate = today;
    datePicker.value = this.formatDateForInput(today);
    this.updateDateStatus();

    // Date picker change handler
    datePicker.addEventListener("change", (e) => {
      const selectedDate = new Date(e.target.value);
      selectedDate.setHours(0, 0, 0, 0);
      this.selectedDate = selectedDate;
      this.updateDateStatus();
      this.loadDateData();
    });

    // Previous day button
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        const prevDate = new Date(this.selectedDate);
        prevDate.setDate(prevDate.getDate() - 1);
        this.selectedDate = prevDate;
        datePicker.value = this.formatDateForInput(prevDate);
        this.updateDateStatus();
        this.loadDateData();
      });
    }

    // Next day button
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const nextDate = new Date(this.selectedDate);
        nextDate.setDate(nextDate.getDate() + 1);
        this.selectedDate = nextDate;
        datePicker.value = this.formatDateForInput(nextDate);
        this.updateDateStatus();
        this.loadDateData();
      });
    }

    // Today button
    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.selectedDate = today;
        datePicker.value = this.formatDateForInput(today);
        this.updateDateStatus();
        this.loadDateData();
      });
    }
  }

  formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  formatDateForDisplay(date) {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  isToday(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  }

  isFuture(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() > today.getTime();
  }

  updateDateStatus() {
    const indicator = document.getElementById("date-indicator");
    const info = document.getElementById("date-info");

    if (!indicator || !info) return;

    const isToday = this.isToday(this.selectedDate);
    const isFuture = this.isFuture(this.selectedDate);

    // Update indicator
    indicator.className = "date-indicator";
    if (isToday) {
      indicator.textContent = "Today";
      indicator.classList.add("today-indicator");
    } else if (isFuture) {
      indicator.textContent = "Future";
      indicator.classList.add("future-indicator");
    } else {
      indicator.textContent = "Historical";
      indicator.classList.add("past-indicator");
    }

    // Update info with formatted date
    const daysDiff = this.getDaysDifference(this.selectedDate);
    let dateText = this.formatDateForDisplay(this.selectedDate);

    if (!isToday && !isFuture) {
      if (daysDiff === 1) {
        dateText += " (Yesterday)";
      } else if (daysDiff > 1) {
        dateText += ` (${daysDiff} days ago)`;
      }
    }

    info.textContent = dateText;
    info.className = "date-info";
  }

  getDaysDifference(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  async loadDateData() {
    const dateStr = this.formatDateForInput(this.selectedDate);

    try {
      const info = document.getElementById("date-info");
      const originalText = info ? info.textContent : "";

      // Show loading state
      this.showDateLoadingState(true);

      // Load wellness data for selected date
      const wellnessLoaded = await this.loadWellnessForDate(dateStr);

      // Load supplements for selected date
      const supplementsLoaded = await this.loadSupplementsForDate(dateStr);

      // Restore date status first (includes date text)
      this.updateDateStatus();

      // Then update with data status
      this.updateDateDataStatus(wellnessLoaded, supplementsLoaded);

      // Hide loading state
      this.showDateLoadingState(false);
    } catch (error) {
      logger.error("Failed to load date data:", error);
      this.updateDateStatus(); // Restore date status on error
      this.showDateLoadingState(false);
    }
  }

  showDateLoadingState(loading) {
    const info = document.getElementById("date-info");
    if (info) {
      if (loading) {
        info.classList.add("loading");
        // Don't overwrite text, just add loading class
      } else {
        info.classList.remove("loading");
      }
    }
  }

  updateDateDataStatus(wellnessLoaded, supplementsLoaded) {
    const info = document.getElementById("date-info");
    if (!info) return;

    const hasWellness = wellnessLoaded && Object.values(this.wellnessData).some(v => v !== null);
    const hasSupplements = supplementsLoaded && Object.values(this.supplements).some(s => s.taken);

    // Remove any existing status classes
    info.classList.remove("has-data", "no-data");

    // Update info with data status
    let statusText = "";
    if (hasWellness && hasSupplements) {
      statusText = " • Complete";
      info.classList.add("has-data");
    } else if (hasWellness || hasSupplements) {
      statusText = " • Partial";
      info.classList.add("has-data");
    } else {
      statusText = " • No data";
      info.classList.add("no-data");
    }

    // Preserve the date display text (from updateDateStatus) and append status
    // Remove any existing status text first
    let currentText = info.textContent;
    const statusMatch = currentText.match(/^(.+?)(\s•\s.+)$/);
    if (statusMatch) {
      currentText = statusMatch[1]; // Keep only the date part
    }

    // Append new status
    info.textContent = currentText + statusText;
  }

  async loadWellnessForDate(dateStr) {
    try {
      const user = authManager.getCurrentUser();
      if (!user) return false;

      // Try API first
      try {
        const response = await apiClient.get(API_ENDPOINTS.wellness.checkin, { date: dateStr });
        if (response && response.data) {
          const wellness = response.data;
          this.wellnessData = {
            energy: wellness.energy || null,
            sleep: wellness.sleep || null,
            mood: wellness.mood || null,
            trainingLoad: wellness.trainingLoad || null,
          };
          this.updateWellnessUI();
          return true; // Data loaded
        }
      } catch (apiError) {
        // Fallback to localStorage
        logger.warn("API unavailable, loading from localStorage:", apiError);
      }

      // Load from localStorage
      const saved = JSON.parse(localStorage.getItem("wellnessCheckIns") || "[]");
      const wellnessForDate = saved.find((w) => w.date === dateStr);

      if (wellnessForDate) {
        this.wellnessData = {
          energy: wellnessForDate.energy || null,
          sleep: wellnessForDate.sleep || null,
          mood: wellnessForDate.mood || null,
          trainingLoad: wellnessForDate.trainingLoad || null,
        };
        this.updateWellnessUI();
        return true; // Data loaded
      } else {
        // No data for this date - set to null
        this.wellnessData = {
          energy: null,
          sleep: null,
          mood: null,
          trainingLoad: null,
        };
        this.updateWellnessUI();
        return false; // No data found
      }
    } catch (error) {
      logger.error("Failed to load wellness for date:", error);
      // Set to null on error
      this.wellnessData = {
        energy: null,
        sleep: null,
        mood: null,
        trainingLoad: null,
      };
      this.updateWellnessUI();
      return false;
    }
  }

  updateWellnessUI() {
    const sliders = [
      { id: "energy-slider", key: "energy" },
      { id: "sleep-slider", key: "sleep" },
      { id: "mood-slider", key: "mood" },
      { id: "training-load-slider", key: "trainingLoad" },
    ];

    sliders.forEach(({ id, key }) => {
      const slider = document.getElementById(id);
      const valueDisplay = slider?.parentElement.querySelector(".slider-value");
      if (slider && valueDisplay) {
        const value = this.wellnessData[key];
        if (value !== null && value !== undefined) {
          slider.value = value;
          valueDisplay.textContent = value;
        } else {
          // Reset to default midpoint if no data
          slider.value = 5;
          valueDisplay.textContent = "—";
        }
      }
    });
  }

  async loadSupplementsForDate(dateStr) {
    try {
      const user = authManager.getCurrentUser();
      if (!user) return false;

      // Reset all supplements to false
      Object.keys(this.supplements).forEach((key) => {
        this.supplements[key] = { taken: false, time: null };
      });

      let hasData = false;

      // Try API first
      try {
        const response = await apiClient.get(API_ENDPOINTS.supplements.log, { date: dateStr });
        if (response && response.data && Array.isArray(response.data)) {
          response.data.forEach((log) => {
            if (log.supplement && this.supplements[log.supplement]) {
              this.supplements[log.supplement] = {
                taken: log.taken || false,
                time: log.timestamp || null,
              };
              if (log.taken) hasData = true;
            }
          });
          this.updateSupplementsUI();
          return hasData;
        }
      } catch (apiError) {
        // Fallback to localStorage
        logger.warn("API unavailable, loading from localStorage:", apiError);
      }

      // Load from localStorage
      const saved = JSON.parse(localStorage.getItem("supplementLogs") || "[]");
      const supplementsForDate = saved.filter((s) => {
        const logDate = s.date || (s.timestamp ? new Date(s.timestamp).toISOString().split("T")[0] : null);
        return logDate === dateStr && s.taken;
      });

      supplementsForDate.forEach((log) => {
        if (log.supplement && this.supplements[log.supplement]) {
          this.supplements[log.supplement] = {
            taken: true,
            time: log.timestamp || null,
          };
          hasData = true;
        }
      });

      this.updateSupplementsUI();
      return hasData;
    } catch (error) {
      logger.error("Failed to load supplements for date:", error);
      // Reset all to false on error
      Object.keys(this.supplements).forEach((key) => {
        this.supplements[key] = { taken: false, time: null };
      });
      this.updateSupplementsUI();
      return false;
    }
  }

  updateSupplementsUI() {
    const supplementItems = document.querySelectorAll(".supplement-item");
    supplementItems.forEach((item) => {
      const supplementKey = item.getAttribute("data-supplement");
      const toggleInput = item.querySelector(".supplement-toggle-input");

      if (toggleInput && supplementKey && this.supplements[supplementKey]) {
        toggleInput.checked = this.supplements[supplementKey].taken || false;
      }
    });
  }

  loadSavedData() {
    // This method is now replaced by loadDateData()
    // Keeping for backward compatibility but redirecting to loadDateData
    this.loadDateData();
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `dashboard-notification dashboard-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
    `;

    // Add animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    if (!document.getElementById("dashboard-notification-styles")) {
      style.id = "dashboard-notification-styles";
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
}

// Initialize dashboard page when script loads
const dashboardPage = new DashboardPage();

// Export for potential external use
export default dashboardPage;

