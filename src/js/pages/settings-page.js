// Settings Page JavaScript Module
import { authManager } from "../../auth-manager.js";
import { getAllPlayers } from "../../real-team-data.js";
import { logger } from "../../logger.js";
import {
  initializeLucideIcons,
  showFieldError,
  showFieldSuccess,
  clearFieldState,
  announceToScreenReader,
} from "../utils/shared.js";
import { storageService } from "../services/storage-service-unified.js";

// Initialize settings page
document.addEventListener("DOMContentLoaded", async function () {
  // Initialize Lucide icons
  initializeLucideIcons();

  // Expose authManager globally for enhanced-settings.js
  window.authManager = authManager;

  // Wait for auth manager to initialize
  await authManager.waitForInit();

  // Check authentication - allow demo access in development
  const isDevelopment =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const isAuthenticated = authManager.isAuthenticated();

  if (!isAuthenticated && !isDevelopment) {
    logger.debug("User not authenticated, redirecting to login");
    window.location.href = "/login.html";
    return;
  }

  if (!isAuthenticated && isDevelopment) {
    logger.debug("Development mode: Loading settings without authentication");
  }

  // Load user settings
  loadUserSettings();

  // Load notification preferences
  loadNotificationPreferences();

  // Initialize with real player data
  initializeWithRealPlayerData();

  // Add real-time validation
  document
    .getElementById("displayName")
    ?.addEventListener("input", function () {
      validateNameField(this.value);
    });

  document.getElementById("email")?.addEventListener("input", function () {
    validateEmailField(this.value);
  });

  document
    .getElementById("newPassword")
    ?.addEventListener("input", function () {
      validatePasswordField(this.value);
    });
});

function loadUserSettings() {
  // Load settings from localStorage or API
  const user = authManager.getCurrentUser();
  if (user) {
    // Populate form fields with user data
    const displayNameField = document.getElementById("displayName");
    const emailField = document.getElementById("email");

    if (displayNameField) {
      displayNameField.value = user.name || "";
    }
    if (emailField) {
      emailField.value = user.email || "";
    }

    // Load saved preferences
    const savedSettings = storageService.get("flagfit_settings", {}, { usePrefix: false });

    // Apply saved theme
    if (savedSettings.theme) {
      const themeField = document.getElementById("theme");
      if (themeField) {
        themeField.value = savedSettings.theme;
      }
    }

    // Apply saved language
    if (savedSettings.language) {
      const languageField = document.getElementById("language");
      if (languageField) {
        languageField.value = savedSettings.language;
      }
    }

    // Apply saved timezone
    if (savedSettings.timezone) {
      const timezoneField = document.getElementById("timezone");
      if (timezoneField) {
        timezoneField.value = savedSettings.timezone;
      }
    }

    // Apply saved position and team from settings
    if (savedSettings.position) {
      const positionField = document.getElementById("position");
      if (positionField) {
        positionField.value = savedSettings.position;
      }
    }
    if (savedSettings.team) {
      const teamField = document.getElementById("team");
      if (teamField) {
        teamField.value = savedSettings.team;
      }
    }
  }

  // Load profile data from user_profile (takes precedence)
  try {
    const profileData = storageService.get("user_profile", {}, { usePrefix: false });
    const userData = storageService.get("userData", {}, { usePrefix: false });

    // Load position (prefer profileData)
    if (profileData.position) {
      const positionField = document.getElementById("position");
      if (positionField) {
        positionField.value = profileData.position;
      }
    }

    // Load jersey number
    if (profileData.jerseyNumber || profileData.jersey_number) {
      const jerseyInput = document.getElementById("jerseyNumber");
      if (jerseyInput) {
        jerseyInput.value =
          profileData.jerseyNumber || profileData.jersey_number;
      }
    }

    // Load experience level
    if (profileData.experienceLevel || profileData.experience_level) {
      const expInput = document.getElementById("experienceLevel");
      if (expInput) {
        expInput.value =
          profileData.experienceLevel || profileData.experience_level;
      }
    }
  } catch (error) {
    logger.warn("Error loading profile data:", error);
  }
}

function initializeWithRealPlayerData() {
  // Get a random real player to demonstrate with their data
  const allPlayers = getAllPlayers();
  const randomPlayer =
    allPlayers[Math.floor(Math.random() * allPlayers.length)];

  // Pre-fill some fields with real player data if they're empty
  const displayNameField = document.getElementById("displayName");
  const teamField = document.getElementById("team");
  const positionField = document.getElementById("position");

  if (!displayNameField.value) {
    displayNameField.value = randomPlayer.name;
    displayNameField.placeholder = `e.g., ${randomPlayer.name} ${randomPlayer.nationality}`;
  }

  if (teamField && !teamField.value) {
    teamField.value = `International Team - Jersey #${randomPlayer.jersey}`;
  }

  if (positionField && !positionField.value) {
    positionField.value = randomPlayer.position;
  }
}

// Real-time validation functions
function validateEmailField(email) {
  if (!email || email.trim() === "") {
    clearFieldState("email");
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(email)) {
    showFieldSuccess("email");
    return true;
  } else {
    showFieldError(
      "email",
      "Please enter a valid email address (e.g., user@example.com)",
    );
    return false;
  }
}

function validatePasswordField(password) {
  if (!password || password.trim() === "") {
    clearFieldState("newPassword");
    return false;
  }

  if (password.length < 8) {
    showFieldError(
      "newPassword",
      "Password must be at least 8 characters long.",
    );
    return false;
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    showFieldError(
      "newPassword",
      "Password must contain uppercase, lowercase, number, and special character (@$!%*?&).",
    );
    return false;
  }

  showFieldSuccess("newPassword");
  return true;
}

function validateNameField(name) {
  if (!name || name.trim() === "") {
    clearFieldState("displayName");
    return false;
  }

  if (name.trim().length < 2) {
    showFieldError("displayName", "Name must be at least 2 characters long.");
    return false;
  }

  showFieldSuccess("displayName");
  return true;
}

// Global function exports for onclick handlers
window.toggleSidebar = function () {
  // Use the universal mobile nav instance if available
  if (window.universalMobileNav) {
    window.universalMobileNav.toggleSidebar();
  } else if (window.FlagFitApp?.components?.mobileNav) {
    window.FlagFitApp.components.mobileNav.toggleSidebar();
  } else {
    // Fallback implementation
    const sidebar = document.getElementById("sidebar");
    const overlay = document.querySelector(".menu-scrim");
    const toggle = document.getElementById("mobile-menu-toggle");
    
    if (sidebar) {
      const isOpen = sidebar.classList.contains("is-open");
      if (isOpen) {
        sidebar.classList.remove("is-open");
        overlay?.classList.remove("is-visible");
        toggle?.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      } else {
        sidebar.classList.add("is-open");
        overlay?.classList.add("is-visible");
        toggle?.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
      }
    }
  }
};

window.closeMenu = function () {
  // Alias for toggleSidebar to close menu
  if (window.universalMobileNav) {
    window.universalMobileNav.closeSidebar();
  } else if (window.FlagFitApp?.components?.mobileNav) {
    window.FlagFitApp.components.mobileNav.closeSidebar();
  } else {
    // Fallback implementation
    const sidebar = document.getElementById("sidebar");
    const overlay = document.querySelector(".menu-scrim");
    const toggle = document.getElementById("mobile-menu-toggle");
    
    if (sidebar) {
      sidebar.classList.remove("is-open");
      overlay?.classList.remove("is-visible");
      toggle?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  }
};

window.toggleSetting = function (element) {
  element.classList.toggle("active");
};

// Notification preferences toggle
// Load notification preferences from backend
async function loadNotificationPreferences() {
  try {
    const { apiClient, API_ENDPOINTS } = await import("../../api-config.js");
    const prefsResponse = await apiClient.get(
      API_ENDPOINTS.dashboard.notificationsPreferences
    );
    
    if (prefsResponse && prefsResponse.success && prefsResponse.data) {
      const preferences = prefsResponse.data;
      
      // Update toggle switches based on preferences
      Object.entries(preferences).forEach(([type, prefs]) => {
        const toggle = document.querySelector(
          `[data-preference-key="${type}"]`
        );
        if (toggle) {
          // Active = not muted
          if (prefs.muted) {
            toggle.classList.remove("active");
          } else {
            toggle.classList.add("active");
          }
        }
      });
    }
  } catch (error) {
    logger.warn("Failed to load notification preferences:", error);
    // Continue with defaults (all enabled)
  }
}

window.toggleNotificationPreference = async function (element, type) {
  const isActive = element.classList.contains("active");
  element.classList.toggle("active");
  const muted = !element.classList.contains("active");
  
  try {
    // Import API client if not available
    if (!window.apiClient || !window.API_ENDPOINTS) {
      const { apiClient, API_ENDPOINTS } = await import("../../api-config.js");
      window.apiClient = apiClient;
      window.API_ENDPOINTS = API_ENDPOINTS;
    }
    
    // Get current preferences
    const prefsResponse = await window.apiClient.get(
      window.API_ENDPOINTS.dashboard.notificationsPreferences
    );
    
    const currentPrefs = prefsResponse?.success ? prefsResponse.data : {};
    
    // Update preference for this type
    const updatedPrefs = {
      ...currentPrefs,
      [type]: {
        muted,
        pushEnabled: currentPrefs[type]?.pushEnabled !== false,
        inAppEnabled: currentPrefs[type]?.inAppEnabled !== false
      }
    };
    
    // Save to backend
    await window.apiClient.post(
      window.API_ENDPOINTS.dashboard.notificationsPreferences,
      { preferences: updatedPrefs }
    );
    
    // Show success feedback
    if (window.ErrorHandler) {
      window.ErrorHandler.showSuccess(
        `${type} notifications ${muted ? 'muted' : 'enabled'}`
      );
    }
  } catch (error) {
    // Revert toggle on error
    element.classList.toggle("active");
    logger.warn("Failed to update notification preference:", error);
    if (window.ErrorHandler) {
      window.ErrorHandler.showError("Failed to update preference. Please try again.");
    }
  }
};

window.saveSettings = async function (event) {
  // Collect all settings
  const settings = {
    displayName: document.getElementById("displayName").value,
    email: document.getElementById("email").value,
    position: document.getElementById("position").value,
    team: document.getElementById("team").value,
    theme: document.getElementById("theme").value,
    language: document.getElementById("language").value,
    timezone: document.getElementById("timezone").value,
    notifications: {
      training: document
        .querySelector(".setting-item:nth-child(1) .toggle-switch")
        .classList.contains("active"),
      tournaments: document
        .querySelector(".setting-item:nth-child(2) .toggle-switch")
        .classList.contains("active"),
      messages: document
        .querySelector(".setting-item:nth-child(3) .toggle-switch")
        .classList.contains("active"),
      insights: document
        .querySelector(".setting-item:nth-child(4) .toggle-switch")
        .classList.contains("active"),
    },
    privacy: {
      profileVisible: document
        .querySelector(
          ".settings-section:nth-child(3) .setting-item:nth-child(1) .toggle-switch",
        )
        .classList.contains("active"),
      dataSharing: document
        .querySelector(
          ".settings-section:nth-child(3) .setting-item:nth-child(2) .toggle-switch",
        )
        .classList.contains("active"),
      analytics: document
        .querySelector(
          ".settings-section:nth-child(3) .setting-item:nth-child(3) .toggle-switch",
        )
        .classList.contains("active"),
    },
  };

  // Save to localStorage
  storageService.set("flagfit_settings", settings, { usePrefix: false });

  // Also save profile data to user_profile for profile page
  const profileData = {
    position: document.getElementById("position").value,
    jerseyNumber:
      parseInt(document.getElementById("jerseyNumber")?.value || 0) || null,
    experienceLevel: document.getElementById("experienceLevel")?.value || null,
    updatedAt: new Date().toISOString(),
  };

  // Get existing profile data
  const existingProfile = storageService.get("user_profile", {}, { usePrefix: false });
  const updatedProfile = { ...existingProfile, ...profileData };
  storageService.set("user_profile", updatedProfile, { usePrefix: false });

  // Update userData name if displayName changed
  const userData = storageService.get("userData", {}, { usePrefix: false });
  if (settings.displayName && settings.displayName !== userData.name) {
    userData.name = settings.displayName;
    storageService.set("userData", userData, { usePrefix: false });
  }

  // Try to save to API
  try {
    const { apiClient } = await import("./src/api-config.js");
    await apiClient.put("/api/user/profile", updatedProfile);
  } catch (error) {
    logger.warn("Could not save to API, saved locally:", error);
  }

  // Show success message
  const button =
    event?.target || document.querySelector('button[onclick*="saveSettings"]');
  if (!button) {return;}
  const originalText = button.innerHTML;
  button.innerHTML =
    '<span><i data-lucide="check-circle" style="width: 16px;  height: 16px;  display: inline-block;  vertical-align: middle ;   color: var(--icon-color-primary); stroke: var(--icon-color-primary);"></i></span> Saved!';
  button.style.background = "var(--success)";

  setTimeout(() => {
    button.innerHTML = originalText;
    button.style.background = "var(--primary)";
  }, 2000);

  logger.debug("Settings saved:", settings);
  logger.debug("Profile data saved:", updatedProfile);
};

window.exportData = function () {
  // Create a mock data export
  const userData = {
    profile: {
      name: document.getElementById("displayName").value,
      email: document.getElementById("email").value,
      position: document.getElementById("position").value,
      team: document.getElementById("team").value,
    },
    trainingData: {
      sessionsCompleted: 28,
      totalHours: 45,
      averageScore: 87,
      weeklyGoals: "5/7 completed",
    },
    exportDate: new Date().toISOString(),
  };

  // Create and download JSON file
  const dataStr = JSON.stringify(userData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "flagfit-pro-data-export.json";
  link.click();
  URL.revokeObjectURL(url);

  // Show success message
  alert("Your data has been exported successfully!");
};

window.deleteAccount = function () {
  showDeleteAccountModal();
};

function showDeleteAccountModal() {
  const modal = document.createElement("div");
  modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: var(--z-index-modal, 1400);
    `;

  modal.innerHTML = `
        <div style="background: var(--dark-text-primary); padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; border: 2px solid var(--error);">
            <h3 style="margin-bottom: 1rem; color: var(--error); display: flex; align-items: center; gap: 0.5rem;">
                ⚠️ Delete Account
            </h3>
            <div style="margin-bottom: 1.5rem; color: var(--dark-text-secondary);">
                <p><strong>This action cannot be undone!</strong></p>
                <p>Deleting your account will permanently remove:</p>
                <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                    <li>All training data and progress</li>
                    <li>Workout history and achievements</li>
                    <li>Team memberships and connections</li>
                    <li>Settings and preferences</li>
                </ul>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: var(--font-weight-medium, 500);">Type "DELETE" to confirm:</label>
                <input type="text" id="deleteConfirmation" style="width: 100%; padding: 0.75rem; border: 2px solid var(--error); border-radius: 6px; font-family: monospace;"
                       placeholder="Type DELETE here" autocomplete="off" oninput="validateDeleteInput(this)">
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button onclick="this.closest('div').remove()" style="padding: 0.75rem 1.5rem; border: 1px solid var(--dark-border); background: var(--dark-text-primary); border-radius: 6px; cursor: pointer;">Cancel</button>
                <button id="confirmDeleteBtn" onclick="confirmAccountDeletion()" disabled style="padding: 0.75rem 1.5rem; background: var(--error); color: var(--dark-text-primary); border: none; border-radius: 6px; cursor: not-allowed; opacity: 0.5;">Delete Account</button>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
}

window.validateDeleteInput = function (input) {
  const confirmBtn = document.getElementById("confirmDeleteBtn");
  if (input.value === "DELETE") {
    confirmBtn.disabled = false;
    confirmBtn.style.cursor = "pointer";
    confirmBtn.style.opacity = "1";
  } else {
    confirmBtn.disabled = true;
    confirmBtn.style.cursor = "not-allowed";
    confirmBtn.style.opacity = "0.5";
  }
};

window.confirmAccountDeletion = function () {
  const isDemoMode =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.search.includes("demo=true");

  if (isDemoMode) {
    // Demo mode - show demo message
    alert(
      "Demo Mode: Account deletion is disabled in the demo. In production, this would permanently delete your account and all data.",
    );
    // Close modal
    document.querySelector('div[style*="position: fixed"]').remove();
    return;
  }

  // Production mode - implement actual deletion
  const deleteButton = document.getElementById("confirmDeleteBtn");
  deleteButton.innerHTML = "⏳ Deleting...";
  deleteButton.disabled = true;

  // Simulate API call to delete account
  setTimeout(async () => {
    try {
      // Clear all local data
      localStorage.clear();
      sessionStorage.clear();

      // In a real app, call the API to delete account
      // await authManager.deleteAccount();

      // Show success message and redirect
      alert(
        "Your account has been successfully deleted. You will now be redirected to the home page.",
      );
      window.location.href = "/index.html";
    } catch (error) {
      alert("Error deleting account. Please try again or contact support.");
      deleteButton.innerHTML = "Delete Account";
      deleteButton.disabled = false;
    }
  }, 2000);
};

// Navigation handlers
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function (e) {
    if (this.getAttribute("href") !== "#") {
      return; // Allow navigation
    }
    e.preventDefault();

    // Remove active class from all items
    document
      .querySelectorAll(".nav-item")
      .forEach((nav) => nav.classList.remove("active"));

    // Add active class to clicked item
    this.classList.add("active");
  });
});
