import React, { useState, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SponsorBanner from '../components/SponsorBanner';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

const LoginPage = memo(({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const { isLoading, error: authError, login } = useAuth();
  const navigate = useNavigate();

  // Client-side validation
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 3) {
      errors.password = 'Password must be at least 3 characters long';
    }
    
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      // Use the authentication context
      await login(formData);
      
      // Call the onLogin prop if provided (for backward compatibility)
      if (onLogin) {
        onLogin(formData);
      }
      
      // Navigate to dashboard on successful login
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err.message);
      // Error is handled by the AuthContext
    }
  }, [formData, validateForm, login, onLogin, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validationErrors]);

  return (
    <ErrorBoundary>
      <div className="login-page">
        <div className="login-form">
        <h2>Welcome Back! 🏈</h2>
        <div>Ready to dominate today&apos;s training?</div>
        
        {/* Top Banner for Free Users */}
        <SponsorBanner 
          position="top" 
          size="wide" 
          isPremium={false}
          sponsor={{
            name: 'LaprimaFit',
            logo: '💪',
            message: 'Start your fitness journey with premium equipment',
            cta: 'Get Started',
            link: '#'
          }}
        />
        
        {authError && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {authError}
          </div>
        )}
        
        {Object.keys(validationErrors).length > 0 && (
          <div className="validation-errors" style={{ color: 'red', marginBottom: '1rem' }}>
            {Object.values(validationErrors).map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={isLoading}
              className={validationErrors.email ? 'input-error' : ''}
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? 'email-error' : undefined}
            />
            {validationErrors.email && (
              <div id="email-error" className="field-error" style={{ color: 'red', fontSize: '14px' }}>
                {validationErrors.email}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              className={validationErrors.password ? 'input-error' : ''}
              aria-invalid={!!validationErrors.password}
              aria-describedby={validationErrors.password ? 'password-error' : undefined}
            />
            {validationErrors.password && (
              <div id="password-error" className="field-error" style={{ color: 'red', fontSize: '14px' }}>
                {validationErrors.password}
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
            style={{
              cursor: isLoading ? 'not-allowed' : 'pointer',
              backgroundColor: isLoading ? '#ccc' : '#fff',
              border: '2px solid #333',
              padding: '12px',
              width: '100%',
              fontSize: '16px',
              fontWeight: 'bold',
              margin: '15px 0',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-options">
          <button className="social-login-btn" disabled={isLoading}>
            🔐 Biometric Login
          </button>
          <button className="social-login-btn" disabled={isLoading}>
            📱 Continue with Phone
          </button>
        </div>
        
        <div className="login-links">
          <Link to="/forgot-password">Forgot Password?</Link>
          <span>Don&apos;t have an account? </span>
          <Link to="/register">Create Account</Link>
        </div>
        
        {/* Sponsor Logos Section */}
        <div className="sponsor-section">
          <h3>Powered by our sponsors</h3>
          <div className="sponsor-grid">
            <div className="sponsor-logo">GearXPro</div>
            <div className="sponsor-logo">LaprimaFit</div>
            <div className="sponsor-logo">Chemius</div>
          </div>
        </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

LoginPage.displayName = 'LoginPage';

LoginPage.propTypes = {
  onLogin: PropTypes.func
};

export default LoginPage; 