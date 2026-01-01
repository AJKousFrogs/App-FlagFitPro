// Onboarding Manager for FlagFit Pro
// Handles new user onboarding flow and feature discovery

import { storageService } from "./js/services/storage-service-unified.js";
import { setSafeContent } from "./js/utils/shared.js";

export class OnboardingManager {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 5; // Will be updated based on role
    this.isActive = false;
    this.completedSteps = new Set();
    this.init();
  }

  // Get user role from stored user data
  getUserRole() {
    try {
      const user = storageService.get("userData", {}, { usePrefix: false });
      return user?.role || "player";
    } catch {
      return "player";
    }
  }

  // Get role-specific onboarding steps
  getOnboardingSteps(role) {
    const isCoach = role === "coach";

    if (isCoach) {
      return [
        {
          title: "Welcome, Coach!",
          content:
            "Welcome to FlagFit Pro! Your coaching dashboard helps you manage teams, track player performance, and create training plans. Let's get started.",
          icon: "👔",
        },
        {
          title: "Coach Dashboard Overview",
          content:
            "Your dashboard shows team performance metrics, player stats, upcoming training sessions, and quick actions for team management.",
          icon: "📊",
        },
        {
          title: "Creating & Managing Teams",
          content:
            "Create teams, invite players, and manage rosters. Set up domestic or international teams and configure team settings.",
          icon: "👥",
        },
        {
          title: "Adding Players to Roster",
          content:
            "Invite athletes to join your team, manage player profiles, and track their progress. Build your roster from the team management page.",
          icon: "➕",
        },
        {
          title: "Training Sessions & Stats",
          content:
            "Create training sessions, log player performance data, and monitor team progress. Use the training hub to schedule and track workouts.",
          icon: "📈",
        },
        {
          title: "Community & Messaging",
          content:
            "Communicate with your team, share updates, and engage with the flag football coaching community.",
          icon: "💬",
        },
        {
          title: "Create Your First Team",
          content:
            "Ready to start coaching? Create a team, set it as domestic or international, and invite players. You can create teams from the roster page or coach dashboard.",
          icon: "➕",
          action: {
            label: "Create Team",
            url: "/roster.html",
          },
        },
        {
          title: "You're All Set!",
          content:
            "Start managing your teams! You can always access help from the menu or press ? for keyboard shortcuts.",
          icon: "🎉",
        },
      ];
    } else {
      // Player/Athlete steps
      return [
        {
          title: "Welcome to FlagFit Pro!",
          content:
            "Your ultimate flag football training and competition platform. Let's get you started with a quick tour.",
          icon: "👋",
        },
        {
          title: "Dashboard Overview",
          content:
            "Your dashboard shows your performance metrics, upcoming training sessions, and quick actions. Everything you need is right here.",
          icon: "📊",
        },
        {
          title: "Training Hub & Drills",
          content:
            "Access your training programs, track workouts, and monitor your progress. Build your skills with structured programs and drills.",
          icon: "🏋️",
        },
        {
          title: "Team & Community",
          content:
            "Find and join teams using team codes or browse public teams. Connect with teammates, join tournaments, and engage with the community.",
          icon: "👥",
        },
        {
          title: "Find or Join a Team",
          content:
            "Ready to join a team? Browse public teams, use a team code from your coach, or wait for an invitation. You can access teams from the navigation menu.",
          icon: "🔍",
          action: {
            label: "Browse Teams",
            url: "/roster.html",
          },
        },
        {
          title: "You're All Set!",
          content:
            "Start exploring! You can always access help from the menu or press ? for keyboard shortcuts.",
          icon: "🎉",
        },
      ];
    }
  }

  init() {
    // Check if user has completed onboarding
    const onboardingCompleted = storageService.get(
      "onboardingCompleted",
      null,
      { usePrefix: false },
    );
    const isNewUser = !onboardingCompleted && this.isFirstVisit();

    if (isNewUser) {
      this.startOnboarding();
    }
  }

  isFirstVisit() {
    // Check if this is the user's first visit to the dashboard
    const firstVisit = !storageService.get("hasVisitedDashboard", null, {
      usePrefix: false,
    });
    if (firstVisit) {
      storageService.set("hasVisitedDashboard", "true", { usePrefix: false });
    }
    return firstVisit;
  }

  startOnboarding() {
    this.isActive = true;
    this.currentStep = 0;
    const role = this.getUserRole();
    const steps = this.getOnboardingSteps(role);
    this.totalSteps = steps.length;
    this.showOnboardingModal();
  }

  showOnboardingModal() {
    // Remove existing modal if present
    const existing = document.getElementById("onboarding-modal");
    if (existing) {
      existing.remove();
    }

    const modal = document.createElement("div");
    modal.id = "onboarding-modal";
    modal.className = "onboarding-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "onboarding-title");
    modal.setAttribute("aria-modal", "true");

    // Get role-specific steps
    const role = this.getUserRole();
    const steps = this.getOnboardingSteps(role);
    this.totalSteps = steps.length; // Update total steps based on role

    const currentStepData = steps[this.currentStep];
    const progress = ((this.currentStep + 1) / this.totalSteps) * 100;

    // Build modal HTML string
    const modalHTML = `
      <div class="onboarding-overlay"></div>
      <div class="onboarding-content">
        <div class="onboarding-header">
          <div class="onboarding-progress">
            <div class="onboarding-progress-bar" style="width: ${progress}%"></div>
          </div>
          <button class="onboarding-skip" aria-label="Skip onboarding">Skip</button>
        </div>
        <div class="onboarding-body">
          <div class="onboarding-icon">${currentStepData.icon}</div>
          <h2 id="onboarding-title" class="onboarding-title">${currentStepData.title}</h2>
          <p class="onboarding-text">${currentStepData.content}</p>
          ${
            currentStepData.action
              ? `
            <div class="onboarding-action" style="margin-top: 20px;">
              <a href="${currentStepData.action.url}" class="btn btn-primary" style="text-decoration: none; display: inline-block;">
                ${currentStepData.action.label}
                <i data-lucide="arrow-right" aria-hidden="true"></i>
              </a>
            </div>
          `
              : ""
          }
        </div>
        <div class="onboarding-footer">
          <button class="btn btn-secondary onboarding-back" ${this.currentStep === 0 ? "disabled" : ""}>
            <i data-lucide="chevron-left" aria-hidden="true"></i> Back
          </button>
          <div class="onboarding-dots" role="tablist" aria-label="Onboarding steps">
            ${steps
              .map(
                (_, index) => `
              <span class="onboarding-dot ${index === this.currentStep ? "active" : ""}" 
                    role="tab"
                    aria-selected="${index === this.currentStep}"
                    aria-label="Step ${index + 1} of ${this.totalSteps}"></span>
            `,
              )
              .join("")}
          </div>
          <button class="btn btn-primary onboarding-next">
            ${this.currentStep === this.totalSteps - 1 ? "Get Started" : "Next"}
            <i data-lucide="chevron-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;

    // Use setSafeContent to set modal HTML (sanitizes content)
    setSafeContent(modal, modalHTML, true);

    document.body.appendChild(modal);

    // Initialize icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    // Add event listeners
    this.attachEventListeners(modal);

    // Focus management
    modal.focus();
    this.trapFocus(modal);
  }

  attachEventListeners(modal) {
    const nextBtn = modal.querySelector(".onboarding-next");
    const backBtn = modal.querySelector(".onboarding-back");
    const skipBtn = modal.querySelector(".onboarding-skip");
    const overlay = modal.querySelector(".onboarding-overlay");

    nextBtn.addEventListener("click", () => this.nextStep());
    backBtn.addEventListener("click", () => this.previousStep());
    skipBtn.addEventListener("click", () => this.skipOnboarding());
    overlay.addEventListener("click", () => this.skipOnboarding());

    // Keyboard navigation
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.skipOnboarding();
      } else if (e.key === "ArrowRight" && !e.shiftKey) {
        e.preventDefault();
        this.nextStep();
      } else if (
        e.key === "ArrowLeft" ||
        (e.key === "ArrowRight" && e.shiftKey)
      ) {
        e.preventDefault();
        this.previousStep();
      }
    });
  }

  trapFocus(modal) {
    // Store previous focus
    this.previousFocus = document.activeElement;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") {
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener("keydown", handleKeyDown);

    // Store handler for cleanup
    modal._focusTrapHandler = handleKeyDown;
  }

  restoreFocus(modal) {
    // Restore focus when modal closes
    if (this.previousFocus && typeof this.previousFocus.focus === "function") {
      this.previousFocus.focus();
    }

    // Clean up event listener
    if (modal._focusTrapHandler) {
      modal.removeEventListener("keydown", modal._focusTrapHandler);
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.completedSteps.add(this.currentStep - 1);
      this.showOnboardingModal();
    } else {
      this.completeOnboarding();
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showOnboardingModal();
    }
  }

  skipOnboarding() {
    if (
      confirm( // eslint-disable-line no-alert
        "Skip the onboarding tour? You can always access help from the menu.",
      )
    ) {
      const modal = document.getElementById("onboarding-modal");
      if (modal) {
        this.restoreFocus(modal);
      }
      this.completeOnboarding();
    }
  }

  completeOnboarding() {
    storageService.set("onboardingCompleted", "true", { usePrefix: false });
    storageService.set("onboardingCompletedDate", new Date().toISOString(), {
      usePrefix: false,
    });
    this.isActive = false;

    const modal = document.getElementById("onboarding-modal");
    if (modal) {
      this.restoreFocus(modal);
      modal.style.opacity = "0";
      setTimeout(() => modal.remove(), 300);
    }

    // Show welcome message
    this.showWelcomeMessage();
  }

  showWelcomeMessage() {
    const welcome = document.createElement("div");
    welcome.className = "onboarding-welcome";

    const content = document.createElement("div");
    content.className = "onboarding-welcome-content";

    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", "check-circle");
    icon.setAttribute("aria-hidden", "true");

    const p = document.createElement("p");
    const text = document.createTextNode("Welcome to FlagFit Pro! Press ");
    const kbd = document.createElement("kbd");
    kbd.textContent = "?";
    const text2 = document.createTextNode(" for keyboard shortcuts.");
    p.appendChild(text);
    p.appendChild(kbd);
    p.appendChild(text2);

    content.appendChild(icon);
    content.appendChild(p);
    welcome.appendChild(content);

    document.body.appendChild(welcome);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    setTimeout(() => {
      welcome.style.opacity = "0";
      setTimeout(() => welcome.remove(), 300);
    }, 5000);
  }

  // Method to restart onboarding (for help menu)
  restartOnboarding() {
    storageService.remove("onboardingCompleted", { usePrefix: false });
    this.currentStep = 0;
    this.startOnboarding();
  }
}

// Initialize onboarding manager
export const onboardingManager = new OnboardingManager();
