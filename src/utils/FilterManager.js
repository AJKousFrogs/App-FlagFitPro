import React from 'react';

class FilterManager {
    constructor() {
        this.activeFilters = new Map();
        this.keyboardHandler = null;
        this.init();
    }

    init() {
        this.setupFilterButtons();
        this.setupKeyboardNavigation();
        this.setupAccessibility();
    }

    setupFilterButtons() {
        const filterSelectors = [
            '.filter-btn',
            '.film-filter-btn', 
            '.channel-tab-btn',
            '.tab-btn',
            '.bracket-tab-btn',
            '.schedule-filter-btn',
            '.search-filter',
            '.notification-tab',
            '.cta-secondary',
            '.cta-primary'
        ];

        filterSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => {
                this.setupFilterButton(button);
            });
        });
    }

    setupFilterButton(button) {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleFilterClick(button);
        });

        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleFilterClick(button);
            }
        });

        this.setupAccessibilityAttributes(button);
    }

    handleFilterClick(button) {
        const container = this.findFilterContainer(button);
        if (!container) return;

        const allButtons = container.querySelectorAll('button');
        allButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });

        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');

        const filterGroup = this.getFilterGroup(container);
        this.activeFilters.set(filterGroup, button.textContent.trim());

        this.handleFilterLogic(button, container);
        this.announceFilterChange(button);
        this.updateContent(button, container);
    }

    findFilterContainer(button) {
        const containers = [
            button.closest('.wireframe-grid'),
            button.closest('.wireframe-card'),
            button.closest('.container'),
            button.closest('[class*="filter"]'),
            button.closest('[class*="tab"]')
        ];

        return containers.find(container => container !== null);
    }

    getFilterGroup(container) {
        if (container.classList.contains('wireframe-grid')) return 'grid';
        if (container.classList.contains('wireframe-card')) return 'card';
        return container.className || 'unknown';
    }

    handleFilterLogic(button, container) {
        const filterValue = button.textContent.trim();
        
        // Add visual feedback
        this.showLoadingState(container);
        
        setTimeout(() => {
            this.hideLoadingState(container);
            this.updateVisualFeedback(button, container);
        }, 300);
    }

    updateContent(button, container) {
        const contentArea = this.findContentArea(container);
        if (!contentArea) return;

        this.showLoadingState(contentArea);

        setTimeout(() => {
            this.hideLoadingState(contentArea);
            this.announceContentUpdate(button);
        }, 300);
    }

    findContentArea(container) {
        return container.querySelector('.wireframe-grid') || 
               container.querySelector('[style*="grid"]') ||
               container;
    }

    showLoadingState(element) {
        element.classList.add('loading');
        element.setAttribute('aria-busy', 'true');
        element.style.opacity = '0.7';
        element.style.transition = 'opacity 0.3s ease';
    }

    hideLoadingState(element) {
        element.classList.remove('loading');
        element.setAttribute('aria-busy', 'false');
        element.style.opacity = '1';
    }

    updateVisualFeedback(button, container) {
        // Add subtle animation to show the filter is active
        const cards = container.querySelectorAll('.wireframe-card');
        cards.forEach((card, index) => {
            card.style.transform = 'translateY(-2px)';
            setTimeout(() => {
                card.style.transform = 'translateY(0)';
            }, 150 + (index * 50));
        });
    }

    setupKeyboardNavigation() {
        // Store handler reference for cleanup
        this.keyboardHandler = (e) => {
            // Arrow key navigation for filter buttons
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.classList.contains('cta-secondary')) {
                    const container = this.findFilterContainer(activeElement);
                    if (container) {
                        const buttons = Array.from(container.querySelectorAll('button'));
                        const currentIndex = buttons.indexOf(activeElement);

                        let nextIndex;
                        if (e.key === 'ArrowRight') {
                            nextIndex = (currentIndex + 1) % buttons.length;
                        } else {
                            nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
                        }

                        buttons[nextIndex].focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', this.keyboardHandler);
    }

    cleanup() {
        // Remove keyboard event listener to prevent memory leak
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
    }

    setupAccessibility() {
        this.createAriaLiveRegion();
    }

    setupAccessibilityAttributes(button) {
        button.setAttribute('role', 'button');
        button.setAttribute('tabindex', '0');
        button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
        
        const container = this.findFilterContainer(button);
        const filterGroup = this.getFilterGroup(container);
        button.setAttribute('aria-label', `Filter by ${button.textContent.trim()}`);
    }

    createAriaLiveRegion() {
        let liveRegion = document.getElementById('aria-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }
    }

    announceFilterChange(button) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = `Filter changed to ${button.textContent.trim()}`;
        }
    }

    announceContentUpdate(button) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = `Content updated for ${button.textContent.trim()} filter`;
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// React Hook for using FilterManager
export const useFilterManager = () => {
    const [filterManager, setFilterManager] = React.useState(null);

    React.useEffect(() => {
        const manager = new FilterManager();
        setFilterManager(manager);

        return () => {
            // Cleanup event listeners to prevent memory leak
            if (manager && manager.cleanup) {
                manager.cleanup();
            }
        };
    }, []);

    return filterManager;
};

export default FilterManager;