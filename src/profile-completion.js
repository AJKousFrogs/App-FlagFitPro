// Profile Completion Manager for FlagFit Pro
// Handles profile completion flow after registration

import { logger } from "./logger.js";
import { storageService } from "./js/services/storage-service-unified.js";

export class ProfileCompletionManager {
  constructor() {
    this.isActive = false;
  }

  // Get user role from stored user data
  getUserRole() {
    try {
      const user = storageService.get("userData", {}, { usePrefix: false });
      return user?.role || 'player';
    } catch {
      return 'player';
    }
  }

  // Check if profile needs completion (role-aware)
  needsCompletion() {
    const profile = this.getStoredProfile();
    const role = this.getUserRole();

    if (role === 'coach') {
      // Coaches need: coaching experience level
      const requiredFields = ["coachingExperienceLevel"];
      return requiredFields.some((field) => !profile[field]);
    } else {
      // Players need: at least one position, jerseyNumber, experienceLevel
      const hasPositions = (Array.isArray(profile.positions) && profile.positions.length > 0) || profile.position;
      const hasJerseyNumber = profile.jerseyNumber || profile.jersey_number;
      const hasExperienceLevel = profile.experienceLevel;

      return !hasPositions || !hasJerseyNumber || !hasExperienceLevel;
    }
  }

  // Get stored profile data
  getStoredProfile() {
    try {
      return storageService.get("user_profile", {}, { usePrefix: false });
    } catch {
      return {};
    }
  }

  // Show profile completion modal
  showProfileCompletionModal(required = false) {
    if (this.isActive) {return;}

    this.isActive = true;
    const modal = document.createElement("div");
    modal.id = "profile-completion-modal";
    modal.className = "profile-completion-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "profile-completion-title");
    modal.setAttribute("aria-modal", "true");

    const storedProfile = this.getStoredProfile();
    const user = storageService.get("userData", {}, { usePrefix: false });
    const role = this.getUserRole();
    const isCoach = role === 'coach';

    // Generate role-specific form fields
    const roleSpecificFields = isCoach ? this.getCoachFields(storedProfile) : this.getPlayerFields(storedProfile);
    const physicalStatsSection = !isCoach ? this.getPlayerPhysicalStats(storedProfile) : '';

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

            ${roleSpecificFields}
          </div>

          ${physicalStatsSection}

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

    // Handle unit toggle buttons
    const unitToggles = modal.querySelectorAll(".unit-toggle");
    unitToggles.forEach((toggle) => {
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        const field = toggle.getAttribute("data-field");
        const unit = toggle.getAttribute("data-unit");

        // Update toggle button styles
        const fieldToggles = modal.querySelectorAll(`.unit-toggle[data-field="${field}"]`);
        fieldToggles.forEach((btn) => {
          if (btn.getAttribute("data-unit") === unit) {
            btn.style.background = "#667eea";
            btn.style.color = "white";
            btn.style.borderColor = "#667eea";
          } else {
            btn.style.background = "white";
            btn.style.color = "#666";
            btn.style.borderColor = "#ddd";
          }
        });

        // Show/hide appropriate inputs
        const imperialDiv = modal.querySelector(`#${field}-imperial`);
        const metricDiv = modal.querySelector(`#${field}-metric`);

        if (unit === "imperial") {
          if (imperialDiv) imperialDiv.style.display = field === "height" ? "flex" : "block";
          if (metricDiv) metricDiv.style.display = "none";

          // Convert values if present
          if (field === "height") {
            const cmInput = modal.querySelector("#heightCm");
            const feetInput = modal.querySelector("#heightFeet");
            const inchesInput = modal.querySelector("#heightInches");
            if (cmInput && cmInput.value && feetInput && inchesInput) {
              const cm = parseInt(cmInput.value);
              const totalInches = Math.round(cm / 2.54);
              const feet = Math.floor(totalInches / 12);
              const inches = totalInches % 12;
              feetInput.value = feet;
              inchesInput.value = inches;
            }
          } else if (field === "weight") {
            const kgInput = modal.querySelector("#weightKg");
            const lbsInput = modal.querySelector("#weightLbs");
            if (kgInput && kgInput.value && lbsInput) {
              const kg = parseFloat(kgInput.value);
              lbsInput.value = Math.round(kg * 2.20462);
            }
          }
        } else {
          if (imperialDiv) imperialDiv.style.display = "none";
          if (metricDiv) metricDiv.style.display = "block";

          // Convert values if present
          if (field === "height") {
            const cmInput = modal.querySelector("#heightCm");
            const feetInput = modal.querySelector("#heightFeet");
            const inchesInput = modal.querySelector("#heightInches");
            if (feetInput && inchesInput && cmInput) {
              const feet = parseInt(feetInput.value || 0);
              const inches = parseInt(inchesInput.value || 0);
              if (feet > 0 || inches > 0) {
                const totalInches = feet * 12 + inches;
                cmInput.value = Math.round(totalInches * 2.54);
              }
            }
          } else if (field === "weight") {
            const kgInput = modal.querySelector("#weightKg");
            const lbsInput = modal.querySelector("#weightLbs");
            if (lbsInput && lbsInput.value && kgInput) {
              const lbs = parseFloat(lbsInput.value);
              kgInput.value = Math.round((lbs / 2.20462) * 100) / 100;
            }
          }
        }
      });
    });

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
    if (!heightCm) {return { feet: "", inches: "" };}
    const totalInches = Math.round(heightCm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return { feet, inches };
  }

  // Generate player-specific fields
  getPlayerFields(storedProfile) {
    // Handle positions as array (new) or single value (legacy)
    const positions = Array.isArray(storedProfile.positions)
      ? storedProfile.positions
      : (storedProfile.position ? [storedProfile.position] : []);

    return `
      <div class="form-group">
        <label>Playing Positions <span class="required">*</span></label>
        <small class="form-help" style="display: block; margin-bottom: 8px;">Select all positions you play</small>
        <div class="checkbox-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="positions"
              value="QB"
              ${positions.includes("QB") ? "checked" : ""}
            />
            <span>Quarterback (QB)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="positions"
              value="WR"
              ${positions.includes("WR") ? "checked" : ""}
            />
            <span>Wide Receiver (WR)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="positions"
              value="RB"
              ${positions.includes("RB") ? "checked" : ""}
            />
            <span>Running Back (RB)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="positions"
              value="C"
              ${positions.includes("C") ? "checked" : ""}
            />
            <span>Center (C)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="positions"
              value="DB"
              ${positions.includes("DB") ? "checked" : ""}
            />
            <span>Defensive Back (DB)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="positions"
              value="LB"
              ${positions.includes("LB") ? "checked" : ""}
            />
            <span>Linebacker (LB)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="positions"
              value="K"
              ${positions.includes("K") ? "checked" : ""}
            />
            <span>Kicker (K)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="positions"
              value="FLEX"
              ${positions.includes("FLEX") ? "checked" : ""}
            />
            <span>Flex</span>
          </label>
        </div>
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
    `;
  }

  // Generate player physical stats section (separate method for proper HTML structure)
  getPlayerPhysicalStats(storedProfile) {
    const heightCm = storedProfile.height_cm || 0;
    const weightKg = storedProfile.weight_kg || 0;
    const heightParsed = this.parseHeight(heightCm);
    const weightLbs = weightKg ? Math.round(weightKg * 2.20462) : 0;

    return `
      <div class="form-section">
        <h3 class="form-section-title">Physical Stats (Optional)</h3>

        <div class="form-row">
          <div class="form-group">
            <label>Height</label>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <button type="button" class="unit-toggle" data-unit="imperial" data-field="height" style="flex: 1; padding: 6px 12px; border: 2px solid #667eea; background: #667eea; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Feet/Inches
              </button>
              <button type="button" class="unit-toggle" data-unit="metric" data-field="height" style="flex: 1; padding: 6px 12px; border: 2px solid #ddd; background: white; color: #666; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Centimeters
              </button>
            </div>
            <div id="height-imperial" class="height-input-group">
              <input
                type="number"
                id="heightFeet"
                name="heightFeet"
                min="4"
                max="7"
                placeholder="5"
                value="${heightParsed.feet || ""}"
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
                value="${heightParsed.inches || ""}"
                aria-label="Inches"
              />
              <span class="height-separator">"</span>
            </div>
            <div id="height-metric" style="display: none;">
              <input
                type="number"
                id="heightCm"
                name="heightCm"
                min="120"
                max="230"
                placeholder="178"
                value="${heightCm || ""}"
                aria-label="Height in centimeters"
                style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;"
              />
              <small class="form-help">Your height in centimeters</small>
            </div>
          </div>

          <div class="form-group">
            <label>Weight</label>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <button type="button" class="unit-toggle" data-unit="imperial" data-field="weight" style="flex: 1; padding: 6px 12px; border: 2px solid #667eea; background: #667eea; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Pounds (lbs)
              </button>
              <button type="button" class="unit-toggle" data-unit="metric" data-field="weight" style="flex: 1; padding: 6px 12px; border: 2px solid #ddd; background: white; color: #666; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Kilograms (kg)
              </button>
            </div>
            <div id="weight-imperial">
              <input
                type="number"
                id="weightLbs"
                name="weightLbs"
                min="80"
                max="350"
                value="${weightLbs || ""}"
                placeholder="180"
                aria-label="Weight in pounds"
                style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;"
              />
              <small class="form-help">Your weight in pounds</small>
            </div>
            <div id="weight-metric" style="display: none;">
              <input
                type="number"
                id="weightKg"
                name="weightKg"
                min="35"
                max="160"
                value="${weightKg || ""}"
                placeholder="82"
                aria-label="Weight in kilograms"
                style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;"
              />
              <small class="form-help">Your weight in kilograms</small>
            </div>
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
    `;
  }

  // Generate coach-specific fields
  getCoachFields(storedProfile) {
    return `
      <div class="form-group">
        <label for="coachingExperienceLevel">Coaching Experience Level <span class="required">*</span></label>
        <select id="coachingExperienceLevel" name="coachingExperienceLevel" required>
          <option value="">Select experience level</option>
          <option value="beginner" ${storedProfile.coachingExperienceLevel === "beginner" ? "selected" : ""}>Beginner (0-2 years)</option>
          <option value="intermediate" ${storedProfile.coachingExperienceLevel === "intermediate" ? "selected" : ""}>Intermediate (3-5 years)</option>
          <option value="advanced" ${storedProfile.coachingExperienceLevel === "advanced" ? "selected" : ""}>Advanced (6-10 years)</option>
          <option value="expert" ${storedProfile.coachingExperienceLevel === "expert" ? "selected" : ""}>Expert (10+ years)</option>
        </select>
        <small class="form-help">Your level of coaching experience</small>
      </div>

      <div class="form-group">
        <label for="coachingSpecialties">Coaching Specialties</label>
        <div class="checkbox-group" style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px;">
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="coachingSpecialties"
              value="offensive"
              ${storedProfile.coachingSpecialties?.includes("offensive") ? "checked" : ""}
            />
            <span>Offensive</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="coachingSpecialties"
              value="defensive"
              ${storedProfile.coachingSpecialties?.includes("defensive") ? "checked" : ""}
            />
            <span>Defensive</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="coachingSpecialties"
              value="special_teams"
              ${storedProfile.coachingSpecialties?.includes("special_teams") ? "checked" : ""}
            />
            <span>Special Teams</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input
              type="checkbox"
              name="coachingSpecialties"
              value="strength_conditioning"
              ${storedProfile.coachingSpecialties?.includes("strength_conditioning") ? "checked" : ""}
            />
            <span>Strength & Conditioning</span>
          </label>
        </div>
        <small class="form-help">Select your coaching areas of expertise</small>
      </div>

      <div class="form-group">
        <label for="teamsCoached">Teams Coached (Optional)</label>
        <input
          type="text"
          id="teamsCoached"
          name="teamsCoached"
          value="${storedProfile.teamsCoached || ""}"
          placeholder="e.g., High School Varsity, Youth League"
          aria-describedby="teamsCoached-help"
        />
        <small id="teamsCoached-help" class="form-help">List teams or leagues you've coached</small>
      </div>
    `;
  }

  async handleSubmit(e, required) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const role = this.getUserRole();
    const isCoach = role === 'coach';

    // Collect form data (role-aware)
    const profileData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      bio: formData.get("bio") || "",
    };

    if (isCoach) {
      // Coach-specific fields
      profileData.coachingExperienceLevel = formData.get("coachingExperienceLevel");
      profileData.teamsCoached = formData.get("teamsCoached") || "";
      
      // Collect coaching specialties (checkboxes)
      const specialties = formData.getAll("coachingSpecialties");
      if (specialties.length > 0) {
        profileData.coachingSpecialties = specialties;
      }
    } else {
      // Player-specific fields
      // Collect all selected positions (checkboxes)
      const positions = formData.getAll("positions");
      if (positions.length > 0) {
        profileData.positions = positions;
        // Also store first position for backward compatibility
        profileData.position = positions[0];
      }

      profileData.jerseyNumber = parseInt(formData.get("jerseyNumber"));
      profileData.experienceLevel = formData.get("experienceLevel");

      // Calculate height in cm - check which unit system was used
      const heightCm = parseInt(formData.get("heightCm") || 0);
      const heightFeet = parseInt(formData.get("heightFeet") || 0);
      const heightInches = parseInt(formData.get("heightInches") || 0);

      if (heightCm > 0) {
        // User entered metric
        profileData.height_cm = heightCm;
      } else if (heightFeet > 0 || heightInches > 0) {
        // User entered imperial
        const totalInches = heightFeet * 12 + heightInches;
        profileData.height_cm = Math.round(totalInches * 2.54);
      }

      // Convert weight to kg - check which unit system was used
      const weightKg = parseFloat(formData.get("weightKg"));
      const weightLbs = parseFloat(formData.get("weightLbs"));

      if (weightKg) {
        // User entered metric
        profileData.weight_kg = Math.round(weightKg * 100) / 100;
      } else if (weightLbs) {
        // User entered imperial
        profileData.weight_kg = Math.round((weightLbs / 2.20462) * 100) / 100;
      }

      // Date of birth
      const birthDate = formData.get("birthDate");
      if (birthDate) {
        profileData.birth_date = birthDate;
      }
    }

    // Update full name in userData
    const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
    const userData = storageService.get("userData", {}, { usePrefix: false });
    userData.name = fullName;
    storageService.set("userData", userData, { usePrefix: false });

    // Save profile data
    const existingProfile = this.getStoredProfile();
    const updatedProfile = {
      ...existingProfile,
      ...profileData,
      completedAt: new Date().toISOString(),
      profileCompleted: true,
    };
    storageService.set("user_profile", updatedProfile, { usePrefix: false });

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
