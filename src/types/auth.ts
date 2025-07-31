// auth.ts - TypeScript interfaces for authentication system
// Addresses type safety improvements from code review

export interface User {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  profileComplete: boolean;
  avatar?: string;
  preferences?: UserPreferences;
}

export type UserRole = 'player' | 'coach' | 'parent' | 'admin';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  measurementUnit: 'metric' | 'imperial';
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  trainingReminders: boolean;
  gameAlerts: boolean;
  teamUpdates: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  message: string;
  sessionExpiresAt?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: UserRole;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
}

export interface RegisterResponse {
  success: boolean;
  user: Partial<User>;
  message: string;
  verificationRequired?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpiresAt: string | null;
  lastActivity: string | null;
}

export interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  register: (userData: RegisterRequest) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  refreshSession: () => Promise<boolean>;
  updateUser: (updates: Partial<User>) => Promise<User>;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// Onboarding related types
export interface OnboardingData {
  step: number;
  totalSteps: number;
  completed: boolean;
  data: OnboardingStepData;
}

export interface OnboardingStepData {
  // Step 1: Basic Info
  role?: UserRole;
  primaryPosition?: Position;
  experience?: ExperienceLevel;
  
  // Step 2: Physical Profile
  height?: string;
  weight?: string;
  age?: number;
  
  // Step 3: Goals
  trainingGoals?: TrainingGoal[];
  trainingFrequency?: TrainingFrequency;
  
  // Step 4: Preferences
  notifications?: NotificationPreferences;
}

export type Position = 'QB' | 'WR' | 'RB' | 'DB' | 'LB' | 'C';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export type TrainingGoal = 
  | 'Improve Speed'
  | 'Build Strength'
  | 'Master Position Skills'
  | 'Team Chemistry'
  | 'Injury Prevention'
  | 'Endurance'
  | 'Agility'
  | 'Mental Performance';

export type TrainingFrequency = '2-3' | '4-5' | '6-7' | 'daily';

// Security related types
export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  passwordMinLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
  requireLowercase: boolean;
}

export interface RateLimitInfo {
  identifier: string;
  attempts: number;
  lastAttempt: number;
  lockedUntil: number;
  isLocked: boolean;
}

export interface CSRFToken {
  token: string;
  expiresAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: AuthError;
  errors?: ValidationError[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Event types for custom events
export interface SessionWarningEvent extends CustomEvent {
  detail: {
    remainingTime: number;
  };
}

export interface SessionTimeoutEvent extends CustomEvent {
  detail: {
    reason: 'timeout' | 'inactivity' | 'server';
  };
}

// Form component prop types
export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  autoComplete?: string;
}

export interface FormProps {
  onSubmit: (data: any) => Promise<void> | void;
  loading?: boolean;
  errors?: FormErrors;
  className?: string;
  children: React.ReactNode;
}

// Error boundary types
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  retryCount: number;
  showDetails: boolean;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    retry: () => void;
    eventId: string;
    retryCount: number;
  }>;
  level?: 'app' | 'route' | 'component';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Service types
export interface AuthServiceConfig {
  baseURL: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export interface SecureRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Component prop types with children
export interface WithChildren {
  children: React.ReactNode;
}

// HOC types
export type ComponentWithErrorBoundary<P = {}> = React.ComponentType<P>;

export interface WithErrorBoundaryOptions {
  fallback?: React.ComponentType<any>;
  level?: 'app' | 'route' | 'component';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}