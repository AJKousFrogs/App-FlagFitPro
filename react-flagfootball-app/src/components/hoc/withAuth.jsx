import React, { memo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../LoadingSpinner';

/**
 * Higher-order component for authentication protection
 * Enterprise-grade authentication wrapper with role-based access
 */
const withAuth = (WrappedComponent, options = {}) => {
  const {
    roles = [], // Required roles to access this component
    permissions = [], // Required permissions to access this component
    redirectTo = '/login',
    requireEmailVerified = false,
    requireProfileComplete = false,
    loadingComponent: LoadingComponent = LoadingSpinner,
    fallbackComponent: FallbackComponent = null
  } = options;

  const AuthenticatedComponent = memo((props) => {
    const { 
      user, 
      isAuthenticated, 
      isLoading, 
      hasPermission, 
      isRole 
    } = useAuth();
    const location = useLocation();

    // Show loading while checking authentication
    if (isLoading) {
      return <LoadingComponent size="large" message="Verifying access..." />;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      return (
        <Navigate 
          to={redirectTo} 
          state={{ from: location.pathname }} 
          replace 
        />
      );
    }

    // Check role requirements
    if (roles.length > 0) {
      const hasRequiredRole = roles.some(role => isRole(role));
      if (!hasRequiredRole) {
        if (FallbackComponent) {
          return <FallbackComponent user={user} requiredRoles={roles} />;
        }
        return (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            margin: '20px'
          }}>
            <h3 style={{ color: '#856404' }}>Access Denied</h3>
            <p style={{ color: '#856404' }}>
              You don't have the required role to access this page.
            </p>
            <p style={{ color: '#856404', fontSize: '14px' }}>
              Required roles: {roles.join(', ')}
            </p>
          </div>
        );
      }
    }

    // Check permission requirements
    if (permissions.length > 0) {
      const hasRequiredPermissions = permissions.every(permission => 
        hasPermission(permission)
      );
      if (!hasRequiredPermissions) {
        if (FallbackComponent) {
          return <FallbackComponent user={user} requiredPermissions={permissions} />;
        }
        return (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            margin: '20px'
          }}>
            <h3 style={{ color: '#856404' }}>Insufficient Permissions</h3>
            <p style={{ color: '#856404' }}>
              You don't have the required permissions to access this page.
            </p>
            <p style={{ color: '#856404', fontSize: '14px' }}>
              Required permissions: {permissions.join(', ')}
            </p>
          </div>
        );
      }
    }

    // Check email verification requirement
    if (requireEmailVerified && !user?.emailVerified) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          background: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '4px',
          margin: '20px'
        }}>
          <h3 style={{ color: '#0c5460' }}>Email Verification Required</h3>
          <p style={{ color: '#0c5460' }}>
            Please verify your email address to access this page.
          </p>
          <button
            style={{
              padding: '8px 16px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '12px'
            }}
            onClick={() => {
              // Trigger email verification resend
              console.log('Resend verification email');
            }}
          >
            Resend Verification Email
          </button>
        </div>
      );
    }

    // Check profile completion requirement
    if (requireProfileComplete && !user?.profileComplete) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          background: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '4px',
          margin: '20px'
        }}>
          <h3 style={{ color: '#0c5460' }}>Complete Your Profile</h3>
          <p style={{ color: '#0c5460' }}>
            Please complete your profile to access this page.
          </p>
          <button
            style={{
              padding: '8px 16px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '12px'
            }}
            onClick={() => {
              // Navigate to profile completion
              window.location.href = '/profile/complete';
            }}
          >
            Complete Profile
          </button>
        </div>
      );
    }

    // All checks passed, render the wrapped component
    return <WrappedComponent {...props} user={user} />;
  });

  // Set display name for debugging
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthenticatedComponent;
};

// Utility function to create common auth HOCs
export const withAdminAuth = (Component) => withAuth(Component, {
  roles: ['admin'],
  redirectTo: '/login'
});

export const withUserAuth = (Component) => withAuth(Component, {
  roles: ['user', 'admin'],
  redirectTo: '/login'
});

export const withCoachAuth = (Component) => withAuth(Component, {
  roles: ['coach', 'admin'],
  redirectTo: '/login'
});

export const withVerifiedAuth = (Component) => withAuth(Component, {
  requireEmailVerified: true,
  redirectTo: '/login'
});

export const withCompleteProfileAuth = (Component) => withAuth(Component, {
  requireProfileComplete: true,
  requireEmailVerified: true,
  redirectTo: '/login'
});

// Permission-based HOCs
export const withTrainingAccess = (Component) => withAuth(Component, {
  permissions: ['training:read', 'training:write'],
  redirectTo: '/dashboard'
});

export const withAnalyticsAccess = (Component) => withAuth(Component, {
  permissions: ['analytics:read'],
  redirectTo: '/dashboard'
});

export const withTeamManagement = (Component) => withAuth(Component, {
  permissions: ['team:manage'],
  roles: ['coach', 'admin'],
  redirectTo: '/dashboard'
});

export default withAuth;