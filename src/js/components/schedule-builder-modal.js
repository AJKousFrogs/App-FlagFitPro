/**
 * Schedule Builder Modal Component
 * Specialized modal for building custom training schedules
 * Enhanced with file upload, calendar-based game day selection, and AI training adjustments
 */

import Modal from "./modal.js";
import { scheduleFileParser } from "../services/scheduleFileParser.js";
import { storageService } from "../services/storage-service-unified.js";
import { setSafeContent } from "../utils/shared.js";
import { logger } from "../../logger.js";

class ScheduleBuilderModal extends Modal {
  constructor(options = {}) {
    super({
      id: "schedule-builder-modal",
      title:
        '<i data-lucide="calendar-plus" style="width: 24px; height: 24px; display: inline-block; vertical-align: middle;"></i> Build Your Custom Training Schedule',
      closeOnBackdrop: true,
      closeOnEscape: true,
      ...options,
    });
    this.onSave = options.onSave || null;
    this.scheduleSettings = null;
    this.uploadedSchedule = null;
    this.selectedGameDays = new Set();
    this.currentView = "manual"; // "manual" or "upload"
  }

  /**
   * Create schedule builder form content with enhanced UX
   */
  createFormContent() {
    const schedule =
      this.scheduleSettings || storageService.getScheduleSettings();
    const commonTimezones = [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Phoenix",
      "America/Anchorage",
      "Pacific/Honolulu",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Rome",
      "Europe/Madrid",
      "Europe/Amsterdam",
      "Europe/Stockholm",
      "Europe/Ljubljana",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Hong_Kong",
      "Asia/Singapore",
      "Asia/Dubai",
      "Asia/Kolkata",
      "Australia/Sydney",
      "Australia/Melbourne",
      "America/Toronto",
      "America/Vancouver",
      "America/Mexico_City",
      "America/Sao_Paulo",
      "America/Buenos_Aires",
    ];
    const currentTz =
      schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    let timezoneOptions = commonTimezones
      .map(
        (tz) =>
          `<option value="${tz}" ${tz === currentTz ? "selected" : ""}>${tz.replace("_", " ")}${tz === currentTz ? " (Current)" : ""}</option>`,
      )
      .join("");
    if (!commonTimezones.includes(currentTz)) {
      timezoneOptions =
        `<option value="${currentTz}" selected>${currentTz.replace("_", " ")} (Current)</option>` +
        timezoneOptions;
    }

    // Initialize selected game days from schedule
    if (schedule.gameDays && Array.isArray(schedule.gameDays)) {
      schedule.gameDays.forEach((gd) => {
        if (gd.date) {
          this.selectedGameDays.add(gd.date);
        } else if (gd.dayOfWeek !== undefined) {
          // Convert day of week to dates for current month
          this.addDayOfWeekToSelected(gd.dayOfWeek);
        }
      });
    } else if (schedule.gameDay) {
      // Legacy format: single day
      const dayMap = { saturday: 6, sunday: 0 };
      if (dayMap[schedule.gameDay] !== undefined) {
        this.addDayOfWeekToSelected(dayMap[schedule.gameDay]);
      }
    }

    return `
            <div class="schedule-builder-container">
                <!-- Tab Navigation -->
                <div class="schedule-tabs">
                    <button type="button" class="schedule-tab ${this.currentView === "manual" ? "active" : ""}" data-view="manual">
                        <i data-lucide="calendar" style="width: 18px; height: 18px;"></i>
                        Manual Setup
                    </button>
                    <button type="button" class="schedule-tab ${this.currentView === "upload" ? "active" : ""}" data-view="upload">
                        <i data-lucide="upload" style="width: 18px; height: 18px;"></i>
                        Upload Schedule
                    </button>
                </div>

                <!-- Manual Setup View -->
                <div class="schedule-view" id="manual-view" style="display: ${this.currentView === "manual" ? "block" : "none"};">
                    <form class="schedule-builder-form" id="schedule-builder-form">
                        <!-- Game Day Selection -->
                        <div class="form-group">
                            <label class="form-label">
                                <i data-lucide="calendar-days" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle;"></i>
                                Select Your Game Days
                            </label>
                            <p style="font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: var(--space-3);">
                                Click on dates in the calendar below to mark game days. The AI training assistant will automatically adjust your training schedule.
                            </p>
                            
                            <!-- Calendar for Game Day Selection -->
                            <div class="game-day-calendar" id="game-day-calendar">
                                ${this.createCalendarHTML()}
                            </div>

                            <!-- Quick Day Selector (for recurring weekly games) -->
                            <div class="quick-day-selector" style="margin-top: var(--space-4);">
                                <label class="form-label" style="font-size: var(--text-sm); margin-bottom: var(--space-2);">
                                    Or select recurring game days:
                                </label>
                                <div class="game-day-selector">
                                    <div class="game-day-option ${schedule.gameDay === null ? "selected" : ""}"
                                         data-game-day="null">
                                        No Games
                                    </div>
                                    <div class="game-day-option ${schedule.gameDay === "saturday" ? "selected" : ""}"
                                         data-game-day="saturday">
                                        Saturday
                                    </div>
                                    <div class="game-day-option ${schedule.gameDay === "sunday" ? "selected" : ""}"
                                         data-game-day="sunday">
                                        Sunday
                                    </div>
                                </div>
                            </div>

                            <input type="hidden" id="selected-game-day" value="${schedule.gameDay || ""}">
                            <input type="hidden" id="selected-game-dates" value="${Array.from(this.selectedGameDays).join(",")}">
                            
                            <div class="info-box" style="margin-top: var(--space-3); padding: var(--space-3); background: var(--color-info-subtle, rgba(59, 130, 246, 0.1)); border-radius: var(--radius-md); border-left: 3px solid var(--color-info, #3b82f6);">
                                <p style="font-size: var(--text-xs); color: var(--text-secondary); margin: 0;">
                                    <strong>💡 AI Training Adjustments:</strong><br>
                                    • <strong>Sunday games:</strong> No sprint training on Saturday<br>
                                    • <strong>Saturday games:</strong> No sprint training on Sunday or Friday<br>
                                    • Training automatically adjusts to lighter recovery workload before game days
                                </p>
                            </div>
                        </div>

                        <!-- Timezone Selection -->
                        <div class="form-group">
                            <label class="form-label" for="timezone-select">
                                <i data-lucide="globe" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle;"></i>
                                Timezone
                            </label>
                            <select class="form-select" id="timezone-select">
                                ${timezoneOptions}
                            </select>
                            <p style="font-size: var(--text-xs); color: var(--text-secondary); margin-top: var(--space-1);">
                                Your schedule times will adjust based on your timezone
                            </p>
                        </div>

                        <!-- Preferences -->
                        <div class="form-group">
                            <label for="include-mobility" style="display: flex; align-items: center; gap: var(--space-2); cursor: pointer;">
                                <input type="checkbox" id="include-mobility" ${schedule.preferences?.includeMobility ? "checked" : ""} style="width: 18px; height: 18px;">
                                <span class="form-label" style="margin: 0;">
                                    Include 15-minute morning mobility drill and foam rolling
                                </span>
                            </label>
                        </div>
                    </form>
                </div>

                <!-- Upload View -->
                <div class="schedule-view" id="upload-view" style="display: ${this.currentView === "upload" ? "block" : "none"};">
                    <div class="upload-section">
                        <div class="file-upload-area" id="file-upload-area">
                            <div class="file-upload-content">
                                <i data-lucide="file-up" style="width: 48px; height: 48px; color: var(--color-brand-primary); margin-bottom: var(--space-3);"></i>
                                <h3 style="font-size: var(--text-lg); font-weight: var(--font-semibold); margin-bottom: var(--space-2);">
                                    Upload Your Training Schedule
                                </h3>
                                <p style="font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-4);">
                                    Drag and drop your schedule file here, or click to browse
                                </p>
                                <p style="font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-2);">
                                    Supported formats: CSV, Excel (.xlsx, .xls), Markdown (.md)
                                </p>
                                <label for="schedule-file-input" class="sr-only">Upload training schedule file</label>
                                <input type="file" id="schedule-file-input" accept=".csv,.xlsx,.xls,.md" aria-label="Upload training schedule file" style="display: none;">
                                <button type="button" class="btn btn-primary" id="browse-files-btn" aria-describedby="file-upload-description">
                                    <i data-lucide="folder-open" style="width: 16px; height: 16px;"></i>
                                    Browse Files
                                </button>
                                <span id="file-upload-description" class="sr-only">Click to select a training schedule file from your device</span>
                            </div>
                        </div>

                        <div id="uploaded-file-info" style="display: none; margin-top: var(--space-4); padding: var(--space-4); background: var(--surface-secondary); border-radius: var(--radius-md);">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
                                <div>
                                    <strong id="uploaded-file-name"></strong>
                                    <p style="font-size: var(--text-xs); color: var(--text-secondary); margin-top: var(--space-1);">
                                        <span id="uploaded-file-stats"></span>
                                    </p>
                                </div>
                                <button type="button" class="btn btn-secondary btn-sm" id="remove-file-btn">
                                    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                                    Remove
                                </button>
                            </div>
                            <div id="upload-preview"></div>
                        </div>

                        <div class="info-box" style="margin-top: var(--space-4); padding: var(--space-3); background: var(--color-info-subtle, rgba(59, 130, 246, 0.1)); border-radius: var(--radius-md); border-left: 3px solid var(--color-info, #3b82f6);">
                            <p style="font-size: var(--text-xs); color: var(--text-secondary); margin: 0;">
                                <strong>📋 File Format Guide:</strong><br>
                                Your file should include columns for: <strong>Date</strong>, <strong>Workout Type</strong>, <strong>Duration</strong>, and optionally <strong>Game Day</strong> (mark as "Yes" or "True" for game days)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * Create calendar HTML for game day selection
   */
  createCalendarHTML() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let html = `
      <div class="calendar-header">
        <button type="button" class="calendar-nav-btn" id="prev-month-btn">
          <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
        </button>
        <h3 style="font-size: var(--text-lg); font-weight: var(--font-semibold); margin: 0;">
          ${monthNames[currentMonth]} ${currentYear}
        </h3>
        <button type="button" class="calendar-nav-btn" id="next-month-btn">
          <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-weekdays">
          ${dayNames.map((day) => `<div class="calendar-weekday">${day}</div>`).join("")}
        </div>
        <div class="calendar-days">
    `;

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isSelected = this.selectedGameDays.has(dateStr);
      const isToday =
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

      html += `
        <div class="calendar-day ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}" 
             data-date="${dateStr}" 
             data-day="${day}">
          ${day}
          ${isSelected ? '<i data-lucide="check" style="width: 14px; height: 14px;"></i>' : ""}
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Add day of week to selected game days (for current month)
   */
  addDayOfWeekToSelected(dayOfWeek) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() === dayOfWeek) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        this.selectedGameDays.add(dateStr);
      }
    }
  }

  /**
   * Create footer with action buttons
   */
  createFooter() {
    return `
            <button type="button" class="btn btn-secondary" data-modal-cancel>
                Cancel
            </button>
            <button type="submit" class="btn btn-primary" form="schedule-builder-form" data-modal-save>
                <i data-lucide="save" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i>
                Save Schedule
            </button>
        `;
  }

  /**
   * Open modal with schedule settings
   */
  open(scheduleSettings = null) {
    this.scheduleSettings =
      scheduleSettings || storageService.getScheduleSettings();
    this.content = this.createFormContent();
    this.footer = this.createFooter();
    super.open();
    this.setupFormEvents();
  }

  /**
   * Set up form-specific event handlers
   */
  setupFormEvents() {
    if (!this.modalElement) {
      return;
    }

    // Tab switching
    const tabs = this.modalElement.querySelectorAll(".schedule-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const view = tab.getAttribute("data-view");
        this.switchView(view);
      });
    });

    // Calendar day selection
    this.setupCalendarEvents();

    // Quick game day selector (legacy)
    const gameDayOptions =
      this.modalElement.querySelectorAll(".game-day-option");
    gameDayOptions.forEach((option) => {
      option.addEventListener("click", () => {
        gameDayOptions.forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");
        const gameDay = option.getAttribute("data-game-day");
        const dayInput = document.getElementById("selected-game-day");
        if (dayInput) {
          dayInput.value = gameDay === "null" ? "" : gameDay;
        }

        // Update calendar if selecting recurring day
        if (gameDay !== "null") {
          const dayMap = { saturday: 6, sunday: 0 };
          if (dayMap[gameDay] !== undefined) {
            this.selectedGameDays.clear();
            this.addDayOfWeekToSelected(dayMap[gameDay]);
            this.updateCalendarDisplay();
          }
        } else {
          this.selectedGameDays.clear();
          this.updateCalendarDisplay();
        }
      });
    });

    // File upload handlers
    this.setupFileUploadEvents();

    // Form submission
    const form = this.modalElement.querySelector("#schedule-builder-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSave();
      });
    }

    // Cancel button
    const cancelBtn = this.modalElement.querySelector("[data-modal-cancel]");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.close());
    }

    // Initialize icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  /**
   * Switch between manual and upload views
   */
  switchView(view) {
    this.currentView = view;

    // Update tabs
    const tabs = this.modalElement.querySelectorAll(".schedule-tab");
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-view") === view);
    });

    // Update views
    const manualView = this.modalElement.querySelector("#manual-view");
    const uploadView = this.modalElement.querySelector("#upload-view");

    if (manualView) {
      manualView.style.display = view === "manual" ? "block" : "none";
    }
    if (uploadView) {
      uploadView.style.display = view === "upload" ? "block" : "none";
    }

    // Re-initialize icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  /**
   * Set up calendar event handlers
   */
  setupCalendarEvents() {
    const calendar = this.modalElement.querySelector("#game-day-calendar");
    if (!calendar) {
      return;
    }

    // Day click handlers
    const dayElements = calendar.querySelectorAll(".calendar-day:not(.empty)");
    dayElements.forEach((dayEl) => {
      dayEl.addEventListener("click", () => {
        const date = dayEl.getAttribute("data-date");
        if (date) {
          if (this.selectedGameDays.has(date)) {
            this.selectedGameDays.delete(date);
          } else {
            this.selectedGameDays.add(date);
          }
          this.updateCalendarDisplay();

          // Update hidden input
          const datesInput = document.getElementById("selected-game-dates");
          if (datesInput) {
            datesInput.value = Array.from(this.selectedGameDays).join(",");
          }
        }
      });
    });

    // Month navigation (simplified - would need full implementation for multi-month)
    const prevBtn = calendar.querySelector("#prev-month-btn");
    const nextBtn = calendar.querySelector("#next-month-btn");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        // TODO: Implement month navigation
        logger.debug("Previous month");
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        // TODO: Implement month navigation
        logger.debug("Next month");
      });
    }
  }

  /**
   * Update calendar display with selected days
   */
  updateCalendarDisplay() {
    const calendar = this.modalElement.querySelector("#game-day-calendar");
    if (!calendar) {
      return;
    }

    const dayElements = calendar.querySelectorAll(".calendar-day:not(.empty)");
    dayElements.forEach((dayEl) => {
      const date = dayEl.getAttribute("data-date");
      if (date) {
        if (this.selectedGameDays.has(date)) {
          dayEl.classList.add("selected");
          if (!dayEl.querySelector("i[data-lucide='check']")) {
            // Use DOM methods instead of innerHTML
            const dayText = dayEl.getAttribute("data-day");
            dayEl.textContent = "";
            dayEl.appendChild(document.createTextNode(dayText + " "));
            const checkIcon = document.createElement("i");
            checkIcon.setAttribute("data-lucide", "check");
            checkIcon.style.cssText = "width: 14px; height: 14px;";
            dayEl.appendChild(checkIcon);
            if (typeof lucide !== "undefined") {
              lucide.createIcons();
            }
          }
        } else {
          dayEl.classList.remove("selected");
          // Use textContent instead of innerHTML for plain text
          dayEl.textContent = dayEl.getAttribute("data-day");
        }
      }
    });
  }

  /**
   * Set up file upload event handlers
   */
  setupFileUploadEvents() {
    const uploadArea = this.modalElement.querySelector("#file-upload-area");
    const fileInput = this.modalElement.querySelector("#schedule-file-input");
    const browseBtn = this.modalElement.querySelector("#browse-files-btn");
    const removeBtn = this.modalElement.querySelector("#remove-file-btn");

    if (!uploadArea || !fileInput || !browseBtn) {
      return;
    }

    // Browse button
    browseBtn.addEventListener("click", () => {
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFileUpload(file);
      }
    });

    // Drag and drop
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");

      const file = e.dataTransfer.files[0];
      if (file) {
        this.handleFileUpload(file);
      }
    });

    // Remove file
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        this.uploadedSchedule = null;
        fileInput.value = "";
        const fileInfo = this.modalElement.querySelector("#uploaded-file-info");
        if (fileInfo) {
          fileInfo.style.display = "none";
        }
      });
    }
  }

  /**
   * Handle file upload
   */
  async handleFileUpload(file) {
    const fileInfo = this.modalElement.querySelector("#uploaded-file-info");
    const fileName = this.modalElement.querySelector("#uploaded-file-name");
    const fileStats = this.modalElement.querySelector("#uploaded-file-stats");
    const uploadPreview = this.modalElement.querySelector("#upload-preview");

    if (!fileInfo || !fileName || !fileStats) {
      return;
    }

    // Show loading state
    fileName.textContent = `Processing ${file.name}...`;
    fileStats.textContent = "";
    fileInfo.style.display = "block";

    try {
      // Parse file
      const schedule = await scheduleFileParser.parseFile(file);
      scheduleFileParser.validateSchedule(schedule);

      this.uploadedSchedule = schedule;

      // Update UI
      fileName.textContent = file.name;
      fileStats.textContent = `${schedule.gameDays?.length || 0} game days, ${schedule.workouts?.length || 0} workouts found`;

      // Show preview
      if (uploadPreview) {
        let previewHTML =
          "<div style='margin-top: var(--space-3);'><strong>Preview:</strong><ul style='margin-top: var(--space-2); padding-left: var(--space-4);'>";

        if (schedule.gameDays && schedule.gameDays.length > 0) {
          previewHTML += "<li><strong>Game Days:</strong> ";
          previewHTML += schedule.gameDays
            .slice(0, 5)
            .map((gd) => {
              const date = new Date(gd.date);
              return date.toLocaleDateString();
            })
            .join(", ");
          if (schedule.gameDays.length > 5) {
            previewHTML += ` (+${schedule.gameDays.length - 5} more)`;
          }
          previewHTML += "</li>";
        }

        if (schedule.workouts && schedule.workouts.length > 0) {
          previewHTML += `<li><strong>Workouts:</strong> ${schedule.workouts.length} scheduled</li>`;
        }

        previewHTML += "</ul></div>";
        // Use setSafeContent to sanitize HTML before insertion
        setSafeContent(uploadPreview, previewHTML, true, true);
      }

      // Update selected game days from uploaded schedule
      if (schedule.gameDays) {
        schedule.gameDays.forEach((gd) => {
          if (gd.date) {
            this.selectedGameDays.add(gd.date);
          }
        });
        this.updateCalendarDisplay();
      }
    } catch (error) {
      logger.error("Error parsing file:", error);
      fileName.textContent = `Error processing ${file.name}`;
      fileStats.textContent = error.message || "Invalid file format";
      fileStats.style.color = "var(--color-error, #ef4444)";

      if (uploadPreview) {
        // Use setSafeContent to sanitize error message before insertion
        const errorHtml = `<div style='color: var(--color-error, #ef4444); margin-top: var(--space-2);'>${error.message}</div>`;
        setSafeContent(uploadPreview, errorHtml, true, true);
      }
    }
  }

  /**
   * Handle form save
   */
  handleSave() {
    const timezoneEl = document.getElementById("timezone-select");
    const selectedGameDayEl = document.getElementById("selected-game-day");
    const selectedGameDatesEl = document.getElementById("selected-game-dates");
    const includeMobilityEl = document.getElementById("include-mobility");

    // Build schedule object
    const schedule = {
      timezone: timezoneEl
        ? timezoneEl.value
        : Intl.DateTimeFormat().resolvedOptions().timeZone,
      preferences: {
        includeMobility: includeMobilityEl ? includeMobilityEl.checked : true,
        includeFoamRolling: includeMobilityEl
          ? includeMobilityEl.checked
          : true,
      },
    };

    // Handle game days - prefer uploaded schedule or calendar selections
    if (this.uploadedSchedule && this.uploadedSchedule.gameDays) {
      schedule.gameDays = this.uploadedSchedule.gameDays;
      schedule.customSchedule = true;
      schedule.workouts = this.uploadedSchedule.workouts || [];
    } else if (selectedGameDatesEl && selectedGameDatesEl.value) {
      // Calendar-selected dates
      const dates = selectedGameDatesEl.value.split(",").filter((d) => d);
      schedule.gameDays = dates.map((date) => {
        const d = new Date(date);
        return {
          date: date,
          dayOfWeek: d.getDay(),
        };
      });
    } else if (selectedGameDayEl && selectedGameDayEl.value) {
      // Legacy: single recurring day
      schedule.gameDay = selectedGameDayEl.value;
      const dayMap = { saturday: 6, sunday: 0 };
      if (dayMap[schedule.gameDay]) {
        schedule.gameDays = [
          {
            dayOfWeek: dayMap[schedule.gameDay],
          },
        ];
      }
    } else {
      schedule.gameDay = null;
      schedule.gameDays = [];
    }

    const success = storageService.saveScheduleSettings(schedule);

    if (success) {
      // Call onSave callback
      if (this.onSave) {
        this.onSave(schedule);
      }

      this.close();
      this.showSuccessMessage();
    } else {
      alert("Failed to save schedule. Please try again.");
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage() {
    const successMsg = document.createElement("div");
    successMsg.style.cssText =
      "position: fixed; top: 20px; right: 20px; background: var(--color-success); color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: var(--shadow-lg); z-index: 9999;";
    // Use DOM methods instead of innerHTML
    const checkIcon = document.createElement("i");
    checkIcon.setAttribute("data-lucide", "check-circle");
    checkIcon.style.cssText =
      "width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px;";
    const successText = document.createTextNode(
      " Schedule saved successfully!",
    );
    successMsg.appendChild(checkIcon);
    successMsg.appendChild(successText);

    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons(successMsg);
    }
    document.body.appendChild(successMsg);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    setTimeout(() => successMsg.remove(), 3000);
  }
}

export default ScheduleBuilderModal;
