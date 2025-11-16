// Recently Viewed Tracker for FlagFit Pro
// Tracks and displays recently viewed pages/items with enhanced UX

import { SecureDOMUtils } from './secure-dom-utils.js';

export class RecentlyViewed {
  constructor() {
    this.storageKey = 'recentlyViewed';
    this.maxItems = 10;
    this.mode = localStorage.getItem('recentlyViewedMode') || 'recent'; // 'recent' or 'quick-access'
    this.activeTab = 'all'; // 'all', 'players', 'teams', 'stats', 'reports'
    this.init();
  }

  init() {
    // Track current page view
    this.trackPageView();

    // Add recently viewed widget to dashboard
    if (window.location.pathname.includes('dashboard')) {
      this.addRecentlyViewedWidget();
    }
  }

  trackPageView() {
    const currentPage = {
      url: window.location.pathname,
      title: document.title,
      timestamp: Date.now(),
      category: this.categorizePage(window.location.pathname)
    };

    let recentItems = this.getRecentItems();

    // Remove if already exists
    recentItems = recentItems.filter(item => item.url !== currentPage.url);

    // Add to beginning
    recentItems.unshift(currentPage);

    // Limit to max items
    recentItems = recentItems.slice(0, this.maxItems);

    localStorage.setItem(this.storageKey, JSON.stringify(recentItems));
  }

  categorizePage(url) {
    if (url.includes('roster') || url.includes('player')) return 'players';
    if (url.includes('team') || url.includes('roster')) return 'teams';
    if (url.includes('analytics') || url.includes('stats')) return 'stats';
    if (url.includes('report') || url.includes('assessment')) return 'reports';
    return 'other';
  }

  getRecentItems() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  addRecentlyViewedWidget() {
    const dashboard = document.querySelector('.dashboard-content, .main-content');
    if (!dashboard) return;

    // Remove existing widget if present
    const existingWidget = dashboard.querySelector('.recently-viewed-widget');
    if (existingWidget) {
      existingWidget.remove();
    }

    const widget = SecureDOMUtils.createElement(null, 'div', {
      className: 'recently-viewed-widget'
    });
    
    // Create header
    const header = SecureDOMUtils.createElement(widget, 'div', {
      className: 'recently-viewed-header'
    });
    
    // Create title
    SecureDOMUtils.createElement(header, 'h3', {
      textContent: this.mode === 'quick-access' ? 'Quick Access' : 'Recently Viewed'
    });
    
    // Create actions container
    const actions = SecureDOMUtils.createElement(header, 'div', {
      className: 'recently-viewed-actions'
    });
    
    // Create mode toggle button
    const toggleBtn = SecureDOMUtils.createElement(actions, 'button', {
      className: 'recently-viewed-mode-toggle',
      attributes: {
        'aria-label': 'Toggle view mode',
        'title': `Switch to ${this.mode === 'recent' ? 'Quick Access' : 'Recently Viewed'}`
      }
    });
    
    SecureDOMUtils.createElement(toggleBtn, 'i', {
      attributes: {
        'data-lucide': this.mode === 'recent' ? 'zap' : 'clock',
        'aria-hidden': 'true'
      }
    });
    
    // Add clear button if in recent mode
    if (this.mode === 'recent') {
      SecureDOMUtils.createElement(actions, 'button', {
        className: 'recently-viewed-clear',
        textContent: 'Clear',
        attributes: {
          'aria-label': 'Clear history'
        }
      });
    }
    
    // Add tabs if in recent mode
    if (this.mode === 'recent') {
      this.createTabsSecurely(widget);
    }
    
    // Create list container
    const listContainer = SecureDOMUtils.createElement(widget, 'div', {
      className: 'recently-viewed-list',
      attributes: { id: 'recently-viewed-list' }
    });
    
    // Add content based on mode
    if (this.mode === 'recent') {
      this.renderRecentItemsSecurely(listContainer);
    } else {
      this.renderQuickAccessSecurely(listContainer);
    }

    // Insert at the beginning of dashboard
    dashboard.insertBefore(widget, dashboard.firstChild);

    // Initialize icons
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 100);

    // Add event handlers
    this.attachEventHandlers(widget);
  }


  attachEventHandlers(widget) {
    // Mode toggle
    const modeToggle = widget.querySelector('.recently-viewed-mode-toggle');
    if (modeToggle) {
      modeToggle.addEventListener('click', () => {
        this.mode = this.mode === 'recent' ? 'quick-access' : 'recent';
        localStorage.setItem('recentlyViewedMode', this.mode);
        this.addRecentlyViewedWidget();
      });
    }

    // Clear button
    const clearBtn = widget.querySelector('.recently-viewed-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear recently viewed history?')) {
          this.clearHistory();
          const list = widget.querySelector('.recently-viewed-list');
          if (list) {
            SecureDOMUtils.replaceChildren(list);
            this.renderEmptyStateSecurely(list);
            // Reinitialize icons
            if (typeof lucide !== 'undefined') {
              setTimeout(() => lucide.createIcons(), 50);
            }
          }
        }
      });
    }

    // Tab buttons
    const tabButtons = widget.querySelectorAll('.recently-viewed-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        const list = widget.querySelector('.recently-viewed-list');
        if (list) {
          SecureDOMUtils.replaceChildren(list);
          this.renderRecentItemsSecurely(list);
          // Reinitialize icons
          if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 50);
          }
        }
        // Update active state
        tabButtons.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Item action buttons (remove, pin)
    widget.addEventListener('click', (e) => {
      if (e.target.closest('.item-action-remove')) {
        e.preventDefault();
        e.stopPropagation();
        const item = e.target.closest('.recent-item');
        const url = item?.dataset.url;
        if (url) {
          this.removeItem(url);
          const list = widget.querySelector('.recently-viewed-list');
          if (list) {
            SecureDOMUtils.replaceChildren(list);
            this.renderRecentItemsSecurely(list);
            // Reinitialize icons
            if (typeof lucide !== 'undefined') {
              setTimeout(() => lucide.createIcons(), 50);
            }
          }
        }
      }
    });
  }




  getCategoryLabel(category) {
    const labels = {
      players: 'Player',
      teams: 'Team',
      stats: 'Stats',
      reports: 'Report',
      other: 'Page'
    };
    return labels[category] || 'Page';
  }

  removeItem(url) {
    let items = this.getRecentItems();
    items = items.filter(item => item.url !== url);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  getPageIcon(url) {
    const iconMap = {
      '/dashboard.html': '🏠',
      '/training.html': '🏋️',
      '/roster.html': '👥',
      '/community.html': '💬',
      '/analytics.html': '📊',
      '/tournaments.html': '🏆',
      '/settings.html': '⚙️'
    };

    return iconMap[url] || '📄';
  }

  getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(seconds / 86400);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }

  clearHistory() {
    localStorage.removeItem(this.storageKey);
  }

  createTabsSecurely(parent) {
    const tabs = [
      { id: 'all', label: 'All' },
      { id: 'players', label: 'Players' },
      { id: 'teams', label: 'Teams' },
      { id: 'stats', label: 'Stats' },
      { id: 'reports', label: 'Reports' }
    ];

    const tabsContainer = SecureDOMUtils.createElement(parent, 'div', {
      className: 'recently-viewed-tabs'
    });

    tabs.forEach(tab => {
      SecureDOMUtils.createElement(tabsContainer, 'button', {
        className: `recently-viewed-tab ${this.activeTab === tab.id ? 'active' : ''}`,
        textContent: tab.label,
        attributes: {
          'data-tab': tab.id,
          'aria-label': `Filter by ${tab.label}`
        }
      });
    });
  }

  renderRecentItemsSecurely(container) {
    let items = this.getRecentItems().filter(item => item.url !== window.location.pathname);

    // Filter by active tab
    if (this.activeTab !== 'all') {
      items = items.filter(item => item.category === this.activeTab);
    }

    if (items.length === 0) {
      this.renderEmptyStateSecurely(container);
      return;
    }

    items.slice(0, 5).forEach(item => {
      const timeAgo = this.getTimeAgo(item.timestamp);
      const icon = this.getPageIcon(item.url);
      const category = this.getCategoryLabel(item.category);

      const itemEl = SecureDOMUtils.createElement(container, 'div', {
        className: 'recent-item',
        attributes: { 'data-url': item.url }
      });

      // Item avatar
      SecureDOMUtils.createElement(itemEl, 'div', {
        className: 'item-avatar',
        textContent: icon
      });

      // Item info
      const itemInfo = SecureDOMUtils.createElement(itemEl, 'div', {
        className: 'item-info'
      });

      SecureDOMUtils.createElement(itemInfo, 'span', {
        className: 'item-name',
        textContent: item.title.replace(' - FlagFit Pro', '')
      });

      SecureDOMUtils.createElement(itemInfo, 'span', {
        className: 'item-type',
        textContent: `${category} • ${timeAgo}`
      });

      // Item actions
      const itemActions = SecureDOMUtils.createElement(itemEl, 'div', {
        className: 'item-actions'
      });

      // Remove button
      const removeBtn = SecureDOMUtils.createElement(itemActions, 'button', {
        className: 'item-action-remove',
        attributes: {
          'aria-label': 'Remove item',
          'title': 'Remove'
        }
      });

      SecureDOMUtils.createElement(removeBtn, 'i', {
        attributes: {
          'data-lucide': 'x',
          'aria-hidden': 'true'
        }
      });

      // View link
      const viewLink = SecureDOMUtils.createElement(itemActions, 'a', {
        className: 'item-action',
        attributes: {
          'href': item.url,
          'aria-label': 'View'
        }
      });

      SecureDOMUtils.createElement(viewLink, 'i', {
        attributes: {
          'data-lucide': 'arrow-right',
          'aria-hidden': 'true'
        }
      });
    });
  }

  renderEmptyStateSecurely(container) {
    const emptyState = SecureDOMUtils.createElement(container, 'div', {
      className: 'recently-viewed-empty'
    });

    SecureDOMUtils.createElement(emptyState, 'div', {
      className: 'empty-icon',
      textContent: '📊'
    });

    SecureDOMUtils.createElement(emptyState, 'h3', {
      textContent: 'Start exploring to see your recent items'
    });

    SecureDOMUtils.createElement(emptyState, 'p', {
      textContent: 'View players, teams, or stats to build your recent activity'
    });

    // Suggested actions
    const actions = SecureDOMUtils.createElement(emptyState, 'div', {
      className: 'suggested-actions'
    });

    // Players link
    const playersLink = SecureDOMUtils.createElement(actions, 'a', {
      className: 'btn btn-secondary btn-sm btn-quick-action',
      attributes: { href: '/roster.html' }
    });

    SecureDOMUtils.createElement(playersLink, 'i', {
      attributes: {
        'data-lucide': 'users',
        'aria-hidden': 'true'
      }
    });

    SecureDOMUtils.setTextContent(playersLink, playersLink.textContent + 'View Top Players');

    // Teams link
    const teamsLink = SecureDOMUtils.createElement(actions, 'a', {
      className: 'btn btn-secondary btn-sm btn-quick-action',
      attributes: { href: '/roster.html' }
    });

    SecureDOMUtils.createElement(teamsLink, 'i', {
      attributes: {
        'data-lucide': 'users-round',
        'aria-hidden': 'true'
      }
    });

    SecureDOMUtils.setTextContent(teamsLink, teamsLink.textContent + 'Browse Teams');
  }

  renderQuickAccessSecurely(container) {
    const quickActions = [
      {
        icon: 'trophy',
        label: 'Recent Matches',
        url: '/tournaments.html',
        description: 'View latest game results'
      },
      {
        icon: 'trending-up',
        label: 'Top Performers',
        url: '/analytics.html',
        description: 'See leading players'
      },
      {
        icon: 'calendar',
        label: 'Upcoming Games',
        url: '/tournaments.html',
        description: 'Check schedule'
      },
      {
        icon: 'dumbbell',
        label: 'Training Schedules',
        url: '/training.html',
        description: 'View workouts'
      }
    ];

    const grid = SecureDOMUtils.createElement(container, 'div', {
      className: 'quick-access-grid'
    });

    quickActions.forEach(action => {
      const item = SecureDOMUtils.createElement(grid, 'a', {
        className: 'quick-access-item',
        attributes: { href: action.url }
      });

      // Icon container
      const iconContainer = SecureDOMUtils.createElement(item, 'div', {
        className: 'quick-access-icon'
      });

      SecureDOMUtils.createElement(iconContainer, 'i', {
        attributes: {
          'data-lucide': action.icon,
          'aria-hidden': 'true'
        }
      });

      // Content container
      const content = SecureDOMUtils.createElement(item, 'div', {
        className: 'quick-access-content'
      });

      SecureDOMUtils.createElement(content, 'span', {
        className: 'quick-access-label',
        textContent: action.label
      });

      SecureDOMUtils.createElement(content, 'span', {
        className: 'quick-access-description',
        textContent: action.description
      });

      // Arrow
      SecureDOMUtils.createElement(item, 'i', {
        className: 'quick-access-arrow',
        attributes: {
          'data-lucide': 'arrow-right',
          'aria-hidden': 'true'
        }
      });
    });
  }
}

// Global instance
export const recentlyViewed = new RecentlyViewed();

