// Mock Authentication Service for Development
// This simulates backend authentication functionality

class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.isAuthenticated = false;
  }

  async login(credentials) {
    try {
      console.log('AuthService: Processing login for:', credentials.email);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock validation - accept any email/password for development
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      // Create mock user object
      const user = {
        id: 1,
        email: credentials.email,
        name: credentials.email.split('@')[0],
        isPremium: false,
        profile: {
          position: 'Quarterback',
          experience: 'Intermediate',
          team: 'Ljubljana Frogs'
        }
      };

      // Create mock token
      const token = 'mock_jwt_token_' + Date.now();

      // Store in memory and localStorage for persistence
      this.currentUser = user;
      this.token = token;
      this.isAuthenticated = true;

      // Store in localStorage for persistence across sessions
      localStorage.setItem('flagfit_user', JSON.stringify(user));
      localStorage.setItem('flagfit_token', token);
      localStorage.setItem('flagfit_auth', 'true');

      console.log('AuthService: Login successful for user:', user.email);

      return {
        user,
        token,
        isAuthenticated: true
      };
    } catch (error) {
      console.error('AuthService: Login failed:', error.message);
      throw error;
    }
  }

  async register(userData) {
    try {
      console.log('AuthService: Processing registration for:', userData.email);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Mock validation
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      if (!userData.name) {
        throw new Error('Name is required');
      }

      // Create mock user object
      const user = {
        id: Date.now(), // Use timestamp as mock ID
        email: userData.email,
        name: userData.name,
        isPremium: false,
        profile: {
          position: userData.position || 'Quarterback',
          experience: userData.experience || 'Beginner',
          team: userData.team || 'Independent'
        }
      };

      // Create mock token
      const token = 'mock_jwt_token_' + Date.now();

      // Store in memory and localStorage
      this.currentUser = user;
      this.token = token;
      this.isAuthenticated = true;

      localStorage.setItem('flagfit_user', JSON.stringify(user));
      localStorage.setItem('flagfit_token', token);
      localStorage.setItem('flagfit_auth', 'true');

      console.log('AuthService: Registration successful for user:', user.email);

      return {
        user,
        token,
        isAuthenticated: true
      };
    } catch (error) {
      console.error('AuthService: Registration failed:', error.message);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      // Check memory first
      if (this.currentUser && this.isAuthenticated) {
        return this.currentUser;
      }

      // Check localStorage
      const storedAuth = localStorage.getItem('flagfit_auth');
      const storedUser = localStorage.getItem('flagfit_user');
      const storedToken = localStorage.getItem('flagfit_token');

      if (storedAuth === 'true' && storedUser && storedToken) {
        const user = JSON.parse(storedUser);
        this.currentUser = user;
        this.token = storedToken;
        this.isAuthenticated = true;
        
        console.log('AuthService: Retrieved user from storage:', user.email);
        return user;
      }

      return null;
    } catch (error) {
      console.error('AuthService: Error getting current user:', error.message);
      return null;
    }
  }

  async logout() {
    try {
      console.log('AuthService: Processing logout');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Clear memory
      this.currentUser = null;
      this.token = null;
      this.isAuthenticated = false;

      // Clear localStorage
      localStorage.removeItem('flagfit_user');
      localStorage.removeItem('flagfit_token');
      localStorage.removeItem('flagfit_auth');

      console.log('AuthService: Logout successful');
    } catch (error) {
      console.error('AuthService: Logout error:', error.message);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      console.log('AuthService: Updating profile');
      
      if (!this.isAuthenticated || !this.currentUser) {
        throw new Error('User not authenticated');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update user object
      const updatedUser = {
        ...this.currentUser,
        ...profileData,
        profile: {
          ...this.currentUser.profile,
          ...profileData.profile
        }
      };

      // Store updated user
      this.currentUser = updatedUser;
      localStorage.setItem('flagfit_user', JSON.stringify(updatedUser));

      console.log('AuthService: Profile updated successfully');

      return {
        user: updatedUser,
        token: this.token,
        isAuthenticated: true
      };
    } catch (error) {
      console.error('AuthService: Profile update failed:', error.message);
      throw error;
    }
  }

  async refreshToken() {
    try {
      if (!this.isAuthenticated || !this.token) {
        throw new Error('No valid token to refresh');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create new mock token
      const newToken = 'mock_jwt_token_' + Date.now();
      this.token = newToken;
      localStorage.setItem('flagfit_token', newToken);

      console.log('AuthService: Token refreshed successfully');

      // Return user and new token
      return {
        user: this.currentUser,
        token: newToken,
        isAuthenticated: true
      };
    } catch (error) {
      console.error('AuthService: Token refresh failed:', error.message);
      throw error;
    }
  }

  // Utility methods
  isLoggedIn() {
    return this.isAuthenticated && this.currentUser && this.token;
  }

  getToken() {
    return this.token;
  }

  getUserId() {
    return this.currentUser?.id || null;
  }

  getUserEmail() {
    return this.currentUser?.email || null;
  }

  isPremiumUser() {
    return this.currentUser?.isPremium || false;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;