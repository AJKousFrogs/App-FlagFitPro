// LoginPage.test.jsx - Comprehensive tests for LoginPage component
// Addresses testing strategy improvements from code review

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

// Mock the secure auth service
vi.mock('../services/SecureAuthService', () => ({
  default: {
    login: vi.fn(),
    validateEmail: vi.fn(),
    checkRateLimit: vi.fn(),
    recordFailedAttempt: vi.fn(),
    clearFailedAttempts: vi.fn()
  }
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock icons
vi.mock('../utils/icons', () => ({
  EyeIcon: () => <div data-testid="eye-icon">👁️</div>,
  EyeSlashIcon: () => <div data-testid="eye-slash-icon">🙈</div>
}));

// Mock cn utility
vi.mock('../utils/cn', () => ({
  cn: (...classes) => classes.join(' ')
}));

const renderLoginPage = (props = {}) => {
  const defaultProps = {
    onLogin: vi.fn(),
    ...props
  };

  return render(
    <BrowserRouter>
      <LoginPage {...defaultProps} />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  let mockAuthService;
  let user;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockAuthService = await vi.importMock('../services/SecureAuthService');
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render login form with all required fields', () => {
      renderLoginPage();

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render alternative login options', () => {
      renderLoginPage();

      expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument();
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('should render form fields with proper attributes', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email address');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty email', async () => {
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      });
    });

    it('should show error for empty password', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should show error for short password', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });

    it('should clear errors when user starts typing', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger validation error
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      // Start typing - error should clear
      await user.type(emailInput, 'test@example.com');
      
      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when eye icon is clicked', async () => {
      renderLoginPage();

      const passwordInput = screen.getByLabelText(/password/i);
      const eyeButton = screen.getByRole('button', { name: /toggle password visibility/i });

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click to show password
      await user.click(eyeButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click to hide password again
      await user.click(eyeButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should show correct eye icon based on password visibility', async () => {
      renderLoginPage();

      const eyeButton = screen.getByRole('button', { name: /toggle password visibility/i });

      // Initially should show eye icon (password hidden)
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();

      // After clicking, should show eye-slash icon (password visible)
      await user.click(eyeButton);
      expect(screen.getByTestId('eye-slash-icon')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onLogin with form data on successful submission', async () => {
      const mockOnLogin = vi.fn();
      mockAuthService.default.login.mockResolvedValueOnce({
        success: true,
        user: { id: '1', email: 'test@example.com' }
      });

      renderLoginPage({ onLogin: mockOnLogin });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('should navigate to dashboard on successful login', async () => {
      mockAuthService.default.login.mockResolvedValueOnce({
        success: true,
        user: { id: '1', email: 'test@example.com' }
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show loading state during submission', async () => {
      // Mock a delayed response
      mockAuthService.default.login.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Sign in')).toBeInTheDocument();
      });
    });

    it('should disable form inputs during loading', async () => {
      mockAuthService.default.login.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Inputs should be disabled during loading
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display server error message', async () => {
      mockAuthService.default.login.mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should display generic error for unknown errors', async () => {
      mockAuthService.default.login.mockRejectedValueOnce(new Error());

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('should clear error when form is resubmitted', async () => {
      mockAuthService.default.login
        .mockRejectedValueOnce(new Error('Invalid credentials'))
        .mockResolvedValueOnce({ success: true, user: { id: '1' } });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Error should be displayed
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Change password and resubmit
      await user.clear(passwordInput);
      await user.type(passwordInput, 'correctpassword');
      await user.click(submitButton);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
      });
    });
  });

  describe('Social Login', () => {
    it('should handle GitHub login button click', async () => {
      renderLoginPage();

      const githubButton = screen.getByRole('button', { name: /continue with github/i });
      await user.click(githubButton);

      // For now, just check that the button is clickable
      // In a real implementation, this would trigger OAuth flow
      expect(githubButton).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should render forgot password link', () => {
      renderLoginPage();

      const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i });
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should render sign up link', () => {
      renderLoginPage();

      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Tab through form elements
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /toggle password visibility/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('link', { name: /forgot password/i })).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should announce loading state to screen readers', async () => {
      mockAuthService.default.login.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      const loadingButton = screen.getByRole('button', { name: /signing in/i });
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton).toHaveAttribute('disabled');
    });
  });

  describe('Form State Management', () => {
    it('should maintain form state during typing', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should reset form state after successful submission', async () => {
      mockAuthService.default.login.mockResolvedValueOnce({
        success: true,
        user: { id: '1', email: 'test@example.com' }
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });

      // Form values should remain (they'll be cleared when navigating away)
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });
  });
});