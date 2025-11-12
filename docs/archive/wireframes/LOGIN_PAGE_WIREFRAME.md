# Login Page Wireframe Documentation

## Status: 🚧 UPDATING FOR COMPREHENSIVE DASHBOARD

## Page Overview

The login page provides secure authentication for both players and coaches, with enhanced UX features including password recovery, social login options, biometric authentication, and sponsor logo visibility.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] MERLINS PLAYBOOK [Theme Toggle] [Avatar Menu]                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [Sponsor Logo Placeholder] [Sponsor Logo Placeholder] [Sponsor Logo Placeholder] │ │
│ │ (Official Partners of FlagFit Pro)                                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │                    Welcome Back! 🏈                            │   │ │
│ │  │              Ready to dominate today's training?                │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ Role: [Auto-Detect ▼]                                           │   │ │
│ │  │ Detected: Player (QB/WR) - Hawks Team                           │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ Email Address                                                   │   │ │
│ │  │ [alex.rivera@email.com                    ] [✓]                 │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ Password                                                        │   │ │
│ │  │ [••••••••••••••••••••••••••••••••••••••••] [👁️] [✓]           │   │ │
│ │  │ Password strength: ████████████████████████████████████████████ │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ [✓] Remember me for 30 days                                    │   │ │
│ │  │ [Forgot Password?]                                              │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ [🔐 Login with Email]                                           │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ ──────────────── or ────────────────                            │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ [Google] [Apple] [Facebook]                                     │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ [👆 Touch ID / Face ID Login]                                   │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ Quick Stats Preview                                             │   │ │
│ │  ├─────────────────────────────────────────────────────────────────┤   │ │
│ │  │ Last Login: 2 hours ago                                         │   │ │
│ │  │ Training Streak: 5 days 🔥                                      │   │ │
│ │  │ Next Game: Tomorrow vs Eagles                                   │   │ │
│ │  │ Team Chemistry: 87% ⭐                                          │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ [Create Account]                                                │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Updates Made

### Critical Missing Elements Addressed

1. **Password Recovery System**: Added "Forgot Password?" link prominently below password field
2. **Enhanced Authentication Options**: Added social login (Google, Apple, Facebook) and biometric authentication
3. **Password Visibility Toggle**: Added eye icon to show/hide password
4. **Password Strength Indicator**: Real-time password strength visualization

### UX Improvements Implemented

1. **Personalized Welcome Message**: Dynamic greeting based on user role and team
2. **Role Auto-Detection**: Smart detection of user role with manual override option
3. **Quick Stats Preview**: Shows relevant user data without requiring full login
4. **Remember Me Option**: 30-day session persistence for convenience
5. **Social Login Integration**: Faster access for returning users
6. **Biometric Authentication**: Touch ID/Face ID for mobile users

### Enhanced Security Features

1. **Password Strength Validation**: Real-time feedback on password security
2. **Multi-Factor Authentication Ready**: Framework for future 2FA implementation
3. **Session Management**: Secure remember me functionality
4. **Social Login Security**: OAuth integration with major providers

## Technical Implementation Notes

### Authentication Flow

```javascript
// Enhanced login flow with multiple authentication methods
const loginMethods = {
  email: async (email, password) => {
    // Traditional email/password authentication
    const user = await authService.login(email, password);
    return user;
  },
  social: async (provider) => {
    // OAuth social login
    const user = await authService.socialLogin(provider);
    return user;
  },
  biometric: async () => {
    // Biometric authentication
    const user = await authService.biometricLogin();
    return user;
  },
};
```

### Password Recovery Integration

```javascript
// Password recovery flow
const handleForgotPassword = async (email) => {
  await authService.sendPasswordReset(email);
  // Redirect to password reset page
};
```

### Role Detection Logic

```javascript
// Smart role detection based on email/previous sessions
const detectUserRole = (email) => {
  const user = getUserFromCache(email);
  if (user) {
    return {
      role: user.role,
      position: user.primaryPosition,
      team: user.team,
    };
  }
  return null;
};
```

## User Experience Features

### Progressive Enhancement

- **Primary**: Email/password login (works everywhere)
- **Secondary**: Social login (faster for returning users)
- **Tertiary**: Biometric login (convenient for mobile)

### Accessibility Features

- High contrast mode support
- Screen reader compatibility
- Keyboard navigation support
- Voice input capabilities

### Error Handling

- Clear error messages for invalid credentials
- Account lockout prevention
- Rate limiting for security
- Helpful recovery suggestions

## Integration Points

### Database Schema Updates

```sql
-- Enhanced user authentication table
ALTER TABLE users ADD COLUMN auth_method VARCHAR(20) DEFAULT 'email';
ALTER TABLE users ADD COLUMN social_provider VARCHAR(20);
ALTER TABLE users ADD COLUMN social_id VARCHAR(255);
ALTER TABLE users ADD COLUMN biometric_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN login_streak INTEGER DEFAULT 0;
```

### Service Layer Integration

- `authService.login()` - Enhanced with multiple methods
- `authService.socialLogin()` - OAuth integration
- `authService.biometricLogin()` - Biometric authentication
- `authService.forgotPassword()` - Password recovery
- `userService.getQuickStats()` - Pre-login stats preview

### Context Integration

- `AuthContext` - Enhanced with role detection
- `ThemeContext` - Dark/light mode toggle
- `AnalyticsContext` - Login method tracking

## Security Considerations

### Data Protection

- All passwords hashed with bcrypt
- Social login tokens encrypted
- Biometric data never stored (device-only)
- Session tokens with expiration

### Privacy Compliance

- GDPR-compliant data collection
- Clear privacy policy links
- User consent for biometric data
- Social login data minimization

## Performance Optimizations

### Loading States

- Skeleton loading for stats preview
- Progressive image loading
- Lazy loading of social login buttons
- Cached role detection

### Offline Support

- Basic login form works offline
- Cached authentication state
- Offline biometric authentication
- Graceful degradation for social login
