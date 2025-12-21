import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SponsorBanner from '../components/SponsorBanner';

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only log in development mode
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.log('🔍 Form submitted!', formData);

    setIsLoading(true);
    setError('');

    try {
      if (isDev) console.log('🔄 Starting login process...');

      // Basic validation
      if (!formData.email || !formData.password) {
        if (isDev) console.log('❌ Validation failed - missing fields');
        throw new Error('Please fill in all fields');
      }

      if (isDev) console.log('✅ Validation passed, simulating API call...');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isDev) console.log('📞 Calling onLogin function...');

      // Call the onLogin function from App.jsx
      if (onLogin) {
        if (isDev) console.log('✅ onLogin function exists, calling it...');
        onLogin(formData);
      } else {
        if (isDev) console.log('⚠️ onLogin function is undefined!');
      }

      if (isDev) console.log('🧭 Navigating to dashboard...');
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      if (isDev) console.log('❌ Error occurred:', err.message);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      if (isDev) console.log('🏁 Login process finished');
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-page">
      <div className="login-form">
        <h2>Welcome Back! 🏈</h2>
        <div>Ready to dominate today&apos;s training? (Hot Reload Test ✅)</div>
        
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
        
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} aria-label="Login form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={isLoading}
              aria-required="true"
              aria-invalid={error ? "true" : "false"}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              aria-required="true"
              aria-invalid={error ? "true" : "false"}
            />
          </div>
          
          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
            aria-label="Sign in to your account"
            aria-busy={isLoading}
            style={{
              cursor: 'pointer',
              backgroundColor: '#fff',
              border: '2px solid #333',
              padding: '12px',
              width: '100%',
              fontSize: '16px',
              fontWeight: 'bold',
              margin: '15px 0'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-options">
          <button
            className="social-login-btn"
            disabled={isLoading}
            aria-label="Sign in with biometric authentication"
          >
            🔐 Biometric Login
          </button>
          <button
            className="social-login-btn"
            disabled={isLoading}
            aria-label="Sign in with phone number"
          >
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
  );
};

export default LoginPage; 