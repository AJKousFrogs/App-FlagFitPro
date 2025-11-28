/**
 * Footer Loader
 * Dynamically loads and injects the unified footer component
 * Supports both main footer and landing page footer variants
 */

class FooterLoader {
  constructor() {
    this.footerContainer = null;
    this.footerType = this.detectFooterType();
    this.init();
  }

  /**
   * Detect which footer type to load based on page
   */
  detectFooterType() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'index';

    // Landing pages use the enhanced footer
    const landingPages = ['index', 'login', 'register', 'reset-password'];

    return landingPages.includes(page) ? 'landing' : 'main';
  }

  /**
   * Initialize footer loading
   */
  async init() {
    try {
      await this.loadFooter();
      this.initializeLucideIcons();
    } catch (error) {
      console.error('[Footer Loader] Failed to load footer:', error);
    }
  }

  /**
   * Load footer HTML from component file
   */
  async loadFooter() {
    try {
      const footerFile =
        this.footerType === 'landing'
          ? './src/components/organisms/footer-landing.html'
          : './src/components/organisms/footer-unified.html';

      const response = await fetch(footerFile);

      if (!response.ok) {
        throw new Error(`Failed to load footer: ${response.status}`);
      }

      const footerHTML = await response.text();

      // Find the footer container or create one
      this.footerContainer = document.querySelector('[data-footer-container]');

      if (!this.footerContainer) {
        // Create container at the end of body
        this.footerContainer = document.createElement('div');
        this.footerContainer.setAttribute('data-footer-container', '');
        document.body.appendChild(this.footerContainer);
      }

      // Inject footer HTML
      this.footerContainer.innerHTML = footerHTML;

      console.log(`[Footer Loader] Footer loaded successfully (${this.footerType})`);
    } catch (error) {
      console.error('[Footer Loader] Error loading footer HTML:', error);
      throw error;
    }
  }

  /**
   * Initialize Lucide icons in footer
   */
  initializeLucideIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    } else {
      // Wait for Lucide to load
      let attempts = 0;
      const maxAttempts = 50;
      const checkLucide = setInterval(() => {
        attempts++;
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          clearInterval(checkLucide);
          lucide.createIcons();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkLucide);
          console.warn('[Footer Loader] Lucide icons not loaded');
        }
      }, 100);
    }
  }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.footerLoader = new FooterLoader();
  });
} else {
  // DOM already loaded
  window.footerLoader = new FooterLoader();
}

export { FooterLoader };
