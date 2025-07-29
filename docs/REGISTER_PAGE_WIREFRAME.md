# Register Page Wireframe Documentation

## Status: 🚧 UPDATING FOR COMPREHENSIVE DASHBOARD

## Overview
The registration page provides a secure, legally compliant, and user-friendly account creation process, including email verification, legal agreement checkboxes, and a two-step flow. Sponsor logos are always visible for revenue and partnership recognition.

## Wireframe Layout

### Header Section
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] MERLINS PLAYBOOK [Theme Toggle] [Accessibility Menu] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sponsor Section
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Sponsor Logo Placeholder] [Sponsor Logo Placeholder] [Sponsor Logo Placeholder] │
│ (Official Partners of FlagFit Pro)                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Basic Information
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Create Your Account │
│ │ Step 1 of 2: Basic Information │
│ │ [████████████████████████████████████████████████████████████████] │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ First Name │
│ │ [Alex] │
│ │ │
│ │ Last Name │
│ │ [Rivera] │
│ │ │
│ │ Email Address │
│ │ [alex.rivera@email.com] [Send Verification Email] │
│ │ [✓] Email verified │
│ │ │
│ │ Password │
│ │ [••••••••••••••••] [👁️ Show] │
│ │ Password Strength: [████████████████████████████████████████████████████████████████] Strong │
│ │ Confirm Password │
│ │ [••••••••••••••••] [👁️ Show] │
│ │ Date of Birth │
│ │ [MM/DD/YYYY] (Must be 18+) │
│ │ │
│ │ [Next Step] │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Already have an account? [Login] │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Preferences & Legal
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Complete Your Profile │
│ │ Step 2 of 2: Preferences & Legal │
│ │ [████████████████████████████████████████████████████████████████] │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Role Selection │
│ │ [Player] [Coach] [Video Analyst] │
│ │ │
│ │ Position Configuration (Players Only) │
│ │ Primary Position: [QB ▼] │
│ │ Secondary 1: [WR ▼] │
│ │ Secondary 2: [Center ▼] │
│ │ Available: QB, WR, Center, DB │
│ │ │
│ │ Experience Level │
│ │ [Beginner] [Intermediate] [Advanced] [Professional] │
│ │ │
│ │ Training Goals │
│ │ [Improve Speed] [Build Strength] [Master Position] [Team Chemistry] │
│ │ │
│ │ Communication Preferences │
│ │ [✓] Email notifications │
│ │ [✓] Push notifications │
│ │ [✓] SMS for urgent updates │
│ │ │
│ │ Legal Agreements │
│ │ [ ] I agree to the Terms of Service [View] │
│ │ [ ] I agree to the Privacy Policy [View] │
│ │ [ ] I am 18 years or older │
│ │ │
│ │ [Create Account] │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [Back to Step 1] │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Email Verification Modal
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Verify Your Email │
│ │ │
│ │ We've sent a verification link to: │
│ │ alex.rivera@email.com │
│ │ │
│ │ Please check your email and click the verification link to continue. │
│ │ [Resend Email] [Change Email] [Continue Anyway] │
│ │ Didn't receive the email? Check your spam folder. │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error States
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ❌ Registration Error │
│ • Email already exists │
│ • Password doesn't meet requirements │
│ • Age verification failed (must be 18+) │
│ • Terms of Service not accepted │
│ [Try Again] [Contact Support] │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Updates Made

### Critical Missing Elements Addressed
1. **Email Verification Process**: Added email verification step with resend functionality
2. **Terms of Service and Privacy Policy**: Mandatory legal agreement checkboxes with links
3. **Age Verification**: Explicit 18+ requirement for flag football

### UX Improvements Implemented
1. **Enhanced Registration Flow**:
   - Split into two logical steps: Basic Info → Preferences & Legal
   - Real-time email verification with status indicator
   - Password strength indicator with visual feedback
   - Password visibility toggles for both fields
2. **Legal Compliance**:
   - Clear terms of service and privacy policy links
   - Explicit age verification checkbox

## Technical Implementation Notes

### Registration Flow
- **Step 1**: Basic information with email verification
- **Step 2**: Role-specific preferences and legal agreements
- **Validation**: Real-time field validation with error feedback
- **Security**: Password strength requirements and age verification

### Security Features
- Email verification before account activation
- Password strength validation (minimum 8 characters, mixed case, numbers, symbols)
- Age verification for 18+ requirement
- Terms acceptance tracking

### Integration Points
- **AuthContext**: User registration and verification
- **EmailService**: Verification email sending
- **ValidationService**: Real-time form validation
- **AnalyticsContext**: Registration funnel tracking 