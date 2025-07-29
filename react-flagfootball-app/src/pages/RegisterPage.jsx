import React, { useState, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import MeasurementToggle from '../components/MeasurementToggle';
import MeasurementInput from '../components/MeasurementInput';
import SponsorBanner from '../components/SponsorBanner';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { 
  HomeIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const RegisterPage = memo(({ onRegister }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    team: 'Hawks',
    primaryPosition: 'QB',
    experience: 'Beginner',
    weight: 0,
    height: 0
  });
  const [validationErrors, setValidationErrors] = useState({});
  const { isLoading, error: authError, register } = useAuth();
  const navigate = useNavigate();

  // Client-side validation
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters long';
    }
    
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters long';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      // Prepare registration data
      const registrationData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'player',
        team: formData.team,
        position: formData.primaryPosition,
        experience: formData.experience,
        weight: formData.weight,
        height: formData.height
      };
      
      // Use the authentication context
      await register(registrationData);
      
      // Call the onRegister prop if provided (for backward compatibility)
      if (onRegister) {
        onRegister(registrationData);
      }
      
      // Navigate to dashboard on successful registration
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err.message);
      // Error is handled by the AuthContext
    }
  }, [formData, validateForm, register, onRegister, navigate]);

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

  const handleMeasurementChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  return (
    <ErrorBoundary>
      <div className="register-page">
        <div className="register-form">
        <h2 className="flex items-center gap-2">
          <HomeIcon className="h-6 w-6 text-blue-600" />
          Create Your Account
        </h2>
        <div>Join FlagFit Pro and start your training journey!</div>
        
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
        
        {/* Top Banner for Free Users */}
        <SponsorBanner 
          position="top" 
          size="wide" 
          isPremium={false}
                  sponsor={{
          name: 'LaprimaFit',
          logo: <UserGroupIcon className="h-6 w-6" />,
          message: 'Start your fitness journey with premium equipment',
          cta: 'Get Started',
          link: '#'
        }}
        />
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Team</label>
              <select
                name="team"
                value={formData.team}
                onChange={handleChange}
              >
                <option value="Hawks">Hawks</option>
                <option value="Eagles">Eagles</option>
                <option value="Lions">Lions</option>
                <option value="Bears">Bears</option>
              </select>
            </div>
            <div className="form-group">
              <label>Primary Position</label>
              <select
                name="primaryPosition"
                value={formData.primaryPosition}
                onChange={handleChange}
              >
                <option value="QB">Quarterback</option>
                <option value="WR">Wide Receiver</option>
                <option value="RB">Running Back</option>
                <option value="DB">Defensive Back</option>
                <option value="LB">Linebacker</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Experience Level</label>
            <select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
            >
              <option value="Beginner">Beginner (0-1 years)</option>
              <option value="Intermediate">Intermediate (1-3 years)</option>
              <option value="Advanced">Advanced (3+ years)</option>
            </select>
          </div>
          
          <div className="measurement-section">
            <h3>Physical Profile</h3>
            <MeasurementToggle />
            
            <div className="measurement-inputs">
              <div className="form-group">
                <label>Height</label>
                <MeasurementInput
                  type="height"
                  value={formData.height}
                  onChange={(value) => handleMeasurementChange('height', value)}
                  placeholder="Enter height"
                />
              </div>
              
              <div className="form-group">
                <label>Weight</label>
                <MeasurementInput
                  type="weight"
                  value={formData.weight}
                  onChange={(value) => handleMeasurementChange('weight', value)}
                  placeholder="Enter weight"
                />
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="create-account-btn"
            disabled={isLoading}
            style={{
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="register-links">
          <span>Already have an account? </span>
          <Link to="/login">Sign In</Link>
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

RegisterPage.displayName = 'RegisterPage';

RegisterPage.propTypes = {
  onRegister: PropTypes.func
};

export default RegisterPage; 