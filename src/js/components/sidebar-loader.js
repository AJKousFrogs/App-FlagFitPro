/**
 * Sidebar Navigation Loader
 * Dynamically loads and injects the unified sidebar component
 * Handles active state based on current page
 */

import { BaseComponentLoader } from './base-component-loader.js';
import { onDOMReady } from '../utils/dom-ready.js';

class SidebarLoader extends BaseComponentLoader {
  constructor() {
    super({
      containerSelector: '[data-sidebar-container]',
      componentPath: './src/components/organisms/sidebar-navigation.html',
      componentName: 'Sidebar',
      createContainer: SidebarLoader.createSidebarContainer,
      autoInit: false // We'll handle initialization manually
    });

    this.currentPage = SidebarLoader.getCurrentPage();
    this.init();
  }

  /**
   * Get current page name from URL
   */
  static getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'dashboard';
    return page;
  }

  /**
   * Create sidebar container if it doesn't exist
   */
  static createContainer() {
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (!dashboardContainer) {
      throw new Error('Dashboard container not found');
    }

    const container = document.createElement('div');
    container.setAttribute('data-sidebar-container', '');
    dashboardContainer.insertBefore(container, dashboardContainer.firstChild);
    return container;
  }

  /**
   * Override afterLoad to set active page
   */
  afterLoad() {
    super.afterLoad();
    this.setActivePage();
  }

  /**
   * Set active state for current page
   */
  setActivePage() {
    // Remove all active classes
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // Add active class to current page
    const currentNavItem = document.querySelector(
      `.sidebar .nav-item[data-page="${this.currentPage}"]`
    );

    if (currentNavItem) {
      currentNavItem.classList.add('active');
      currentNavItem.setAttribute('aria-current', 'page');
    } else {
      // Fallback: try to match by href
      const fallbackItem = document.querySelector(
        `.sidebar .nav-item[href*="${this.currentPage}"]`
      );
      if (fallbackItem) {
        fallbackItem.classList.add('active');
        fallbackItem.setAttribute('aria-current', 'page');
      }
    }
  }
}

// Auto-initialize on DOM ready
onDOMReady(() => {
  window.sidebarLoader = new SidebarLoader();
});

export { SidebarLoader };
