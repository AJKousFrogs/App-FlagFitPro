// Recently Viewed Tracker for FlagFit Pro
// Tracks and displays recently viewed pages/items with enhanced UX

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

    const widget = document.createElement('div');
    widget.className = 'recently-viewed-widget';
    widget.innerHTML = `
      <div class="recently-viewed-header">
        <h3>${this.mode === 'quick-access' ? 'Quick Access' : 'Recently Viewed'}</h3>
        <div class="recently-viewed-actions">
          <button class="recently-viewed-mode-toggle" aria-label="Toggle view mode" title="Switch to ${this.mode === 'recent' ? 'Quick Access' : 'Recently Viewed'}">
            <i data-lucide="${this.mode === 'recent' ? 'zap' : 'clock'}" aria-hidden="true"></i>
          </button>
          ${this.mode === 'recent' ? '<button class="recently-viewed-clear" aria-label="Clear history">Clear</button>' : ''}
        </div>
      </div>
      ${this.mode === 'recent' ? this.renderTabs() : ''}
      <div class="recently-viewed-list" id="recently-viewed-list">
        ${this.mode === 'recent' ? this.renderRecentItems() : this.renderQuickAccess()}
      </div>
    `;

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

  renderTabs() {
    const tabs = [
      { id: 'all', label: 'All' },
      { id: 'players', label: 'Players' },
      { id: 'teams', label: 'Teams' },
      { id: 'stats', label: 'Stats' },
      { id: 'reports', label: 'Reports' }
    ];

    return `
      <div class="recently-viewed-tabs">
        ${tabs.map(tab => `
          <button
            class="recently-viewed-tab ${this.activeTab === tab.id ? 'active' : ''}"
            data-tab="${tab.id}"
            aria-label="Filter by ${tab.label}"
          >
            ${tab.label}
          </button>
        `).join('')}
      </div>
    `;
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
            list.innerHTML = this.renderEmptyState();
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
          list.innerHTML = this.renderRecentItems();
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
            list.innerHTML = this.renderRecentItems();
            // Reinitialize icons
            if (typeof lucide !== 'undefined') {
              setTimeout(() => lucide.createIcons(), 50);
            }
          }
        }
      }
    });
  }

  renderEmptyState() {
    return `
      <div class="recently-viewed-empty">
        <div class="empty-icon">📊</div>
        <h3>Start exploring to see your recent items</h3>
        <p>View players, teams, or stats to build your recent activity</p>
        <div class="suggested-actions">
          <a href="/roster.html" class="btn btn-secondary btn-sm btn-quick-action">
            <i data-lucide="users" aria-hidden="true"></i>
            View Top Players
          </a>
          <a href="/roster.html" class="btn btn-secondary btn-sm btn-quick-action">
            <i data-lucide="users-round" aria-hidden="true"></i>
            Browse Teams
          </a>
        </div>
      </div>
    `;
  }

  renderQuickAccess() {
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

    return `
      <div class="quick-access-grid">
        ${quickActions.map(action => `
          <a href="${action.url}" class="quick-access-item">
            <div class="quick-access-icon">
              <i data-lucide="${action.icon}" aria-hidden="true"></i>
            </div>
            <div class="quick-access-content">
              <span class="quick-access-label">${action.label}</span>
              <span class="quick-access-description">${action.description}</span>
            </div>
            <i data-lucide="arrow-right" class="quick-access-arrow" aria-hidden="true"></i>
          </a>
        `).join('')}
      </div>
    `;
  }

  renderRecentItems() {
    let items = this.getRecentItems().filter(item => item.url !== window.location.pathname);

    // Filter by active tab
    if (this.activeTab !== 'all') {
      items = items.filter(item => item.category === this.activeTab);
    }

    if (items.length === 0) {
      return this.renderEmptyState();
    }

    return items.slice(0, 5).map(item => {
      const timeAgo = this.getTimeAgo(item.timestamp);
      const icon = this.getPageIcon(item.url);
      const category = this.getCategoryLabel(item.category);

      return `
        <div class="recent-item" data-url="${item.url}">
          <div class="item-avatar">${icon}</div>
          <div class="item-info">
            <span class="item-name">${item.title.replace(' - FlagFit Pro', '')}</span>
            <span class="item-type">${category} • ${timeAgo}</span>
          </div>
          <div class="item-actions">
            <button class="item-action-remove" aria-label="Remove item" title="Remove">
              <i data-lucide="x" aria-hidden="true"></i>
            </button>
            <a href="${item.url}" class="item-action" aria-label="View">
              <i data-lucide="arrow-right" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      `;
    }).join('');
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
}

// Global instance
export const recentlyViewed = new RecentlyViewed();

