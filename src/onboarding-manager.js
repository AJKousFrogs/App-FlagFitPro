// Onboarding Manager for FlagFit Pro
// Handles new user onboarding flow and feature discovery

export class OnboardingManager {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 5;
    this.isActive = false;
    this.completedSteps = new Set();
    this.init();
  }

  init() {
    // Check if user has completed onboarding
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    const isNewUser = !onboardingCompleted && this.isFirstVisit();
    
    if (isNewUser) {
      this.startOnboarding();
    }
  }

  isFirstVisit() {
    // Check if this is the user's first visit to the dashboard
    const firstVisit = !localStorage.getItem('hasVisitedDashboard');
    if (firstVisit) {
      localStorage.setItem('hasVisitedDashboard', 'true');
    }
    return firstVisit;
  }

  startOnboarding() {
    this.isActive = true;
    this.currentStep = 0;
    this.showOnboardingModal();
  }

  showOnboardingModal() {
    // Remove existing modal if present
    const existing = document.getElementById('onboarding-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'onboarding-modal';
    modal.className = 'onboarding-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'onboarding-title');
    modal.setAttribute('aria-modal', 'true');

    const steps = [
      {
        title: 'Welcome to FlagFit Pro!',
        content: 'Your ultimate flag football training and competition platform. Let\'s get you started with a quick tour.',
        icon: '👋'
      },
      {
        title: 'Dashboard Overview',
        content: 'Your dashboard shows your performance metrics, upcoming training sessions, and quick actions. Everything you need is right here.',
        icon: '📊'
      },
      {
        title: 'Training Hub',
        content: 'Access your training programs, track workouts, and monitor your progress. Build your skills with structured programs.',
        icon: '🏋️'
      },
      {
        title: 'Team & Community',
        content: 'Connect with your team, join tournaments, and engage with the flag football community.',
        icon: '👥'
      },
      {
        title: 'You\'re All Set!',
        content: 'Start exploring! You can always access help from the menu or press ? for keyboard shortcuts.',
        icon: '🎉'
      }
    ];

    const currentStepData = steps[this.currentStep];
    const progress = ((this.currentStep + 1) / this.totalSteps) * 100;

    modal.innerHTML = `
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
        </div>
        <div class="onboarding-footer">
          <button class="btn btn-secondary onboarding-back" ${this.currentStep === 0 ? 'disabled' : ''}>
            <i data-lucide="chevron-left" aria-hidden="true"></i> Back
          </button>
          <div class="onboarding-dots" role="tablist" aria-label="Onboarding steps">
            ${steps.map((_, index) => `
              <span class="onboarding-dot ${index === this.currentStep ? 'active' : ''}" 
                    role="tab"
                    aria-selected="${index === this.currentStep}"
                    aria-label="Step ${index + 1} of ${this.totalSteps}"></span>
            `).join('')}
          </div>
          <button class="btn btn-primary onboarding-next">
            ${this.currentStep === this.totalSteps - 1 ? 'Get Started' : 'Next'}
            <i data-lucide="chevron-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Initialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Add event listeners
    this.attachEventListeners(modal);
    
    // Focus management
    modal.focus();
    this.trapFocus(modal);
  }

  attachEventListeners(modal) {
    const nextBtn = modal.querySelector('.onboarding-next');
    const backBtn = modal.querySelector('.onboarding-back');
    const skipBtn = modal.querySelector('.onboarding-skip');
    const overlay = modal.querySelector('.onboarding-overlay');

    nextBtn.addEventListener('click', () => this.nextStep());
    backBtn.addEventListener('click', () => this.previousStep());
    skipBtn.addEventListener('click', () => this.skipOnboarding());
    overlay.addEventListener('click', () => this.skipOnboarding());

    // Keyboard navigation
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.skipOnboarding();
      } else if (e.key === 'ArrowRight' && !e.shiftKey) {
        e.preventDefault();
        this.nextStep();
      } else if (e.key === 'ArrowLeft' || (e.key === 'ArrowRight' && e.shiftKey)) {
        e.preventDefault();
        this.previousStep();
      }
    });
  }

  trapFocus(modal) {
    // Store previous focus
    this.previousFocus = document.activeElement;
    
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

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

    modal.addEventListener('keydown', handleKeyDown);
    
    // Store handler for cleanup
    modal._focusTrapHandler = handleKeyDown;
  }

  restoreFocus(modal) {
    // Restore focus when modal closes
    if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
      this.previousFocus.focus();
    }
    
    // Clean up event listener
    if (modal._focusTrapHandler) {
      modal.removeEventListener('keydown', modal._focusTrapHandler);
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
    if (confirm('Skip the onboarding tour? You can always access help from the menu.')) {
      const modal = document.getElementById('onboarding-modal');
      if (modal) {
        this.restoreFocus(modal);
      }
      this.completeOnboarding();
    }
  }

  completeOnboarding() {
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('onboardingCompletedDate', new Date().toISOString());
    this.isActive = false;
    
    const modal = document.getElementById('onboarding-modal');
    if (modal) {
      this.restoreFocus(modal);
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    }

    // Show welcome message
    this.showWelcomeMessage();
  }

  showWelcomeMessage() {
    const welcome = document.createElement('div');
    welcome.className = 'onboarding-welcome';
    welcome.innerHTML = `
      <div class="onboarding-welcome-content">
        <i data-lucide="check-circle" aria-hidden="true"></i>
        <p>Welcome to FlagFit Pro! Press <kbd>?</kbd> for keyboard shortcuts.</p>
      </div>
    `;
    document.body.appendChild(welcome);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    setTimeout(() => {
      welcome.style.opacity = '0';
      setTimeout(() => welcome.remove(), 300);
    }, 5000);
  }

  // Method to restart onboarding (for help menu)
  restartOnboarding() {
    localStorage.removeItem('onboardingCompleted');
    this.currentStep = 0;
    this.startOnboarding();
  }
}

// Initialize onboarding manager
export const onboardingManager = new OnboardingManager();

