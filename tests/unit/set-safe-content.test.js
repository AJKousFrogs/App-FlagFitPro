/**
 * Characterization Tests for setSafeContent Utility
 * These tests capture CURRENT behavior before refactoring
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setSafeContent } from '../../src/js/utils/shared.js';
import { escapeHtml, sanitizeRichText } from '../../src/js/utils/sanitize.js';

describe('setSafeContent - Characterization Tests', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Text Content (Default Behavior)', () => {
    it('should set plain text content safely', () => {
      setSafeContent(container, 'Hello World');
      expect(container.textContent).toBe('Hello World');
      expect(container.innerHTML).toBe('Hello World');
    });

    it('should escape HTML in text content', () => {
      const malicious = '<script>alert("XSS")</script>';
      setSafeContent(container, malicious);
      expect(container.textContent).toBe(malicious);
      expect(container.innerHTML).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should handle null/undefined content', () => {
      setSafeContent(container, null);
      expect(container.textContent).toBe('');
      
      setSafeContent(container, undefined);
      expect(container.textContent).toBe('');
    });

    it('should handle empty string', () => {
      setSafeContent(container, '');
      expect(container.textContent).toBe('');
    });

    it('should handle numbers', () => {
      setSafeContent(container, 123);
      expect(container.textContent).toBe('123');
    });
  });

  describe('HTML Content (isHTML = true)', () => {
    it('should set HTML content when isHTML is true', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      setSafeContent(container, html, true);
      expect(container.innerHTML).toContain('<p>');
      expect(container.innerHTML).toContain('<strong>');
    });

    it('should clear existing content before setting new content', () => {
      container.innerHTML = '<div>Old Content</div>';
      setSafeContent(container, 'New Content', true);
      expect(container.innerHTML).not.toContain('Old Content');
    });

    it('should handle empty HTML string', () => {
      setSafeContent(container, '', true);
      expect(container.innerHTML).toBe('');
    });
  });

  describe('HTMLElement Content', () => {
    it('should append HTMLElement directly', () => {
      const child = document.createElement('span');
      child.textContent = 'Child Element';
      setSafeContent(container, child);
      expect(container.contains(child)).toBe(true);
      expect(container.textContent).toBe('Child Element');
    });

    it('should clear existing content before appending element', () => {
      container.innerHTML = '<div>Old</div>';
      const child = document.createElement('span');
      child.textContent = 'New';
      setSafeContent(container, child);
      expect(container.textContent).toBe('New');
      expect(container.querySelector('div')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null element gracefully', () => {
      expect(() => {
        setSafeContent(null, 'test');
      }).not.toThrow();
    });

    it('should handle element that is not an HTMLElement', () => {
      const fakeElement = { textContent: '' };
      expect(() => {
        setSafeContent(fakeElement, 'test');
      }).not.toThrow();
    });

    it('should handle complex HTML structures', () => {
      const html = '<div><p>Paragraph 1</p><p>Paragraph 2</p></div>';
      setSafeContent(container, html, true);
      expect(container.querySelectorAll('p').length).toBe(2);
    });
  });

  describe('XSS Prevention', () => {
    it('should prevent script injection in text mode', () => {
      const xss = '<script>alert("XSS")</script>';
      setSafeContent(container, xss);
      expect(container.querySelector('script')).toBeNull();
      expect(container.textContent).toContain('<script>');
    });

    it('should handle event handlers in HTML mode (current behavior)', () => {
      // NOTE: Current implementation doesn't sanitize HTML content
      // This test documents current behavior - may need improvement
      const html = '<div onclick="alert(\'XSS\')">Click me</div>';
      setSafeContent(container, html, true);
      // Current behavior: This will set innerHTML directly
      // After refactoring: Should sanitize and remove event handlers
      expect(container.innerHTML).toContain('onclick');
    });

    it('should handle javascript: URLs', () => {
      const html = '<a href="javascript:alert(\'XSS\')">Link</a>';
      setSafeContent(container, html, true);
      // Current behavior: This will set innerHTML directly
      // After refactoring: Should sanitize URLs
      expect(container.innerHTML).toContain('javascript:');
    });
  });
});

describe('escapeHtml - Sanitization Utility Tests', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("XSS")</script>'))
      .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  it('should handle null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('should escape all dangerous characters', () => {
    const input = '&<>"\'/';
    const output = escapeHtml(input);
    expect(output).toBe('&amp;&lt;&gt;&quot;&#039;&#x2F;');
  });
});

describe('sanitizeRichText - Rich Text Sanitization Tests', () => {
  it('should allow safe HTML tags', () => {
    const html = '<b>Bold</b> <i>Italic</i>';
    const sanitized = sanitizeRichText(html);
    expect(sanitized).toContain('<b>');
    expect(sanitized).toContain('<i>');
  });

  it('should escape dangerous tags', () => {
    const html = '<script>alert("XSS")</script>';
    const sanitized = sanitizeRichText(html);
    expect(sanitized).not.toContain('<script>');
  });
});

