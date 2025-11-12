// Keyboard Shortcuts Manager for FlagFit Pro
// Provides keyboard navigation and command palette

export class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.commandPaletteActive = false;
    this.init();
  }

  init() {
    // Register default shortcuts
    this.registerDefaultShortcuts();
    
    // Listen for keyboard events
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  registerDefaultShortcuts() {
    // Navigation shortcuts (G + key)
    this.register('g', () => {
      this.handleGKeyNavigation();
    }, { description: 'Quick navigation' });

    // Search shortcut
    this.register('/', (e) => {
      e.preventDefault();
      this.focusSearch();
    }, { description: 'Focus search' });

    // Help shortcut
    this.register('?', (e) => {
      e.preventDefault();
      this.showShortcutsHelp();
    }, { description: 'Show keyboard shortcuts' });

    // Command palette
    this.register('ctrl+k', (e) => {
      e.preventDefault();
      this.showCommandPalette();
    }, { description: 'Open command palette' });

    // Escape to close modals
    this.register('escape', () => {
      this.closeModals();
    }, { description: 'Close modals/dialogs' });
  }

  handleGKeyNavigation() {
    let gKeyPressed = false;
    const handler = (e) => {
      if (gKeyPressed) {
        const key = e.key.toLowerCase();
        const navigationMap = {
          'd': '/dashboard.html',
          't': '/training.html',
          'r': '/roster.html',
          'c': '/community.html',
          'a': '/analytics.html',
          's': '/settings.html'
        };

        if (navigationMap[key]) {
          window.location.href = navigationMap[key];
        }

        gKeyPressed = false;
        document.removeEventListener('keydown', handler);
      }
    };

    document.addEventListener('keydown', handler);
    gKeyPressed = true;

    // Reset after 1 second
    setTimeout(() => {
      gKeyPressed = false;
      document.removeEventListener('keydown', handler);
    }, 1000);
  }

  focusSearch() {
    const searchInput = document.querySelector('input[type="search"], .search-input, [aria-label*="search" i]');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    } else {
      // Show message if search not available
      this.showNotification('Search not available on this page');
    }
  }

  showShortcutsHelp() {
    // Import and show help system
    import('./help-system.js').then(({ helpSystem }) => {
      helpSystem.showHelpModal();
      helpSystem.switchTab('shortcuts', document.getElementById('help-modal'));
    });
  }

  showCommandPalette() {
    if (this.commandPaletteActive) return;

    this.commandPaletteActive = true;
    const palette = document.createElement('div');
    palette.id = 'command-palette';
    palette.className = 'command-palette';
    palette.setAttribute('role', 'dialog');
    palette.setAttribute('aria-label', 'Command palette');

    const commands = this.getAvailableCommands();

    palette.innerHTML = `
      <div class="command-palette-overlay"></div>
      <div class="command-palette-content">
        <div class="command-palette-header">
          <i data-lucide="command" aria-hidden="true"></i>
          <input type="text" 
                 class="command-palette-input" 
                 placeholder="Type a command or search..."
                 autocomplete="off"
                 aria-label="Command input">
        </div>
        <div class="command-palette-list" role="listbox">
          ${commands.map((cmd, index) => `
            <button class="command-palette-item ${index === 0 ? 'selected' : ''}" 
                    data-command="${cmd.id}"
                    role="option"
                    ${index === 0 ? 'aria-selected="true"' : ''}>
              <div class="command-palette-item-icon">${cmd.icon || ''}</div>
              <div class="command-palette-item-content">
                <div class="command-palette-item-title">${cmd.title}</div>
                ${cmd.description ? `<div class="command-palette-item-description">${cmd.description}</div>` : ''}
              </div>
              ${cmd.shortcut ? `<div class="command-palette-item-shortcut">${cmd.shortcut}</div>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(palette);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    const input = palette.querySelector('.command-palette-input');
    const list = palette.querySelector('.command-palette-list');
    let selectedIndex = 0;

    input.focus();

    // Filter commands
    input.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const items = list.querySelectorAll('.command-palette-item');
      
      items.forEach((item, index) => {
        const title = item.querySelector('.command-palette-item-title').textContent.toLowerCase();
        const matches = title.includes(query);
        item.style.display = matches ? 'block' : 'none';
        
        if (matches && index < selectedIndex) {
          selectedIndex = index;
        }
      });

      this.updateSelection(list, selectedIndex);
    });

    // Keyboard navigation
    palette.addEventListener('keydown', (e) => {
      const items = Array.from(list.querySelectorAll('.command-palette-item:not([style*="display: none"])'));
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        this.updateSelection(list, selectedIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        this.updateSelection(list, selectedIndex);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = items[selectedIndex];
        if (selected) {
          this.executeCommand(selected.dataset.command);
          this.closeCommandPalette(palette);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeCommandPalette(palette);
      }
    });

    // Click handler
    list.addEventListener('click', (e) => {
      const item = e.target.closest('.command-palette-item');
      if (item) {
        this.executeCommand(item.dataset.command);
        this.closeCommandPalette(palette);
      }
    });

    // Close on overlay click
    palette.querySelector('.command-palette-overlay').addEventListener('click', () => {
      this.closeCommandPalette(palette);
    });
  }

  updateSelection(list, index) {
    const items = Array.from(list.querySelectorAll('.command-palette-item:not([style*="display: none"])'));
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === index);
      item.setAttribute('aria-selected', i === index);
    });
  }

  getAvailableCommands() {
    return [
      { id: 'dashboard', title: 'Go to Dashboard', icon: '🏠', shortcut: 'G+D', action: () => window.location.href = '/dashboard.html' },
      { id: 'training', title: 'Go to Training', icon: '🏋️', shortcut: 'G+T', action: () => window.location.href = '/training.html' },
      { id: 'roster', title: 'Go to Roster', icon: '👥', shortcut: 'G+R', action: () => window.location.href = '/roster.html' },
      { id: 'community', title: 'Go to Community', icon: '💬', shortcut: 'G+C', action: () => window.location.href = '/community.html' },
      { id: 'analytics', title: 'Go to Analytics', icon: '📊', shortcut: 'G+A', action: () => window.location.href = '/analytics.html' },
      { id: 'settings', title: 'Go to Settings', icon: '⚙️', shortcut: 'G+S', action: () => window.location.href = '/settings.html' },
      { id: 'help', title: 'Open Help', icon: '❓', shortcut: '?', action: () => {
        import('./help-system.js').then(({ helpSystem }) => helpSystem.showHelpModal());
      }},
      { id: 'search', title: 'Focus Search', icon: '🔍', shortcut: '/', action: () => this.focusSearch() }
    ];
  }

  executeCommand(commandId) {
    const commands = this.getAvailableCommands();
    const command = commands.find(c => c.id === commandId);
    if (command && command.action) {
      command.action();
    }
  }

  closeCommandPalette(palette) {
    this.commandPaletteActive = false;
    palette.style.opacity = '0';
    setTimeout(() => palette.remove(), 300);
  }

  closeModals() {
    const modals = document.querySelectorAll('.onboarding-modal, .help-modal, .confirmation-modal, .command-palette');
    modals.forEach(modal => {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    });
  }

  register(key, handler, options = {}) {
    this.shortcuts.set(key, { handler, ...options });
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'shortcut-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  handleKeyDown(e) {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }

    const key = e.key.toLowerCase();
    const ctrlKey = e.ctrlKey || e.metaKey;
    const shortcut = ctrlKey ? `ctrl+${key}` : key;

    const shortcutHandler = this.shortcuts.get(shortcut);
    if (shortcutHandler) {
      shortcutHandler.handler(e);
    }
  }
}

// Global instance
export const keyboardShortcuts = new KeyboardShortcuts();

