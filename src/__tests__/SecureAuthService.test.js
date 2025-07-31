// SecureAuthService.test.js - Comprehensive tests for secure authentication
// Addresses testing strategy improvements from code review

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import SecureAuthService from '../services/SecureAuthService';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((input) => input.trim())
  }
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock timers
vi.useFakeTimers();

describe('SecureAuthService', () => {
  let authService;

  beforeAll(() => {
    // Set up environment variables
    import.meta.env.VITE_API_URL = 'http://localhost:8090';
  });

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
    
    // Create fresh instance
    authService = new SecureAuthService();
    
    // Mock successful CSRF response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ csrfToken: 'test-csrf-token' })
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe('Password Validation', () => {
    it('should require minimum 12 characters', () => {
      const errors = authService.validatePassword('short123');
      expect(errors).toContain('Password must be at least 12 characters long');
    });

    it('should require uppercase letter', () => {
      const errors = authService.validatePassword('lowercase123!');
      expect(errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letter', () => {
      const errors = authService.validatePassword('UPPERCASE123!');
      expect(errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require number', () => {
      const errors = authService.validatePassword('NoNumbers!@#');
      expect(errors).toContain('Password must contain at least one number');
    });

    it('should require special character', () => {
      const errors = authService.validatePassword('NoSpecialChars123');
      expect(errors).toContain('Password must contain at least one special character');
    });

    it('should reject common passwords', () => {
      const errors = authService.validatePassword('Password123!');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject sequential characters', () => {
      const errors = authService.validatePassword('Abc123456!@#');
      expect(errors).toContain('Password cannot contain sequential characters');
    });

    it('should accept strong password', () => {
      const errors = authService.validatePassword('MyStr0ng!P@ssw0rd2024');
      expect(errors).toHaveLength(0);
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email', () => {
      const error = authService.validateEmail('test@example.com');
      expect(error).toBeNull();
    });

    it('should reject invalid email format', () => {
      const error = authService.validateEmail('invalid-email');
      expect(error).toBe('Please enter a valid email address');
    });

    it('should reject empty email', () => {
      const error = authService.validateEmail('');
      expect(error).toBe('Please enter a valid email address');
    });

    it('should reject overly long email', () => {
      const longEmail = `${'a'.repeat(250)}@example.com`;
      const error = authService.validateEmail(longEmail);
      expect(error).toBe('Email address is too long');
    });

    it('should accept complex valid emails', () => {
      const validEmails = [
        'test.email@example.com',
        'user+tag@domain.co.uk',
        'first.last@sub.domain.com'
      ];

      validEmails.forEach(email => {
        const error = authService.validateEmail(email);
        expect(error).toBeNull();
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should allow first login attempt', () => {
      expect(() => {
        authService.checkRateLimit('test@example.com');
      }).not.toThrow();
    });

    it('should block after max attempts', () => {
      const email = 'test@example.com';
      
      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        authService.recordFailedAttempt(email);
      }

      expect(() => {
        authService.checkRateLimit(email);
      }).toThrow(/Too many login attempts/);
    });

    it('should show remaining lockout time', () => {
      const email = 'test@example.com';
      
      // Simulate failed attempts and lockout
      for (let i = 0; i < 5; i++) {
        authService.recordFailedAttempt(email);
      }

      // Trigger lockout
      try {
        authService.checkRateLimit(email);
      } catch (error) {
        // Do nothing, we expect this to fail
      }

      // Check locked state
      expect(() => {
        authService.checkRateLimit(email);
      }).toThrow(/Account temporarily locked/);
    });

    it('should reset attempts after lockout period', () => {
      const email = 'test@example.com';
      
      // Simulate failed attempts
      for (let i = 0; i < 5; i++) {
        authService.recordFailedAttempt(email);
      }

      // Fast-forward time beyond lockout duration
      vi.advanceTimersByTime(16 * 60 * 1000); // 16 minutes

      expect(() => {
        authService.checkRateLimit(email);
      }).not.toThrow();
    });

    it('should clear attempts on successful login', () => {
      const email = 'test@example.com';
      
      // Record some failed attempts
      authService.recordFailedAttempt(email);
      authService.recordFailedAttempt(email);
      
      // Clear attempts
      authService.clearFailedAttempts(email);
      
      // Should not throw
      expect(() => {
        authService.checkRateLimit(email);
      }).not.toThrow();
    });
  });

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'player'
          }
        })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'ValidPassword123!'
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('test@example.com');
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        expect.stringContaining('test@example.com')
      );
    });

    it('should reject login with invalid email', async () => {
      await expect(authService.login({
        email: 'invalid-email',
        password: 'ValidPassword123!'
      })).rejects.toThrow('Please enter a valid email address');
    });

    it('should reject login without password', async () => {
      await expect(authService.login({
        email: 'test@example.com',
        password: ''
      })).rejects.toThrow('Password is required');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.login({
        email: 'test@example.com',
        password: 'ValidPassword123!'
      })).rejects.toThrow('Network error');
    });

    it('should record failed attempts on login failure', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid credentials' })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      const recordSpy = vi.spyOn(authService, 'recordFailedAttempt');

      await expect(authService.login({
        email: 'test@example.com',
        password: 'WrongPassword123!'
      })).rejects.toThrow();

      expect(recordSpy).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('Registration', () => {
    it('should register with valid data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          user: {
            id: '1',
            email: 'newuser@example.com',
            name: 'New User'
          }
        })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      const result = await authService.register({
        fullName: 'New User',
        email: 'newuser@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!'
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('newuser@example.com');
    });

    it('should reject registration with weak password', async () => {
      await expect(authService.register({
        fullName: 'New User',
        email: 'newuser@example.com',
        password: 'weak',
        confirmPassword: 'weak'
      })).rejects.toThrow(/Password must be at least 12 characters long/);
    });

    it('should reject registration with mismatched passwords', async () => {
      await expect(authService.register({
        fullName: 'New User',
        email: 'newuser@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'DifferentPassword123!'
      })).rejects.toThrow('Passwords do not match');
    });

    it('should reject registration with invalid email', async () => {
      await expect(authService.register({
        fullName: 'New User',
        email: 'invalid-email',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!'
      })).rejects.toThrow('Please enter a valid email address');
    });

    it('should reject registration with short name', async () => {
      await expect(authService.register({
        fullName: 'A',
        email: 'newuser@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!'
      })).rejects.toThrow('Full name must be at least 2 characters long');
    });
  });

  describe('Session Management', () => {
    it('should start session timer on login', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          user: { id: '1', email: 'test@example.com', name: 'Test User' }
        })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await authService.login({
        email: 'test@example.com',
        password: 'ValidPassword123!'
      });

      expect(authService.sessionTimer).toBeDefined();
    });

    it('should emit session warning before timeout', async () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent');
      
      // Set a short timeout for testing
      authService.sessionTimeout = 10000; // 10 seconds
      authService.startSessionTimer();

      // Fast-forward to warning time (5 seconds before timeout)
      vi.advanceTimersByTime(5000);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sessionWarning'
        })
      );
    });

    it('should handle session timeout', async () => {
      const eventSpy = vi.spyOn(window, 'dispatchEvent');
      const logoutSpy = vi.spyOn(authService, 'logout');
      
      authService.sessionTimeout = 5000; // 5 seconds
      authService.startSessionTimer();

      // Fast-forward past timeout
      vi.advanceTimersByTime(6000);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sessionTimeout'
        })
      );
      expect(logoutSpy).toHaveBeenCalled();
    });

    it('should clear session timer on logout', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      authService.startSessionTimer();
      await authService.logout();

      expect(authService.sessionTimer).toBeNull();
      expect(sessionStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF token in requests', async () => {
      authService.csrfToken = 'test-csrf-token';
      
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ user: {} })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await authService.login({
        email: 'test@example.com',
        password: 'ValidPassword123!'
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': 'test-csrf-token'
          })
        })
      );
    });

    it('should refresh CSRF token when expired', async () => {
      authService.csrfToken = 'expired-token';
      
      // First request fails with CSRF expired
      const expiredResponse = {
        ok: false,
        status: 403,
        headers: new Map([['X-CSRF-Token-Expired', 'true']]),
        json: () => Promise.resolve({ message: 'CSRF token expired' })
      };

      // CSRF refresh response
      const csrfResponse = {
        ok: true,
        json: () => Promise.resolve({ csrfToken: 'new-csrf-token' })
      };

      // Successful retry response
      const successResponse = {
        ok: true,
        json: () => Promise.resolve({ user: {} })
      };

      fetch
        .mockResolvedValueOnce(expiredResponse)
        .mockResolvedValueOnce(csrfResponse)
        .mockResolvedValueOnce(successResponse);

      await authService.login({
        email: 'test@example.com',
        password: 'ValidPassword123!'
      });

      // Should have made 3 requests: failed, CSRF refresh, successful retry
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(authService.csrfToken).toBe('new-csrf-token');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize email input', () => {
      const sanitized = authService.sanitizeInput('  test@example.com  ');
      expect(sanitized).toBe('test@example.com');
    });

    it('should sanitize name input', () => {
      const sanitized = authService.sanitizeInput('  John Doe  ');
      expect(sanitized).toBe('John Doe');
    });

    it('should handle non-string input', () => {
      const sanitized = authService.sanitizeInput(123);
      expect(sanitized).toBe(123);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      fetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(authService.checkAuth()).rejects.toThrow('Network timeout');
    });

    it('should handle malformed JSON responses', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await expect(authService.checkAuth()).rejects.toThrow('Invalid JSON');
    });

    it('should retry failed requests', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ user: {} })
        });

      // Should succeed after retries
      await authService.checkAuth();
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });
});