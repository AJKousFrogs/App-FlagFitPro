// Help System for FlagFit Pro
// Provides contextual help, FAQs, and user documentation

export class HelpSystem {
  constructor() {
    this.faqs = [
      {
        question: "How do I start a training session?",
        answer:
          'Navigate to the Training page from the sidebar, select a training program, and click "Start Session". You can track your progress in real-time.',
        category: "Training",
      },
      {
        question: "How do I add team members to my roster?",
        answer:
          'Go to the Roster page and click "Add Player". Fill in the player\'s information and save. You can also import players from a CSV file.',
        category: "Team Management",
      },
      {
        question: "How do I join a tournament?",
        answer:
          "Visit the Tournaments page to see upcoming events. Click on a tournament to view details and register your team.",
        category: "Tournaments",
      },
      {
        question: "How do I track my performance?",
        answer:
          "Your performance metrics are displayed on the Dashboard. Visit the Analytics page for detailed charts and insights.",
        category: "Analytics",
      },
      {
        question: "Can I customize my dashboard?",
        answer:
          "Currently, the dashboard layout is fixed, but we're working on customization features. Stay tuned for updates!",
        category: "Settings",
      },
      {
        question: "How do I reset my password?",
        answer:
          'Click "Forgot Password" on the login page, enter your email, and follow the instructions sent to your inbox.',
        category: "Account",
      },
      {
        question: "What keyboard shortcuts are available?",
        answer:
          "Press ? to see all available keyboard shortcuts. Common shortcuts include G+D for Dashboard, G+T for Training, and / to focus search.",
        category: "Navigation",
      },
      {
        question: "How do I contact support?",
        answer:
          "You can reach support through the Help menu, or email support@flagfitpro.com. We typically respond within 24 hours.",
        category: "Support",
      },
    ];

    this.init();
  }

  init() {
    // Add help menu to navigation if not present
    this.addHelpMenu();

    // Initialize contextual help tooltips
    this.initContextualHelp();
  }

  addHelpMenu() {
    // Check if help menu already exists
    if (document.getElementById("help-menu-item")) {return;}

    // Find navigation sidebar
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) {return;}

    // Find settings section or create help section
    let helpSection = sidebar.querySelector(".nav-section:last-child");
    if (!helpSection) {
      helpSection = document.createElement("div");
      helpSection.className = "nav-section";
      sidebar.appendChild(helpSection);
    }

    const helpItem = document.createElement("a");
    helpItem.id = "help-menu-item";
    helpItem.href = "#";
    helpItem.className = "nav-item";
    helpItem.innerHTML = `
      <div class="nav-item-icon">
        <i data-lucide="help-circle" aria-hidden="true"></i>
      </div>
      <span>Help</span>
    `;
    helpItem.addEventListener("click", (e) => {
      e.preventDefault();
      this.showHelpModal();
    });

    helpSection.appendChild(helpItem);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  showHelpModal() {
    // Remove existing modal
    const existing = document.getElementById("help-modal");
    if (existing) {existing.remove();}

    const modal = document.createElement("div");
    modal.id = "help-modal";
    modal.className = "help-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "help-title");
    modal.setAttribute("aria-modal", "true");

    modal.innerHTML = `
      <div class="help-overlay"></div>
      <div class="help-content">
        <div class="help-header">
          <h2 id="help-title">Help & Support</h2>
          <button class="help-close" aria-label="Close help">
            <i data-lucide="x" aria-hidden="true"></i>
          </button>
        </div>
        <div class="help-body">
          <div class="help-tabs">
            <button class="help-tab active" data-tab="faq">FAQ</button>
            <button class="help-tab" data-tab="guide">User Guide</button>
            <button class="help-tab" data-tab="shortcuts">Shortcuts</button>
            <button class="help-tab" data-tab="contact">Contact</button>
          </div>
          <div class="help-tab-content" id="help-faq">
            ${this.renderFAQ()}
          </div>
          <div class="help-tab-content" id="help-guide" style="display: none;">
            ${this.renderUserGuide()}
          </div>
          <div class="help-tab-content" id="help-shortcuts" style="display: none;">
            ${this.renderShortcuts()}
          </div>
          <div class="help-tab-content" id="help-contact" style="display: none;">
            ${this.renderContact()}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    this.attachHelpListeners(modal);
    modal.focus();
  }

  renderFAQ() {
    const categories = [...new Set(this.faqs.map((faq) => faq.category))];

    return `
      <div class="help-search">
        <input type="search" placeholder="Search FAQs..." id="faq-search" aria-label="Search FAQs">
        <i data-lucide="search" aria-hidden="true"></i>
      </div>
      <div class="help-faq-list">
        ${categories
          .map(
            (category) => `
          <div class="help-faq-category">
            <h3>${category}</h3>
            ${this.faqs
              .filter((faq) => faq.category === category)
              .map(
                (faq, _index) => `
                <div class="help-faq-item" data-faq-index="${this.faqs.indexOf(faq)}">
                  <button class="help-faq-question" aria-expanded="false">
                    <span>${faq.question}</span>
                    <i data-lucide="chevron-down" aria-hidden="true"></i>
                  </button>
                  <div class="help-faq-answer" style="display: none;">
                    ${faq.answer}
                  </div>
                </div>
              `,
              )
              .join("")}
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  renderUserGuide() {
    return `
      <div class="help-guide">
        <h3>Getting Started</h3>
        <ol>
          <li><strong>Complete your profile:</strong> Add your position, experience level, and physical metrics.</li>
          <li><strong>Set up your team:</strong> Add players to your roster and assign positions.</li>
          <li><strong>Start training:</strong> Choose a training program and begin tracking your progress.</li>
          <li><strong>Join tournaments:</strong> Browse upcoming events and register your team.</li>
        </ol>

        <h3>Key Features</h3>
        <ul>
          <li><strong>Dashboard:</strong> Overview of your performance and quick actions</li>
          <li><strong>Training:</strong> Access training programs and track workouts</li>
          <li><strong>Roster:</strong> Manage your team members and their information</li>
          <li><strong>Analytics:</strong> View detailed performance metrics and trends</li>
          <li><strong>Tournaments:</strong> Find and join competitive events</li>
          <li><strong>Community:</strong> Connect with other players and teams</li>
        </ul>

        <h3>Tips</h3>
        <ul>
          <li>Use keyboard shortcuts for faster navigation (press ? to see all shortcuts)</li>
          <li>Enable notifications to stay updated on tournaments and team activities</li>
          <li>Regularly update your performance metrics for accurate analytics</li>
          <li>Use the search function to quickly find players, training sessions, or tournaments</li>
        </ul>
      </div>
    `;
  }

  renderShortcuts() {
    return `
      <div class="help-shortcuts">
        <h3>Keyboard Shortcuts</h3>
        <div class="help-shortcuts-list">
          <div class="help-shortcut-item">
            <kbd>G</kbd> + <kbd>D</kbd>
            <span>Go to Dashboard</span>
          </div>
          <div class="help-shortcut-item">
            <kbd>G</kbd> + <kbd>T</kbd>
            <span>Go to Training</span>
          </div>
          <div class="help-shortcut-item">
            <kbd>G</kbd> + <kbd>R</kbd>
            <span>Go to Roster</span>
          </div>
          <div class="help-shortcut-item">
            <kbd>G</kbd> + <kbd>C</kbd>
            <span>Go to Community</span>
          </div>
          <div class="help-shortcut-item">
            <kbd>/</kbd>
            <span>Focus search</span>
          </div>
          <div class="help-shortcut-item">
            <kbd>?</kbd>
            <span>Show shortcuts</span>
          </div>
          <div class="help-shortcut-item">
            <kbd>Esc</kbd>
            <span>Close modals/dialogs</span>
          </div>
          <div class="help-shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>K</kbd>
            <span>Open command palette</span>
          </div>
        </div>
      </div>
    `;
  }

  renderContact() {
    return `
      <div class="help-contact">
        <h3>Contact Support</h3>
        <p>Need help? We're here for you!</p>
        
        <div class="help-contact-methods">
          <div class="help-contact-item">
            <i data-lucide="mail"></i>
            <div>
              <strong>Email</strong>
              <p>support@flagfitpro.com</p>
            </div>
          </div>
          <div class="help-contact-item">
            <i data-lucide="clock"></i>
            <div>
              <strong>Response Time</strong>
              <p>Typically within 24 hours</p>
            </div>
          </div>
        </div>

        <div class="help-contact-form">
          <h4>Send us a message</h4>
          <form id="contact-form">
            <div class="form-group">
              <label for="contact-subject">Subject</label>
              <input type="text" id="contact-subject" required>
            </div>
            <div class="form-group">
              <label for="contact-message">Message</label>
              <textarea id="contact-message" rows="5" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Send Message</button>
          </form>
        </div>
      </div>
    `;
  }

  attachHelpListeners(modal) {
    const closeBtn = modal.querySelector(".help-close");
    const overlay = modal.querySelector(".help-overlay");
    const tabs = modal.querySelectorAll(".help-tab");
    const faqItems = modal.querySelectorAll(".help-faq-item");
    const searchInput = modal.querySelector("#faq-search");

    closeBtn.addEventListener("click", () => this.closeHelpModal(modal));
    overlay.addEventListener("click", () => this.closeHelpModal(modal));

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName, modal);
      });
    });

    faqItems.forEach((item) => {
      const question = item.querySelector(".help-faq-question");
      question.addEventListener("click", () => {
        const answer = item.querySelector(".help-faq-answer");
        const isExpanded = question.getAttribute("aria-expanded") === "true";

        question.setAttribute("aria-expanded", !isExpanded);
        answer.style.display = isExpanded ? "none" : "block";

        const icon = question.querySelector("i");
        if (icon) {
          icon.setAttribute(
            "data-lucide",
            isExpanded ? "chevron-down" : "chevron-up",
          );
          if (typeof lucide !== "undefined") {lucide.createIcons();}
        }
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.filterFAQs(e.target.value, modal);
      });
    }

    // Contact form
    const contactForm = modal.querySelector("#contact-form");
    if (contactForm) {
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleContactSubmit(contactForm);
      });
    }

    // Keyboard navigation
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeHelpModal(modal);
      }
    });
  }

  switchTab(tabName, modal) {
    const tabs = modal.querySelectorAll(".help-tab");
    const contents = modal.querySelectorAll(".help-tab-content");

    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    contents.forEach((content) => {
      content.style.display =
        content.id === `help-${tabName}` ? "block" : "none";
    });

    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  filterFAQs(query, modal) {
    const faqItems = modal.querySelectorAll(".help-faq-item");
    const lowerQuery = query.toLowerCase();

    faqItems.forEach((item) => {
      const question = item.querySelector(
        ".help-faq-question span",
      ).textContent;
      const answer = item.querySelector(".help-faq-answer").textContent;
      const matches =
        question.toLowerCase().includes(lowerQuery) ||
        answer.toLowerCase().includes(lowerQuery);

      item.style.display = matches ? "block" : "none";
    });
  }

  handleContactSubmit(form) {
    const subject = form.querySelector("#contact-subject").value;
    const message = form.querySelector("#contact-message").value;

    // In a real app, this would send to a backend
    alert(
      `Thank you! Your message has been sent.\n\nSubject: ${subject}\n\nMessage: ${message}\n\nWe'll get back to you soon.`,
    );
    form.reset();
  }

  closeHelpModal(modal) {
    modal.style.opacity = "0";
    setTimeout(() => modal.remove(), 300);
  }

  initContextualHelp() {
    // Add help icons to complex features
    const helpTriggers = document.querySelectorAll("[data-help]");
    helpTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const helpTopic = trigger.getAttribute("data-help");
        this.showContextualHelp(helpTopic, trigger);
      });
    });
  }

  showContextualHelp(topic, element) {
    // Show tooltip or modal with contextual help
    const tooltip = document.createElement("div");
    tooltip.className = "help-tooltip";
    tooltip.textContent = this.getContextualHelpText(topic);

    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + 8}px`;
    tooltip.style.left = `${rect.left}px`;

    document.body.appendChild(tooltip);

    setTimeout(() => tooltip.remove(), 5000);
  }

  getContextualHelpText(topic) {
    const helpTexts = {
      training:
        'Start a training session by selecting a program and clicking "Start Session"',
      roster:
        'Add players to your roster by clicking "Add Player" and filling in their information',
      analytics:
        "View detailed performance metrics and trends in the Analytics section",
      tournaments: "Browse and register for upcoming tournaments",
    };

    return helpTexts[topic] || "Help information not available";
  }
}

// Initialize help system
export const helpSystem = new HelpSystem();
