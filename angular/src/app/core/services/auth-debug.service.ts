import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { SupabaseService } from './supabase.service';

/**
 * Authentication Debug Service
 * Provides utilities for debugging authentication issues
 */
@Injectable({
  providedIn: 'root'
})
export class AuthDebugService {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);

  /**
   * Check authentication status and log detailed information
   */
  async checkAuthStatus(): Promise<void> {
    const session = this.supabase.getSession();
    const user = this.supabase.getCurrentUser();

    this.logger.info('=== Authentication Status ===');
    this.logger.info('User:', user ? { id: user.id, email: user.email } : 'Not authenticated');
    this.logger.info('Session:', session ? {
      expires_at: session.expires_at,
      expires_in: session.expires_at ? Math.floor((session.expires_at - Date.now() / 1000)) : 'N/A',
      user_id: session.user?.id,
    } : 'No session');

    // Check token validity
    if (session?.access_token) {
      try {
        const payload = this.parseJwt(session.access_token);
        this.logger.info('Token payload:', {
          exp: payload.exp,
          iat: payload.iat,
          sub: payload.sub,
          role: payload.role,
          expires_in_seconds: payload.exp ? (payload.exp - Math.floor(Date.now() / 1000)) : 'N/A'
        });

        // Check if token is expired
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          this.logger.warn('⚠️ Token is EXPIRED!');
          this.logger.info('Attempting to refresh session...');
          await this.refreshSession();
        } else if (payload.exp && (payload.exp - Math.floor(Date.now() / 1000)) < 300) {
          this.logger.warn('⚠️ Token expires in less than 5 minutes');
        } else {
          this.logger.info('✅ Token is valid');
        }
      } catch (error) {
        this.logger.error('Failed to parse JWT token:', error);
      }
    } else {
      this.logger.warn('⚠️ No access token available');
    }

    // Test a simple authenticated query
    if (user) {
      await this.testAuthenticatedQuery(user.id);
    }

    this.logger.info('==============================');
  }

  /**
   * Test an authenticated query to verify RLS is working
   */
  private async testAuthenticatedQuery(userId: string): Promise<void> {
    try {
      this.logger.info('Testing authenticated query...');
      const { data, error } = await this.supabase.client
        .from('users')
        .select('id, email')
        .eq('id', userId)
        .single();

      if (error) {
        this.logger.error('❌ Authenticated query failed:', error);
        if (error.code === 'PGRST301') {
          this.logger.error('JWT token is invalid or expired');
        } else if (error.code === '42501') {
          this.logger.error('RLS policy denied access');
        }
      } else {
        this.logger.info('✅ Authenticated query successful:', data);
      }
    } catch (error) {
      this.logger.error('❌ Exception during authenticated query:', error);
    }
  }

  /**
   * Refresh the current session
   */
  private async refreshSession(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client.auth.refreshSession();
      if (error) {
        this.logger.error('Failed to refresh session:', error);
      } else {
        this.logger.info('✅ Session refreshed successfully');
        this.logger.info('New token expires at:', data.session?.expires_at);
      }
    } catch (error) {
      this.logger.error('Exception during session refresh:', error);
    }
  }

  /**
   * Parse JWT token payload
   */
  private parseJwt(token: string): { exp?: number; iat?: number; sub?: string; role?: string; [key: string]: unknown } {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }

  /**
   * Force re-authenticate (for testing)
   */
  async forceReauthenticate(): Promise<void> {
    this.logger.info('Force re-authenticating...');
    const { data, error } = await this.supabase.client.auth.getSession();
    
    if (error) {
      this.logger.error('Failed to get session:', error);
      return;
    }

    if (data.session) {
      this.logger.info('Current session found, refreshing...');
      await this.refreshSession();
    } else {
      this.logger.warn('No session found - user needs to log in');
    }
  }
}
