// Profile Completion Manager for FlagFit Pro
// Handles profile completion flow after registration

import { logger } from "./logger.js";

export class ProfileCompletionManager {
  constructor() {
    this.isActive = false;
  }

  // Check if profile needs completion
  needsCompletion() {
    const profile = this.getStoredProfile();
    const requiredFields = ["position", "jerseyNumber", "experienceLevel"];

    return requiredFields.some((field) => !profile[field]);
  }

  // Get stored profile data
  getStoredProfile() {
    try {
      return JSON.parse(localStorage.getItem("user_profile") || "{}");
    } catch {
      return {};
    }
  }

  // Show profile completion modal
  showProfileCompletionModal(required = false) {
    if (this.isActive) return;

    this.isActive = true;
    const modal = document.createElement("div");
    modal.id = "profile-completion-modal";
    modal.className = "profile-completion-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "profile-completion-title");
    modal.setAttribute("aria-modal", "true");

    const storedProfile = this.getStoredProfile();
    const user = JSON.parse(localStorage.getItem("userData") || "{}");

    modal.innerHTML = `
      <div class="profile-completion-overlay"></div>
      <div class="profile-completion-content">
        <div class="profile-completion-header">
          <h2 id="profile-completion-title">Complete Your Profile</h2>
          ${
            !required
              ? `<button class="profile-completion-close" onclick="window.profileCompletionManager.closeModal()" aria-label="Close dialog">
            <i data-lucide="x" class="icon-18"></i>
          </button>`
              : ""
          }
        </div>
        <form id="profileCompletionForm" class="profile-completion-form">
          <div class="form-section">
            <h3 class="form-section-title">Personal Information</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name <span class="required">*</span></label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value="${this.parseName(user.name || "").firstName}"
                  required
                  autocomplete="given-name"
                  aria-describedby="firstName-help"
                />
                <small id="firstName-help" class="form-help">Your first name</small>
              </div>

              <div class="form-group">
                <label for="lastName">Last Name <span class="required">*</span></label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value="${this.parseName(user.name || "").lastName}"
                  required
                  autocomplete="family-name"
                  aria-describedby="lastName-help"
                />
                <small id="lastName-help" class="form-help">Your last name</small>
              </div>
            </div>

            <div class="form-group">
              <label for="position">Playing Position <span class="required">*</span></label>
              <select id="position" name="position" required>
                <option value="">Select position</option>
                <option value="QB" ${storedProfile.position === "QB" ? "selected" : ""}>Quarterback (QB)</option>
                <option value="WR" ${storedProfile.position === "WR" ? "selected" : ""}>Wide Receiver (WR)</option>
                <option value="RB" ${storedProfile.position === "RB" ? "selected" : ""}>Running Back (RB)</option>
                <option value="DB" ${storedProfile.position === "DB" ? "selected" : ""}>Defensive Back (DB)</option>
                <option value="LB" ${storedProfile.position === "LB" ? "selected" : ""}>Linebacker (LB)</option>
                <option value="K" ${storedProfile.position === "K" ? "selected" : ""}>Kicker (K)</option>
                <option value="FLEX" ${storedProfile.position === "FLEX" ? "selected" : ""}>Flex</option>
              </select>
            </div>

            <div class="form-group">
              <label for="jerseyNumber">Jersey Number <span class="required">*</span></label>
              <input
                type="number"
                id="jerseyNumber"
                name="jerseyNumber"
                min="0"
                max="99"
                value="${storedProfile.jerseyNumber || storedProfile.jersey_number || ""}"
                required
                aria-describedby="jerseyNumber-help"
              />
              <small id="jerseyNumber-help" class="form-help">Your jersey number (0-99)</small>
            </div>

            <div class="form-group">
              <label for="experienceLevel">Experience Level <span class="required">*</span></label>
              <select id="experienceLevel" name="experienceLevel" required>
                <option value="">Select experience level</option>
                <option value="beginner" ${storedProfile.experienceLevel === "beginner" ? "selected" : ""}>Beginner</option>
                <option value="intermediate" ${storedProfile.experienceLevel === "intermediate" ? "selected" : ""}>Intermediate</option>
                <option value="advanced" ${storedProfile.experienceLevel === "advanced" ? "selected" : ""}>Advanced</option>
                <option value="expert" ${storedProfile.experienceLevel === "expert" ? "selected" : ""}>Expert</option>
              </select>
            </div>
          </div>

          <div class="form-section">
            <h3 class="form-section-title">Physical Stats (Optional)</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="heightFeet">Height</label>
                <div class="height-input-group">
                  <input
                    type="number"
                    id="heightFeet"
                    name="heightFeet"
                    min="4"
                    max="7"
                    placeholder="5"
                    value="${this.parseHeight(storedProfile.height_cm).feet}"
                    aria-label="Feet"
                  />
                  <span class="height-separator">'</span>
                  <input
                    type="number"
                    id="heightInches"
                    name="heightInches"
                    min="0"
                    max="11"
                    placeholder="10"
                    value="${this.parseHeight(storedProfile.height_cm).inches}"
                    aria-label="Inches"
                  />
                  <span class="height-separator">"</span>
                </div>
              </div>

              <div class="form-group">
                <label for="weight">Weight (lbs)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  min="80"
                  max="350"
                  value="${storedProfile.weight_kg ? Math.round(storedProfile.weight_kg * 2.20462) : ""}"
                  placeholder="180"
                  aria-describedby="weight-help"
                />
                <small id="weight-help" class="form-help">Your weight in pounds</small>
              </div>
            </div>

            <div class="form-group">
              <label for="birthDate">Date of Birth</label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value="${storedProfile.birth_date || storedProfile.birthDate || ""}"
                max="${new Date().toISOString().split("T")[0]}"
                autocomplete="bday"
                aria-describedby="birthDate-help"
              />
              <small id="birthDate-help" class="form-help">Your date of birth</small>
            </div>
          </div>

          <div class="form-section">
            <h3 class="form-section-title">Bio (Optional)</h3>
            <div class="form-group">
              <label for="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows="4"
                placeholder="Tell us about yourself..."
                aria-describedby="bio-help"
              >${storedProfile.bio || ""}</textarea>
              <small id="bio-help" class="form-help">A short bio about yourself</small>
            </div>
          </div>

          <div class="form-actions">
            ${!required ? '<button type="button" class="btn-secondary" onclick="window.profileCompletionManager.closeModal()">Skip for Now</button>' : ""}
            <button type="submit" class="btn-primary">Save Profile</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons(modal);
    }

    // Focus on first input
    setTimeout(() => {
      const firstNameInput = document.getElementById("firstName");
      if (firstNameInput) {
        firstNameInput.focus();
      }
    }, 100);

    // Handle form submission
    const form = document.getElementById("profileCompletionForm");
    form.addEventListener("submit", (e) => this.handleSubmit(e, required));

    // Close on Escape key (if not required)
    if (!required) {
      modal.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.closeModal();
        }
      });
    }
  }

  parseName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  }

  parseHeight(heightCm) {
    if (!heightCm) return { feet: "", inches: "" };
    const totalInches = Math.round(heightCm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return { feet, inches };
  }

  async handleSubmit(e, required) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // Collect form data
    const profileData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      position: formData.get("position"),
      jerseyNumber: parseInt(formData.get("jerseyNumber")),
      experienceLevel: formData.get("experienceLevel"),
      bio: formData.get("bio") || "",
    };

    // Calculate height in cm
    const heightFeet = parseInt(formData.get("heightFeet") || 0);
    const heightInches = parseInt(formData.get("heightInches") || 0);
    if (heightFeet > 0 || heightInches > 0) {
      const totalInches = heightFeet * 12 + heightInches;
      profileData.height_cm = Math.round(totalInches * 2.54);
    }

    // Convert weight to kg
    const weightLbs = parseFloat(formData.get("weight"));
    if (weightLbs) {
      profileData.weight_kg = Math.round((weightLbs / 2.20462) * 100) / 100;
    }

    // Date of birth
    const birthDate = formData.get("birthDate");
    if (birthDate) {
      profileData.birth_date = birthDate;
    }

    // Update full name in userData
    const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    userData.name = fullName;
    localStorage.setItem("userData", JSON.stringify(userData));

    // Save profile data
    const existingProfile = this.getStoredProfile();
    const updatedProfile = {
      ...existingProfile,
      ...profileData,
      completedAt: new Date().toISOString(),
      profileCompleted: true,
    };
    localStorage.setItem("user_profile", JSON.stringify(updatedProfile));

    // Try to save to API
    try {
      const { apiClient } = await import("./api-config.js");
      await apiClient.put("/api/user/profile", updatedProfile);
    } catch (error) {
      logger.warn("Could not save to API, saved locally:", error);
    }

    // Show success message
    this.showSuccess("Profile saved successfully!");

    // Close modal
    this.closeModal();

    // Redirect to dashboard if this was required (after registration)
    if (required) {
      setTimeout(() => {
        if (
          window.authManager &&
          typeof window.authManager.redirectToDashboard === "function"
        ) {
          window.authManager.redirectToDashboard();
        } else {
          window.location.href = "/dashboard.html";
        }
      }, 500);
    } else {
      // Reload page if on profile page
      if (window.location.pathname.includes("profile.html")) {
        setTimeout(() => window.location.reload(), 1000);
      }
    }
  }

  showSuccess(message) {
    // You can integrate with your notification system here
    if (typeof window !== "undefined" && window.authManager) {
      window.authManager.showSuccess(message);
    } else {
      alert(message);
    }
  }

  closeModal() {
    const modal = document.getElementById("profile-completion-modal");
    if (modal) {
      modal.style.opacity = "0";
      setTimeout(() => {
        modal.remove();
        this.isActive = false;
      }, 300);
    }
  }

  // Check and show if needed
  checkAndShow(required = false) {
    if (this.needsCompletion()) {
      this.showProfileCompletionModal(required);
      return true;
    }
    return false;
  }
}

// Initialize and export
export const profileCompletionManager = new ProfileCompletionManager();
window.profileCompletionManager = profileCompletionManager;
