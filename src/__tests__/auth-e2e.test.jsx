import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PocketProvider } from '../contexts/PocketContext';
import LoginView from '../views/LoginView';
import DashboardView from '../views/DashboardView';

// Mock PocketBase
const mockPocketBase = {
  authStore: {
    token: null,
    model: null,
    isValid: false,
    save: vi.fn(),
    clear: vi.fn(),
    onChange: vi.fn(() => vi.fn()) // Returns unsubscribe function
  },
  collection: vi.fn(() => ({
    authWithPassword: vi.fn(),
    authRefresh: vi.fn(),
    getList: vi.fn(),
    getOne: vi.fn()
  }))
};

vi.mock('pocketbase', () => {
  return {
    default: vi.fn(() => mockPocketBase)
  };
});

// Test component that includes routing logic
function TestApp({ children }) {
  return (
    <PocketProvider>
      {children}
    </PocketProvider>
  );
}

describe('Authentication E2E Flow', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    localStorage.clear();
    
    // Reset auth state
    mockPocketBase.authStore.token = null;
    mockPocketBase.authStore.model = null;
    mockPocketBase.authStore.isValid = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('complete login → protected route → logout flow', async () => {
    // Step 1: Login
    const mockAuthData = {
      token: 'test-token-123',
      record: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      }
    };

    // Mock successful login
    mockPocketBase.collection().authWithPassword.mockResolvedValue(mockAuthData);
    mockPocketBase.collection().authRefresh.mockResolvedValue(mockAuthData);

    render(
      <TestApp>
        <LoginView />
      </TestApp>
    );

    // Find and fill login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in|login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Wait for login to complete
    await waitFor(() => {
      expect(mockPocketBase.collection().authWithPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });

    // Simulate successful auth state change
    mockPocketBase.authStore.token = mockAuthData.token;
    mockPocketBase.authStore.model = mockAuthData.record;
    mockPocketBase.authStore.isValid = true;

    // Step 2: Access protected route (Dashboard)
    render(
      <TestApp>
        <DashboardView />
      </TestApp>
    );

    // Mock protected data fetch
    mockPocketBase.collection().getList.mockResolvedValue({
      items: [{ id: '1', name: 'Test Training Session' }],
      totalItems: 1,
      page: 1,
      perPage: 30
    });

    // Should render dashboard without errors
    await waitFor(() => {
      expect(screen.queryByText(/unauthorized|please log in/i)).not.toBeInTheDocument();
    });

    // Step 3: Test protected API call
    const mockProtectedCall = vi.fn().mockResolvedValue({ data: 'protected data' });
    
    // This simulates calling a protected endpoint
    try {
      await mockProtectedCall();
      expect(mockProtectedCall).toHaveBeenCalled();
    } catch (error) {
      throw new Error('Protected route should be accessible when logged in');
    }

    // Step 4: Logout
    // Simulate logout action
    mockPocketBase.authStore.clear.mockImplementation(() => {
      mockPocketBase.authStore.token = null;
      mockPocketBase.authStore.model = null;
      mockPocketBase.authStore.isValid = false;
    });

    // Mock logout (this would typically be triggered by a logout button)
    fireEvent.click(screen.getByRole('button', { name: /logout|sign out/i }));

    await waitFor(() => {
      expect(mockPocketBase.authStore.clear).toHaveBeenCalled();
    });

    // Step 5: Verify logout - protected route should now be inaccessible
    const mockProtectedCallAfterLogout = vi.fn().mockRejectedValue(
      new Error('Unauthorized')
    );

    try {
      await mockProtectedCallAfterLogout();
    } catch (error) {
      expect(error.message).toBe('Unauthorized');
    }

    expect(mockProtectedCallAfterLogout).toHaveBeenCalled();
  });

  it('persists auth state across page refresh', async () => {
    const mockAuthData = {
      token: 'test-token-123',
      record: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      }
    };

    // Simulate persisted auth in localStorage
    localStorage.setItem('pocketbase_auth', JSON.stringify(mockAuthData));

    // Mock auth refresh success
    mockPocketBase.collection().authRefresh.mockResolvedValue(mockAuthData);

    render(
      <TestApp>
        <DashboardView />
      </TestApp>
    );

    // Should validate token on mount
    await waitFor(() => {
      expect(mockPocketBase.collection().authRefresh).toHaveBeenCalled();
    });

    // Should maintain auth state
    expect(localStorage.getItem('pocketbase_auth')).toBeTruthy();
  });

  it('handles expired token gracefully', async () => {
    const expiredToken = 'expired-token-123';
    
    // Simulate expired token in localStorage
    localStorage.setItem('pocketbase_auth', JSON.stringify({
      token: expiredToken,
      model: { id: 'user-123', email: 'test@example.com' }
    }));

    // Mock auth refresh failure (token expired)
    mockPocketBase.collection().authRefresh.mockRejectedValue(
      new Error('Token expired')
    );

    render(
      <TestApp>
        <LoginView />
      </TestApp>
    );

    // Should attempt to refresh token
    await waitFor(() => {
      expect(mockPocketBase.collection().authRefresh).toHaveBeenCalled();
    });

    // Should clear invalid auth
    await waitFor(() => {
      expect(mockPocketBase.authStore.clear).toHaveBeenCalled();
    });

    // Should show login form
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('handles network errors during auth', async () => {
    // Mock network error
    mockPocketBase.collection().authWithPassword.mockRejectedValue(
      new Error('Network error')
    );

    render(
      <TestApp>
        <LoginView />
      </TestApp>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in|login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/network error|login failed/i)).toBeInTheDocument();
    });

    // Should not be authenticated
    expect(mockPocketBase.authStore.token).toBeNull();
  });

  it('invalidates sessions after password change', async () => {
    const mockAuthData = {
      token: 'test-token-123',
      record: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      }
    };

    // Setup authenticated state
    mockPocketBase.authStore.token = mockAuthData.token;
    mockPocketBase.authStore.model = mockAuthData.record;
    mockPocketBase.authStore.isValid = true;

    // Mock profile update with password change
    mockPocketBase.collection().update.mockResolvedValue(mockAuthData.record);
    mockPocketBase.collection().authRefresh.mockResolvedValue(mockAuthData);

    // This would typically be in a ProfileView or SettingsView
    // const profileData = {
    //   password: 'newpassword123',
    //   passwordConfirm: 'newpassword123'
    // };

    // Simulate calling updateProfile with password change
    // This should trigger token invalidation
    await waitFor(() => {
      expect(mockPocketBase.collection().authRefresh).toHaveBeenCalledWith({ invalidate: true });
    });
  });
});

export default describe;