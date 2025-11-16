/**
 * Secure DOM Utilities
 * Provides safe alternatives to innerHTML and other potentially dangerous DOM operations
 */

import { logger } from './logger.js';

export class SecureDOMUtils {
    /**
     * Safely sets text content, preventing XSS attacks
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text content to set
     */
    static setTextContent(element, text) {
        if (!element) return;
        element.textContent = String(text || '');
    }

    /**
     * Safely creates and appends HTML elements
     * @param {HTMLElement} parent - Parent element
     * @param {string} tagName - Tag name for new element
     * @param {Object} options - Element configuration
     * @returns {HTMLElement} Created element
     */
    static createElement(parent, tagName, options = {}) {
        const element = document.createElement(tagName);
        
        // Set attributes safely
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, String(value || ''));
            });
        }
        
        // Set text content safely
        if (options.textContent !== undefined) {
            this.setTextContent(element, options.textContent);
        }
        
        // Set classes
        if (options.className) {
            element.className = String(options.className);
        }
        
        // Add event listeners
        if (options.events) {
            Object.entries(options.events).forEach(([event, handler]) => {
                element.addEventListener(event, handler);
            });
        }
        
        if (parent) {
            parent.appendChild(element);
        }
        
        return element;
    }

    /**
     * Safely replaces element content with new elements
     * @param {HTMLElement} parent - Parent element to clear and populate
     * @param {Array} children - Array of child configurations
     */
    static replaceChildren(parent, children = []) {
        if (!parent) return;
        
        // Clear existing content safely
        parent.replaceChildren();
        
        // Add new children
        children.forEach(child => {
            if (typeof child === 'string') {
                parent.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                parent.appendChild(child);
            } else if (child.tagName) {
                this.createElement(parent, child.tagName, child);
            }
        });
    }

    /**
     * Safely updates element with HTML template (sanitized)
     * @param {HTMLElement} element - Target element
     * @param {string} templateString - HTML template string
     * @param {Object} data - Data to inject into template
     */
    static updateFromTemplate(element, templateString, data = {}) {
        if (!element || !templateString) return;
        
        // Create a temporary container
        const temp = document.createElement('div');
        
        // Sanitize and process template
        const sanitizedTemplate = this.sanitizeTemplate(templateString, data);
        temp.innerHTML = sanitizedTemplate;
        
        // Replace content safely
        element.replaceChildren(...temp.childNodes);
    }

    /**
     * Sanitizes template strings and injects data safely
     * @param {string} template - Template string
     * @param {Object} data - Data object
     * @returns {string} Sanitized template
     */
    static sanitizeTemplate(template, data) {
        // Remove potentially dangerous attributes and elements
        let sanitized = template.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        
        // Replace data placeholders safely
        Object.entries(data).forEach(([key, value]) => {
            const escapedValue = this.escapeHtml(String(value || ''));
            sanitized = sanitized.replace(new RegExp(`{{${key}}}`, 'g'), escapedValue);
        });
        
        return sanitized;
    }

    /**
     * Escapes HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Safely adds HTML content from trusted sources only
     * @param {HTMLElement} element - Target element
     * @param {string} htmlContent - HTML content (must be from trusted source)
     * @param {boolean} isTrusted - Confirms content is from trusted source
     */
    static setTrustedHTML(element, htmlContent, isTrusted = false) {
        if (!element) return;
        
        if (!isTrusted) {
            logger.warn('Attempted to set untrusted HTML content. Use setTextContent instead.');
            this.setTextContent(element, htmlContent);
            return;
        }
        
        // Only for truly trusted content (e.g., static templates, server responses with CSRF protection)
        element.innerHTML = htmlContent;
    }

    /**
     * Creates a document fragment from safe HTML
     * @param {string} html - HTML string
     * @returns {DocumentFragment} Document fragment
     */
    static createFragmentFromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = this.sanitizeTemplate(html, {});
        return template.content;
    }

    /**
     * Safely clones and appends template content
     * @param {HTMLElement} target - Target element
     * @param {HTMLTemplateElement} template - Template element
     * @param {Object} data - Data for template
     */
    static appendFromTemplate(target, template, data = {}) {
        if (!target || !template) return;
        
        const clone = template.content.cloneNode(true);
        
        // Replace data placeholders in clone
        this.replaceDataInFragment(clone, data);
        
        target.appendChild(clone);
    }

    /**
     * Replaces data placeholders in document fragment
     * @param {DocumentFragment} fragment - Document fragment
     * @param {Object} data - Data object
     */
    static replaceDataInFragment(fragment, data) {
        const walker = document.createTreeWalker(
            fragment,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            let text = node.textContent;
            Object.entries(data).forEach(([key, value]) => {
                text = text.replace(new RegExp(`{{${key}}}`, 'g'), this.escapeHtml(String(value || '')));
            });
            node.textContent = text;
        }
    }
}

export default SecureDOMUtils;