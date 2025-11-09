// Theme Switcher - Toggle between light and dark mode
// Handles theme switching and persistence

class ThemeSwitcher {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        // Apply saved theme on load
        this.applyTheme(this.currentTheme);
        
        // Create toggle switch if it doesn't exist
        this.createToggleSwitch();
        
        // Listen for system preference changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    createToggleSwitch() {
        // Check if toggle already exists
        if (document.getElementById('theme-toggle')) {
            return;
        }

        // Find header-right or create container
        const headerRight = document.querySelector('.header-right');
        if (!headerRight) return;

        // Create toggle container
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'theme-toggle-container';
        const isDark = this.currentTheme === 'dark';
        toggleContainer.innerHTML = `
            <label class="theme-toggle-label" title="Toggle ${isDark ? 'Light' : 'Dark'} Mode">
                <input type="checkbox" id="theme-toggle" class="theme-toggle-input" ${isDark ? 'checked' : ''}>
                <span class="theme-toggle-slider"></span>
                <span class="theme-toggle-text">${isDark ? 'Dark' : 'Light'}</span>
            </label>
        `;

        // Insert before user menu
        const userMenu = headerRight.querySelector('.user-menu');
        if (userMenu) {
            headerRight.insertBefore(toggleContainer, userMenu);
        } else {
            headerRight.appendChild(toggleContainer);
        }

        // Add event listener
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'dark' : 'light';
                this.switchTheme(newTheme);
            });
        }
    }

    switchTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        this.applyTheme(theme);
        this.updateToggleText(theme);
    }

    applyTheme(theme) {
        // Set data-theme attribute on html and body
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        
        // Toggle dark-theme.css (always enabled, but light-theme.css overrides)
        const darkThemeLink = document.querySelector('link[href*="dark-theme.css"]');
        
        // Toggle light-theme.css
        let lightThemeLink = document.querySelector('link[href*="light-theme.css"]');
        if (theme === 'light') {
            if (!lightThemeLink) {
                lightThemeLink = document.createElement('link');
                lightThemeLink.rel = 'stylesheet';
                lightThemeLink.href = './src/light-theme.css';
                lightThemeLink.id = 'light-theme';
                document.head.appendChild(lightThemeLink);
            } else {
                lightThemeLink.disabled = false;
            }
        } else {
            if (lightThemeLink) {
                lightThemeLink.disabled = true;
            }
        }

        // Update toggle state
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.checked = theme === 'dark';
        }
        
        // Force re-render of icons if Lucide is loaded
        if (typeof lucide !== 'undefined') {
            setTimeout(() => {
                lucide.createIcons();
            }, 100);
        }
    }

    updateToggleText(theme) {
        const textElement = document.querySelector('.theme-toggle-text');
        if (textElement) {
            textElement.textContent = theme === 'dark' ? 'Dark' : 'Light';
        }
    }
}

// Initialize theme switcher
let themeSwitcher;
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        themeSwitcher = new ThemeSwitcher();
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeSwitcher;
}

// Make available globally
window.ThemeSwitcher = ThemeSwitcher;

