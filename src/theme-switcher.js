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
        // Check if toggle already exists (either theme-toggle or header-theme-toggle)
        if (document.getElementById('theme-toggle') || document.getElementById('header-theme-toggle')) {
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
        
        // Add/remove theme classes for compatibility
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            document.body.classList.add('dark');
            document.body.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
            document.body.classList.add('light');
            document.body.classList.remove('dark');
        }
        
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

        // Update toggle state - check both possible toggle IDs
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.checked = theme === 'dark';
        }
        
        // Also update header-theme-toggle if it exists (for dashboard.html)
        const headerToggle = document.getElementById('header-theme-toggle');
        if (headerToggle) {
            headerToggle.checked = theme === 'dark';
            // Update the visual toggle dot and text within the header toggle container
            const toggleContainer = headerToggle.closest('.theme-toggle-container');
            if (toggleContainer) {
                const toggleDot = toggleContainer.querySelector('#theme-toggle-dot');
                const toggleText = toggleContainer.querySelector('.theme-toggle-text');
                const toggleSlider = toggleContainer.querySelector('.theme-toggle-slider');
                if (toggleDot && toggleText && toggleSlider) {
                    if (theme === 'dark') {
                        toggleDot.style.transform = 'translateX(26px)';
                        toggleSlider.style.background = '#10c96b';
                        toggleText.textContent = '🌙 Dark';
                    } else {
                        toggleDot.style.transform = 'translateX(0px)';
                        toggleSlider.style.background = '#e2e8f0';
                        toggleText.textContent = '☀️ Light';
                    }
                }
            }
        }
        
        // Force re-render of icons if Lucide is loaded
        if (typeof lucide !== 'undefined') {
            setTimeout(() => {
                lucide.createIcons();
            }, 100);
        }
    }

    updateToggleText(theme) {
        // Update all theme toggle text elements
        const textElements = document.querySelectorAll('.theme-toggle-text');
        textElements.forEach(textElement => {
            // Check if it's the header toggle (has emoji)
            const container = textElement.closest('.theme-toggle-container');
            if (container && container.querySelector('#header-theme-toggle')) {
                textElement.textContent = theme === 'dark' ? '🌙 Dark' : '☀️ Light';
            } else {
                textElement.textContent = theme === 'dark' ? 'Dark' : 'Light';
            }
        });
    }
}

// Initialize theme switcher
let themeSwitcher;
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        themeSwitcher = new ThemeSwitcher();
        // Make instance available globally for other scripts
        window.themeSwitcher = themeSwitcher;
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeSwitcher;
}

// Make class available globally
window.ThemeSwitcher = ThemeSwitcher;

