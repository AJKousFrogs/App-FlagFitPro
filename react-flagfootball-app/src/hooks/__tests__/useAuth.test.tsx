/**
 * Comprehensive tests for useAuth hook
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { setupMockServer, mockUser, mockApiError } from '../../__mocks__/server';
import { authService } from '../../services/auth.service';

// Setup MSW
setupMockServer();

// Mock the authService
jest.mock('../../services/auth.service', () => ({
  authService: {
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
    refreshToken: jest.fn(),
    getToken: jest.fn(),
    getCSRFToken: jest.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock query client and keys
jest.mock('../../lib/queryClient', () => ({
  queryKeys: {
    auth: {
      all: ['auth'],
      currentUser: () => ['auth', 'currentUser'],
    },
    dashboard: {
      overview: (userId: string) => ['dashboard', 'overview', userId],
    },
  },
  invalidateQueries: {
    auth: jest.fn(),
  },
}));

describe('useAuth', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }) => (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    );

    // Reset mocks
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('authentication state', () => {
    it('should initialize with unauthenticated state', async () => {
      (authService.getToken as jest.Mock).mockReturnValue(null);
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeUndefined();
    });

    it('should load user when token exists', async () => {
      (authService.getToken as jest.Mock).mockReturnValue('mock-token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it('should handle authentication error', async () => {
      (authService.getToken as jest.Mock).mockReturnValue('invalid-token');
      (authService.getCurrentUser as jest.Mock).mockRejectedValue({ status: 401 });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('login functionality', () => {
    it('should handle successful login', async () => {
      const loginCredentials = { email: 'test@example.com', password: 'password' };
      const loginResponse = { user: mockUser, tokens: { accessToken: 'token' } };

      (authService.login as jest.Mock).mockResolvedValue(loginResponse);
      (authService.getToken as jest.Mock).mockReturnValue('token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login(loginCredentials);
      });

      expect(authService.login).toHaveBeenCalledWith(loginCredentials);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('should handle login failure', async () => {
      const loginCredentials = { email: 'test@example.com', password: 'wrong' };
      const loginError = new Error('Invalid credentials');

      (authService.login as jest.Mock).mockRejectedValue(loginError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login(loginCredentials);
        } catch (error) {
          expect(error).toBe(loginError);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should show loading state during login', async () => {
      const loginCredentials = { email: 'test@example.com', password: 'password' };
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      (authService.login as jest.Mock).mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Start login
      act(() => {
        result.current.login(loginCredentials);
      });

      // Check loading state
      expect(result.current.isLoginLoading).toBe(true);
      expect(result.current.isLoading).toBe(true);

      // Resolve login
      act(() => {
        resolveLogin!({ user: mockUser, tokens: { accessToken: 'token' } });
      });

      await waitFor(() => {
        expect(result.current.isLoginLoading).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('register functionality', () => {
    it('should handle successful registration', async () => {
      const registerData = {
        email: 'new@example.com',
        password: 'password',
        confirmPassword: 'password',
        firstName: 'New',
        lastName: 'User',
        username: 'newuser',
        dateOfBirth: '1990-01-01',
        acceptTerms: true,
      };
      const registerResponse = { user: mockUser, tokens: { accessToken: 'token' } };

      (authService.register as jest.Mock).mockResolvedValue(registerResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register(registerData);
      });

      expect(authService.register).toHaveBeenCalledWith(registerData);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('should handle registration failure', async () => {
      const registerData = {
        email: 'invalid@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        dateOfBirth: '1990-01-01',
        acceptTerms: true,
      };
      const registerError = new Error('Registration failed');

      (authService.register as jest.Mock).mockRejectedValue(registerError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.register(registerData);
        } catch (error) {
          expect(error).toBe(registerError);
        }
      });
    });
  });

  describe('logout functionality', () => {
    it('should handle successful logout', async () => {
      // Setup authenticated state
      (authService.getToken as jest.Mock).mockReturnValue('token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.logout as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(authService.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should handle logout failure with rollback', async () => {
      // Setup authenticated state
      (authService.getToken as jest.Mock).mockReturnValue('token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      const originalUser = result.current.user;

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Logout failed, user should be restored
        }
      });

      // User should be restored after failed logout
      expect(result.current.user).toEqual(originalUser);
    });
  });

  describe('profile update functionality', () => {
    it('should handle successful profile update', async () => {
      // Setup authenticated state
      (authService.getToken as jest.Mock).mockReturnValue('token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      const profileUpdate = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...mockUser, ...profileUpdate };

      (authService.updateProfile as jest.Mock).mockResolvedValue(updatedUser);

      await act(async () => {
        await result.current.updateProfile(profileUpdate);
      });

      expect(authService.updateProfile).toHaveBeenCalledWith(profileUpdate);
    });

    it('should handle profile update failure with rollback', async () => {
      // Setup authenticated state
      (authService.getToken as jest.Mock).mockReturnValue('token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      const originalUser = result.current.user;
      const profileUpdate = { firstName: 'Updated' };

      (authService.updateProfile as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await act(async () => {
        try {
          await result.current.updateProfile(profileUpdate);
        } catch (error) {
          // Profile update failed
        }
      });

      // User should be restored after failed update
      expect(result.current.user).toEqual(originalUser);
    });
  });

  describe('token refresh functionality', () => {
    it('should handle successful token refresh', async () => {
      (authService.refreshToken as jest.Mock).mockResolvedValue({ accessToken: 'new-token' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(authService.refreshToken).toHaveBeenCalled();
    });

    it('should logout user when token refresh fails', async () => {
      (authService.refreshToken as jest.Mock).mockRejectedValue(new Error('Refresh failed'));
      (authService.logout as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.refreshToken();
        } catch (error) {
          // Refresh failed, should trigger logout
        }
      });

      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('utility functions', () => {
    it('should check user permissions correctly', async () => {
      (authService.getToken as jest.Mock).mockReturnValue('token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue({
        ...mockUser,
        permissions: ['user:read', 'training:write'],
        role: 'player',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.hasPermission('user:read')).toBe(true);
      expect(result.current.hasPermission('admin:all')).toBe(false);
    });

    it('should check admin role permissions correctly', async () => {
      (authService.getToken as jest.Mock).mockReturnValue('token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue({
        ...mockUser,
        permissions: ['user:read'],
        role: 'admin',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Admin should have all permissions
      expect(result.current.hasPermission('admin:all')).toBe(true);
      expect(result.current.hasPermission('any:permission')).toBe(true);
    });

    it('should check user roles correctly', async () => {
      (authService.getToken as jest.Mock).mockReturnValue('token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: 'coach',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(result.current.isRole('coach')).toBe(true);
      expect(result.current.isRole('admin')).toBe(false);
    });

    it('should clear errors', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Trigger an error
      (authService.login as jest.Mock).mockRejectedValue(new Error('Login failed'));

      await act(async () => {
        try {
          await result.current.login({ email: 'test@example.com', password: 'wrong' });
        } catch (error) {
          // Error occurred
        }
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeFalsy();
    });

    it('should provide CSRF token', async () => {
      (authService.getCSRFToken as jest.Mock).mockReturnValue('csrf-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.csrfToken).toBe('csrf-token');
    });
  });

  describe('auto token refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should setup auto token refresh when authenticated', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MzQ2NzU0MDAsInVzZXJJZCI6IjEyMyJ9.mock';
      
      (authService.getToken as jest.Mock).mockReturnValue(mockToken);
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.refreshToken as jest.Mock).mockResolvedValue({ accessToken: 'new-token' });

      // Mock base64 decode for JWT
      global.atob = jest.fn().mockReturnValue(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        userId: '123',
      }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Fast-forward time to before token expiration (should trigger refresh)
      jest.advanceTimersByTime(3300000); // 55 minutes

      await waitFor(() => {
        expect(authService.refreshToken).toHaveBeenCalled();
      });
    });

    it('should handle token decode errors gracefully', async () => {
      const mockToken = 'invalid-token';
      
      (authService.getToken as jest.Mock).mockReturnValue(mockToken);
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      // Mock base64 decode to throw error
      global.atob = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not decode token for auto-refresh:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('loading states', () => {
    it('should provide individual loading states', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoginLoading).toBe(false);
      expect(result.current.isRegisterLoading).toBe(false);
      expect(result.current.isLogoutLoading).toBe(false);
      expect(result.current.isUpdateProfileLoading).toBe(false);
    });

    it('should provide raw mutation objects for advanced usage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loginMutation).toBeDefined();
      expect(result.current.registerMutation).toBeDefined();
      expect(result.current.logoutMutation).toBeDefined();
      expect(result.current.updateProfileMutation).toBeDefined();
      expect(result.current.refreshTokenMutation).toBeDefined();
    });
  });
});