/* eslint-disable no-console */
/**
 * Enhanced Sidebar Navigation Component
 * Handles collapsible sections, user menu, and improved interactions
 */

class EnhancedSidebarNav {
  constructor() {
    this.sidebar = null;
    this.userMenuToggle = null;
    this.userMenu = null;
    this.sectionHeaders = [];
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.sidebar = document.getElementById('sidebar');
    if (!this.sidebar) return;

    this.setupCollapsibleSections();
    this.setupUserMenu();
    this.setupKeyboardNavigation();
    this.loadUserInfo();
    this.setupClickOutside();
  }

  setupCollapsibleSections() {
    this.sectionHeaders = this.sidebar.querySelectorAll('.nav-section-header');
    
    this.sectionHeaders.forEach(header => {
      // Set initial state from aria-expanded
      const isExpanded = header.getAttribute('aria-expanded') === 'true';
      this.toggleSection(header, isExpanded, false);

      header.addEventListener('click', (e) => {
        e.preventDefault();
        const isCurrentlyExpanded = header.getAttribute('aria-expanded') === 'true';
        this.toggleSection(header, !isCurrentlyExpanded);
      });

      // Keyboard support
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const isCurrentlyExpanded = header.getAttribute('aria-expanded') === 'true';
          this.toggleSection(header, !isCurrentlyExpanded);
        }
      });
    });
  }

  toggleSection(header, expand, animate = true) {
    const sectionId = header.getAttribute('aria-controls');
    const section = document.getElementById(sectionId);
    const wrapper = header.closest('.nav-section-wrapper');
    if (!section || !wrapper) return;

    header.setAttribute('aria-expanded', expand.toString());
    
    // Toggle collapsed class on wrapper for CSS compatibility
    if (expand) {
      wrapper.classList.remove('collapsed');
    } else {
      wrapper.classList.add('collapsed');
    }
    
    if (animate) {
      // Trigger animation
      if (expand) {
        section.style.maxHeight = section.scrollHeight + 'px';
        setTimeout(() => {
          section.style.maxHeight = '1000px';
        }, 300);
      } else {
        section.style.maxHeight = section.scrollHeight + 'px';
        // Force reflow
        section.offsetHeight;
        section.style.maxHeight = '0';
      }
    } else {
      section.style.maxHeight = expand ? '1000px' : '0';
    }
  }

  setupUserMenu() {
    this.userMenuToggle = document.getElementById('sidebar-user-menu-toggle');
    this.userMenu = document.getElementById('sidebar-user-menu');
    
    if (!this.userMenuToggle || !this.userMenu) return;

    this.userMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleUserMenu();
    });

    // Close menu when clicking on menu items
    const menuItems = this.userMenu.querySelectorAll('.sidebar-user-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        this.closeUserMenu();
      });
    });
  }

  toggleUserMenu() {
    const isOpen = this.userMenu.getAttribute('aria-hidden') === 'false';
    this.userMenu.setAttribute('aria-hidden', (!isOpen).toString());
    this.userMenuToggle.setAttribute('aria-expanded', (!isOpen).toString());
    
    if (!isOpen) {
      // Focus first menu item
      const firstItem = this.userMenu.querySelector('.sidebar-user-menu-item');
      firstItem?.focus();
    }
  }

  closeUserMenu() {
    this.userMenu.setAttribute('aria-hidden', 'true');
    this.userMenuToggle.setAttribute('aria-expanded', 'false');
  }

  setupClickOutside() {
    document.addEventListener('click', (e) => {
      if (this.userMenu && this.userMenuToggle) {
        const isClickInside = this.userMenu.contains(e.target) || 
                             this.userMenuToggle.contains(e.target);
        if (!isClickInside && this.userMenu.getAttribute('aria-hidden') === 'false') {
          this.closeUserMenu();
        }
      }
    });
  }

  setupKeyboardNavigation() {
    // Escape key closes user menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.userMenu && this.userMenu.getAttribute('aria-hidden') === 'false') {
          this.closeUserMenu();
          this.userMenuToggle?.focus();
        }
      }
    });

    // Arrow key navigation in user menu
    if (this.userMenu) {
      const menuItems = Array.from(this.userMenu.querySelectorAll('.sidebar-user-menu-item'));
      
      this.userMenu.addEventListener('keydown', (e) => {
        if (this.userMenu.getAttribute('aria-hidden') === 'true') return;

        const currentIndex = menuItems.indexOf(document.activeElement);
        let nextIndex = currentIndex;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
            menuItems[nextIndex]?.focus();
            break;
          case 'ArrowUp':
            e.preventDefault();
            nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
            menuItems[nextIndex]?.focus();
            break;
          case 'Home':
            e.preventDefault();
            menuItems[0]?.focus();
            break;
          case 'End':
            e.preventDefault();
            menuItems[menuItems.length - 1]?.focus();
            break;
        }
      });
    }
  }

  loadUserInfo() {
    // Try to load user info from localStorage or API
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        const userNameEl = document.getElementById('sidebar-user-name');
        const userRoleEl = document.getElementById('sidebar-user-role');
        
        if (userNameEl && user.name) {
          userNameEl.textContent = user.name;
        }
        if (userRoleEl && user.role) {
          userRoleEl.textContent = user.role;
        }
      }
    } catch (e) {
      console.warn('Could not load user info:', e);
    }
  }

  // Public method to update user info
  updateUserInfo(name, role) {
    const userNameEl = document.getElementById('sidebar-user-name');
    const userRoleEl = document.getElementById('sidebar-user-role');
    
    if (userNameEl && name) {
      userNameEl.textContent = name;
    }
    if (userRoleEl && role) {
      userRoleEl.textContent = role;
    }
  }

  // Public method to collapse/expand all sections
  collapseAllSections() {
    this.sectionHeaders.forEach(header => {
      this.toggleSection(header, false);
    });
  }

  expandAllSections() {
    this.sectionHeaders.forEach(header => {
      this.toggleSection(header, true);
    });
  }
}

// Initialize enhanced sidebar navigation
let enhancedSidebarNav;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    enhancedSidebarNav = new EnhancedSidebarNav();
    window.enhancedSidebarNav = enhancedSidebarNav;
  });
} else {
  enhancedSidebarNav = new EnhancedSidebarNav();
  window.enhancedSidebarNav = enhancedSidebarNav;
}

// Logout handler (uses AuthManager if available)
window.handleLogout = window.handleLogout || function() {
  if (window.authManager && typeof window.authManager.logout === 'function') {
    window.authManager.logout();
  } else {
    // Fallback logout behavior
    if (confirm('Are you sure you want to sign out?')) {
      // Clear user data
      localStorage.removeItem('userData');
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      
      // Redirect to login
      window.location.href = '/login.html';
    }
  }
};

// Export for module usage
export { EnhancedSidebarNav };

