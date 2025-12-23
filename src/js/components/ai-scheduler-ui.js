/**
 * AI Training Scheduler UI Component
 * Provides interface for uploading schedules and viewing AI-generated training plans
 */

import { aiTrainingScheduler } from "../services/aiTrainingScheduler.js";
import { playerProfileService } from "../services/playerProfileService.js";

class AISchedulerUI {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.currentProfile = null;
    this.currentSchedule = null;
  }

  /**
   * Initialize the UI
   */
  async init() {
    if (!this.container) {
      console.error("Container not found:", this.containerId || "unknown");
      return;
    }

    // Load current profile
    this.currentProfile = playerProfileService.getCurrentProfile();
    
    this.render();
  }

  /**
   * Render the main UI
   */
  render() {
    this.container.innerHTML = `
      <div class="ai-scheduler-container">
        <div class="scheduler-header">
          <h2>🤖 AI-Powered Training Scheduler</h2>
          <p class="subtitle">Intelligently adjust your training based on tournaments, practices, and games</p>
        </div>

        <div class="scheduler-content">
          <!-- Player Profile Section -->
          <div class="profile-section card">
            <h3>Player Profile</h3>
            ${this.renderProfileSection()}
          </div>

          <!-- Schedule Upload Section -->
          <div class="upload-section card">
            <h3>Upload Your Schedule</h3>
            ${this.renderUploadSection()}
          </div>

          <!-- Schedule Generation Section -->
          <div class="generation-section card">
            <h3>Generate Training Schedule</h3>
            ${this.renderGenerationSection()}
          </div>

          <!-- Generated Schedule Display -->
          <div id="schedule-display" class="schedule-display card" style="display: none;">
            ${this.renderScheduleDisplay()}
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render profile section
   */
  renderProfileSection() {
    if (this.currentProfile) {
      return `
        <div class="profile-info">
          <p><strong>Name:</strong> ${this.currentProfile.name}</p>
          <p><strong>Jersey:</strong> #${this.currentProfile.jerseyNumber}</p>
          <p><strong>Position:</strong> ${this.currentProfile.position}</p>
          <p><strong>Practices:</strong> ${this.currentProfile.practices.length}</p>
          <p><strong>League Games:</strong> ${this.currentProfile.leagueGames.length}</p>
          <button id="edit-profile-btn" class="btn btn-secondary">Edit Profile</button>
        </div>
      `;
    }

    return `
      <div class="profile-form">
        <div class="form-group">
          <label>Name:</label>
          <input type="text" id="player-name" placeholder="e.g., Aljoša Kous" />
        </div>
        <div class="form-group">
          <label>Jersey Number:</label>
          <input type="number" id="jersey-number" placeholder="e.g., 55" />
        </div>
        <div class="form-group">
          <label>Position:</label>
          <select id="player-position">
            <option value="WR/DB">WR/DB</option>
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="OL/DL">OL/DL</option>
          </select>
        </div>
        <button id="create-profile-btn" class="btn btn-primary">Create Profile</button>
        <button id="load-example-btn" class="btn btn-secondary">Load Example (Aljoša Kous)</button>
      </div>
    `;
  }

  /**
   * Render upload section
   */
  renderUploadSection() {
    return `
      <div class="upload-options">
        <p>Upload your schedule file (CSV, Excel, or Markdown) or manually add events:</p>
        
        <div class="file-upload-area">
          <input type="file" id="schedule-file-input" accept=".csv,.xlsx,.xls,.md,.markdown" />
          <label for="schedule-file-input" class="file-upload-label">
            📁 Choose File or Drag & Drop
          </label>
          <div id="file-info" class="file-info"></div>
        </div>

        <div class="manual-entry">
          <h4>Or Add Events Manually</h4>
          <div class="form-group">
            <label>Event Type:</label>
            <select id="event-type">
              <option value="flag_practice">Flag Practice</option>
              <option value="technique_training">Technique Training</option>
              <option value="league_game">League Game</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date:</label>
            <input type="date" id="event-date" />
          </div>
          <div class="form-group" id="league-fields" style="display: none;">
            <label>League:</label>
            <input type="text" id="league-name" placeholder="e.g., Austrian League" />
            <label>Opponent:</label>
            <input type="text" id="opponent-name" placeholder="Optional" />
          </div>
          <button id="add-event-btn" class="btn btn-primary">Add Event</button>
        </div>
      </div>
    `;
  }

  /**
   * Render generation section
   */
  renderGenerationSection() {
    // Set default dates based on program if not already set
    const defaultStart = '2025-12-01';
    const defaultEnd = '2026-10-31';
    
    return `
      <div class="generation-controls">
        <div class="form-group">
          <label>Start Date:</label>
          <input type="date" id="schedule-start-date" value="${defaultStart}" />
        </div>
        <div class="form-group">
          <label>End Date:</label>
          <input type="date" id="schedule-end-date" value="${defaultEnd}" />
        </div>
        <div class="u-margin-bottom-16">
          <p class="u-text-body-sm u-text-secondary">
            <i data-lucide="info" class="icon-14 icon-inline"></i>
            The scheduler will automatically adjust training based on tournaments, practices, and games in your schedule.
          </p>
        </div>
        <button id="generate-schedule-btn" class="btn btn-primary btn-large">
          <i data-lucide="sparkles" class="icon-16 icon-inline"></i>
          Generate AI Training Schedule
        </button>
        <div id="generation-status" class="status-message"></div>
      </div>
    `;
  }

  /**
   * Render schedule display
   */
  renderScheduleDisplay() {
    if (!this.currentSchedule) {
      return "<p>No schedule generated yet.</p>";
    }

    return `
      <div class="schedule-header">
        <h3>Your Personalized Training Schedule</h3>
        <div class="schedule-actions">
          <button id="export-json-btn" class="btn btn-secondary">Export JSON</button>
          <button id="export-csv-btn" class="btn btn-secondary">Export CSV</button>
          <button id="export-ical-btn" class="btn btn-secondary">Export iCal</button>
        </div>
      </div>
      
      <div class="schedule-summary">
        <h4>Summary</h4>
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-label">Total Weeks:</span>
            <span class="stat-value">${this.currentSchedule.summary.totalWeeks}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Training Days:</span>
            <span class="stat-value">${this.currentSchedule.summary.totalTrainingDays}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Rest Days:</span>
            <span class="stat-value">${this.currentSchedule.summary.totalRestDays}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Practice Days:</span>
            <span class="stat-value">${this.currentSchedule.summary.totalPracticeDays}</span>
          </div>
        </div>
      </div>

      <div class="schedule-weeks">
        ${this.renderWeeks()}
      </div>
    `;
  }

  /**
   * Render weeks
   */
  renderWeeks() {
    return this.currentSchedule.weeks.map(week => `
      <div class="schedule-week">
        <div class="week-header">
          <h4>Week ${week.weekNumber} - ${week.phase.replace(/_/g, " ").toUpperCase()}</h4>
          <span class="week-dates">
            ${week.startDate.toLocaleDateString()} - ${week.endDate.toLocaleDateString()}
          </span>
        </div>
        <div class="week-summary">
          <span>Training: ${week.summary.trainingDays} days</span>
          <span>Rest: ${week.summary.restDays} days</span>
          <span>Practices: ${week.summary.practiceDays} days</span>
        </div>
        <div class="week-days">
          ${week.days.map(day => this.renderDay(day)).join("")}
        </div>
      </div>
    `).join("");
  }

  /**
   * Render day
   */
  renderDay(day) {
    const activities = day.activities.map(a => {
      if (a.type === "tournament") {
        return `<span class="activity-tag tournament">🏆 ${a.name}</span>`;
      }
      if (a.type === "league_game") {
        return `<span class="activity-tag league-game">⚽ ${a.league}</span>`;
      }
      if (a.type.includes("practice")) {
        return `<span class="activity-tag practice">🏈 ${a.type}</span>`;
      }
      return `<span class="activity-tag">${a.type}</span>`;
    }).join("");

    const trainingClass = day.training?.volume === 0 ? "rest-day" : "training-day";
    const volumePercent = Math.round((day.training?.volume || 0) * 100);
    const intensityPercent = Math.round((day.training?.intensity || 0) * 100);

    return `
      <div class="schedule-day ${trainingClass}">
        <div class="day-header">
          <span class="day-name">${day.dayName}</span>
          <span class="day-date">${day.date.toLocaleDateString()}</span>
        </div>
        ${activities ? `<div class="day-activities">${activities}</div>` : ""}
        ${day.training ? `
          <div class="day-training">
            <div class="training-title">${day.training.title}</div>
            <div class="training-metrics">
              <span>Volume: ${volumePercent}%</span>
              <span>Intensity: ${intensityPercent}%</span>
            </div>
            ${day.adjustments.length > 0 ? `
              <div class="training-adjustments">
                ${day.adjustments.map(adj => `
                  <div class="adjustment">
                    <span class="adjustment-reason">${adj.reason}</span>
                  </div>
                `).join("")}
              </div>
            ` : ""}
          </div>
        ` : ""}
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Profile creation
    const createProfileBtn = document.getElementById("create-profile-btn");
    if (createProfileBtn) {
      createProfileBtn.addEventListener("click", () => this.handleCreateProfile());
    }

    // Load example profile
    const loadExampleBtn = document.getElementById("load-example-btn");
    if (loadExampleBtn) {
      loadExampleBtn.addEventListener("click", () => this.handleLoadExample());
    }

    // File upload
    const fileInput = document.getElementById("schedule-file-input");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => this.handleFileUpload(e));
    }

    // Event type change
    const eventTypeSelect = document.getElementById("event-type");
    if (eventTypeSelect) {
      eventTypeSelect.addEventListener("change", (e) => {
        const leagueFields = document.getElementById("league-fields");
        if (e.target.value === "league_game") {
          leagueFields.style.display = "block";
        } else {
          leagueFields.style.display = "none";
        }
      });
    }

    // Add event
    const addEventBtn = document.getElementById("add-event-btn");
    if (addEventBtn) {
      addEventBtn.addEventListener("click", () => this.handleAddEvent());
    }

    // Generate schedule
    const generateBtn = document.getElementById("generate-schedule-btn");
    if (generateBtn) {
      generateBtn.addEventListener("click", () => this.handleGenerateSchedule());
    }

    // Export buttons
    const exportJsonBtn = document.getElementById("export-json-btn");
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", () => this.handleExport("json"));
    }

    const exportCsvBtn = document.getElementById("export-csv-btn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => this.handleExport("csv"));
    }

    const exportIcalBtn = document.getElementById("export-ical-btn");
    if (exportIcalBtn) {
      exportIcalBtn.addEventListener("click", () => this.handleExport("ical"));
    }
  }

  /**
   * Handle create profile
   */
  handleCreateProfile() {
    const name = document.getElementById("player-name")?.value;
    const jerseyNumber = document.getElementById("jersey-number")?.value;
    const position = document.getElementById("player-position")?.value;

    if (!name || !jerseyNumber) {
      alert("Please fill in name and jersey number");
      return;
    }

    const profile = playerProfileService.savePlayerProfile({
      name,
      jerseyNumber: parseInt(jerseyNumber),
      position,
    });

    playerProfileService.setCurrentProfile(profile.id);
    this.currentProfile = profile;
    this.render();
  }

  /**
   * Handle load example
   */
  handleLoadExample() {
    const exampleProfile = playerProfileService.createExampleProfile();
    playerProfileService.savePlayerProfile(exampleProfile);
    playerProfileService.setCurrentProfile(exampleProfile.id);
    this.currentProfile = exampleProfile;
    this.render();
  }

  /**
   * Handle file upload
   */
  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {return;}

    if (!this.currentProfile) {
      alert("Please create a player profile first");
      return;
    }

    try {
      await playerProfileService.parseAndAddSchedule(this.currentProfile.id, file);
      this.currentProfile = playerProfileService.getPlayerProfile(this.currentProfile.id);
      this.render();
      alert("Schedule uploaded successfully!");
    } catch (error) {
      alert("Error uploading schedule: " + error.message);
    }
  }

  /**
   * Handle add event
   */
  handleAddEvent() {
    if (!this.currentProfile) {
      alert("Please create a player profile first");
      return;
    }

    const eventType = document.getElementById("event-type")?.value;
    const eventDate = document.getElementById("event-date")?.value;

    if (!eventDate) {
      alert("Please select a date");
      return;
    }

    if (eventType === "league_game") {
      const league = document.getElementById("league-name")?.value;
      const opponent = document.getElementById("opponent-name")?.value;

      playerProfileService.addLeagueGame(this.currentProfile.id, {
        date: eventDate,
        league: league || "Unknown League",
        opponent: opponent || "",
        location: "",
        gameDay: 1,
        maxGames: 3,
      });
    } else {
      playerProfileService.addPractice(this.currentProfile.id, {
        date: eventDate,
        type: eventType,
        duration: 120,
        intensity: "medium",
      });
    }

    this.currentProfile = playerProfileService.getPlayerProfile(this.currentProfile.id);
    this.render();
    alert("Event added successfully!");
  }

  /**
   * Handle generate schedule
   */
  handleGenerateSchedule() {
    if (!this.currentProfile) {
      alert("Please create a player profile first");
      return;
    }

    const startDate = document.getElementById("schedule-start-date")?.value;
    const endDate = document.getElementById("schedule-end-date")?.value;

    if (!startDate || !endDate) {
      alert("Please select start and end dates");
      return;
    }

    const statusEl = document.getElementById("generation-status");
    if (statusEl) {
      statusEl.textContent = "Generating schedule...";
      statusEl.className = "status-message loading";
    }

    try {
      const schedule = aiTrainingScheduler.generatePersonalizedSchedule(
        this.currentProfile,
        new Date(startDate),
        new Date(endDate)
      );

      this.currentSchedule = schedule;
      
      // Update the schedule display with the rendered HTML
      const scheduleDisplayEl = document.getElementById("schedule-display");
      if (scheduleDisplayEl) {
        scheduleDisplayEl.innerHTML = this.renderScheduleDisplay();
        scheduleDisplayEl.style.display = "block";
      }

      // Sync with training schedule page
      this.syncWithTrainingSchedule();

      if (statusEl) {
        statusEl.textContent = "Schedule generated successfully! You can now export or sync with your training schedule.";
        statusEl.className = "status-message success";
      }

      // Re-initialize Lucide icons
      if (typeof lucide !== "undefined") {
        requestAnimationFrame(() => {
          lucide.createIcons();
        });
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
      if (statusEl) {
        statusEl.textContent = "Error generating schedule: " + error.message;
        statusEl.className = "status-message error";
      }
    }
  }

  /**
   * Handle export
   */
  handleExport(format) {
    if (!this.currentSchedule) {
      alert("No schedule to export");
      return;
    }

    const exported = aiTrainingScheduler.exportSchedule(this.currentSchedule, format);
    const blob = new Blob([exported], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `training-schedule-${new Date().toISOString().split("T")[0]}.${format === "ical" ? "ics" : format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Get current schedule for export/sync
   */
  getCurrentSchedule() {
    return this.currentSchedule;
  }

  /**
   * Sync generated schedule with training schedule page
   */
  syncWithTrainingSchedule() {
    if (!this.currentSchedule) {
      console.warn('No schedule generated yet');
      return;
    }

    // Store schedule in localStorage for training-schedule.html to use
    localStorage.setItem('aiGeneratedSchedule', JSON.stringify(this.currentSchedule));
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('aiScheduleGenerated', {
      detail: this.currentSchedule
    }));

    console.log('Schedule synced with training schedule page');
  }
}

// Export class
export default AISchedulerUI;

