import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import { authService } from '../services/AuthService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState([]);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    try {
      // Use AuthService for registration
      const response = await authService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      
      console.log('Registration successful:', response);
      
      // Navigate to onboarding or login based on email verification requirement
      if (response.verificationRequired) {
        navigate('/verify-email', { state: { email: formData.email } });
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      // Handle specific registration errors
      if (err.message.includes('already exists')) {
        setErrors({ email: 'An account with this email already exists. Please sign in instead.' });
      } else if (err.message.includes('Password must')) {
        setErrors({ password: err.message });
      } else if (err.message.includes('Passwords do not match')) {
        setErrors({ confirmPassword: err.message });
      } else if (err.message.includes('Full name must')) {
        setErrors({ fullName: err.message });
      } else {
        setErrors({ general: err.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Show password strength feedback
    if (name === 'password') {
      // Basic password validation
      const errors = [];
      if (value.length < 8) errors.push('Password must be at least 8 characters');
      if (!/[A-Z]/.test(value)) errors.push('Password must contain uppercase letter');
      if (!/[a-z]/.test(value)) errors.push('Password must contain lowercase letter');
      if (!/[0-9]/.test(value)) errors.push('Password must contain number');
      setPasswordStrength(errors);
    }
  };

  const handleGitHubLogin = () => {
    // Implement GitHub OAuth login
    console.log('GitHub login triggered');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Sign up
          </h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          {/* Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">
                {errors.general}
              </p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your name"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                  errors.fullName 
                    ? "border-red-300 focus:border-red-500" 
                    : "border-gray-300 focus:border-blue-500"
                )}
                disabled={isLoading}
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="text-red-600 text-sm">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                  errors.email 
                    ? "border-red-300 focus:border-red-500" 
                    : "border-gray-300 focus:border-blue-500"
                )}
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-600 text-sm">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password (min 12 characters)"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                  errors.password 
                    ? "border-red-300 focus:border-red-500" 
                    : "border-gray-300 focus:border-blue-500"
                )}
                disabled={isLoading}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-red-600 text-sm">{errors.password}</p>
              )}
              {/* Password strength indicator */}
              {formData.password && passwordStrength.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Password requirements:</h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {passwordStrength.map((error, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="text-red-500">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {formData.password && passwordStrength.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <p className="text-sm text-green-700 flex items-center gap-1">
                    <span className="text-green-500">✓</span>
                    Password meets all requirements
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                  errors.confirmPassword 
                    ? "border-red-300 focus:border-red-500" 
                    : "border-gray-300 focus:border-blue-500"
                )}
                disabled={isLoading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm">{errors.confirmPassword}</p>
              )}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-red-600 text-sm">Passwords do not match</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                <p className="text-green-600 text-sm flex items-center gap-1">
                  <span className="text-green-500">✓</span>
                  Passwords match
                </p>
              )}
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* GitHub Login */}
          <button
            type="button"
            className="w-full border border-gray-300 py-3 rounded-lg hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50"
            onClick={handleGitHubLogin}
            disabled={isLoading}
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              <span>Continue with GitHub</span>
            </div>
          </button>

          {/* Footer Links */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 