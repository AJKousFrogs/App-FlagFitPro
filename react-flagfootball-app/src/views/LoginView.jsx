import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { usePocket } from '../contexts/PocketContext';
import LaprimafitLogo from '../assets/logos/laprimafit-correct.svg';
import ChemiusLogo from '../assets/logos/logo-chemius-header.png';
import GearxproLogo from '../assets/logos/gearxpro-original.png';

const LoginView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, clearError, isLoading, isDemoMode } = usePocket();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const loginAttemptRef = useRef(false);

  // Check for registration success message
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      if (location.state?.email) {
        setFormData(prev => ({ ...prev, email: location.state.email }));
      }
    }
  }, [location.state]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear auth error when user starts typing
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || isLoading || loginAttemptRef.current) {
      return;
    }
    
    loginAttemptRef.current = true;
    
    try {
      const result = await login(formData.email, formData.password);
      
      // Store credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      console.log('Login successful, redirecting to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      // Error is already handled by AuthContext and will show in UI
    } finally {
      loginAttemptRef.current = false;
    }
  };

  // Clear auth error when component mounts and load remembered email
  React.useEffect(() => {
    // Clear auth error only on mount
    clearError();
    
    // Load remembered email if available
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, [clearError]); // Include clearError in dependencies

  const handleDemoLogin = async () => {
    try {
      await login('demo@merlinsplaybook.com', 'demo123');
      navigate('/dashboard');
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {isDemoMode && (
          <div className="rounded-2xl bg-green-900/20 backdrop-blur-sm p-6 border-2 border-green-400/30 shadow-2xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-bold text-green-100">🎉 DEMO MODE ACTIVE - FINAL FIX v3</h3>
                <div className="mt-2 text-sm text-green-200">
                  <p className="font-semibold">✅ SUCCESS: Authentication completely bypassed!</p>
                  <p>🔑 Use ANY email/password combination to login</p>
                  <p className="text-xs text-green-300 mt-2 font-mono">Build: {new Date().toISOString()}</p>
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleDemoLogin}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md"
                  >
                    🚀 INSTANT DEMO ACCESS
                  </button>
                  <p className="text-xs text-green-300 text-center">No registration required!</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to {import.meta.env.VITE_APP_NAME || 'FlagFit Pro'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-2xl shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none relative block w-full px-4 py-3 border ${
                  errors.email
                    ? 'border-red-400 placeholder-red-400 text-white bg-red-900/20 focus:outline-none focus:ring-red-400 focus:border-red-400 focus:z-10 sm:text-sm'
                    : 'border-white/30 placeholder-gray-300 text-white bg-white/10 focus:outline-none focus:ring-blue-400 focus:border-blue-400 focus:z-10 sm:text-sm'
                } rounded-lg backdrop-blur-sm`}
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none relative block w-full px-4 py-3 border ${
                  errors.password
                    ? 'border-red-400 placeholder-red-400 text-white bg-red-900/20 focus:outline-none focus:ring-red-400 focus:border-red-400 focus:z-10 sm:text-sm'
                    : 'border-white/30 placeholder-gray-300 text-white bg-white/10 focus:outline-none focus:ring-blue-400 focus:border-blue-400 focus:z-10 sm:text-sm'
                } rounded-lg backdrop-blur-sm`}
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>
          </div>

          {successMessage && (
            <div className="rounded-2xl bg-green-900/20 backdrop-blur-sm border border-green-400/30 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-100">
                    <p>{successMessage}</p>
                  </h3>
                </div>
              </div>
            </div>
          )}

          {authError && (
            <div className="rounded-2xl bg-red-900/20 backdrop-blur-sm border border-red-400/30 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-100">
                    Authentication failed
                  </h3>
                  <div className="mt-2 text-sm text-red-200">
                    <p>{authError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-white/30 bg-white/10 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-6 border border-transparent text-sm font-bold rounded-xl text-white shadow-2xl backdrop-blur-sm transition-all duration-200 ${
                isLoading
                  ? 'bg-blue-400/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105'
              }`}
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        {/* Sponsors Section */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <p className="text-center text-xs text-gray-400 mb-4">
            Proudly sponsored by
          </p>
          <div className="flex justify-center items-center space-x-12">
            <a 
              href="https://www.laprimafit.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity duration-200 transform hover:scale-105"
            >
              <img 
                src={LaprimafitLogo} 
                alt="LaPrimaFit - Fitness & Wellness" 
                className="h-6 w-auto"
              />
            </a>
            <a 
              href="https://www.chemius.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity duration-200 transform hover:scale-105"
            >
              <img 
                src={ChemiusLogo} 
                alt="Chemius - Chemical Solutions" 
                className="h-6 w-auto"
              />
            </a>
            <a 
              href="https://gearxpro-sports.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity duration-200 transform hover:scale-105"
            >
              <img 
                src={GearxproLogo} 
                alt="GearXPro - Sports Equipment" 
                className="h-6 w-auto"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;