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
        console.log('🎨 Applying theme:', theme);
        
        // Set data-theme attribute on html FIRST - this updates CSS variables
        document.documentElement.setAttribute('data-theme', theme);
        
        // Then set on body - this applies element-specific styles
        document.body.setAttribute('data-theme', theme);
        
        // Verify it was set
        console.log('✅ data-theme set on html:', document.documentElement.getAttribute('data-theme'));
        console.log('✅ data-theme set on body:', document.body.getAttribute('data-theme'));
        
        // Force CSS variable recalculation by accessing computed styles
        const htmlStyles = window.getComputedStyle(document.documentElement);
        const bodyStyles = window.getComputedStyle(document.body);
        void htmlStyles.getPropertyValue('--surface-primary');
        void bodyStyles.backgroundColor;
        
        // Note: Theme styles are applied via CSS selectors [data-theme="dark"] and [data-theme="light"]
        // in dashboard.html and comprehensive-design-system.css. CSS variables are overridden in
        // html[data-theme] selectors to ensure they update when theme changes.

        // Update toggle state
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            // Toggle checked = dark theme, unchecked = light theme
            toggle.checked = theme === 'dark';
            console.log('✅ Toggle state updated:', toggle.checked, 'for theme:', theme);
        }
        
        // Update text to match toggle state
        this.updateToggleText(theme);
        
        // Force a style recalculation to ensure CSS updates
        void document.body.offsetHeight;
        
        // Force re-render of icons if Lucide is loaded
        if (typeof lucide !== 'undefined') {
            setTimeout(() => {
                lucide.createIcons();
            }, 100);
        }
        
        // Log computed styles for debugging
        setTimeout(() => {
            const computedBg = window.getComputedStyle(document.body).backgroundColor;
            const computedColor = window.getComputedStyle(document.body).color;
            console.log('✅ Computed body background:', computedBg);
            console.log('✅ Computed body color:', computedColor);
        }, 10);
    }

    updateToggleText(theme) {
        const textElement = document.querySelector('.theme-toggle-text');
        if (textElement) {
            // Update text label: "Dark" for dark theme, "Light" for light theme
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

