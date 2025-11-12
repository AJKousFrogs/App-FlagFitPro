// Recently Viewed Tracker for FlagFit Pro
// Tracks and displays recently viewed pages/items

export class RecentlyViewed {
  constructor() {
    this.storageKey = 'recentlyViewed';
    this.maxItems = 10;
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
      timestamp: Date.now()
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

    const widget = document.createElement('div');
    widget.className = 'recently-viewed-widget';
    widget.innerHTML = `
      <div class="recently-viewed-header">
        <h3>Recently Viewed</h3>
        <button class="recently-viewed-clear" aria-label="Clear history">Clear</button>
      </div>
      <div class="recently-viewed-list" id="recently-viewed-list">
        ${this.renderRecentItems()}
      </div>
    `;

    // Insert at the beginning of dashboard
    dashboard.insertBefore(widget, dashboard.firstChild);

    // Add clear button handler
    const clearBtn = widget.querySelector('.recently-viewed-clear');
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear recently viewed history?')) {
        this.clearHistory();
        widget.querySelector('.recently-viewed-list').innerHTML = '<p class="recently-viewed-empty">No recent items</p>';
      }
    });
  }

  renderRecentItems() {
    const items = this.getRecentItems().filter(item => item.url !== window.location.pathname);
    
    if (items.length === 0) {
      return '<p class="recently-viewed-empty">No recent items</p>';
    }

    return items.slice(0, 5).map(item => {
      const timeAgo = this.getTimeAgo(item.timestamp);
      const icon = this.getPageIcon(item.url);
      
      return `
        <a href="${item.url}" class="recently-viewed-item">
          <div class="recently-viewed-icon">${icon}</div>
          <div class="recently-viewed-content">
            <div class="recently-viewed-title">${item.title.replace(' - FlagFit Pro', '')}</div>
            <div class="recently-viewed-time">${timeAgo}</div>
          </div>
          <i data-lucide="chevron-right" aria-hidden="true"></i>
        </a>
      `;
    }).join('');
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
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  clearHistory() {
    localStorage.removeItem(this.storageKey);
  }
}

// Global instance
export const recentlyViewed = new RecentlyViewed();

